/**
 * Local test script: send daily motivation to all opted-in users NOW.
 *
 * Prerequisites:
 * 1. In functions/.env set OPENAI_API_KEY (optional, for premium AI quotes).
 * 2. Firebase credentials so the script can access Firestore and FCM:
 *    - Easiest: put your service account key at functions/serviceAccountKey.json
 *      (Firebase Console → Project settings → Service accounts → Generate new private key).
 *      The script will use it automatically when you run from any directory.
 *    - Or: set GOOGLE_APPLICATION_CREDENTIALS to the key file path, or use
 *      gcloud auth application-default login.
 *
 * Run from project root:
 *   cd functions && npx tsx scripts/send-now.ts
 * Or from functions dir:
 *   npx tsx scripts/send-now.ts
 */

import * as path from "path";
import * as fs from "fs";
import * as admin from "firebase-admin";
import { runDailyMotivation } from "../src/runDailyMotivation";

const FUNCTIONS_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(FUNCTIONS_DIR, ".env");

// Load .env manually (no dotenv dependency)
if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, "utf-8");
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const eq = trimmed.indexOf("=");
            if (eq > 0) {
                const key = trimmed.slice(0, eq).trim();
                const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
                if (!process.env[key]) process.env[key] = value;
            }
        }
    }
}

const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "my-aura-log";
const keyPath = path.join(FUNCTIONS_DIR, "serviceAccountKey.json");

if (!admin.apps.length) {
    if (fs.existsSync(keyPath)) {
        const key = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
        admin.initializeApp({ projectId, credential: admin.credential.cert(key) });
    } else {
        admin.initializeApp({ projectId });
    }
}

const db = admin.firestore();
const apiKey = process.env.OPENAI_API_KEY ?? "";

runDailyMotivation(db, apiKey, { testMode: true })
    .then(({ sentCount }) => {
        console.log("Done. Sent to", sentCount, "user(s).");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error:", err);
        process.exit(1);
    });
