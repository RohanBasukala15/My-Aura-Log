import React, { useMemo } from "react";
import { StyleSheet, ViewStyle, StyleProp, TextStyle, TouchableWithoutFeedback } from "react-native";
import isEqual from "lodash/isEqual";
import { MaterialIcons } from "@expo/vector-icons";

import { Box, Text, Theme, makeStyles } from "../theme";

type TextVariant = React.ComponentProps<typeof Text>["variant"];
export interface CheckboxProps {
  subtitle?: string | undefined;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
  onPress?: (() => void) | undefined;

  titleVariant?: TextVariant;
  subtitleVariant?: TextVariant;
  titleLabelStyle?: StyleProp<TextStyle> | undefined;
  titleContainerStyle?: StyleProp<ViewStyle> | undefined;
  subtitleLabelStyle?: StyleProp<TextStyle> | undefined;
  subtitleContainerStyle?: StyleProp<ViewStyle> | undefined;
  title: string | ((props: { style: StyleProp<TextStyle> }) => React.ReactNode);
}

const ICON_SIZE = 20;
const CHECK_ICON_SIZE = 16;

const composableStyle = (theme: Theme) =>
  StyleSheet.create({
    icon: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderWidth: 1,
      borderRadius: 3,
      borderColor: theme.colors.borderDefault,
    },
    selectedIcon: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    disabledIcon: {
      borderColor: theme.colors.borderDisabled,
    },
    disabledSelected: {
      borderWidth: 0,
      borderColor: theme.colors.interactiveDisabled,
      backgroundColor: theme.colors.interactiveDisabled,
    },
    defaultLabel: {
      color: theme.colors.black,
    },
    defaultSubtitleLabel: {
      color: theme.colors.black,
    },
  });

function CheckboxDelicate({
  title,
  subtitle = undefined,
  onPress = undefined,
  disabled = false,
  selected = false,
  titleLabelStyle = undefined,
  subtitleLabelStyle = undefined,
  titleContainerStyle = undefined,
  subtitleContainerStyle = undefined,
  titleVariant = "selectionLabel",
  subtitleVariant = "caption",
}: CheckboxProps) {
  const styles = makeStyles(composableStyle);

  const iconStyles = useMemo(() => {
    if (disabled) {
      if (selected) {
        return { ...styles.disabledIcon, ...styles.disabledSelected };
      }
      return styles.disabledIcon;
    }

    if (selected) {
      return styles.selectedIcon;
    }
    return {};
  }, [selected, disabled, styles]);

  return (
    <TouchableWithoutFeedback onPress={onPress} disabled={disabled}>
      <Box>
        <Box flexDirection="row" alignItems="center">
          <Box alignItems="center" justifyContent="center" style={[styles.icon, iconStyles]}>
            <MaterialIcons
              name="check"
              size={CHECK_ICON_SIZE}
              color="white"
              style={{ display: selected ? "flex" : "none" }}
            />
          </Box>
          <Box style={titleContainerStyle} marginStart="xs">
            {typeof title === "string" ? (
              <Text variant={titleVariant} style={[styles.defaultLabel, titleLabelStyle]}>
                {title}
              </Text>
            ) : (
              title({ style: titleLabelStyle })
            )}
          </Box>
        </Box>
        {subtitle ? (
          <Box flexDirection="row" alignItems="center">
            <Box width={ICON_SIZE / 2} />
            <Box style={subtitleContainerStyle} marginStart="s">
              <Text
                variant={subtitleVariant}
                color="textSubdued"
                style={[styles.defaultSubtitleLabel, subtitleLabelStyle]}
              >
                {subtitle}
              </Text>
            </Box>
          </Box>
        ) : undefined}
      </Box>
    </TouchableWithoutFeedback>
  );
}

const Checkbox = React.memo(CheckboxDelicate, isEqual);

export { Checkbox };
