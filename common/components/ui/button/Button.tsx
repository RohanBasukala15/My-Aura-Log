import React, { ForwardedRef, useMemo } from "react";
import { StyleProp, ColorValue, TextStyle, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { RectButton, RectButtonProps } from "react-native-gesture-handler";
import {
  layout,
  border,
  spacing,
  TextProps,
  useRestyle,
  LayoutProps,
  BorderProps,
  SpacingProps,
  backgroundColor,
  BackgroundColorProps,
  composeRestyleFunctions,
} from "@shopify/restyle";
import { usePathname } from "expo-router";

import { Box, Text, useTheme, Theme, makeStyles } from "../../theme";
import { trackButtonPress } from "@common/services/analyticsService";

import { baseStyleComposer, coreStyleComposer, labelStyleComposer } from "./Button.style";

export type ButtonSize = keyof Theme["sizeVariant"];
export type ButtonVariant = "plain" | "primary" | "outline" | "outlineMonochrome" | "destructive";

type AffixRenderer = React.ReactNode | ((props: { color: ColorValue; size: number }) => React.ReactNode);

type ThemeProps = SpacingProps<Theme> & LayoutProps<Theme> & BorderProps<Theme> & BackgroundColorProps<Theme>;
const restyleFunctions = composeRestyleFunctions<Theme, ThemeProps>([layout, border, spacing, backgroundColor]);

type LabelStyleKeys = keyof ReturnType<typeof labelStyleComposer>;
type ContainerStyleKeys = keyof ReturnType<typeof baseStyleComposer>;

export type ButtonProps = {
  dense?: boolean;
  label: string;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  depressed?: boolean;
  onPress?: () => void;
  prefix?: AffixRenderer;
  suffix?: AffixRenderer;
  variant?: ButtonVariant;
  labelProps?: TextProps<Theme>;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  style?: RectButtonProps["style"];
  labelVariant?: React.ComponentProps<typeof Text>["variant"];
  labelColor?: React.ComponentProps<typeof Text>["color"];
  /** Analytics: Track button press. If true, uses label as button name. Can also be a string for custom name. */
  trackPress?: boolean | string;
  /** Analytics: Additional parameters to track with button press */
  trackParams?: Record<string, any>;
} & ThemeProps;

const ButtonDelicate = React.forwardRef(function ButtonDelicate(
  {
    dense = false,
    label,
    style,
    prefix,
    suffix,
    onPress,
    loading = false,
    disabled = false,
    depressed = false,
    labelColor,
    size = "large",
    variant = "outline",
    labelVariant = "button",
    labelStyle: labelStyleDelicate = undefined,
    containerStyle: containerStyleDelicate = undefined,
    labelProps = {},
    trackPress = false,
    trackParams,
    ...rest
  }: ButtonProps,
  ref: ForwardedRef<React.ComponentRef<typeof RectButton>>
) {
  const { colors, sizeVariant } = useTheme();
  const reStyle = useRestyle(restyleFunctions, rest);
  const pathname = usePathname();

  const coreStyles = makeStyles(coreStyleComposer);
  const labelStyles = makeStyles(labelStyleComposer);
  const baseStyles = makeStyles(baseStyleComposer);

  const containerSize = useMemo<{ height: number }>(() => sizeVariant[size], [size, sizeVariant]);

  const labelStyle = useMemo<Partial<TextStyle>>(() => {
    let variantLabelKey = `${variant}Default`;
    if (disabled || loading) {
      variantLabelKey = `${variant}Disabled`;
    } else if (depressed) {
      variantLabelKey = `${variant}Depressed`;
    }
    if (Object.prototype.hasOwnProperty.call(labelStyles, variantLabelKey)) {
      return labelStyles[variantLabelKey as LabelStyleKeys];
    }
    return {};
  }, [variant, labelStyles, disabled, loading]);

  const baseStyle = useMemo(() => {
    let variantKey = `${variant}Default`;

    if (disabled || loading) {
      variantKey = `${variant}Disabled`;
    } else if (depressed) {
      variantKey = `${variant}Depressed`;
    }
    if (Object.prototype.hasOwnProperty.call(baseStyles, variantKey)) {
      return baseStyles[variantKey as ContainerStyleKeys];
    }
    return {};
  }, [variant, baseStyles, coreStyles, disabled]);

  const affixProps = useMemo(
    () => ({
      color: labelStyle?.color ?? colors.iconsDefault,
      size: containerSize.height ? containerSize.height * 0.4 : 16,
    }),
    [labelStyle, containerSize]
  );

  // Handle button press with analytics tracking
  const handlePress = () => {
    // Track button press if enabled
    if (trackPress && !disabled && !loading) {
      const buttonName = typeof trackPress === 'string' ? trackPress : label;
      // Extract location from pathname (e.g., "/(home)/(tabs)/dashboard" -> "dashboard")
      const location = pathname?.match(/\(tabs\)\/([^/]+)/)?.[1] || 
                      pathname?.replace(/^\//, '').replace(/\//g, '_') || 
                      'unknown';
      trackButtonPress(buttonName, location, {
        variant,
        size,
        ...trackParams,
      });
    }
    
    // Call original onPress handler
    onPress?.();
  };

  return (
    <Box style={StyleSheet.flatten([coreStyles.baseContainer, containerSize, baseStyle, reStyle, style])}>
      <RectButton
        ref={ref}
        onPress={handlePress}
        rippleColor={colors.secondary}
        enabled={!disabled && !loading}
        style={[
          coreStyles.container,
          dense ? { paddingHorizontal: 0, marginHorizontal: 0 } : {},
          containerStyleDelicate,
        ]}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal={dense ? undefined : "xs"}>
          {(prefix || suffix) && (
            <Box width={containerSize.height ?? 20} justifyContent="center" alignItems="center">
              {typeof prefix === "function" ? prefix(affixProps) : prefix}
            </Box>
          )}
          <Box flexDirection="row" alignItems="center" justifyContent="center" flex={prefix || suffix ? 1 : undefined}>
            {loading && (
              <Box justifyContent="center" alignItems="center">
                <ActivityIndicator size="large" color={colors.primary} />
              </Box>
            )}
            <Box
              alignSelf="center"
              alignItems="center"
              visible={!loading}
              justifyContent="center"
              minWidth={dense ? undefined : 50}>
              <Text
                variant={labelVariant}
                style={[
                  labelStyle,
                  { color: colors[labelColor as keyof typeof colors] ?? labelStyle.color },
                  labelStyleDelicate,
                ]}
                {...labelProps}>
                {label}
              </Text>
            </Box>
          </Box>
          {(prefix || suffix) && (
            <Box width={containerSize.height ?? 20} justifyContent="center" alignItems="center">
              {typeof suffix === "function" ? suffix(affixProps) : suffix}
            </Box>
          )}
        </Box>
      </RectButton>
    </Box>
  );
});

const Button = React.memo(ButtonDelicate);

export { Button };

