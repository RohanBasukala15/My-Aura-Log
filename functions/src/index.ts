import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { DateTime } from "luxon";
import OpenAI from "openai";
import { defineString } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";

const openaiApiKey = defineString("OPENAI_API_KEY", { default: "" });

type UserDocument = {
    fcmToken?: string | null;
    motivationNotificationsEnabled?: boolean;
    timezone?: string;
    notificationTime?: string; // "HH:mm" – user's preferred daily reminder time
    lastMotivationSentAt?: FirebaseFirestore.Timestamp | null;
    isPremium?: boolean;
};

type QuoteDocument = {
    text: string;
    author?: string;
    lastSentDate?: FirebaseFirestore.Timestamp | null;
};

const USERS_COLLECTION = "users";
const QUOTES_COLLECTION = "motivationalQuotes";
const DEFAULT_NOTIFICATION_TIME = "09:00";

const REMINDER_MESSAGES = [
    "Take a mindful pause and capture today's mood in your journal.",
    "Time to check in with yourself and log your aura for today.",
    "Your daily moment of reflection awaits—how are you feeling?",
    "Ready to capture today's energy? Your journal is waiting.",
    "Today's mood deserves a note.",
];

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/** Cron runs every 15 min; we round user's preferred time to nearest 0/15/30/45. */
function getTargetHourMinute(notificationTime: string | undefined): { hour: number; minute: number } {
    const raw = (notificationTime ?? DEFAULT_NOTIFICATION_TIME).trim();
    const parts = raw.split(":");
    const hour = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 9));
    const rawMinute = parts[1] != null ? Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0)) : 0;
    const minute = (Math.round(rawMinute / 15) * 15) % 60;
    return { hour, minute };
}

function shouldSendToUser(user: UserDocument, nowUtc: DateTime): boolean {
    const timezone = user.timezone ?? "UTC";
    const userTime = nowUtc.setZone(timezone);
    const { hour: targetHour, minute: targetMinute } = getTargetHourMinute(user.notificationTime ?? DEFAULT_NOTIFICATION_TIME);

    if (userTime.hour !== targetHour || userTime.minute !== targetMinute) {
        return false;
    }

    const lastSent = user.lastMotivationSentAt?.toDate();
    if (!lastSent) {
        return true;
    }

    const lastSentUserTime = DateTime.fromJSDate(lastSent).setZone(timezone);
    return !lastSentUserTime.hasSame(userTime, "day");
}

function pickRandomReminder(): string {
    const i = Math.floor(Math.random() * REMINDER_MESSAGES.length);
    return REMINDER_MESSAGES[i] ?? REMINDER_MESSAGES[0];
}

async function pickStaticQuote(): Promise<{ id: string; data: QuoteDocument } | null> {
    const snapshot = await db
        .collection(QUOTES_COLLECTION)
        .orderBy("lastSentDate", "asc")
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, data: doc.data() as QuoteDocument };
}

async function generateOpenAIQuote(apiKey: string): Promise<string> {
    if (!apiKey) {
        functions.logger.warn("OpenAI API key not set; premium users will get static quote.");
        return "";
    }
    try {
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You respond with a single short motivational or uplifting quote. No preamble, no attribution, no extra punctuation. Plain text only. Maximum 15 words.",
                },
                { role: "user", content: "Give one short motivational quote." },
            ],
            temperature: 0.8,
            max_tokens: 60,
        });
        const text = response.choices[0]?.message?.content?.trim() ?? "";
        return text;
    } catch (err) {
        functions.logger.warn("OpenAI quote failed", err);
        return "";
    }
}

/**
 * Runs every 15 minutes (UTC). For each user with daily reminder on, checks if it's their
 * chosen time in their timezone (rounded to 0/15/30/45). Sends one FCM per user: reminder + quote.
 * Premium: AI-generated quote (with static fallback). Free: static quote. All users get the feature.
 */
export const sendDailyMotivation = onSchedule(
    {
        schedule: "every 15 minutes",
        timeZone: "UTC",
    },
    async () => {
        const nowUtc = DateTime.utc();
        const apiKey = openaiApiKey.value();

        const userSnapshot = await db
            .collection(USERS_COLLECTION)
            .where("motivationNotificationsEnabled", "==", true)
            .get();

        if (userSnapshot.empty) {
            functions.logger.info("No users opted in for motivation notifications.");
            return;
        }

        const staticQuote = await pickStaticQuote();
        const messaging = admin.messaging();
        const usersToUpdate: Array<{ ref: FirebaseFirestore.DocumentReference; usedStaticQuoteId?: string }> = [];
        const sendPromises: Array<Promise<unknown>> = [];

        for (const docSnapshot of userSnapshot.docs) {
            const userData = docSnapshot.data() as UserDocument;
            if (!userData.fcmToken) {
                continue;
            }

            if (!shouldSendToUser(userData, nowUtc)) {
                continue;
            }

            const reminder = pickRandomReminder();
            let body = reminder;
            let usedStaticQuoteId: string | undefined;

            if (userData.isPremium) {
                const aiQuote = await generateOpenAIQuote(apiKey);
                if (aiQuote) {
                    body = `${reminder}\n\n"${aiQuote}"`;
                } else if (staticQuote) {
                    const quoteText = staticQuote.data.author
                        ? `${staticQuote.data.text} — ${staticQuote.data.author}`
                        : staticQuote.data.text;
                    body = `${reminder}\n\n"${quoteText}"`;
                    usedStaticQuoteId = staticQuote.id;
                }
            } else if (staticQuote) {
                const quoteText = staticQuote.data.author
                    ? `${staticQuote.data.text} — ${staticQuote.data.author}`
                    : staticQuote.data.text;
                body = `${reminder}\n\n"${quoteText}"`;
                usedStaticQuoteId = staticQuote.id;
            }

            usersToUpdate.push({ ref: docSnapshot.ref, usedStaticQuoteId });
            sendPromises.push(
                messaging
                    .send({
                        token: userData.fcmToken,
                        notification: {
                            title: "Daily Aura Check-In ✨",
                            body,
                        },
                    })
                    .catch((err: { code?: string }) => {
                        functions.logger.warn("Failed to send to token", err?.code ?? err);
                        if (
                            err?.code === "messaging/invalid-registration-token" ||
                            err?.code === "messaging/registration-token-not-registered"
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
        functions.logger.info(`Sent daily motivation to ${usersToUpdate.length} users.`);
    }
);
