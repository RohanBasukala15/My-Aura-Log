import React from "react";
import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="entry-detail"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
      <Stack.Screen
        name="entry-details"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
    </Stack>
  );
}

export default HomeLayout;
