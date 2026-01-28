import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";

import { Box, Text, useTheme } from "@common/components/theme";
import { JournalEntry, MOOD_LABELS, MOOD_VALUES } from "@common/models/JournalEntry";
import { JournalStorage } from "@common/services/journalStorage";
import { PremiumService } from "@common/services/premiumService";
import {
  getWeekDays,
  getWeekMomentForOffset,
  getWeekRange,
  formatWeekRange,
  getWeekId,
  type WeekDay,
} from "@common/utils/weekUtils";
import { generateDailyPulse, type DailyPulse } from "@common/services/dailyPulseService";
import { ensureWeeklySummary } from "@common/services/weeklySummaryService";
import type { WeeklySummary } from "@common/services/weeklySummaryStorage";

const screenWidth = Dimensions.get("window").width;

// Y-axis: map numeric value to face (1–5)
function formatYLabel(value: string): string {
  const v = Number(value);
  if (!isFinite(v) || v < 1) return "";
  if (v <= 1.5) return "😠";
  if (v <= 2.5) return "😟";
  if (v <= 3.5) return "😑";
  if (v <= 4.5) return "😊";
  return "😊";
}

function Trends() {
  const theme = useTheme();
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<JournalEntry[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [dailyPulse, setDailyPulse] = useState<DailyPulse | null>(null);
  const [loadingDailyPulse, setLoadingDailyPulse] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const today = useMemo(() => moment(), []);
  const weekMoment = useMemo(() => getWeekMomentForOffset(weekOffset), [weekOffset]);
  const weekId = useMemo(() => getWeekId(weekMoment), [weekMoment]);
  const weekDays = useMemo(() => getWeekDays(weekMoment, today), [weekMoment, today]);
  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekRange(weekMoment), [weekMoment]);

  const isCurrentWeek = weekOffset === 0;
  const isSundayOrPast = !isCurrentWeek || today.isoWeekday() === 7;

  const todayEntries = useMemo(() => {
    const d = today.format("YYYY-MM-DD");
    return entries.filter((e) => moment(e.timestamp).format("YYYY-MM-DD") === d);
  }, [entries, today]);

  const loadEntries = useCallback(async () => {
    try {
      const all = await JournalStorage.getAllEntries();
      setEntries(all);
      const inRange = await JournalStorage.getEntriesByDateRange(weekStart, weekEnd);
      setWeekEntries(inRange);
      const premium = await PremiumService.isPremium();
      setIsPremium(premium);
    } catch {
      /* ignore */
    }
  }, [weekStart, weekEnd]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (!isSundayOrPast || !isPremium) {
      setWeeklySummary(null);
      setLoadingSummary(false);
      return;
    }
    let cancelled = false;
    setLoadingSummary(true);
    (async () => {
      const { start, end } = getWeekRange(weekMoment);
      const es = await JournalStorage.getEntriesByDateRange(start, end);
      if (cancelled) return;
      const s = await ensureWeeklySummary(weekId, es);
      if (!cancelled) setWeeklySummary(s);
    })().finally(() => {
      if (!cancelled) setLoadingSummary(false);
    });
    return () => {
      cancelled = true;
    };
  }, [weekId, weekMoment, isSundayOrPast, isPremium]);

  useEffect(() => {
    if (isSundayOrPast || !isPremium) {
      setDailyPulse(null);
      setLoadingDailyPulse(false);
      return;
    }
    let cancelled = false;
    setLoadingDailyPulse(true);
    generateDailyPulse(todayEntries)
      .then((p) => {
        if (!cancelled) setDailyPulse(p);
      })
      .finally(() => {
        if (!cancelled) setLoadingDailyPulse(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSundayOrPast, isPremium, todayEntries]);

  const chartData = useMemo(() => {
    const labels = weekDays.map((d) => d.label);
    const values = weekDays.map((d) => {
      const dayEntries = weekEntries.filter(
        (e) => moment(e.timestamp).format("YYYY-MM-DD") === d.date
      );
      if (dayEntries.length === 0) return null;
      const valid = dayEntries.filter((e) => {
        const v = MOOD_VALUES[e.mood];
        return v != null && isFinite(Number(v));
      });
      if (valid.length === 0) return null;
      const sum = valid.reduce((s, e) => s + (MOOD_VALUES[e.mood] ?? 0), 0);
      const avg = sum / valid.length;
      return isFinite(avg) ? avg : null;
    });
    return { labels, data: values };
  }, [weekDays, weekEntries]);

  const hasChartData = chartData.data.some((v) => v != null && isFinite(Number(v)));

  const chartConfig = useMemo(
    () => ({
      backgroundColor: theme.colors.white,
      backgroundGradientFrom: theme.colors.white,
      backgroundGradientTo: theme.colors.white,
      decimalPlaces: 0,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- chart API signature
      color: (opacity = 1) => theme.colors.primary,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- chart API signature
      labelColor: (opacity = 1) => theme.colors.textDefault,
      formatYLabel,
      style: { borderRadius: 16 },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: theme.colors.primary,
      },
    }),
    [theme]
  );

  const onUnlockPress = useCallback(() => {
    router.push("/(home)/(tabs)/settings");
  }, [router]);

  const onShareAura = useCallback(async () => {
    const weekTitle = weeklySummary?.title ?? "This Week";
    const moodMix = weekEntries.length
      ? Object.entries(
        weekEntries.reduce<Record<string, number>>((acc, e) => {
          acc[e.mood] = (acc[e.mood] ?? 0) + 1;
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([m]) => m)
        .join(" ")
      : "✨";
    try {
      await Share.share({
        message: `My week: ${weekTitle} 🌟 ${moodMix}\n\nShared from My Aura Log`,
        title: "My Aura",
      });
    } catch {
      /* ignore */
    }
  }, [weeklySummary?.title, weekEntries]);



  const canGoNext = weekOffset < 0;

  if (entries.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.backgroundDefault }]}
      >
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
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.backgroundDefault }]}
    >
      <StatusBar style="dark" />

      {/* Week navigator */}
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" paddingHorizontal="m" paddingTop="xxxl" marginBottom="s">
        <TouchableOpacity
          onPress={() => setWeekOffset((o) => o - 1)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.arrowHit}
        >
          <Text variant="h3" color="primary">‹</Text>
        </TouchableOpacity>
        <Text variant="h5" color="textDefault" numberOfLines={1}>
          {formatWeekRange(weekMoment)}
        </Text>
        <TouchableOpacity
          onPress={() => canGoNext && setWeekOffset((o) => o + 1)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.arrowHit}
          disabled={!canGoNext}
        >
          <Text variant="h3" color={canGoNext ? "primary" : "textDisabled"}>›</Text>
        </TouchableOpacity>
      </Box>

      <Text variant="default" marginBottom="m" color="textSubdued" textAlign="center" paddingHorizontal="m">
        {isCurrentWeek
          ? "This week: fill the days as you go."
          : "Past week: your reflection is saved."}
      </Text>

      {/* Oracle: Daily Pulse (Mon–Sat) or Weekly Reflection (Sun / past) */}
      <Box paddingHorizontal="m" marginBottom="m">
        <OracleCard
          isWeekly={isSundayOrPast}
          isPremium={isPremium}
          onUnlockPress={onUnlockPress}
          dailyPulse={dailyPulse}
          loadingDailyPulse={loadingDailyPulse}
          weeklySummary={weeklySummary}
          loading={loadingSummary}
          onShare={onShareAura}
          theme={theme}
        />
      </Box>

      {/* Weekly Rhythm chart */}
      <Box
        marginHorizontal="m"
        marginBottom="m"
        borderRadius="m"
        style={{
          backgroundColor: theme.colors.white,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Box padding="m">
          <Text variant="h4" marginBottom="s" color="textDefault">
            Weekly Rhythm
          </Text>
          <Text variant="default" color="textSubdued">
            Mon–Sun: daily average mood.
          </Text>
        </Box>
        {hasChartData ? (
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [
                {
                  data: chartData.data.map((v) => (v != null && isFinite(v) ? v : 0)) as number[],
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- chart API signature
                  color: (_opacity = 1) => theme.colors.primary,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 64}
            height={250}
            chartConfig={chartConfig}
            bezier
            withInnerLines
            withOuterLines
            withVerticalLines={false}
            withHorizontalLines
            withDots
            withShadow={false}
            formatYLabel={formatYLabel}
          />
        ) : (
          <Box padding="m">
            <Text variant="default" color="textSubdued" textAlign="center">
              {isCurrentWeek
                ? "No entries in this week yet. Log a few to see your rhythm."
                : "No entries in that week."}
            </Text>
          </Box>
        )}
      </Box>

      {/* Mood Mix (for this week or all-time for current week) */}
      <Box paddingHorizontal="m" marginBottom="xl">
        <Text variant="h4" marginBottom="xs" color="textDefault">
          Mood Mix {isCurrentWeek ? "This Week" : "That Week"}
        </Text>
        <Text variant="default" marginBottom="m" color="textSubdued">
          How often each mood showed up.
        </Text>
        <MoodMixBlock entries={weekEntries} theme={theme} />
      </Box>
    </ScrollView>
  );
}

function OracleCard({
  isWeekly,
  isPremium,
  onUnlockPress,
  dailyPulse,
  loadingDailyPulse,
  weeklySummary,
  loading,
  onShare,
  theme,
}: {
  isWeekly: boolean;
  isPremium: boolean;
  onUnlockPress: () => void;
  dailyPulse: DailyPulse | null;
  loadingDailyPulse: boolean;
  weeklySummary: WeeklySummary | null;
  loading: boolean;
  onShare: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const unlockCta = (
    <TouchableOpacity onPress={onUnlockPress} activeOpacity={0.8}>
      <Box
        flexDirection="row"
        alignItems="center"
        alignSelf="flex-start"
        paddingVertical="s"
        paddingHorizontal="m"
        marginTop="s"
        borderRadius="m"
        style={{ backgroundColor: "rgba(155,135,245,0.25)" }}
      >
        <Text variant="button" color="primary">Unlock Premium</Text>
      </Box>
    </TouchableOpacity>
  );

  return (
    <Box
      borderRadius="l"
      overflow="hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={["#E8E0F5", "#D4E8F5", "#E8E0F5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        {isWeekly ? (
          <>
            <Text variant="h5" marginBottom="xs" color="textDefault">
              The Week of {weeklySummary?.title ?? "…"}
            </Text>
            {!isPremium ? (
              <>
                <Text variant="default" color="textSubdued">
                  Unlock Premium to see your Weekly Reflection.
                </Text>
                {unlockCta}
              </>
            ) : loading ? (
              <Box flexDirection="row" alignItems="center" gap="s" paddingVertical="m">
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text variant="default" color="textSubdued">Preparing your reflection…</Text>
              </Box>
            ) : weeklySummary ? (
              <>
                <Text variant="default" color="textDefault" marginBottom="s">
                  {weeklySummary.arc}
                </Text>
                <Text variant="default" color="textDefault" marginBottom="s">
                  {weeklySummary.connection}
                </Text>
                <Text variant="default" color="textDefault" marginBottom="m">
                  {weeklySummary.nudge}
                </Text>
                <TouchableOpacity onPress={onShare} activeOpacity={0.8}>
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    alignSelf="flex-start"
                    paddingVertical="s"
                    paddingHorizontal="m"
                    borderRadius="m"
                    style={{ backgroundColor: "rgba(155,135,245,0.25)" }}
                  >
                    <Text variant="button" color="primary">Share your Aura</Text>
                  </Box>
                </TouchableOpacity>
              </>
            ) : (
              <Text variant="default" color="textSubdued">
                No entries that week to reflect on.
              </Text>
            )}
          </>
        ) : (
          <>
            <Text variant="h5" marginBottom="xs" color="textDefault">
              Your Aura Today
            </Text>
            {!isPremium ? (
              <>
                <Text variant="default" color="textSubdued">
                  Unlock Premium to see Your Aura Today.
                </Text>
                {unlockCta}
              </>
            ) : loadingDailyPulse ? (
              <Box flexDirection="row" alignItems="center" gap="s" paddingVertical="m">
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text variant="default" color="textSubdued">Reading your aura…</Text>
              </Box>
            ) : dailyPulse ? (
              <>
                <Text variant="default" color="textDefault" marginBottom="s">
                  {dailyPulse.line1} {dailyPulse.line2}
                </Text>
                <Text variant="default" color="textSubdued">
                  {dailyPulse.nudge}
                </Text>
              </>
            ) : (
              <Text variant="default" color="textSubdued">
                Check in to see your Daily Pulse.
              </Text>
            )}
          </>
        )}
      </LinearGradient>
    </Box>
  );
}

