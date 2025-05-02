import React, { ReactNode } from "react";
import { View, Keyboard, StyleProp, TextStyle, ViewStyle, ScrollView, StyleSheet } from "react-native";
import { StatusBarStyle, StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useTheme } from "../theme";

enum PageViewType {
  View = "View",
  ScrollView = "ScrollView",
  KeyboardAwareScrollView = "KeyboardAwareScrollView",
}

interface PageViewProps {
  children: ReactNode;
  paddingHorizontal?: number;
  style?: StyleProp<ViewStyle & TextStyle>;
  statusBarStyle?: StatusBarStyle;
  type?: "View" | "ScrollView" | "KeyboardAwareScrollView";
}

function PageView(props: PageViewProps) {
  const theme = useTheme();
  const styles = useStyles();

  const {
    children,
    paddingHorizontal = theme.spacing.xxm,
    style,
    statusBarStyle = "dark",
    type = "KeyboardAwareScrollView",
  } = props;

  const Wrapper = React.useMemo(() => {
    switch (type) {
      case "View":
        return View;

      case "ScrollView":
        return ScrollView;

      case "KeyboardAwareScrollView":
        return KeyboardAwareScrollView;

      default:
        return View;
    }
  }, [type]);

  return (
    <>
      <StatusBar style={statusBarStyle} />

      <SafeAreaView style={styles.container}>
        <Wrapper
          style={type === "View" ? [{ paddingHorizontal }, styles.container, style] : []}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={type !== "View" ? [{ paddingHorizontal }, styles.flexGrow, style] : []}
          enableOnAndroid={type === PageViewType.KeyboardAwareScrollView}
        >
          {children}
        </Wrapper>
      </SafeAreaView>
    </>
  );
}

const useStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.white,
    },
    flexGrow: {
      flexGrow: 1,
      backgroundColor: theme.colors.white,
    },
  });
};

export { PageView };
