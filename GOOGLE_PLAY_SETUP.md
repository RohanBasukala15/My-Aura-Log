# Google Play Console Setup - Troubleshooting Guide

## 🔍 Can't See "In-app Products" Section?

If you've set up an individual Google Play Console account but can't see the in-app products section, here's what to check:

---

## ✅ Required Steps (In Order)

### 1. Account Setup
- [ ] Paid $25 one-time registration fee
- [ ] Completed account verification (identity check)
- [ ] Accepted Developer Distribution Agreement
- [ ] Account status is **Active** (not pending)

### 2. App Creation
- [ ] Created your app in Google Play Console
- [ ] App is in **Draft** or **Published** status
- [ ] Completed basic app information:
  - App name: "My Aura Log"
  - Package name: `com.myauralog`
  - Default language
  - App category

### 3. Store Listing (Minimum Required)
- [ ] App icon uploaded
- [ ] Feature graphic uploaded
- [ ] Short description (80 chars)
- [ ] Full description
- [ ] At least 2 screenshots

### 4. First Release (Required for In-App Products)
- [ ] Created at least one release (can be internal testing)
- [ ] Uploaded an APK/AAB file
- [ ] Release is in draft or published state

---

## 🚫 Common Issues

### Issue 1: "Monetize" Section Not Visible

**Solution:**
1. Make sure your app has at least one release created
2. Complete your store listing (minimum requirements)
3. Wait 24-48 hours after account approval
4. Try refreshing the page or using a different browser

### Issue 2: "In-app products" Not Showing

**Solution:**
1. You MUST have created at least one release first
2. Your app must be in a valid state (not just created)
3. Check that you're looking at the correct app
4. Try navigating: **App** → **Monetize** → **Products** → **In-app products**

### Issue 3: Account Still Pending

**Solution:**
- Check your email for verification requests
- Complete identity verification if requested
- Wait for Google's approval (usually 24-48 hours)
- Check account status in Google Play Console → **Settings** → **Account details**

---

## 📍 Where to Find In-App Products

**Correct Path:**
1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app: **My Aura Log**
3. In left sidebar, click **Monetize** (or **Monetization setup**)
4. Click **Products** tab
5. Click **In-app products** sub-tab
6. Click **Create product** button

**Alternative Path (if Monetize isn't visible):**
1. Go to your app
2. Click **Monetization** in the left menu
3. Or go to **Monetize products** directly

---

## 🎯 Step-by-Step Walkthrough

### Step 1: Create App (if not done)
1. Play Console → **Create app**
2. App name: "My Aura Log"
3. Default language: English (or your preference)
4. App or game: **App**
5. Free or paid: **Free**
6. Accept declarations
7. Click **Create app**

### Step 2: Complete Store Listing
1. App → **Store listing**
2. Fill in required fields:
   - App icon (512x512 PNG)
   - Feature graphic (1024x500)
   - Short description
   - Full description
   - Screenshots (at least 2)
3. Click **Save**

### Step 3: Create Internal Testing Release
1. App → **Release** → **Production** (or **Internal testing**)
2. Click **Create new release**
3. Upload your APK/AAB file (you can use a test build)
4. Fill in release notes
5. Click **Save** → **Review release** → **Start rollout to Internal testing**

### Step 4: Now Create In-App Product
1. App → **Monetize** (should now be visible)
2. Click **Products** → **In-app products**
3. Click **Create product**
4. Fill in product details
5. Save and activate

---

## 📞 Still Can't See It?

### Check These:
1. **Account Status**: Settings → Account details → Check status
2. **App Status**: Make sure app is created and has at least one release
3. **Permissions**: Make sure you're signed in with the correct account
4. **Browser**: Try a different browser or incognito mode
5. **Wait Time**: Sometimes it takes 24-48 hours after account approval

### Alternative: Use Subscription Instead
If in-app products still don't show, you can:
1. Use **Subscriptions** instead (one-time subscriptions work too)
2. Path: **Monetize** → **Subscriptions** → **Create subscription**
3. Set it to **One-time payment** (if available)

---

## 🆘 Need Help?

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [In-App Products Documentation](https://support.google.com/googleplay/android-developer/answer/1153481)
- Contact Google Play Console support through your dashboard

---

## ✅ Quick Checklist

Before creating in-app products, make sure:
- ✅ Account is active (not pending)
- ✅ App is created
- ✅ Store listing has minimum required info
- ✅ At least one release is created
- ✅ You've waited 24-48 hours after account setup

Once all these are done, "In-app products" should appear under **Monetize** → **Products**!

