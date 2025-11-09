import React from "react";
import { Stack, Tabs } from "expo-router";

import { useTheme } from "../theme";

type NavigatorType = "Stack" | "Tab";
type SelectNavigator<T extends NavigatorType> = T extends "Stack"
  ? typeof Stack
  : T extends "Tab"
  ? typeof Tabs
  : never;

export type ScreenOptions<T extends NavigatorType> = React.ComponentProps<SelectNavigator<T>>["screenOptions"];
export const useScreenOptions = <T extends NavigatorType = "Stack">(): ScreenOptions<T> => {
  const theme = useTheme();

  return {
    headerShown: false,
    headerStyle: {
      backgroundColor: theme.colors.primary,
    },
    headerTitleStyle: {
      color: theme.colors.white,
      fontSize: 22,
      fontFamily: "HankenGrotesk_500Medium",
    },
    headerTitleAlign: "center",
    headerBackButtonMenuEnabled: false,
    headerTintColor: theme.colors.white,
    animation: "slide_from_right",
  };
};
