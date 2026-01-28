import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput as RNTextInput,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";

import { Box, Text, useTheme } from "@common/components/theme";
import { JournalEntry, MoodEmoji, MOOD_EMOJIS, AIInsight } from "@common/models/JournalEntry";
import { JournalStorage } from "@common/services/journalStorage";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { OpenAIService } from "@common/services/openaiService";
import { PremiumService } from "@common/services/premiumService";
import { PaymentService } from "@common/services/paymentService";
import { Storage } from "@common/services/Storage";
import { useAppDispatch, useAppSelector } from "@common/redux";
import type { RootState } from "@common/redux/store";
import { setUpgradeAlertShown, checkUpgradeAlertStatus } from "@common/redux/slices/premium/premium.slice";
import {
  setMood,
  setJournalText,
  toggleTag,
  toggleEmotion,
  toggleSleep,
  toggleHealth,
  toggleHobby,
  setQuickNote,
  resetDraft,
} from "@common/redux/slices/entryDraft/entryDraft.slice";
import { MoodAnalysisService } from "@common/services/moodAnalysisService";
import { BreathingRecommendation } from "@common/models/BreathingSession";
import { MaterialIcons } from "@expo/vector-icons";

import dashboardCopy from "./HeaderTitleEntity.json";

const copyContent = dashboardCopy as {
  headerTitles: string[];
  headerSubtitles: string[];
};

const AVAILABLE_TAGS = ["work", "health", "family", "relationships", "personal", "other"] as const;
const MIN_TEXT_LENGTH_FOR_ANALYSIS = 10;
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

// Helper Functions
const pickRandom = (options: string[], fallback: string): string => {
  if (!Array.isArray(options) || options.length === 0) return fallback;
  const index = Math.floor(Math.random() * options.length);
  return options[index] ?? fallback;
};

const buildBreathingParams = (recommendation: BreathingRecommendation): Record<string, string> => {
  const params: Record<string, string> = {};
  if (recommendation.journalEntryId) params.journalEntryId = recommendation.journalEntryId;
  if (recommendation.mood) params.mood = recommendation.mood;
  if (recommendation.emotion) params.emotion = recommendation.emotion;
  if (recommendation.duration) params.duration = recommendation.duration.toString();
  return params;
};

const capitalizeFirst = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

// Components
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface BreathingBannerProps {
  recommendation: BreathingRecommendation;
  onPress: () => void;
}

