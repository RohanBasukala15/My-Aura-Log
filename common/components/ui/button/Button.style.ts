import { StyleSheet } from "react-native";
import colorAlpha from "color-alpha";

import type { Theme } from "../../theme";

export const coreStyleComposer = (theme: Theme) =>
  StyleSheet.create({
    baseContainer: {
      height: 48,
      width: "auto",
      borderRadius: 5,
      overflow: "hidden",
    },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.m,
    },
  });

export const baseStyleComposer = (theme: Theme) =>
  StyleSheet.create({
    plainDefault: {},
    plainPressed: {
      backgroundColor: theme.colors.actionSecondaryHovered,
    },
    plainDisabled: {},
    plainDepressed: {},
    outlineDefault: {
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      backgroundColor: theme.colors.actionSecondaryDefault,
    },
    outlinePressed: {
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      backgroundColor: theme.colors.actionSecondaryPressed,
    },
    outlineDisabled: {
      borderWidth: 1,
      borderColor: theme.colors.borderDisabled,
      backgroundColor: theme.colors.surfaceDisabled,
    },
    outlineDepressed: {
      borderWidth: 1,
      borderColor: theme.colors.borderDepressed,
      backgroundColor: theme.colors.actionSecondaryDepressed,
    },
    primaryDefault: {
      backgroundColor: theme.colors.primary,
    },
    primaryPressed: {
      backgroundColor: theme.colors.actionPrimaryPressed,
    },
    primaryDisabled: {
      backgroundColor: colorAlpha(theme.colors.primary, 0.4),
    },
    primaryDepressed: {
      backgroundColor: theme.colors.actionPrimaryDepressed,
    },
    destructiveDefault: {
      backgroundColor: theme.colors.actionCriticalDefault,
    },
    destructivePressed: {
      backgroundColor: theme.colors.actionCriticalPressed,
    },
    destructiveDisabled: {
      backgroundColor: theme.colors.actionCriticalDisabled,
    },
    destructiveDepressed: {
      backgroundColor: theme.colors.actionCriticalDepressed,
    },
    outlineMonochromeDefault: {
      borderWidth: 1,
      borderColor: theme.colors.interactiveCritical,
    },
    outlineMonochromePressed: {
      borderWidth: 1,
      borderColor: theme.colors.interactiveCritical,
      backgroundColor: theme.colors.surfaceCriticalPressed,
    },
    outlineMonochromeDisabled: {
      borderWidth: 1,
      borderColor: theme.colors.borderDisabled,
    },
    outlineMonochromeDepressed: {
      borderWidth: 1,
      borderColor: theme.colors.actionCriticalDefault,
      backgroundColor: theme.colors.actionCriticalDefault,
    },
  });

export const labelStyleComposer = (theme: Theme) =>
  StyleSheet.create({
    plainDefault: {
      color: theme.colors.interactiveDefault,
    },
    plainPressed: {
      textDecorationStyle: "solid",
      textDecorationLine: "underline",
      color: theme.colors.interactiveDepressed,
    },
    plainDisabled: {
      color: theme.colors.interactiveDisabled,
    },
    plainDepressed: {
      color: theme.colors.interactiveDefault,
    },
    outlineDefault: {
      color: theme.colors.textDefault,
    },
    outlineDisabled: {
      color: theme.colors.textDisabled,
    },
    outlineDepressed: {
      color: theme.colors.textOnInteractive,
    },
    primaryDefault: {
      color: theme.colors.textOnPrimary,
    },
    primaryDisabled: {
      color: theme.colors.white,
    },
    primaryDepressed: {
      color: theme.colors.textOnPrimary,
    },
    destructiveDefault: {
      color: theme.colors.textOnCritical,
    },
    destructiveDisabled: {
      color: theme.colors.textDisabled,
    },
    destructiveDepressed: {
      color: theme.colors.textOnCritical,
    },
    outlineMonochromeDefault: {
      color: theme.colors.textCritical,
    },
    outlineMonochromeDisabled: {
      color: theme.colors.textDisabled,
    },
    outlineMonochromeDepressed: {
      color: theme.colors.textOnCritical,
    },
  });
