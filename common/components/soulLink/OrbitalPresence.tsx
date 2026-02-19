import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  Dimensions,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Box, Text, useTheme } from "@common/components/theme";
import { useSoulLinkPartner } from "@common/hooks/useSoulLinkPartner";
import { getArchetypeById } from "@common/constants/soulLinkArchetypes";

const AVATAR_SIZE = 44;
const HALO_RING = 56;
const PULSE_SCALE = 1.12;
const TAP_THRESHOLD = 8;
const PADDING = 12;

/**
 * Default avatar when partner has no soulLinkAvatarUrl set.
 * Uses DiceBear Adventurer (CC BY 4.0): https://www.dicebear.com/styles/adventurer/
 * Same seed always returns the same avatar.
 */
const DICEBEAR_ADVENTURER_BASE = "https://api.dicebear.com/9.x/adventurer/png";

function getDefaultAvatarUri(seed: string): string {
  const safeSeed = seed.trim() || "SoulLink";
  return `${DICEBEAR_ADVENTURER_BASE}?seed=${encodeURIComponent(safeSeed)}&size=128`;
}

/**
 * PiP-style Orbital Presence: draggable floating bubble (top-right by default), stays on top.
 * Tap opens popup with archetype, Oracle snippet, and Send Pulse.
 */
export function OrbitalPresence() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    isLinked,
    partnerId,
    partnerDisplayName,
    partnerAura,
    isPartnerPresent,
    sendPulse,
    touchPresence,
  } = useSoulLinkPartner();

  const [popupVisible, setPopupVisible] = useState(false);
  const [sendingPulse, setSendingPulse] = useState(false);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const minX = PADDING;
  const maxX = screenWidth - HALO_RING - PADDING;
  const minY = insets.top + PADDING;
  const maxY = screenHeight - HALO_RING - PADDING - 100;

  const defaultX = maxX;
  const defaultY = minY;
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const positionRef = useRef(position);
  positionRef.current = position;
  const dragStart = useRef({ x: 0, y: 0 });
  const totalMove = useRef(0);

  const haloPulse = useSharedValue(1);
  const haloOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (isPartnerPresent) {
      haloPulse.value = withRepeat(
        withSequence(
          withTiming(PULSE_SCALE, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      haloOpacity.value = withRepeat(
        withSequence(withTiming(0.9, { duration: 800 }), withTiming(0.5, { duration: 800 })),
        -1,
        true
      );
    } else {
      haloPulse.value = withTiming(1);
      haloOpacity.value = withTiming(0.55);
    }
  }, [isPartnerPresent, haloPulse, haloOpacity]);

  useEffect(() => {
    touchPresence();
  }, [touchPresence]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const p = positionRef.current;
        dragStart.current = { x: p.x, y: p.y };
        totalMove.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        totalMove.current = Math.max(
          totalMove.current,
          Math.abs(gestureState.dx) + Math.abs(gestureState.dy)
        );
        const nextX = Math.min(maxX, Math.max(minX, dragStart.current.x + gestureState.dx));
        const nextY = Math.min(maxY, Math.max(minY, dragStart.current.y + gestureState.dy));
        setPosition({ x: nextX, y: nextY });
      },
      onPanResponderRelease: () => {
        if (totalMove.current < TAP_THRESHOLD) {
          setPopupVisible(true);
        }
      },
    })
  ).current;

  const haloColor = partnerAura?.colorHex ?? theme.colors.primary;
  const archetype = partnerAura ? getArchetypeById(partnerAura.archetypeId) : null;
  const displayName = partnerDisplayName ?? partnerAura?.displayName ?? "Your Soul-Link";
  const partnerAvatarUrl = partnerAura?.avatarUrl ?? null;
  const defaultAvatarSeed = partnerId ?? displayName;
  const avatarImageUri = partnerAvatarUrl ?? getDefaultAvatarUri(defaultAvatarSeed);

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: haloPulse.value }],
    opacity: haloOpacity.value,
  }));

  if (!isLinked) return null;

  const handleSendPulse = async () => {
    if (sendingPulse) return;
    setSendingPulse(true);
    try {
      await sendPulse();
    } finally {
      setSendingPulse(false);
    }
    setPopupVisible(false);
  };

  return (
    <>
      <View
        style={[styles.bubbleWrap, { left: position.x, top: position.y }]}
        pointerEvents="box-none"
        {...panResponder.panHandlers}
      >
        <View style={styles.bubbleTouch}>
          <Animated.View
            style={[
              styles.haloOuter,
              { borderColor: haloColor, shadowColor: haloColor },
              haloAnimatedStyle,
            ]}
          />
          <View style={[styles.avatarCircle, { backgroundColor: theme.colors.surfaceDefault }]}>
            <Image
              source={{ uri: avatarImageUri }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          </View>
        </View>
      </View>

      <Modal
        visible={popupVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPopupVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPopupVisible(false)}>
          <Pressable style={styles.popupCardWrap} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={["rgba(255,255,255,0.92)", "rgba(248,246,255,0.95)"]}
              style={styles.glassCard}
            >
              <Box padding="l">
                <Text variant="h5" marginBottom="xs" color="textDefault">
                  {displayName}
                </Text>
                <Text variant="default" color="grey" marginBottom="m">
                  {archetype ? `Currently a ${archetype.label}` : "No recent reflection"}
                </Text>
                {partnerAura?.oracleSnippet ? (
                  <Text
                    variant="default"
                    color="textDefault"
                    marginBottom="m"
                    fontStyle="italic"
                    style={styles.oracleSnippet}
                  >
                    {`"${partnerAura.oracleSnippet}"`}
                  </Text>
                ) : null}
                <TouchableOpacity
                  onPress={handleSendPulse}
                  disabled={sendingPulse}
                  activeOpacity={0.8}
                  style={styles.pulseButtonWrap}
                >
                  <LinearGradient
                    colors={[haloColor, `${haloColor}CC`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.pulseButton}
                  >
                    <MaterialCommunityIcons name="heart-pulse" size={22} color="#FFF" />
                    <Text variant="h6" style={styles.pulseButtonText}>
                      {sendingPulse ? "Sending…" : "Send Pulse"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <Text variant="caption" color="grey" marginTop="s" textAlign="center">
                  Send a heartbeat, not a text.
                </Text>
              </Box>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubbleWrap: {
    position: "absolute",
    width: HALO_RING + 8,
    height: HALO_RING + 8,
    zIndex: 9999,
    elevation: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleTouch: {
    alignItems: "center",
    justifyContent: "center",
    width: HALO_RING,
    height: HALO_RING,
  },
  haloOuter: {
    position: "absolute",
    width: HALO_RING,
    height: HALO_RING,
    borderRadius: HALO_RING / 2,
    borderWidth: 3,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, shadowOpacity: 0.5 },
      android: { elevation: 8 },
    }),
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  popupCardWrap: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    overflow: "hidden",
  },
  glassCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  oracleSnippet: { fontStyle: "italic" },
  pulseButtonWrap: { alignSelf: "stretch", borderRadius: 14, overflow: "hidden" },
  pulseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  pulseButtonText: { color: "#FFF" },
});
