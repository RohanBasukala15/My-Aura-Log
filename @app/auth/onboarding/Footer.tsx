import React, { useMemo } from "react";
import { View, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

import { ONBOARDING_DATA } from "./Constant";

import { OnboardingDataProps } from "app/(auth)/onboarding";
import { useFeatureTranslation } from "@common/services/i18n";
import { OnboardingNextArrow } from "@common/assets/icons/svgs";
import { Box, Text, Button, Theme, makeStyles, useTheme, ExpandingDot } from "@common/components";

type FooterProps = {
  offsetValue: SharedValue<number>;
  onGetStartedPressed?: () => void;
  onPress?: () => void;
  onSignupPressed?: () => void;
  pagerPosition: number;
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function Footer({ offsetValue, onGetStartedPressed, onPress, onSignupPressed, pagerPosition }: FooterProps) {
  const theme = useTheme();
  const styles = makeStyles(viewPagerStyle);
  const t = useFeatureTranslation("screens.onboarding.");

  const bottomPosition = useMemo(() => (SCREEN_HEIGHT > 738 ? 30.0 : 27.0), []);

  return (
    <Box paddingHorizontal="xxm">
      <View style={[styles.dotContainerStyle, { bottom: hp(bottomPosition) }]}>
        <ExpandingDot<OnboardingDataProps>
          keyExtractor={(item) => item.key}
          data={ONBOARDING_DATA}
          expandingDotWidth={28}
          scrollX={offsetValue}
          activeDotColor={theme.colors.primary}
          inActiveDotOpacity={0.4}
          inActiveDotColor={theme.colors.iconsDisabled}
          dotStyle={styles.dotStyle}
        />
      </View>

      <Box bottom={24}>
        {pagerPosition <= 1 && (
          <TouchableOpacity onPress={onPress} style={styles.nextButtonWrapperStyle}>
            <OnboardingNextArrow width={98} height={98} />
          </TouchableOpacity>
        )}

        {pagerPosition > 1 && (
          <View style={styles.getStartedButtonGroupStyle}>
            <Button
              label={t("actions.get_started")}
              variant="primary"
              size="xlarge"
              labelVariant="button"
              loading={false}
              disabled={false}
              onPress={onGetStartedPressed}
            />

            <Box marginBottom="m" />

            <TouchableOpacity onPress={onSignupPressed}>
              <Text variant="h5" textAlign="center" fontWeight={"600"} color="grey">
                {t("actions.signup")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Box>
    </Box>
  );
}

const viewPagerStyle = (theme: Theme) =>
  StyleSheet.create({
    dotContainerStyle: {
      position: "absolute",
      left: 24,
    },
    dotStyle: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginHorizontal: 1,
    },
    nextButtonWrapperStyle: {
      minHeight: 12,
      alignSelf: "flex-end",
    },
    getStartedButtonGroupStyle: {
      minHeight: 98,
    },
  });
