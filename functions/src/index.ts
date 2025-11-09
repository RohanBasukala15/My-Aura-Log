import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { DateTime } from "luxon";

type UserDocument = {
    fcmToken?: string | null;
    motivationNotificationsEnabled?: boolean;
    timezone?: string;
    lastMotivationSentAt?: FirebaseFirestore.Timestamp | null;
};

type QuoteDocument = {
    text: string;
    author?: string;
    lastSentDate?: FirebaseFirestore.Timestamp | null;
};

const USERS_COLLECTION = "users";
const QUOTES_COLLECTION = "motivationalQuotes";
const TARGET_HOUR = 9; // 9 AM user-local time

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

function shouldSendToUser(user: UserDocument, nowUtc: DateTime): boolean {
    const timezone = user.timezone ?? "UTC";
    const userTime = nowUtc.setZone(timezone);

    if (userTime.hour !== TARGET_HOUR) {
        return false;
    }

    const lastSent = user.lastMotivationSentAt?.toDate();
    if (!lastSent) {
        return true;
    }

    const lastSentUserTime = DateTime.fromJSDate(lastSent).setZone(timezone);
    return !lastSentUserTime.hasSame(userTime, "day");
}

async function pickQuote(): Promise<{ id: string; data: QuoteDocument } | null> {
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

export const sendDailyMotivation = functions.pubsub
    .schedule("every 1 hours")
    .timeZone("UTC")
    .onRun(async () => {
        const nowUtc = DateTime.utc();

        const userSnapshot = await db
            .collection(USERS_COLLECTION)
            .where("motivationNotificationsEnabled", "==", true)
            .get();

        if (userSnapshot.empty) {
            functions.logger.info("No users opted in for motivation notifications.");
            return null;
        }

        const quote = await pickQuote();
        if (!quote) {
            functions.logger.warn("No motivational quotes available.");
            return null;
        }

        const validTokens: string[] = [];
        const usersToUpdate: Array<{ ref: FirebaseFirestore.DocumentReference; timezone: string }> = [];

        userSnapshot.docs.forEach((docSnapshot) => {
            const userData = docSnapshot.data() as UserDocument;
            if (!userData.fcmToken) {
                return;
            }

            if (!shouldSendToUser(userData, nowUtc)) {
                return;
            }

            validTokens.push(userData.fcmToken);
            usersToUpdate.push({ ref: docSnapshot.ref, timezone: userData.timezone ?? "UTC" });
        });

        if (validTokens.length === 0) {
            functions.logger.info("No tokens eligible for notification in this cycle.");
            return null;
        }

        const notificationBody = quote.data.author
            ? `${quote.data.text} — ${quote.data.author}`
            : quote.data.text;

        const response = await admin.messaging().sendEachForMulticast({
            tokens: validTokens,
            notification: {
                title: "Daily Motivation",
                body: notificationBody,
            },
        });

        const cleanupOperations: Array<Promise<unknown>> = [];
        response.responses.forEach((messageResponse, index) => {
            if (!messageResponse.success) {
                const errorCode = messageResponse.error?.code ?? "unknown";
                functions.logger.warn("Failed to send notification", errorCode);

                const failedToken = validTokens[index];
                cleanupOperations.push(
                    db
                        .collection(USERS_COLLECTION)
                        .where("fcmToken", "==", failedToken)
                        .get()
                        .then((tokenSnapshot) => {
                            const batch = db.batch();
                            tokenSnapshot.docs.forEach((userDoc) => {
                                batch.update(userDoc.ref, {
                                    fcmToken: admin.firestore.FieldValue.delete(),
                                });
                            });
                            return batch.commit();
                        })
                );
            }
        });

        await Promise.all(cleanupOperations);

        const batch = db.batch();
        const nowTimestamp = admin.firestore.FieldValue.serverTimestamp();

        usersToUpdate.forEach(({ ref }) => {
            batch.update(ref, {
                lastMotivationSentAt: nowTimestamp,
            });
        });

        batch.update(db.collection(QUOTES_COLLECTION).doc(quote.id), {
            lastSentDate: nowTimestamp,
        });

        await batch.commit();

        functions.logger.info(`Sent motivational notifications to ${validTokens.length} tokens.`);
        return null;
    });
