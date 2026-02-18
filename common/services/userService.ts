import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { getDeviceId } from "../utils/device-utils";

const USERS_COLLECTION = "users";

type UserDocument = {
    motivationNotificationsEnabled?: boolean;
    fcmToken?: string | null;
    timezone?: string;
    notificationTime?: string; // "HH:mm" user's preferred daily reminder time
    isPremium?: boolean;
};

async function getUserDocRef() {
    if (!isFirebaseConfigured || !db) {
        return null;
    }

    const deviceId = await getDeviceId();
    return { ref: doc(db, USERS_COLLECTION, deviceId), deviceId } as const;
}

/** Build payload for Firestore; undefined values are not allowed and are omitted. */
function sanitizeForFirestore(data: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) out[k] = v;
    }
    return out;
}

async function mergeUserData(data: Record<string, unknown>) {
    const userRefData = await getUserDocRef();
    if (!userRefData) {
        return;
    }

    const { ref } = userRefData;
    await setDoc(
        ref,
        {
            ...sanitizeForFirestore(data),
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

async function fetchUserDocument(): Promise<UserDocument | null> {
    const userRefData = await getUserDocRef();
    if (!userRefData) {
        return null;
    }

    const snapshot = await getDoc(userRefData.ref);
    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as UserDocument;
}

export const UserService = {
    async getMotivationPreference(): Promise<{ enabled: boolean; timezone?: string; token?: string | null }> {
        const docData = await fetchUserDocument();
        return {
            enabled: docData?.motivationNotificationsEnabled ?? false,
            timezone: docData?.timezone,
            token: docData?.fcmToken ?? null,
        };
    },

    /**
     * Sync notification preferences and optional premium status to Firestore.
     * Used by the backend to send daily push (with motivational quote for premium) when the app is closed.
     * @returns true if Firestore was updated, false if Firebase not configured
     */
    async updateMotivationNotifications(options: {
        enabled: boolean;
        fcmToken?: string | null;
        timezone?: string;
        notificationTime?: string;
        isPremium?: boolean;
    }): Promise<boolean> {
        const userRefData = await getUserDocRef();
        if (!userRefData) return false;
        await mergeUserData({
            motivationNotificationsEnabled: options.enabled,
            fcmToken: options.fcmToken ?? null,
            ...(options.timezone != null && options.timezone !== "" && { timezone: options.timezone }),
            ...(options.notificationTime != null && { notificationTime: options.notificationTime }),
            ...(options.isPremium != null && { isPremium: options.isPremium }),
        });
        return true;
    },

    /** Sync only premium status to Firestore (e.g. after purchase or app load). */
    async syncPremiumStatus(isPremium: boolean): Promise<boolean> {
        const userRefData = await getUserDocRef();
        if (!userRefData) return false;
        await mergeUserData({ isPremium });
        return true;
    },

    async saveFcmToken(token: string | null) {
        await mergeUserData({ fcmToken: token ?? null });
    },

    /**
     * Check if we have an FCM token (for debugging / UI). Reads from Firestore.
     * For local Storage only, use Storage.getItem(AppConstants.StorageKey.fcmToken).
     */
    async getFcmTokenStatus(): Promise<{ hasToken: boolean; tokenSuffix?: string }> {
        const docData = await fetchUserDocument();
        const token = docData?.fcmToken ?? null;
        if (!token || typeof token !== "string") {
            return { hasToken: false };
        }
        return { hasToken: true, tokenSuffix: token.slice(-8) };
    },
};
