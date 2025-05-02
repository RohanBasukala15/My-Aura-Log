import React from "react";
import { Tabs } from "expo-router";

import { Home, Menu } from "@common/assets";
import { AppFonts, ScreenOptions, useScreenOptions, useTheme } from "@common/components";

const useTabScreenOptions = (): ScreenOptions<"Tab"> => {
  const theme = useTheme();
  const screenOptions = useScreenOptions<"Tab">();

  return {
    ...screenOptions,
    tabBarStyle: {
      elevation: 0,
      marginTop: 12,
      borderTopWidth: 0,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontStyle: "normal",
      fontFamily: AppFonts.Regular_400,
    },
    tabBarShowLabel: true,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.iconsDisabled,
  };
};

function BottomTab() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home width={size} height={size} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="menus"
        options={{
          title: "Menu",
          tabBarIcon: ({ color, size }) => <Menu width={size} height={size} fill={color} />,
        }}
      />
    </Tabs>
  );
}

export default BottomTab;
