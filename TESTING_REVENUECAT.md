# 🧪 Testing RevenueCat Features

Complete guide for testing RevenueCat purchases, restore, and premium status in your app.

## 📋 Prerequisites

1. **RevenueCat Dashboard Setup**
   - ✅ Products configured in RevenueCat dashboard
   - ✅ Offerings created with your product (`premium_lifetime`)
   - ✅ Entitlement (`premium`) configured
   - ✅ API keys set as EAS secrets (see `EAS_SECRETS_SETUP.md`)

2. **Store Configuration**
   - **iOS**: Product configured in App Store Connect
   - **Android**: Product configured in Google Play Console

## 🎯 Testing Methods

### Method 1: Sandbox Testing (Recommended)

#### iOS Sandbox Testing

1. **Create Sandbox Tester Account**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Users and Access → Sandbox Testers
   - Create a new sandbox tester (use a different email than your Apple ID)

2. **Test on Device/Simulator**
   ```bash
   # Build and install development client
   yarn build:dev:ios
   # or
   eas build --platform ios --profile development --local --non-interactive
   ```

3. **Sign in with Sandbox Account**
   - When prompted during purchase, sign in with your sandbox tester account
   - Use the sandbox email (not your real Apple ID)

4. **Test Purchase Flow**
   - Open app → Settings → "Unlock Premium ($5)"
   - Complete purchase with sandbox account
   - Verify premium status updates

#### Android Sandbox Testing

