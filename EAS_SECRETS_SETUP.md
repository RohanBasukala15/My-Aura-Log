# 🔐 EAS Secrets Setup for RevenueCat

## Problem
Your `.env` file works locally, but **EAS builds don't automatically read `.env` files**. You need to set up EAS Secrets for your RevenueCat API keys.

## ✅ Solution: Set EAS Secrets

Run these commands to add your RevenueCat API keys as EAS secrets:

```bash
# Set iOS RevenueCat API key
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "your_ios_key_here" --type string

# Set Android RevenueCat API key  
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value "your_android_key_here" --type string
```

## 📋 Step-by-Step Instructions

1. **Get your RevenueCat API keys** from your `.env` file:
   - `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`
   - `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`

2. **Set the secrets** (replace with your actual keys):

   ```bash
   # iOS key
   eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "test_DuBCHnARFQwwJzZclvhHJiNKCQi" --type string
   
   # Android key
   eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value "goog_HSAkdjKqFGqAyQSkfeHuVTPdcjT" --type string
   ```

3. **Verify secrets are set**:
   ```bash
   eas secret:list
   ```

4. **Rebuild your app**:
   ```bash
   eas build --platform android --profile production
   ```

## 🎯 How It Works

- EAS Secrets are automatically injected as environment variables during the build
- Your `app.config.js` already reads from `process.env.EXPO_PUBLIC_*` variables
- No code changes needed - just set the secrets!

## 🔍 Verify It's Working

After setting secrets and rebuilding, check the logs:
- The payment service should initialize successfully
- No more "Payment service is not configured" errors

## 📚 More Info

- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/#using-eas-secrets)
- [RevenueCat Setup Guide](https://docs.revenuecat.com/docs/getting-started)

