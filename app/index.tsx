import React, { useEffect } from "react";
import { Redirect } from "expo-router";

import { ActivityIndicator, Box, useAppConfiguration } from "@common/components";

const LoadingScreen = () => (
  <Box flex={1} alignItems="center" justifyContent="center">
    <ActivityIndicator />
  </Box>
);

export default function EntryPoint() {
  const { isReady, isUIReady } = useAppConfiguration();

  if (!isReady || !isUIReady) {
    return <LoadingScreen />;
  }

  // Redirect directly to dashboard (Journal Entry screen)
  return <Redirect href={"/(home)/(tabs)/dashboard"} />;
}
