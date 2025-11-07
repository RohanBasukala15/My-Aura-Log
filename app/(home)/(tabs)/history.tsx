import React, { useCallback, useMemo, useState } from "react";
import { SectionList, StyleSheet, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import moment from "moment";

import { Box, Text, useTheme } from "@common/components/theme";
import { JournalEntry, MOOD_LABELS } from "@common/models/JournalEntry";
import { JournalStorage } from "@common/services/journalStorage";
import Toast from "react-native-toast-message";

function History() {
  const theme = useTheme();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const loadEntries = async () => {
    try {
      const allEntries = await JournalStorage.getAllEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error("Error loading entries:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load entries",
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  const handleEntryPress = (entry: JournalEntry) => {
    router.push(`/(home)/entry-detail?id=${entry.id}`);
  };

  const sections = useMemo(() => {
    if (!entries.length) {
      return [];
    }

    const sortedEntries = [...entries].sort((a, b) => moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf());

    const grouped = sortedEntries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
      const year = moment(entry.timestamp).format("YYYY");
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(entry);
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort((a, b) => Number(b) - Number(a))
      .map(year => ({ title: year, data: grouped[year] }));
  }, [entries]);

  return (
    <Box flex={1} backgroundColor="backgroundDefault">
      <StatusBar style="dark" />
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <Box paddingHorizontal="xl" paddingTop="xxxl" paddingBottom="s">
            <Text variant="h2" color="textDefault" textAlign="center">
              Your Journal History
            </Text>
            {sections.length > 0 && (
              <Text variant="default" color="textSubdued" marginTop="s" textAlign="center">
                Explore your timeline of reflections and insights
              </Text>
            )}
          </Box>
        }
        ListEmptyComponent={
          <Box padding="l" alignItems="center" justifyContent="center" flex={1}>
            <Text variant="h3" marginBottom="xxs" color="textSubdued">
              No auras logged yet
            </Text>
            <Text variant="default" color="textSubdued" textAlign="center">
              Start journaling to see your entries here
            </Text>
          </Box>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Box paddingHorizontal="m">
            <Text variant="h4" color="textDefault">
              {title}
            </Text>
          </Box>
        )}
        renderItem={({ item, index, section }) => {
          const isLastItem = index === section.data.length - 1;
          const monthLabel = moment(item.timestamp).format("MMM");
          const dayLabel = moment(item.timestamp).format("DD");
          const timeLabel = moment(item.timestamp).format("h:mm A");

          const connectorDynamicStyle = {
            backgroundColor: theme.colors.borderSubdued,
            top: index === 0 ? 28 : -8,
            bottom: isLastItem ? 28 : -32,
          };

          return (
            <Box paddingHorizontal="m">
              <Box flexDirection="row">
                <Box width={38} alignItems="center">
                  <Text variant="h6" color="textDefault">
                    {monthLabel}
                  </Text>
                  <Text variant="h3" color="textDefault">
                    {dayLabel}
                  </Text>
                  <Text variant="caption" color="textSubdued" marginTop="xxs" textAlign="center">
                    {timeLabel}
                  </Text>
                </Box>

                <Box style={styles.timelineWrapper}>
                  <Box style={[styles.timelineConnector, connectorDynamicStyle]} />
                  <Box
                    style={[
                      styles.timelineDot,
                      {
                        borderColor: theme.colors.backgroundDefault,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </Box>

                <TouchableOpacity
                  onPress={() => handleEntryPress(item)}
                  activeOpacity={0.92}
                  style={[
                    styles.entryCard,
                    {
                      backgroundColor: theme.colors.white,
                      borderColor: theme.colors.borderSubdued,
                      marginBottom: 4,
                    },
                  ]}>
                  <Box flexDirection="row" alignItems="center">
                    <Text textTransform={"capitalize"} style={styles.moodEmoji}>
                      {item.mood}
                    </Text>
                    {item.aiInsight && (
                      <Box
                        paddingHorizontal="s"
                        paddingVertical="xxs"
                        borderRadius="m"
                        style={{ backgroundColor: theme.colors.backgroundSelected }}>
                        <Text variant="h7" color="primary" textTransform="capitalize">
                          {item.aiInsight.emotion}
                        </Text>
                      </Box>
                    )}
                  </Box>
                  {item.aiInsight?.summary && (
                    <Text variant="default" color="textDefault" numberOfLines={3}>
                      {item.aiInsight.summary}
                    </Text>
                  )}
                  {item.text && (
                    <Text variant="caption" color="textSubdued" numberOfLines={3} marginTop="xs">
                      {item.text}
                    </Text>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <Box flexDirection="row" flexWrap="wrap" marginTop="s" gap="xs">
                      {item.tags.map(tag => (
                        <Box
                          key={tag}
                          paddingHorizontal="xs"
                          paddingVertical="xxs"
                          borderRadius="s"
                          style={{ backgroundColor: theme.colors.backgroundHovered }}>
                          <Text variant="h7" color="textDefault" style={{ textTransform: "capitalize" }}>
                            {tag}
                          </Text>
                        </Box>
                      ))}
                    </Box>
                  )}
                </TouchableOpacity>
              </Box>
            </Box>
          );
        }}
        SectionSeparatorComponent={() => <Box height={12} />}
        ItemSeparatorComponent={() => <Box height={4} />}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  entryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  moodEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  timelineWrapper: {
    width: 12,
    alignItems: "center",
    position: "relative",
    paddingTop: 4,
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 2,
  },
  timelineConnector: {
    position: "absolute",
    width: 2,
    left: 5,
    zIndex: 1,
  },
  emotionLabel: {
    textTransform: "capitalize",
  },
});

export default History;

