import React from "react";

import { Box, Text, useTheme } from "@common/components/theme";
import { Button } from "@common/components/ui/button";

type DangerZoneSectionProps = {
  onClearData: () => void;
};

export function DangerZoneSection({ onClearData }: DangerZoneSectionProps) {
  const theme = useTheme();

  return (
    <Box
      marginBottom="l"
      padding="m"
      borderRadius="m"
      style={{
        backgroundColor: theme.colors.surfaceCriticalDefault,
        borderWidth: 1,
        borderColor: theme.colors.borderCriticalDefault,
      }}>
      <Text variant="h4" marginBottom="m" color="textCritical">
        Danger Zone
      </Text>
      <Text variant="default" color="textDefault" marginBottom="m">
        Clear all your journal entries. This action cannot be undone.
      </Text>
      <Button label="Clear All Data" onPress={onClearData} variant="destructive" size="medium" />
    </Box>
  );
}

