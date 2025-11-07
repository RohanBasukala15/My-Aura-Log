# RevenueCat Setup Guide - Quick Start

## ✅ Code is Ready!

The payment integration code is already implemented in your app. You just need to:

1. Set up RevenueCat account
2. Configure products in App Store/Play Store
3. Add API keys to `.env` file

---

## 📋 Step-by-Step Setup

### Step 1: Create RevenueCat Account

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Sign up for free account
3. Create a new project: "My Aura Log"

### Step 2: Add Your App

#### iOS:
1. In RevenueCat dashboard → **Projects** → **Add App**
2. Platform: **iOS**
3. Bundle ID: `com.myauralog.app`
4. App Name: "My Aura Log"

#### Android:
1. In RevenueCat dashboard → **Projects** → **Add App**
2. Platform: **Android**
3. Package Name: `com.myauralog`
4. App Name: "My Aura Log"

### Step 3: Create In-App Purchase Product

#### iOS (App Store Connect):
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **Features** → **In-App Purchases**
3. Click **+** → Select **Non-Consumable**
4. Fill in:
   - **Product ID**: `premium_coffee`
   - **Reference Name**: "Buy Me a Coffee"
   - **Price**: $4.99
   - **Display Name**: "Buy Me a Coffee"
   - **Description**: "Unlock unlimited AI analysis forever"
5. Save and submit for review (if needed)

#### Android (Google Play Console):
1. Go to [Google Play Console](https://play.google.com/console)
2. **Important**: Make sure you have:
   - Paid a $25 one-time registration fee (required for individual accounts)
   - Completed account verification
   - Accepted the Developer Distribution Agreement
3. Select your app (or create one first)
4. In the left sidebar, look for **Monetize** (or **Monetization**)
5. If you don't see "Monetize", you may need to:
   - Complete your app's store listing first
   - Set up a release (even if just internal testing)
   - Wait for account approval (can take 24-48 hours)
6. Navigate to **Monetize** → **Products** → **In-app products**
7. Click **Create product**
8. Fill in:
   - **Product ID**: `premium_coffee`
   - **Name**: "Buy Me a Coffee"
   - **Description**: "Unlock unlimited AI analysis forever"
   - **Price**: $4.99 (or your preferred price)
9. Click **Save** then **Activate** the product

**Note**: If "In-app products" is not visible:
- Your account might still be pending approval
- You may need to create and publish at least one app version first
- Check that you've completed all required setup steps

### Step 4: Configure RevenueCat

1. In RevenueCat dashboard → **Products**
2. Click **Add Product**
3. Product ID: `premium_coffee`
4. Type: **Non-Consumable**
5. Attach to both iOS and Android apps

### Step 5: Set Up Entitlements (Optional but Recommended)

1. In RevenueCat dashboard → **Entitlements**
2. Create entitlement: `premium`
3. Attach product `premium_coffee` to this entitlement

### Step 6: Connect App Store Credentials

#### iOS:
1. In RevenueCat → **App Settings** → **iOS**
2. **App Store Connect API Key**:
   - Go to App Store Connect → **Users and Access** → **Keys**
   - Create new API key
   - Download and upload to RevenueCat
3. **Shared Secret** (optional for one-time purchases):
   - App Store Connect → Your App → **App Information** → **Shared Secret**

#### Android:
1. In RevenueCat → **App Settings** → **Android**
2. **Google Play Service Account**:
   - Google Play Console → **Setup** → **API access**
   - Create service account
   - Download JSON key
   - Upload to RevenueCat

### Step 7: Get API Keys

1. In RevenueCat dashboard → **Projects** → **API Keys**
2. Copy:
   - **iOS Public API Key** (starts with `appl_`)
   - **Android Public API Key** (starts with `goog_`)

### Step 8: Add to .env File

Create `.env` file in project root:

```env
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_your_ios_key_here
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_your_android_key_here
```

### Step 9: Test

1. **Build your app** (RevenueCat requires native build, not Expo Go):
   ```bash
   npx expo prebuild
   npx expo run:ios
   # or
   npx expo run:android
   ```

2. **Test on device** (simulators don't support in-app purchases):
   - Use sandbox/test accounts
   - Try purchasing premium
   - Test restore purchases

---

## 🧪 Testing Accounts

### iOS Sandbox:
1. App Store Connect → **Users and Access** → **Sandbox Testers**
2. Create test account
3. Sign out of real Apple ID in device Settings
4. Purchase will use sandbox account

### Android Testing:
1. Google Play Console → **Setup** → **License testing**
2. Add test account emails
3. Install app via internal testing track
4. Test purchases won't charge real money

---

## ✅ What's Already Done

- ✅ Payment service created (`common/services/paymentService.ts`)
- ✅ Settings screen updated with payment buttons
- ✅ RevenueCat initialization in app startup
- ✅ Error handling and loading states
- ✅ Restore purchases functionality
- ✅ Premium status sync with local storage

---

## 🚀 Once You Add API Keys

After adding API keys to `.env`:

1. Restart your development server
2. Rebuild your app (native build required)
3. Test the purchase flow
4. Deploy to TestFlight/Internal Testing
5. Test with real devices

---

## 📝 Product ID

The code uses `premium_coffee` as the product ID. Make sure this matches:
- ✅ App Store Connect product ID
- ✅ Google Play Console product ID
- ✅ RevenueCat product configuration

---

## 💡 Tips

1. **Test thoroughly** before going live
2. **Handle errors gracefully** (already implemented)
3. **Test restore purchases** on different devices
4. **Monitor RevenueCat dashboard** for purchase analytics
5. **Set up webhooks** (optional) for server-side validation

---

## 🆘 Troubleshooting

**"Payment service is not available"**
- Check if API keys are in `.env` file
- Make sure you restarted the dev server after adding keys
- Verify keys start with `appl_` (iOS) or `goog_` (Android)

**"No offerings available"**
- Check RevenueCat dashboard → Products are configured
- Verify products are attached to your app
- Make sure products are active in App Store/Play Store

**"Purchase failed"**
- Check device is signed in with test account
- Verify product is configured correctly
- Check RevenueCat dashboard for errors

---

## 📚 Resources

- [RevenueCat Docs](https://docs.revenuecat.com/)
- [React Native Purchases](https://github.com/RevenueCat/react-native-purchases)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Google Play Console Guide](https://support.google.com/googleplay/android-developer/)

---

**Ready to go!** Just add your API keys and you're all set! 🚀

