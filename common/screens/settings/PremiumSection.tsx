import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Box, Text, useTheme } from "@common/components/theme";

type PremiumSectionProps = {
  isPremium: boolean;
  remainingAI: number;
  isProcessingPayment: "monthly" | "lifetime" | "restore" | null;
  referralCode: string;
  referralCount: number;
  remainingReferrals: number;
  lifetimePrice?: string; // e.g., "$4.99" or "$5.00"
  monthlyPrice?: string; // e.g., "$1.99"
  onBuyLifetime: () => void;
  onBuyMonthly: () => void;
  onRestorePurchases: () => void;
  onInviteFriends: () => void;
  onOpenReferralModal: () => void;
};

export function PremiumSection({
  isPremium,
  remainingAI,
  isProcessingPayment,
  referralCode,
  referralCount,
  remainingReferrals,
  lifetimePrice,
  monthlyPrice,
  onBuyLifetime,
  onBuyMonthly,
  onRestorePurchases,
  onInviteFriends,
  onOpenReferralModal,
}: PremiumSectionProps) {
  const theme = useTheme();

  return (
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
            Upgrade to Premium
          </Text>
          <Text variant="caption" color="textSubdued" marginBottom="m">
            Get unlimited AI analysis and support future development
          </Text>
          

          {/* Monthly Subscription Option */}
          {monthlyPrice && (
            <TouchableOpacity
              onPress={onBuyMonthly}
              activeOpacity={0.8}
              style={[styles.premiumButton, styles.monthlyButton]}
              disabled={isProcessingPayment !== null}>
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
                      {monthlyPrice}/months
                    </Text>
                  </Box>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Lifetime Purchase Option */}
          {lifetimePrice && (
            <TouchableOpacity
              onPress={onBuyLifetime}
              activeOpacity={0.8}
              style={[styles.premiumButton, styles.lifetimeButton]}
              disabled={isProcessingPayment !== null}>
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
                      {lifetimePrice} one-time
                    </Text>
                  </Box>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onRestorePurchases} style={styles.restoreButton} disabled={isProcessingPayment !== null}>
            {isProcessingPayment === "restore" ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text variant="h7" color="primary" textAlign="center">
                Restore Purchases
              </Text>
            )}
          </TouchableOpacity>
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
          <Box flexDirection="row" alignItems="center" marginVertical="m">
            <Box flex={1} height={1} style={{ backgroundColor: theme.colors.borderSubdued }} />
            <Text variant="caption" color="textSubdued" marginHorizontal="s">
              OR
            </Text>
            <Box flex={1} height={1} style={{ backgroundColor: theme.colors.borderSubdued }} />
          </Box>

          <TouchableOpacity onPress={onInviteFriends} activeOpacity={0.8} style={styles.inviteButton}>
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
                  Share this code with friends! When 3 friends join using your code, you&apos;ll unlock premium.
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

          <TouchableOpacity onPress={onOpenReferralModal} style={styles.enterCodeButton}>
            <Text variant="h7" color="primary" textAlign="center">
              📝 Enter a Friend&apos;s Referral Code
            </Text>
          </TouchableOpacity>
        </>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: 8,
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
  restoreButton: {
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
});

