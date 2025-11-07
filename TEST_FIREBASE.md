# 🧪 Testing Firebase Integration

## ✅ Good News: Expo Go Works!

You **don't need a development build** - Expo Go works perfectly with Firebase Web SDK!

---

## 🚀 Quick Test Steps

### 1. Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
npm start
# or
yarn start
```

### 2. Open in Expo Go

- Scan QR code with Expo Go app
- Or press `a` for Android emulator
- Or press `i` for iOS simulator

### 3. Check Console Logs

Look for these messages:

**✅ Success:**
```
✅ Firebase initialized successfully
```

**❌ If you see errors:**
- Check your Firebase config in `firebase.ts`
- Make sure Firestore is enabled in Firebase Console
- Check internet connection

---

## 🧪 Test the Referral System

### Test 1: Generate Referral Code
1. Open app → Settings tab
2. Scroll to "Upgrade to Premium" section
3. You should see your referral code displayed
4. **Check Firebase Console** → Firestore Database
5. Look for `users/` collection with your device ID

### Test 2: Enter Referral Code
1. In Settings, click "📝 Enter a Friend's Referral Code"
2. Enter a test code (or use your own code from another device)
3. Should show success/error message
4. **Check Firebase Console** → Firestore Database
5. Look for `referrals/` collection

### Test 3: Check Referral Count
1. After entering a code, check referral progress
2. Should show "Referral Progress: X / 3"
3. **Check Firebase Console** → Firestore Database
4. Look at `referrals/{code}/referralCount`

---

## 🔍 What to Check in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **my-aura-log**
3. Go to **Firestore Database**
4. You should see:
   - `users/` collection (user data)
   - `referrals/` collection (referral tracking)

---

## 🐛 Troubleshooting

### "Firebase not initialized"
- ✅ Check console for error messages
- ✅ Verify config in `firebase.ts`
- ✅ Make sure Firestore is enabled
- ✅ Check internet connection

### "Permission denied"
- ✅ Go to Firebase Console → Firestore → Rules
- ✅ Make sure rules allow read/write (test mode)

### Data not appearing?
- ✅ Check internet connection
- ✅ Look for errors in console
- ✅ Verify Firestore is in "test mode"

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Console shows "Firebase initialized successfully"
- ✅ Referral code appears in Settings
- ✅ Data appears in Firebase Console → Firestore
- ✅ No errors in console

---

**You're ready to test!** Just restart your dev server and open in Expo Go! 🚀

