import React from "react";
import { StyleSheet, Switch, TouchableOpacity } from "react-native";

import { Box, Text, useTheme } from "@common/components/theme";

type NotificationsSectionProps = {
  notificationsEnabled: boolean;
  notificationTime: string;
  onToggleNotifications: (value: boolean) => void;
  onSelectTime: () => void;
};

export function NotificationsSection({
  notificationsEnabled,
  notificationTime,
  onToggleNotifications,
  onSelectTime,
}: NotificationsSectionProps) {
  const theme = useTheme();

  return (
    <Box
      marginBottom="l"
      padding="m"
      borderRadius="m"
      style={{
        backgroundColor: theme.colors.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
      <Text variant="h4" marginBottom="m" color="textDefault">
        Notifications
      </Text>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
        <Box flex={1}>
          <Text variant="default" color="textDefault" marginBottom="xs">
            Daily Reminders
          </Text>
          <Text variant="caption" color="textSubdued">
            Get reminded to journal every day at {notificationTime}
          </Text>
        </Box>
        <Switch
          value={notificationsEnabled}
          onValueChange={onToggleNotifications}
          trackColor={{ false: theme.colors.borderSubdued, true: theme.colors.primary }}
          thumbColor={theme.colors.white}
        />
      </Box>
      <TouchableOpacity onPress={onSelectTime} style={styles.timeButton} disabled={!notificationsEnabled}>
        <Text variant="button" style={{ color: notificationsEnabled ? theme.colors.primary : theme.colors.textSubdued }}>
          Change Reminder Time
        </Text>
      </TouchableOpacity>
    </Box>
  );
}

const styles = StyleSheet.create({
  timeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9B87F5",
    alignItems: "center",
    justifyContent: "center",
  },
});

