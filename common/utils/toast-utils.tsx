import React from "react";
import { AntDesign } from "@expo/vector-icons";
import RNToast, { ToastConfig, ToastType, ToastShowParams } from "react-native-toast-message";
import { StyleProp, ViewStyle, TextStyle, StyleSheet } from "react-native";
import {
  VariantProps,
  createVariant,
  createRestyleComponent,
  layout,
  spacing,
  SpacingProps,
  LayoutProps,
} from "@shopify/restyle";

import { Theme } from "../components/theme/ThemeProvider";
import { Box, Text, useTheme } from "../components/theme/app-theme";
import { InfoToast, ErrorToast, SuccessToast, WarningToast } from "../assets/icons/svgs";

interface ToastComponentProps {
  text1?: string;
  text2?: string;
  type: ToastType;
  style: StyleProp<ViewStyle & TextStyle> | undefined;
}

const BasicToast = React.memo(function ToastDelicate({ text1, text2, type, style, ...props }: ToastComponentProps) {
  const theme = useTheme();
  const styles = useStyles();
  const logo = () => {
    switch (type) {
      case "error":
        return <ErrorToast height={20} width={20} />;
      case "success":
        return <SuccessToast height={20} width={20} />;
      case "warning":
        return <WarningToast height={20} width={20} />;
      case "information":
        return <InfoToast height={20} width={20} />;
      default:
        return <InfoToast height={20} width={20} />;
    }
  };

  return (
    <Box
      minHeight={60}
      justifyContent="center"
      alignItems="center"
      opacity={2}
      borderWidth={1}
      style={[styles.toastContainer, style]}
      {...props}
    >
      <Box flexDirection="row" justifyContent="center" alignItems="center">
        <Box paddingLeft={"sm"} paddingRight={"s"}>
          {logo()}
        </Box>
        <Box flex={1} paddingHorizontal={"s"}>
          <Text fontWeight={"600"} variant={"h5"} color={"black"}>
            {text1}
          </Text>
          {text2 && (
            <Text fontWeight={"600"} variant={"h5"} color={"black"}>
              {text2}
            </Text>
          )}
        </Box>
        <Box paddingLeft={"s"} paddingRight={"sm"}>
          <AntDesign onPress={() => RNToast.hide()} name="close" size={20} color={theme.colors.iconsDisabled} />
        </Box>
      </Box>
    </Box>
  );
});

const basicToastVariant = createVariant({
  property: "variant",
  themeKey: "toastVariant",
});

export type BasicToastProps = VariantProps<Theme, "toastVariant", "variant"> &
  Pick<ToastComponentProps, "text1" | "text2" | "type"> &
  SpacingProps<Theme> &
  LayoutProps<Theme>;
const ToastComponent = createRestyleComponent<BasicToastProps, Theme>(
  [layout, spacing, basicToastVariant as never],
  BasicToast
);

const toastConfig: ToastConfig = {
  information: (props) => <ToastComponent {...props} type="information" variant="information" />,
  error: (props) => <ToastComponent {...props} type="error" variant="error" />,
  warning: (props) => <ToastComponent {...props} type="warning" variant="warning" />,
  success: (props) => <ToastComponent {...props} type="success" variant="success" />,
};

class Toast {
  static show(message: string, options: Omit<ToastShowParams, "text1"> = {}) {
    const { type = "information", position = "bottom", visibilityTime = 3000, ...props } = options;
    RNToast.show({
      text1: message,
      type,
      position,
      visibilityTime,
      ...props,
    });
  }
}

const useStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    toastContainer: {
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 2,
    },
  });
};

export { toastConfig, Toast };
