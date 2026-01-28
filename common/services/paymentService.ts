import Purchases, { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import { Platform } from "react-native";
import { PremiumService } from "./premiumService";

// Get RevenueCat API keys from environment variables
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

const REVENUECAT_API_KEY = Platform.select({
  ios: REVENUECAT_API_KEY_IOS,
  android: REVENUECAT_API_KEY_ANDROID,
  default: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
});

/**
 * RevenueCat configuration constants
 * CRITICAL: These PRODUCT_IDs must match your App Store/Google Play product IDs exactly
 */
const PRODUCT_ID_LIFETIME = "premium_lifetime"; // One-time purchase
// Android uses "premium_monthly:monthly" while iOS uses "premium_monthly"
const PRODUCT_ID_MONTHLY = Platform.select({
  android: "premium_monthly:monthly",
  ios: "premium_monthly",
  default: "premium_monthly",
});
const ENTITLEMENT_ID = "premium";

export class PaymentService {
  private static isInitialized = false;

  /**
   * Initialize RevenueCat SDK
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    const apiKey = REVENUECAT_API_KEY;

    if (!apiKey) {
      return false;
    }

    try {
      await Purchases.configure({ apiKey });
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
   * Helper to get all unique packages from offerings
   */
  private static getAllAvailablePackages(
    offerings: Awaited<ReturnType<typeof Purchases.getOfferings>>
  ): PurchasesPackage[] {
    const packagesMap = new Map<string, PurchasesPackage>();

    // Get packages from current offering
    if (offerings.current?.availablePackages) {
      offerings.current.availablePackages.forEach((pkg) => {
        const key = pkg.product.identifier;
        if (!packagesMap.has(key)) {
          packagesMap.set(key, pkg);
        }
      });
    }

    // Get packages from all offerings
    if (offerings.all) {
      Object.values(offerings.all).forEach((offering) => {
        if (offering && 'availablePackages' in offering && Array.isArray(offering.availablePackages)) {
          offering.availablePackages.forEach((pkg) => {
            const key = pkg.product.identifier;
            if (!packagesMap.has(key)) {
              packagesMap.set(key, pkg);
            }
          });
        }
      });
    }

    const uniquePackages = Array.from(packagesMap.values());
    return uniquePackages;
  }

  /**
   * Get a specific package by PRODUCT_ID (not package identifier)
   * This is more reliable than using package identifiers
   */
  static async getPackageByProductId(productId: string): Promise<PurchasesPackage | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const allPackages = this.getAllAvailablePackages(offerings);

      // Search by product identifier (this is the most reliable approach)
      const package_ = allPackages.find(
        (pkg) => pkg.product.identifier === productId
      );

      return package_ || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Purchase a specific package by product ID
   */
  static async purchasePackage(productId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error(
        "Payment service is not available. Please contact support at myauralog@gmail.com."
      );
    }

    try {
      const premiumPackage = await this.getPackageByProductId(productId);

      if (!premiumPackage) {
        throw new Error(
          `Product "${productId}" not found. Please check your RevenueCat configuration.`
        );
      }

      const { customerInfo } = await Purchases.purchasePackage(premiumPackage);

      const hasAccess = this.hasPremiumAccess(customerInfo);

      if (hasAccess) {
        await PremiumService.setPremiumStatus(true);
        return true;
      }

      return false;
    } catch (error: unknown) {
      const err = error as { userCancelled?: boolean; code?: string; message?: string };
      if (err.userCancelled) {
        throw new Error("Purchase cancelled");
      }

      if (err.code === "NETWORK_ERROR") {
        throw new Error("Network error. Please check your connection and try again.");
      }

      throw new Error(err.message || "Purchase failed. Please try again.");
    }
  }

  /**
   * Purchase lifetime premium
   */
  static async purchaseLifetime(): Promise<boolean> {
    return await this.purchasePackage(PRODUCT_ID_LIFETIME);
  }

  /**
   * Purchase monthly subscription
   */
  static async purchaseMonthly(): Promise<boolean> {
    return await this.purchasePackage(PRODUCT_ID_MONTHLY);
  }

  /**
   * Restore previous purchases
   */
  static async restorePurchases(): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error("Payment service is not available.");
    }

    try {
      const customerInfo = await Purchases.restorePurchases();

      const hasAccess = this.hasPremiumAccess(customerInfo);

      if (hasAccess) {
        await PremiumService.setPremiumStatus(true);
        return true;
      }

      return false;
    } catch (error: unknown) {
      const err = error as { message?: string };
      throw new Error(err.message || "Failed to restore purchases.");
    }
  }

  /**
   * Check premium status from RevenueCat
   */
  static async checkPremiumStatus(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();

      const isPremium = this.hasPremiumAccess(customerInfo);

      // Always update local storage, even if false (to handle cancellations)
      await PremiumService.setPremiumStatus(isPremium);

      return isPremium;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all available packages
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
   * Get lifetime package
   */
  static async getLifetimePackage(): Promise<PurchasesPackage | null> {
    return await this.getPackageByProductId(PRODUCT_ID_LIFETIME);
  }

  /**
   * Get monthly subscription package
   */
  static async getMonthlyPackage(): Promise<PurchasesPackage | null> {
    return await this.getPackageByProductId(PRODUCT_ID_MONTHLY);
  }

  /**
   * Check if package is subscription
   */
  static isSubscriptionPackage(pkg: PurchasesPackage): boolean {
    return pkg.product.identifier === PRODUCT_ID_MONTHLY;
  }

  /**
   * Check if package is lifetime
   */
  static isLifetimePackage(pkg: PurchasesPackage): boolean {
    return pkg.product.identifier === PRODUCT_ID_LIFETIME;
  }

  /**
   * Check if customer has premium access
   */
  private static hasPremiumAccess(customerInfo: CustomerInfo): boolean {
    // Check entitlement (most reliable)
    const hasEntitlement =
      customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    // Check lifetime purchase
    const hasLifetime =
      customerInfo.allPurchaseDates?.[PRODUCT_ID_LIFETIME] !== undefined ||
      customerInfo.nonSubscriptionTransactions?.some(
        (t) => t.productIdentifier === PRODUCT_ID_LIFETIME
      );

    // Check monthly subscription
    const hasMonthly =
      customerInfo.activeSubscriptions.includes(PRODUCT_ID_MONTHLY);

    return hasEntitlement || hasLifetime || hasMonthly;
  }
}