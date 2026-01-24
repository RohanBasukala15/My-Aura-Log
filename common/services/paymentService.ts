import Purchases, { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import { Platform } from "react-native";
import { PremiumService } from "./premiumService";

// Get RevenueCat API keys from environment variables
// Set in .env file (or EAS secrets for production builds)
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

const REVENUECAT_API_KEY = Platform.select({
  ios: REVENUECAT_API_KEY_IOS,
  android: REVENUECAT_API_KEY_ANDROID,
  default: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
});

/**
 * RevenueCat configuration constants
 *
 * PRODUCT_IDs should match the store product identifiers (App Store / Google Play)
 * ENTITLEMENT_ID should match the entitlement configured in RevenueCat
 * PACKAGE_IDENTIFIERs should match the package identifiers in RevenueCat offerings
 */
const PRODUCT_ID_LIFETIME = "premium_lifetime"; // One-time purchase
const PRODUCT_ID_MONTHLY = "premium_monthly"; // Monthly subscription
const ENTITLEMENT_ID = "premium";
const PACKAGE_IDENTIFIER_LIFETIME = "lifetime"; // Optional: package identifier in RevenueCat
const PACKAGE_IDENTIFIER_MONTHLY = "monthly"; // Optional: package identifier in RevenueCat

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

    // Debug logging to verify API keys are loaded
    const apiKey = REVENUECAT_API_KEY;


    if (!apiKey) {
      return false;
    }

    try {
      await Purchases.configure({ apiKey });
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
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
   * Helper method to get all available packages from all offerings
   * Handles both offerings.current and offerings.all
   */
  private static getAllAvailablePackages(offerings: Awaited<ReturnType<typeof Purchases.getOfferings>>): PurchasesPackage[] {
    const packages: PurchasesPackage[] = [];

    // First, try current offering
    if (offerings.current?.availablePackages) {
      packages.push(...offerings.current.availablePackages);
    }

    // Then, get packages from all offerings
    if (offerings.all) {
      Object.values(offerings.all).forEach((offering) => {
        if (offering && 'availablePackages' in offering && Array.isArray(offering.availablePackages)) {
          packages.push(...offering.availablePackages);
        }
      });
    }

    return packages;
  }

  /**
   * Purchase premium package
   * @param packageIdentifier - Optional: "lifetime" or "monthly". If not provided, uses first available package.
   */
  static async purchasePremium(packageIdentifier?: string): Promise<boolean> {
    console.log('purchasePremium', packageIdentifier);
    if (!this.isAvailable()) {
      throw new Error(
        "Payment service is not available. Please contact support at myauralog@gmail.com."
      );
    }

    try {
      // Get available offerings
      const offerings = await Purchases.getOfferings();

      // Get all available packages from all offerings
      const allPackages = this.getAllAvailablePackages(offerings);

      if (allPackages.length === 0) {
        throw new Error("No offerings available. Please check your RevenueCat configuration.");
      }

      let premiumPackage: PurchasesPackage | undefined;

      // If package identifier is provided, try to find by identifier first
      if (packageIdentifier) {
        premiumPackage = allPackages.find(
          (pkg: PurchasesPackage) => pkg.identifier === packageIdentifier
        );
      }


      // Fallback: find by product identifier
      if (!premiumPackage) {
        if (packageIdentifier === PACKAGE_IDENTIFIER_LIFETIME || packageIdentifier === "lifetime") {
          premiumPackage = allPackages.find(
            (pkg: PurchasesPackage) => pkg.product.identifier === PRODUCT_ID_LIFETIME
          );
        } else if (packageIdentifier === PACKAGE_IDENTIFIER_MONTHLY || packageIdentifier === "monthly") {
          premiumPackage = allPackages.find(
            (pkg: PurchasesPackage) => pkg.product.identifier === PRODUCT_ID_MONTHLY
          );
        }
      }


      // Fallback: use the first available package
      if (!premiumPackage && allPackages.length > 0) {
        premiumPackage = allPackages[0];
      }


      if (!premiumPackage) {
        throw new Error("No packages available. Please configure products in RevenueCat.");
      }

      // Purchase the package
      const { customerInfo } = await Purchases.purchasePackage(premiumPackage);

      if (this.hasPremiumAccess(customerInfo)) {
        await PremiumService.setPremiumStatus(true);
        return true;
      }

      return false;
    } catch (error: any) {
      // Handle user cancellation
      if (error.userCancelled) {
        throw new Error("Purchase cancelled");
      }

      // Handle network errors
      if (error.code === "NETWORK_ERROR") {
        throw new Error("Network error. Please check your connection and try again.");
      }

      // Handle other errors
      throw new Error(error.message || "Purchase failed. Please try again.");
    }
  }

  /**
   * Purchase lifetime premium (one-time purchase)
   * Convenience method for purchasing the lifetime package
   */
  static async purchaseLifetime(): Promise<boolean> {
    console.log('purchaseLifetime');
    return PaymentService.purchasePremium(PACKAGE_IDENTIFIER_LIFETIME);
  }

  /**
   * Purchase monthly subscription
   * Convenience method for purchasing the monthly subscription
   */
  static async purchaseMonthly(): Promise<boolean> {
    return PaymentService.purchasePremium(PACKAGE_IDENTIFIER_MONTHLY);
  }

  /**
   * Restore previous purchases
   * Useful when user switches devices or reinstalls app
   */
  static async restorePurchases(): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error("Payment service is not available. Please check your configuration.");
    }

    try {
      const customerInfo = await Purchases.restorePurchases();

      if (this.hasPremiumAccess(customerInfo)) {
        await PremiumService.setPremiumStatus(true);
        return true;
      }

      return false;
    } catch (error: any) {
      throw new Error(error.message || "Failed to restore purchases. Please try again.");
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
      const isPremium = this.hasPremiumAccess(customerInfo);

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
      return this.getAllAvailablePackages(offerings);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get a specific package by identifier
   * @param packageIdentifier - Package identifier (e.g., "lifetime", "monthly", "$rc_lifetime", "$rc_monthly")
   */
  static async getPackage(packageIdentifier: string): Promise<PurchasesPackage | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const allPackages = this.getAllAvailablePackages(offerings);
      
      // Try to find by package identifier
      let package_ = allPackages.find(
        (pkg: PurchasesPackage) => pkg.identifier === packageIdentifier
      );

      // If not found, try to find by product identifier
      if (!package_) {
        if (packageIdentifier === PACKAGE_IDENTIFIER_LIFETIME || packageIdentifier === "lifetime") {
          package_ = allPackages.find(
            (pkg: PurchasesPackage) => pkg.product.identifier === PRODUCT_ID_LIFETIME
          );
        } else if (packageIdentifier === PACKAGE_IDENTIFIER_MONTHLY || packageIdentifier === "monthly") {
          package_ = allPackages.find(
            (pkg: PurchasesPackage) => pkg.product.identifier === PRODUCT_ID_MONTHLY
          );
        }
      }

      return package_ || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get lifetime package
   */
  static async getLifetimePackage(): Promise<PurchasesPackage | null> {
    return this.getPackage(PACKAGE_IDENTIFIER_LIFETIME);
  }

  /**
   * Get monthly subscription package
   */
  static async getMonthlyPackage(): Promise<PurchasesPackage | null> {
    return this.getPackage(PACKAGE_IDENTIFIER_MONTHLY);
  }

  /**
   * Check if a package is a subscription
   */
  static isSubscriptionPackage(pkg: PurchasesPackage): boolean {
    return pkg.product.identifier === PRODUCT_ID_MONTHLY;
  }

  /**
   * Check if a package is a one-time purchase
   */
  static isLifetimePackage(pkg: PurchasesPackage): boolean {
    return pkg.product.identifier === PRODUCT_ID_LIFETIME;
  }

  private static hasPremiumAccess(customerInfo: CustomerInfo): boolean {
    // Check if user has active entitlement (works for both subscription and one-time)
    const entitlementActive =
      customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined ||
      customerInfo.entitlements.all[ENTITLEMENT_ID] !== undefined;

    // Check for lifetime purchase (one-time)
    const lifetimePurchased =
      customerInfo.allPurchaseDates?.[PRODUCT_ID_LIFETIME] !== undefined ||
      customerInfo.nonSubscriptionTransactions.some(
        (transaction: { productIdentifier: string }) => transaction.productIdentifier === PRODUCT_ID_LIFETIME
      );

    // Check for monthly subscription (active subscription)
    const monthlySubscribed =
      customerInfo.allPurchaseDates?.[PRODUCT_ID_MONTHLY] !== undefined ||
      customerInfo.activeSubscriptions.includes(PRODUCT_ID_MONTHLY);

    return entitlementActive || lifetimePurchased || monthlySubscribed;
  }
}

