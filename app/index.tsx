import React, { useEffect } from "react";
import { Redirect, usePathname } from "expo-router";

import { ActivityIndicator, Box, useAppConfiguration } from "@common/components";
import { useAppSelector } from "@common/redux";
import { trackScreenView } from "@common/services/analyticsService";

const LoadingScreen = () => (
  <Box flex={1} alignItems="center" justifyContent="center">
    <ActivityIndicator />
  </Box>
);

export default function EntryPoint() {
  const { isReady, isUIReady } = useAppConfiguration();
  const { isOnboardingCompleted, isBiometricSetupRequired } = useAppSelector(
    (state) => state.appConfiguration
  );
  const pathname = usePathname();

  // Track screen view
  useEffect(() => {
    if (isReady && isUIReady) {
      if (!isOnboardingCompleted) {
        trackScreenView(pathname || 'onboarding');
      } else if (isBiometricSetupRequired) {
        trackScreenView(pathname || 'login_with_biometric');
      } else {
        trackScreenView(pathname || 'entry_point');
      }
    }
  }, [isReady, isUIReady, isOnboardingCompleted, isBiometricSetupRequired, pathname]);

  if (!isReady || !isUIReady) {
    return <LoadingScreen />;
  }

  // Show onboarding if not completed, otherwise redirect to dashboard
  if (!isOnboardingCompleted) {
    return <Redirect href={"/(onboarding)"} />;
  }

  // If biometric is enabled and setup is required, show biometric login screen
  if (isBiometricSetupRequired) {
    return <Redirect href={"/(login-with-biometric)"} />;
  }

  // Redirect directly to dashboard (Journal Entry screen)
  return <Redirect href={"/(home)/(tabs)/dashboard"} />;
}
