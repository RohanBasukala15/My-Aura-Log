# Referral System Backend Integration Guide

## 🎯 Overview

This guide will help you set up a simple backend to track referrals across devices. Since you're new to backend development, we'll use **Firebase** - it's the easiest option that requires minimal setup.

---

## 🏗️ Architecture Overview

Here's how the referral system will work with a backend:

```
User A (Referrer)                    Backend (Firebase)              User B (Friend)
     |                                      |                              |
     |-- Share referral code ---------------|                              |
     |                                      |                              |
     |                                      |<-- Friend installs app ------|
     |                                      |                              |
     |                                      |<-- Friend enters code -------|
     |                                      |                              |
     |<-- Backend increments count ---------|                              |
     |                                      |                              |
     |-- Check referral count -------------|                              |
     |<-- Returns: 1/3 referrals -----------|                              |
```

---

## 🚀 Option 1: Firebase (Recommended for Beginners)

Firebase is Google's platform that provides:
- **Firestore Database** - NoSQL database (like a spreadsheet in the cloud)
- **Cloud Functions** - Server-side code that runs automatically
- **Authentication** - User management (optional, but helpful)

### Why Firebase?
✅ No server setup required  
✅ Free tier is generous  
✅ Real-time updates  
✅ Easy to learn  
✅ Works great with React Native  

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it: `myauralog-backend` (or any name)
4. Disable Google Analytics (optional, for simplicity)
5. Click "Create project"

### Step 2: Set Up Firestore Database

1. In Firebase Console, click "Firestore Database" in the left menu
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location (choose closest to your users)
5. Click "Enable"

### Step 3: Create Database Structure

Your Firestore database will have these collections:

```
referrals/
  └── {referralCode}/
      ├── referrerId: "device-id-123"
      ├── createdAt: timestamp
      ├── referralCount: 0
      └── referredUsers: ["device-id-456", "device-id-789"]

users/
  └── {deviceId}/
      ├── referralCode: "ABC123XYZ"
      ├── referredBy: "XYZ789ABC" (or null)
      └── isPremium: false
```

### Step 4: Install Firebase in Your App

```bash
# Install Firebase SDK
npm install firebase
# or
yarn add firebase
```

### Step 5: Create Firebase Config File

Create `common/services/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Your Firebase config (get this from Firebase Console)
// Go to Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Cloud Functions (optional, for server-side logic)
export const functions = getFunctions(app);
```

### Step 6: Update Referral Service

Update `common/services/referralService.ts` to use Firebase:

```typescript
import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { getDeviceId } from '../utils/device-utils';
import { PremiumService } from './premiumService';

const REQUIRED_REFERRALS = 3;

export class ReferralService {
  /**
   * Get or create referral code for current user
   */
  static async getMyReferralCode(): Promise<string> {
    const deviceId = await getDeviceId();
    const userRef = doc(db, 'users', deviceId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().referralCode;
    }

    // Generate new referral code
    const code = await this.generateUniqueCode();
    
    // Create user document
    await setDoc(userRef, {
      referralCode: code,
      referredBy: null,
      isPremium: false,
      createdAt: serverTimestamp(),
    });

    // Create referral document
    const referralRef = doc(db, 'referrals', code);
    await setDoc(referralRef, {
      referrerId: deviceId,
      referralCount: 0,
      referredUsers: [],
      createdAt: serverTimestamp(),
    });

    return code;
  }

  /**
   * Generate unique referral code
   */
  private static async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    // Keep generating until we find a unique one
    while (true) {
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const ref = doc(db, 'referrals', code);
      const snap = await getDoc(ref);
      
      if (!snap.exists()) {
        return code;
      }
      
      code = ''; // Reset and try again
    }
  }

  /**
   * Enter a referral code (when friend uses your code)
   */
  static async enterReferralCode(code: string): Promise<{ success: boolean; message: string }> {
    const deviceId = await getDeviceId();
    const upperCode = code.trim().toUpperCase();

    // Get user document
    const userRef = doc(db, 'users', deviceId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create user if doesn't exist
      await this.getMyReferralCode();
    }

    const userData = (await getDoc(userRef)).data();

    // Check if already referred
    if (userData?.referredBy) {
      return {
        success: false,
        message: "You've already used a referral code.",
      };
    }

    // Check if using own code
    if (userData?.referralCode === upperCode) {
      return {
        success: false,
        message: "You can't use your own referral code.",
      };
    }

    // Check if referral code exists
    const referralRef = doc(db, 'referrals', upperCode);
    const referralSnap = await getDoc(referralRef);

    if (!referralSnap.exists()) {
      return {
        success: false,
        message: "Invalid referral code.",
      };
    }

    // Update user to mark as referred
    await updateDoc(userRef, {
      referredBy: upperCode,
    });

    // Increment referral count for the referrer
    const referralData = referralSnap.data();
    const referredUsers = referralData.referredUsers || [];
    
    // Only increment if this device hasn't been counted
    if (!referredUsers.includes(deviceId)) {
      await updateDoc(referralRef, {
        referralCount: increment(1),
        referredUsers: [...referredUsers, deviceId],
      });

      // Check if referrer should get premium
      const newCount = (referralData.referralCount || 0) + 1;
      if (newCount >= REQUIRED_REFERRALS) {
        const referrerUserRef = doc(db, 'users', referralData.referrerId);
        await updateDoc(referrerUserRef, {
          isPremium: true,
        });
        // Also update local premium status
        await PremiumService.setPremiumStatus(true);
      }
    }

    return {
      success: true,
      message: "Referral code applied successfully!",
    };
  }

  /**
   * Get referral count for current user
   */
  static async getReferralCount(): Promise<number> {
    const deviceId = await getDeviceId();
    const code = await this.getMyReferralCode();
    
    const referralRef = doc(db, 'referrals', code);
    const referralSnap = await getDoc(referralRef);

    if (!referralSnap.exists()) {
      return 0;
    }

    return referralSnap.data().referralCount || 0;
  }

  /**
   * Get remaining referrals needed
   */
  static async getRemainingReferrals(): Promise<number> {
    const count = await this.getReferralCount();
    return Math.max(0, REQUIRED_REFERRALS - count);
  }

  /**
   * Check if user has premium via referrals
   */
  static async checkPremiumStatus(): Promise<boolean> {
    const deviceId = await getDeviceId();
    const userRef = doc(db, 'users', deviceId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return false;
    }

    const isPremium = userSnap.data().isPremium || false;
    
    // Sync with local storage
    if (isPremium) {
      await PremiumService.setPremiumStatus(true);
    }

    return isPremium;
  }

  // ... rest of your existing methods (getAppStoreUrls, etc.)
}
```