function MoodMixBlock({
  entries,
  theme,
}: {
  entries: JournalEntry[];
  theme: ReturnType<typeof useTheme>;
}) {
  const mix = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const e of entries) {
      acc[e.mood] = (acc[e.mood] ?? 0) + 1;
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  if (mix.length === 0) {
    return (
      <Box padding="m" borderRadius="m" style={{ backgroundColor: theme.colors.white }}>
        <Text variant="default" color="textSubdued">No mood data for this week.</Text>
      </Box>
    );
  }

  const total = mix.reduce((s, [, c]) => s + c, 0);
  return (
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
      }}
    >
      {mix.map(([mood, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <Box key={mood} marginBottom="m">
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="xs">
              <Text variant="h5" color="textDefault">
                {mood} {MOOD_LABELS[mood as keyof typeof MOOD_LABELS] ?? "—"}
              </Text>
              <Text variant="h6" color="textSubdued">{pct.toFixed(0)}%</Text>
            </Box>
            <Box
              height={8}
              borderRadius="s"
              style={{ backgroundColor: theme.colors.backgroundHovered }}
              overflow="hidden"
            >
              <Box
                height="100%"
                width={`${pct}%`}
                style={{ backgroundColor: theme.colors.primary }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}


const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  arrowHit: { padding: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    borderRadius: 16,
    padding: 20,
    maxWidth: 320,
    width: "100%",
  },
});

export default Trends;
