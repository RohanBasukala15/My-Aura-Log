import React, { useEffect } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { Storage } from "../Storage";
import { Box } from "../../components/theme";
import AppConstants from "../../assets/AppConstants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const NotificationProvider = React.memo(function Wrapper() {
  useEffect(() => {
    let isMounted = true;

    const onNewToken = async (token: Notifications.DevicePushToken) => {
      if (!isMounted) return;

      const oldToken = await Storage.getItem(AppConstants.StorageKey.fcmToken);
      await Storage.setItem(AppConstants.StorageKey.fcmToken, token.data);

      if (oldToken !== token.data) {
        await Storage.removeItem(AppConstants.StorageKey.fcmRegistryCompleted);
      }
    };

    const init = async () => {
      if (!Device.isDevice) {
        return;
      }
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        return;
      }

      const devicePushToken = await Notifications.getDevicePushTokenAsync();
      await onNewToken(devicePushToken);
    };

    init().then().catch();

    return () => {
      isMounted = false;
    };
  }, []);
  return <Box />;
});

export { NotificationProvider };
