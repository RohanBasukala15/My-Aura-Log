import { Storage } from "./Storage";
import { getDeviceId } from "../utils/device-utils";
import { PremiumService } from "./premiumService";
import * as Crypto from "expo-crypto";
import { db, isFirebaseConfigured } from "./firebase";

// Conditionally import Firebase functions (will be null if Firebase not installed)
let doc: any = null;
let setDoc: any = null;
let getDoc: any = null;
let updateDoc: any = null;
let increment: any = null;
let serverTimestamp: any = null;

try {
    const firestore = require('firebase/firestore');
    doc = firestore.doc;
    setDoc = firestore.setDoc;
    getDoc = firestore.getDoc;
    updateDoc = firestore.updateDoc;
    increment = firestore.increment;
    serverTimestamp = firestore.serverTimestamp;
} catch (error) {
    // Firebase not installed - functions will be null
    // Code will fall back to local storage
}

const REFERRAL_CODE_KEY = "myauralog_referral_code";
const REFERRAL_COUNT_KEY = "myauralog_referral_count";
const REFERRED_BY_KEY = "myauralog_referred_by";
const REFERRAL_PREMIUM_GRANTED_KEY = "myauralog_referral_premium_granted";
const REQUIRED_REFERRALS = 3;

// Helper to check if Firebase functions are available
const isFirebaseAvailable = (): boolean => {
    return isFirebaseConfigured && db && doc && setDoc && getDoc && updateDoc && increment && serverTimestamp;
};

interface ReferralData {
    code: string;
    createdAt: string;
}

interface ReferralCount {
    count: number;
    lastUpdated: string;
}

export class ReferralService {
    /**
     * Generate unique referral code
     */
    private static async generateUniqueCode(): Promise<string> {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';

        // Generate 8-character code
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // If Firebase is configured, check for uniqueness
        if (isFirebaseAvailable()) {
            try {
                const ref = doc(db, 'referrals', code);
                const snap = await getDoc(ref);

                // If code exists, generate a new one
                if (snap.exists()) {
                    return this.generateUniqueCode();
                }
            } catch (error) {
                // If Firebase fails, just use the generated code
            }
        }

        return code;
    }

    /**
     * Generate or get existing referral code for current user
     * 
     * RULE: Once a referral code is assigned to a device ID, it NEVER changes.
     * Firebase is the single source of truth. Device ID = Permanent referral code.
     */
    static async getMyReferralCode(): Promise<string> {
        const deviceId = await getDeviceId();

        // Firebase is the source of truth - check it first
        if (isFirebaseAvailable()) {
            try {
                const userRef = doc(db, 'users', deviceId);
                const userSnap = await getDoc(userRef);

                // If device ID already has a referral code in Firebase, return it (NEVER change it)
                if (userSnap.exists() && userSnap.data().referralCode) {
                    const code = userSnap.data().referralCode;

                    // Cache locally for offline access
                    await Storage.setItem(REFERRAL_CODE_KEY, {
                        code,
                        createdAt: new Date().toISOString(),
                    });

                    return code;
                }

                // Device ID doesn't have a code yet - generate a new unique one
                const code = await this.generateUniqueCode();

                // Create user document with referral code (this is permanent)
                await setDoc(userRef, {
                    referralCode: code,
                    referredBy: null,
                    isPremium: false,
                    createdAt: serverTimestamp(),
                });

                // Create referral document
                const referralRef = doc(db, 'referrals', code);
                await setDoc(referralRef, {
                    referrerId: deviceId,
                    referralCount: 0,
                    referredUsers: [],
                    createdAt: serverTimestamp(),
                });

                // Cache locally
                await Storage.setItem(REFERRAL_CODE_KEY, {
                    code,
                    createdAt: new Date().toISOString(),
                });

                return code;
            } catch (error) {
                // If Firebase fails, fall back to local storage
            }
        }

        // Fallback: Use local storage if Firebase unavailable
        const localCode = await Storage.getItem<ReferralData>(REFERRAL_CODE_KEY);
        if (localCode?.code) {
            return localCode.code;
        }

        // Last resort: Generate local code (will be migrated to Firebase when available)
        const deviceIdShort = deviceId.substring(0, 8);
        const randomPart = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            `${deviceId}-${Date.now()}`
        );
        const code = `${deviceIdShort}${randomPart.substring(0, 4)}`.toUpperCase();

        await Storage.setItem(REFERRAL_CODE_KEY, {
            code,
            createdAt: new Date().toISOString(),
        });

