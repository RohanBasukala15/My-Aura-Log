// Silence React Native Firebase v22 modular deprecation warnings (we use modular API; some internals still trigger warnings)
if (typeof globalThis !== "undefined") {
  (globalThis as Record<string, unknown>).RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
}

import React, { useEffect } from "react";
import { SplashScreen, Stack } from "expo-router";
import { Provider } from "react-redux";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { BackHandler } from "react-native";
import * as Notifications from "expo-notifications";
import { getCrashlytics } from "@react-native-firebase/crashlytics";
import { NotificationProvider } from "@common/services/notification/NotificationProvider";
import { PaymentService } from "@common/services/paymentService";
import { PremiumService } from "@common/services/premiumService";
import { UserService } from "@common/services/userService";
import { ensureFirebaseAuth } from "@common/services/firebase";

import {
  AppConfiguration,
  AppConfigurationProvider,
  ThemeProvider,
  useAppConfiguration,
  useScreenOptions,
} from "../common/components";

import { store } from "@common/redux/store";
import { toastConfig } from "@common/utils/toast-utils";
import { useAppDispatch } from "@common/redux";
import { loadConfiguration } from "@common/redux/slices/appConfiguration/app-configuration.action";

SplashScreen.preventAutoHideAsync();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NavigatorLayout = React.memo(function NavigatorLayout() {
  const screenOptions = useScreenOptions();
  return <Stack screenOptions={screenOptions} />;
});

function ConfigurationState() {
  const appConfig = useAppConfiguration();
  const dispatch = useAppDispatch();

  // Sign in to Firebase with custom token (uid = deviceId) so Firestore rules pass. No login screen.
  useEffect(() => {
    if (__DEV__) console.log("[App] calling ensureFirebaseAuth...");
    ensureFirebaseAuth()
      .then(() => {
        if (__DEV__) console.log("[App] ensureFirebaseAuth done, loading config & premium");
        dispatch(loadConfiguration());
        return PremiumService.isPremium();
      })
      .then((isPremium) => UserService.syncPremiumStatus(isPremium))
      .then(() => { if (__DEV__) console.log("[App] config & premium sync done"); })
      .catch((e) => {
        if (__DEV__) console.warn("[App] ensureFirebaseAuth or sync failed", e);
      });
    setTimeout(() => {
      //TODO: Call this once app configuration loaded (also check if league has be selected)
      appConfig.updateState({
        isReady: true,
        isUIReady: true,
      });
    }, 1000);
  }, []);

  return null;
}

export default function Root() {
  // Initialize RevenueCat payment service
  useEffect(() => {
    PaymentService.initialize()
  }, []);

  // Initialize Crashlytics so global JS error / unhandled rejection handlers are registered (reports show in Firebase Console)
  useEffect(() => {
    try {
      getCrashlytics();
    } catch (_) {
      // Firebase may not be available in some environments
    }
  }, []);

  // disabled android gesture
  useEffect(() => {
    const backAction = () => {
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppConfigurationProvider
          prepareConfiguration={() => {
            // TODO: initiate cache loading work like redux loadConfiguration (assign country)
          }}>
          <Provider store={store}>
            <ConfigurationState />
            <NotificationProvider />
            <AppConfiguration assets={[]}>
              <NavigatorLayout />
              <Toast position="bottom" bottomOffset={40} config={toastConfig} />
            </AppConfiguration>
          </Provider>
        </AppConfigurationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

