# Payment Integration Guide - Buy Me a Coffee

## 🎯 Goal
Implement one-time payment ($5) using **Apple Pay (iOS)** and **Google Pay (Android)** only.

---

## 📱 Recommended Solution: **RevenueCat**

RevenueCat is the easiest and most reliable option for in-app purchases. It handles:
- ✅ Apple Pay (via App Store)
- ✅ Google Pay (via Google Play)
- ✅ Receipt validation
- ✅ Cross-platform support
- ✅ Simple setup

---

## 🚀 Option 1: RevenueCat (Recommended)

### Step 1: Install RevenueCat

```bash
npm install react-native-purchases
# or
yarn add react-native-purchases

# For Expo
npx expo install react-native-purchases
```

### Step 2: Set Up RevenueCat Account

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Create a free account
3. Create a new project
4. Add your app:
   - **iOS**: Bundle ID: `com.myauralog.app`
   - **Android**: Package name: `com.myauralog`

### Step 3: Configure App Store Connect (iOS)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → **Features** → **In-App Purchases**
3. Click **+** → **Non-Consumable** (one-time purchase)
4. Create product:
   - **Product ID**: `premium_coffee`
   - **Price**: $4.99 (or $5.00)
   - **Display Name**: "Buy Me a Coffee"
   - **Description**: "Unlock unlimited AI analysis forever"

### Step 4: Configure Google Play Console (Android)

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to your app → **Monetize** → **Products** → **In-app products**
3. Click **Create product**
4. Create product:
   - **Product ID**: `premium_coffee`
   - **Name**: "Buy Me a Coffee"
   - **Description**: "Unlock unlimited AI analysis forever"
   - **Price**: $4.99

### Step 5: Configure RevenueCat

1. In RevenueCat dashboard:
   - Go to **Products** → **Add Product**
   - Product ID: `premium_coffee`
   - Type: **Non-Consumable**
   - Attach to both iOS and Android

2. Get your API keys:
   - **Public API Key**: Found in RevenueCat dashboard
   - Add to your `.env` file

### Step 6: Update Your Code

#### Update `.env` file:
```env
EXPO_PUBLIC_REVENUECAT_API_KEY=your_public_api_key_here
```

#### Create payment service:

```typescript
// common/services/paymentService.ts
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { PremiumService } from './premiumService';

const REVENUECAT_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
  android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
  default: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
});

export class PaymentService {
  static async initialize() {
    if (!REVENUECAT_API_KEY) {
      console.warn('RevenueCat API key not found');
      return;
    }
    
    try {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY! });
      console.log('RevenueCat initialized');
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
    }
  }

  static async purchasePremium(): Promise<boolean> {
    try {
      // Get available offerings
      const offerings = await Purchases.getOfferings();
      
      if (!offerings.current) {
        throw new Error('No offerings available');
      }

      // Find the premium package
      const premiumPackage = offerings.current.availablePackages.find(
        (pkg: PurchasesPackage) => pkg.identifier === 'premium_coffee'
      );

      if (!premiumPackage) {
        // Fallback: use first package
        const firstPackage = offerings.current.availablePackages[0];
        if (!firstPackage) {
          throw new Error('No packages available');
        }
        
        const { customerInfo } = await Purchases.purchasePackage(firstPackage);
        
        // Check if purchase was successful
        if (customerInfo.entitlements.active['premium']) {
          await PremiumService.setPremiumStatus(true);
          return true;
        }
        return false;
      }

      // Purchase the package
      const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
      
      // Check if purchase was successful
      if (customerInfo.entitlements.active['premium']) {
        await PremiumService.setPremiumStatus(true);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Purchase error:', error);
      
      // Handle user cancellation
      if (error.userCancelled) {
        throw new Error('Purchase cancelled');
      }
      
      throw error;
    }
  }

  static async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      if (customerInfo.entitlements.active['premium']) {
        await PremiumService.setPremiumStatus(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  }

  static async checkPremiumStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return !!customerInfo.entitlements.active['premium'];
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }
}
```

#### Update `app/_layout.tsx` to initialize RevenueCat:

```typescript
import { PaymentService } from '@common/services/paymentService';

// In your Root component or early in app lifecycle
useEffect(() => {
  PaymentService.initialize();
}, []);
```

#### Update Settings screen to use real payment:

