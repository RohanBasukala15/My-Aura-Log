import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput as RNTextInput,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";

import { Box, Text, useTheme } from "@common/components/theme";
import { JournalEntry, MoodEmoji, MOOD_EMOJIS, MOOD_LABELS, AIInsight } from "@common/models/JournalEntry";
import { JournalStorage } from "@common/services/journalStorage";
import { OpenAIService } from "@common/services/openaiService";
import { PremiumService } from "@common/services/premiumService";
import { useAppDispatch, useAppSelector } from "@common/redux";
import { setUpgradeAlertShown, checkUpgradeAlertStatus } from "@common/redux/slices/premium/premium.slice";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function Dashboard() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const upgradeAlertShownToday = useAppSelector(state => state.premium.upgradeAlertShownToday);

  const [selectedMood, setSelectedMood] = useState<MoodEmoji | null>(null);
  const [journalText, setJournalText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAI, setRemainingAI] = useState<number>(-1);
  const [isPremium, setIsPremium] = useState(false);

  const availableTags = ["work", "health", "family", "relationships", "personal", "other"];

  const loadPremiumStatus = useCallback(async () => {
    const premium = await PremiumService.isPremium();
    const remaining = await PremiumService.getRemainingAIUsage();
    setIsPremium(premium);
    setRemainingAI(remaining);
  }, []);

  useEffect(() => {
    loadPremiumStatus();
    // Check if upgrade alert was shown today on mount
    dispatch(checkUpgradeAlertStatus());
  }, [loadPremiumStatus, dispatch]);

  // Refresh premium status when screen comes into focus (e.g., after purchasing premium)
  useFocusEffect(
    useCallback(() => {
      loadPremiumStatus();
      // Check if upgrade alert status changed (e.g., new day)
      dispatch(checkUpgradeAlertStatus());
    }, [loadPremiumStatus, dispatch])
  );

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const showUpgradeAlert = (): Promise<boolean> => {
    return new Promise(resolve => {
      Alert.alert(
        "Upgrade to Premium ☕",
        "To analyze with AI (as it costs money), buy me a cup of coffee ($5) to get premium tier for unlimited analyze.",
        [
          {
            text: "Skip",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Buy Premium",
            style: "default",
            onPress: () => {
              resolve(true);
              router.push("/(home)/(tabs)/settings");
            },
          },
        ],
        { cancelable: true }
      );
    });
  };

  const handleSaveEntry = async () => {
    if (!selectedMood) {
      Toast.show({
        type: "error",
        text1: "Please select a mood",
      });
      return;
    }

    if (!journalText.trim()) {
      Toast.show({
        type: "error",
        text1: "Please write something",
      });
      return;
    }

    // Check if user can use AI
    const canUseAI = await PremiumService.canUseAI();
    let shouldAnalyze = canUseAI;

    // If user can't use AI, show upgrade prompt (only once per day)
    if (!canUseAI && !upgradeAlertShownToday) {
      const wantsToUpgrade = await showUpgradeAlert();
      // Mark alert as shown for today
      dispatch(setUpgradeAlertShown(true));
      if (wantsToUpgrade) {
        // User wants to upgrade, redirect to settings
        return;
      }
      // User chose to skip, save without AI analysis
      shouldAnalyze = false;
    } else if (!canUseAI && upgradeAlertShownToday) {
      // Alert already shown today, just save without AI
      shouldAnalyze = false;
    }

    setIsLoading(true);
    try {
      let aiInsight: AIInsight | undefined = undefined;

      // Only generate AI insight if user can use it
      if (shouldAnalyze) {
        try {
          aiInsight = await OpenAIService.generateInsight(journalText);
          // Increment usage count after successful AI generation
          await PremiumService.incrementAIUsage();
          // Reload premium status to update remaining count
          await loadPremiumStatus();
        } catch (error) {
          Toast.show({
            type: "warning",
            text1: "AI analysis failed",
            text2: "Entry saved without AI insights",
          });
        }
      }
      // If user skipped or couldn't use AI, aiInsight remains undefined

      // Create entry
      const entry: JournalEntry = {
        id: `entry_${Date.now()}`,
        mood: selectedMood,
        text: journalText,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        aiInsight: aiInsight,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };

      // Save to storage
      await JournalStorage.saveEntry(entry);

      if (shouldAnalyze) {
        Toast.show({
          type: "success",
          text1: "Your reflection has been recorded with AI insights",
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Your reflection has been recorded",
        });
      }

      // Reset form before navigating away
      setSelectedMood(null);
      setJournalText("");
      setSelectedTags([]);

      // Navigate to entry detail screen to show full entry and AI insights
      router.push(`/(home)/entry-detail?id=${entry.id}`);
    } catch (error) {
      console.error("Error saving entry:", error);
      Toast.show({
        type: "error",
        text1: "Failed to save entry",
        text2: "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={["#F8F6FF", "#FFFFFF", "#F8F6FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}>
        <Box padding="m" paddingTop="xxxl">
          {/* Header Section */}
          <Box marginBottom="xl">
            <Text variant="default" marginBottom="xs" textAlign={"center"} color="textDefault" style={styles.mainTitle}>
              How are you feeling today?
            </Text>
            <Text variant="default" color="black" textAlign={"center"}>
              Take a moment to reflect on your day
            </Text>
          </Box>

          {/* Mood Selector - Clean Minimal Design */}
          <Box marginBottom="xl" alignItems="center">
            <Box flexDirection="row" justifyContent="space-between" width="100%" paddingHorizontal="xs">
              {MOOD_EMOJIS.map(mood => {
                const isSelected = selectedMood === mood;
                return (
                  <AnimatedTouchable
                    key={mood}
                    onPress={() => setSelectedMood(mood)}
                    style={[styles.moodButton, isSelected && styles.moodButtonSelected]}>
                    {isSelected ? (
                      <LinearGradient
                        colors={["#9BA7F5", "#7DDAC0"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.moodButtonGradient}>
                        <Text style={styles.moodEmoji}>{mood}</Text>
                      </LinearGradient>
                    ) : (
                      <Box style={styles.moodButtonUnselected}>
                        <Text style={styles.moodEmojiUnselected}>{mood}</Text>
                      </Box>
                    )}
                  </AnimatedTouchable>
                );
              })}
            </Box>
          </Box>

          {/* Journal Input - Modern Design */}
          <Box marginBottom="xl">
            <Text variant="h5" marginBottom="s" color="textDefault" style={styles.sectionTitle}>
              Write your thoughts
            </Text>
            <Box borderRadius="xl" style={styles.textInputContainer} overflow="hidden">
              <LinearGradient
                colors={["#FFFFFF", "#F8F6FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.textInputGradient}>
                <RNTextInput
                  placeholder="What's on your mind today?..."
                  placeholderTextColor="#A7A7A7"
                  value={journalText}
                  onChangeText={setJournalText}
                  multiline
                  style={styles.textInput}
                  textAlignVertical="top"
                />
              </LinearGradient>
            </Box>
          </Box>

          {/* Tags - Modern Pill Design */}
          <Box marginBottom="m">
            <Text variant="h5" marginBottom="m" color="textDefault" style={styles.sectionTitle}>
              Tags <Text style={styles.optionalText}>(optional)</Text>
            </Text>
            <Box flexDirection="row" flexWrap="wrap" gap="s">
              {availableTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity key={tag} onPress={() => toggleTag(tag)} activeOpacity={0.7}>
                    {isSelected ? (
                      <LinearGradient
                        colors={["#9B87F5", "#7DD3C0"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.tagButtonSelected}>
                        <Text variant="h6" style={styles.tagTextSelected}>
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <Box style={styles.tagButton}>
                        <Text variant="h6" color="textDefault" style={styles.tagText}>
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </Text>
                      </Box>
                    )}
                  </TouchableOpacity>
                );
              })}
            </Box>
          </Box>
          <TouchableOpacity
            onPress={handleSaveEntry}
            disabled={isLoading || !selectedMood || !journalText.trim()}
            activeOpacity={0.8}
            style={[
              styles.saveButton,
              (isLoading || !selectedMood || !journalText.trim()) && styles.saveButtonDisabled,
            ]}>
            <LinearGradient
              colors={selectedMood && journalText.trim() ? ["#9B87F5", "#7DD3C0"] : ["#D3D3D3", "#B8B8B8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text variant="button" style={styles.saveButtonText}>
                  {isPremium || remainingAI > 0 ? "Save & Analyze ✨" : "Save Entry"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          {!isPremium && remainingAI >= 0 && (
            <Box marginTop="m" alignItems="flex-end" marginBottom={"s"}>
              <Box
                flexDirection="row"
                justifyContent="space-between"
                flex={1}
                paddingHorizontal="m"
                paddingVertical="xs"
                borderRadius="m"
                style={{
                  backgroundColor: theme.colors.backgroundHovered,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                }}>
                <Text variant="h7" color="primary" textAlign="center">
                  {remainingAI > 0
                    ? `✨ ${remainingAI} AI analysis${remainingAI === 1 ? "" : "es"} remaining today`
                    : "✨ AI analyses used up today"}
                </Text>
              </Box>
            </Box>
          )}

          {/* Saved Entry Confirmation (when no AI insight) */}
        </Box>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  gradientBackground: {
    flex: 1,
    minHeight: "100%",
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  optionalText: {
    fontSize: 14,
    fontWeight: "400",
  },
  // Mood Selector Styles - Clean Minimal
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 30,
    overflow: "hidden",
    marginHorizontal: 2,
  },
  moodButtonSelected: {
    shadowColor: "#9BA7F5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.15 }],
  },
  moodButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  moodButtonUnselected: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#F0F0F0",
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodEmojiUnselected: {
    fontSize: 16,
  },
  // Text Input Styles
  textInputContainer: {
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: "rgba(155, 135, 245, 0.2)",
  },
  textInputGradient: {
    minHeight: 180,
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
    minHeight: 150,
    fontFamily: "HankenGrotesk_400Regular",
  },
  // Tag Styles
  tagButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tagButtonSelected: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tagTextSelected: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Save Button Styles
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  saveButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  saveButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Saved Entry Card Styles (when no AI insight)
  savedEntryCard: {
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(155, 135, 245, 0.15)",
  },
  savedEntryGradient: {
    borderRadius: 24,
  },
  savedEntryTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#9B87F5",
    letterSpacing: -0.5,
  },
  savedEntryTextContainer: {
    backgroundColor: "rgba(248, 246, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(155, 135, 245, 0.1)",
  },
  savedEntryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  // AI Insight Styles
  insightCard: {
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 2,
    borderColor: "rgba(155, 135, 245, 0.2)",
  },
  insightGradient: {
    borderRadius: 24,
  },
  insightTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#9B87F5",
    letterSpacing: -0.5,
  },
  insightSection: {
    backgroundColor: "rgba(248, 246, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(155, 135, 245, 0.1)",
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emotionText: {
    fontSize: 28,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  insightText: {
    fontSize: 16,
    lineHeight: 24,
  },
  suggestionBox: {
    backgroundColor: "#FFF9E6",
    borderWidth: 1,
    borderColor: "rgba(241, 194, 27, 0.3)",
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F1C21B",
  },
  quoteBox: {
    overflow: "hidden",
    borderRadius: 16,
  },
  quoteGradient: {
    padding: 16,
    borderRadius: 16,
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontStyle: "italic",
    lineHeight: 24,
  },
});

export default Dashboard;

