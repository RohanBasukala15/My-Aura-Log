import React from "react";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppFonts, useTheme } from "@common/components";

function BottomTab() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const screenOptions = {
    headerShown: false,
    tabBarStyle: {
      elevation: 0,
      borderTopWidth: 0,
      backgroundColor: theme.colors.white,
      paddingBottom: insets.bottom,
      height: 60 + insets.bottom,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontStyle: "normal" as const,
      fontFamily: AppFonts.Regular_400,
    },
    tabBarShowLabel: true,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.iconsDisabled,
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Journal",
          tabBarLabelStyle: {
            fontSize: 13,
            fontStyle: "normal" as const,
            fontFamily: AppFonts.Pacifico,
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="edit-note" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarLabelStyle: {
            fontSize: 13,
            fontStyle: "normal" as const,
            fontFamily: AppFonts.Pacifico,
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-month" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: "Trends",
          tabBarLabelStyle: {
            fontSize: 13,
            fontStyle: "normal" as const,
            fontFamily: AppFonts.Pacifico,
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="insights" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="breathing"
        options={{
          title: "Breathe",
          tabBarLabelStyle: {
            fontSize: 13,
            fontStyle: "normal" as const,
            fontFamily: AppFonts.Pacifico,
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="self-improvement" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabelStyle: {
            fontSize: 13,
            fontStyle: "normal" as const,
            fontFamily: AppFonts.Pacifico,
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default BottomTab;

