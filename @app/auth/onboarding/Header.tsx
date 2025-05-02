import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { interpolate, useAnimatedStyle, SharedValue } from "react-native-reanimated";

import { Circle } from "@common/assets/icons/svgs";
import { Text, Theme, makeStyles } from "@common/components";
import { useFeatureTranslation } from "@common/services/i18n";

type HeaderProps = {
  offsetValue: SharedValue<number>;
  onSkipPressed?: () => void;
  pagerPosition: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function Header({ offsetValue, onSkipPressed, pagerPosition }: HeaderProps) {
  const styles = makeStyles(viewPagerStyle);
  const t = useFeatureTranslation("screens.onboarding.");

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(offsetValue.value, [0, 1, 2], [-34, SCREEN_WIDTH - 120, SCREEN_WIDTH - 56]) },
        { translateY: interpolate(offsetValue.value, [0, 1, 2], [-56, -56, 82]) },
      ],
    };
  });

  return (
    <>
      <Animated.View style={[{ position: "absolute" }, animatedStyles]}>
        <Circle width={164} height={164} />
      </Animated.View>

      {pagerPosition <= 1 && (
        <TouchableOpacity style={styles.skipWrapperStyle} onPress={onSkipPressed}>
          <Text variant="h5" fontWeight="400" color="grey">
            {t("labels.skip")}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
}

const viewPagerStyle = (theme: Theme) =>
  StyleSheet.create({
    skipWrapperStyle: {
      position: "absolute",
      zIndex: 1,
      top: 73,
      right: 30,
      alignSelf: "flex-end",
    },
  });
