# 🚀 Enable GitHub Pages - 3 Simple Steps

## Step 1: Push Your Docs to GitHub (30 seconds)

Run these commands:

```bash
cd "/Users/basukala/Desktop/My Aura Log"
git add docs/
git commit -m "Add privacy policy and terms"
git push
```

## Step 2: Enable GitHub Pages (1 minute)

1. Go to: **https://github.com/RohanBasukala15/My-Aura-Log**

2. Click **"Settings"** (top right)

3. Click **"Pages"** (left sidebar, under "Code and automation")

4. Under **"Source"**, select:
   - Branch: `main`
   - Folder: `/docs`

5. Click **"Save"**

6. ✅ Done! Wait 2-3 minutes for deployment

## Step 3: Your URLs (Already Configured!)

After GitHub Pages deploys, your documents will be live at:

✅ **Privacy Policy:**  
`https://rohanbasukala15.github.io/My-Aura-Log/privacy-policy.html`

✅ **Terms & Conditions:**  
`https://rohanbasukala15.github.io/My-Aura-Log/terms.html`

**Good news:** I already put these URLs in `LegalDocumentConfig.ts`, so you don't need to change anything!

## Test It

After 2-3 minutes, test the URLs:
- Open your browser
- Visit the URLs above
- Should see your beautiful privacy policy and terms!

## Update Documents Anytime

Want to update your privacy policy or terms?

```bash
# 1. Edit the HTML files
nano docs/privacy-policy.html  # or use any editor

# 2. Push to GitHub
git add docs/
git commit -m "Update privacy policy"
git push

# 3. Done! Changes live in 1-2 minutes
# No app updates needed!
```

## Benefits

✅ **Free forever** - GitHub Pages is completely free  
✅ **Automatic updates** - Edit HTML, push, done  
✅ **Fast** - Served from GitHub's CDN  
✅ **HTTPS** - Secure by default  
✅ **No code changes** - Update docs without touching app code  

## Troubleshooting

**Q: Getting 404 errors?**
- Wait 2-3 minutes after enabling GitHub Pages
- Make sure repo is public
- Check Settings → Pages shows "Your site is live"

**Q: How do I make my repo public?**
- Settings → General → Danger Zone → Change visibility → Public

**Q: Want to test before pushing?**
```bash
cd docs/
python3 -m http.server 8000
# Open: http://localhost:8000/privacy-policy.html
```

## That's It!

Once GitHub Pages is enabled, your app is **production-ready** for legal documents! 🎉


