import React, { useState, useRef, useCallback } from "react";
import { StyleSheet, Platform, View, TouchableOpacity, Modal } from "react-native";
import { StatusBar } from "expo-status-bar";
import PagerView from "react-native-pager-view";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { Box, Text, useTheme } from "@common/components/theme";
import { Button, TextInput } from "@common/components/ui";
import { Switch } from "@common/components/ui/Switch";
import { ONBOARDING_STEPS, OnboardingStep } from "@common/models/Onboarding";
import { useAppDispatch } from "@common/redux";
import { setOnboardingComplete, setBiometricEnabled } from "@common/redux/slices/appConfiguration/app-configuration.slice";
import AppConstants from "@common/assets/AppConstants";
import { trackOnboardingComplete } from "@common/services/analyticsService";
import { Storage } from "@common/services/Storage";
import { NotificationService } from "@common/services/notificationService";
import { PremiumService } from "@common/services/premiumService";
import { UserService } from "@common/services/userService";
import { GRADIENTS } from "@common/components/theme/gradients";
import { Image } from "expo-image";
import { useBiometricAvailability } from "@common/hooks/useBiometricAvailability";
import { SoulLinkService } from "@common/services/soulLinkService";
import {
  STARTER_SEEDS,
  SOUL_LINK_AVATAR_SEED_KEY,
  getAvatarUri,
} from "@common/constants/soulLinkAvatars";
import { authenticateWithBiometrics, formatBiometricType } from "@common/utils/biometric-utils";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// Image mapping for onboarding steps
const ONBOARDING_IMAGES = {
  1: require("@common/assets/onboarding/onboarding-1.png"),
  2: require("@common/assets/onboarding/onboarding-2.png"),
  3: require("@common/assets/onboarding/onboarding-3.png"),
  4: require("@common/assets/onboarding/onboarding-4.png"),
};

