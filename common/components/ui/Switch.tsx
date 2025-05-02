import React from "react";
import { Switch as RNSwitch, SwitchProps as RNSwitchProps } from "react-native-switch";

import { useTheme } from "../theme";

type SwitchProps = RNSwitchProps;

function Switch({
  circleSize = 18,
  barHeight = 20,
  circleBorderWidth = 0,
  renderActiveText = false,
  renderInActiveText = false,
  switchLeftPx = 2.5,
  switchRightPx = 2.5,
  ...props
}: SwitchProps) {
  const theme = useTheme();
  return (
    <RNSwitch
      circleSize={circleSize}
      barHeight={barHeight}
      circleBorderWidth={circleBorderWidth}
      backgroundActive={theme.colors.primary}
      backgroundInactive={theme.colors.grey}
      circleActiveColor={theme.colors.white}
      circleInActiveColor={theme.colors.white}
      renderActiveText={renderActiveText}
      renderInActiveText={renderInActiveText}
      switchLeftPx={switchLeftPx}
      switchRightPx={switchRightPx}
      {...props}
    />
  );
}

export { Switch };
