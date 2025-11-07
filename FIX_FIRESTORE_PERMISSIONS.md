# 🔒 Fix Firestore Permissions Error

## The Problem

Firebase is initialized ✅, but Firestore security rules are blocking access.

Error: `Missing or insufficient permissions`

## Quick Fix

### Option 1: Set Rules to Test Mode (Easiest - For Development)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **my-aura-log**
3. Go to **Firestore Database** (left menu)
4. Click on **"Rules"** tab (top of the page)
5. Replace the rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (for development)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. Click **"Publish"** button

### Option 2: More Secure Rules (For Production Later)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - allow read/write for now
    match /users/{userId} {
      allow read, write: if true;
    }
    
    // Referrals collection - allow read for all, write for updates
    match /referrals/{referralCode} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

## After Updating Rules

1. **Wait 10-20 seconds** for rules to propagate
2. **Restart your app** (reload in Expo Go)
3. **Try again** - errors should be gone!

## Verify It Works

After updating rules:
- ✅ No more "Missing or insufficient permissions" errors
- ✅ Referral codes generate successfully
- ✅ Data appears in Firestore Database
- ✅ Referral counts update

---

**Note**: The test mode rules (`allow read, write: if true`) are fine for development. For production, you'll want to add proper authentication and more restrictive rules.

