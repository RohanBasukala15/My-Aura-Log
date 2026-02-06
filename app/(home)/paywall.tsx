import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import PagerView from "react-native-pager-view";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { PurchasesPackage } from "react-native-purchases";

import { Box, Text, useTheme } from "@common/components/theme";
import { PaymentService } from "@common/services/paymentService";
import { PremiumService } from "@common/services/premiumService";
import { ReferralService } from "@common/services/referralService";

const PAYMENT_UNAVAILABLE_MESSAGE = "Payment service is not configured. Please contact support.";

const showToast = {
  success: (text1: string, text2?: string) => Toast.show({ type: "success", text1, text2 }),
  error: (text1: string, text2?: string) => Toast.show({ type: "error", text1, text2 }),
  info: (text1: string, text2?: string) => Toast.show({ type: "info", text1, text2 }),
};

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [remainingAI, setRemainingAI] = useState<number>(-1);
  const [isProcessingPayment, setIsProcessingPayment] = useState<"monthly" | "lifetime" | "restore" | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [lifetimePackage, setLifetimePackage] = useState<PurchasesPackage | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralCount, setReferralCount] = useState(0);
  const [remainingReferrals, setRemainingReferrals] = useState(3);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  const loadPremiumStatus = useCallback(async () => {
    try {
      if (PaymentService.isAvailable()) {
        await PaymentService.checkPremiumStatus();
      }
      const premium = await PremiumService.isPremium();
      const earnedViaReferrals = await ReferralService.hasEarnedPremiumViaReferrals();
      const finalPremium = premium || earnedViaReferrals;
      if (earnedViaReferrals && !premium) {
        await PremiumService.setPremiumStatus(true);
      }
      const remaining = await PremiumService.getRemainingAIUsage();
      setIsPremium(finalPremium);
      setRemainingAI(remaining);
    } catch (error) {
      // Silently fail
    }
  }, []);

  const loadPackages = useCallback(async () => {
    try {
      if (!PaymentService.isAvailable()) {
        return;
      }
      const lifetimePkg = await PaymentService.getLifetimePackage();
      const monthlyPkg = await PaymentService.getMonthlyPackage();
      setLifetimePackage(lifetimePkg);
      setMonthlyPackage(monthlyPkg);
    } catch (error) {
      // Silently fail
    }
  }, []);

  const loadReferralData = useCallback(async () => {
    try {
      const count = await ReferralService.getReferralCount();
      const code = await ReferralService.getMyReferralCode();
      const remainingRefs = await ReferralService.getRemainingReferrals();
      setReferralCount(count);
      setReferralCode(code);
      setRemainingReferrals(remainingRefs);
    } catch (error) {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadPremiumStatus();
    loadPackages();
    loadReferralData();
  }, [loadPremiumStatus, loadPackages, loadReferralData]);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

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

  const handleOpenReferralModal = useCallback(() => {
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
        await loadReferralData();
      } else {
        showToast.error("Couldn't apply the code", result.message);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again in a moment.";
      showToast.error("Something went wrong", errorMessage);
    } finally {
      setIsSubmittingCode(false);
    }
  }, [referralCodeInput, loadPremiumStatus, loadReferralData]);

  const renderOfferMeta = (pkg: PurchasesPackage | null) => {
    if (!pkg) {
      return null;
    }

    const hasIntroPrice = !!pkg.product.introPrice;
    const discountCount = pkg.product.discounts?.length || 0;

    if (!hasIntroPrice && discountCount === 0) {
      return null;
    }

    return (
      <Box marginTop="xs" alignItems="center" gap="xs">
        {hasIntroPrice && (
          <Box style={styles.metaPill}>
            <Text variant="caption" style={styles.metaText}>
              Intro offer: {pkg.product.introPrice?.priceString}
            </Text>
          </Box>
        )}
        {discountCount > 0 && (
          <Box style={styles.metaPill}>
            <Text variant="caption" style={styles.metaText}>
              {discountCount} discount{discountCount === 1 ? "" : "s"} available
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box flex={1} style={{ backgroundColor: theme.colors.backgroundDefault }}>
      <StatusBar style="dark" />
      <Box padding="m" paddingTop="xxxl">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
          <Text variant="h2-pacifico" color="textDefault">
            Premium
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text variant="button" color="primary">
              Close
            </Text>
          </TouchableOpacity>
        </Box>
      </Box>

      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}>
        <Box key="plans" flex={1}>
          <ScrollView contentContainerStyle={styles.pageContainer} showsVerticalScrollIndicator={false}>
            <Text variant="h4" color="textDefault" marginBottom="xs">
              Upgrade to Premium
            </Text>
            <Text variant="caption" color="textSubdued" marginBottom="m">
              Unlock unlimited AI analysis and support future development
            </Text>

            {isPremium && (
              <Box marginBottom="m" padding="s" borderRadius="m" style={{ backgroundColor: theme.colors.backgroundHovered }}>
                <Text variant="h7" color="primary" textAlign="center">
                  You already have Premium 🎉
                </Text>
              </Box>
            )}

            {remainingAI >= 0 && (
              <Box marginBottom="m" padding="s" borderRadius="m" style={{ backgroundColor: theme.colors.backgroundHovered }}>
                <Text variant="h7" color="textDefault" textAlign="center">
                  {remainingAI > 0
                    ? `You have ${remainingAI} free AI analysis${remainingAI === 1 ? "" : "es"} remaining today`
                    : "You've used all free AI analyses for today"}
                </Text>
              </Box>
            )}

            <TouchableOpacity
              onPress={handleBuyMonthly}
              activeOpacity={0.8}
              style={[styles.premiumButton, styles.monthlyButton]}
              disabled={isProcessingPayment !== null || isPremium}>
              <LinearGradient
                colors={isProcessingPayment === "monthly" ? ["#D3D3D3", "#B8B8B8"] : ["#9B87F5", "#7DD3C0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumButtonGradient}>
                {isProcessingPayment === "monthly" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Box alignItems="center">
                    <Text variant="button" style={styles.premiumButtonText}>
                      ⭐ Monthly Premium
                    </Text>
                    <Text variant="caption" style={styles.priceText}>
                      {monthlyPackage?.product.priceString || "Loading price..."} / month
                    </Text>
                    {renderOfferMeta(monthlyPackage)}
                  </Box>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <Text variant="caption" color="textSubdued" marginTop="xs" marginBottom="s" textAlign="center">
              Auto-renewable monthly subscription. Cancel anytime in device Settings.
            </Text>

            <TouchableOpacity
              onPress={handleBuyLifetime}
              activeOpacity={0.8}
              style={[styles.premiumButton, styles.lifetimeButton]}
              disabled={isProcessingPayment !== null || isPremium}>
              <LinearGradient
                colors={isProcessingPayment === "lifetime" ? ["#D3D3D3", "#B8B8B8"] : ["#7DD3C0", "#9B87F5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumButtonGradient}>
                {isProcessingPayment === "lifetime" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Box alignItems="center">
                    <Text variant="button" style={styles.premiumButtonText}>
                      ☕ Lifetime Premium
                    </Text>
                    <Text variant="caption" style={styles.priceText}>
                      {lifetimePackage?.product.priceString || "Loading price..."} one-time
                    </Text>
                    {renderOfferMeta(lifetimePackage)}
                  </Box>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRestorePurchases}
              style={styles.restoreButton}
              disabled={isProcessingPayment !== null}>
              {isProcessingPayment === "restore" ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text variant="h7" color="primary" textAlign="center">
                  Restore Purchases
                </Text>
              )}
            </TouchableOpacity>

            <Box marginTop="m" flexDirection="row" flexWrap="wrap" justifyContent="center" alignItems="center" gap="s">
              <TouchableOpacity onPress={() => router.push("/(home)/privacy-policy")} style={styles.legalLink}>
                <Text variant="caption" color="primary">
                  Privacy Policy
                </Text>
              </TouchableOpacity>
              <Text variant="caption" color="textSubdued">
                •
              </Text>
              <TouchableOpacity onPress={() => router.push("/(home)/terms")} style={styles.legalLink}>
                <Text variant="caption" color="primary">
                  Terms of Use (EULA)
                </Text>
              </TouchableOpacity>
            </Box>

            <Box marginTop="l" alignItems="center">
              <Text variant="caption" color="textSubdued">
                Swipe for referral perks →
              </Text>
            </Box>
          </ScrollView>
        </Box>

        <Box key="referral" flex={1}>
          <ScrollView contentContainerStyle={styles.pageContainer} showsVerticalScrollIndicator={false}>
            <Text variant="h4" color="textDefault" marginBottom="xs">
              Invite Friends
            </Text>
            <Text variant="caption" color="textSubdued" marginBottom="m">
              When 3 friends join using your code, you unlock premium access.
            </Text>

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

            <Box marginTop="m" padding="s" borderRadius="m" style={{ backgroundColor: theme.colors.backgroundHovered }}>
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
                    Share this code with friends to unlock premium together.
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

            {referralCount > 0 && (
              <Box marginTop="m" padding="s" borderRadius="m" style={{ backgroundColor: theme.colors.backgroundHovered }}>
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

            <TouchableOpacity onPress={handleOpenReferralModal} style={styles.enterCodeButton}>
              <Text variant="h7" color="primary" textAlign="center">
                📝 Enter a Friend&apos;s Referral Code
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Box>
      </PagerView>

      <Box flexDirection="row" justifyContent="center" alignItems="center" paddingBottom="l" gap="xs">
        {[0, 1].map((index) => (
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

      <Modal
        visible={showReferralModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseReferralModal}>
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
    </Box>
  );
}

const styles = StyleSheet.create({
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(155, 135, 245, 0.15)",
  },
  premiumButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  monthlyButton: {
    shadowColor: "#9B87F5",
  },
  lifetimeButton: {
    shadowColor: "#7DD3C0",
  },
  premiumButtonGradient: {
    paddingVertical: 12,
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
  priceText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    opacity: 0.9,
  },
  metaPill: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaText: {
    color: "#FFFFFF",
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  legalLink: {
    paddingVertical: 4,
    paddingHorizontal: 4,
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
