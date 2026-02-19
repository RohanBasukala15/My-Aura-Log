import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, TouchableOpacity, TextInput, Share, Alert, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Box, Text, useTheme } from "@common/components/theme";
import { SoulLinkService } from "@common/services/soulLinkService";
import { useSoulLinkPartner } from "@common/hooks/useSoulLinkPartner";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const TOAST = {
  success: (text1: string, text2?: string) => Toast.show({ type: "success", text1, text2 }),
  error: (text1: string, text2?: string) => Toast.show({ type: "error", text1, text2 }),
  info: (text1: string, text2?: string) => Toast.show({ type: "info", text1, text2 }),
};

export function SoulLinkSection() {
  const theme = useTheme();
  const router = useRouter();
  const { partnerId, partnerDisplayName } = useSoulLinkPartner();
  const [linkCode, setLinkCode] = useState<string>("");
  const [partnerCodeInput, setPartnerCodeInput] = useState("");
  const [loadingCode, setLoadingCode] = useState(false);
  const [linking, setLinking] = useState(false);

  const loadLinkCode = useCallback(async () => {
    setLoadingCode(true);
    try {
      const code = await SoulLinkService.getMyLinkCode();
      setLinkCode(code);
    } finally {
      setLoadingCode(false);
    }
  }, []);

  useEffect(() => {
    loadLinkCode();
  }, [loadLinkCode]);

  const handleShareCode = useCallback(async () => {
    if (!linkCode) return;
    try {
      await Share.share({
        message: `Link with me on My Aura Log. Enter this Soul-Link code in Settings: ${linkCode}`,
        title: "Soul-Link invite",
      });
      TOAST.success("Invite shared", "They can enter the code in Settings → Soul-Link.");
    } catch {
      TOAST.info("Share cancelled", "You can read the code to them or type it in a message.");
    }
  }, [linkCode]);

  const handleLinkWithPartner = useCallback(async () => {
    const code = partnerCodeInput.trim().toUpperCase();
    if (!code) {
      TOAST.info("Enter a code", "Ask your person for their 8-character Soul-Link code.");
      return;
    }
    setLinking(true);
    try {
      const resolvedId = await SoulLinkService.resolveLinkCode(code);
      if (!resolvedId) {
        TOAST.error("Code not found", "Check the code and try again, or ask them to open Settings to generate one.");
        return;
      }
      const displayName = code.slice(0, 4);
      await SoulLinkService.setPartner(resolvedId, displayName);
      setPartnerCodeInput("");
      await loadLinkCode();
      TOAST.success("Soul-Link connected", "You'll see their presence on the main screen.");
    } catch (error) {
      const err = error as { message?: string; code?: string; details?: unknown };
      if (__DEV__) {
        console.log("[SoulLink] link error code", err?.code, "message", err?.message, "details", err?.details);
      }
      console.error("Error linking with partner:", error as Error);
      if (err?.message?.includes("Must be signed in") || err?.code === "unauthenticated") {
        TOAST.error(
          "Sign-in didn't complete",
          "Enable Firebase Authentication in the Console (Build → Authentication), deploy functions, then restart the app."
        );
      } else {
        TOAST.error("Couldn't link", "Please try again in a moment.");
      }
    } finally {
      setLinking(false);
    }
  }, [partnerCodeInput, loadLinkCode]);

  const handleUnlink = useCallback(() => {
    Alert.alert(
      "Unlink Soul-Link?",
      "You can link again anytime with the same or a different code.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            await SoulLinkService.unlink();
            await loadLinkCode();
            TOAST.info("Unlinked", "Your Soul-Link has been removed.");
          },
        },
      ]
    );
  }, [loadLinkCode]);

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
      }}
    >
      <Text variant="h4" marginBottom="xs" color="textDefault">
        Soul-Link
      </Text>
      <Text variant="caption" color="textSubdued" marginBottom="m">
        A quiet window into the people you love. No words, just energy.
      </Text>

      {partnerId ? (
        <Box>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
            <Text variant="default" color="textDefault">
              Linked with {partnerDisplayName || "your partner"}
            </Text>
            <TouchableOpacity
              onPress={handleUnlink}
              style={[styles.outlineButton, { borderColor: theme.colors.critical }]}
            >
              <Text variant="button" style={{ color: theme.colors.critical }}>
                Unlink
              </Text>
            </TouchableOpacity>
          </Box>
          <Text variant="caption" color="textSubdued">
            Their aura appears on the main screen. Tap the orb to see their current vibe or send a Pulse.
          </Text>
        </Box>
      ) : (
        <>
          <TouchableOpacity
            onPress={() => router.push("/(home)/soul-link-connect")}
            activeOpacity={0.9}
            style={styles.connectSoulsButtonWrap}
          >
            <LinearGradient
              colors={["#9B87F5", "#7DD3C0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.connectSoulsButton}
            >
              <MaterialCommunityIcons name="heart-pulse" size={22} color="#FFF" />
              <Text variant="button" style={styles.connectSoulsButtonText}>
                Connect Souls
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text variant="caption" color="textSubdued" marginBottom="m" textAlign="center">
            Enter their code to link. Avatars come from each person&apos;s profile.
          </Text>
          <Box marginBottom="m">
            <Text variant="default" color="textSubdued" marginBottom="xs">
              Your code (share so they can link with you)
            </Text>
            <Box flexDirection="row" alignItems="center" gap="s">
              <Box
                flex={1}
                padding="s"
                borderRadius="s"
                style={{ backgroundColor: theme.colors.backgroundDefault }}
              >
                <Text variant="h5" color="textDefault" style={styles.codeText}>
                  {loadingCode ? "…" : linkCode || "…"}
                </Text>
              </Box>
              <TouchableOpacity
                onPress={handleShareCode}
                style={[styles.iconButton, { backgroundColor: theme.colors.backgroundHovered }]}
              >
                <MaterialCommunityIcons name="share-variant" size={22} color={theme.colors.primary} />
              </TouchableOpacity>
            </Box>
          </Box>
          <Box marginBottom="m">
            <Text variant="default" color="textSubdued" marginBottom="xs">
              Or enter their code to link quickly (no avatars)
            </Text>
            <TextInput
              style={[
                styles.codeInput,
                {
                  borderColor: theme.colors.borderSubdued,
                  color: theme.colors.textDefault,
                  backgroundColor: theme.colors.backgroundDefault,
                },
              ]}
              placeholder="e.g. ABC12XYZ"
              placeholderTextColor={theme.colors.textSubdued}
              value={partnerCodeInput}
              onChangeText={setPartnerCodeInput}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={SOUL_LINK_CODE_LENGTH}
              editable={!linking}
            />
            <TouchableOpacity
              onPress={handleLinkWithPartner}
              disabled={linking || !partnerCodeInput.trim()}
              style={[
                styles.linkButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: linking || !partnerCodeInput.trim() ? 0.6 : 1,
                },
              ]}
            >
              {linking ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text variant="button" style={{ color: "#FFF" }}>
                  Link with partner
                </Text>
              )}
            </TouchableOpacity>
          </Box>
        </>
      )}
    </Box>
  );
}

const SOUL_LINK_CODE_LENGTH = 8;

const styles = StyleSheet.create({
  codeText: {
    letterSpacing: 2,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  connectSoulsButtonWrap: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  connectSoulsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  connectSoulsButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
