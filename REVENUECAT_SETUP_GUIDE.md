# RevenueCat Setup Guide - Step by Step

## Overview
You want to set up:
1. **$5 Lifetime Purchase** (one-time) - "premium_lifetime"
2. **$1.99/month Subscription** (recurring) - "premium_monthly"

## RevenueCat Concepts (Important!)

**Products** = The actual in-app purchases in App Store/Google Play
**Packages** = Groups products across iOS & Android together
**Offerings** = Collections of packages you show to users

**Order of Operations:**
1. Create Products in App Store Connect / Google Play Console FIRST
2. Then create Packages in RevenueCat (link to products)
3. Then create Offerings in RevenueCat (contain packages)

---

## STEP 1: Create Products in App Stores

### iOS - App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **Features** → **In-App Purchases**
4. Click **+** to create new in-app purchase

#### For Lifetime Purchase ($5):
- **Type**: Non-Consumable
- **Product ID**: `premium_lifetime` (must match exactly!)
- **Reference Name**: Premium Coffee (Lifetime)
- **Price**: $4.99 or $5.00 (your choice)
- **Description**: Lifetime premium access to My Aura Log
- **Review Information**: Add screenshots/description for review
- Click **Save**

#### For Monthly Subscription ($1.99):
- **Type**: Auto-Renewable Subscription
- **Product ID**: `premium_monthly` (must match exactly!)
- **Reference Name**: Premium Monthly
- **Subscription Group**: Create new group or use existing
- **Subscription Duration**: 1 Month
- **Price**: $1.99
- **Description**: Monthly premium subscription to My Aura Log
- **Review Information**: Add screenshots/description for review
- Click **Save**

**⚠️ IMPORTANT**: Submit these for review in App Store Connect. They need to be approved before you can test!

### Android - Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Monetize** → **Products** → **In-app products** or **Subscriptions**

#### For Lifetime Purchase ($5):
- **Product Type**: In-app product (one-time)
- **Product ID**: `premium_lifetime` (must match exactly!)
- **Name**: Premium Coffee (Lifetime)
- **Description**: Lifetime premium access to My Aura Log
- **Price**: $4.99 or $5.00
- Click **Save**

#### For Monthly Subscription ($1.99):
- **Product Type**: Subscription
- **Product ID**: `premium_monthly` (must match exactly!)
- **Name**: Premium Monthly
- **Billing period**: 1 month
- **Price**: $1.99
- **Description**: Monthly premium subscription to My Aura Log
- Click **Save**

**⚠️ IMPORTANT**: Activate these products in Google Play Console. They need to be active before you can test!

---

## STEP 2: Create Packages in RevenueCat

1. Go to [app.revenuecat.com](https://app.revenuecat.com)
2. Select your project
3. Go to **Products** tab (left sidebar)
4. You should see your products appear automatically after linking your stores

### Create Package for Lifetime Purchase:

1. Go to **Offerings** tab (left sidebar)
2. Click on your existing offering (or create a new one)
3. Click **+ Add Package** button
4. Fill in:
   - **Identifier**: `lifetime` (this is just for RevenueCat, can be anything)
   - **Display Name**: Premium Coffee (Lifetime)
   - **Select Products**: 
     - ✅ Check `premium_lifetime` for iOS
     - ✅ Check `premium_lifetime` for Android
5. Click **Save**

### Create Package for Monthly Subscription:

1. In the same offering, click **+ Add Package** again
2. Fill in:
   - **Identifier**: `monthly` (this is just for RevenueCat, can be anything)
   - **Display Name**: Premium Monthly
   - **Select Products**: 
     - ✅ Check `premium_monthly` for iOS
     - ✅ Check `premium_monthly` for Android
3. Click **Save**

---

## STEP 3: Create/Update Offering in RevenueCat

1. Go to **Offerings** tab
2. If you already have an offering, click on it. Otherwise, click **+ New Offering**
3. Fill in:
   - **Identifier**: `default` (or keep existing)
   - **Display Name**: Premium Options
4. Make sure both packages are added:
   - `lifetime` package (Premium Coffee)
   - `monthly` package (Premium Monthly)
5. Click **Save**

**💡 Tip**: You can reorder packages by dragging them. Put the most popular option first!

---

## STEP 4: Configure Entitlements

1. Go to **Entitlements** tab (left sidebar)
2. Make sure you have an entitlement called `premium` (or create it)
3. Click on the `premium` entitlement
4. Under **Products**, make sure both products are linked:
   - `premium_lifetime` ✅
   - `premium_monthly` ✅
5. Click **Save**

**Why?** This tells RevenueCat that both products grant the same "premium" access.

---

## STEP 5: Testing Setup

### iOS Testing:
- Use **Sandbox Tester** account in App Store Connect
- Sign out of App Store on your device
- When testing, you'll be prompted to sign in with sandbox account

### Android Testing:
- Use **License Testing** in Google Play Console
- Add your test email addresses
- Products will be available for testing immediately

---

## STEP 6: Update Your Code

The code has been updated to support both products. Make sure:

1. **Product IDs match exactly**:
   - `premium_lifetime` for lifetime
   - `premium_monthly` for subscription

2. **Entitlement ID matches**: `premium`

3. **Package identifiers** (optional, for better UX):
   - `lifetime` for lifetime package
   - `monthly` for monthly package

---

## Common Issues & Solutions

### ❌ "No offerings available"
- **Solution**: Make sure products are approved/active in stores
- **Solution**: Check that packages are added to the offering
- **Solution**: Verify API keys are correct

### ❌ "Product not found"
- **Solution**: Product IDs must match exactly (case-sensitive!)
- **Solution**: Products must be approved/active in stores
- **Solution**: Wait a few minutes after creating products (propagation delay)

### ❌ "Purchase failed"
- **Solution**: Use sandbox/test accounts
- **Solution**: Check that products are in "Ready to Submit" or "Approved" status
- **Solution**: Verify RevenueCat dashboard shows products synced

---

## Next Steps After Setup

1. Test both purchase flows
2. Test restore purchases
3. Update UI to show both options with prices
4. Consider adding a discount/promo for first month

---

## Need Help?

- RevenueCat Docs: https://docs.revenuecat.com
- RevenueCat Support: support@revenuecat.com
- Check RevenueCat dashboard for sync status
