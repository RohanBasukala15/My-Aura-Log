import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  SharedValue,
  Extrapolation,
  interpolateColor,
} from "react-native-reanimated";

export interface ExpandingDotProps<T> {
  activeDotColor: string;
  data: T[];
  dotStyle: ViewStyle;
  expandingDotWidth?: number;
  inActiveDotColor: string;
  inActiveDotOpacity?: number;
  scrollX: SharedValue<number>;
  keyExtractor: (item: T, index: number) => string;
}

interface ExpandingDotComponentProps<T> extends Omit<ExpandingDotProps<T>, "data"> {
  dotStyleWidth?: number;
  index: number;
}

const ExpandingDotComponent = <T extends object>({
  activeDotColor,
  dotStyle,
  dotStyleWidth = 6,
  expandingDotWidth = 20,
  inActiveDotColor,
  inActiveDotOpacity = 0.5,
  scrollX,
  index,
}: Omit<ExpandingDotComponentProps<T>, "keyExtractor">) => {
  const inputRange = [index - 1, index, index + 1];

  const animatedStyles = useAnimatedStyle(() => {
    const dotColor = interpolateColor(scrollX.value, inputRange, [inActiveDotColor, activeDotColor, inActiveDotColor]);

    const dotWidth = interpolate(scrollX.value, inputRange, [dotStyleWidth, expandingDotWidth, dotStyleWidth], {
      extrapolateLeft: Extrapolation.CLAMP,
      extrapolateRight: Extrapolation.CLAMP,
    });

    const dotOpacity = interpolate(scrollX.value, inputRange, [inActiveDotOpacity, 1, inActiveDotOpacity], {
      extrapolateLeft: Extrapolation.CLAMP,
      extrapolateRight: Extrapolation.CLAMP,
    });

    return {
      width: dotWidth,
      opacity: dotOpacity,
      backgroundColor: dotColor,
    };
  });

  return <Animated.View style={[dotStyle, animatedStyles]} />;
};

const ExpandingDot = <T extends object>({
  activeDotColor,
  data,
  dotStyle,
  expandingDotWidth = 20,
  inActiveDotColor,
  inActiveDotOpacity = 0.5,
  scrollX,
  keyExtractor,
}: ExpandingDotProps<T>) => {
  const dotStyleWidth = dotStyle?.width as never as number;

  return (
    <View style={styles.containerStyle}>
      {data.map((item, index) => {
        return (
          <ExpandingDotComponent
            key={keyExtractor(item, index)}
            index={index}
            scrollX={scrollX}
            inActiveDotColor={inActiveDotColor}
            activeDotColor={activeDotColor}
            inActiveDotOpacity={inActiveDotOpacity}
            expandingDotWidth={expandingDotWidth}
            dotStyleWidth={dotStyleWidth}
            dotStyle={dotStyle}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flexDirection: "row",
    alignSelf: "center",
  },
});

export { ExpandingDot };
