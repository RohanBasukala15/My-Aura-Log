import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
  Switch,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
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
import { trackUpgradeClick } from "@common/services/analyticsService";
import { PremiumService } from "@common/services/premiumService";
import { NotificationService } from "@common/services/notificationService";
import { UserService } from "@common/services/userService";
import AppConstants from "@common/assets/AppConstants";
import { resetState } from "@common/redux/actions";
import { store } from "@common/redux/store";
import { useAppDispatch, useAppSelector } from "@common/redux/hooks";
import { setBiometricEnabled } from "@common/redux/slices/appConfiguration/app-configuration.slice";
import { useBiometricAvailability } from "@common/hooks/useBiometricAvailability";
import { authenticateWithBiometrics, formatBiometricType } from "@common/utils/biometric-utils";

import { NotificationsSection } from "@common/screens/settings/NotificationsSection";
import { SoulLinkSection } from "@common/screens/settings/SoulLinkSection";
import { DangerZoneSection } from "@common/screens/settings/DangerZoneSection";
import { LegalSection } from "@common/screens/settings/LegalSection";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SOUL_LINK_AVATAR_SEED_KEY, getAvatarUri } from "@common/constants/soulLinkAvatars";

const {
  NOTIFICATION_ENABLED_KEY,
  NOTIFICATION_TIME_KEY,
  DEFAULT_NOTIFICATION_TIME,
  createDateFromTimeString,
  formatDateToTimeString,
} = NotificationService;

// Constants
const showToast = {
  success: (text1: string, text2?: string) => Toast.show({ type: "success", text1, text2 }),
  error: (text1: string, text2?: string) => Toast.show({ type: "error", text1, text2 }),
  info: (text1: string, text2?: string) => Toast.show({ type: "info", text1, text2 }),
};

