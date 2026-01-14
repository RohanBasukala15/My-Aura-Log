import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Box, Text, useTheme } from "@common/components/theme";
import { BreathingPhase, BreathingSession, DEFAULT_PHASE_TIMINGS, BREATHING_DURATIONS, BREATHING_DURATION_LABELS } from "@common/models/BreathingSession";
import { BreathingStorage } from "@common/services/breathingStorage";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";

const PHASE_LABELS: Record<BreathingPhase, string> = {
  inhale: "Inhale",
  hold: "Hold",
  exhale: "Exhale",
};

const PHASE_COLORS: Record<BreathingPhase, string[]> = {
  inhale: ["rgba(155, 167, 245, 0.6)", "rgba(181, 196, 245, 0.5)"], // Soft purple with glow
  hold: ["rgba(155, 167, 245, 0.7)", "rgba(155, 167, 245, 0.6)"],
  exhale: ["rgba(125, 218, 192, 0.6)", "rgba(163, 230, 209, 0.5)"], // Soft teal with glow
};

const PHASE_GLOW_COLORS: Record<BreathingPhase, string> = {
  inhale: "rgba(155, 167, 245, 0.4)", // Purple glow
  hold: "rgba(155, 167, 245, 0.5)",
  exhale: "rgba(125, 218, 192, 0.4)", // Teal glow
};

// Generate meaningful contextual messages based on mood and emotion
const getContextualMessage = (mood?: string, emotion?: string): { title: string; subtitle: string } => {
  // If we have an emotion, use emotion-based messages
  if (emotion) {
    const emotionLower = emotion.toLowerCase();
    
    if (emotionLower.includes("anxious") || emotionLower.includes("worried") || emotionLower.includes("stressed")) {
      return {
        title: "🧘 Breathing for calm",
        subtitle: "This exercise will help you find peace and release tension",
      };
    }
    if (emotionLower.includes("sad") || emotionLower.includes("down") || emotionLower.includes("low")) {
      return {
        title: "💙 Gentle breathing for healing",
        subtitle: "Take this time to nurture yourself and find comfort",
      };
    }
    if (emotionLower.includes("angry") || emotionLower.includes("frustrated") || emotionLower.includes("irritated")) {
      return {
        title: "🌊 Breathing to release",
        subtitle: "Let your breath help you find balance and clarity",
      };
    }
    if (emotionLower.includes("tired") || emotionLower.includes("exhausted") || emotionLower.includes("drained")) {
      return {
        title: "✨ Breathing for renewal",
        subtitle: "Restore your energy and find your center",
      };
    }
    if (emotionLower.includes("happy") || emotionLower.includes("joy") || emotionLower.includes("grateful")) {
      return {
        title: "🌟 Breathing to deepen joy",
        subtitle: "Amplify this beautiful moment with mindful presence",
      };
    }
    if (emotionLower.includes("calm") || emotionLower.includes("peaceful") || emotionLower.includes("serene")) {
      return {
        title: "🌸 Breathing to maintain peace",
        subtitle: "Continue nurturing this sense of tranquility",
      };
    }
    // Default emotion message
    return {
      title: "💫 Breathing for your well-being",
      subtitle: `Honoring your ${emotion} feelings with mindful breath`,
    };
  }
  
  // Fall back to mood-based messages
  if (mood === "😞") {
    return {
      title: "💙 Breathing for comfort",
      subtitle: "This practice will help soothe and support you",
    };
  }
  if (mood === "😡") {
    return {
      title: "🌊 Breathing to find balance",
      subtitle: "Let your breath help you process and release",
    };
  }
  if (mood === "😴") {
    return {
      title: "✨ Breathing for renewal",
      subtitle: "Restore your energy and find your center",
    };
  }
  if (mood === "😄") {
    return {
      title: "🌟 Breathing to deepen joy",
      subtitle: "Amplify this beautiful moment with mindful presence",
    };
  }
  if (mood === "😐") {
    return {
      title: "🧘 Breathing for clarity",
      subtitle: "Take this moment to connect with yourself",
    };
  }
  
  // Default message
  return {
    title: "💫 Connected to your journal",
    subtitle: "This breathing exercise is tailored for you",
  };
};

