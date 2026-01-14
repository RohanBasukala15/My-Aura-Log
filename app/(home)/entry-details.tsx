import React, { useState, useCallback, useEffect } from "react";
import {
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  View,
  Alert,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { Text } from "@common/components/theme";
import { JournalEntry, AIInsight } from "@common/models/JournalEntry";
import { JournalStorage } from "@common/services/journalStorage";
import { OpenAIService } from "@common/services/openaiService";
import { PremiumService } from "@common/services/premiumService";
import { MoodAnalysisService } from "@common/services/moodAnalysisService";
import { BreathingRecommendation } from "@common/models/BreathingSession";
import { useAppDispatch, useAppSelector } from "@common/redux";
import type { RootState } from "@common/redux/store";
import { setUpgradeAlertShown } from "@common/redux/slices/premium/premium.slice";
import {
  toggleEmotion,
  toggleSleep,
  toggleHealth,
  toggleHobby,
  setQuickNote,
  resetDraft,
} from "@common/redux/slices/entryDraft/entryDraft.slice";

const BREATHING_ALERT_DELAY = 500;

const EMOTION_OPTIONS = [
  { id: "happy", label: "happy", icon: "🎈" },
  { id: "excited", label: "excited", icon: "🎉" },
  { id: "grateful", label: "grateful", icon: "💚" },
  { id: "relaxed", label: "relaxed", icon: "🏝️" },
  { id: "content", label: "content", icon: "🙏" },
  { id: "tired", label: "tired", icon: "😴" },
  { id: "unsure", label: "unsure", icon: "❓" },
  { id: "bored", label: "bored", icon: "⚡" },
  { id: "anxious", label: "anxious", icon: "☁️" },
  { id: "angry", label: "angry", icon: "🌋" },
  { id: "stressed", label: "stressed", icon: "😰" },
  { id: "sad", label: "sad", icon: "💧" },
  { id: "desperate", label: "desperate", icon: "🆘" },
];

const SLEEP_OPTIONS = [
  { id: "good-sleep", label: "good sleep", icon: "💤" },
  { id: "medium-sleep", label: "medium sleep", icon: "😴" },
  { id: "bad-sleep", label: "bad sleep", icon: "🛏️" },
  { id: "sleep-early", label: "sleep early", icon: "🌙" },
];

const HEALTH_OPTIONS = [
  { id: "exercise", label: "exercise", icon: "🧘" },
  { id: "eat-healthy", label: "eat healthy", icon: "🥕" },
  { id: "drink-water", label: "drink water", icon: "💧" },
  { id: "walk", label: "walk", icon: "🚶" },
  { id: "sport", label: "sport", icon: "🏃" },
  { id: "short-exercise", label: "short exercise", icon: "🏋️" },
];

const HOBBIES_OPTIONS = [
  { id: "movies", label: "movies", icon: "📺" },
  { id: "read", label: "read", icon: "📖" },
  { id: "gaming", label: "gaming", icon: "🎮" },
  { id: "relax", label: "relax", icon: "🏖️" },
];

interface SectionHeaderProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  hasIndicator?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, expanded, onToggle, hasIndicator = false }) => (
  <TouchableOpacity onPress={onToggle} style={styles.sectionHeader} activeOpacity={0.7}>
    <View style={styles.sectionHeaderLeft}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hasIndicator && <View style={styles.indicator} />}
    </View>
    <Text style={styles.collapseIcon}>{expanded ? "˄" : "+"}</Text>
  </TouchableOpacity>
);

interface SelectionCircleProps {
  id: string;
  label: string;
  icon: string;
  isSelected: boolean;
  onPress: () => void;
  itemsPerRow?: number;
}

