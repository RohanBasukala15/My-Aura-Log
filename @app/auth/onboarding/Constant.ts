import { OnboardingDataProps } from "app/(auth)/onboarding";
import { Onboarding_1, Onboarding_2, Onboarding_3 } from "@common/assets";

export const ONBOARDING_DATA: OnboardingDataProps[] = [
  {
    key: "1",
    isSkipButtonVisible: true,
    icon: Onboarding_1,
    title: "titles.page_1",
    text: "messages.page_1",
    isOnboardingNextButtonVisible: true,
    isGetStartedActionsVisible: false,
  },
  {
    key: "2",
    isSkipButtonVisible: true,
    icon: Onboarding_2,
    title: "titles.page_2",
    text: "messages.page_2",
    isOnboardingNextButtonVisible: true,
    isGetStartedActionsVisible: false,
  },
  {
    key: "3",
    isSkipButtonVisible: false,
    icon: Onboarding_3,
    title: "titles.page_3",
    text: "messages.page_3",
    isOnboardingNextButtonVisible: false,
    isGetStartedActionsVisible: true,
  },
];