function Settings() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAvailable: isBiometricAvailable, type: biometricType } = useBiometricAvailability();
  const biometricEnabled = useAppSelector(state => state.appConfiguration.biometricEnabled ?? false);
  const biometricTypeName = formatBiometricType(biometricType);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState(DEFAULT_NOTIFICATION_TIME);
  const [refreshing, setRefreshing] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [iosTimePickerValue, setIosTimePickerValue] = useState<Date>(() =>
    createDateFromTimeString(DEFAULT_NOTIFICATION_TIME)
  );
  const [userName, setUserName] = useState<string>("");
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>("1.0.0");
  const isInitialLoad = useRef(true);

  const requestPermissions = useCallback(async () => {
    const granted = await NotificationService.requestNotificationPermissions();
    if (!granted) {
      showToast.info("Notifications disabled", "Flip them back on in your device settings whenever you're ready.");
    }
    return granted;
  }, []);


  const loadUserName = useCallback(async () => {
    try {
      const name = await Storage.getItem<string>("user_name", "");
      setUserName(name || "");
    } catch (error) {
      // Silently fail
    }
  }, []);

  const loadAvatarSeed = useCallback(async () => {
    try {
      const seed = await Storage.getItem<string>(SOUL_LINK_AVATAR_SEED_KEY, null);
      setAvatarSeed(seed);
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

      // When enabled: daily reminder is sent by Firebase Cloud Function (FCM). Sync prefs + token to Firestore only.
      if (finalEnabled) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
        const fcmToken = await Storage.getItem<string>(AppConstants.StorageKey.fcmToken, null);
        const isPremium = await PremiumService.isPremium();
        await UserService.updateMotivationNotifications({
          enabled: true,
          notificationTime: finalTime,
          timezone,
          fcmToken: fcmToken ?? undefined,
          isPremium,
        });
      }
    } catch (error) {
      // Silently fail - settings will use defaults
    }
  }, []);

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
      await loadAvatarSeed();
      await requestPermissions();
      await loadAppVersion();
      isInitialLoad.current = false;
    };
    init();
  }, [loadSettings, loadUserName, loadAvatarSeed, requestPermissions, loadAppVersion]);

  useFocusEffect(
    useCallback(() => {
      if (!isInitialLoad.current) {
        loadUserName();
        loadAvatarSeed();
        // Re-sync notification prefs to Firestore when returning (e.g. after becoming premium) so Cloud Function sends with quote
        if (notificationsEnabled) {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
          Storage.getItem<string>(AppConstants.StorageKey.fcmToken, null).then(fcmToken =>
            PremiumService.isPremium().then(isPremium =>
              UserService.updateMotivationNotifications({
                enabled: true,
                notificationTime,
                timezone,
                fcmToken: fcmToken ?? undefined,
                isPremium,
              })
            )
          );
        }
      }
    }, [loadUserName, loadAvatarSeed, notificationsEnabled, notificationTime])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSettings();
      await loadUserName();
      await loadAvatarSeed();
    } catch (error) {
      // Silently fail
    } finally {
      setRefreshing(false);
    }
  }, [loadSettings, loadUserName, loadAvatarSeed]);

  const handleOpenPaywall = useCallback(() => {
    trackUpgradeClick("settings");
    router.push({ pathname: "/(home)/paywall", params: { source: "settings" } });
  }, [router]);



  const handleNotificationTimeUpdate = useCallback(
    async (date: Date) => {
      const newTime = formatDateToTimeString(date);

      setNotificationTime(newTime);
      setIosTimePickerValue(date);
      await Storage.setItem(NOTIFICATION_TIME_KEY, newTime);

      if (!notificationsEnabled) {
        return;
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
      const fcmToken = await Storage.getItem<string>(AppConstants.StorageKey.fcmToken, null);
      const isPremium = await PremiumService.isPremium();
      await UserService.updateMotivationNotifications({
        enabled: true,
        notificationTime: newTime,
        timezone,
        fcmToken: fcmToken ?? undefined,
        isPremium,
      });
      showToast.success("Reminder refreshed", `We'll nudge you at ${newTime}.`);
    },
    [notificationsEnabled]
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


  const handleSendEmail = useCallback(async () => {
    const email = AppConstants.Resources.contactEmail;
    const subject = "My Aura Log Feedback";
    const body = "Hi My Aura Log team,\n\nI wanted to reach out about...\n\n";

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (isAvailable) {
        const result = await MailComposer.composeAsync({
          recipients: [email],
          subject,
          body,
        });
        if (result.status === MailComposer.MailComposerStatus.SENT) {
          showToast.success("Email sent successfully", "Thank you for your feedback!");
        }
        return;
      }

      // Fallback: open mailto: (works on iOS when Mail isn't configured or user prefers another app)
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        showToast.info("No email app found", `Please email us at ${email}`);
      }
    } catch (error) {
      showToast.error("Couldn't open email", `Please email us at ${email}`);
    }
  }, []);

  const handleNotificationToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          setNotificationsEnabled(false);
          return;
        }
      }

      setNotificationsEnabled(value);
      await Storage.setItem(NOTIFICATION_ENABLED_KEY, value);

      if (value) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
        const fcmToken = await Storage.getItem<string>(AppConstants.StorageKey.fcmToken, null);
        const isPremium = await PremiumService.isPremium();
        await UserService.updateMotivationNotifications({
          enabled: true,
          notificationTime,
          timezone,
          fcmToken: fcmToken ?? undefined,
          isPremium,
        });
        showToast.success("Reminders on", `We'll check in at ${notificationTime}—even when the app is closed.`);
      } else {
        await UserService.updateMotivationNotifications({ enabled: false });
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
          showToast.info("Reminders off", "Jump back in whenever you like.");
        } catch (error) {
          // Silently fail
        }
      }
    },
    [notificationTime, requestPermissions]
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

        {/* Profile Section - navigates to Edit Profile screen */}
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
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(home)/edit-profile" as never)}
            style={styles.profileRow}>
            <Box flex={1}>
              <Text variant="default" color="textSubdued" marginBottom="xs">
                Name
              </Text>
              <Text variant="h5" color="textDefault">
                {userName || "Not set"}
              </Text>
            </Box>
            <Box flexDirection="row" alignItems="center" gap="s">
              <Box
                overflow="hidden"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.backgroundDefault,
                }}>
                {avatarSeed ? (
                  <Image
                    source={{ uri: getAvatarUri(avatarSeed, 40) }}
                    style={{ width: 40, height: 40 }}
                    contentFit="cover"
                  />
                ) : (
                  <Box style={{ width: 40, height: 40 }} alignItems="center" justifyContent="center">
                    <Text variant="caption" color="textSubdued">
                      {userName?.slice(0, 1)?.toUpperCase() ?? "?"}
                    </Text>
                  </Box>
                )}
              </Box>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSubdued} />
            </Box>
          </TouchableOpacity>
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
        <SoulLinkSection />
        <Box
          marginBottom="l"
          padding="m"
          borderRadius="m"
          style={{
            backgroundColor: theme.colors.white,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}>
          <Text variant="h4" marginBottom="xs" color="textDefault">
            Premium
          </Text>
          <Text variant="caption" color="textSubdued" marginBottom="m">
            Unlimited AI plus Weekly and Daily Reflections. View plans, intro offers, and referral perks.
          </Text>
          <TouchableOpacity
            onPress={handleOpenPaywall}
            style={{
              backgroundColor: "#9B87F5",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 10,
              alignItems: "center",
            }}>
            <Text variant="button" style={{ color: "#FFFFFF" }}>
              See What&apos;s Included
            </Text>
          </TouchableOpacity>
        </Box>


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

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
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

