import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { defineString } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { runDailyMotivation } from "./runDailyMotivation";

const openaiApiKey = defineString("OPENAI_API_KEY", { default: "" });
/** Set this to trigger "send now" for testing: ?secret=YOUR_SECRET or header x-test-secret */
const testTriggerSecret = defineString("MOTIVATION_TEST_SECRET", { default: "" });

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

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