function Breathing() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    journalEntryId?: string;
    mood?: string;
    emotion?: string;
    duration?: string;
  }>();

  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>("inhale");
  const [selectedDuration, setSelectedDuration] = useState<number>(180); // Default 3 min
  const [remainingTime, setRemainingTime] = useState<number>(180);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Journal context from navigation params
  const journalContext = {
    entryId: params.journalEntryId,
    mood: params.mood,
    emotion: params.emotion,
  };

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const progress = useSharedValue(0);

  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const elapsedTimeRef = useRef<number>(0);

  const phaseTimings = DEFAULT_PHASE_TIMINGS;

  // Get contextual message for journal connection banner
  const contextualMessage = journalContext.entryId && (journalContext.mood || journalContext.emotion)
    ? getContextualMessage(journalContext.mood, journalContext.emotion)
    : null;

  // Initialize duration from params if available
  useEffect(() => {
    if (params.duration) {
      const duration = parseInt(params.duration, 10);
      if (duration && BREATHING_DURATIONS.includes(duration)) {
        setSelectedDuration(duration);
        setRemainingTime(duration);
      }
    }
  }, [params.duration]);

  // Calculate progress for the circle (0 to 1)
  useEffect(() => {
    if (isActive && currentPhase) {
      const phaseDuration = phaseTimings[currentPhase as BreathingPhase] * 1000; // Convert to ms
      const interval = 50; // Update every 50ms
      let elapsed = 0;

      const progressInterval = setInterval(() => {
        elapsed += interval;
        progress.value = withTiming(
          Math.min(elapsed / phaseDuration, 1),
          {
            duration: interval,
            easing: Easing.linear,
          }
        );
      }, interval);

      return () => clearInterval(progressInterval);
    } else {
      progress.value = 0;
    }
  }, [isActive, currentPhase, phaseTimings]);

  // Animate circle based on phase - smooth transitions without flicker
  useEffect(() => {
    if (!isActive) {
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(0.7, { duration: 300 });
      return;
    }

    // Don't cancel animations abruptly - let them transition smoothly
    // Only cancel if we're not already in the right state
    const currentScale = scale.value;
    const currentOpacity = opacity.value;

    switch (currentPhase) {
      case "inhale":
        // Scale up during inhale - start from current value
        scale.value = withTiming(1.8, {
          duration: phaseTimings.inhale * 1000,
          easing: Easing.out(Easing.ease),
        });
        opacity.value = withTiming(0.95, {
          duration: phaseTimings.inhale * 1000,
        });
        break;
      case "hold":
        // Stay large during hold - smoothly maintain current scale if already at 1.8
        if (Math.abs(currentScale - 1.8) > 0.1) {
          // If not already at target, animate smoothly
          scale.value = withTiming(1.8, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          });
        }
        // Ensure opacity is at max for hold
        opacity.value = withTiming(1, {
          duration: 200,
        });
        break;
      case "exhale":
        // Scale down during exhale - start from current value
        scale.value = withTiming(1.5, {
          duration: phaseTimings.exhale * 1000,
          easing: Easing.in(Easing.ease),
        });
        opacity.value = withTiming(0.75, {
          duration: phaseTimings.exhale * 1000,
        });
        break;
    }
  }, [isActive, currentPhase, phaseTimings]);

  // Haptic feedback on phase change
  useEffect(() => {
    if (isActive && currentPhase) {
      // Light impact for phase transitions
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Silently fail if haptics not available
      });
    }
  }, [currentPhase, isActive]);

  // Phase cycling logic
  const cyclePhase = useCallback(() => {
    setCurrentPhase((prev: BreathingPhase) => {
      if (prev === "inhale") return "hold";
      if (prev === "hold") return "exhale";
      return "inhale";
    });
  }, []);

  // Phase timer
  useEffect(() => {
    if (!isActive) {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      return;
    }

    phaseTimerRef.current = setTimeout(() => {
      cyclePhase();
    }, phaseTimings[currentPhase as BreathingPhase] * 1000);

    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
    };
  }, [isActive, currentPhase, cyclePhase, phaseTimings]);

  const handleStop = useCallback(async () => {
    setIsActive(false);
    setCurrentPhase("inhale");

    // Cancel animations
    cancelAnimation(scale);
    cancelAnimation(opacity);
    cancelAnimation(progress);

    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }

    // Store elapsed time before reset
    const elapsedSeconds = elapsedTimeRef.current;

    // Update session
    if (sessionId && sessionStartTimeRef.current) {
      const session = await BreathingStorage.getSession(sessionId);
      if (session) {
        session.completedDuration = elapsedSeconds;
        session.completedAt = Date.now();
        await BreathingStorage.saveSession(session);
      }
      setSessionId(null);
    }

    sessionStartTimeRef.current = null;
    elapsedTimeRef.current = 0;

    // Reset haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const completedMinutes = Math.floor(elapsedSeconds / 60);
    const isMeaningfulSession = elapsedSeconds >= 30; // At least 30 seconds to be considered meaningful

    Toast.show({
      type: "success",
      text1: "Session complete",
      text2: `You've completed ${completedMinutes} minute${completedMinutes === 1 ? "" : "s"} of breathing.`,
    });

    // Prompt to add journal entry after meaningful session completion
    if (isMeaningfulSession) {
      setTimeout(() => {
        Alert.alert(
          "✨ How are you feeling now?",
          "Take a moment to reflect on your breathing session. Would you like to add a journal entry?",
          [
            {
              text: "Maybe later",
              style: "cancel",
            },
            {
              text: "Add Entry",
              style: "default",
              onPress: () => {
                // Navigate to dashboard to create journal entry
                router.push("/(home)/(tabs)/dashboard");
              },
            },
          ],
          { cancelable: true }
        );
      }, 1000); // Small delay to let the success toast show first
    }
  }, [sessionId, scale, opacity, progress, router]);

  // Main timer for session duration
  useEffect(() => {
    if (!isActive || remainingTime <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingTime((prev: number) => {
        if (prev <= 1) {
          handleStop().catch(() => {}); // Handle async without awaiting
          return 0;
        }
        elapsedTimeRef.current += 1;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, remainingTime, handleStop]);

  const handleStart = async () => {
    setIsActive(true);
    setCurrentPhase("inhale");
    sessionStartTimeRef.current = Date.now();
    elapsedTimeRef.current = 0;

    // Create new session
    const newSessionId = `breathing_${Date.now()}`;
    setSessionId(newSessionId);

    const session: BreathingSession = {
      id: newSessionId,
      duration: selectedDuration,
      completedDuration: 0,
      startedAt: Date.now(),
      phaseTimings,
      relatedJournalEntryId: journalContext.entryId,
      relatedMood: journalContext.mood,
      relatedEmotion: journalContext.emotion,
    };

    await BreathingStorage.saveSession(session);

    // Start haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handlePause = () => {
    setIsActive(false);
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Session",
      "Are you sure you want to reset? This will stop your current session.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await handleStop();
            setRemainingTime(selectedDuration);
          },
        },
      ]
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(progress);
    };
  }, []);

  // Animated styles
  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentPhaseColors = PHASE_COLORS[currentPhase as BreathingPhase];

  const currentGlowColor = PHASE_GLOW_COLORS[currentPhase as BreathingPhase];
  const glowOpacity = useSharedValue(0.3);

  // Animate glow opacity
  useEffect(() => {
    if (isActive) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      glowOpacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [isActive]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={["rgba(248, 246, 255, 1)", "rgba(248, 246, 255, 0.95)", "rgba(248, 246, 255, 1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}>
        <Box flex={1} justifyContent="center" alignItems="center" padding="m" paddingTop="xxxl">
          {/* Header */}
          <Box position="absolute" top={60} left={0} right={0} alignItems="center">
            <Text variant="h2-pacifico" textAlign="center" style={styles.title}>
              Guided Breathing
            </Text>
            <Text variant="default" textAlign="center" style={styles.subtitle}>
              {journalContext.emotion 
                ? `Finding calm through ${journalContext.emotion}`
                : journalContext.mood
                ? `Finding calm for your ${journalContext.mood} moment`
                : "Find your calm"}
            </Text>
          </Box>

          {/* Journal Context Banner - Shows connection to journal entry */}
          {contextualMessage && !isActive && (
            <Box position="absolute" top={130} left={0} right={0} paddingHorizontal="m">
              <TouchableOpacity
                onPress={() => {
                  if (journalContext.entryId) {
                    router.push(`/(home)/entry-detail?id=${journalContext.entryId}`);
                  }
                }}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={["rgba(155, 167, 245, 0.15)", "rgba(125, 218, 192, 0.15)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.journalContextBanner}>
                  <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                    <Box flex={1} flexDirection="row" alignItems="center" gap="s">
                      {journalContext.mood && (
                        <Text style={styles.contextMoodEmoji}>{journalContext.mood}</Text>
                      )}
                      <Box flex={1}>
                        <Text variant="h6" style={styles.contextTitle}>
                          {contextualMessage.title}
                        </Text>
                        <Text variant="h7" style={styles.contextSubtitle}>
                          {contextualMessage.subtitle}
                        </Text>
                      </Box>
                    </Box>
                    <MaterialIcons name="arrow-forward" size={18} color="#9BA7F5" />
                  </Box>
                </LinearGradient>
              </TouchableOpacity>
            </Box>
          )}

          {/* Duration Selector (only when not active) */}
          {!isActive && (
            <Box position="absolute" top={journalContext.entryId ? 220 : 160} left={0} right={0} alignItems="center">
              <Text variant="h6" textAlign="center" marginBottom="m" style={styles.sectionTitle}>
                Select Duration
              </Text>
              <Box flexDirection="row" justifyContent="center" gap="s">
                {BREATHING_DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    onPress={() => {
                      setSelectedDuration(duration);
                      setRemainingTime(duration);
                    }}
                    activeOpacity={0.7}>
                    <View
                      style={[
                        styles.durationButton,
                        selectedDuration === duration && styles.durationButtonSelected,
                      ]}>
                      <Text
                        variant="h6"
                        style={[
                          styles.durationButtonText,
                          selectedDuration === duration && styles.durationButtonTextSelected,
                        ]}>
                        {BREATHING_DURATION_LABELS[duration]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </Box>
            </Box>
          )}

          {/* Breathing Circle - Centered */}
          <Box flex={1} justifyContent="center" alignItems="center" width="100%">
            <View style={styles.circleWrapper}>
              {/* Main Circle */}
              <Animated.View style={[styles.circle, animatedCircleStyle]}>
                <View style={[styles.circleInner, { backgroundColor: currentPhaseColors[0] }]}>
                  <Text variant="h1" textAlign="center" style={styles.phaseLabel}>
                    {PHASE_LABELS[currentPhase as BreathingPhase]}
                  </Text>
                  {isActive && (
                    <Text variant="h6" textAlign="center" style={styles.phaseSubtext}>
                      {formatTime(remainingTime)}
                    </Text>
                  )}
                </View>
              </Animated.View>
            </View>
          </Box>

          {/* Controls - Centered at bottom */}
          <Box position="absolute" bottom={120} left={0} right={0} alignItems="center">
            {!isActive && remainingTime === selectedDuration ? (
              <TouchableOpacity onPress={handleStart} activeOpacity={0.7}>
                <View style={styles.startButton}>
                  <MaterialIcons name="play-arrow" size={28} color="#9BA7F5" />
                  <Text variant="h6" style={styles.startButtonText}>
                    Start
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <Box flexDirection="row" gap="m" alignItems="center" justifyContent="center">
                {isActive ? (
                  <TouchableOpacity onPress={handlePause} activeOpacity={0.7}>
                    <View style={styles.controlButton}>
                      <MaterialIcons name="pause" size={22} color="#9BA7F5" />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleStart} activeOpacity={0.7}>
                    <View style={styles.controlButton}>
                      <MaterialIcons name="play-arrow" size={22} color="#9BA7F5" />
                    </View>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleStop} activeOpacity={0.7}>
                  <View style={styles.controlButton}>
                    <MaterialIcons name="stop" size={22} color="#9BA7F5" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                  <View style={styles.controlButton}>
                    <MaterialIcons name="refresh" size={22} color="#9BA7F5" />
                  </View>
                </TouchableOpacity>
              </Box>
            )}
          </Box>

          {/* Instructions - Bottom */}
          {!isActive && (
            <Box position="absolute" bottom={60} left={0} right={0} paddingHorizontal="xl">
              <Text variant="h7" textAlign="center" style={styles.instructions}>
                Follow the circle: Inhale as it grows, hold when it's large, exhale as it shrinks.
              </Text>
            </Box>
          )}
        </Box>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: "#333333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#7D828A",
    fontWeight: "400",
  },
  sectionTitle: {
    fontWeight: "500",
    fontSize: 15,
    letterSpacing: -0.2,
    color: "#7D828A",
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(155, 167, 245, 0.2)",
    backgroundColor: "rgba(248, 246, 255, 0.6)",
  },
  durationButtonSelected: {
    borderColor: "rgba(155, 167, 245, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#9BA7F5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  durationButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#7D828A",
  },
  durationButtonTextSelected: {
    color: "#9BA7F5",
    fontWeight: "600",
  },
  circleWrapper: {
    width: 280,
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  glowCircle: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  circle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#9BA7F5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 8,
  },
  circleInner: {
    width: "100%",
    height: "100%",
    borderRadius: 110,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  phaseLabel: {
    fontSize: 42,
    fontWeight: "600",
    marginBottom: 8,
    color: "rgba(255, 255, 255, 0.95)",
    letterSpacing: -1,
  },
  phaseSubtext: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.5,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(155, 167, 245, 0.2)",
    shadowColor: "#9BA7F5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  startButtonText: {
    color: "#9BA7F5",
    fontWeight: "600",
    fontSize: 17,
    marginLeft: 6,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(155, 167, 245, 0.2)",
    shadowColor: "#9BA7F5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  instructions: {
    fontSize: 13,
    color: "#7D828A",
    lineHeight: 18,
    fontWeight: "400",
  },
  journalContextBanner: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(155, 167, 245, 0.2)",
    shadowColor: "#9BA7F5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contextMoodEmoji: {
    fontSize: 28,
  },
  contextTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  contextSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#7D828A",
    lineHeight: 18,
  },
  contextEmotion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9BA7F5",
  },
});

export default Breathing;

