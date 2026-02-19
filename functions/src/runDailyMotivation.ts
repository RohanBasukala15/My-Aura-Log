import * as admin from "firebase-admin";
import { DateTime } from "luxon";
import OpenAI from "openai";
import type { Firestore } from "firebase-admin/firestore";

export type UserDocument = {
    fcmToken?: string | null;
    motivationNotificationsEnabled?: boolean;
    timezone?: string;
    notificationTime?: string;
    lastMotivationSentAt?: FirebaseFirestore.Timestamp | null;
    isPremium?: boolean;
};

export type QuoteDocument = {
    text: string;
    author?: string;
    lastSentDate?: FirebaseFirestore.Timestamp | null;
};

const USERS_COLLECTION = "users";
const QUOTES_COLLECTION = "motivationalQuotes";
const DEFAULT_NOTIFICATION_TIME = "09:00";


function getTargetHourMinute(notificationTime: string | undefined): { hour: number; minute: number } {
    const raw = (notificationTime ?? DEFAULT_NOTIFICATION_TIME).trim();
    const parts = raw.split(":");
    const hour = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 9));
    const rawMinute = parts[1] != null ? Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0)) : 0;
    const minute = (Math.round(rawMinute / 15) * 15) % 60;
    return { hour, minute };
}

export function shouldSendToUser(user: UserDocument, nowUtc: DateTime): boolean {
    const timezone = user.timezone ?? "UTC";
    const userTime = nowUtc.setZone(timezone);
    const { hour: targetHour, minute: targetMinute } = getTargetHourMinute(user.notificationTime ?? DEFAULT_NOTIFICATION_TIME);

    // Round current time to same 15-min buckets as scheduler (:00, :15, :30, :45) so we match even if the run is at :31
    const userMinuteRounded = (Math.round(userTime.minute / 15) * 15) % 60;
    if (userTime.hour !== targetHour || userMinuteRounded !== targetMinute) {
        return false;
    }

    const lastSent = user.lastMotivationSentAt?.toDate();
    if (!lastSent) {
        return true;
    }

    const lastSentUserTime = DateTime.fromJSDate(lastSent).setZone(timezone);
    return !lastSentUserTime.hasSame(userTime, "day");
}


async function pickStaticQuote(db: Firestore): Promise<{ id: string; data: QuoteDocument } | null> {
    // Prefer quote with oldest lastSentDate (round-robin). Documents without lastSentDate
    // are excluded by this query, so we fall back to any document for legacy/new quotes.
    const ordered = await db
        .collection(QUOTES_COLLECTION)
        .orderBy("lastSentDate", "asc")
        .limit(1)
        .get();

    if (!ordered.empty) {
        const doc = ordered.docs[0];
        return { id: doc.id, data: doc.data() as QuoteDocument };
    }

    const anyDoc = await db.collection(QUOTES_COLLECTION).limit(1).get();
    if (anyDoc.empty) return null;

    const doc = anyDoc.docs[0];
    return { id: doc.id, data: doc.data() as QuoteDocument };
}

const QUOTE_THEMES = [
    "calm and inner peace",
    "mindfulness and being present",
    "self-compassion and kindness to yourself",
    "gratitude and noticing the good",
    "small steps and progress",
    "rest and gentle pace",
    "courage to show up as you are",
    "letting go of perfectionism",
    "resilience without forcing",
    "quiet strength",
    "breathing and grounding",
    "accepting today as it is",
    "hope without toxic positivity",
    "starting fresh without judgment",
];

const QUOTE_ANGLES = [
    "for someone starting their day",
    "for someone who needs a gentle nudge",
    "for a moment of pause",
    "for someone feeling overwhelmed",
    "for someone learning to go slow",
    "for someone building a small habit",
    "for someone who needs to hear they're enough",
    "for a mindful check-in",
];

function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)] ?? arr[0];
}

export type AIQuoteResult = { text: string; author?: string };

export async function generateOpenAIQuote(apiKey: string): Promise<AIQuoteResult> {
    if (!apiKey) return { text: "" };
    try {
        const theme = pick(QUOTE_THEMES);
        const angle = pick(QUOTE_ANGLES);

        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a thoughtful writer of short, uplifting lines. Rules:
- Reply with ONE line only. No quotation marks, no preamble.
- Maximum 15 words for the quote. Plain text.
- If the line is from a known person (author, philosopher, etc.), add a space, then an em dash, then the author name at the end. Example: "Peace begins with a smile. — Mother Teresa"
- If it's your own original line or the author is unknown, give only the line with no attribution.
- Sound fresh and genuine—avoid overused clichés.
- Favor calm, mindful, gentle motivation. No hustle culture. Preserve calm and self-compassion.`,
                },
                {
                    role: "user",
                    content: `Write one short, calming motivational line about ${theme}, ${angle}. Unique phrasing. Include author at the end with " — Name" only if it's a known quote.`,
                },
            ],
            temperature: 0.95,
            max_tokens: 80,
        });

        const raw = response.choices[0]?.message?.content?.trim() ?? "";
        const dash = " — ";
        const idx = raw.lastIndexOf(dash);
        if (idx !== -1) {
            const text = raw.slice(0, idx).trim();
            const author = raw.slice(idx + dash.length).trim();
            if (text && author) return { text, author };
        }
        return { text: raw, author: undefined };
    } catch {
        return { text: "" };
    }
}

