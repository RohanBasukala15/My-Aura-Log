import React, { useEffect } from "react";
import { Stack, usePathname } from "expo-router";
import { trackScreenView } from "@common/services/analyticsService";

export default function OnboardingLayout() {
  const pathname = usePathname();

  // Track screen views
  useEffect(() => {
    if (pathname) {
      const screenName = pathname.replace(/^\//, '') || 'onboarding';
      trackScreenView(screenName);
    }
  }, [pathname]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

