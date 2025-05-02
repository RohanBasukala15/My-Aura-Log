import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import Animated, { interpolateColor, useAnimatedStyle } from "react-native-reanimated";

const ColoredBackground: React.FC<BottomSheetBackgroundProps> = ({ style, animatedIndex }) => {
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(animatedIndex.value, [0, 1], ["#ffffff", "#a8b5eb"]),
  }));

  const containerStyle = useMemo(
    () => [styles.backgroundContainer, style, containerAnimatedStyle],
    [style, containerAnimatedStyle]
  );

  return <Animated.View pointerEvents="none" style={containerStyle} />;
};

const styles = StyleSheet.create({
  backgroundContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#d9d9d9",
  },
});

export { ColoredBackground };
