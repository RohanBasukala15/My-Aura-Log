import React, { useEffect } from "react";
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
  const isOnboardingCompleted = useAppSelector(
    (state) => state.appConfiguration.isOnboardingCompleted
  );

  if (!isReady || !isUIReady) {
    return <LoadingScreen />;
  }

  // Show onboarding if not completed, otherwise redirect to dashboard
  if (!isOnboardingCompleted) {
    return <Redirect href={"/(onboarding)"} />;
  }

  // Redirect directly to dashboard (Journal Entry screen)
  return <Redirect href={"/(home)/(tabs)/dashboard"} />;
}
