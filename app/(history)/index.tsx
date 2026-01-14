import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { Box, Text, useTheme } from "@common/components/theme";
import { JournalStorage } from "@common/services/journalStorage";
import { Storage } from "@common/services/Storage";
import { PremiumService } from "@common/services/premiumService";
import { PaymentService } from "@common/services/paymentService";
import { ReferralService } from "@common/services/referralService";

import { PremiumSection } from "@common/screens/settings/PremiumSection";
import { NotificationsSection } from "@common/screens/settings/NotificationsSection";
import { DangerZoneSection } from "@common/screens/settings/DangerZoneSection";
import { LegalSection } from "@common/screens/settings/LegalSection";

const NOTIFICATION_ENABLED_KEY = "myauralog_notifications_enabled";
const NOTIFICATION_TIME_KEY = "myauralog_notification_time";
const DEFAULT_NOTIFICATION_TIME = "09:00";

const createDateFromTimeString = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(
    Number.isFinite(hours) ? hours : 9,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0
  );
  return date;
};

const formatDateToTimeString = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

function Settings() {
  const theme = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState(DEFAULT_NOTIFICATION_TIME);
  const [isPremium, setIsPremium] = useState(false);
  const [remainingAI, setRemainingAI] = useState<number>(-1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [referralCode, setReferralCode] = useState<string>("");
  const [remainingReferrals, setRemainingReferrals] = useState(3);
  const [refreshing, setRefreshing] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [iosTimePickerValue, setIosTimePickerValue] = useState<Date>(() => createDateFromTimeString(DEFAULT_NOTIFICATION_TIME));
  const isInitialLoad = useRef(true);

  // Define scheduleDailyNotification first so it can be used in loadSettings
  const scheduleDailyNotification = useCallback(async (time: string) => {
    try {
      // Cancel any existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Parse time
      const [hours, minutes] = time.split(":").map(Number);

      // Validate time
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error("Invalid time format");
      }

      // Schedule daily notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Daily Aura Check-In ✨",
          body: "Take a mindful pause and capture today's mood in your journal.",
          sound: true,
          data: { type: "daily_reminder" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      return notificationId;
    } catch (error) {
      throw error;
    }
  }, []);

  const requestPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Toast.show({
          type: "info",
          text1: "Notifications disabled",
          text2: "Flip them back on in your device settings whenever you're ready.",
        });
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const loadSettings = async () => {
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
  };

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await requestPermissions();
      await loadPremiumStatus();
      isInitialLoad.current = false;
    };
    init();
  }, [scheduleDailyNotification]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isInitialLoad.current) {
        loadPremiumStatus();
      }
    }, [])
  );

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPremiumStatus();
      await loadSettings();
    } catch (error) {
      // Silently fail
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadPremiumStatus = async () => {
    try {
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
  };

  const handleRestorePurchases = useCallback(async () => {
    setIsProcessingPayment(true);
    try {
      const restored = await PaymentService.restorePurchases();
      if (restored) {
        await loadPremiumStatus();
        Toast.show({
          type: "success",
          text1: "Premium restored! 🎉",
          text2: "All set! Welcome back to the full experience.",
        });
      } else {
        Toast.show({
          type: "info",
          text1: "No past purchases spotted",
          text2: "Looks like there's nothing to restore yet.",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Couldn't restore purchases",
        text2: error?.message || "Please try again in a moment.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }, [loadPremiumStatus]);

  const handleBuyPremium = async () => {
    // Check if payment service is available
    if (!PaymentService.isAvailable()) {
      Alert.alert(
        "Payment Unavailable",
        "Payment service is not configured. Please add your RevenueCat API key to the .env file.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Treat Yourself to Premium ☕",
      "A one-time $5 thank-you unlocks the full studio:\n\n✨ Unlimited AI reflections\n✨ No daily cooldowns\n✨ Fuels future magic\n\nYour support means the world!",
      [
        {
          text: "Maybe later",
          style: "cancel",
        },
        {
          text: "Unlock Premium ($5)",
          style: "default",
          onPress: async () => {
            setIsProcessingPayment(true);
            try {
              const success = await PaymentService.purchasePremium();
              if (success) {
                await loadPremiumStatus();
                Toast.show({
                  type: "success",
                  text1: "Premium unlocked! 🎉",
                  text2: "Thanks for fueling the journey!",
                });
              } else {
                Toast.show({
                  type: "error",
                  text1: "Purchase didn't go through",
                  text2: "Please try again in a moment.",
                });
              }
            } catch (error: any) {
              if (error.message === "Purchase cancelled") {
                Toast.show({
                  type: "info",
                  text1: "Purchase canceled",
                });
              } else {
                Toast.show({
                  type: "error",
                  text1: "Purchase didn't go through",
                  text2: error.message || "Please try again in a moment.",
                });
              }
            } finally {
              setIsProcessingPayment(false);
            }
          },
        },
        {
          text: "Restore Purchases",
          style: "default",
          onPress: handleRestorePurchases,
        },
      ],
      { cancelable: true }
    );
  };

  const handleInviteFriends = async () => {
    try {
      const referralLink = await ReferralService.getReferralLink();
      const urls = ReferralService.getAppStoreUrls();

      // Get the appropriate store URL based on platform
      const storeUrl = Platform.OS === "ios" ? urls.ios : urls.android;

      const shareMessage = `I've been journaling with My Aura Log, an AI-powered mood studio I love. 🎨✨\n\nUse my referral code: ${referralCode}\nGrab it here:\n${storeUrl}\n\nWhen 3 friends join, we both unlock premium vibes! 🎉`;

      try {
        const result = await Share.share({
          message: shareMessage,
          title: "Check out My Aura Log!",
        });

        if (result.action === Share.sharedAction) {
          Toast.show({
            type: "success",
            text1: "Invite sent! 🎉",
            text2: "Thanks for sharing the good energy!",
          });
        }
      } catch (shareError: any) {
        // If sharing fails, try opening the store directly
        const canOpen = await Linking.canOpenURL(storeUrl);
        if (canOpen) {
          await Linking.openURL(storeUrl);
        } else {
          Toast.show({
            type: "error",
            text1: "Couldn't share invite",
            text2: "Please try again in a moment.",
          });
        }
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to generate invite",
        text2: "Please try again",
      });
    }
  };

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
      Toast.show({
        type: "success",
        text1: "Reminder refreshed",
        text2: `We'll nudge you at ${newTime}.`,
      });
      } catch (error) {
        setNotificationTime(previousTime);
        setIosTimePickerValue(createDateFromTimeString(previousTime));
        await Storage.setItem(NOTIFICATION_TIME_KEY, previousTime);
        Toast.show({
          type: "error",
          text1: "Couldn't update reminder",
          text2: "Please try again in a moment.",
        });
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

  const handleNotificationToggle = async (value: boolean) => {
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

        Toast.show({
          type: "success",
          text1: "Reminders on",
          text2: `We'll check in at ${notificationTime}.`,
        });
      } catch (error) {
        setNotificationsEnabled(false);
        await Storage.setItem(NOTIFICATION_ENABLED_KEY, false);
        Toast.show({
          type: "error",
          text1: "Couldn't schedule reminder",
          text2: "Please try again in a moment.",
        });
      }
    } else {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        Toast.show({
          type: "info",
          text1: "Reminders off",
          text2: "Jump back in whenever you like.",
        });
      } catch (error) {
        // Silently fail
      }
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all your journal entries. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await JournalStorage.clearAllEntries();
              Toast.show({
                type: "success",
                text1: "All data cleared",
              });
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Failed to clear data",
              });
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
        <Text variant="h2" textAlign={"center"} marginBottom="l" color="textDefault">
          Settings
        </Text>

        <PremiumSection
          isPremium={isPremium}
          remainingAI={remainingAI}
          isProcessingPayment={isProcessingPayment}
          referralCode={referralCode}
          referralCount={referralCount}
          remainingReferrals={remainingReferrals}
          onBuyPremium={handleBuyPremium}
          onRestorePurchases={handleRestorePurchases}
          onInviteFriends={handleInviteFriends}
          onOpenReferralModal={openReferralModal}
        />

        <NotificationsSection
          notificationsEnabled={notificationsEnabled}
          notificationTime={notificationTime}
          onToggleNotifications={handleNotificationToggle}
          onSelectTime={handleSelectNotificationTime}
        />

        <DangerZoneSection onClearData={handleClearData} />

        <LegalSection appVersion="1.0.0" />

        {/* Contact Section */}
        <Box
          backgroundColor="white"
          borderRadius="l"
          padding="m"
          marginTop="m"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
          <Text variant="h3" marginBottom="xs" color="textDefault">
            We'd Love to Hear From You 💌
          </Text>
          <Text variant="default" marginBottom="m" color="textSubdued">
            Questions, ideas, or just want to share your thoughts? We're all ears.
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const email = "myauralog@gmail.com";
              const subject = encodeURIComponent("My Aura Log Feedback");
              const body = encodeURIComponent(
                "Hi My Aura Log team,\n\nI wanted to reach out about...\n\n"
              );
              const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

              try {
                const canOpen = await Linking.canOpenURL(mailtoUrl);
                if (canOpen) {
                  await Linking.openURL(mailtoUrl);
                } else {
                  Toast.show({
                    type: "info",
                    text1: "No email app found",
                    text2: "Please email us at myauralog@gmail.com",
                  });
                }
              } catch (error) {
                Toast.show({
                  type: "error",
                  text1: "Couldn't open email",
                  text2: "Please email us at myauralog@gmail.com",
                });
              }
            }}
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
      </Box>

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
        Got a friend's vibe code? Drop it here to boost their premium quest.
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
                onPress={() => {
                  setShowReferralModal(false);
                  setReferralCodeInput("");
                }}
                style={[styles.modalButton, styles.cancelButton]}
                disabled={isSubmittingCode}>
                <Text variant="button" color="textDefault">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  if (!referralCodeInput || referralCodeInput.trim().length === 0) {
                    Toast.show({
                      type: "error",
                      text1: "That code doesn't look right",
                      text2: "Double-check it and try again.",
                    });
                    return;
                  }

                  setIsSubmittingCode(true);
                  try {
                    const result = await ReferralService.enterReferralCode(referralCodeInput);
                    if (result.success) {
                      Toast.show({
                        type: "success",
                        text1: "Code applied! 🎉",
                        text2: result.message,
                      });
                      setShowReferralModal(false);
                      setReferralCodeInput("");
                      await loadPremiumStatus();
                    } else {
                      Toast.show({
                        type: "error",
                        text1: "Couldn't apply the code",
                        text2: result.message,
                      });
                    }
                  } catch (error: any) {
                    Toast.show({
                      type: "error",
                      text1: "Something went wrong",
                      text2: error.message || "Please try again in a moment.",
                    });
                  } finally {
                    setIsSubmittingCode(false);
                  }
                }}
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

