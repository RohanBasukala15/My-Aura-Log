# Legal Documents Setup Guide

## ✅ What I've Done

1. **Added Legal Section to Settings** ✓
   - Created `LegalSection.tsx` component
   - Added Privacy Policy and Terms & Conditions links
   - Displays app version
   - Added to bottom of Settings screen

2. **Created Template Documents** ✓
   - `docs/PRIVACY_POLICY.md` - Comprehensive privacy policy
   - `docs/TERMS_AND_CONDITIONS.md` - Complete terms of service

## 🚀 What You Need to Do Now

### Step 1: Customize the Documents

Edit both files in `/docs/`:

1. **Replace placeholders:**
   - `[Insert Date]` → Today's date
   - `[your-email@example.com]` → Your support email
   - `[your-website.com]` → Your website URL
   - `[Your State/Country]` → Your legal jurisdiction

2. **Add specific information:**
   - Your company/developer name
   - Contact information
   - Any additional features you add

### Step 2: Host the Documents Online

You need to make these documents accessible via URL. Options:

#### Option A: GitHub Pages (FREE & EASY)
```bash
1. Create a GitHub repository (can be private)
2. Create a docs folder with HTML versions:
   - privacy-policy.html
   - terms.html
3. Enable GitHub Pages in repo settings
4. Your URLs will be:
   - https://yourusername.github.io/your-repo/privacy-policy.html
   - https://yourusername.github.io/your-repo/terms.html
```

#### Option B: Your Own Website
Upload the documents to your website:
- `https://yourwebsite.com/privacy-policy`
- `https://yourwebsite.com/terms`

#### Option C: Google Sites (FREE)
1. Go to sites.google.com
2. Create a simple site
3. Add two pages for Privacy and Terms
4. Publish and get URLs

#### Option D: Notion (FREE)
1. Create public Notion pages
2. Share and get public URLs
3. Update links in app

### Step 3: Update the App

Edit `common/screens/settings/LegalSection.tsx`:

```typescript
const handleOpenPrivacyPolicy = async () => {
  // Replace with YOUR actual URL:
  const url = "https://YOUR-ACTUAL-URL.com/privacy-policy";
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
};

const handleOpenTerms = async () => {
  // Replace with YOUR actual URL:
  const url = "https://YOUR-ACTUAL-URL.com/terms";
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
};
```

### Step 4: Add URLs to App Store Listings

#### Apple App Store Connect
1. Go to App Information
2. Find "Privacy Policy URL" (REQUIRED field)
3. Enter your privacy policy URL
4. Save

#### Google Play Console
1. Go to Store Presence → Store Listing
2. Scroll to "Privacy Policy"
3. Enter your privacy policy URL (REQUIRED)
4. Save

## 📋 Quick Checklist Before Submission

- [ ] Privacy Policy is customized with your information
- [ ] Terms & Conditions are customized with your information
- [ ] Documents are hosted online and accessible
- [ ] URLs are updated in `LegalSection.tsx`
- [ ] Test the links work in the app
- [ ] Privacy Policy URL added to App Store Connect
- [ ] Privacy Policy URL added to Google Play Console
- [ ] Dates are filled in (effective date)
- [ ] Contact email is correct

## 🎯 Quick HTML Conversion (if needed)

If hosting on GitHub Pages, convert markdown to HTML:

```bash
# Using pandoc (install first: brew install pandoc)
pandoc PRIVACY_POLICY.md -o privacy-policy.html
pandoc TERMS_AND_CONDITIONS.md -o terms.html
```

Or use an online converter like:
- https://markdowntohtml.com/
- https://dillinger.io/

## ⚠️ IMPORTANT NOTES

1. **Privacy Policy is MANDATORY** for app store submission
2. **Must be accessible before submission** - don't use placeholder URLs
3. **Must match what your app actually does** - stores review this
4. **Update the date** whenever you change the policy
5. **Keep a copy** of all versions for compliance

## 💡 Pro Tips

- Use a professional email (not Gmail)
- Host on a domain you control
- Don't use URL shorteners
- Make sure pages load fast
- Keep documents up to date as you add features
- Consider adding a "Contact Us" section in settings too

## 🚨 Store Rejection Risks

Your app WILL BE REJECTED if:
- ❌ No privacy policy URL provided
- ❌ Privacy policy link is broken/404
- ❌ Privacy policy doesn't mention data collection
- ❌ Privacy policy doesn't mention third-party services (OpenAI, RevenueCat, Firebase)
- ❌ Privacy policy doesn't match app functionality

## Need Help?

Common hosting solutions:
- GitHub Pages: Free, easy, permanent
- Netlify: Free tier available
- Vercel: Free tier available
- Your existing website: Best option if you have one

---

**Ready to go live once you:**
1. Customize the documents ✏️
2. Host them online 🌐
3. Update the URLs in the app 🔗
4. Test the links work ✅

