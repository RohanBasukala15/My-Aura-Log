import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { useRouter, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { PurchasesPackage } from "react-native-purchases";
import LottieView from "lottie-react-native";

import { Box, Text, useTheme } from "@common/components/theme";
import {
  trackPaywallView,
  trackPurchaseStart,
  trackPurchaseSuccess,
  trackPurchaseCancel,
  trackReferralInviteShare,
} from "@common/services/analyticsService";
import { PaymentService } from "@common/services/paymentService";
import { PremiumService } from "@common/services/premiumService";
import { ReferralService } from "@common/services/referralService";

/* eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- Lottie asset; Metro resolves at build time */
const PREMIUM_CONFETTI_SOURCE = require("@common/assets/animations/premium-confetti.json");

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REFERRALS_NEEDED = 3;
const PAYMENT_UNAVAILABLE_ALERT = {
  title: "Payment Unavailable",
  message: "Payment service is not configured. Please contact support.",
};

const TOAST = {
  success: (text1: string, text2?: string) => Toast.show({ type: "success", text1, text2 }),
  error: (text1: string, text2?: string) => Toast.show({ type: "error", text1, text2 }),
  info: (text1: string, text2?: string) => Toast.show({ type: "info", text1, text2 }),
};

const PREMIUM_FEATURES = [
  { text: "Unlimited AI reflections on every entry", subdued: false },
  { text: "Weekly Reflection in Trends", subdued: false },
  { text: "Your Aura Today summary", subdued: false },
  { text: "Support development of My Aura Log", subdued: true },
];

const GRADIENT = {
  monthly: ["#9B87F5", "#7DD3C0"],
  lifetime: ["#7DD3C0", "#9B87F5"],
  disabled: ["#D3D3D3", "#B8B8B8"],
} as const;

type PaymentType = "monthly" | "lifetime" | "restore" | null;

interface IntroPrice {
  price?: number;
  periodUnit?: string;
  periodNumberOfUnits?: number;
  period?: string;
}

interface FreePhase {
  billingPeriod?: { value?: number; unit?: string };
  offerPaymentMode?: string;
}

interface ProductMeta {
  introPrice?: IntroPrice | null;
  defaultOption?: { freePhase?: FreePhase } | null;
  discounts?: unknown[];
  priceString?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// usePaywall hook – all state and handlers
// ─────────────────────────────────────────────────────────────────────────────

function usePaywall() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [remainingAI, setRemainingAI] = useState(-1);
  const [isProcessingPayment, setIsProcessingPayment] = useState<PaymentType>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [lifetimePackage, setLifetimePackage] = useState<PurchasesPackage | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [remainingReferrals, setRemainingReferrals] = useState(REFERRALS_NEEDED);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [showPremiumConfetti, setShowPremiumConfetti] = useState(false);

  const loadPremiumStatus = useCallback(async () => {
    try {
      if (PaymentService.isAvailable()) await PaymentService.checkPremiumStatus();
      const premium = await PremiumService.isPremium();
      const earnedViaReferrals = await ReferralService.hasEarnedPremiumViaReferrals();
      const finalPremium = premium || earnedViaReferrals;
      if (earnedViaReferrals && !premium) await PremiumService.setPremiumStatus(true);
      setRemainingAI(await PremiumService.getRemainingAIUsage());
      setIsPremium(finalPremium);
    } catch {
      /* silenty fail */
    }
  }, []);

  const loadPackages = useCallback(async () => {
    if (!PaymentService.isAvailable()) return;
    try {
      const [lifetimePkg, monthlyPkg] = await Promise.all([
        PaymentService.getLifetimePackage(),
        PaymentService.getMonthlyPackage(),
      ]);
      setLifetimePackage(lifetimePkg);
      setMonthlyPackage(monthlyPkg);
    } catch {
      /* silently fail */
    }
  }, []);

  const loadReferralData = useCallback(async () => {
    try {
      const [count, code, remaining] = await Promise.all([
        ReferralService.getReferralCount(),
        ReferralService.getMyReferralCode(),
        ReferralService.getRemainingReferrals(),
      ]);
      setReferralCount(count);
      setReferralCode(code);
      setRemainingReferrals(remaining);
    } catch {
      /* silently fail */
    }
  }, []);

  useEffect(() => {
    loadPremiumStatus();
    loadPackages();
    loadReferralData();
  }, [loadPremiumStatus, loadPackages, loadReferralData]);

  const purchase = useCallback(
    async (
      purchaseFn: () => Promise<boolean>,
      successMsg: string,
      type: "monthly" | "lifetime"
    ) => {
      if (!PaymentService.isAvailable()) {
        Alert.alert(PAYMENT_UNAVAILABLE_ALERT.title, PAYMENT_UNAVAILABLE_ALERT.message, [{ text: "OK" }]);
        return;
      }
      trackPurchaseStart(type);
      setIsProcessingPayment(type);
      try {
        const ok = await purchaseFn();
        if (ok) {
          trackPurchaseSuccess(type);
          await loadPremiumStatus();
          setShowPremiumConfetti(true);
          TOAST.success("Premium unlocked! 🎉", successMsg);
        } else {
          TOAST.error("Purchase didn't go through", "Please try again in a moment.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Please try again in a moment.";
        if (err instanceof Error && err.message === "Purchase cancelled") {
          trackPurchaseCancel(type);
          TOAST.info("Purchase canceled");
        } else {
          TOAST.error("Purchase didn't go through", msg);
        }
      } finally {
        setIsProcessingPayment(null);
      }
    },
    [loadPremiumStatus]
  );

  const buyMonthly = useCallback(
    () => purchase(() => PaymentService.purchaseMonthly(), "Welcome to premium!", "monthly"),
    [purchase]
  );

  const buyLifetime = useCallback(
    () => purchase(() => PaymentService.purchaseLifetime(), "Thanks for fueling the journey!", "lifetime"),
    [purchase]
  );

  const restorePurchases = useCallback(async () => {
    setIsProcessingPayment("restore");
    try {
      const restored = await PaymentService.restorePurchases();
      if (restored) {
        await loadPremiumStatus();
        setShowPremiumConfetti(true);
        TOAST.success("Premium restored! 🎉", "All set! Welcome back to the full experience.");
      } else {
        TOAST.info("No past purchases spotted", "Looks like there's nothing to restore yet.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Please try again in a moment.";
      TOAST.error("Couldn't restore purchases", msg);
    } finally {
      setIsProcessingPayment(null);
    }
  }, [loadPremiumStatus]);

  const shareMessage = useMemo(() => {
    const urls = ReferralService.getAppStoreUrls();
    const storeUrl = Platform.OS === "ios" ? urls.ios : urls.android;
    return `I've been journaling with My Aura Log, an AI-powered mood studio I love. 🎨✨\n\nUse my referral code: ${referralCode}\nGrab it here:\n${storeUrl}\n\nWhen ${REFERRALS_NEEDED} friends join, we both unlock premium vibes! 🎉`;
  }, [referralCode]);

  const inviteFriends = useCallback(async () => {
    const urls = ReferralService.getAppStoreUrls();
    const storeUrl = Platform.OS === "ios" ? urls.ios : urls.android;
    try {
      const result = await Share.share({ message: shareMessage, title: "Check out My Aura Log!" });
      if (result.action === Share.sharedAction) {
        trackReferralInviteShare();
        TOAST.success("Invite sent! 🎉", "Thanks for sharing the good energy!");
      }
    } catch {
      try {
        if (await Linking.canOpenURL(storeUrl)) {
          await Linking.openURL(storeUrl);
        } else {
          TOAST.error("Couldn't share invite", "Please try again in a moment.");
        }
      } catch {
        TOAST.error("Failed to generate invite", "Please try again");
      }
    }
  }, [shareMessage]);

  const openReferralModal = useCallback(() => {
    setReferralCodeInput("");
    setShowReferralModal(true);
  }, []);

  const closeReferralModal = useCallback(() => {
    setShowReferralModal(false);
    setReferralCodeInput("");
  }, []);

  const submitReferralCode = useCallback(async () => {
    const trimmed = referralCodeInput.trim();
    if (!trimmed) {
      TOAST.error("That code doesn't look right", "Double-check it and try again.");
      return;
    }
    setIsSubmittingCode(true);
    try {
      const result = await ReferralService.enterReferralCode(trimmed);
      if (result.success) {
        TOAST.success("Code applied! 🎉", result.message);
        setShowReferralModal(false);
        setReferralCodeInput("");
        await loadPremiumStatus();
        await loadReferralData();
      } else {
        TOAST.error("Couldn't apply the code", result.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Please try again in a moment.";
      TOAST.error("Something went wrong", msg);
    } finally {
      setIsSubmittingCode(false);
    }
  }, [referralCodeInput, loadPremiumStatus, loadReferralData]);

  return {
    // state
    currentPage,
    setCurrentPage,
    isPremium,
    remainingAI,
    isProcessingPayment,
    monthlyPackage,
    lifetimePackage,
    referralCode,
    referralCount,
    remainingReferrals,
    showReferralModal,
    referralCodeInput,
    setReferralCodeInput,
    isSubmittingCode,
    showPremiumConfetti,
    dismissPremiumConfetti: () => setShowPremiumConfetti(false),
    // handlers
    buyMonthly,
    buyLifetime,
    restorePurchases,
    inviteFriends,
    openReferralModal,
    closeReferralModal,
    submitReferralCode,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OfferMeta – trial/discount pill for a package
// ─────────────────────────────────────────────────────────────────────────────

function OfferMeta({ package: pkg }: { package: PurchasesPackage | null }) {
  if (!pkg) return null;

  const product = pkg.product as unknown as ProductMeta;
  const intro = product?.introPrice;
  const defaultOpt = product?.defaultOption;
  const discountCount = product?.discounts?.length ?? 0;

  const hasFreeTrial =
    (intro && intro.price === 0 && (intro.periodNumberOfUnits ?? intro.period)) ||
    (defaultOpt?.freePhase?.offerPaymentMode === "FREE_TRIAL");

  const trialDuration = (() => {
    const bp = defaultOpt?.freePhase?.billingPeriod;
    if (bp?.value != null && bp?.unit) {
      const u = String(bp.unit).toLowerCase();
      return `${bp.value}-${u === "day" ? "day" : u === "week" ? "week" : u === "month" ? "month" : u}`;
    }
    if (intro?.periodNumberOfUnits != null && intro?.periodUnit) {
      const u = String(intro.periodUnit).toLowerCase();
      return `${intro.periodNumberOfUnits}-${u === "day" ? "day" : u === "week" ? "week" : u === "month" ? "month" : u}`;
    }
    if (intro?.period === "P2W") return "14-day";
    if (intro?.period === "P1W") return "7-day";
    return null;
  })();

  const priceString = product?.priceString ?? "";
  if (!hasFreeTrial && discountCount === 0) return null;

  return (
    <Box marginTop="xs" alignItems="center" gap="xs">
      {hasFreeTrial && trialDuration && (
        <Box style={styles.metaPill}>
          <Text variant="caption" style={styles.metaText}>
            {trialDuration} free trial{priceString ? ` • then ${priceString}/mo` : ""}
          </Text>
        </Box>
      )}
      {discountCount > 0 && !hasFreeTrial && (
        <Box style={styles.metaPill}>
          <Text variant="caption" style={styles.metaText}>
            {discountCount} discount{discountCount === 1 ? "" : "s"} available
          </Text>
        </Box>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PremiumPlanButton – reusable purchase button
// ─────────────────────────────────────────────────────────────────────────────

function PremiumPlanButton({
  title,
  priceLabel,
  gradientKey,
  package: pkg,
  isProcessing,
  disabled,
  onPress,
}: {
  title: string;
  priceLabel: string;
  gradientKey: "monthly" | "lifetime";
  package: PurchasesPackage | null;
  isProcessing: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = isProcessing ? GRADIENT.disabled : GRADIENT[gradientKey];
  const shadowStyle = gradientKey === "monthly" ? styles.monthlyButton : styles.lifetimeButton;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.premiumButton, shadowStyle]}
      disabled={disabled}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.premiumButtonGradient}>
        {isProcessing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Box alignItems="center">
            <Text variant="button" style={styles.premiumButtonText}>{title}</Text>
            <Text variant="caption" style={styles.priceText}>
              {pkg?.product.priceString ?? "Loading price..."} {priceLabel}
            </Text>
            <OfferMeta package={pkg} />
          </Box>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PremiumPlansPage – first pager page
// ─────────────────────────────────────────────────────────────────────────────

function PremiumPlansPage({
  theme,
  router,
  isPremium,
  remainingAI,
  isProcessingPayment,
  monthlyPackage,
  lifetimePackage,
  buyMonthly,
  buyLifetime,
  restorePurchases,
}: {
  theme: ReturnType<typeof useTheme>;
  router: ReturnType<typeof useRouter>;
  isPremium: boolean;
  remainingAI: number;
  isProcessingPayment: PaymentType;
  monthlyPackage: PurchasesPackage | null;
  lifetimePackage: PurchasesPackage | null;
  buyMonthly: () => void;
  buyLifetime: () => void;
  restorePurchases: () => void;
}) {
  const cardBg = { backgroundColor: theme.colors.backgroundHovered };

  return (
    <Box key="plans" flex={1}>
      <ScrollView contentContainerStyle={styles.pageContainer} showsVerticalScrollIndicator={false}>
        <Text variant="h4" color="textDefault" marginBottom="xs">
          Upgrade to Premium
        </Text>
        <Text variant="caption" color="textSubdued" marginBottom="s">
          Get the full experience:
        </Text>
        <Box marginBottom="m" paddingLeft="s">
          {PREMIUM_FEATURES.map((f, i) => (
            <Text
              key={i}
              variant="default"
              color={f.subdued ? "textSubdued" : "textDefault"}
              marginBottom={i < PREMIUM_FEATURES.length - 1 ? "xs" : undefined}>
              • {f.text}
            </Text>
          ))}
        </Box>

        {isPremium && (
          <Box marginBottom="m" padding="s" borderRadius="m" style={cardBg}>
            <Text variant="h7" color="primary" textAlign="center">
              You already have Premium 🎉
            </Text>
          </Box>
        )}

        {remainingAI >= 0 && (
          <Box marginBottom="m" padding="s" borderRadius="m" style={cardBg}>
            <Text variant="h7" color="textDefault" textAlign="center">
              {remainingAI > 0
                ? `You have ${remainingAI} free AI analysis${remainingAI === 1 ? "" : "es"} remaining today`
                : "You've used all free AI analyses for today"}
            </Text>
          </Box>
        )}

        {!isPremium && (
          <>
            <PremiumPlanButton
              title="⭐ Monthly Premium"
              priceLabel="/ month"
              gradientKey="monthly"
              package={monthlyPackage}
              isProcessing={isProcessingPayment === "monthly"}
              disabled={isProcessingPayment !== null || isPremium}
              onPress={buyMonthly}
            />
            <Text variant="caption" color="textSubdued" marginTop="xs" marginBottom="s" textAlign="center">
              Auto-renewable monthly subscription. Cancel anytime in device Settings.
            </Text>

            <PremiumPlanButton
              title="☕ Lifetime Premium"
              priceLabel="one-time"
              gradientKey="lifetime"
              package={lifetimePackage}
              isProcessing={isProcessingPayment === "lifetime"}
              disabled={isProcessingPayment !== null || isPremium}
              onPress={buyLifetime}
            />

            <TouchableOpacity
              onPress={restorePurchases}
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
          </>
        )}

        <Box marginTop="m" flexDirection="row" flexWrap="wrap" justifyContent="center" alignItems="center" gap="s">
          <TouchableOpacity onPress={() => router.push("/(home)/privacy-policy")} style={styles.legalLink}>
            <Text variant="caption" color="primary">Privacy Policy</Text>
          </TouchableOpacity>
          <Text variant="caption" color="textSubdued">•</Text>
          <TouchableOpacity onPress={() => router.push("/(home)/terms")} style={styles.legalLink}>
            <Text variant="caption" color="primary">Terms of Use (EULA)</Text>
          </TouchableOpacity>
        </Box>

        <Box marginTop="l" alignItems="center">
          <Text variant="caption" color="textSubdued">Swipe for referral perks →</Text>
        </Box>
      </ScrollView>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReferralPage – second pager page
// ─────────────────────────────────────────────────────────────────────────────

function ReferralPage({
  theme,
  referralCode,
  referralCount,
  remainingReferrals,
  onInvite,
  onEnterCode,
}: {
  theme: ReturnType<typeof useTheme>;
  referralCode: string;
  referralCount: number;
  remainingReferrals: number;
  onInvite: () => void;
  onEnterCode: () => void;
}) {
  const cardBg = { backgroundColor: theme.colors.backgroundHovered };

  return (
    <Box key="referral" flex={1}>
      <ScrollView contentContainerStyle={styles.pageContainer} showsVerticalScrollIndicator={false}>
        <Text variant="h4" color="textDefault" marginBottom="xs">
          Invite Friends
        </Text>
        <Text variant="caption" color="textSubdued" marginBottom="m">
          When {REFERRALS_NEEDED} friends join using your code, you unlock premium access.
        </Text>

        <TouchableOpacity onPress={onInvite} activeOpacity={0.8} style={styles.inviteButton}>
          <LinearGradient
            colors={GRADIENT.lifetime}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.premiumButtonGradient}>
            <Text variant="button" style={styles.premiumButtonText}>
              👥 Invite {REFERRALS_NEEDED} Friends
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Box marginTop="m" padding="s" borderRadius="m" style={cardBg}>
          <Text variant="h7" color="textDefault" textAlign="center" marginBottom="xs">
            Your Referral Code
          </Text>
          {referralCode ? (
            <>
              <Text variant="h4" color="primary" textAlign="center" marginBottom="xs" style={styles.referralCodeText}>
                {referralCode}
              </Text>
              <Text variant="caption" color="textSubdued" textAlign="center">
                Share this code with friends to unlock premium together.
              </Text>
            </>
          ) : (
            <Box flexDirection="row" alignItems="center" justifyContent="center" marginTop="s">
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="caption" color="textSubdued" marginLeft="s">Loading referral code...</Text>
            </Box>
          )}
        </Box>

        {referralCount > 0 && (
          <Box marginTop="m" padding="s" borderRadius="m" style={cardBg}>
            <Text variant="h7" color="textDefault" textAlign="center" marginBottom="xs">
              Referral Progress: {referralCount} / {REFERRALS_NEEDED}
            </Text>
            <Text variant="caption" color="textSubdued" textAlign="center">
              {remainingReferrals > 0
                ? `${remainingReferrals} more ${remainingReferrals === 1 ? "friend" : "friends"} needed!`
                : "You've reached the goal! Premium will be activated soon."}
            </Text>
          </Box>
        )}

        <TouchableOpacity onPress={onEnterCode} style={styles.enterCodeButton}>
          <Text variant="h7" color="primary" textAlign="center">
            📝 Enter a Friend&apos;s Referral Code
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReferralCodeModal
// ─────────────────────────────────────────────────────────────────────────────

function ReferralCodeModal({
  visible,
  theme,
  value,
  onChangeText,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  theme: ReturnType<typeof useTheme>;
  value: string;
  onChangeText: (text: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Box flex={1} justifyContent="center" alignItems="center" style={styles.modalOverlay}>
        <Box
          width="90%"
          maxWidth={400}
          padding="l"
          borderRadius="l"
          style={[styles.modalContent, { backgroundColor: theme.colors.white }]}>
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
            value={value}
            onChangeText={(t) => onChangeText(t.toUpperCase().trim())}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isSubmitting}
            maxLength={20}
          />

          <Box flexDirection="row" marginTop="m" gap="s">
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalButton, styles.cancelButton]}
              disabled={isSubmitting}>
              <Text variant="button" color="textDefault">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSubmit}
              style={[styles.modalButton, styles.applyButton]}
              disabled={isSubmitting || !value.trim()}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text variant="button" style={styles.applyButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PremiumConfettiOverlay – Lottie when user completes premium (payment success)
// ─────────────────────────────────────────────────────────────────────────────

function PremiumConfettiOverlay({
  visible,
  onAnimationFinish,
}: {
  visible: boolean;
  onAnimationFinish: () => void;
}) {
  const lottieRef = useRef<LottieView>(null);
  const { width, height } = Dimensions.get("window");

  if (!visible) return null;

  return (
    <Box
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.confettiOverlay]}
      alignItems="center"
      justifyContent="center">
      <LottieView
        ref={lottieRef}
        source={PREMIUM_CONFETTI_SOURCE}
        autoPlay
        loop={false}
        onAnimationFinish={onAnimationFinish}
        style={{ width, height }}
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PageIndicator
// ─────────────────────────────────────────────────────────────────────────────

function PageIndicator({ currentPage, pageCount }: { currentPage: number; pageCount: number }) {
  return (
    <Box flexDirection="row" justifyContent="center" alignItems="center" paddingBottom="l" gap="xs">
      {Array.from({ length: pageCount }, (_, i) => (
        <Box
          key={i}
          width={currentPage === i ? 24 : 8}
          height={8}
          borderRadius="m"
          backgroundColor={currentPage === i ? "primary" : "grey"}
          style={{ opacity: currentPage === i ? 1 : 0.3 }}
        />
      ))}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaywallScreen (main)
// ─────────────────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const pagerRef = useRef<PagerView>(null);

  const paywall = usePaywall();
  const { setCurrentPage } = paywall;

  useEffect(() => {
    trackPaywallView(source ?? undefined);
  }, [source]);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  }, [setCurrentPage]);

  return (
    <Box flex={1} style={{ backgroundColor: theme.colors.backgroundDefault }}>
      <StatusBar style="dark" />
      <Box padding="m" paddingTop="xxxl">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
          <Text variant="h2-pacifico" color="textDefault">Premium</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text variant="button" color="primary">Close</Text>
          </TouchableOpacity>
        </Box>
      </Box>

      <PagerView ref={pagerRef} style={styles.pagerView} initialPage={0} onPageSelected={handlePageSelected}>
        <PremiumPlansPage
          theme={theme}
          router={router}
          isPremium={paywall.isPremium}
          remainingAI={paywall.remainingAI}
          isProcessingPayment={paywall.isProcessingPayment}
          monthlyPackage={paywall.monthlyPackage}
          lifetimePackage={paywall.lifetimePackage}
          buyMonthly={paywall.buyMonthly}
          buyLifetime={paywall.buyLifetime}
          restorePurchases={paywall.restorePurchases}
        />
        <ReferralPage
          theme={theme}
          referralCode={paywall.referralCode}
          referralCount={paywall.referralCount}
          remainingReferrals={paywall.remainingReferrals}
          onInvite={paywall.inviteFriends}
          onEnterCode={paywall.openReferralModal}
        />
      </PagerView>

      <PageIndicator currentPage={paywall.currentPage} pageCount={2} />

      <ReferralCodeModal
        visible={paywall.showReferralModal}
        theme={theme}
        value={paywall.referralCodeInput}
        onChangeText={paywall.setReferralCodeInput}
        isSubmitting={paywall.isSubmittingCode}
        onClose={paywall.closeReferralModal}
        onSubmit={paywall.submitReferralCode}
      />

      <PremiumConfettiOverlay
        visible={paywall.showPremiumConfetti}
        onAnimationFinish={paywall.dismissPremiumConfetti}
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pagerView: { flex: 1 },
  pageContainer: { paddingHorizontal: 16, paddingBottom: 24 },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(155, 135, 245, 0.15)",
  },
  premiumButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  monthlyButton: { shadowColor: "#9B87F5" },
  lifetimeButton: { shadowColor: "#7DD3C0" },
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
  metaText: { color: "#FFFFFF" },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  legalLink: { paddingVertical: 4, paddingHorizontal: 4 },
  inviteButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#7DD3C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  referralCodeText: { fontFamily: "monospace", letterSpacing: 2 },
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
  modalOverlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  applyButton: { backgroundColor: "#9B87F5" },
  applyButtonText: { color: "#FFFFFF" },
  confettiOverlay: {
    backgroundColor: "transparent",
    zIndex: 1000,
  },
});
