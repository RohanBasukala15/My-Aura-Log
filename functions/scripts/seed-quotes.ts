/**
 * One-time script: add a bunch of motivational quotes to Firestore (motivationalQuotes).
 * Uses the same credentials as send-now (serviceAccountKey.json or env).
 *
 * Run from functions dir:  npx tsx scripts/seed-quotes.ts
 */

import * as path from "path";
import * as fs from "fs";
import * as admin from "firebase-admin";

const FUNCTIONS_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(FUNCTIONS_DIR, ".env");
const keyPath = path.join(FUNCTIONS_DIR, "serviceAccountKey.json");

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

if (!admin.apps.length) {
    if (fs.existsSync(keyPath)) {
        const key = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
        admin.initializeApp({ projectId, credential: admin.credential.cert(key) });
    } else {
        admin.initializeApp({ projectId });
    }
}

const db = admin.firestore();
const COLLECTION = "motivationalQuotes";

const QUOTES: Array<{ text: string; author?: string }> = [
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "Every day may not be good, but there is something good in every day.", author: "Alice Morse Earle" },
    { text: "Small steps every day lead to big changes over time.", author: "Unknown" },
    { text: "Your mood is valid. Taking a moment to name it is a gift to yourself." },
    { text: "How you start your day often determines how you live your day.", author: "Hal Elrod" },
    { text: "The present moment is the only moment you have.", author: "Thich Nhat Hanh" },
    { text: "Be gentle with yourself. You're doing the best you can." },
    { text: "Progress, not perfection.", author: "Unknown" },
    { text: "Today is a good day to check in with how you feel.", author: "Unknown" },
    { text: "One small positive thought can change your whole day.", author: "Zig Ziglar" },
    { text: "What we think, we become.", author: "Buddha" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese proverb" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

async function main() {
    const col = db.collection(COLLECTION);
    const batch = db.batch();

    for (const q of QUOTES) {
        const ref = col.doc();
        batch.set(ref, {
            text: q.text,
            ...(q.author && { author: q.author }),
            lastSentDate: null, // so orderBy("lastSentDate", "asc") picks never-sent quotes first
        });
    }

    await batch.commit();
    console.log(`Added ${QUOTES.length} quotes to ${COLLECTION}.`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