        return code;
    }

    /**
     * Get current referral count
     */
    static async getReferralCount(): Promise<number> {
        // Try Firebase first if configured
        if (isFirebaseAvailable()) {
            try {
                const code = await this.getMyReferralCode();
                const referralRef = doc(db, 'referrals', code);
                const referralSnap = await getDoc(referralRef);

                if (referralSnap.exists()) {
                    const count = referralSnap.data().referralCount || 0;
                    // Cache locally
                    await Storage.setItem(REFERRAL_COUNT_KEY, {
                        count,
                        lastUpdated: new Date().toISOString(),
                    });
                    return count;
                }
            } catch (error) {
                // Fall through to local storage
            }
        }

        // Fallback to local storage
        const data = await Storage.getItem<ReferralCount>(REFERRAL_COUNT_KEY);
        return data?.count || 0;
    }

    /**
     * Check if user was referred by someone
     */
    static async getReferredBy(): Promise<string | null> {
        // Try Firebase first if configured
        if (isFirebaseAvailable()) {
            try {
                const deviceId = await getDeviceId();
                const userRef = doc(db, 'users', deviceId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const referredBy = userSnap.data().referredBy || null;
                    // Cache locally
                    if (referredBy) {
                        await Storage.setItem(REFERRED_BY_KEY, referredBy);
                    }
                    return referredBy;
                }
            } catch (error) {
                // Fall through to local storage
            }
        }

        // Fallback to local storage
        const referredBy = await Storage.getItem<string>(REFERRED_BY_KEY);
        return referredBy;
    }

    /**
     * Process referral when user installs app with referral code
     * This should be called when app opens and detects a referral code
     * 
     * Note: Without a backend, this only works locally. In production, you'd need
     * a backend service to track referrals across devices.
     */
    static async processReferral(referralCode: string): Promise<boolean> {
        if (!referralCode || referralCode.trim().length === 0) {
            return false;
        }

        const code = referralCode.trim().toUpperCase();

        // Don't process if user already has premium
        const isPremium = await PremiumService.isPremium();
        if (isPremium) {
            return false;
        }

        // Don't process if user was already referred
        const existingReferredBy = await this.getReferredBy();
        if (existingReferredBy) {
            return false;
        }

        // Don't process if user is referring themselves
        const myCode = await this.getMyReferralCode();
        if (code === myCode) {
            return false;
        }

        // Store that this user was referred by this code
        await Storage.setItem(REFERRED_BY_KEY, code);

        // Note: Without backend, we can't increment the referrer's count
        // This would need to be done server-side in production
        // For now, we just mark that this user was referred

        return true;
    }

    /**
     * Manually enter a referral code (for when friend shares code)
     */
    static async enterReferralCode(code: string): Promise<{ success: boolean; message: string }> {
        if (!code || code.trim().length === 0) {
            return {
                success: false,
                message: "Please enter a valid referral code.",
            };
        }

        const upperCode = code.trim().toUpperCase();
        const deviceId = await getDeviceId();

        // Try Firebase first if configured
        if (isFirebaseAvailable()) {
            try {
                // Get user document
                const userRef = doc(db, 'users', deviceId);
                let userSnap = await getDoc(userRef);

                // Create user if doesn't exist
                if (!userSnap.exists()) {
                    await this.getMyReferralCode(); // This will create the user
                    userSnap = await getDoc(userRef);
                }

                const userData = userSnap.data();

                // Check if already referred
                if (userData?.referredBy) {
                    return {
                        success: false,
                        message: "You've already used a referral code.",
                    };
                }

                // Check if using own code
                if (userData?.referralCode === upperCode) {
                    return {
                        success: false,
                        message: "You can't use your own referral code.",
                    };
                }

                // Check if referral code exists
                const referralRef = doc(db, 'referrals', upperCode);
                const referralSnap = await getDoc(referralRef);

                if (!referralSnap.exists()) {
                    return {
                        success: false,
                        message: "Invalid referral code. Please check and try again.",
                    };
                }

                // Update user to mark as referred
                await updateDoc(userRef, {
                    referredBy: upperCode,
                });

                // Increment referral count for the referrer
                const referralData = referralSnap.data();
                const referredUsers = referralData.referredUsers || [];

                // Only increment if this device hasn't been counted
                if (!referredUsers.includes(deviceId)) {
                    await updateDoc(referralRef, {
                        referralCount: increment(1),
                        referredUsers: [...referredUsers, deviceId],
                    });

                    // Check if referrer should get premium
                    const newCount = (referralData.referralCount || 0) + 1;
                    if (newCount >= REQUIRED_REFERRALS) {
                        const referrerUserRef = doc(db, 'users', referralData.referrerId);
                        await updateDoc(referrerUserRef, {
                            isPremium: true,
                        });
                        // Also update local premium status for referrer (if they're on this device)
                        // Note: This only works if referrer is on same device, but that's okay
                        // The referrer will get premium when they check their status
                    }
                }

                // Cache locally
                await Storage.setItem(REFERRED_BY_KEY, upperCode);

                return {
                    success: true,
                    message: "Referral code applied successfully!",
                };
            } catch (error: any) {
                // Fall through to local storage
            }
        }

        // Fallback to local storage
        const processed = await this.processReferral(code);

        if (processed) {
            return {
                success: true,
                message: "Referral code applied successfully!",
            };
        } else {
            const existing = await this.getReferredBy();
            if (existing) {
                return {
                    success: false,
                    message: "You've already used a referral code.",
                };
            }

            const myCode = await this.getMyReferralCode();
            if (upperCode === myCode) {
                return {
                    success: false,
                    message: "You can't use your own referral code.",
                };
            }

            return {
                success: false,
                message: "Invalid referral code. Please check and try again.",
            };
        }
    }

    /**
     * Increment referral count (called when someone uses your referral code)
     * Note: Without backend, this is tracked locally and won't work across devices
     * This is a simplified version for demonstration
     */
    static async incrementReferralCount(): Promise<number> {
        const current = await this.getReferralCount();
        const newCount = current + 1;

        await Storage.setItem(REFERRAL_COUNT_KEY, {
            count: newCount,
            lastUpdated: new Date().toISOString(),
        });

        // Check if user should get premium
        if (newCount >= REQUIRED_REFERRALS) {
            const alreadyGranted = await Storage.getItem<boolean>(REFERRAL_PREMIUM_GRANTED_KEY, false);
            if (!alreadyGranted) {
                await PremiumService.setPremiumStatus(true);
                await Storage.setItem(REFERRAL_PREMIUM_GRANTED_KEY, true);
            }
        }

        return newCount;
    }

    /**
     * Check if user has earned premium through referrals
     */
    static async hasEarnedPremiumViaReferrals(): Promise<boolean> {
        // Try Firebase first if configured
        if (isFirebaseAvailable()) {
            try {
                const deviceId = await getDeviceId();
                const userRef = doc(db, 'users', deviceId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const isPremium = userSnap.data().isPremium || false;
                    if (isPremium) {
                        // Sync with local storage
                        await PremiumService.setPremiumStatus(true);
                        return true;
                    }
                }
            } catch (error) {
                // Fall through to local check
            }
        }

        // Fallback to local storage
        const count = await this.getReferralCount();
        return count >= REQUIRED_REFERRALS;
    }

    /**
     * Get remaining referrals needed
     */
    static async getRemainingReferrals(): Promise<number> {
        const count = await this.getReferralCount();
        return Math.max(0, REQUIRED_REFERRALS - count);
    }

    /**
     * Get app store URLs for sharing
     * 
     * IMPORTANT: Update these URLs with your actual App Store and Play Store links
     * once your app is published.
     */
    static getAppStoreUrls(): { ios: string; android: string } {
        // TODO: Replace with actual App Store ID after publishing
        // Find your App Store ID in App Store Connect
        const appStoreId = "YOUR_APP_STORE_ID"; // e.g., "1234567890"
        const packageName = "com.myauralog";

        return {
            // iOS App Store URL format: https://apps.apple.com/app/id{APP_STORE_ID}
            ios: appStoreId !== "YOUR_APP_STORE_ID"
                ? `https://apps.apple.com/app/id${appStoreId}`
                : `https://apps.apple.com/app/my-aura-log/id${appStoreId}`, // Update with actual ID

            // Google Play Store URL format: https://play.google.com/store/apps/details?id={PACKAGE_NAME}
            android: `https://play.google.com/store/apps/details?id=${packageName}`,
        };
    }

    /**
     * Generate shareable referral link
     */
    static async getReferralLink(): Promise<string> {
        const code = await this.getMyReferralCode();
        const urls = this.getAppStoreUrls();

        // For now, we'll use a simple format that can be opened
        // In production, you'd want to use a proper deep link or universal link
        // Format: app store link with referral code as parameter
        // Since we don't have deep linking set up, we'll use a simple approach

        // For iOS
        // For Android
        // We'll return both and let the sharing function handle platform detection

        return `Check out My Aura Log! Use my referral code: ${code}\n\niOS: ${urls.ios}\nAndroid: ${urls.android}`;
    }

    /**
     * Reset referral data (for testing)
     */
    static async resetReferralData(): Promise<void> {
        await Storage.removeItem(REFERRAL_COUNT_KEY);
        await Storage.removeItem(REFERRAL_PREMIUM_GRANTED_KEY);
        // Note: We don't reset referral code or referred_by as those are permanent
    }
}

