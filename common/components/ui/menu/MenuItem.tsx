import React from "react";
import { View, TextStyle, ViewStyle, Platform, Pressable, StyleSheet, PressableProps } from "react-native";

import { useTheme, Text } from "../../theme";

const styles = StyleSheet.create({
  container: {
    height: 48,
    justifyContent: "center",
    maxWidth: 248,
    minWidth: 124,
  },
  title: {
    fontSize: 14,
    fontWeight: "400",
    paddingHorizontal: 16,
    textAlign: "left",
  },
});

type TextProps = React.ComponentProps<typeof Text>;

export type MenuItemProps = {
  children: React.ReactNode;
  disabled?: boolean;
  disabledTextColor?: string;
  pressColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  textColor?: TextProps["color"];
  textVariant?: TextProps["variant"];
} & PressableProps;

export function MenuItem({
  children,
  disabled = false,
  onPress,
  style,
  textStyle,
  textColor,
  textVariant,
  ...props
}: MenuItemProps) {
  const theme = useTheme();
  const { pressColor = theme.colors.secondary, disabledTextColor = theme.colors.textDisabled, ...rest } = props;
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: Platform.OS !== "android" && pressed ? pressColor : undefined,
      })}
      android_ripple={{ color: pressColor }}
      onPress={onPress}
      {...rest}
    >
      <View style={[styles.container, style]}>
        <Text
          numberOfLines={1}
          variant={textVariant ?? "labels"}
          color={disabled ? "textDisabled" : textColor ?? "textDefault"}
          style={[styles.title, textStyle]}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

MenuItem.defaultProps = {
  disabled: false,
  disabledTextColor: undefined,
  pressColor: undefined,
  style: undefined,
  textStyle: undefined,
  textVariant: "labels",
  textColor: "textDefault",
};