```typescript
// In app/(home)/(tabs)/settings.tsx
import { PaymentService } from '@common/services/paymentService';

const handleBuyPremium = async () => {
  Alert.alert(
    "Buy Me a Coffee ☕",
    "Support My Aura Log with a $5 one-time payment to unlock unlimited AI analysis.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Buy Premium ($5)",
        style: "default",
        onPress: async () => {
          setIsLoading(true);
          try {
            const success = await PaymentService.purchasePremium();
            if (success) {
              await loadPremiumStatus();
              Toast.show({
                type: "success",
                text1: "Premium Activated! 🎉",
                text2: "Thank you for your support!",
              });
            } else {
              Toast.show({
                type: "error",
                text1: "Purchase failed",
                text2: "Please try again",
              });
            }
          } catch (error: any) {
            if (error.message === 'Purchase cancelled') {
              Toast.show({
                type: "info",
                text1: "Purchase cancelled",
              });
            } else {
              Toast.show({
                type: "error",
                text1: "Purchase failed",
                text2: error.message || "Please try again",
              });
            }
          } finally {
            setIsLoading(false);
          }
        },
      },
      {
        text: "Restore Purchases",
        style: "default",
        onPress: async () => {
          setIsLoading(true);
          try {
            const restored = await PaymentService.restorePurchases();
            if (restored) {
              await loadPremiumStatus();
              Toast.show({
                type: "success",
                text1: "Purchases restored!",
              });
            } else {
              Toast.show({
                type: "info",
                text1: "No purchases found to restore",
              });
            }
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Failed to restore purchases",
            });
          } finally {
            setIsLoading(false);
          }
        },
      },
    ],
    { cancelable: true }
  );
};
```

---

## 🔧 Option 2: Expo In-App Purchases (Simpler, but more manual)

### Step 1: Install

```bash
npx expo install expo-in-app-purchases
```

### Step 2: Configure Products

Same as RevenueCat - configure in App Store Connect and Google Play Console.

### Step 3: Implementation

```typescript
// common/services/paymentService.ts
import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';
import { PremiumService } from './premiumService';

export class PaymentService {
  static async initialize() {
    try {
      const isAvailable = await InAppPurchases.isAvailableAsync();
      if (!isAvailable) {
        console.warn('In-app purchases not available');
        return;
      }
      await InAppPurchases.connectAsync();
    } catch (error) {
      console.error('Error connecting to store:', error);
    }
  }

  static async purchasePremium(): Promise<boolean> {
    try {
      await InAppPurchases.connectAsync();
      
      // Get products
      const products = await InAppPurchases.getProductsAsync(['premium_coffee']);
      
      if (products.results.length === 0) {
        throw new Error('Product not found');
      }

      // Purchase
      await InAppPurchases.purchaseItemAsync('premium_coffee');
      
      // Listen for purchase updates
      const purchase = await InAppPurchases.getPurchaseHistoryAsync();
      
      // Verify purchase
      if (purchase.results.length > 0) {
        await PremiumService.setPremiumStatus(true);
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (error.code === 'E_USER_CANCELLED') {
        throw new Error('Purchase cancelled');
      }
      throw error;
    }
  }
}
```

---

## 📋 Setup Checklist

### iOS Setup:
- [ ] Create RevenueCat account
- [ ] Add app in App Store Connect
- [ ] Create in-app purchase product
- [ ] Configure RevenueCat with App Store credentials
- [ ] Get RevenueCat API key
- [ ] Add to `.env` file

### Android Setup:
- [ ] Add app in Google Play Console
- [ ] Create in-app product
- [ ] Configure RevenueCat with Google Play credentials
- [ ] Get RevenueCat API key
- [ ] Add to `.env` file

### Code Setup:
- [ ] Install `react-native-purchases`
- [ ] Create `paymentService.ts`
- [ ] Initialize RevenueCat in `app/_layout.tsx`
- [ ] Update Settings screen with real payment
- [ ] Add restore purchases functionality
- [ ] Test on both platforms

---

## 💰 Pricing

### RevenueCat:
- **Free**: Up to $10k monthly revenue
- **After**: 1% of revenue + $0.10 per paying user

### App Store / Google Play:
- **iOS**: 15-30% commission (15% for subscriptions after year 1, 30% for one-time)
- **Android**: 15-30% commission (15% for subscriptions after year 1, 30% for one-time)

### Your $5 Purchase:
- **Revenue**: $5.00
- **After fees**: ~$3.50 (30% commission)
- **Net profit**: ~$3.50 per purchase

---

## 🧪 Testing

### iOS Testing:
1. Use **Sandbox** test accounts in App Store Connect
2. Sign out of real Apple ID in Settings
3. Test purchase will use sandbox account

### Android Testing:
1. Add test accounts in Google Play Console
2. Install app via internal testing track
3. Test purchases won't charge real money

---

## 🎯 Recommendation

**Use RevenueCat** because:
- ✅ Handles receipt validation automatically
- ✅ Cross-platform support
- ✅ Restore purchases built-in
- ✅ Better error handling
- ✅ Analytics dashboard
- ✅ Free for small apps

---

## 📚 Resources

- [RevenueCat Docs](https://docs.revenuecat.com/)
- [React Native Purchases](https://github.com/RevenueCat/react-native-purchases)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Google Play Console Guide](https://support.google.com/googleplay/android-developer/)

---

## ⚠️ Important Notes

1. **Test thoroughly** before going live
2. **Handle errors gracefully** (network issues, cancellations, etc.)
3. **Add restore purchases** button for users who switch devices
4. **Validate receipts** server-side in production (RevenueCat does this)
5. **Test on real devices** - simulators don't support in-app purchases
6. **Comply with App Store/Play Store guidelines** - show prices clearly, handle refunds

---

Would you like me to implement the RevenueCat integration in your codebase?

