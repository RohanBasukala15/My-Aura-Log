# Production Readiness Checklist

## 🔴 Critical Issues (MUST FIX before production)

### 1. ✅ Firestore Security Rules
- [x] **FIXED**: Updated `firestore.rules` with proper authentication
- [ ] **ACTION REQUIRED**: Deploy rules to Firebase
  ```bash
  firebase deploy --only firestore:rules
  ```

### 2. ✅ Build Configuration
- [x] **FIXED**: Removed invalid JSON comment from `eas.json`

### 3. ⚠️ Environment Variables Setup
- [ ] **ACTION REQUIRED**: Create `.env` file from `.env.example`
- [ ] **ACTION REQUIRED**: Fill in actual Firebase credentials
- [ ] **ACTION REQUIRED**: Add OpenAI API key (optional, app works without it)
- [ ] **ACTION REQUIRED**: Add RevenueCat keys (optional, for payments)

**Steps:**
```bash
cp .env.example .env
# Then edit .env with your actual credentials
```

### 4. ⚠️ Remove Hardcoded Firebase Credentials
- [ ] **ACTION REQUIRED**: Remove default values from `common/services/firebase.ts` (lines 36-42)
- [ ] Make sure all credentials come from environment variables only

**Recommended change:**
```typescript
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};
```

### 5. ✅ Legal Documents - IMPROVED!
- [x] **FIXED**: Created dynamic system that doesn't require code updates
- [ ] **ACTION REQUIRED**: Set up GitHub Pages for stable URLs (5 minutes)
- [ ] **ACTION REQUIRED**: Update URLs in `LegalDocumentConfig.ts` (once)

**New Implementation:**
- ✅ No more hardcoded Gist URLs!
- ✅ Configure URLs once in `LegalDocumentConfig.ts`
- ✅ Update documents anytime without touching code
- ✅ Uses built-in `expo-web-browser` (no package installation)

**Setup Steps:**
1. Enable GitHub Pages: Settings → Pages → Source: main/docs
2. Wait 2-3 minutes for deployment
3. Update URLs in `common/screens/settings/LegalDocumentConfig.ts`
4. Done! Update docs anytime by just editing HTML files

**See detailed guide:** `docs/LEGAL_DOCS_SETUP.md` & `docs/HOSTING_GUIDE.md`

---

## 📝 Important Pre-Build Steps

### 6. Git Repository Cleanup
- [ ] Review all modified files
- [ ] Commit or discard changes:
  ```bash
  git status
  git add .
  git commit -m "Prepare for production build"
  ```
- [ ] Confirm deletion of documentation files (or restore if needed)

### 7. Version Management
- [ ] Verify app version in `app.config.js` is correct (currently 1.0.0)
- [ ] Ensure Android versionCode is set
- [ ] Update `appVersionSource` to "remote" after first release (currently "local")

### 8. Test Core Functionality
- [ ] Test app without Firebase credentials (should use mock mode)
- [ ] Test app with Firebase credentials
- [ ] Test authentication flow
- [ ] Test journal entry creation/editing
- [ ] Test premium features (if implemented)
- [ ] Test on physical devices (iOS and Android)

### 9. Privacy & Security Review
- [ ] Firebase authentication enabled and configured
- [ ] Firestore rules deployed and tested
- [ ] No API keys or secrets in code (all in .env)
- [ ] Privacy policy accessible and accurate
- [ ] Terms & conditions accessible and accurate

### 10. Store Preparation
- [ ] App Store Connect account ready (iOS)
- [ ] Google Play Console account ready (Android)
- [ ] App icons prepared (512x512 for stores)
- [ ] Screenshots prepared
- [ ] App description written
- [ ] Keywords/categories defined
- [ ] Support email configured

---

## 🚀 Building for Production

### Android Production Build
```bash
eas build --platform android --profile production
```

### iOS Production Build
```bash
eas build --platform ios --profile production
```

### Before Building:
1. ✅ All critical issues above resolved
2. ✅ Environment variables configured
3. ✅ Firebase rules deployed
4. ✅ Code committed to git
5. ✅ Tested on physical devices

---

## 📋 Post-Build Checklist

### After Building:
- [ ] Test the production build on physical device
- [ ] Verify all features work as expected
- [ ] Check app performance and loading times
- [ ] Test offline functionality
- [ ] Verify push notifications (if implemented)
- [ ] Test in-app purchases (if implemented)

### Before Store Submission:
- [ ] App reviewed by team/testers
- [ ] All store assets uploaded (icons, screenshots, etc.)
- [ ] Privacy policy URL added to store listings
- [ ] Support contact information provided
- [ ] App rating/content rating completed

---

## ⚠️ Current Issues Summary

**BLOCKING Issues (Must fix):**
1. 🔴 Firestore rules need to be deployed to Firebase
2. 🔴 Create `.env` file with actual credentials
3. 🔴 Remove hardcoded Firebase credentials from code

**HIGH Priority (Should fix):**
4. 🟡 Host legal documents on reliable service
5. 🟡 Commit all changes to git
6. 🟡 Test thoroughly on physical devices

**MEDIUM Priority (Good to have):**
7. 🟢 Set up Firebase Authentication (if not already done)
8. 🟢 Configure RevenueCat for payments (if using premium features)
9. 🟢 Add OpenAI API key (for AI insights feature)

---

## 💡 Recommendations

### For a Successful Launch:
1. **Start with Android** - Easier approval process, faster review
2. **Use internal testing** - Test with small group before public release
3. **Monitor Firebase usage** - Set up billing alerts
4. **Enable crash reporting** - Use Firebase Crashlytics or Sentry
5. **Set up analytics** - Track user behavior and app performance
6. **Plan for updates** - Use EAS Updates for bug fixes without store approval

### Security Best Practices:
- ✅ Never commit `.env` files to git
- ✅ Use environment variables for all secrets
- ✅ Enable Firebase App Check for additional security
- ✅ Regularly review and update dependencies
- ✅ Monitor Firebase security rules in production

---

## 📞 Need Help?

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Firebase Console](https://console.firebase.google.com/)
- [RevenueCat Dashboard](https://app.revenuecat.com/)

---

**Last Updated:** $(date)
**App Version:** 1.0.0

