import React, { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import { Calendar } from "react-native-calendars";
import moment from "moment";

import { Box, Text, useTheme } from "@common/components/theme";
import { JournalEntry } from "@common/models/JournalEntry";
import { JournalStorage } from "@common/services/journalStorage";
import Toast from "react-native-toast-message";

function CalendarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(moment().format("YYYY-MM-DD"));

  const loadEntries = async () => {
    try {
      const allEntries = await JournalStorage.getAllEntries();
      setEntries(allEntries);
    } catch (error) {
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

  const markedDates = useMemo(() => {
    const marked: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> = {};
    
    // Get unique dates with entries
    const datesWithEntries = new Set<string>();
    entries.forEach(entry => {
      const dateString = moment(entry.timestamp).format("YYYY-MM-DD");
      datesWithEntries.add(dateString);
    });
    
    // Mark all dates with entries
    datesWithEntries.forEach(dateString => {
      if (dateString === selectedDate) {
        // Selected date with entry
        marked[dateString] = {
          marked: true,
          dotColor: theme.colors.primary,
          selected: true,
          selectedColor: theme.colors.primary,
        };
      } else {
        // Date with entry but not selected
        marked[dateString] = {
          marked: true,
          dotColor: theme.colors.primary,
        };
      }
    });

    // Mark selected date even if it has no entries
    if (!marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: theme.colors.primary,
      };
    }

    return marked;
  }, [entries, selectedDate, theme.colors.primary]);

  const selectedDateEntries = useMemo(() => {
    return entries
      .filter(entry => moment(entry.timestamp).format("YYYY-MM-DD") === selectedDate)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, selectedDate]);

  const handleDayPress = useCallback((day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  }, []);

  const renderEntryItem = ({ item }: { item: JournalEntry }) => {
    const timeLabel = moment(item.timestamp).format("h:mm A");

    return (
      <TouchableOpacity
        onPress={() => handleEntryPress(item)}
        activeOpacity={0.92}
        style={[
          styles.entryCard,
          {
            backgroundColor: theme.colors.white,
            borderColor: theme.colors.borderSubdued,
          },
        ]}>
        <Box flexDirection="row" alignItems="center" marginBottom="xs">
          <Text textTransform={"capitalize"} style={styles.moodEmoji}>
            {item.mood}
          </Text>
          <Text variant="caption" color="textSubdued" marginLeft="s">
            {timeLabel}
          </Text>
          {item.aiInsight && (
            <Box
              paddingHorizontal="s"
              paddingVertical="xxs"
              borderRadius="m"
              marginLeft="s"
              style={{ backgroundColor: theme.colors.backgroundSelected }}>
              <Text variant="h7" color="primary" textTransform="capitalize">
                {item.aiInsight.emotion}
              </Text>
            </Box>
          )}
        </Box>
        {item.aiInsight?.summary && (
          <Text variant="default" color="textDefault" numberOfLines={3} marginBottom="xs">
            {item.aiInsight.summary}
          </Text>
        )}
        {item.text && (
          <Text variant="caption" color="textSubdued" numberOfLines={3} marginBottom="xs">
            {item.text}
          </Text>
        )}
        {item.quickNote && item.quickNote.trim().length > 0 && (
          <Text variant="caption" color="textSubdued" numberOfLines={2} marginBottom="xs" style={{ fontStyle: "italic" }}>
            {item.quickNote}
          </Text>
        )}
        {(item.tags || item.emotions || item.sleep || item.healthActivities || item.hobbies) && (
          <Box flexDirection="row" flexWrap="wrap" marginTop="xs" gap="xs">
            {item.tags?.map(tag => (
              <Box
                key={`tag-${tag}`}
                paddingHorizontal="xs"
                paddingVertical="xxs"
                borderRadius="s"
                style={{ backgroundColor: theme.colors.backgroundHovered }}>
                <Text variant="h7" color="textDefault" style={{ textTransform: "capitalize" }}>
                  {tag}
                </Text>
              </Box>
            ))}
            {item.emotions?.slice(0, 3).map(emotion => {
              const emotionMap: Record<string, string> = {
                happy: "🎈",
                excited: "🎉",
                grateful: "💚",
                relaxed: "🏝️",
                content: "🙏",
                tired: "😴",
                unsure: "❓",
                bored: "⚡",
                anxious: "☁️",
                angry: "🌋",
                stressed: "😰",
                sad: "💧",
                desperate: "🆘",
              };
              return (
                <Box
                  key={`emotion-${emotion}`}
                  paddingHorizontal="xs"
                  paddingVertical="xxs"
                  borderRadius="s"
                  style={{ backgroundColor: theme.colors.backgroundHovered }}>
                  <Text variant="h7" color="textDefault">
                    {emotionMap[emotion] || "✨"} {emotion}
                  </Text>
                </Box>
              );
            })}
            {item.sleep?.map(sleep => {
              const sleepMap: Record<string, string> = {
                "good-sleep": "💤",
                "medium-sleep": "😴",
                "bad-sleep": "🛏️",
                "sleep-early": "🌙",
              };
              return (
                <Box
                  key={`sleep-${sleep}`}
                  paddingHorizontal="xs"
                  paddingVertical="xxs"
                  borderRadius="s"
                  style={{ backgroundColor: theme.colors.backgroundHovered }}>
                  <Text variant="h7" color="textDefault">
                    {sleepMap[sleep] || "💤"} {sleep.replace("-", " ")}
                  </Text>
                </Box>
              );
            })}
            {item.healthActivities?.slice(0, 2).map(health => {
              const healthMap: Record<string, string> = {
                exercise: "🧘",
                "eat-healthy": "🥕",
                "drink-water": "💧",
                walk: "🚶",
                sport: "🏃",
                "short-exercise": "🏋️",
              };
              return (
                <Box
                  key={`health-${health}`}
                  paddingHorizontal="xs"
                  paddingVertical="xxs"
                  borderRadius="s"
                  style={{ backgroundColor: theme.colors.backgroundHovered }}>
                  <Text variant="h7" color="textDefault">
                    {healthMap[health] || "🏋️"} {health.replace("-", " ")}
                  </Text>
                </Box>
              );
            })}
            {item.hobbies?.slice(0, 2).map(hobby => {
              const hobbyMap: Record<string, string> = {
                movies: "📺",
                read: "📖",
                gaming: "🎮",
                relax: "🏖️",
              };
              return (
                <Box
                  key={`hobby-${hobby}`}
                  paddingHorizontal="xs"
                  paddingVertical="xxs"
                  borderRadius="s"
                  style={{ backgroundColor: theme.colors.backgroundHovered }}>
                  <Text variant="h7" color="textDefault">
                    {hobbyMap[hobby] || "✨"} {hobby}
                  </Text>
                </Box>
              );
            })}
          </Box>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Box flex={1} backgroundColor="backgroundDefault">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        <Box paddingHorizontal="m" paddingTop="xxxl" paddingBottom="m">
          <Text variant="h2-pacifico" color="textDefault" textAlign="center" marginBottom="s">
            Your Journal Calendar
          </Text>
          {entries.length > 0 && (
            <Text variant="default" color="textSubdued" marginBottom="m" textAlign="center">
              Select a date to view your entries
            </Text>
          )}
        </Box>

        <Box paddingHorizontal="m" marginBottom="m">
          <Calendar
            current={moment().format("YYYY-MM-DD")}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            markingType="period"
            maxDate={moment(new Date()).format("YYYY-MM-DD")}
            theme={{
              backgroundColor: theme.colors.primary,
              calendarBackground: theme.colors.white,
              textSectionTitleColor: theme.colors.textDefault,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: theme.colors.primary,
              todayTextColor: theme.colors.primary,
              dayTextColor: theme.colors.textDefault,
              textDisabledColor: theme.colors.textDisabled,
              dotColor: theme.colors.primary,
              selectedDotColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
              monthTextColor: theme.colors.textDefault,
              indicatorColor: theme.colors.primary,
              textDayFontFamily: "HankenGrotesk_400Regular",
              textMonthFontFamily: "HankenGrotesk_400Regular",
              textDayHeaderFontFamily: "HankenGrotesk_400Regular",
              textDayFontWeight: "400",
              textMonthFontWeight: "600",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        </Box>

        <Box paddingHorizontal="m" paddingBottom="l">
          <Text variant="h4" color="textDefault" marginBottom="m">
            {moment(selectedDate).format("MMMM DD, YYYY")}
          </Text>
          {selectedDateEntries.length > 0 ? (
            <FlatList
              data={selectedDateEntries}
              renderItem={renderEntryItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <Box height={12} />}
            />
          ) : (
            <Box padding="l" alignItems="center" justifyContent="center">
              <Text variant="h3" marginBottom="xxs" color="textSubdued">
                No entries on this day
              </Text>
              <Text variant="default" color="textSubdued" textAlign="center">
                Start journaling to see your entries here
              </Text>
            </Box>
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  calendar: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  entryCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  moodEmoji: {
    fontSize: 32,
  },
});

export default CalendarScreen;

