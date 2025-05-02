import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../../theme";

const styles = StyleSheet.create({
  divider: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export interface MenuDividerProps {
  color?: string;
}

export function MenuDivider({ color }: MenuDividerProps) {
  const { colors } = useTheme();
  return <View style={[styles.divider, { borderBottomColor: color ?? colors.borderDisabled }]} />;
}

MenuDivider.defaultProps = {
  color: undefined,
};
