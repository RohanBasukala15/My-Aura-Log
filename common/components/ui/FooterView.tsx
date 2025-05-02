import React, { ReactNode } from "react";
import { StyleProp, ViewStyle, StyleSheet } from "react-native";
import {
  createRestyleComponent,
  layout,
  spacing,
  SpacingProps,
  LayoutProps,
  BackgroundColorProps,
  BorderProps,
  BackgroundColorShorthandProps,
  ColorProps,
  OpacityProps,
  SpacingShorthandProps,
  TypographyProps,
  PositionProps,
  ShadowProps,
  TextShadowProps,
} from "@shopify/restyle";

import { Box, Theme } from "../theme";

interface FooterViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

function BasicFooterView({ children, style, ...props }: FooterViewProps) {
  return (
    <Box
      paddingTop={"xm"}
      backgroundColor={"white"}
      paddingBottom={"l"}
      {...props}
      style={[styles.mainContainer, style]}
    >
      {children}
    </Box>
  );
}

export type RestyleFooterViewProps = FooterViewProps &
  BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  ColorProps<Theme> &
  OpacityProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme> &
  TypographyProps<Theme> &
  LayoutProps<Theme> &
  PositionProps<Theme> &
  BorderProps<Theme> &
  ShadowProps<Theme> &
  TextShadowProps<Theme>;

const FooterView = createRestyleComponent<RestyleFooterViewProps, Theme>([layout, spacing as never], BasicFooterView);

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
  },
});

export { FooterView };
