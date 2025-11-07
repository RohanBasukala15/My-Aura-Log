# RevenueCat Offerings Setup - Fix "No Offerings Available" Error

## 🔴 The Problem

You're getting: **"No offerings available. Please check your RevenueCat configuration."**

This happens because RevenueCat requires **Offerings** to be configured. Offerings are how RevenueCat organizes products for purchase.

---

## ✅ Solution: Create an Offering in RevenueCat

### Step 1: Go to RevenueCat Dashboard

1. Log in to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project: "My Aura Log"

### Step 2: Create an Offering

1. In the left sidebar, click **Offerings**
2. Click **+ New Offering** or **Create Offering**
3. Fill in:
   - **Identifier**: `default` (or `premium_offering`)
   - **Display Name**: "Premium Offering" (optional)
   - **Description**: "Premium features" (optional)
4. Click **Create** or **Save**

### Step 3: Add Product to Offering

1. In the offering you just created, click **+ Add Package**
2. Select your product: `premium_coffee`
3. **Package Identifier**: `premium_coffee` (or `$rc_monthly`, `$rc_annual`, etc.)
4. Click **Add**

### Step 4: Set as Current Offering

1. In the Offerings list, find your offering
2. Click the **three dots** (⋯) or **Settings** icon
3. Click **Set as Current Offering**
   - OR toggle the **"Current"** switch to ON
   - OR click **Make Current**

**Important**: RevenueCat requires at least one "Current" offering to work!

---

## 🎯 Quick Setup Checklist

- [ ] Product `premium_coffee` created in App Store/Play Store
- [ ] Product `premium_coffee` added to RevenueCat Products
- [ ] Offering created in RevenueCat
- [ ] Product added to the Offering as a Package
- [ ] Offering set as "Current"
- [ ] Store credentials connected (App Store Connect API key / Google Play Service Account)

---

## 🔧 Alternative: Direct Product Purchase (Fallback)

The code has been updated to also try purchasing directly by product ID if offerings aren't configured. However, **Offerings are still recommended** for better organization and future features.

---

## 📝 Step-by-Step Visual Guide

### In RevenueCat Dashboard:

1. **Navigate to Offerings**:
   ```
   Dashboard → Your Project → Offerings (left sidebar)
   ```

2. **Create New Offering**:
   - Click **+ New Offering**
   - Identifier: `default`
   - Click **Create**

3. **Add Package to Offering**:
   - Click on your offering
   - Click **+ Add Package**
   - Select: `premium_coffee`
   - Package Identifier: `premium_coffee`
   - Click **Add**

4. **Set as Current**:
   - In offerings list, find your offering
   - Click the **"Current"** toggle or **"Make Current"** button
   - Should show a green checkmark or "Current" badge

---

## 🧪 Test After Setup

1. Restart your app
2. Try purchasing premium
3. Should now work without "No offerings available" error

---

## ⚠️ Common Issues

### "Still getting error after creating offering"
- Make sure offering is set as **"Current"**
- Wait a few minutes for RevenueCat to sync
- Check that product is actually added to the offering
- Verify store credentials are connected

### "Product not found in offering"
- Make sure product `premium_coffee` exists in RevenueCat Products
- Make sure product is attached to your iOS/Android app
- Check that product ID matches exactly: `premium_coffee`

### "Offering not showing as current"
- Only one offering can be current at a time
- Make sure you clicked "Set as Current" or toggled the switch
- Refresh the page and check again

---

## 💡 Pro Tips

1. **Use "default" as identifier** - RevenueCat SDK looks for this by default
2. **One current offering** - Only one offering should be "current" at a time
3. **Test in sandbox** - Use test accounts to verify before going live
4. **Check logs** - RevenueCat dashboard shows purchase events and errors

---

## 📚 Resources

- [RevenueCat Offerings Docs](https://docs.revenuecat.com/docs/entitlements)
- [RevenueCat Dashboard](https://app.revenuecat.com)
- [RevenueCat Support](https://community.revenuecat.com/)

---

**After setting up the offering, the error should be resolved!** 🎉

