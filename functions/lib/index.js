"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDailyMotivationNow = exports.sendDailyMotivation = exports.soulLinkUnlink = exports.soulLinkConnect = exports.getAuthToken = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const https_2 = require("firebase-functions/v2/https");
const runDailyMotivation_1 = require("./runDailyMotivation");
const openaiApiKey = (0, params_1.defineString)("OPENAI_API_KEY", { default: "" });
/** Set this to trigger "send now" for testing: ?secret=YOUR_SECRET or header x-test-secret */
const testTriggerSecret = (0, params_1.defineString)("MOTIVATION_TEST_SECRET", { default: "" });
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Returns a custom Firebase Auth token so the app can sign in with uid = deviceId.
 * This lets Firestore rules (request.auth.uid == userId) work without a login screen.
 * Call from the client with { deviceId: string }.
 * Requires: Firebase Authentication enabled in Console (no sign-in method needed).
 */
exports.getAuthToken = (0, https_2.onCall)({ enforceAppCheck: false }, async (request) => {
    const deviceId = request.data?.deviceId;
    if (typeof deviceId !== "string" || !deviceId.trim() || deviceId.length > 128) {
        throw new https_2.HttpsError("invalid-argument", "deviceId must be a non-empty string (max 128 chars)");
    }
    const uid = deviceId.trim();
    try {
        const token = await admin.auth().createCustomToken(uid);
        return { token };
    }
    catch (err) {
        const raw = err instanceof Error ? err.message : String(err);
        functions.logger.error("getAuthToken createCustomToken failed", err);
        throw new https_2.HttpsError("internal", "Auth token failed: " + raw + ". Enable Firebase Authentication and Identity Toolkit API, then redeploy.");
    }
});
const db = admin.firestore();
const USERS_COLLECTION = "users";
/**
 * Two-way Soul-Link: when user A links with user B, both get each other as partner.
 * Callable: { partnerDeviceId: string, partnerDisplayName?: string }.
 * Writes soulLinkPartnerId on both users' docs so both see the Orbital Presence.
 */
exports.soulLinkConnect = (0, https_2.onCall)({ enforceAppCheck: false }, async (request) => {
    const authUid = request.auth?.uid;
    if (!authUid || typeof authUid !== "string") {
        throw new https_2.HttpsError("unauthenticated", "Must be signed in");
    }
    const partnerDeviceId = request.data?.partnerDeviceId;
    if (typeof partnerDeviceId !== "string" || !partnerDeviceId.trim() || partnerDeviceId.length > 128) {
        throw new https_2.HttpsError("invalid-argument", "partnerDeviceId must be a non-empty string");
    }
    const partnerId = partnerDeviceId.trim();
    if (partnerId === authUid) {
        throw new https_2.HttpsError("invalid-argument", "Cannot link with yourself");
    }
    const userARef = db.collection(USERS_COLLECTION).doc(authUid);
    const userBRef = db.collection(USERS_COLLECTION).doc(partnerId);
    const [, partnerSnap] = await Promise.all([
        userARef.get(),
        userBRef.get(),
    ]);
    if (!partnerSnap.exists) {
        throw new https_2.HttpsError("not-found", "Partner not found");
    }
    await Promise.all([
        userARef.set({ soulLinkPartnerId: partnerId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }),
        userBRef.set({ soulLinkPartnerId: authUid, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }),
    ]);
    return { ok: true };
});
/**
 * Two-way Soul-Link unlink: clears soulLinkPartnerId on both users.
 */
exports.soulLinkUnlink = (0, https_2.onCall)({ enforceAppCheck: false }, async (request) => {
    const authUid = request.auth?.uid;
    if (!authUid || typeof authUid !== "string") {
        throw new https_2.HttpsError("unauthenticated", "Must be signed in");
    }
    const userRef = db.collection(USERS_COLLECTION).doc(authUid);
    const snap = await userRef.get();
    const partnerId = snap.exists ? snap.data()?.soulLinkPartnerId : undefined;
    await userRef.set({ soulLinkPartnerId: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    if (partnerId && typeof partnerId === "string" && partnerId.trim()) {
        await db.collection(USERS_COLLECTION).doc(partnerId.trim()).set({ soulLinkPartnerId: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    return { ok: true };
});
/**
 * Runs every 15 minutes (UTC). For each user with daily reminder on, checks if it's their
 * chosen time in their timezone (rounded to 0/15/30/45). Sends one FCM per user: reminder + quote.
 */
exports.sendDailyMotivation = (0, scheduler_1.onSchedule)({
    schedule: "every 15 minutes",
    timeZone: "UTC",
}, async () => {
    const apiKey = openaiApiKey.value();
    await (0, runDailyMotivation_1.runDailyMotivation)(db, apiKey, {
        testMode: false,
        logger: functions.logger,
    });
});
/**
 * Test trigger: send daily motivation to all opted-in users NOW (ignores time-of-day and once-per-day).
 * Secured by MOTIVATION_TEST_SECRET. Call with:
 *   GET/POST https://REGION-PROJECT.cloudfunctions.net/sendDailyMotivationNow?secret=YOUR_SECRET
 *   or header: x-test-secret: YOUR_SECRET
 */
exports.sendDailyMotivationNow = (0, https_1.onRequest)(async (req, res) => {
    const secret = testTriggerSecret.value();
    if (!secret) {
        res.status(500).json({ error: "MOTIVATION_TEST_SECRET not configured" });
        return;
    }
    const provided = req.query?.secret?.trim() || (req.get("x-test-secret") ?? "").trim();
    if (provided !== secret) {
        res.status(403).json({ error: "Invalid or missing secret" });
        return;
    }
    try {
        const apiKey = openaiApiKey.value();
        const { sentCount } = await (0, runDailyMotivation_1.runDailyMotivation)(db, apiKey, {
            testMode: true,
            logger: functions.logger,
        });
        res.status(200).json({ ok: true, sentCount });
    }
    catch (err) {
        functions.logger.error("sendDailyMotivationNow failed", err);
        res.status(500).json({ error: "Send failed", details: String(err) });
    }
});
