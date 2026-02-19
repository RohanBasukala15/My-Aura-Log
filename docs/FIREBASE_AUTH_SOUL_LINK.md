# Firebase Auth for Soul-Link (no login screen)

Firestore rules require `request.auth != null`. The app does **not** use a login screen. Instead it uses **silent auth**:

1. **Custom token**  
   A callable Cloud Function `getAuthToken` returns a Firebase custom token with `uid = deviceId`.

2. **App startup**  
   The app calls `ensureFirebaseAuth()` in the root layout: it gets `deviceId`, calls `getAuthToken({ deviceId })`, then `signInWithCustomToken(auth, token)`. After that, `request.auth.uid === deviceId`, so all existing Firestore usage (user doc id = deviceId) works with the rules.

3. **What you need to do**
   - **Nothing in Firebase Console** for “Sign-in method”. Custom tokens do not require enabling Email/Anonymous/etc.
   - **Enable Firebase Authentication** in Console: **Build → Authentication → Get started** (no sign-in method needed).
   - **Deploy the functions** so the app can get a token:
     ```bash
     cd functions && npm run build && firebase deploy --only functions
     ```
     This deploys `getAuthToken` (and your existing functions).

If `ensureFirebaseAuth()` fails (e.g. no network or function not deployed), Firestore reads/writes will get permission denied until the next successful sign-in.

**If you see `FirebaseError: INTERNAL` or "Must be signed in":**
- **Enable Firebase Authentication**: In Firebase Console go to **Build → Authentication** and click **Get started** (no sign-in method needed).
- **Deploy functions**: `cd functions && npm run build && firebase deploy --only functions`
- **Restart the app** so it can call `getAuthToken` again and sign in.
- If you deployed functions to a region other than US, change `getFunctions(app, "us-central1")` in `common/services/firebase.ts` to your region (e.g. `europe-west1`).

**If you see "Permission 'iam.serviceAccounts.signBlob' denied":**
The Cloud Function’s service account needs permission to sign custom tokens.

1. Open **Google Cloud Console**: https://console.cloud.google.com  
2. Select the **same project** as Firebase (e.g. `my-aura-log`).  
3. Go to **IAM & Admin** → **IAM**.  
4. Find the principal that runs Cloud Functions. It is usually one of:
   - `PROJECT_ID@appspot.gserviceaccount.com` (App Engine default), or  
   - `PROJECT_NUMBER-compute@developer.gserviceaccount.com`  
   (Replace PROJECT_ID / PROJECT_NUMBER with your project’s.)  
5. Click **Edit** (pencil) for that principal.  
6. Click **Add another role**.  
7. Search for **“Service Account Token Creator”** and add it.  
8. Save.  

After a minute, redeploy or wait and try the app again. No code changes needed.
