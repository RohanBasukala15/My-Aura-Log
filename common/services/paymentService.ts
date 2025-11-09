import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { PremiumService } from './premiumService';

// Get RevenueCat API keys from environment variables
// These will be set in .env file later
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

const REVENUECAT_API_KEY = Platform.select({
    ios: REVENUECAT_API_KEY_IOS,
    android: REVENUECAT_API_KEY_ANDROID,
    default: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
});

const PRODUCT_ID = 'premium_coffee';

export class PaymentService {
    private static isInitialized = false;

    /**
     * Initialize RevenueCat SDK
     * Call this once when app starts (in app/_layout.tsx)
     */
    static async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }

        if (!REVENUECAT_API_KEY) {
            return false;
        }

        try {
            await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
            this.isInitialized = true;
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if RevenueCat is initialized and available
     */
    static isAvailable(): boolean {
        return this.isInitialized && !!REVENUECAT_API_KEY;
    }

    /**
     * Purchase premium (one-time purchase)
     */
    static async purchasePremium(): Promise<boolean> {
        if (!this.isAvailable()) {
            throw new Error('Payment service is not available. Please check your configuration.');
        }

        try {
            // Get available offerings
            const offerings = await Purchases.getOfferings();

            if (!offerings.current) {
                throw new Error('No offerings available. Please check your RevenueCat configuration.');
            }

            // Find the premium package
            // Try to find by identifier first, then fallback to first available package
            let premiumPackage: PurchasesPackage | undefined = offerings.current.availablePackages.find(
                (pkg: PurchasesPackage) => pkg.identifier === PRODUCT_ID
            );

            // If not found by identifier, use the first available package
            if (!premiumPackage && offerings.current.availablePackages.length > 0) {
                premiumPackage = offerings.current.availablePackages[0];
            }

            if (!premiumPackage) {
                throw new Error('No packages available. Please configure products in RevenueCat.');
            }

            // Purchase the package
            const { customerInfo } = await Purchases.purchasePackage(premiumPackage);

            // Check if purchase was successful
            // RevenueCat uses entitlements, but for one-time purchase, we check the product
            const hasEntitlement = customerInfo.entitlements.active['premium'] !== undefined;
            const hasProduct = customerInfo.entitlements.all['premium'] !== undefined ||
                customerInfo.allPurchaseDates[PRODUCT_ID] !== undefined;

            if (hasEntitlement || hasProduct) {
                await PremiumService.setPremiumStatus(true);
                return true;
            }

            // Also check if the purchase was made (even without entitlement)
            const purchaseDate = customerInfo.allPurchaseDates[PRODUCT_ID];
            if (purchaseDate) {
                await PremiumService.setPremiumStatus(true);
                return true;
            }

            return false;
        } catch (error: any) {
            // Handle user cancellation
            if (error.userCancelled) {
                throw new Error('Purchase cancelled');
            }

            // Handle network errors
            if (error.code === 'NETWORK_ERROR') {
                throw new Error('Network error. Please check your connection and try again.');
            }

            // Handle other errors
            throw new Error(error.message || 'Purchase failed. Please try again.');
        }
    }

    /**
     * Restore previous purchases
     * Useful when user switches devices or reinstalls app
     */
    static async restorePurchases(): Promise<boolean> {
        if (!this.isAvailable()) {
            throw new Error('Payment service is not available. Please check your configuration.');
        }

        try {
            const customerInfo = await Purchases.restorePurchases();

            // Check if user has premium entitlement or product
            const hasEntitlement = customerInfo.entitlements.active['premium'] !== undefined;
            const hasProduct = customerInfo.allPurchaseDates[PRODUCT_ID] !== undefined;

            if (hasEntitlement || hasProduct) {
                await PremiumService.setPremiumStatus(true);
                return true;
            }

            return false;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to restore purchases. Please try again.');
        }
    }

    /**
     * Check if user has active premium subscription/purchase
     * This checks RevenueCat, not local storage
     */
    static async checkPremiumStatus(): Promise<boolean> {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            const hasEntitlement = customerInfo.entitlements.active['premium'] !== undefined;
            const hasProduct = customerInfo.allPurchaseDates[PRODUCT_ID] !== undefined;

            const isPremium = hasEntitlement || hasProduct;

            // Sync with local storage
            if (isPremium) {
                await PremiumService.setPremiumStatus(true);
            }

            return isPremium;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get available packages/prices
     * Useful for displaying prices in UI
     */
    static async getPackages(): Promise<PurchasesPackage[]> {
        if (!this.isAvailable()) {
            return [];
        }

        try {
            const offerings = await Purchases.getOfferings();
            return offerings.current?.availablePackages || [];
        } catch (error) {
            return [];
        }
    }
}