const SelectionCircle: React.FC<SelectionCircleProps> = ({ icon, label, isSelected, onPress, itemsPerRow = 4 }) => {
  const screenWidth = Dimensions.get("window").width;
  const padding = 16 * 2; // Left + right padding
  const gap = 8 * (itemsPerRow - 1); // Gaps between items
  const itemWidth = (screenWidth - padding - gap) / itemsPerRow;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.selectionItem, { width: itemWidth }]}
      activeOpacity={0.7}>
      <View style={[styles.selectionCircle, isSelected && styles.selectionCircleSelected]}>
        <Text style={[styles.selectionIcon, isSelected && styles.selectionIconSelected]}>{icon}</Text>
      </View>
      <Text style={[styles.selectionLabel, isSelected && styles.selectionLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

function EntryDetails() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const upgradeAlertShownToday = useAppSelector((state: RootState) => state.premium.upgradeAlertShownToday);
  const entryDraft = useAppSelector((state: RootState) => state.entryDraft);

  const {
    selectedMood,
    journalText,
    selectedTags,
    selectedEmotions,
    selectedSleep,
    selectedHealth,
    selectedHobbies,
    quickNote,
  } = entryDraft;

  // UI-only state
  const [emotionsExpanded, setEmotionsExpanded] = useState(true);
  const [sleepExpanded, setSleepExpanded] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [hobbiesExpanded, setHobbiesExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAI, setRemainingAI] = useState<number>(-1);
  const [isPremium, setIsPremium] = useState(false);
  const [breathingRecommendation, setBreathingRecommendation] = useState<BreathingRecommendation | null>(null);

  useEffect(() => {
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = useCallback(async () => {
    const [premium, remaining] = await Promise.all([
      PremiumService.isPremium(),
      PremiumService.getRemainingAIUsage(),
    ]);
    setIsPremium(premium);
    setRemainingAI(remaining);
  }, []);

  const navigateToBreathing = useCallback(
    (recommendation: BreathingRecommendation) => {
      const params: Record<string, string> = {};
      if (recommendation.journalEntryId) params.journalEntryId = recommendation.journalEntryId;
      if (recommendation.mood) params.mood = recommendation.mood;
      if (recommendation.emotion) params.emotion = recommendation.emotion;
      if (recommendation.duration) params.duration = recommendation.duration.toString();

      router.push({
        pathname: "/(home)/(tabs)/breathing",
        params,
      });
    },
    [router]
  );

  const showUpgradeAlert = useCallback((): Promise<boolean> => {
    return new Promise(resolve => {
      Alert.alert(
        "Treat Yourself to Premium ☕",
        "Unlimited AI reflections stay brewing with a one-time $5 thank-you. Unlock premium to keep the insights flowing all day.",
        [
          {
            text: "Maybe later",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Unlock Premium",
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
  }, [router]);

  const handleAICheck = useCallback(async (): Promise<boolean> => {
    const canUseAI = await PremiumService.canUseAI();
    if (canUseAI) return true;

    if (!upgradeAlertShownToday) {
      const wantsToUpgrade = await showUpgradeAlert();
      dispatch(setUpgradeAlertShown(true));
      if (wantsToUpgrade) return false;
    }

    return false;
  }, [upgradeAlertShownToday, showUpgradeAlert, dispatch]);

  /**
   * Builds context object for AI insight generation from all entry fields
   */
  const buildAIContext = useCallback(() => {
    const context: {
      tags?: string[];
      emotions?: string[];
      sleep?: string[];
      healthActivities?: string[];
      hobbies?: string[];
      quickNote?: string;
    } = {};

    if (selectedTags.length > 0) context.tags = selectedTags;
    if (selectedEmotions.length > 0) context.emotions = selectedEmotions;
    if (selectedSleep.length > 0) context.sleep = selectedSleep;
    if (selectedHealth.length > 0) context.healthActivities = selectedHealth;
    if (selectedHobbies.length > 0) context.hobbies = selectedHobbies;
    if (quickNote?.trim()) context.quickNote = quickNote.trim();

    return Object.keys(context).length > 0 ? context : undefined;
  }, [selectedTags, selectedEmotions, selectedSleep, selectedHealth, selectedHobbies, quickNote]);

  const generateAIInsight = useCallback(
    async (): Promise<AIInsight | undefined> => {
      if (!selectedMood) return undefined;
      try {
        const context = buildAIContext();
        const insight = await OpenAIService.generateInsight(journalText, selectedMood, context);
        await PremiumService.incrementAIUsage();
        await loadPremiumStatus();
        return insight;
      } catch (error) {
        Toast.show({
          type: "warning",
          text1: "AI insight took a rain check",
          text2: "Saved your entry without the extra sparkle.",
        });
        return undefined;
      }
    },
    [journalText, selectedMood, buildAIContext, loadPremiumStatus]
  );

  const showBreathingAlert = useCallback(
    (recommendation: BreathingRecommendation) => {
      setTimeout(() => {
        Alert.alert(
          "🧘 Breathing Exercise",
          recommendation.reason,
          [
            { text: "Maybe later", style: "cancel" },
            {
              text: "Start Session",
              style: "default",
              onPress: () => navigateToBreathing(recommendation),
            },
          ],
          { cancelable: true }
        );
      }, BREATHING_ALERT_DELAY);
    },
    [navigateToBreathing]
  );

  const handleBack = useCallback(() => {
    // Redux state is preserved if user goes back!
    router.back();
  }, [router]);

  const handleEmotionToggle = useCallback(
    (emotion: string) => {
      dispatch(toggleEmotion(emotion));
    },
    [dispatch]
  );

  const handleSleepToggle = useCallback(
    (sleep: string) => {
      dispatch(toggleSleep(sleep));
    },
    [dispatch]
  );

  const handleHealthToggle = useCallback(
    (health: string) => {
      dispatch(toggleHealth(health));
    },
    [dispatch]
  );

  const handleHobbyToggle = useCallback(
    (hobby: string) => {
      dispatch(toggleHobby(hobby));
    },
    [dispatch]
  );

  const handleQuickNoteChange = useCallback(
    (text: string) => {
      dispatch(setQuickNote(text));
    },
    [dispatch]
  );

  const handleFinalSave = useCallback(async () => {
    if (!selectedMood) {
      Toast.show({ type: "error", text1: "Mood is required" });
      return;
    }

    setIsLoading(true);
    try {
      const shouldAnalyze = await handleAICheck();
      const aiInsight = shouldAnalyze ? await generateAIInsight() : undefined;

      const entry: JournalEntry = {
        id: `entry_${Date.now()}`,
        mood: selectedMood,
        text: journalText,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        emotions: selectedEmotions.length > 0 ? selectedEmotions : undefined,
        sleep: selectedSleep.length > 0 ? selectedSleep : undefined,
        healthActivities: selectedHealth.length > 0 ? selectedHealth : undefined,
        hobbies: selectedHobbies.length > 0 ? selectedHobbies : undefined,
        quickNote: quickNote || undefined,
        aiInsight,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };

      await JournalStorage.saveEntry(entry);

      const recommendation = MoodAnalysisService.analyzeEntry(entry);
      setBreathingRecommendation(recommendation);

      // Clear Redux draft
      dispatch(resetDraft());

      Toast.show({
        type: "success",
        text1: shouldAnalyze ? "Reflection saved with AI sparkle" : "Reflection saved",
        text2: shouldAnalyze ? "Head to your entry for the full breakdown." : "Thanks for checking in today.",
      });

      if (recommendation.suggested) {
        showBreathingAlert(recommendation);
      }

      router.push(`/(home)/entry-detail?id=${entry.id}`);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "We couldn't save your reflection",
        text2: "Please try again in a moment.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedMood,
    journalText,
    selectedTags,
    selectedEmotions,
    selectedSleep,
    selectedHealth,
    selectedHobbies,
    quickNote,
    handleAICheck,
    generateAIInsight,
    showBreathingAlert,
    dispatch,
    router,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerMood}>
          <Text style={styles.moodEmoji}>{selectedMood || "😊"}</Text>
        </View>
        <TouchableOpacity onPress={handleFinalSave} style={styles.headerSaveButton} activeOpacity={0.7} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#4ECDC4" />
          ) : (
            <MaterialIcons name="check" size={24} color="#4ECDC4" />
          )}
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Emotions Section */}
        <View style={styles.section}>
          <SectionHeader
            title="Emotions"
            expanded={emotionsExpanded}
            onToggle={() => setEmotionsExpanded(!emotionsExpanded)}
          />
          {emotionsExpanded && (
            <View style={[styles.selectionGrid, styles.grid4Columns]}>
              {EMOTION_OPTIONS.map(emotion => (
                <SelectionCircle
                  key={emotion.id}
                  id={emotion.id}
                  label={emotion.label}
                  icon={emotion.icon}
                  isSelected={selectedEmotions.includes(emotion.id)}
                  onPress={() => handleEmotionToggle(emotion.id)}
                  itemsPerRow={4}
                />
              ))}
            </View>
          )}
        </View>

        {/* Sleep Section */}
        <View style={styles.section}>
          <SectionHeader
            title="Sleep"
            expanded={sleepExpanded}
            onToggle={() => setSleepExpanded(!sleepExpanded)}
          />
          {sleepExpanded && (
            <View style={[styles.selectionGrid, styles.grid4Columns]}>
              {SLEEP_OPTIONS.map(sleep => (
                <SelectionCircle
                  key={sleep.id}
                  id={sleep.id}
                  label={sleep.label}
                  icon={sleep.icon}
                  isSelected={selectedSleep.includes(sleep.id)}
                  onPress={() => handleSleepToggle(sleep.id)}
                  itemsPerRow={4}
                />
              ))}
            </View>
          )}
        </View>

        {/* Health Section */}
        <View style={styles.section}>
          <SectionHeader
            title="Health"
            expanded={healthExpanded}
            onToggle={() => setHealthExpanded(!healthExpanded)}
            hasIndicator={true}
          />
          {healthExpanded && (
            <View style={[styles.selectionGrid, styles.grid5Columns]}>
              {HEALTH_OPTIONS.map(health => (
                <SelectionCircle
                  key={health.id}
                  id={health.id}
                  label={health.label}
                  icon={health.icon}
                  isSelected={selectedHealth.includes(health.id)}
                  onPress={() => handleHealthToggle(health.id)}
                  itemsPerRow={5}
                />
              ))}
            </View>
          )}
        </View>

        {/* Hobbies Section */}
        <View style={styles.section}>
          <SectionHeader
            title="Hobbies"
            expanded={hobbiesExpanded}
            onToggle={() => setHobbiesExpanded(!hobbiesExpanded)}
          />
          {hobbiesExpanded && (
            <View style={[styles.selectionGrid, styles.grid4Columns]}>
              {HOBBIES_OPTIONS.map(hobby => (
                <SelectionCircle
                  key={hobby.id}
                  id={hobby.id}
                  label={hobby.label}
                  icon={hobby.icon}
                  isSelected={selectedHobbies.includes(hobby.id)}
                  onPress={() => handleHobbyToggle(hobby.id)}
                  itemsPerRow={4}
                />
              ))}
            </View>
          )}
        </View>

        {/* Goals Section - Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>Coming soon...</Text>
          </View>
        </View>

        {/* Quick Note Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Note</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.linkText}>Open Full Note</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.quickNoteInput}
            placeholder="Add Note..."
            placeholderTextColor="#666666"
            value={quickNote}
            onChangeText={handleQuickNoteChange}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Photo Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photo</Text>
            <MaterialIcons name="camera-alt" size={20} color="#4ECDC4" />
          </View>
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} activeOpacity={0.7}>
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} activeOpacity={0.7}>
              <Text style={styles.photoButtonText}>From Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Memo Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Voice Memo</Text>
            <MaterialIcons name="mic" size={20} color="#4ECDC4" />
          </View>
          <TouchableOpacity style={styles.voiceMemoButton} activeOpacity={0.7}>
            <MaterialIcons name="mic" size={24} color="#4ECDC4" />
            <Text style={styles.voiceMemoText}>Tap to Record</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for fixed button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Fixed Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleFinalSave}
          disabled={isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="check" size={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.editLink} activeOpacity={0.7}>
          <MaterialIcons name="edit" size={16} color="#4ECDC4" />
          <Text style={styles.editLinkText}>Edit Activities</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerMood: {
    alignItems: "center",
    justifyContent: "center",
  },
  moodEmoji: {
    fontSize: 40,
  },
  headerSaveButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ECDC4",
  },
  collapseIcon: {
    fontSize: 20,
    color: "#4ECDC4",
    fontWeight: "300",
  },
  selectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  grid4Columns: {
    justifyContent: "space-between",
  },
  grid5Columns: {
    justifyContent: "flex-start",
  },
  selectionItem: {
    alignItems: "center",
    marginBottom: 16,
  },
  selectionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2A2A2A",
    borderWidth: 2,
    borderColor: "#4ECDC4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  selectionCircleSelected: {
    backgroundColor: "#4ECDC4",
    borderColor: "#4ECDC4",
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  selectionIcon: {
    fontSize: 26,
  },
  selectionIconSelected: {
    // Icon color stays the same, but we can adjust if needed
  },
  selectionLabel: {
    fontSize: 13,
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 4,
  },
  selectionLabelSelected: {
    color: "#4ECDC4",
    fontWeight: "500",
  },
  placeholderBox: {
    padding: 20,
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
  placeholderText: {
    color: "#666666",
    fontSize: 14,
  },
  quickNoteInput: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  photoButtonText: {
    color: "#4ECDC4",
    fontSize: 14,
    fontWeight: "500",
  },
  voiceMemoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    gap: 8,
  },
  voiceMemoText: {
    color: "#4ECDC4",
    fontSize: 14,
    fontWeight: "500",
  },
  linkText: {
    color: "#4ECDC4",
    fontSize: 14,
    fontWeight: "500",
  },
  bottomSpacing: {
    height: 20,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1A1A1A",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saveButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4ECDC4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  editLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editLinkText: {
    color: "#4ECDC4",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default EntryDetails;
