import { useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import PagerView from "react-native-pager-view";
import Animated, { useSharedValue } from "react-native-reanimated";
import { OnPageScrollEventData } from "react-native-pager-view/lib/typescript/PagerViewNativeComponent";

import { usePagerScrollHandler } from "@common/hooks";
import { Theme, makeStyles } from "@common/components";
import { useFeatureTranslation } from "@common/services/i18n";
import { ONBOARDING_DATA, Header, Content, Footer } from "@app/auth";
import { useAppDispatch, appConfigurationActions } from "@common/redux";

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export type OnboardingDataProps = {
  icon: React.ComponentType;
  isGetStartedActionsVisible?: boolean;
  isOnboardingNextButtonVisible?: boolean;
  isSkipButtonVisible?: boolean;
  key: string;
  onPress?: () => void;
  text: string;
  title: string;
};

export default function Onboarding() {
  const [pagerPosition, setPagerPosition] = useState(0);

  const router = useRouter();
  const offset = useSharedValue(0);
  const dispatch = useAppDispatch();
  const styles = makeStyles(viewPagerStyle);
  const pagerViewRef = useRef<PagerView>(null);
  const t = useFeatureTranslation("screens.onboarding.");

  const handler = usePagerScrollHandler({
    onPageScroll: (e: OnPageScrollEventData) => {
      "worklet";

      if (e.offset) {
        offset.value = e.offset + e.position;
      }
    },
  });

  const skipHandler = () => {
    dispatch(appConfigurationActions.setOnboardingComplete());
    router.replace("/sign-in");
  };

  const onboardingContentHandler = (index: number) => pagerViewRef?.current?.setPage(1 + index);

  return (
    <View style={styles.onboardingWrapperStyle}>
      <Header offsetValue={offset} pagerPosition={pagerPosition} onSkipPressed={skipHandler} />

      <AnimatedPagerView
        ref={pagerViewRef}
        style={styles.onboardingWrapperStyle}
        initialPage={0}
        onPageScroll={handler}
        onPageSelected={(e) => setPagerPosition(e.nativeEvent.position)}
      >
        {ONBOARDING_DATA.map((item, index) => (
          <View key={item.key} style={styles.page}>
            <Content icon={item.icon} title={t(item.title)} text={t(item.text)} />
          </View>
        ))}
      </AnimatedPagerView>

      <Footer
        offsetValue={offset}
        pagerPosition={pagerPosition}
        onPress={() => onboardingContentHandler(pagerPosition)}
        onGetStartedPressed={() => {
          dispatch(appConfigurationActions.setOnboardingComplete());
          router.replace("/sign-in");
        }}
        onSignupPressed={() => {
          dispatch(appConfigurationActions.setOnboardingComplete());
          router.replace("/sign-up/");
        }}
      />
    </View>
  );
}

const viewPagerStyle = (theme: Theme) =>
  StyleSheet.create({
    onboardingWrapperStyle: {
      flex: 1,
      backgroundColor: theme.colors.white,
    },
    viewPager: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.colors.white,
    },
    page: {
      justifyContent: "center",
    },
  });
