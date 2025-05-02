import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import colorAlpha from "color-alpha";
import { Href, useRouter } from "expo-router";

import { Box, useTheme } from "../theme";

import { ChevronLeft } from "@common/assets";

interface HeaderActionProps {
  color: string;
  size: number;
}

interface HeaderViewProps {
  backActionVisible?: boolean;
  disabled?: boolean;
  enableParentRoute?: boolean;
  fallBackRoute?: Href<string>;
  onBackPress?: () => void;
  prefixAction?: (props: HeaderActionProps) => React.ReactNode;
  suffixAction?: (props: HeaderActionProps) => React.ReactNode;
}

export function HeaderView({
  backActionVisible = true,
  disabled = false,
  enableParentRoute = false,
  fallBackRoute = undefined,
  onBackPress,
  prefixAction,
  suffixAction,
}: HeaderViewProps) {
  const router = useRouter();
  const theme = useTheme();
  const props: HeaderActionProps = { color: theme.colors.iconsDefault, size: 24 };

  const styles = useStyles();
  return (
    <Box marginTop="xxm" marginBottom="m" alignItems="center" flexDirection="row" justifyContent="space-between">
      {!prefixAction && backActionVisible ? (
        <Pressable
          disabled={disabled}
          unstable_pressDelay={1200}
          style={styles.backButtonWrapperStyle}
          android_ripple={{ color: colorAlpha(theme.colors.primary, 0.12) }}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          onPress={() => {
            if (!router.canGoBack() && enableParentRoute) {
              router.replace(fallBackRoute as never as Href<string>);
              return;
            }
            onBackPress ? onBackPress() : router.back();
          }}
        >
          <View style={styles.backButtonIconStyle}>
            <ChevronLeft width={9} height={15} color={theme.colors.black} />
          </View>
        </Pressable>
      ) : (
        prefixAction?.(props)
      )}

      {suffixAction?.(props)}
    </Box>
  );
}

const useStyles = () => {
  const theme = useTheme();

  return StyleSheet.create({
    backButtonWrapperStyle: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colorAlpha(theme.colors.primary, 0.12),
    },
    backButtonIconStyle: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
  });
};
