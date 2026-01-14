import React, { useState, useRef, useCallback } from "react";
import { StyleSheet, KeyboardAvoidingView, Platform, View, TouchableOpacity, Modal } from "react-native";
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
import { setOnboardingComplete } from "@common/redux/slices/appConfiguration/app-configuration.slice";
import { Storage } from "@common/services/Storage";
import { NotificationService } from "@common/services/notificationService";
import { GRADIENTS } from "@common/components/theme/gradients";
import { Image } from "expo-image";
import { useBiometricAvailability } from "@common/hooks/useBiometricAvailability";
import { authenticateWithBiometrics, formatBiometricType } from "@common/utils/biometric-utils";
import { ScrollView } from "react-native-gesture-handler";

// Image mapping for onboarding steps
const ONBOARDING_IMAGES = {
  1: require("@common/assets/onboarding/onboarding-1.png"),
  2: require("@common/assets/onboarding/onboarding-2.png"),
  3: require("@common/assets/onboarding/onboarding-3.png"),
  4: require("@common/assets/onboarding/onboarding-4.png"),
};

interface OnboardingData {
  user_name?: string;
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
    
    // Save notification settings using the same keys as settings screen
    if (onboardingData.daily_notifications !== undefined) {
      await Storage.setItem(NotificationService.NOTIFICATION_ENABLED_KEY, onboardingData.daily_notifications);
    }
    if (onboardingData.notification_time) {
      await Storage.setItem(NotificationService.NOTIFICATION_TIME_KEY, onboardingData.notification_time);
    }
    
    // Schedule notification if enabled
    if (onboardingData.daily_notifications && onboardingData.notification_time) {
      try {
        await NotificationService.scheduleDailyNotification(
          onboardingData.notification_time,
          onboardingData.user_name || null
        );
      } catch (error) {
        // Silently fail - user can enable in settings later
      }
    }
    
    if (onboardingData.biometric_enabled !== undefined) {
      await Storage.setItem("biometric_enabled", onboardingData.biometric_enabled);
    }
    dispatch(setOnboardingComplete());
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
            onSkip={handleSkip}
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
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
            scrollEnabled={true}>
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
    </KeyboardAvoidingView>
  );
}

// Shared Layout Component for consistent positioning
interface OnboardingStepLayoutProps {
  step: OnboardingStep;
  content?: React.ReactNode;
  buttons: React.ReactNode;
}

function OnboardingStepLayout({ step, content, buttons }: OnboardingStepLayoutProps) {
  return (
    <Box flex={1} paddingTop="xl" paddingHorizontal="m" paddingBottom="xl">
      {/* Decorative gradient circles */}
      <View style={step.step === 1 ? styles.decorativeCircle3 : styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      {/* Scrollable content section */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        <Box alignItems="center" zIndex={1} marginVertical={"xl"} style={styles.headerSection}>
          <Image
            source={ONBOARDING_IMAGES[step.step as keyof typeof ONBOARDING_IMAGES]}
            contentFit="contain"
            style={styles.logoImage}
          />
          <Text variant="h1-pacifico" color="textDefault" textAlign="center" marginTop="l" style={styles.title}>
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
            <Box height={100} />
          </>
        )}
      </ScrollView>

      {/* Fixed button section - Always at bottom, outside ScrollView */}
      <Box width="100%" zIndex={1}>
        {buttons}
      </Box>
    </Box>
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

// Input Step Component
interface InputStepProps {
  step: OnboardingStep;
  value?: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

function InputStep({ step, value = "", onChange, onNext }: InputStepProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleNext = () => {
    if (inputValue.trim()) {
      onChange(inputValue.trim());
      onNext();
    }
  };

  return (
    <OnboardingStepLayout
      step={step}
      content={
        <TextInput
          placeholder={step.input?.placeholder || ""}
          value={inputValue}
          onChangeText={setInputValue}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleNext}
        />
      }
      buttons={
        <Button
          label={step.primaryButton}
          variant="primary"
          size="large"
          onPress={handleNext}
          disabled={!inputValue.trim()}
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

function SecurityStep({ step, biometricEnabled, onBiometricChange, onNext, onSkip }: SecurityStepProps) {
  const { isAvailable, type } = useBiometricAvailability();
  const biometricTypeName = formatBiometricType(type);

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
          },
          onFailure: () => {
            onBiometricChange(false);
          },
          disableDeviceFallback: false,
        });
      } else {
        onBiometricChange(false);
      }
    },
    [biometricTypeName, onBiometricChange]
  );

  const handleSkip = useCallback(() => {
    onBiometricChange(false);
    onSkip();
  }, [onBiometricChange, onSkip]);

  return (
    <OnboardingStepLayout
      step={step}
      content={
        isAvailable ? (
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
        )
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
});

