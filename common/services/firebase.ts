/**
 * Firebase Configuration for React Native (Expo)
 * 
 * NOTE: Using Firebase Web SDK which works with Expo on Android & iOS
 * 
 * SETUP INSTRUCTIONS (Android First):
 * 1. Install Firebase: npm install firebase
 * 2. Go to https://console.firebase.google.com/
 * 3. Create a new project (or use existing)
 * 4. Go to Project Settings > General
 * 5. Scroll down to "Your apps" section
 * 6. Click the Android icon (🤖) to add Android app
 * 7. Package name: com.myauralog (from app.config.js)
 * 8. Download google-services.json (we'll use web config instead)
 * 9. Click the web icon (</>) to add a web app
 * 10. Copy the config values and paste them below
 * 11. Save this file
 */

// Try to import Firebase Web SDK (works with Expo on Android/iOS)
let initializeApp: any = null;
let getFirestore: any = null;

try {
    // Firebase Web SDK works with Expo on both Android and iOS
    const firebaseApp = require('firebase/app');
    const firestore = require('firebase/firestore');
    initializeApp = firebaseApp.initializeApp;
    getFirestore = firestore.getFirestore;
} catch (error) {
    console.warn('Firebase not installed. Run: npm install firebase');
    console.warn('This works on Android and iOS with Expo!');
    // Functions will be null if Firebase is not installed
}

// TODO: Replace these with your actual Firebase config values from Firebase Console
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyA3YC5yNeziYYJmLC58ej2xUUKXctVgjeg",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "my-aura-log.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "my-aura-log",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "my-aura-log.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1037142646223",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1037142646223:web:9a7be1cab6d156113cc6ba"
};

// Check if Firebase is configured (all values filled in)
const isFirebaseConfigured =
    firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
    firebaseConfig.apiKey.includes("AIza") && // Valid API key format
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    firebaseConfig.appId !== "YOUR_APP_ID" &&
    firebaseConfig.appId !== "YOUR_WEB_APP_ID_HERE" &&
    firebaseConfig.appId.includes(":web:"); // Valid web app ID format

let app: any = null;
let db: any = null;

// Initialize Firebase only if configured and installed
if (isFirebaseConfigured && initializeApp && getFirestore) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log('✅ Firebase initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        console.warn('   Make sure Firebase is installed: npm install firebase');
        app = null;
        db = null;
    }
} else {
    if (!initializeApp || !getFirestore) {
        console.warn('⚠️ Firebase package not installed. Run: npm install firebase');
    } else {
        console.warn('⚠️ Firebase not configured. Using local storage only.');
        console.warn('   To enable Firebase, add your config to firebase.ts or .env file');
    }
}

// Export Firebase instances
export { db, app, isFirebaseConfigured };

// Export default app
export default app;