export type RunDailyMotivationOptions = {
    /** When true, send to all opted-in users with FCM token now (ignore time & lastSent). */
    testMode?: boolean;
    /** Optional logger (e.g. functions.logger for Cloud, console for local). */
    logger?: { info: (msg: string) => void; warn: (msg: string, err?: unknown) => void };
};

/**
 * Core logic: query opted-in users, build quote, send FCM, update Firestore.
 * Used by the scheduled job and by the test trigger (HTTP + local script).
 */
export async function runDailyMotivation(
    db: Firestore,
    apiKey: string,
    options: RunDailyMotivationOptions = {}
): Promise<{ sentCount: number }> {
    const { testMode = false, logger = console } = options;
    const nowUtc = DateTime.utc();

    const userSnapshot = await db
        .collection(USERS_COLLECTION)
        .where("motivationNotificationsEnabled", "==", true)
        .get();

    if (userSnapshot.empty) {
        logger.info("No users opted in for motivation notifications.");
        return { sentCount: 0 };
    }

    const staticQuote = await pickStaticQuote(db);
    const messaging = admin.messaging();
    const usersToUpdate: Array<{ ref: FirebaseFirestore.DocumentReference; usedStaticQuoteId?: string }> = [];
    const sendPromises: Array<Promise<unknown>> = [];

    for (const docSnapshot of userSnapshot.docs) {
        const userData = docSnapshot.data() as UserDocument;
        const token = userData.fcmToken;
        if (!token || typeof token !== "string" || token.length < 50) continue;

        if (!testMode && !shouldSendToUser(userData, nowUtc)) continue;

        let body;
        let usedStaticQuoteId: string | undefined;

        if (userData.isPremium) {
            const aiQuote = await generateOpenAIQuote(apiKey);
            if (aiQuote.text) {
                body = aiQuote.author
                    ? `${aiQuote.text} — ${aiQuote.author}`
                    : `${aiQuote.text}`;
            } else if (staticQuote) {
                const quoteText = staticQuote.data.author
                    ? `${staticQuote.data.text} — ${staticQuote.data.author}`
                    : staticQuote.data.text;
                body = `${quoteText}`;
                usedStaticQuoteId = staticQuote.id;
            }
        } else if (staticQuote) {
            const quoteText = staticQuote.data.author
                ? `${staticQuote.data.text} — ${staticQuote.data.author}`
                : staticQuote.data.text;
            body = `${quoteText}`;
            usedStaticQuoteId = staticQuote.id;
        }

        usersToUpdate.push({ ref: docSnapshot.ref, usedStaticQuoteId });
        sendPromises.push(
            messaging
                .send({
                    token,
                    notification: {
                        title: testMode ? "Test: Daily Aura Check-In ✨" : "Daily Aura Check-In ✨",
                        body,
                    },
                })
                .catch((err: { code?: string }) => {
                    logger.warn("Failed to send to token", err?.code ?? err);
                    if (
                        err?.code === "messaging/invalid-registration-token" ||
                        err?.code === "messaging/registration-token-not-registered" ||
                        err?.code === "messaging/invalid-argument"
                    ) {
                        return docSnapshot.ref.update({
                            fcmToken: admin.firestore.FieldValue.delete(),
                        });
                    }
                })
        );
    }

    await Promise.all(sendPromises);

    const batch = db.batch();
    const nowTimestamp = admin.firestore.FieldValue.serverTimestamp();
    const staticQuoteIdUpdated = new Set<string>();

    for (const { ref, usedStaticQuoteId } of usersToUpdate) {
        batch.update(ref, { lastMotivationSentAt: nowTimestamp });
        if (usedStaticQuoteId && !staticQuoteIdUpdated.has(usedStaticQuoteId)) {
            batch.update(db.collection(QUOTES_COLLECTION).doc(usedStaticQuoteId), {
                lastSentDate: nowTimestamp,
            });
            staticQuoteIdUpdated.add(usedStaticQuoteId);
        }
    }

    await batch.commit();
    if (usersToUpdate.length > 0) {
        logger.info(`Sent daily motivation to ${usersToUpdate.length} users.`);
    } else {
        const withToken = userSnapshot.docs.filter(
            (d) => (d.data() as UserDocument).fcmToken && String((d.data() as UserDocument).fcmToken).length >= 50
        ).length;
        logger.info(
            `Scheduled run: ${userSnapshot.size} opted-in, ${withToken} with FCM token; 0 in current time window. ` +
                `(Reminder only sends at the user's chosen time, e.g. 09:00 in their timezone.)`
        );
    }
    return { sentCount: usersToUpdate.length };
}
