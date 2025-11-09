import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { getDeviceId } from "../utils/device-utils";

const USERS_COLLECTION = "users";

type UserDocument = {
    motivationNotificationsEnabled?: boolean;
    fcmToken?: string | null;
    timezone?: string;
};

async function getUserDocRef() {
    if (!isFirebaseConfigured || !db) {
        return null;
    }

    const deviceId = await getDeviceId();
    return { ref: doc(db, USERS_COLLECTION, deviceId), deviceId } as const;
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
            ...data,
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

    async updateMotivationNotifications(options: { enabled: boolean; fcmToken?: string | null; timezone?: string }) {
        await mergeUserData({
            motivationNotificationsEnabled: options.enabled,
            fcmToken: options.fcmToken ?? null,
            timezone: options.timezone,
        });
    },

    async saveFcmToken(token: string | null) {
        await mergeUserData({ fcmToken: token ?? null });
    },
};
