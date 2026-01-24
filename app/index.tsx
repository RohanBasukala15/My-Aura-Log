import React from "react";
import { Redirect } from "expo-router";

import { ActivityIndicator, Box, useAppConfiguration } from "@common/components";
import { useAppSelector } from "@common/redux";

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
