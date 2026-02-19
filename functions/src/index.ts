import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { defineString } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { runDailyMotivation } from "./runDailyMotivation";

const openaiApiKey = defineString("OPENAI_API_KEY", { default: "" });
/** Set this to trigger "send now" for testing: ?secret=YOUR_SECRET or header x-test-secret */
const testTriggerSecret = defineString("MOTIVATION_TEST_SECRET", { default: "" });

if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Returns a custom Firebase Auth token so the app can sign in with uid = deviceId.
 * This lets Firestore rules (request.auth.uid == userId) work without a login screen.
 * Call from the client with { deviceId: string }.
 * Requires: Firebase Authentication enabled in Console (no sign-in method needed).
 */
export const getAuthToken = onCall(
    { enforceAppCheck: false },
    async (request) => {
        const deviceId = request.data?.deviceId;
        if (typeof deviceId !== "string" || !deviceId.trim() || deviceId.length > 128) {
            throw new HttpsError("invalid-argument", "deviceId must be a non-empty string (max 128 chars)");
        }
        const uid = deviceId.trim();
        try {
            const token = await admin.auth().createCustomToken(uid);
            return { token };
        } catch (err: unknown) {
            const raw = err instanceof Error ? err.message : String(err);
            functions.logger.error("getAuthToken createCustomToken failed", err);
            throw new HttpsError(
                "internal",
                "Auth token failed: " + raw + ". Enable Firebase Authentication and Identity Toolkit API, then redeploy."
            );
        }
    }
);

const db = admin.firestore();
const USERS_COLLECTION = "users";

/**
 * Two-way Soul-Link: when user A links with user B, both get each other as partner.
 * Callable: { partnerDeviceId: string, partnerDisplayName?: string }.
 * Writes soulLinkPartnerId on both users' docs so both see the Orbital Presence.
 */
export const soulLinkConnect = onCall(
    { enforceAppCheck: false },
    async (request) => {
        const authUid = request.auth?.uid;
        if (!authUid || typeof authUid !== "string") {
            throw new HttpsError("unauthenticated", "Must be signed in");
        }
        const partnerDeviceId = request.data?.partnerDeviceId;
        if (typeof partnerDeviceId !== "string" || !partnerDeviceId.trim() || partnerDeviceId.length > 128) {
            throw new HttpsError("invalid-argument", "partnerDeviceId must be a non-empty string");
        }
        const partnerId = partnerDeviceId.trim();
        if (partnerId === authUid) {
            throw new HttpsError("invalid-argument", "Cannot link with yourself");
        }

        const userARef = db.collection(USERS_COLLECTION).doc(authUid);
        const userBRef = db.collection(USERS_COLLECTION).doc(partnerId);

        const [, partnerSnap] = await Promise.all([
            userARef.get(),
            userBRef.get(),
        ]);
        if (!partnerSnap.exists) {
            throw new HttpsError("not-found", "Partner not found");
        }

        await Promise.all([
            userARef.set({ soulLinkPartnerId: partnerId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }),
            userBRef.set({ soulLinkPartnerId: authUid, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }),
        ]);
        return { ok: true };
    }
);

/**
 * Two-way Soul-Link unlink: clears soulLinkPartnerId on both users.
 */
export const soulLinkUnlink = onCall(
    { enforceAppCheck: false },
    async (request) => {
        const authUid = request.auth?.uid;
        if (!authUid || typeof authUid !== "string") {
            throw new HttpsError("unauthenticated", "Must be signed in");
        }
        const userRef = db.collection(USERS_COLLECTION).doc(authUid);
        const snap = await userRef.get();
        const partnerId = snap.exists ? (snap.data()?.soulLinkPartnerId as string | undefined) : undefined;
        await userRef.set({ soulLinkPartnerId: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        if (partnerId && typeof partnerId === "string" && partnerId.trim()) {
            await db.collection(USERS_COLLECTION).doc(partnerId.trim()).set(
                { soulLinkPartnerId: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
                { merge: true }
            );
        }
        return { ok: true };
    }
);

/**
 * Runs every 15 minutes (UTC). For each user with daily reminder on, checks if it's their
 * chosen time in their timezone (rounded to 0/15/30/45). Sends one FCM per user: reminder + quote.
 */
export const sendDailyMotivation = onSchedule(
    {
        schedule: "every 15 minutes",
        timeZone: "UTC",
    },
    async () => {
        const apiKey = openaiApiKey.value();
        await runDailyMotivation(db, apiKey, {
            testMode: false,
            logger: functions.logger,
        });
    }
);

/**
 * Test trigger: send daily motivation to all opted-in users NOW (ignores time-of-day and once-per-day).
 * Secured by MOTIVATION_TEST_SECRET. Call with:
 *   GET/POST https://REGION-PROJECT.cloudfunctions.net/sendDailyMotivationNow?secret=YOUR_SECRET
 *   or header: x-test-secret: YOUR_SECRET
 */
export const sendDailyMotivationNow = onRequest(async (req, res) => {
    const secret = testTriggerSecret.value();
    if (!secret) {
        res.status(500).json({ error: "MOTIVATION_TEST_SECRET not configured" });
        return;
    }

    const provided =
        (req.query?.secret as string)?.trim() || (req.get("x-test-secret") ?? "").trim();
    if (provided !== secret) {
        res.status(403).json({ error: "Invalid or missing secret" });
        return;
    }

    try {
        const apiKey = openaiApiKey.value();
        const { sentCount } = await runDailyMotivation(db, apiKey, {
            testMode: true,
            logger: functions.logger,
        });
        res.status(200).json({ ok: true, sentCount });
    } catch (err) {
        functions.logger.error("sendDailyMotivationNow failed", err);
        res.status(500).json({ error: "Send failed", details: String(err) });
    }
});
