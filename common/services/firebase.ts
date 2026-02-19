import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  initializeAuth,
  getReactNativePersistence,
  signInWithCustomToken,
  type Auth,
} from "firebase/auth";
import { getFunctions, httpsCallable, type Functions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getDeviceId } from "../utils/device-utils";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Fail fast if env vars are missing
const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingKeys.length > 0) {
    throw new Error(
        `Missing Firebase environment variables: ${missingKeys.join(', ')}.\n` +
        `Add them to your .env file with the EXPO_PUBLIC_ prefix.`
    );
}

const app = initializeApp(firebaseConfig as Record<string, string>);
const db = getFirestore(app);
const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
// Use explicit region so callables resolve (default us-central1)
const functions: Functions = getFunctions(app, "us-central1");

const isFirebaseConfigured = !missingKeys.length && !!app;

const LOG = (tag: string, ...args: unknown[]) => {
    if (__DEV__) console.log(`[Firebase Auth] ${tag}`, ...args);
};

/**
 * Sign in with a custom token so request.auth.uid === deviceId in Firestore rules.
 * No login screen: we get the token from a callable Cloud Function and sign in silently.
 * Call early in app lifecycle (e.g. root layout) so Firestore reads/writes are allowed.
 */
async function ensureFirebaseAuth(): Promise<void> {
    LOG("ensureFirebaseAuth called");
    LOG("isFirebaseConfigured", isFirebaseConfigured);
    LOG("projectId", firebaseConfig.projectId);
    LOG("functions region", "us-central1");
    if (!isFirebaseConfigured) {
        LOG("skip: not configured");
        return;
    }
    if (auth.currentUser) {
        LOG("already signed in, uid suffix", auth.currentUser.uid.slice(-6));
        return;
    }
    const deviceId = await getDeviceId();
    LOG("deviceId length", deviceId.length, "suffix", deviceId.slice(-6));
    const getToken = httpsCallable<{ deviceId: string }, { token: string }>(functions, "getAuthToken");
    for (let attempt = 0; attempt < 2; attempt++) {
        LOG("attempt", attempt + 1, "calling getAuthToken...");
        try {
            const { data } = await getToken({ deviceId });
            LOG("getAuthToken response:", data ? "has data" : "no data", data?.token ? `token length ${data.token.length}` : "");
            if (data?.token) {
                LOG("signInWithCustomToken...");
                await signInWithCustomToken(auth, data.token);
                const uid = auth.currentUser ? (auth.currentUser as { uid: string }).uid : "";
LOG("signInWithCustomToken success, uid suffix", uid.slice(-6));
                return;
            }
            LOG("no token in response");
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string; details?: unknown };
            LOG("getAuthToken/signIn error", "code", err?.code, "message", err?.message, "details", err?.details);
            console.warn(
                "[Firebase] ensureFirebaseAuth failed:",
                err?.code ?? "unknown",
                err?.message ?? String(e),
                typeof err?.details === "object" ? JSON.stringify(err.details) : err?.details ?? ""
            );
            if (attempt === 1) {
                LOG("giving up after 2 attempts");
                return;
            }
            LOG("retry in 800ms...");
            await new Promise((r) => setTimeout(r, 800));
        }
    }
}

export { db, auth, functions, isFirebaseConfigured, ensureFirebaseAuth };
export default app;