1. **Create Test Account**
   - Go to [Google Play Console](https://play.google.com/console)
   - Setup → License Testing
   - Add test email addresses

2. **Test on Device**
   ```bash
   # Build and install development client
   yarn build:dev:android
   # or
   eas build --platform android --profile development --local --non-interactive
   ```

3. **Test Purchase Flow**
   - Open app → Settings → "Unlock Premium ($5)"
   - Complete purchase (will use test account automatically)
   - Verify premium status updates

### Method 2: Local Testing with Debug Logs

1. **Enable Debug Logging**
   - RevenueCat logs are already enabled in `paymentService.ts`
   - Check console for:
     - `🔑 RevenueCat API Key check`
     - `✅ RevenueCat initialized successfully`
     - Purchase flow logs

2. **Test in Development**
   ```bash
   # Start Metro bundler
   yarn start
   
   # Run on device/simulator
   yarn ios
   # or
   yarn android
   ```

3. **Monitor Console Output**
   - Watch for initialization logs
   - Check for API key presence
   - Monitor purchase flow errors

## 🔍 Testing Scenarios

### 1. Test Purchase Flow

**Steps:**
1. Open app → Settings
2. Tap "Unlock Premium ($5)"
3. Confirm purchase dialog
4. Complete purchase (sandbox/test account)
5. Verify:
   - ✅ Premium status shows as active
   - ✅ Toast shows "Premium unlocked! 🎉"
   - ✅ Settings screen shows premium badge

**Expected Console Logs:**
```
🔑 RevenueCat API Key check: { hasKey: true, keyLength: 50, platform: 'ios', ... }
✅ RevenueCat initialized successfully
💳 Payment service available: true
```

### 2. Test Restore Purchases

**Steps:**
1. Open app → Settings
2. Tap "Restore Purchases"
3. Verify:
   - ✅ If premium was purchased, status restores
   - ✅ Toast shows success/error message

**Expected Behavior:**
- If purchase exists: Premium status restored
- If no purchase: Shows "No purchases to restore"

### 3. Test Premium Status Check

**Code to test:**
```typescript
import { PaymentService } from '@common/services/paymentService';

// Check premium status
const isPremium = await PaymentService.checkPremiumStatus();
console.log('Premium status:', isPremium);
```

**Expected:**
- Returns `true` if user has active premium
- Returns `false` if no premium access

### 4. Test Error Handling

**Test Cases:**
1. **Network Error**: Turn off internet, try purchase
2. **User Cancellation**: Start purchase, cancel it
3. **Invalid Configuration**: Test with wrong API key

**Expected Error Messages:**
- Network error: "Network error. Please check your connection..."
- Cancelled: "Purchase cancelled"
- Configuration: "Payment service is not available..."

## 🐛 Debugging Tips

### Check API Keys

```typescript
// In paymentService.ts, check console for:
console.log('🔑 RevenueCat API Key check:', {
  hasKey: !!apiKey,
  keyLength: apiKey?.length,
  platform: Platform.OS,
  iosKey: !!REVENUECAT_API_KEY_IOS,
  androidKey: !!REVENUECAT_API_KEY_ANDROID,
});
```

### Verify RevenueCat Configuration

1. **Check Dashboard:**
   - Products → Verify `premium_lifetime` exists
   - Offerings → Verify offering has package with `premium_lifetime`
   - Entitlements → Verify `premium` entitlement exists

2. **Check Product IDs Match:**
   - Code: `PRODUCT_ID = "premium_lifetime"`
   - RevenueCat: Product identifier should match
   - Store: SKU should match

### Common Issues

**Issue: "No offerings available"**
- ✅ **Solution**: Create offering in RevenueCat dashboard
- ✅ **Check**: Offerings → Create offering → Add package

**Issue: "No packages available"**
- ✅ **Solution**: Add product to offering package
- ✅ **Check**: Offerings → Edit → Add package → Select product

**Issue: "Payment service is not available"**
- ✅ **Solution**: Check EAS secrets are set
- ✅ **Run**: `eas secret:list` to verify
- ✅ **Check**: Console logs for API key presence

**Issue: Purchase succeeds but premium not activated**
- ✅ **Solution**: Check entitlement configuration
- ✅ **Check**: Entitlements → `premium` → Verify product attached
- ✅ **Check**: `hasPremiumAccess()` method logic

## 📱 Testing on Real Device (Required for Full Testing)

**Why test on device:**
- Payment flows require real device (not simulator/emulator)
- Google Play Billing only works on real Android devices
- App Store purchases only work on real iOS devices

**Steps:**
1. Build with EAS: `eas build --platform android --profile preview`
2. Install APK on your Android device
3. Test the full payment flow
4. Verify in RevenueCat dashboard → Customers tab

## 🎯 Verify in RevenueCat Dashboard

**After testing, check:**

1. **Customers Tab**
   - Should see test purchases
   - Customer ID matches your device

2. **Events Tab**
   - Should show purchase events
   - Verify transaction details

3. **Revenue Tab**
   - Should show test revenue (if configured)

## 🔄 Testing Restore on New Device

**Simulate device switch:**

1. Purchase premium on Device A
2. Install app on Device B (or reinstall)
3. Tap "Restore Purchases"
4. Verify premium status restores

## 📝 Test Checklist

- [ ] RevenueCat initializes successfully
- [ ] API keys are loaded correctly
- [ ] Purchase flow works (sandbox)
- [ ] Premium status updates after purchase
- [ ] Restore purchases works
- [ ] Error handling works (network, cancellation)
- [ ] Premium status persists across app restarts
- [ ] RevenueCat dashboard shows test purchases
- [ ] Test on both iOS and Android (if applicable)

## 🚀 Quick Test Command

```bash
# 1. Start Metro
yarn start

# 2. Run on device (in another terminal)
yarn ios
# or
yarn android

# 3. Navigate to Settings → Test purchase flow
```

## 📚 Additional Resources

- [RevenueCat Testing Guide](https://docs.revenuecat.com/docs/testing)
- [iOS Sandbox Testing](https://developer.apple.com/apple-pay/testing/)
- [Android Test Purchases](https://developer.android.com/google/play/billing/test)
- [RevenueCat Dashboard](https://app.revenuecat.com/)

## 💡 Pro Tips

1. **Use Sandbox Accounts**: Never use real payment methods for testing
2. **Check Console Logs**: RevenueCat logs are verbose and helpful
3. **Verify Dashboard**: Always check RevenueCat dashboard after testing
4. **Test Error Cases**: Don't just test happy path
5. **Test Restore**: Critical for user experience when switching devices


