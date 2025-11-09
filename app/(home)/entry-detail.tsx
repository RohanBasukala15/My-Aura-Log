import React, { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";

import { Box, Text, useTheme } from "@common/components/theme";
import { JournalEntry } from "@common/models/JournalEntry";
import { JournalStorage } from "@common/services/journalStorage";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";

function EntryDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (id) {
      loadEntry();
    }
  }, [id]);

  const loadEntry = async () => {
    try {
      if (!id) return;
      const entryData = await JournalStorage.getEntry(id);
      if (entryData) {
        setEntry(entryData);
      } else {
        Toast.show({
          type: "error",
          text1: "Entry not found",
        });
        router.back();
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to load entry",
      });
      router.back();
    }
  };

  const handleDeleteEntry = async () => {
    if (!entry) return;
    
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await JournalStorage.deleteEntry(entry.id);
              Toast.show({
                type: "success",
                text1: "Entry deleted",
              });
              router.back();
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Failed to delete entry",
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!entry) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <LinearGradient
        colors={["#F8F6FF", "#FFFFFF", "#F8F6FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <Box padding="m" paddingTop="xxxl">
          {/* Header */}
          <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="xl">
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Text variant="h4" color="textDefault">✕</Text>
            </TouchableOpacity>
            <Text variant="h3" color="textDefault" textAlign="center" style={{ flex: 1 }}>
              {moment(entry.timestamp).format("MMM DD, YYYY")}
            </Text>
            <TouchableOpacity onPress={handleDeleteEntry} style={styles.deleteButton}>
              <MaterialIcons name="delete" size={24} color="black" />
            </TouchableOpacity>
          </Box>

          {/* Mood */}
          <Box flexDirection="row" alignItems="center" marginBottom="xl" justifyContent="center">
            <Text style={styles.moodEmoji}>{entry.mood}</Text>
          </Box>

          {/* Journal Entry */}
          <Box marginBottom="xl">
            <Text variant="h5" marginBottom="s" color="textDefault" style={styles.sectionTitle}>
              Your thought
            </Text>
            <Box padding="m"
                  borderRadius="m" style={styles.insightSection}>

            <Text variant="default" color="textDefault" >
              {entry.text}
            </Text>
            </Box>
          </Box>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <Box marginBottom="xl">
              <Text variant="h5" marginBottom="m" color="textDefault" style={styles.sectionTitle}>
                Tags
              </Text>
              <Box flexDirection="row" flexWrap="wrap" gap="s">
                {entry.tags.map((tag) => (
                  <LinearGradient
                    key={tag}
                    colors={["#9BA7F5", "#7DDAC0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tagGradient}
                  >
                    <Text variant="h6" style={styles.tagText}>
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </Text>
                  </LinearGradient>
                ))}
              </Box>
            </Box>
          )}

          {/* AI Insights */}
          {entry.aiInsight && (
            <>
              <Box marginBottom="xl">
                <Text variant="h5" marginBottom="m" color="textDefault" style={styles.sectionTitle}>
                  Summary
                </Text>
                <Box
                  padding="m"
                  borderRadius="m"
                  style={styles.insightSection}
                >
                  <Text variant="default" color="textDefault" style={styles.insightText}>
                    {entry.aiInsight.summary}
                  </Text>
                </Box>
              </Box>

              <Box marginBottom="xl">
                <Text variant="h5" marginBottom="m" color="textDefault" style={styles.sectionTitle}>
                  💡 Suggestion
                </Text>
                <Box
                  padding="m"
                  borderRadius="m"
                  style={styles.suggestionBox}
                >
                  <Text variant="default" color="textDefault" style={styles.insightText}>
                    {entry.aiInsight.suggestion}
                  </Text>
                </Box>
              </Box>

              <Box marginBottom="xl">
                <Text variant="h5" marginBottom="m" color="primary" style={styles.sectionTitle}>
                  ✨ Quote
                </Text>
                <Box
                  borderRadius="m"
                  style={styles.quoteBox}
                >
                  <LinearGradient
                    colors={["#9BA7F5", "#7DDAC0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.quoteGradient}
                  >
                    <Text variant="default" style={styles.quoteText}>
                      "{entry.aiInsight.quote}"
                    </Text>
                  </LinearGradient>
                </Box>
              </Box>
            </>
          )}
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    padding: 8,
    minWidth: 60,
    alignItems: "flex-end",
  },
  moodEmoji: {
    fontSize: 60,
  },
  emotionText: {
    fontSize: 28,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  entryCard: {
    shadowColor: "#9B87F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderColor: "rgba(155, 135, 245, 0.2)",
    overflow: "hidden",
  },
  entryGradient: {
    padding: 16,
    borderRadius: 16,
  },
  entryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  tagGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: "#9BA7F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  insightSection: {
    backgroundColor: "rgba(248, 246, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(155, 135, 245, 0.1)",
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
  quoteBox: {
    overflow: "hidden",
    borderRadius: 16,
  },
  quoteGradient: {
    padding: 16,
    borderRadius: 16,
  },
  quoteText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontStyle: "italic",
    lineHeight: 24,
  },
});

export default EntryDetail;

