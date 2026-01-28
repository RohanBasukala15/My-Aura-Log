import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Share,
  Platform,
  Linking,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";
import * as MailComposer from "expo-mail-composer";
import * as Application from "expo-application";
import Toast from "react-native-toast-message";
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { Box, Text, useTheme } from "@common/components/theme";
import { JournalStorage } from "@common/services/journalStorage";
import { BreathingStorage } from "@common/services/breathingStorage";
import { Storage } from "@common/services/Storage";
import { EncryptedStorage } from "@common/services/EncryptedStorage";
import { PremiumService } from "@common/services/premiumService";
import { PaymentService } from "@common/services/paymentService";
import { ReferralService } from "@common/services/referralService";
import { NotificationService } from "@common/services/notificationService";
import AppConstants from "@common/assets/AppConstants";
import { resetState } from "@common/redux/actions";
import { store } from "@common/redux/store";
import { useAppDispatch, useAppSelector } from "@common/redux/hooks";
import { setBiometricEnabled } from "@common/redux/slices/appConfiguration/app-configuration.slice";
import { useBiometricAvailability } from "@common/hooks/useBiometricAvailability";
import { authenticateWithBiometrics, formatBiometricType } from "@common/utils/biometric-utils";

import { PremiumSection } from "@common/screens/settings/PremiumSection";
import { NotificationsSection } from "@common/screens/settings/NotificationsSection";
import { DangerZoneSection } from "@common/screens/settings/DangerZoneSection";
import { LegalSection } from "@common/screens/settings/LegalSection";

const {
  NOTIFICATION_ENABLED_KEY,
  NOTIFICATION_TIME_KEY,
  DEFAULT_NOTIFICATION_TIME,
  createDateFromTimeString,
  formatDateToTimeString,
} = NotificationService;

// Constants
const CONTACT_EMAIL = "myauralog@gmail.com";
const PAYMENT_UNAVAILABLE_MESSAGE = "Payment service is not configured. Please contact support.";

// Toast helper functions
const showToast = {
  success: (text1: string, text2?: string) => Toast.show({ type: "success", text1, text2 }),
  error: (text1: string, text2?: string) => Toast.show({ type: "error", text1, text2 }),
  info: (text1: string, text2?: string) => Toast.show({ type: "info", text1, text2 }),
};

