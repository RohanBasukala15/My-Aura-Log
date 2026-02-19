import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  View,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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

const AVATAR_SIZE = 64;
const GRADIENT_SOFT = ["#F8F4FF", "#F0EBF8", "#E8F5F2"] as const;

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  initialName: string;
  initialAvatarSeed: string | null;
  onSave: (name: string, avatarSeed: string) => void;
  openPaywall: () => void;
}

export function EditProfileModal({
  visible,
  onClose,
  initialName,
  initialAvatarSeed,
  onSave,
  openPaywall,
}: EditProfileModalProps) {
  const theme = useTheme();
  const [name, setName] = useState(initialName);
  const [selectedSeed, setSelectedSeed] = useState<string>(
    initialAvatarSeed ?? STARTER_SEEDS[0]
  );
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setSelectedSeed(initialAvatarSeed ?? STARTER_SEEDS[0]);
      PremiumService.isPremium().then(setIsPremium);
    }
  }, [visible, initialName, initialAvatarSeed]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    await Storage.setItem("user_name", trimmedName || "");
    await Storage.setItem(SOUL_LINK_AVATAR_SEED_KEY, selectedSeed);
    await SoulLinkService.setMyAvatarUrl(getAvatarUri(selectedSeed, 128));
    onSave(trimmedName, selectedSeed);
    onClose();
  }, [name, selectedSeed, onSave, onClose]);

  const handleSelectAvatar = useCallback(
    (seed: string, isPremiumAvatar: boolean) => {
      if (isPremiumAvatar && !isPremium) {
        trackUpgradeClick("edit_profile_avatar");
        openPaywall();
        return;
      }
      setSelectedSeed(seed);
    },
    [isPremium, openPaywall]
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <LinearGradient
            colors={GRADIENT_SOFT}
            style={styles.gradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
              <Text variant="h4" color="textDefault">
                Edit Profile
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text variant="button" color="primary">
                  Close
                </Text>
              </TouchableOpacity>
            </Box>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
              <Text variant="default" color="textSubdued" marginBottom="xs">
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

              <Text variant="default" color="textSubdued" marginTop="l" marginBottom="xs">
                Your avatar
              </Text>
              <Text variant="caption" color="textSubdued" marginBottom="s">
                Starter
              </Text>
              <Box flexDirection="row" flexWrap="wrap" gap="s" marginBottom="m">
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
                      <Image
                        source={{ uri: getAvatarUri(seed) }}
                        style={styles.avatarImg}
                      />
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
                          source={{ uri: getAvatarUri(seed) }}
                          style={[styles.avatarImg, locked && styles.avatarGrayscale]}
                        />
                        {locked && (
                          <View style={styles.lockOverlay}>
                            <MaterialCommunityIcons name="lock" size={18} color="#FFF" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Box>

              <TouchableOpacity onPress={handleSave} activeOpacity={0.9} style={styles.saveBtnWrap}>
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
            </ScrollView>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "85%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  gradient: {
    padding: 20,
    borderRadius: 24,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(155, 135, 245, 0.15)",
  },
  scroll: { maxHeight: 420 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  avatarWrap: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
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
  saveBtnWrap: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
