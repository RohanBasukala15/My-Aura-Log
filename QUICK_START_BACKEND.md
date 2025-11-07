# 🚀 Quick Start: Backend Setup (5 Steps)

If you've never done backend before, follow these 5 simple steps. Takes about 30 minutes!

---

## Step 1: Create Firebase Account (5 min)

1. Go to: https://console.firebase.google.com/
2. Sign in with your Google account
3. Click "Add project"
4. Name it: `myauralog` (or any name)
5. Click "Continue" → "Continue" → "Create project"
6. Wait 30 seconds for it to create

✅ **Done!** You now have a Firebase project.

---

## Step 2: Set Up Database (5 min)

1. In Firebase Console, click **"Firestore Database"** (left menu)
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll secure it later)
4. Click **"Next"**
5. Choose a location (pick closest to you)
6. Click **"Enable"**

✅ **Done!** Your database is ready.

---

## Step 3: Get Your Config Keys (5 min)

1. In Firebase Console, click the **gear icon** ⚙️ (top left)
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **web icon** `</>` (Add app)
5. Name it: "My Aura Log Web"
6. Click **"Register app"**
7. **Copy the config object** (it looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "myauralog.firebaseapp.com",
  projectId: "myauralog",
  storageBucket: "myauralog.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

✅ **Done!** You have your config keys.

---

## Step 4: Install Firebase in Your App (5 min)

Open your terminal in the project folder and run:

```bash
npm install firebase
# or
yarn add firebase
```

Then:

1. Copy `common/services/firebase.ts.example` 
2. Rename it to `firebase.ts` (remove `.example`)
3. Paste your config values from Step 3

✅ **Done!** Firebase is installed.

---

## Step 5: Test It Works (10 min)

Create a simple test file to verify:

1. Open `app/(home)/(tabs)/settings.tsx`
2. Add this at the top (temporarily, just to test):

```typescript
import { db } from "@common/services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Test function (call this somewhere to test)
const testFirebase = async () => {
  try {
    const testRef = doc(db, 'test', 'hello');
    await setDoc(testRef, { message: 'Hello Firebase!' });
    const snap = await getDoc(testRef);
    console.log('Firebase works!', snap.data());
  } catch (error) {
    console.error('Firebase error:', error);
  }
};
```

3. Run your app and call `testFirebase()`
4. Check Firebase Console > Firestore Database
5. You should see a "test" collection with a "hello" document!

✅ **Done!** Firebase is working!

---

## 🎉 Next: Update Referral Service

Once Firebase is working, you can update your referral service to use it. See `REFERRAL_BACKEND_SETUP.md` for the full code.

---

## ❓ Troubleshooting

**Problem**: "Firebase not initialized"  
**Solution**: Make sure you renamed `firebase.ts.example` to `firebase.ts` and added your config.

**Problem**: "Permission denied"  
**Solution**: Your Firestore is in test mode, which should allow all reads/writes. If not, check the Rules tab.

**Problem**: "Module not found"  
**Solution**: Run `npm install firebase` again, then restart your dev server.

---

## 📚 Need Help?

- Firebase Docs: https://firebase.google.com/docs
- Firestore Tutorial: https://firebase.google.com/docs/firestore/quickstart

---

**That's it!** You now have a backend. The hard part is done. 🎊

