import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { Box, Text, useTheme } from "@common/components/theme";
import { Storage } from "@common/services/Storage";
import { SoulLinkService } from "@common/services/soulLinkService";
import { PremiumService } from "@common/services/premiumService";
import { trackUpgradeClick } from "@common/services/analyticsService";
import {
  STARTER_SEEDS,
  PREMIUM_SEEDS,
  SOUL_LINK_AVATAR_SEED_KEY,
  getAvatarUri,
} from "@common/constants/soulLinkAvatars";

const AVATAR_SIZE = 72;
const GRADIENT_SOFT = ["#F8F4FF", "#F0EBF8", "#E8F5F2"] as const;

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [selectedSeed, setSelectedSeed] = useState<string>(STARTER_SEEDS[0]);
  const [isPremium, setIsPremium] = useState(false);

  const loadProfile = useCallback(async () => {
    const [storedName, storedSeed] = await Promise.all([
      Storage.getItem<string>("user_name", ""),
      Storage.getItem<string>(SOUL_LINK_AVATAR_SEED_KEY, null),
    ]);
    setName(storedName ?? "");
    setSelectedSeed(storedSeed ?? STARTER_SEEDS[0]);
    const premium = await PremiumService.isPremium();
    setIsPremium(premium);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    await Storage.setItem("user_name", trimmedName || "");
    await Storage.setItem(SOUL_LINK_AVATAR_SEED_KEY, selectedSeed);
    await SoulLinkService.setMyAvatarUrl(getAvatarUri(selectedSeed, 128));
    await SoulLinkService.setMyDisplayName(trimmedName || null);
    Toast.show({ type: "success", text1: "Profile updated", text2: "" });
    router.back();
  }, [name, selectedSeed, router]);

  const handleSelectAvatar = useCallback(
    (seed: string, isPremiumAvatar: boolean) => {
      if (isPremiumAvatar && !isPremium) {
        trackUpgradeClick("edit_profile_avatar");
        router.push({ pathname: "/(home)/paywall", params: { source: "edit_profile" } });
        return;
      }
      setSelectedSeed(seed);
    },
    [isPremium, router]
  );

  return (
    <Box flex={1} style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={GRADIENT_SOFT}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Box flexDirection="row" alignItems="center" marginBottom="xl" paddingHorizontal="m">
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textDefault} />
          </TouchableOpacity>
          <Text variant="h3" color="textDefault" style={styles.title}>
            Edit Profile
          </Text>
        </Box>

        <Box marginBottom="l" paddingHorizontal="m">
          <Text variant="h5" color="textDefault" marginBottom="xs">
            Name
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
            placeholder="Your name"
            placeholderTextColor={theme.colors.textSubdued}
            value={name}
            onChangeText={setName}
          />
        </Box>

        <Box paddingHorizontal="m" marginBottom="l">
          <Text variant="h5" color="textDefault" marginBottom="s">
            Your avatar
          </Text>
          <Text variant="caption" color="textSubdued" marginBottom="m">
            Starter
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="s" marginBottom="l">
            {STARTER_SEEDS.map(seed => {
              const isSelected = selectedSeed === seed;
              return (
                <TouchableOpacity
                  key={seed}
                  onPress={() => handleSelectAvatar(seed, false)}
                  style={[
                    styles.avatarWrap,
                    isSelected && { borderColor: theme.colors.primary, borderWidth: 3 },
                  ]}
                >
                  <Image source={{ uri: getAvatarUri(seed, AVATAR_SIZE) }} style={styles.avatarImg} />
                </TouchableOpacity>
              );
            })}
          </Box>

          <Text variant="caption" color="textSubdued" marginBottom="s">
            Premium
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="s" marginBottom="l">
            {PREMIUM_SEEDS.map(seed => {
              const isSelected = selectedSeed === seed;
              const locked = !isPremium;
              return (
                <TouchableOpacity
                  key={seed}
                  onPress={() => handleSelectAvatar(seed, true)}
                  style={[
                    styles.avatarWrap,
                    isSelected && !locked && { borderColor: theme.colors.primary, borderWidth: 3 },
                  ]}
                >
                  <View style={[styles.avatarImgWrap, locked && styles.avatarLocked]}>
                    <Image
                      source={{ uri: getAvatarUri(seed, AVATAR_SIZE) }}
                      style={[styles.avatarImg, locked && styles.avatarGrayscale]}
                    />
                    {locked && (
                      <View style={styles.lockOverlay}>
                        <MaterialCommunityIcons name="lock" size={22} color="#FFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Box>
        </Box>

        <Box paddingHorizontal="m">
          <TouchableOpacity onPress={handleSave} activeOpacity={0.9} style={styles.saveWrap}>
            <LinearGradient
              colors={["#9B87F5", "#7DD3C0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Text variant="button" style={styles.saveBtnText}>
                Save
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Box>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: 8 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  title: {
    flex: 1,
    marginLeft: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  avatarWrap: {
    width: AVATAR_SIZE + 10,
    height: AVATAR_SIZE + 10,
    borderRadius: (AVATAR_SIZE + 10) / 2,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImgWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
  },
  avatarLocked: {
    opacity: 0.9,
  },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarGrayscale: {
    opacity: 0.65,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(100,100,100,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: AVATAR_SIZE / 2,
  },
  saveWrap: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