const BreathingBanner: React.FC<BreathingBannerProps> = ({ recommendation, onPress }) => (
  <Box marginBottom="m">
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={["#FFF9E6", "#FFF4D6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.recommendationBanner}>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Text variant="h6" style={styles.recommendationTitle}>
              🧘 Try Breathing Exercise
            </Text>
            <Text variant="h7" style={styles.recommendationText}>
              {recommendation.reason}
            </Text>
          </Box>
          <MaterialIcons name="arrow-forward" size={20} color="#F1C21B" />
        </Box>
      </LinearGradient>
    </TouchableOpacity>
  </Box>
);

interface MoodSelectorProps {
  selectedMood: MoodEmoji | null;
  onSelect: (mood: MoodEmoji) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelect }) => (
  <Box marginBottom="xl" alignItems="center">
    <Box flexDirection="row" justifyContent="space-between" width="100%" paddingHorizontal="xs">
      {MOOD_EMOJIS.map(mood => {
        const isSelected = selectedMood === mood;
        return (
          <AnimatedTouchable
            key={mood}
            onPress={() => onSelect(mood)}
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
);

interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, expanded, onToggle, children }) => (
  <Box marginBottom="m">
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.sectionHeader}>
      <Text variant="h5" color="textDefault" style={styles.sectionTitle}>
        {title} <Text style={styles.optionalText}>(optional)</Text>
      </Text>
      <Text style={styles.collapseIcon}>{expanded ? "˄" : "+"}</Text>
    </TouchableOpacity>
    {expanded && <Box marginTop="s">{children}</Box>}
  </Box>
);

interface OptionButtonProps {
  id: string;
  label: string;
  icon: string;
  isSelected: boolean;
  onPress: () => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({ label, icon, isSelected, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    {isSelected ? (
      <LinearGradient
        colors={["#9B87F5", "#7DD3C0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.tagButtonSelected}>
        <Text variant="h6" style={styles.tagTextSelected}>
          {icon} {capitalizeFirst(label)}
        </Text>
      </LinearGradient>
    ) : (
      <Box style={styles.tagButton}>
        <Text variant="h6" color="textDefault" style={styles.tagText}>
          {icon} {capitalizeFirst(label)}
        </Text>
      </Box>
    )}
  </TouchableOpacity>
);

interface NextOrSaveButtonProps {
  isLoading: boolean;
  disabled: boolean;
  onPress: () => void;
}

const NextOrSaveButton: React.FC<NextOrSaveButtonProps> = ({ isLoading, disabled, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    style={[styles.saveButton, disabled && styles.saveButtonDisabled]}>
    <LinearGradient
      colors={!disabled ? ["#9B87F5", "#7DD3C0"] : ["#D3D3D3", "#B8B8B8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.saveButtonGradient}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text variant="button" style={styles.saveButtonText}>
          Save Entry
        </Text>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

interface AIUsageIndicatorProps {
  remainingAI: number;
  isPremium: boolean;
}

const AIUsageIndicator: React.FC<AIUsageIndicatorProps> = ({ remainingAI, isPremium }) => {
  const theme = useTheme();
  if (isPremium || remainingAI < 0) return null;

  return (
    <Box marginTop="m" alignItems="flex-end" marginBottom="s">
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
  );
};

// Main Component
function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const upgradeAlertShownToday = useAppSelector((state: RootState) => state.premium.upgradeAlertShownToday);
  const {
    selectedMood,
    journalText,
    selectedTags,
    selectedEmotions,
    selectedSleep,
    selectedHealth,
    selectedHobbies,
    quickNote,
  } = useAppSelector((state: RootState) => state.entryDraft);

  // UI state for collapsible sections
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [emotionsExpanded, setEmotionsExpanded] = useState(false);
  const [sleepExpanded, setSleepExpanded] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [hobbiesExpanded, setHobbiesExpanded] = useState(false);
  const [quickNoteExpanded, setQuickNoteExpanded] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAI, setRemainingAI] = useState<number>(-1);
  const [isPremium, setIsPremium] = useState(false);
  const [breathingRecommendation, setBreathingRecommendation] = useState<BreathingRecommendation | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [lifetimePrice, setLifetimePrice] = useState<string>();
  const [monthlyPrice, setMonthlyPrice] = useState<string>();

  // Load user name
  const loadUserName = useCallback(async () => {
    const name = await Storage.getItem<string>("user_name", null);
    setUserName(name);
  }, []);

  useEffect(() => {
    loadUserName();
  }, [loadUserName]);

  // Personalize headers with user name if available
  const headerTitle = useMemo(() => {
    const baseTitle = pickRandom(copyContent.headerTitles, "How are you feeling today?");
    if (userName && userName.trim()) {
      // Add name to title in a natural way
      // Examples: "How's your aura feeling?" -> "How's your aura feeling, Mike?"
      // "What's the vibe right now?" -> "What's the vibe right now, Mike?"
      const name = userName.trim();
      // Check if title ends with question mark, if so add name before it
      if (baseTitle.endsWith("?")) {
        return `${baseTitle.slice(0, -1)}, ${name}?`;
      }
      return `${baseTitle}, ${name}`;
    }
    return baseTitle;
  }, [userName]);

  const headerSubtitle = useMemo(
    () => pickRandom(copyContent.headerSubtitles, "Take a moment to reflect on your day"),
    []
  );

  const loadPremiumStatus = useCallback(async () => {
    // First, sync with RevenueCat to get the latest subscription status
    if (PaymentService.isAvailable()) {
      await PaymentService.checkPremiumStatus();
    }
    
    const [premium, remaining] = await Promise.all([PremiumService.isPremium(), PremiumService.getRemainingAIUsage()]);
    setIsPremium(premium);
    setRemainingAI(remaining);
  }, []);

  const loadPackagePrices = useCallback(async () => {
    try {
      if (!PaymentService.isAvailable()) {
        return;
      }

      const lifetimePkg = await PaymentService.getLifetimePackage();
      const monthlyPkg = await PaymentService.getMonthlyPackage();
      
      if (lifetimePkg) {
        setLifetimePrice(lifetimePkg.product.priceString);
      }

      if (monthlyPkg) {
        setMonthlyPrice(monthlyPkg.product.priceString);
      }
    } catch (error) {
      // Silently fail - will use default message without prices
    }
  }, []);

  useEffect(() => {
    loadPremiumStatus();
    loadPackagePrices();
    dispatch(checkUpgradeAlertStatus());
  }, [loadPremiumStatus, loadPackagePrices, dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadPremiumStatus();
      loadPackagePrices();
      loadUserName();
      dispatch(checkUpgradeAlertStatus());
    }, [loadPremiumStatus, loadPackagePrices, loadUserName, dispatch])
  );

  const updateBreathingRecommendation = useCallback((mood: MoodEmoji | null, text: string) => {
    if (!mood) {
      setBreathingRecommendation(null);
      return;
    }

    if (text.trim().length > MIN_TEXT_LENGTH_FOR_ANALYSIS) {
      const tempEntry: JournalEntry = {
        id: "temp",
        mood,
        text,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };
      const recommendation = MoodAnalysisService.analyzeEntry(tempEntry);
      setBreathingRecommendation(recommendation.suggested ? recommendation : null);
    } else {
      const recommendation = MoodAnalysisService.analyzeMood(mood);
      setBreathingRecommendation(recommendation.suggested ? recommendation : null);
    }
  }, []);

  const handleMoodSelect = useCallback(
    (mood: MoodEmoji) => {
      dispatch(setMood(mood));
      updateBreathingRecommendation(mood, journalText);
    },
    [journalText, updateBreathingRecommendation, dispatch]
  );

  const handleTextChange = useCallback(
    (text: string) => {
      dispatch(setJournalText(text));
      updateBreathingRecommendation(selectedMood, text);
    },
    [selectedMood, updateBreathingRecommendation, dispatch]
  );

  const handleToggleTag = useCallback(
    (tag: string) => {
      dispatch(toggleTag(tag));
    },
    [dispatch]
  );

  const handleToggleEmotion = useCallback(
    (emotion: string) => {
      dispatch(toggleEmotion(emotion));
    },
    [dispatch]
  );

  const handleToggleSleep = useCallback(
    (sleep: string) => {
      dispatch(toggleSleep(sleep));
    },
    [dispatch]
  );

  const handleToggleHealth = useCallback(
    (health: string) => {
      dispatch(toggleHealth(health));
    },
    [dispatch]
  );

  const handleToggleHobby = useCallback(
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

  const navigateToBreathing = useCallback(
    (recommendation: BreathingRecommendation) => {
      router.push({
        pathname: "/(home)/(tabs)/breathing",
        params: buildBreathingParams(recommendation),
      });
    },
    [router]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showUpgradeAlert = useCallback((): Promise<boolean> => {
    return new Promise(resolve => {
      // Build pricing message
      let pricingInfo = "";
      if (lifetimePrice && monthlyPrice) {
        pricingInfo = `\n\n⭐ Monthly: ${monthlyPrice}/month\n☕ Lifetime: ${lifetimePrice} one-time`;
      } else if (lifetimePrice) {
        pricingInfo = `\n\n☕ Lifetime: ${lifetimePrice} one-time`;
      } else if (monthlyPrice) {
        pricingInfo = `\n\n⭐ Monthly: ${monthlyPrice}/month`;
      }

      Alert.alert(
        "Treat Yourself to Premium ☕",
        `Unlimited AI reflections stay brewing with a one-time unlock. Unlock premium to keep the insights flowing all day.${pricingInfo}`,
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
  }, [router, lifetimePrice, monthlyPrice]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const generateAIInsight = useCallback(async (): Promise<AIInsight | undefined> => {
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
  }, [journalText, selectedMood, buildAIContext, loadPremiumStatus]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const handleSaveEntry = useCallback(async () => {
    if (!selectedMood) {
      Toast.show({ type: "error", text1: "Pick a mood to match your moment." });
      return;
    }

    if (!journalText.trim()) {
      Toast.show({ type: "error", text1: "Add a few words about your day." });
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
    router,
    dispatch,
  ]);

  const isFormValid = useMemo(
    () => selectedMood !== null && journalText.trim().length > 0,
    [selectedMood, journalText]
  );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
    >
      <StatusBar style="dark" />
      <LinearGradient
        colors={["#F8F6FF", "#FFFFFF", "#F8F6FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}>
        <Box padding="m" paddingTop="xxxl">
          {/* Header */}
          <Box marginBottom="xl">
            <Text
              variant="h2-pacifico"
              marginBottom="xs"
              textAlign="center"
              color="textDefault"
              style={styles.mainTitle}>
              {headerTitle}
            </Text>
            <Text variant="default" color="black" textAlign="center">
              {headerSubtitle}
            </Text>
          </Box>

          {/* Breathing Recommendation Banner */}
          {breathingRecommendation?.suggested && !isLoading && (
            <BreathingBanner
              recommendation={breathingRecommendation}
              onPress={() => navigateToBreathing(breathingRecommendation)}
            />
          )}

          {/* Mood Selector */}
          <MoodSelector selectedMood={selectedMood} onSelect={handleMoodSelect} />

          {/* Journal Input */}
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
                  onChangeText={handleTextChange}
                  multiline
                  style={styles.textInput}
                  textAlignVertical="top"
                />
              </LinearGradient>
            </Box>
          </Box>

          {/* Tags */}
          <CollapsibleSection title="Tags" expanded={tagsExpanded} onToggle={() => setTagsExpanded(!tagsExpanded)}>
            <Box flexDirection="row" flexWrap="wrap" gap="s">
              {AVAILABLE_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity key={tag} onPress={() => handleToggleTag(tag)} activeOpacity={0.7}>
                    {isSelected ? (
                      <LinearGradient
                        colors={["#9B87F5", "#7DD3C0"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.tagButtonSelected}>
                        <Text variant="h6" style={styles.tagTextSelected}>
                          {capitalizeFirst(tag)}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <Box style={styles.tagButton}>
                        <Text variant="h6" color="textDefault" style={styles.tagText}>
                          {capitalizeFirst(tag)}
                        </Text>
                      </Box>
                    )}
                  </TouchableOpacity>
                );
              })}
            </Box>
          </CollapsibleSection>

          {/* Emotions Section */}
          <CollapsibleSection
            title="Emotions"
            expanded={emotionsExpanded}
            onToggle={() => setEmotionsExpanded(!emotionsExpanded)}>
            <Box flexDirection="row" flexWrap="wrap" gap="s">
              {EMOTION_OPTIONS.map(emotion => (
                <OptionButton
                  key={emotion.id}
                  id={emotion.id}
                  label={emotion.label}
                  icon={emotion.icon}
                  isSelected={selectedEmotions.includes(emotion.id)}
                  onPress={() => handleToggleEmotion(emotion.id)}
                />
              ))}
            </Box>
          </CollapsibleSection>

          {/* Sleep Section */}
          <CollapsibleSection title="Sleep" expanded={sleepExpanded} onToggle={() => setSleepExpanded(!sleepExpanded)}>
            <Box flexDirection="row" flexWrap="wrap" gap="s">
              {SLEEP_OPTIONS.map(sleep => (
                <OptionButton
                  key={sleep.id}
                  id={sleep.id}
                  label={sleep.label}
                  icon={sleep.icon}
                  isSelected={selectedSleep.includes(sleep.id)}
                  onPress={() => handleToggleSleep(sleep.id)}
                />
              ))}
            </Box>
          </CollapsibleSection>

          {/* Health Section */}
          <CollapsibleSection
            title="Health"
            expanded={healthExpanded}
            onToggle={() => setHealthExpanded(!healthExpanded)}>
            <Box flexDirection="row" flexWrap="wrap" gap="s">
              {HEALTH_OPTIONS.map(health => (
                <OptionButton
                  key={health.id}
                  id={health.id}
                  label={health.label}
                  icon={health.icon}
                  isSelected={selectedHealth.includes(health.id)}
                  onPress={() => handleToggleHealth(health.id)}
                />
              ))}
            </Box>
          </CollapsibleSection>

          {/* Hobbies Section */}
          <CollapsibleSection
            title="Hobbies"
            expanded={hobbiesExpanded}
            onToggle={() => setHobbiesExpanded(!hobbiesExpanded)}>
            <Box flexDirection="row" flexWrap="wrap" gap="s">
              {HOBBIES_OPTIONS.map(hobby => (
                <OptionButton
                  key={hobby.id}
                  id={hobby.id}
                  label={hobby.label}
                  icon={hobby.icon}
                  isSelected={selectedHobbies.includes(hobby.id)}
                  onPress={() => handleToggleHobby(hobby.id)}
                />
              ))}
            </Box>
          </CollapsibleSection>

          {/* Quick Note Section */}
          <CollapsibleSection
            title="Additional Note"
            expanded={quickNoteExpanded}
            onToggle={() => setQuickNoteExpanded(!quickNoteExpanded)}>
            <Box borderRadius="xl" style={styles.textInputContainer} overflow="hidden">
              <LinearGradient
                colors={["#FFFFFF", "#F8F6FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.textInputGradient}>
                <RNTextInput
                  placeholder="Add a quick note..."
                  placeholderTextColor="#A7A7A7"
                  value={quickNote}
                  onChangeText={handleQuickNoteChange}
                  multiline
                  style={styles.textInput}
                  textAlignVertical="top"
                />
              </LinearGradient>
            </Box>
          </CollapsibleSection>

          {/* Save Button */}
          <NextOrSaveButton isLoading={isLoading} disabled={!isFormValid || isLoading} onPress={handleSaveEntry} />

          {/* AI Usage Indicator */}
          <AIUsageIndicator remainingAI={remainingAI} isPremium={isPremium} />
        </Box>
      </LinearGradient>
    </KeyboardAwareScrollView>
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
  sectionTitle: {
    fontWeight: "600",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  optionalText: {
    fontSize: 14,
    fontWeight: "400",
  },
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
    fontSize: 24,
  },
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
  recommendationBanner: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(241, 194, 27, 0.3)",
    shadowColor: "#F1C21B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F1C21B",
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: "#856A1A",
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  collapseIcon: {
    fontSize: 20,
    color: "#9B87F5",
    fontWeight: "300",
  },
  photoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  photoButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  voiceMemoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  voiceMemoText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default Dashboard;

