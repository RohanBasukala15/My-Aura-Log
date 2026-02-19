import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { Box, Text, useTheme } from "@common/components/theme";
import { SoulLinkService } from "@common/services/soulLinkService";

const TOAST = {
  success: (text1: string, text2?: string) => Toast.show({ type: "success", text1, text2 }),
  error: (text1: string, text2?: string) => Toast.show({ type: "error", text1, text2 }),
  info: (text1: string, text2?: string) => Toast.show({ type: "info", text1, text2 }),
};

const GRADIENT_SOFT = ["#F5F0FF", "#EDE8F5", "#E8F4F0"] as const;

/**
 * Connect Souls: link with a partner by entering their code.
 * Each user's avatar is their own (set in Onboarding or Edit Profile); no avatar selection here.
 */
export default function SoulLinkConnectScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [partnerCode, setPartnerCode] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleConnectSouls = useCallback(async () => {
    const code = partnerCode.trim().toUpperCase();
    if (!code) {
      TOAST.info("Enter their code", "Ask your partner for their 8-character Soul-Link code.");
      return;
    }
    setConnecting(true);
    try {
      const partnerId = await SoulLinkService.resolveLinkCode(code);
      if (!partnerId) {
        TOAST.error("Code not found", "Check the code or ask them to open Settings to generate one.");
        return;
      }
      const displayName = partnerName.trim() || code.slice(0, 4);
      await SoulLinkService.setPartner(partnerId, displayName);

      TOAST.success("Souls connected", "You'll see their presence on the main screen.");
      router.back();
    } catch (error) {
      const err = error as { message?: string; code?: string };
      if (err?.message?.includes("Must be signed in") || err?.code === "unauthenticated") {
        TOAST.error("Sign-in didn't complete", "Please try again in a moment.");
      } else {
        TOAST.error("Couldn't connect", "Please try again.");
      }
    } finally {
      setConnecting(false);
    }
  }, [partnerCode, partnerName, router]);

  return (
    <Box flex={1} style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={GRADIENT_SOFT}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <Box padding="m" flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text variant="h4" color="textDefault">
            Connect Souls
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text variant="button" color="primary">
              Close
            </Text>
          </TouchableOpacity>
        </Box>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="caption" color="textSubdued" marginBottom="m" textAlign="center">
            Enter your partner&apos;s code. Their avatar will appear from their profile.
          </Text>

          <Box marginBottom="m">
            <Text variant="default" color="textSubdued" marginBottom="xs">
              Partner&apos;s display name (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.borderSubdued,
                  color: theme.colors.textDefault,
                  backgroundColor: theme.colors.backgroundDefault,
                },
              ]}
              placeholder="e.g. Sarah"
              placeholderTextColor={theme.colors.textSubdued}
              value={partnerName}
              onChangeText={setPartnerName}
              autoCapitalize="words"
            />
          </Box>
          <Box marginBottom="l">
            <Text variant="default" color="textSubdued" marginBottom="xs">
              Partner&apos;s Soul-Link code (required)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.codeInput,
                {
                  borderColor: theme.colors.borderSubdued,
                  color: theme.colors.textDefault,
                  backgroundColor: theme.colors.backgroundDefault,
                },
              ]}
              placeholder="e.g. ABC12XYZ"
              placeholderTextColor={theme.colors.textSubdued}
              value={partnerCode}
              onChangeText={setPartnerCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
            />
          </Box>

          <TouchableOpacity
            onPress={handleConnectSouls}
            disabled={connecting}
            activeOpacity={0.9}
            style={styles.connectButtonWrap}
          >
            <LinearGradient
              colors={["#9B87F5", "#7DD3C0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.connectButton}
            >
              {connecting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="heart-pulse" size={24} color="#FFF" />
                  <Text variant="button" style={styles.connectButtonText}>
                    Connect Souls
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </Box>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(155, 135, 245, 0.15)",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  codeInput: {
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  connectButtonWrap: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  connectButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