function Settings() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { isAvailable: isBiometricAvailable, type: biometricType } = useBiometricAvailability();
  const biometricEnabled = useAppSelector(state => state.appConfiguration.biometricEnabled ?? false);
  const biometricTypeName = formatBiometricType(biometricType);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState(DEFAULT_NOTIFICATION_TIME);
  const [isPremium, setIsPremium] = useState(false);
  const [remainingAI, setRemainingAI] = useState<number>(-1);
  const [isProcessingPayment, setIsProcessingPayment] = useState<"monthly" | "lifetime" | "restore" | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralCode, setReferralCode] = useState<string>("");
  const [remainingReferrals, setRemainingReferrals] = useState(3);
  const [refreshing, setRefreshing] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [iosTimePickerValue, setIosTimePickerValue] = useState<Date>(() =>
    createDateFromTimeString(DEFAULT_NOTIFICATION_TIME)
  );
  const [userName, setUserName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [lifetimePrice, setLifetimePrice] = useState<string>();
  const [monthlyPrice, setMonthlyPrice] = useState<string>();
  const [appVersion, setAppVersion] = useState<string>("1.0.0");
  const isInitialLoad = useRef(true);

  // Define scheduleDailyNotification first so it can be used in loadSettings
  const scheduleDailyNotification = useCallback(
    async (time: string) => {
      return NotificationService.scheduleDailyNotification(time, userName);
    },
    [userName]
  );

  const requestPermissions = useCallback(async () => {
    const granted = await NotificationService.requestNotificationPermissions();
    if (!granted) {
      showToast.info("Notifications disabled", "Flip them back on in your device settings whenever you're ready.");
    }
    return granted;
  }, []);

  const loadPackagePrices = useCallback(async () => {
    try {
      if (!PaymentService.isAvailable()) {
        return;
      }

      const lifetimePkg = await PaymentService.getLifetimePackage();
      const monthlyPkg = await PaymentService.getMonthlyPackage();
      if (lifetimePkg) {
        setLifetimePrice(lifetimePkg.product.priceString);
      }

      if (monthlyPkg) {
        setMonthlyPrice(monthlyPkg.product.priceString);
      }
    } catch (error) {
      // Silently fail - will use default prices
    }
  }, []);

  const loadPremiumStatus = useCallback(async () => {
    try {
      // First, sync with RevenueCat to get the latest subscription status
      if (PaymentService.isAvailable()) {
        await PaymentService.checkPremiumStatus();
      }

      // Check premium status (this will sync from Firebase if configured)
      const premium = await PremiumService.isPremium();

      // Also check if user earned premium via referrals
      const earnedViaReferrals = await ReferralService.hasEarnedPremiumViaReferrals();
      const finalPremium = premium || earnedViaReferrals;

      if (earnedViaReferrals && !premium) {
        // Sync premium status
        await PremiumService.setPremiumStatus(true);
      }

      const remaining = await PremiumService.getRemainingAIUsage();
      setIsPremium(finalPremium);
      setRemainingAI(remaining);

      // Always load referral data (even if premium, so user can see their code)
      const count = await ReferralService.getReferralCount();
      const code = await ReferralService.getMyReferralCode();
      const remainingRefs = await ReferralService.getRemainingReferrals();
      setReferralCount(count);
      setReferralCode(code);
      setRemainingReferrals(remainingRefs);
    } catch (error) {
      // Still try to load referral code even if there's an error
      try {
        const code = await ReferralService.getMyReferralCode();
        setReferralCode(code);
      } catch (codeError) {
        // Silently fail
      }
    }
  }, []);

  const loadUserName = useCallback(async () => {
    try {
      const name = await Storage.getItem<string>("user_name", "");
      setUserName(name || "");
      setNameInput(name || "");
    } catch (error) {
      // Silently fail
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const enabled = await Storage.getItem<boolean>(NOTIFICATION_ENABLED_KEY, false);
      const time = await Storage.getItem<string>(NOTIFICATION_TIME_KEY, DEFAULT_NOTIFICATION_TIME);
      const finalEnabled = enabled || false;
      const finalTime = time || DEFAULT_NOTIFICATION_TIME;

      setNotificationsEnabled(finalEnabled);
      setNotificationTime(finalTime);
      setIosTimePickerValue(createDateFromTimeString(finalTime));

      // Restore notification schedule if it was enabled
      if (finalEnabled) {
        try {
          await scheduleDailyNotification(finalTime);
        } catch (error) {
          // Silently fail - user can re-enable if needed
        }
      }
    } catch (error) {
      // Silently fail - settings will use defaults
    }
  }, [scheduleDailyNotification]);

  const loadAppVersion = useCallback(async () => {
    try {
      const version = Application.nativeApplicationVersion || "1.0.0";
      const buildNumber = Application.nativeBuildVersion || "1";
      setAppVersion(`${version} (${buildNumber})`);
    } catch (error) {
      // Fallback to default version if there's an error
      setAppVersion("1.0.0");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await loadUserName();
      await requestPermissions();
      await loadPremiumStatus();
      await loadPackagePrices();
      await loadAppVersion();
      isInitialLoad.current = false;
    };
    init();
  }, [loadSettings, loadUserName, loadPremiumStatus, loadPackagePrices, requestPermissions, loadAppVersion]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isInitialLoad.current) {
        loadPremiumStatus();
        loadUserName();
        loadPackagePrices();
      }
    }, [loadPremiumStatus, loadUserName, loadPackagePrices])
  );

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPremiumStatus();
      await loadSettings();
      await loadUserName();
    } catch (error) {
      // Silently fail
    } finally {
      setRefreshing(false);
    }
  }, [loadSettings, loadPremiumStatus, loadUserName]);

  const handleSaveName = useCallback(async () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      showToast.error("Name can't be empty", "Please enter a name.");
      return;
    }

    try {
      await Storage.setItem("user_name", trimmedName);
      setUserName(trimmedName);
      setIsEditingName(false);
      showToast.success("Name updated! ✨", `We'll call you ${trimmedName} from now on.`);
    } catch (error) {
      showToast.error("Couldn't save name", "Please try again.");
    }
  }, [nameInput]);

  const handleCancelEditName = useCallback(() => {
    setNameInput(userName);
    setIsEditingName(false);
  }, [userName]);

  const handleRestorePurchases = useCallback(async () => {
    setIsProcessingPayment("restore");
    try {
      const restored = await PaymentService.restorePurchases();
      if (restored) {
        await loadPremiumStatus();
        showToast.success("Premium restored! 🎉", "All set! Welcome back to the full experience.");
      } else {
        showToast.info("No past purchases spotted", "Looks like there's nothing to restore yet.");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again in a moment.";
      showToast.error("Couldn't restore purchases", errorMessage);
    } finally {
      setIsProcessingPayment(null);
    }
  }, [loadPremiumStatus]);

  // Generic purchase handler to reduce duplication
  const handlePurchase = useCallback(
    async (purchaseFn: () => Promise<boolean>, successMessage: string, paymentType: "monthly" | "lifetime") => {
      if (!PaymentService.isAvailable()) {
        Alert.alert("Payment Unavailable", PAYMENT_UNAVAILABLE_MESSAGE, [{ text: "OK" }]);
        return;
      }

      setIsProcessingPayment(paymentType);
      try {
        const success = await purchaseFn();
        if (success) {
          await loadPremiumStatus();
          showToast.success("Premium unlocked! 🎉", successMessage);
        } else {
          showToast.error("Purchase didn't go through", "Please try again in a moment.");
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Please try again in a moment.";
        if (error instanceof Error && error.message === "Purchase cancelled") {
          showToast.info("Purchase canceled");
        } else {
          showToast.error("Purchase didn't go through", errorMessage);
        }
      } finally {
        setIsProcessingPayment(null);
      }
    },
    [loadPremiumStatus]
  );

  const handleBuyLifetime = useCallback(() => {
    handlePurchase(() => PaymentService.purchaseLifetime(), "Thanks for fueling the journey!", "lifetime");
  }, [handlePurchase]);

  const handleBuyMonthly = useCallback(() => {
    handlePurchase(() => PaymentService.purchaseMonthly(), "Welcome to premium!", "monthly");
  }, [handlePurchase]);

  // Memoize share message to avoid recreating on every render
  const shareMessage = useMemo(() => {
    const urls = ReferralService.getAppStoreUrls();
    const storeUrl = Platform.OS === "ios" ? urls.ios : urls.android;
    return `I've been journaling with My Aura Log, an AI-powered mood studio I love. 🎨✨\n\nUse my referral code: ${referralCode}\nGrab it here:\n${storeUrl}\n\nWhen 3 friends join, we both unlock premium vibes! 🎉`;
  }, [referralCode]);

  const handleInviteFriends = useCallback(async () => {
    try {
      const urls = ReferralService.getAppStoreUrls();
      const storeUrl = Platform.OS === "ios" ? urls.ios : urls.android;

      try {
        const result = await Share.share({
          message: shareMessage,
          title: "Check out My Aura Log!",
        });

        if (result.action === Share.sharedAction) {
          showToast.success("Invite sent! 🎉", "Thanks for sharing the good energy!");
        }
      } catch (shareError) {
        // If sharing fails, try opening the store directly
        const canOpen = await Linking.canOpenURL(storeUrl);
        if (canOpen) {
          await Linking.openURL(storeUrl);
        } else {
          showToast.error("Couldn't share invite", "Please try again in a moment.");
        }
      }
    } catch (error) {
      showToast.error("Failed to generate invite", "Please try again");
    }
  }, [shareMessage]);

  const handleNotificationTimeUpdate = useCallback(
    async (date: Date) => {
      const newTime = formatDateToTimeString(date);
      const previousTime = notificationTime;

      setNotificationTime(newTime);
      setIosTimePickerValue(date);
      await Storage.setItem(NOTIFICATION_TIME_KEY, newTime);

      if (!notificationsEnabled) {
        return;
      }

      try {
        await scheduleDailyNotification(newTime);
        showToast.success("Reminder refreshed", `We'll nudge you at ${newTime}.`);
      } catch (error) {
        setNotificationTime(previousTime);
        setIosTimePickerValue(createDateFromTimeString(previousTime));
        await Storage.setItem(NOTIFICATION_TIME_KEY, previousTime);
        showToast.error("Couldn't update reminder", "Please try again in a moment.");
      }
    },
    [notificationTime, notificationsEnabled, scheduleDailyNotification]
  );

  const handleSelectNotificationTime = useCallback(() => {
    const current = createDateFromTimeString(notificationTime);
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "time",
        is24Hour: true,
        onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
          if (event.type === "set" && selectedDate) {
            handleNotificationTimeUpdate(selectedDate);
          }
        },
      });
    } else {
      setIosTimePickerValue(current);
      setShowTimePicker(true);
    }
  }, [handleNotificationTimeUpdate, notificationTime]);

  const handleIosTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setIosTimePickerValue(selectedDate);
    }
  };

  const handleTimePickerCancel = useCallback(() => {
    setShowTimePicker(false);
    setIosTimePickerValue(createDateFromTimeString(notificationTime));
  }, [notificationTime]);

  const handleTimePickerConfirm = useCallback(async () => {
    await handleNotificationTimeUpdate(iosTimePickerValue);
    setShowTimePicker(false);
  }, [handleNotificationTimeUpdate, iosTimePickerValue]);

  const openReferralModal = useCallback(() => {
    setReferralCodeInput("");
    setShowReferralModal(true);
  }, []);

  const handleCloseReferralModal = useCallback(() => {
    setShowReferralModal(false);
    setReferralCodeInput("");
  }, []);

  const handleSubmitReferralCode = useCallback(async () => {
    if (!referralCodeInput || referralCodeInput.trim().length === 0) {
      showToast.error("That code doesn't look right", "Double-check it and try again.");
      return;
    }

    setIsSubmittingCode(true);
    try {
      const result = await ReferralService.enterReferralCode(referralCodeInput);
      if (result.success) {
        showToast.success("Code applied! 🎉", result.message);
        setShowReferralModal(false);
        setReferralCodeInput("");
        await loadPremiumStatus();
      } else {
        showToast.error("Couldn't apply the code", result.message);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again in a moment.";
      showToast.error("Something went wrong", errorMessage);
    } finally {
      setIsSubmittingCode(false);
    }
  }, [referralCodeInput, loadPremiumStatus]);

  const handleSendEmail = useCallback(async () => {
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        showToast.info("No email app found", `Please email us at ${CONTACT_EMAIL}`);
        return;
      }

      const result = await MailComposer.composeAsync({
        recipients: [CONTACT_EMAIL],
        subject: "My Aura Log Feedback",
        body: "Hi My Aura Log team,\n\nI wanted to reach out about...\n\n",
      });

      if (result.status === MailComposer.MailComposerStatus.SENT) {
        showToast.success("Email sent successfully", "Thank you for your feedback!");
      }
    } catch (error) {
      showToast.error("Couldn't open email", `Please email us at ${CONTACT_EMAIL}`);
    }
  }, []);

  const handleNotificationToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        // Request permissions first
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          setNotificationsEnabled(false);
          return;
        }
      }

      setNotificationsEnabled(value);
      await Storage.setItem(NOTIFICATION_ENABLED_KEY, value);

      if (value) {
        try {
          await scheduleDailyNotification(notificationTime);
          showToast.success("Reminders on", `We'll check in at ${notificationTime}.`);
        } catch (error) {
          setNotificationsEnabled(false);
          await Storage.setItem(NOTIFICATION_ENABLED_KEY, false);
          showToast.error("Couldn't schedule reminder", "Please try again in a moment.");
        }
      } else {
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
          showToast.info("Reminders off", "Jump back in whenever you like.");
        } catch (error) {
          // Silently fail
        }
      }
    },
    [notificationTime, requestPermissions, scheduleDailyNotification]
  );

  const handleBiometricToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        await authenticateWithBiometrics({
          promptMessage: `Enable ${biometricTypeName} to secure your Aura Log`,
          fallbackLabel: "Use passcode",
          errorMessage: `Failed to enable ${biometricTypeName}. Please try again.`,
          onSuccess: () => {
            dispatch(setBiometricEnabled(true));
            showToast.success(`${biometricTypeName} enabled`, "Your Aura Log is now secured.");
          },
          onFailure: () => {
            dispatch(setBiometricEnabled(false));
          },
          disableDeviceFallback: false,
        });
      } else {
        dispatch(setBiometricEnabled(false));
        showToast.info(`${biometricTypeName} disabled`, "You can re-enable it anytime.");
      }
    },
    [biometricTypeName, dispatch]
  );

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete ALL your data and reset the app to a fresh state. This includes:\n\n• All journal entries\n• All breathing sessions\n• All settings\n• Premium status\n• Referral data\n• User preferences\n\nThis action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all journal entries
              await JournalStorage.clearAllEntries();

              // Clear all breathing sessions
              await BreathingStorage.clearAllSessions();

              // Clear notification settings
              await Storage.removeItem(NotificationService.NOTIFICATION_ENABLED_KEY);
              await Storage.removeItem(NotificationService.NOTIFICATION_TIME_KEY);

              // Clear premium status and AI usage
              await PremiumService.setPremiumStatus(false);
              await PremiumService.resetDailyUsage();

              // Clear referral data (except referral code which is permanent per device)
              await Storage.removeItem("myauralog_referral_count");
              await Storage.removeItem("myauralog_referral_premium_granted");
              await Storage.removeItem("myauralog_referred_by");

              // Clear onboarding state
              await Storage.removeItem(AppConstants.StorageKey.onboardingState);

              // Clear user data from onboarding
              await Storage.removeItem("user_name");
              await Storage.removeItem("daily_notifications");
              await Storage.removeItem("biometric_enabled");
              await Storage.removeItem("pin_enabled");

              // Clear app session (encrypted storage)
              await EncryptedStorage.removeItem(AppConstants.StorageKey.appSession);

              // Clear remember user
              await Storage.removeItem(AppConstants.StorageKey.rememberUser);

              // Clear FCM tokens
              await Storage.removeItem(AppConstants.StorageKey.fcmToken);
              await Storage.removeItem(AppConstants.StorageKey.fcmRegistryCompleted);

              // Clear language preference
              await Storage.removeItem(AppConstants.StorageKey.appLanguage);

              // Clear theme state
              await Storage.removeItem("THEME_STATE_KEY");

              // Cancel all scheduled notifications
              await Notifications.cancelAllScheduledNotificationsAsync();

              // Reset Redux state
              resetState(store.dispatch);

              showToast.success("All data cleared", "The app has been reset to a fresh state.");
            } catch (error) {
              showToast.error("Failed to clear all data", "Some data may not have been cleared. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.backgroundDefault }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <StatusBar style="dark" />
      <Box padding="m" paddingTop="xxxl">
        <Text variant="h2-pacifico" textAlign={"center"} marginBottom="l" color="textDefault">
          Settings
        </Text>

        {/* Profile Section */}
        <Box
          marginBottom="l"
          padding="m"
          borderRadius="m"
          style={{
            backgroundColor: theme.colors.white,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
          <Text variant="h4" marginBottom="m" color="textDefault">
            Profile
          </Text>
          {!isEditingName ? (
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              <Box flex={1}>
                <Text variant="default" color="textSubdued" marginBottom="xs">
                  Name
                </Text>
                <Text variant="h5" color="textDefault">
                  {userName || "Not set"}
                </Text>
              </Box>
              <TouchableOpacity
                onPress={() => {
                  setNameInput(userName);
                  setIsEditingName(true);
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: theme.colors.backgroundHovered,
                }}>
                <Text variant="button" style={{ color: theme.colors.primary }}>
                  Edit
                </Text>
              </TouchableOpacity>
            </Box>
          ) : (
            <Box>
              <Text variant="default" color="textSubdued" marginBottom="xs">
                Name
              </Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    borderColor: theme.colors.borderSubdued,
                    color: theme.colors.textDefault,
                    backgroundColor: theme.colors.backgroundDefault,
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.textSubdued}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                maxLength={50}
              />
              <Box flexDirection="row" marginTop="s" gap="s">
                <Box flex={1}>
                  <TouchableOpacity onPress={handleCancelEditName} style={[styles.modalButton, styles.cancelButton]}>
                    <Text variant="button" color="textDefault" textAlign="center">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </Box>
                <Box flex={1}>
                  <TouchableOpacity onPress={handleSaveName} style={[styles.modalButton, styles.applyButton]}>
                    <Text variant="button" style={{ color: "#FFFFFF" }} textAlign="center">
                      Save
                    </Text>
                  </TouchableOpacity>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Security Section - Biometric Authentication */}
        {isBiometricAvailable && (
          <Box
            marginBottom="l"
            padding="m"
            borderRadius="m"
            style={{
              backgroundColor: theme.colors.white,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}>
            <Text variant="h4" marginBottom="m" color="textDefault">
              Security
            </Text>
            <Box>
              <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                <Box flex={1}>
                  <Text variant="default" color="textDefault" style={{ marginBottom: 4 }}>
                    Enable {biometricTypeName}
                  </Text>
                  <Text variant="caption" color="textSubdued">
                    Use {biometricTypeName} to quickly and securely access your Aura Log
                  </Text>
                </Box>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: theme.colors.borderSubdued, true: theme.colors.primary }}
                  thumbColor={theme.colors.white}
                />
              </Box>
            </Box>
          </Box>
        )}

        <NotificationsSection
          notificationsEnabled={notificationsEnabled}
          notificationTime={notificationTime}
          onToggleNotifications={handleNotificationToggle}
          onSelectTime={handleSelectNotificationTime}
        />
        <PremiumSection
          isPremium={isPremium}
          remainingAI={remainingAI}
          isProcessingPayment={isProcessingPayment}
          referralCode={referralCode}
          referralCount={referralCount}
          remainingReferrals={remainingReferrals}
          lifetimePrice={lifetimePrice}
          monthlyPrice={monthlyPrice}
          onBuyLifetime={handleBuyLifetime}
          onBuyMonthly={handleBuyMonthly}
          onRestorePurchases={handleRestorePurchases}
          onInviteFriends={handleInviteFriends}
          onOpenReferralModal={openReferralModal}
        />


        <LegalSection appVersion={appVersion} />
        {/* Contact Section */}
        <Box
          backgroundColor="white"
          borderRadius="l"
          padding="m"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
          <Text variant="h3" marginBottom="xs" color="textDefault">
            We&apos;d Love to Hear From You 💌
          </Text>
          <Text variant="default" marginBottom="m" color="textSubdued">
            Questions, ideas, or just want to share your thoughts? We&apos;re all ears.
          </Text>
          <TouchableOpacity
            onPress={handleSendEmail}
            style={{
              backgroundColor: "#9B87F5",
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Text variant="button" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Send Us a Message
            </Text>
          </TouchableOpacity>
        </Box>
        <Box marginVertical="l">
          <DangerZoneSection onClearData={handleClearData} />
        </Box>
      </Box>

      {Platform.OS === "ios" && showTimePicker && (
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
                <TouchableOpacity onPress={handleTimePickerCancel} style={[styles.modalButton, styles.cancelButton]}>
                  <Text variant="button" color="textDefault">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleTimePickerConfirm} style={[styles.modalButton, styles.applyButton]}>
                  <Text variant="button" style={{ color: "#FFFFFF" }}>
                    Save
                  </Text>
                </TouchableOpacity>
              </Box>
            </Box>
          </Box>
        </Modal>
      )}

      {/* Referral Code Entry Modal */}
      <Modal
        visible={showReferralModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReferralModal(false)}>
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
              Enter a Vibe Code
            </Text>
            <Text variant="default" marginBottom="m" color="textSubdued" textAlign="center">
              Got a friend&apos;s vibe code? Drop it here to boost their premium quest.
            </Text>

            <TextInput
              style={[
                styles.referralInput,
                {
                  borderColor: theme.colors.borderSubdued,
                  color: theme.colors.textDefault,
                  backgroundColor: theme.colors.backgroundDefault,
                },
              ]}
              placeholder="Enter vibe code"
              placeholderTextColor={theme.colors.textSubdued}
              value={referralCodeInput}
              onChangeText={(text: string) => setReferralCodeInput(text.toUpperCase().trim())}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isSubmittingCode}
              maxLength={20}
            />

            <Box flexDirection="row" marginTop="m" gap="s">
              <TouchableOpacity
                onPress={handleCloseReferralModal}
                style={[styles.modalButton, styles.cancelButton]}
                disabled={isSubmittingCode}>
                <Text variant="button" color="textDefault">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitReferralCode}
                style={[styles.modalButton, styles.applyButton]}
                disabled={isSubmittingCode || !referralCodeInput.trim()}>
                {isSubmittingCode ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text variant="button" style={{ color: "#FFFFFF" }}>
                    Apply
                  </Text>
                )}
              </TouchableOpacity>
            </Box>
          </Box>
        </Box>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: "HankenGrotesk_400Regular",
  },
  referralInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: "monospace",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  applyButton: {
    backgroundColor: "#9B87F5",
  },
});

export default Settings;