### Step 7: Add Security Rules

In Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth == null; // For now, allow all (we'll use device ID)
      // In production, you'd want proper authentication
    }
    
    // Anyone can read referrals, but only update their own
    match /referrals/{referralCode} {
      allow read: if true;
      allow write: if request.resource.data.referrerId == request.auth.uid;
      // For now, allow all writes (add proper auth later)
      allow write: if true;
    }
  }
}
```

---

## 🎯 Option 2: Supabase (Alternative - Also Beginner-Friendly)

Supabase is an open-source Firebase alternative with PostgreSQL.

### Why Supabase?
✅ PostgreSQL database (more powerful than Firestore)  
✅ Built-in authentication  
✅ Real-time subscriptions  
✅ Free tier available  
✅ SQL queries (if you know SQL)  

### Setup Steps:

1. Go to [Supabase](https://supabase.com/)
2. Create account and new project
3. Get your project URL and API key
4. Install: `npm install @supabase/supabase-js`
5. Similar structure to Firebase, but uses SQL tables

---

## 🎯 Option 3: Simple Node.js API (More Advanced)

If you want to learn traditional backend development:

1. Use **Vercel** or **Netlify** for free hosting
2. Create serverless functions
3. Use a simple database like **MongoDB Atlas** (free tier)

This requires more setup but gives you more control.

---

## 📋 Implementation Checklist

### Phase 1: Basic Setup
- [ ] Create Firebase project
- [ ] Set up Firestore database
- [ ] Install Firebase SDK in your app
- [ ] Create `firebase.ts` config file
- [ ] Get Firebase config keys

### Phase 2: Update Referral Service
- [ ] Update `getMyReferralCode()` to use Firestore
- [ ] Update `enterReferralCode()` to sync with backend
- [ ] Update `getReferralCount()` to fetch from Firestore
- [ ] Add `checkPremiumStatus()` to sync premium status

### Phase 3: Testing
- [ ] Test referral code generation
- [ ] Test entering referral codes
- [ ] Test referral count updates
- [ ] Test premium activation after 3 referrals

### Phase 4: Security (Later)
- [ ] Add proper authentication
- [ ] Update security rules
- [ ] Add rate limiting
- [ ] Add validation

---

## 🔒 Security Considerations

For now, the basic setup works, but for production:

1. **Add Authentication**: Use Firebase Auth or device-based auth
2. **Rate Limiting**: Prevent abuse (max 1 referral code per device)
3. **Validation**: Verify referral codes are valid
4. **Fraud Prevention**: Track suspicious activity

---

## 💰 Cost Estimate

### Firebase Free Tier:
- **Firestore**: 50K reads, 20K writes per day (FREE)
- **Storage**: 1GB (FREE)
- **Functions**: 2M invocations/month (FREE)

For a small app, you'll likely stay in the free tier!

---

## 🚀 Next Steps

1. **Start with Firebase** - It's the easiest
2. **Follow the steps above** - One at a time
3. **Test locally first** - Make sure it works
4. **Deploy gradually** - Don't rush

---

## 📚 Learning Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Tutorial](https://firebase.google.com/docs/firestore)
- [React Native + Firebase](https://rnfirebase.io/)

---

## ❓ Common Questions

**Q: Do I need to learn backend programming?**  
A: Not really! Firebase handles most of it. You just need to learn how to read/write data.

**Q: Is Firebase free?**  
A: Yes, for small apps. Free tier is very generous.

**Q: Can I switch later?**  
A: Yes! The code is modular, so you can swap Firebase for another service.

**Q: What if I make a mistake?**  
A: No worries! Firebase has a console where you can manually edit/delete data.

---

## 🎯 Recommended Approach

1. **Week 1**: Set up Firebase, get basic read/write working
2. **Week 2**: Integrate with your referral service
3. **Week 3**: Test thoroughly, fix bugs
4. **Week 4**: Add security rules, deploy

Take it slow, test often, and don't be afraid to ask for help!

