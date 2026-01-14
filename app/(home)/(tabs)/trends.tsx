import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import moment from "moment";

import { Box, Text, useTheme } from "@common/components/theme";
import { JournalEntry, MOOD_LABELS, MOOD_VALUES } from "@common/models/JournalEntry";
import { JournalStorage } from "@common/services/journalStorage";

const screenWidth = Dimensions.get("window").width;

function Trends() {
  const theme = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ labels: string[]; datasets: any[] } | null>(null);
  const [averageMood, setAverageMood] = useState<number>(0);

  // Ensure averageMood is always a valid number
  const safeAverageMood = useMemo(() => {
    const num = Number(averageMood);
    return isFinite(num) && !isNaN(num) ? num : 0;
  }, [averageMood]);

  const loadEntries = async () => {
    try {
      const allEntries = await JournalStorage.getAllEntries();
      setEntries(allEntries);
      processChartData(allEntries);
    } catch (error) {
      // Silently fail
    }
  };

  const processChartData = (allEntries: JournalEntry[]) => {
    if (allEntries.length === 0) {
      setWeeklyData(null);
      setAverageMood(0); // Explicitly set to 0, not NaN
      return;
    }

    // Get last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = moment().subtract(6 - i, "days");
      return {
        date: date.format("YYYY-MM-DD"),
        label: date.format("ddd"),
        timestamp: date.startOf("day").valueOf(),
      };
    });

    // Calculate average mood - filter out entries with invalid moods
    const validEntries = allEntries.filter(entry => {
      const moodValue = MOOD_VALUES[entry.mood];
      return moodValue !== undefined && !isNaN(moodValue);
    });
    const moodSum = validEntries.reduce((sum, entry) => {
      const moodValue = MOOD_VALUES[entry.mood];
      const numValue = Number(moodValue);
      return sum + (isFinite(numValue) ? numValue : 0);
    }, 0);
    
    // Calculate average and ensure it's never NaN
    const calculatedAvg = validEntries.length > 0 && isFinite(moodSum) ? moodSum / validEntries.length : 0;
    const finalAvg = isFinite(calculatedAvg) && !isNaN(calculatedAvg) ? calculatedAvg : 0;
    
    // Triple-check before setting state - never set NaN
    let safeFinalAvg = 0;
    if (typeof finalAvg === 'number' && isFinite(finalAvg) && !isNaN(finalAvg)) {
      safeFinalAvg = finalAvg;
    }
    
    // Final validation
    if (isNaN(safeFinalAvg) || !isFinite(safeFinalAvg)) {
      safeFinalAvg = 0;
    }
    
    setAverageMood(safeFinalAvg);

    // Group entries by date
    const entriesByDate = last7Days.map(day => {
      const dayEntries = allEntries.filter(entry => {
        const entryDate = moment(entry.timestamp).format("YYYY-MM-DD");
        return entryDate === day.date;
      });

      if (dayEntries.length === 0) {
        return null;
      }

      // Average mood for the day if multiple entries - filter out invalid moods
      const validDayEntries = dayEntries.filter(entry => {
        const moodValue = MOOD_VALUES[entry.mood];
        return moodValue !== undefined && !isNaN(moodValue);
      });
      
      if (validDayEntries.length === 0) {
        return null;
      }
      
      const daySum = validDayEntries.reduce((sum, entry) => {
        const moodValue = MOOD_VALUES[entry.mood];
        const numValue = Number(moodValue);
        return sum + (isFinite(numValue) ? numValue : 0);
      }, 0);
      const avgMood = validDayEntries.length > 0 && isFinite(daySum) ? daySum / validDayEntries.length : null;
      const finalAvgMood = avgMood !== null && isFinite(avgMood) && !isNaN(avgMood) ? avgMood : null;
      return finalAvgMood;
    });

    // Fill missing days with null and filter out any NaN values
    // Convert to numbers and ensure all values are finite
    const data = entriesByDate.map((value) => {
      if (value === null || value === undefined) return null;
      const numValue = Number(value);
      if (!isFinite(numValue) || isNaN(numValue)) {
        return null;
      }
      return numValue;
    });
    
    // Final sanitization - ensure no NaN or invalid values
    const sanitizedData = data.map((v) => {
      if (v === null || v === undefined) return null;
      const num = Number(v);
      if (!isFinite(num) || isNaN(num)) {
        return null;
      }
      return num;
    });

    setWeeklyData({
      labels: last7Days.map(d => d.label),
      datasets: [
        {
          data: sanitizedData,
          color: (opacity = 1) => theme.colors.primary,
          strokeWidth: 2,
        },
      ],
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  const chartConfig = {
    backgroundColor: theme.colors.white,
    backgroundGradientFrom: theme.colors.white,
    backgroundGradientTo: theme.colors.white,
    decimalPlaces: 1,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.textDefault,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: theme.colors.primary,
    },
  };

  const getMoodLabel = (value: number): string => {
    if (value >= 4.5) return "Very Happy";
    if (value >= 3.5) return "Happy";
    if (value >= 2.5) return "Neutral";
    if (value >= 1.5) return "Low";
    return "Very Low";
  };

  const recentEntriesCount = useMemo(() => {
    if (entries.length === 0) {
      return 0;
    }

    const startOfWindow = moment().subtract(6, "days").startOf("day");
    return entries.filter(entry => moment(entry.timestamp).isSameOrAfter(startOfWindow)).length;
  }, [entries]);

  const latestEntryDate = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }

    const latestTimestamp = entries.reduce(
      (latest, entry) => (entry.timestamp > latest ? entry.timestamp : latest),
      entries[0].timestamp
    );

    return moment(latestTimestamp).format("MMM D, YYYY");
  }, [entries]);

  const hasRecentMoodData = useMemo(() => {
    if (!weeklyData) {
      return false;
    }

    return weeklyData.datasets.some(dataset => 
      dataset.data.some((value: number | null) => {
        if (value === null || value === undefined) return false;
        const num = Number(value);
        return typeof num === "number" && isFinite(num) && !isNaN(num);
      })
    );
  }, [weeklyData]);

  // Sanitize weeklyData before rendering to ensure no NaN values
  const sanitizedWeeklyData = useMemo(() => {
    if (!weeklyData) return null;
    
    const sanitizedDatasets = weeklyData.datasets.map((dataset) => {
      const sanitizedData = dataset.data.map((value: number | null) => {
        // Handle null/undefined
        if (value === null || value === undefined) {
          return null;
        }
        
        // Convert to number and validate
        const num = Number(value);
        if (!isFinite(num) || isNaN(num)) {
          return null;
        }
        
        return num;
      });
      
      // Verify no NaN in final array and force replace any remaining NaN with null
      const finalData = sanitizedData.map(v => {
        if (v !== null && (isNaN(v) || !isFinite(v))) {
          return null;
        }
        return v;
      });
      
      return {
        ...dataset,
        data: finalData
      };
    });
    
    return {
      ...weeklyData,
      datasets: sanitizedDatasets
    };
  }, [weeklyData]);

  if (entries.length === 0) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.backgroundDefault }]}>
        <StatusBar style="dark" />
        <Box padding="l" alignItems="center" justifyContent="center" flex={1} minHeight={400}>
          <Text variant="h3" marginBottom="m" color="textSubdued">
            No data yet
          </Text>
          <Text variant="default" color="textSubdued" textAlign="center">
            Start journaling to see your mood trends
          </Text>
        </Box>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.backgroundDefault }]}>
      <StatusBar style="dark" />
      <Box padding="m" paddingTop="xxxl">
        <Text variant="h2-pacifico" marginBottom="xs" textAlign={"center"} color="textDefault">
          Mood Trends
        </Text>
        <Text variant="default" marginBottom="s" color="textSubdued" textAlign="center">
          Visualize how your reflections stack up, how the week has felt, and which moods show up the most.
        </Text>

        {/* Stats Cards */}
        <Box flexDirection="row" marginBottom="m" gap="m">
          <Box
            flex={1}
            padding="m"
            borderRadius="m"
            style={{
              backgroundColor: theme.colors.white,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}>
            <Text variant="h7" color="textSubdued" marginBottom="xs">
              Journal Entries Logged
            </Text>
            <Text variant="h2" color="primary">
              {entries.length}
            </Text>
            {latestEntryDate && (
              <Text variant="h7" color="textSubdued">
                Latest entry • {latestEntryDate}
              </Text>
            )}
          </Box>
          <Box
            flex={1}
            padding="m"
            borderRadius="m"
            style={{
              backgroundColor: theme.colors.white,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}>
            <Text variant="h7" color="textSubdued" marginBottom="xs">
              Overall Mood Score
            </Text>
            <Text variant="h2" color="primary">
              {safeAverageMood.toFixed(1)}
            </Text>
            <Text variant="h7" color="textSubdued">
              Feels {getMoodLabel(safeAverageMood)} on average
            </Text>
            <Text variant="h7" color="textSubdued">
              Across {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </Text>
          </Box>
        </Box>

        <Box
          marginBottom="m"
          padding="m"
          borderRadius="m"
          style={{
            backgroundColor: theme.colors.white,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
          <Text variant="h7" color="textSubdued" marginBottom="xs">
            Entries Logged This Week
          </Text>
          <Text variant="h2" color="primary">
            {recentEntriesCount}
          </Text>
          <Text variant="h7" color="textSubdued">
            Past 7 days
          </Text>
        </Box>

        {/* Weekly Chart */}
        {sanitizedWeeklyData && (
          <Box
            borderRadius="m"
            style={{
              backgroundColor: theme.colors.white,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}>
            <Box padding="m">
              <Text variant="h4" marginBottom="s" color="textDefault">
                Mood Trend This Week
              </Text>
              <Text variant="default" color="textSubdued">
                Daily average mood over the past 7 days. Scores range from 1 (tougher days) to 5 (very positive days).
              </Text>
            </Box>
            {hasRecentMoodData ? (
              <LineChart
                data={sanitizedWeeklyData}
                width={screenWidth - 64}
                height={250}
                chartConfig={chartConfig}
                bezier
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                withDots={true}
                withShadow={false}
              />
            ) : (
              <Box padding="m">
                <Text variant="default" color="textSubdued" textAlign="center">
                  No entries in the last 7 days yet. Log a few reflections to bring this trend chart to life.
                </Text>
              </Box>
            )}
          </Box>
        )}

        {/* Mood Distribution */}
        <Box marginTop="m">
          <Text variant="h4" marginBottom="xs" color="textDefault">
            Mood Mix (All Time)
          </Text>
          <Text variant="default" marginBottom="m" color="textSubdued">
            Shows how often each mood appears across every entry you have logged so far.
          </Text>
          <Box
            padding="m"
            borderRadius="m"
            style={{
              backgroundColor: theme.colors.white,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}>
            {Object.entries(
              entries.reduce((acc, entry) => {
                acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
              .sort((a, b) => b[1] - a[1])
              .map(([mood, count]) => {
                const percentage = entries.length > 0 ? (count / entries.length) * 100 : 0;
                return (
                  <Box key={mood} marginBottom="m">
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="xs">
                      <Text variant="h5" color="textDefault">
                        {`${mood} ${MOOD_LABELS[mood as keyof typeof MOOD_LABELS] || 'Unknown'}`}
                      </Text>
                      <Text variant="h6" color="textSubdued">
                        {percentage.toFixed(0)}%
                      </Text>
                    </Box>
                    <Text variant="h7" color="textSubdued" marginBottom="xs">
                      Logged {count} {count === 1 ? "time" : "times"}
                    </Text>
                    <Box
                      height={8}
                      borderRadius="s"
                      style={{ backgroundColor: theme.colors.backgroundHovered }}
                      overflow="hidden">
                      <Box height="100%" width={`${percentage}%`} style={{ backgroundColor: theme.colors.primary }} />
                    </Box>
                  </Box>
                );
              })}
          </Box>
        </Box>
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
});

export default Trends;

