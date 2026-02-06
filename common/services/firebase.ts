import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { Analytics, getAnalytics } from 'firebase/analytics';

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

// Check if Firebase is properly configured
const isFirebaseConfigured = !missingKeys.length && !!app;

// Initialize Analytics - works in dev builds, not in Expo Go
// Will gracefully fail if Analytics is not available (e.g., in Expo Go)
let analytics: Analytics | null = null;
try {
    analytics = getAnalytics(app);
} catch (error) {
    // Analytics not available (e.g., Expo Go, or Analytics not enabled in Firebase)
    // This is expected in some environments, so we silently continue
    if (__DEV__) {
        console.log('Firebase Analytics not available:', error instanceof Error ? error.message : 'Unknown error');
    }
}

export { db, analytics, isFirebaseConfigured };
export default app;