# 🔥 Get Your Firebase Web Config

You already have Firebase set up! Now you just need the **web app config** for Firestore.

## Quick Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **my-aura-log**
3. Click the **gear icon** ⚙️ → **Project settings**
4. Scroll down to **"Your apps"** section
5. Look for a **web app** (icon: `</>`)
   - If you see one, click on it and copy the config
   - If you DON'T see one, click **"Add app"** → **Web icon** `</>`
6. Register it (name: "My Aura Log Web")
7. **Copy the `firebaseConfig` object**

It will look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDHiTj-GuEJoDSAKPKN_XTw49u9mGqdqb4",
  authDomain: "my-aura-log.firebaseapp.com",
  projectId: "my-aura-log",
  storageBucket: "my-aura-log.firebasestorage.app",
  messagingSenderId: "1037142646223",
  appId: "1:1037142646223:web:xxxxx"
};
```

## Then Add to Your Code:

Open `common/services/firebase.ts` and replace the placeholder values with your actual config.

---

**Note**: The `google-services.json` file you have is for native Android setup, but since we're using Expo with Web SDK, we use the web config instead.

