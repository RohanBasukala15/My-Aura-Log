import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

import { Box, Text, useTheme } from "@common/components/theme";
import { Button } from "@common/components/ui/button";
import { JournalStorage } from "@common/services/journalStorage";
import { Storage } from "@common/services/Storage";
import { PremiumService } from "@common/services/premiumService";
import { PaymentService } from "@common/services/paymentService";
import { ReferralService } from "@common/services/referralService";

const NOTIFICATION_ENABLED_KEY = "myauralog_notifications_enabled";
const NOTIFICATION_TIME_KEY = "myauralog_notification_time";

function Settings() {
  const theme = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState("09:00");
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
          title: "My Aura Log Reminder 💭",
          body: "Hey, how's your mind feeling today? Take a moment to reflect.",
          sound: true,
          data: { type: "daily_reminder" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      console.log("Notification scheduled with ID:", notificationId, "at", time);
      return notificationId;
    } catch (error) {
      console.error("Error scheduling notification:", error);
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
          text2: "Please enable notifications in your device settings",
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return false;
    }
  };

  const loadSettings = async () => {
    try {
      const enabled = await Storage.getItem<boolean>(NOTIFICATION_ENABLED_KEY, false);
      const time = await Storage.getItem<string>(NOTIFICATION_TIME_KEY, "09:00");
      const finalEnabled = enabled || false;
      const finalTime = time || "09:00";

      setNotificationsEnabled(finalEnabled);
      setNotificationTime(finalTime);

      // Restore notification schedule if it was enabled
      if (finalEnabled) {
        try {
          await scheduleDailyNotification(finalTime);
          console.log("Notification schedule restored");
        } catch (error) {
          console.error("Error restoring notification schedule:", error);
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
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
      console.error("Error refreshing:", error);
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
      console.error("Error loading premium status:", error);
      // Still try to load referral code even if there's an error
      try {
        const code = await ReferralService.getMyReferralCode();
        setReferralCode(code);
      } catch (codeError) {
        console.error("Error loading referral code:", codeError);
      }
    }
  };

  const handleBuyPremium = async () => {
    // Check if payment service is available
    if (!PaymentService.isAvailable()) {
      Alert.alert(
        "Payment Not Available",
        "Payment service is not configured. Please add your RevenueCat API key to the .env file.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Buy Me a Coffee ☕",
      "Support My Aura Log with a $5 one-time payment to unlock:\n\n✨ Unlimited AI Analysis\n✨ No daily limits\n✨ Support future development\n\nThank you for your support!",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Buy Premium ($5)",
          style: "default",
          onPress: async () => {
            setIsProcessingPayment(true);
            try {
              const success = await PaymentService.purchasePremium();
              if (success) {
                await loadPremiumStatus();
                Toast.show({
                  type: "success",
                  text1: "Premium Activated! 🎉",
                  text2: "Thank you for your support!",
                });
              } else {
                Toast.show({
                  type: "error",
                  text1: "Purchase failed",
                  text2: "Please try again",
                });
              }
            } catch (error: any) {
              if (error.message === "Purchase cancelled") {
                Toast.show({
                  type: "info",
                  text1: "Purchase cancelled",
                });
              } else {
                Toast.show({
                  type: "error",
                  text1: "Purchase failed",
                  text2: error.message || "Please try again",
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
          onPress: async () => {
            setIsProcessingPayment(true);
            try {
              const restored = await PaymentService.restorePurchases();
              if (restored) {
                await loadPremiumStatus();
                Toast.show({
                  type: "success",
                  text1: "Purchases restored! 🎉",
                  text2: "Your premium access has been restored",
                });
              } else {
                Toast.show({
                  type: "info",
                  text1: "No purchases found",
                  text2: "No previous purchases to restore",
                });
              }
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Restore failed",
                text2: error.message || "Please try again",
              });
            } finally {
              setIsProcessingPayment(false);
            }
          },
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

      const shareMessage = `Hey! I've been using My Aura Log - an amazing AI-powered mood journal! 🎨✨\n\nUse my referral code: ${referralCode}\n\nDownload it here:\n${storeUrl}\n\nWhen 3 friends join, I'll unlock premium features! 🎉`;

      try {
        const result = await Share.share({
          message: shareMessage,
          title: "Check out My Aura Log!",
        });

        if (result.action === Share.sharedAction) {
          Toast.show({
            type: "success",
            text1: "Invite shared! 🎉",
            text2: "Thank you for spreading the word!",
          });
        }
      } catch (shareError: any) {
        // If sharing fails, try opening the store directly
        console.error("Share error:", shareError);
        const canOpen = await Linking.canOpenURL(storeUrl);
        if (canOpen) {
          await Linking.openURL(storeUrl);
        } else {
          Toast.show({
            type: "error",
            text1: "Unable to share",
            text2: "Please try again",
          });
        }
      }
    } catch (error: any) {
      console.error("Error inviting friends:", error);
      Toast.show({
        type: "error",
        text1: "Failed to generate invite",
        text2: "Please try again",
      });
    }
  };

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
        // Verify notification was scheduled
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        console.log("Scheduled notifications:", scheduled.length);
        if (scheduled.length > 0) {
          console.log("Next notification at:", scheduled[0].trigger);
        }

        Toast.show({
          type: "success",
          text1: "Notifications enabled",
          text2: `Daily reminder set for ${notificationTime}`,
        });
      } catch (error) {
        console.error("Error scheduling notification:", error);
        setNotificationsEnabled(false);
        await Storage.setItem(NOTIFICATION_ENABLED_KEY, false);
        Toast.show({
          type: "error",
          text1: "Failed to schedule notification",
          text2: "Please try again",
        });
      }
    } else {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        Toast.show({
          type: "info",
          text1: "Notifications disabled",
        });
      } catch (error) {
        console.error("Error canceling notifications:", error);
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

        {/* Premium Section */}
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
            borderWidth: 2,
            borderColor: isPremium ? theme.colors.primary : "rgba(155, 135, 245, 0.3)",
          }}>
          {isPremium ? (
            <>
              <Box flexDirection="row" alignItems="center" marginBottom="m">
                <Text variant="h4" color="primary" marginRight="s">
                  ⭐ Premium
                </Text>
              </Box>
              <Text variant="default" color="textDefault" marginBottom="xs">
                You have unlimited AI analysis
              </Text>
              <Text variant="caption" color="textSubdued">
                Thank you for supporting My Aura Log! ☕
              </Text>
            </>
          ) : (
            <>
              <Text variant="h4" marginBottom="m" color="textDefault">
                Upgrade to Premium ⭐
              </Text>
              <Text variant="default" color="textDefault" marginBottom="s">
                Choose how you'd like to unlock premium features
              </Text>
              <Text variant="caption" color="textSubdued" marginBottom="m">
                Get unlimited AI analysis and support future development
              </Text>
              {remainingAI >= 0 && (
                <Box
                  marginBottom="m"
                  padding="s"
                  borderRadius="m"
                  style={{ backgroundColor: theme.colors.backgroundHovered }}>
                  <Text variant="h7" color="textDefault" textAlign="center">
                    {remainingAI > 0
                      ? `You have ${remainingAI} free AI analysis${remainingAI === 1 ? "" : "es"} remaining today`
                      : "You've used all free AI analyses for today"}
                  </Text>
                </Box>
              )}

              {/* Buy Me a Coffee Option */}
              <TouchableOpacity
                onPress={handleBuyPremium}
                activeOpacity={0.8}
                style={styles.premiumButton}
                disabled={isProcessingPayment}>
                <LinearGradient
                  colors={isProcessingPayment ? ["#D3D3D3", "#B8B8B8"] : ["#9B87F5", "#7DD3C0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumButtonGradient}>
                  {isProcessingPayment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text variant="button" style={styles.premiumButtonText}>
                      ☕ Buy Me a Coffee ($5)
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <Box flexDirection="row" alignItems="center" marginVertical="m">
                <Box flex={1} height={1} style={{ backgroundColor: theme.colors.borderSubdued }} />
                <Text variant="caption" color="textSubdued" marginHorizontal="s">
                  OR
                </Text>
                <Box flex={1} height={1} style={{ backgroundColor: theme.colors.borderSubdued }} />
              </Box>

              {/* Invite Friends Option */}
              <TouchableOpacity onPress={handleInviteFriends} activeOpacity={0.8} style={styles.inviteButton}>
                <LinearGradient
                  colors={["#7DD3C0", "#9B87F5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumButtonGradient}>
                  <Text variant="button" style={styles.premiumButtonText}>
                    👥 Invite 3 Friends
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Referral Code Display - Always show if not premium */}
              <Box
                marginTop="m"
                padding="s"
                borderRadius="m"
                style={{ backgroundColor: theme.colors.backgroundHovered }}>
                <Text variant="h7" color="textDefault" textAlign="center" marginBottom="xs">
                  Your Referral Code
                </Text>
                {referralCode ? (
                  <>
                    <Text
                      variant="h4"
                      color="primary"
                      textAlign="center"
                      marginBottom="xs"
                      style={{ fontFamily: "monospace", letterSpacing: 2 }}>
                      {referralCode}
                    </Text>
                    <Text variant="caption" color="textSubdued" textAlign="center">
                      Share this code with friends! When 3 friends join using your code, you'll unlock premium.
                    </Text>
                  </>
                ) : (
                  <Box flexDirection="row" alignItems="center" justifyContent="center" marginTop="s">
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text variant="caption" color="textSubdued" marginLeft="s">
                      Loading referral code...
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Referral Progress */}
              {referralCount > 0 && (
                <Box
                  marginTop="m"
                  padding="s"
                  borderRadius="m"
                  style={{ backgroundColor: theme.colors.backgroundHovered }}>
                  <Text variant="h7" color="textDefault" textAlign="center" marginBottom="xs">
                    Referral Progress: {referralCount} / {3}
                  </Text>
                  <Text variant="caption" color="textSubdued" textAlign="center">
                    {remainingReferrals > 0
                      ? `${remainingReferrals} more ${remainingReferrals === 1 ? "friend" : "friends"} needed!`
                      : "You've reached the goal! Premium will be activated soon."}
                  </Text>
                </Box>
              )}

              {/* Enter Referral Code */}
              <TouchableOpacity
                onPress={() => {
                  setReferralCodeInput("");
                  setShowReferralModal(true);
                }}
                style={styles.enterCodeButton}>
                <Text variant="h7" color="primary" textAlign="center">
                  📝 Enter a Friend's Referral Code
                </Text>
              </TouchableOpacity>

              {/* Note about referral tracking */}
              <Box marginTop="s" padding="xs">
                <Text variant="caption" color="textSubdued" textAlign="center" style={{ fontStyle: "italic" }}>
                  Note: Referral tracking works locally. For full cross-device tracking, a backend service is required.
                </Text>
              </Box>

              {/* Restore Purchases */}
              <TouchableOpacity
                onPress={async () => {
                  setIsProcessingPayment(true);
                  try {
                    const restored = await PaymentService.restorePurchases();
                    if (restored) {
                      await loadPremiumStatus();
                      Toast.show({
                        type: "success",
                        text1: "Purchases restored! 🎉",
                        text2: "Your premium access has been restored",
                      });
                    } else {
                      Toast.show({
                        type: "info",
                        text1: "No purchases found",
                        text2: "No previous purchases to restore",
                      });
                    }
                  } catch (error: any) {
                    Toast.show({
                      type: "error",
                      text1: "Restore failed",
                      text2: error.message || "Please try again",
                    });
                  } finally {
                    setIsProcessingPayment(false);
                  }
                }}
                style={styles.restoreButton}
                disabled={isProcessingPayment}>
                <Text variant="h7" color="primary" textAlign="center">
                  Restore Purchases
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Box>

        {/* Notifications Section */}
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
            Notifications
          </Text>
          <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
            <Box flex={1}>
              <Text variant="default" color="textDefault" marginBottom="xs">
                Daily Reminders
              </Text>
              <Text variant="caption" color="textSubdued">
                Get reminded to journal every day at {notificationTime}
              </Text>
            </Box>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: theme.colors.borderSubdued, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </Box>
        </Box>

        {/* Danger Zone */}
        <Box
          marginBottom="l"
          padding="m"
          borderRadius="m"
          style={{
            backgroundColor: theme.colors.surfaceCriticalDefault,
            borderWidth: 1,
            borderColor: theme.colors.borderCriticalDefault,
          }}>
          <Text variant="h4" marginBottom="m" color="textCritical">
            Danger Zone
          </Text>
          <Text variant="default" color="textDefault" marginBottom="m">
            Clear all your journal entries. This action cannot be undone.
          </Text>
          <Button label="Clear All Data" onPress={handleClearData} variant="destructive" size="medium" />
        </Box>
      </Box>

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
              Enter Referral Code
            </Text>
            <Text variant="default" marginBottom="m" color="textSubdued" textAlign="center">
              Have a friend's referral code? Enter it here to help them unlock premium!
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
              placeholder="Enter referral code"
              placeholderTextColor={theme.colors.textSubdued}
              value={referralCodeInput}
              onChangeText={text => setReferralCodeInput(text.toUpperCase().trim())}
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
                      text1: "Invalid code",
                      text2: "Please enter a valid referral code",
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
                        text1: "Could not apply code",
                        text2: result.message,
                      });
                    }
                  } catch (error: any) {
                    Toast.show({
                      type: "error",
                      text1: "Error",
                      text2: error.message || "Please try again",
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
  testButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 8,
  },
  premiumButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  restoreButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#7DD3C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enterCodeButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9B87F5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
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

