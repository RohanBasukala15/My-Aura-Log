import React, { memo, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import AppConstants from "../../assets/AppConstants";
import { Box } from "../../components/theme";
import { Storage } from "../Storage";
import { UserService } from "../userService";

// --- Notification display config (module-level, set once)
const NOTIFICATION_PRESENT_OPTIONS = {
  shouldShowAlert: true,
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: true,
} as const;

Notifications.setNotificationHandler({
  handleNotification: async () => NOTIFICATION_PRESENT_OPTIONS,
});

async function getFcmToken(): Promise<string | null> {
  try {
    const { default: messaging } = await import("@react-native-firebase/messaging");
    const token = await messaging().getToken();
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

async function hasNotificationPermission(): Promise<boolean> {
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  return status === "granted";
}

function isApnsHexLike(token: string): boolean {
  return token.length === 64 && /^[a-f0-9]+$/i.test(token);
}

async function persistAndSyncToken(
  token: string,
  source: "firebase" | "expo",
  isMounted: () => boolean
): Promise<void> {
  if (!isMounted()) return;

  if (source === "expo" && Platform.OS === "ios" && isApnsHexLike(token)) {
    console.warn(
      "[FCM] iOS: Using Expo token (APNs hex). For FCM/Cloud Functions use a dev build: npx expo run:ios (not Expo Go)."
    );
  }

  const previousToken = await Storage.getItem(AppConstants.StorageKey.fcmToken);
  await Storage.setItem(AppConstants.StorageKey.fcmToken, token);
  if (previousToken !== token) {
    await Storage.removeItem(AppConstants.StorageKey.fcmRegistryCompleted);
  }

  UserService.saveFcmToken(token).catch((err) => {
    if (__DEV__) console.warn("[FCM] saveFcmToken failed", err);
  });
}

// --- Provider
const NotificationProvider = memo(function NotificationProviderInner() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!Device.isDevice) return;

    isMountedRef.current = true;
    let unsubscribeTokenRefresh: (() => void) | undefined;
    const isMounted = () => isMountedRef.current;

    (async () => {
      if (!(await hasNotificationPermission())) return;

      try {
        const fcmToken = await getFcmToken();
        if (fcmToken) {
          await persistAndSyncToken(fcmToken, "firebase", isMounted);
          try {
            const { default: messaging } = await import("@react-native-firebase/messaging");
            unsubscribeTokenRefresh = messaging().onTokenRefresh((newToken: string) => {
              if (isMounted() && newToken) persistAndSyncToken(newToken, "firebase", isMounted);
            });
          } catch {
            // Firebase messaging not available (e.g. Expo Go)
          }
        } else {
          const { data } = await Notifications.getDevicePushTokenAsync();
          await persistAndSyncToken(data, "expo", isMounted);
        }
      } catch (err) {
        if (__DEV__) console.warn("[FCM] init failed", err);
      }
    })();

    return () => {
      isMountedRef.current = false;
      unsubscribeTokenRefresh?.();
    };
  }, []);

  return <Box />;
});

export { NotificationProvider };

