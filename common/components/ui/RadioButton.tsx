import React, { useMemo } from "react";
import { StyleSheet, ViewStyle, StyleProp, TextStyle } from "react-native";
import isEqual from "lodash.isequal";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

import { Box, Text, Theme, makeStyles } from "../theme";

type TextVariant = React.ComponentProps<typeof Text>["variant"];

export interface RadioButtonProps {
  subtitle?: string | undefined;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
  onPress?: (() => void) | undefined;

  titleVariant?: TextVariant | undefined;
  subtitleVariant?: TextVariant | undefined;

  titleLabelStyle?: StyleProp<TextStyle> | undefined;
  titleContainerStyle?: StyleProp<ViewStyle> | undefined;
  subtitleLabelStyle?: StyleProp<TextStyle> | undefined;
  subtitleContainerStyle?: StyleProp<ViewStyle> | undefined;
  title: string | ((props: { style: StyleProp<TextStyle>; variant: TextVariant }) => React.ReactNode);
}

const composableStyle = (theme: Theme) =>
  StyleSheet.create({
    icon: {
      width: 24,
      height: 24,
      margin: 5,
      borderWidth: 2,
      borderRadius: 12,
      borderColor: theme.colors.borderDefault,
    },
    selectedIcon: {
      borderColor: theme.colors.interactiveDefault,
    },
    selectedDot: {
      width: 14,
      height: 14,
      borderRadius: 12,
    },
    disabledIcon: {
      borderColor: theme.colors.borderDisabled,
    },
    disabledSelected: {
      borderWidth: 5,
    },
  });

function RadioButtonDelicate({
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
}: RadioButtonProps) {
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
      <Box flex={1}>
        <Box flexDirection="row" marginTop="s" alignItems="center">
          <Box alignItems="center" justifyContent="center" style={[styles.icon, iconStyles]}>
            {selected && !disabled && <Box style={styles.selectedDot} backgroundColor="interactiveDefault" />}
          </Box>

          <Box style={titleContainerStyle} marginStart="xxs">
            {typeof title === "string" ? (
              <Text variant={titleVariant} style={titleLabelStyle}>
                {title}
              </Text>
            ) : (
              title({ style: titleLabelStyle, variant: titleVariant })
            )}
          </Box>
        </Box>
        {subtitle ? (
          <Box flexDirection="row" alignItems="center">
            <Box width={18} />
            <Box flex={1} style={subtitleContainerStyle} marginStart="s">
              <Text variant={subtitleVariant} color="textSubdued" style={subtitleLabelStyle}>
                {subtitle}
              </Text>
            </Box>
          </Box>
        ) : undefined}
      </Box>
    </TouchableWithoutFeedback>
  );
}

const RadioButton = React.memo(RadioButtonDelicate, isEqual);

export { RadioButton };
