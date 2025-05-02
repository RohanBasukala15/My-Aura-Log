import React from "react";
import { createBox, createText, useTheme as useReTheme } from "@shopify/restyle";
import {
  TextStyle,
  ViewStyle,
  ImageStyle,
  ActivityIndicator as RNActivityIndicator,
  ActivityIndicatorProps as RNActivityIndicatorProps,
} from "react-native";
import hoistNonReactStatics from "hoist-non-react-statics";

import type { Theme } from "./ThemeProvider";

export const Box = createBox<Theme>();
export const Text = createText<Theme>();

Text.defaultProps = {
  variant: "default",
};

export const useTheme = () => useReTheme<Theme>();

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeStyles = <T extends NamedStyles<T> | NamedStyles<any>>(styleComposer: (theme: Theme) => T) => {
  const currentTheme = useTheme();
  return styleComposer(currentTheme);
};

export interface ThemeProps {
  theme?: Theme;
}
export type CompositeComponent<P> =
  | React.ComponentClass<P>
  | React.ClassicComponentClass<P>
  | React.FunctionComponent<P>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withTheme<P extends ThemeProps, T, IP = any>(
  View: CompositeComponent<P>,
  injectedProps?: Partial<P> | ((theme: Theme) => Partial<P>)
) {
  const componentDisplayName =
    View.displayName || View.name || (View.constructor && View.constructor.name) || "Component";

  const WithWrapper = React.forwardRef<T, IP>((props, ref) => {
    const theme = useTheme();
    const iProps = (typeof injectedProps === "function" ? injectedProps(theme) : injectedProps) as never as P;
    return <View {...(iProps ?? {})} {...props} ref={ref} theme={theme} />;
  });
  WithWrapper.displayName = componentDisplayName;

  hoistNonReactStatics(WithWrapper, View);

  return WithWrapper;
}

export const ActivityIndicator = withTheme<RNActivityIndicatorProps & ThemeProps, RNActivityIndicator>(
  RNActivityIndicator,
  (theme: Theme) => ({ color: theme.colors.primary })
);

export { withTheme, makeStyles };