interface OnboardingData {
  user_name?: string;
  avatar_seed?: string;
  daily_notifications?: boolean;
  notification_time?: string;
  biometric_enabled?: boolean;
  pin_enabled?: boolean;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    daily_notifications: false,
    notification_time: NotificationService.DEFAULT_NOTIFICATION_TIME,
    biometric_enabled: false,
    pin_enabled: false,
  });

  const handleComplete = useCallback(async () => {
    // Save onboarding data if needed
    if (onboardingData.user_name) {
      await Storage.setItem("user_name", onboardingData.user_name);
    }
    if (onboardingData.avatar_seed) {
      await Storage.setItem(SOUL_LINK_AVATAR_SEED_KEY, onboardingData.avatar_seed);
      const avatarUrl = getAvatarUri(onboardingData.avatar_seed, 128);
      SoulLinkService.setMyAvatarUrl(avatarUrl).catch(() => {});
    }

    // Save notification settings using the same keys as settings screen
    if (onboardingData.daily_notifications !== undefined) {
      await Storage.setItem(NotificationService.NOTIFICATION_ENABLED_KEY, onboardingData.daily_notifications);
    }
    if (onboardingData.notification_time) {
      await Storage.setItem(NotificationService.NOTIFICATION_TIME_KEY, onboardingData.notification_time);
    }

    // Sync to Firestore so Cloud Function (FCM) sends daily reminder at chosen time
    if (onboardingData.daily_notifications && onboardingData.notification_time) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
      const fcmToken = await Storage.getItem<string>(AppConstants.StorageKey.fcmToken, null);
      const isPremium = await PremiumService.isPremium();
      await UserService.updateMotivationNotifications({
        enabled: true,
        notificationTime: onboardingData.notification_time,
        timezone,
        fcmToken: fcmToken ?? undefined,
        isPremium,
      });
    }

    // Save biometric enabled state to Redux
    if (onboardingData.biometric_enabled !== undefined) {
      dispatch(setBiometricEnabled(onboardingData.biometric_enabled));
    }
    dispatch(setOnboardingComplete());
    trackOnboardingComplete();

    router.replace("/(home)/(tabs)/dashboard");
  }, [onboardingData, dispatch, router]);

  const handleNext = useCallback(() => {
    if (currentPage < ONBOARDING_STEPS.length - 1) {
      pagerRef.current?.setPage(currentPage + 1);
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  }, [currentPage, handleComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const updateOnboardingData = useCallback((key: string, value: string | boolean) => {
    setOnboardingData(prev => ({ ...prev, [key]: value }));
  }, []);

  const renderStep = (step: OnboardingStep) => {
    switch (step.type) {
      case "welcome":
        return <WelcomeStep step={step} onNext={handleNext} />;
      case "input":
        return (
          <InputStep
            step={step}
            value={onboardingData[step.input?.key as keyof OnboardingData] as string}
            onChange={value => updateOnboardingData(step.input?.key || "", value)}
            avatarSeed={onboardingData.avatar_seed}
            onAvatarSelect={seed => updateOnboardingData("avatar_seed", seed)}
            showAvatarPicker={step.input?.key === "user_name"}
            onNext={handleNext}
          />
        );
      case "notification":
        return (
          <NotificationStep
            step={step}
            value={onboardingData[step.toggle?.key as keyof OnboardingData] as boolean}
            notificationTime={onboardingData.notification_time || NotificationService.DEFAULT_NOTIFICATION_TIME}
            onChange={value => updateOnboardingData(step.toggle?.key || "", value)}
            onTimeChange={time => updateOnboardingData("notification_time", time)}
            onNext={handleNext}
            onSkip={handleNext}
          />
        );
      case "security":
        return (
          <SecurityStep
            step={step}
            biometricEnabled={onboardingData.biometric_enabled || false}
            onBiometricChange={value => updateOnboardingData("biometric_enabled", value)}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box flex={1}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={GRADIENTS.backgroundSolid.colors}
        start={GRADIENTS.backgroundSolid.start}
        end={GRADIENTS.backgroundSolid.end}
        style={styles.gradient}>
        <Box flex={1}>
          <PagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={0}
            onPageSelected={handlePageSelected}
            scrollEnabled={
              currentPage !== 1 ||
              (currentPage === 1 &&
                !!onboardingData.user_name?.trim() &&
                !!onboardingData.avatar_seed)
            }>
            {ONBOARDING_STEPS.map(step => (
              <Box key={step.step} flex={1}>
                {renderStep(step)}
              </Box>
            ))}
          </PagerView>

          {/* Pagination Dots */}
          <Box flexDirection="row" justifyContent="center" alignItems="center" paddingBottom="l" gap="xs">
            {ONBOARDING_STEPS.map((_, index) => (
              <Box
                key={index}
                width={currentPage === index ? 24 : 8}
                height={8}
                borderRadius="m"
                backgroundColor={currentPage === index ? "primary" : "grey"}
                style={{ opacity: currentPage === index ? 1 : 0.3 }}
              />
            ))}
          </Box>
        </Box>
      </LinearGradient>
    </Box>
  );
}

// Shared Layout Component for consistent positioning
interface OnboardingStepLayoutProps {
  step: OnboardingStep;
  content?: React.ReactNode;
  buttons: React.ReactNode;
  scrollEnabled?: boolean;
}

function OnboardingStepLayout({ step, content, buttons, scrollEnabled = true }: OnboardingStepLayoutProps) {
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      scrollEnabled={scrollEnabled}
      >
      <Box flex={1} paddingTop="xl" paddingHorizontal="m" paddingBottom="xl">
        {/* Decorative gradient circles */}
        <View style={step.step === 1 ? styles.decorativeCircle3 : styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        {/* Scrollable content section */}
        <Box alignItems="center" zIndex={1} marginTop={"l"} marginBottom={"m"} style={styles.headerSection}>
          <Image
            source={ONBOARDING_IMAGES[step.step as keyof typeof ONBOARDING_IMAGES]}
            contentFit="contain"
            style={styles.logoImage}
          />
          <Text
            variant="h1-pacifico"
            color="textDefault"
            textAlign="center"
            marginTop="l"
            paddingHorizontal={"l"}
            style={styles.title}>
            {step.title}
          </Text>
          <>
            <Text variant="h3" color="primary" textAlign="center" marginTop="s" style={styles.subtitle}>
              {step.subtitle}
            </Text>
            {step.description && (
              <Text variant="default" color="textSubdued" textAlign="center" marginTop="s" style={styles.description}>
                {step.description}
              </Text>
            )}
          </>
        </Box>

        {content && (
          <>
            <Box marginBottom="xl" zIndex={1} style={styles.contentSection}>
              {content}
            </Box>
          </>
        )}
      </Box>
      <Box paddingBottom="l" paddingHorizontal="m" width="100%" zIndex={1}>
        {buttons}
      </Box>
    </KeyboardAwareScrollView>
  );
}

// Welcome Step Component
interface WelcomeStepProps {
  step: OnboardingStep;
  onNext: () => void;
}

function WelcomeStep({ step, onNext }: WelcomeStepProps) {
  return (
    <OnboardingStepLayout
      step={step}
      buttons={
        <Button label={step.primaryButton} variant="primary" size="large" onPress={onNext} style={styles.button} />
      }
    />
  );
}

// Input Step Component (name + optional avatar picker for step 2)
interface InputStepProps {
  step: OnboardingStep;
  value?: string;
  onChange: (value: string) => void;
  avatarSeed?: string;
  onAvatarSelect?: (seed: string) => void;
  showAvatarPicker?: boolean;
  onNext: () => void;
}

const AVATAR_PICKER_SIZE = 56;

function InputStep({
  step,
  value = "",
  onChange,
  avatarSeed,
  onAvatarSelect,
  showAvatarPicker,
  onNext,
}: InputStepProps) {
  const [inputValue, setInputValue] = useState(value);
  const theme = useTheme();

  const handleInputChange = (text: string) => {
    setInputValue(text);
    onChange(text);
  };

  const handleNext = () => {
    if (inputValue.trim()) {
      onChange(inputValue.trim());
      onNext();
    }
  };

  const hasName = !!inputValue.trim();
  const hasAvatar = !showAvatarPicker || !!avatarSeed;
  const canContinue = hasName && hasAvatar;

  return (
    <OnboardingStepLayout
      step={step}
      scrollEnabled={canContinue}
      content={
        <Box>
          <TextInput
            placeholder={step.input?.placeholder || ""}
            value={inputValue}
            onChangeText={handleInputChange}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleNext}
            style={[
              styles.nameInput,
              {
                borderColor: theme.colors.borderSubdued,
                color: theme.colors.textDefault,
                backgroundColor: theme.colors.backgroundDefault,
              },
            ]}
          />
          {showAvatarPicker && (
            <Box marginTop="l">
              <Text variant="default" color="textDefault" marginBottom="s">
                Choose your avatar
              </Text>
              <Box flexDirection="row" flexWrap="wrap" gap="s" justifyContent="center">
                {STARTER_SEEDS.map(seed => {
                  const isSelected = avatarSeed === seed;
                  return (
                    <TouchableOpacity
                      key={seed}
                      onPress={() => onAvatarSelect?.(seed)}
                      style={[
                        styles.avatarSlot,
                        isSelected && { borderColor: theme.colors.primary, borderWidth: 3 },
                      ]}
                    >
                      <Image
                        source={{ uri: getAvatarUri(seed, AVATAR_PICKER_SIZE) }}
                        style={styles.avatarImage}
                      />
                    </TouchableOpacity>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      }
      buttons={
        <Button
          label={step.primaryButton}
          variant="primary"
          size="large"
          onPress={handleNext}
          disabled={!canContinue}
          style={styles.button}
        />
      }
    />
  );
}

// Notification Step Component
interface NotificationStepProps {
  step: OnboardingStep;
  value: boolean;
  notificationTime: string;
  onChange: (value: boolean) => void;
  onTimeChange: (time: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

function NotificationStep({
  step,
  value,
  notificationTime,
  onChange,
  onTimeChange,
  onNext,
  onSkip,
}: NotificationStepProps) {
  const theme = useTheme();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [iosTimePickerValue, setIosTimePickerValue] = useState<Date>(() =>
    NotificationService.createDateFromTimeString(notificationTime)
  );

  const handleNext = useCallback(async () => {
    if (value) {
      const granted = await NotificationService.requestNotificationPermissions();
      onChange(granted);
    } else {
      onChange(false);
    }
    onNext();
  }, [value, onChange, onNext]);

  const handleSkip = useCallback(() => {
    onChange(false);
    onSkip();
  }, [onChange, onSkip]);

  const handleTimeChange = useCallback(
    (date: Date) => {
      const newTime = NotificationService.formatDateToTimeString(date);
      onTimeChange(newTime);
      setIosTimePickerValue(date);
    },
    [onTimeChange]
  );

  const handleSelectTime = useCallback(() => {
    const current = NotificationService.createDateFromTimeString(notificationTime);
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "time",
        is24Hour: true,
        onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
          if (event.type === "set" && selectedDate) {
            handleTimeChange(selectedDate);
          }
        },
      });
    } else {
      setIosTimePickerValue(current);
      setShowTimePicker(true);
    }
  }, [notificationTime, handleTimeChange]);

  const handleIosTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setIosTimePickerValue(selectedDate);
    }
  };

  const handleTimePickerCancel = useCallback(() => {
    setShowTimePicker(false);
    setIosTimePickerValue(NotificationService.createDateFromTimeString(notificationTime));
  }, [notificationTime]);

  const handleTimePickerConfirm = useCallback(() => {
    handleTimeChange(iosTimePickerValue);
    setShowTimePicker(false);
  }, [iosTimePickerValue, handleTimeChange]);

  return (
    <>
      <OnboardingStepLayout
        step={step}
        content={
          step.toggle && (
            <Box
              padding="m"
              backgroundColor="surfaceDefault"
              borderRadius="m"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.08}
              shadowRadius={12}
              elevation={4}>
              <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
                <Box flex={1}>
                  <Text variant="default" color="textDefault" marginBottom="xs">
                    Daily Reminders
                  </Text>
                  <Text variant="caption" color="textSubdued">
                    Get reminded to journal every day at {notificationTime}
                  </Text>
                </Box>
                <Switch value={value} onValueChange={onChange} />
              </Box>
              <TouchableOpacity
                onPress={handleSelectTime}
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.backgroundHovered,
                    opacity: value ? 1 : 0.5,
                  },
                ]}
                disabled={!value}>
                <Text
                  variant="button"
                  style={{
                    color: value ? theme.colors.primary : theme.colors.textSubdued,
                  }}>
                  Change Reminder Time
                </Text>
              </TouchableOpacity>
            </Box>
          )
        }
        buttons={
          <Box width="100%" gap="s">
            {step.secondaryButton && (
              <Button label={step.secondaryButton} variant="plain" size="large" onPress={handleSkip} />
            )}
            <Button
              label={step.primaryButton}
              variant="primary"
              size="large"
              onPress={handleNext}
              style={styles.button}
            />
          </Box>
        }
      />

      {Platform.OS === "ios" && (
        <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={handleTimePickerCancel}>
          <Box flex={1} justifyContent="center" alignItems="center" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
            <Box
              width="90%"
              maxWidth={400}
              padding="l"
              borderRadius="l"
              style={{
                backgroundColor: theme.colors.white,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}>
              <Text variant="h3" marginBottom="m" color="textDefault" textAlign="center">
                Select Reminder Time
              </Text>
              <DateTimePicker value={iosTimePickerValue} mode="time" display="spinner" onChange={handleIosTimeChange} />
              <Box flexDirection="row" marginTop="m" gap="s">
                <TouchableOpacity
                  onPress={handleTimePickerCancel}
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: theme.colors.backgroundHovered,
                      borderWidth: 1,
                      borderColor: theme.colors.borderSubdued,
                    },
                  ]}>
                  <Text variant="button" color="textDefault">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleTimePickerConfirm}
                  style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}>
                  <Text variant="button" style={{ color: "#FFFFFF" }}>
                    Save
                  </Text>
                </TouchableOpacity>
              </Box>
            </Box>
          </Box>
        </Modal>
      )}
    </>
  );
}

