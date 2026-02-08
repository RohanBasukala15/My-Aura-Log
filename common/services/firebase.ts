import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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

// Do NOT use firebase/analytics (getAnalytics) in React Native - it expects a browser DOM
// (document.getElementsByTagName) and will throw. Use @react-native-firebase/analytics in analyticsService instead.
export { db, isFirebaseConfigured };
export default app;