// Security Step Component
interface SecurityStepProps {
  step: OnboardingStep;
  biometricEnabled: boolean;
  onBiometricChange: (value: boolean) => void;
  onNext: () => void;
  onSkip: () => void;
}

function SecurityStep({ step, biometricEnabled, onBiometricChange, onNext }: SecurityStepProps) {
  const theme = useTheme();
  const { isAvailable, type } = useBiometricAvailability();
  const biometricTypeName = formatBiometricType(type);
  const dispatch = useAppDispatch();

  const handleContinueJourney = useCallback(async () => {
    onNext();
  }, [onNext]);

  const handleBiometricToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        await authenticateWithBiometrics({
          promptMessage: `Enable ${biometricTypeName} to secure your Aura Log`,
          fallbackLabel: "Use passcode",
          errorMessage: `Failed to enable ${biometricTypeName}. Please try again.`,
          onSuccess: () => {
            onBiometricChange(true);
            // Save to Redux immediately when enabled
            dispatch(setBiometricEnabled(true));
          },
          onFailure: () => {
            onBiometricChange(false);
            dispatch(setBiometricEnabled(false));
          },
          disableDeviceFallback: false,
        });
      } else {
        onBiometricChange(false);
        // Save to Redux when disabled
        dispatch(setBiometricEnabled(false));
      }
    },
    [biometricTypeName, onBiometricChange, dispatch]
  );

  return (
    <OnboardingStepLayout
      step={step}
      content={
        <Box width="100%" gap="m">
          {/* Data privacy assurance - clear reassurance for users */}
          <Box
            padding="m"
            backgroundColor="surfaceDefault"
            borderRadius="m"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.08}
            shadowRadius={12}
            elevation={4}
            style={{
              borderLeftWidth: 6,
              borderRightWidth: 6,
              borderRightColor: theme.colors.primary,
              borderLeftColor: theme.colors.primary,
            }}>
            <Text variant="default" color="textDefault" fontWeight="600" marginBottom="xs">
              Your data is secure
            </Text>
            <Text variant="caption" color="textSubdued" lineHeight={20}>
              All journal entries are stored only on your device—nowhere else. Only you have access to your personal
              reflections.
            </Text>
          </Box>

          {isAvailable ? (
            <Box
              padding="m"
              backgroundColor="surfaceDefault"
              borderRadius="m"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.08}
              shadowRadius={12}
              elevation={4}>
              <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                <Box flex={1}>
                  <Text variant="default" color="textDefault" style={{ marginBottom: 4 }}>
                    Enable {biometricTypeName}
                  </Text>
                  <Text variant="caption" color="textSubdued">
                    Use {biometricTypeName} to quickly and securely access your Aura Log
                  </Text>
                </Box>
                <Switch value={biometricEnabled} onValueChange={handleBiometricToggle} />
              </Box>
            </Box>
          ) : (
            <Box padding="m" backgroundColor="surfaceDefault" borderRadius="m">
              <Text variant="default" color="textSubdued" textAlign="center">
                Biometric authentication is not available on this device
              </Text>
            </Box>
          )}
        </Box>
      }
      buttons={
        <Box width="100%" gap="s">
          <Button
            label={step.primaryButton}
            variant="primary"
            size="large"
            onPress={handleContinueJourney}
            style={styles.button}
          />
        </Box>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  button: {
    width: "100%",
  },
  // Consistent layout sections
  headerSection: {
    width: "100%",
  },
  logoImage: {
    width: 240,
    height: 180,
    alignSelf: "center",
  },
  contentSection: {
    width: "100%",
  },
  // Decorative elements
  decorativeCircle1: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(155, 135, 245, 0.1)",
    top: -10,
    left: -50,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(125, 211, 192, 0.1)",
    bottom: 100,
    right: -30,
  },
  decorativeCircle3: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(155, 135, 245, 0.1)",
    top: 130,
    left: -50,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "500",
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  timeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  avatarSlot: {
    width: AVATAR_PICKER_SIZE + 8,
    height: AVATAR_PICKER_SIZE + 8,
    borderRadius: (AVATAR_PICKER_SIZE + 8) / 2,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: AVATAR_PICKER_SIZE,
    height: AVATAR_PICKER_SIZE,
  },
});

