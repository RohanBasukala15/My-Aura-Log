import OpenAI from "openai";
import moment from "moment";
import { JournalEntry, MOOD_LABELS } from "../models/JournalEntry";
import { entriesWithoutAiInsight } from "../utils/entriesForAI";
import { PremiumService } from "./premiumService";
import { Storage } from "./Storage";

const CACHE_PREFIX = "myauralog_daily_pulse_";

export interface DailyPulse {
  line1: string;
  line2: string;
  nudge: string;
}

function getOpenAIClient(): OpenAI | null {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (typeof key !== "string" || key.length < 10) return null;
  return new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const h = moment().hour();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function buildTodayContext(entries: JournalEntry[]): string {
  const cleaned = entriesWithoutAiInsight(entries);
  if (!cleaned.length) return "No check-ins yet today.";

  return [...cleaned]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e, i) => {
      const time = moment(e.timestamp).format("h:mm A");
      const mood = MOOD_LABELS[e.mood] ?? e.mood;
      const text = (e.text ?? "").trim().slice(0, 100);
      const tags = (e.tags ?? []).length ? ` [tags: ${(e.tags ?? []).join(", ")}]` : "";
      const emotions = (e.emotions ?? []).length ? ` [emotions: ${(e.emotions ?? []).join(", ")}]` : "";
      const sleep = (e.sleep ?? []).length ? ` [sleep: ${(e.sleep ?? []).join(", ")}]` : "";
      const health = (e.healthActivities ?? []).length ? ` [health: ${(e.healthActivities ?? []).join(", ")}]` : "";
      const hobbies = (e.hobbies ?? []).length ? ` [hobbies: ${(e.hobbies ?? []).join(", ")}]` : "";
      const note = (e.quickNote ?? "").trim() ? ` [note: ${(e.quickNote ?? "").trim()}]` : "";
      const extra = [tags, emotions, sleep, health, hobbies, note].filter(Boolean).join("");
      return `${i + 1}. ${time} — ${mood}${extra}\n   "${text}${text.length >= 100 ? "…" : ""}"`;
    })
    .join("\n\n");
}

const NUDGES_BY_DAY = [
  "Take a moment to breathe before your next transition.",
  "A short walk can reset your focus.",
  "Remember to hydrate before your evening wind-down.",
  "Consider an early wind-down tonight.",
  "A few minutes of stillness can recenter you.",
  "Notice one good thing before the day ends.",
  "Rest well—you've earned it.",
];

/**
 * Deterministic fallback when AI is unavailable or canUseAI is false.
 * No random: nudge is chosen by day-of-week (0–6) so it’s stable for the day.
 */
function getFallbackDailyPulse(entries: JournalEntry[]): DailyPulse {
  const count = entries.length;
  const tagCounts = entries.reduce<Record<string, number>>((acc, e) => {
    for (const t of e.tags ?? []) acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/^./, (c) => c.toUpperCase()) ?? null;

  return {
    line1: count === 0 ? "No check-ins yet today." : `You've checked in ${count} ${count === 1 ? "time" : "times"} today.`,
    line2: topTag ? `Your focus is on ${topTag}.` : "You're building a habit of reflection.",
    nudge: NUDGES_BY_DAY[moment().day()] ?? NUDGES_BY_DAY[0],
  };
}

function cacheKey(): string {
  return `${CACHE_PREFIX}${moment().format("YYYY-MM-DD")}`;
}

async function getCached(entryCount: number): Promise<DailyPulse | null> {
  const key = cacheKey();
  const raw = await Storage.getItem<{ line1: string; line2: string; nudge: string; entryCount: number; source?: string }>(key, null);
  if (!raw || raw.entryCount !== entryCount || raw.source !== "ai") return null;
  return { line1: raw.line1, line2: raw.line2, nudge: raw.nudge };
}

async function setCache(pulse: DailyPulse, entryCount: number): Promise<void> {
  await Storage.setItem(cacheKey(), { ...pulse, entryCount, source: "ai" });
}

const SYSTEM_PROMPT = `You are the **Aura Agent** for My Aura Log: a warm, precise AI that writes the "Your Aura Today" Daily Pulse. You speak in second person. You are concise. Never generic or fluffy.

Given today's check-ins (mood, text, tags, emotions, sleep, health, hobbies), you produce exactly 3 strings:

- **line1**: One sentence summarizing today's check-ins (count and any standout). If zero check-ins: a gentle nudge to check in. Max 15 words.
- **line2**: One sentence on the theme or focus you notice (from tags, mood, or words). If nothing to go on: "You're building a habit of reflection." Max 12 words.
- **nudge**: One specific, kind action for the rest of today. It must feel tailored—time-aware, or tied to what they shared. Never generic. Max 12 words.

Current time of day is provided (morning / afternoon / evening). Use it to make the nudge timely.

Return only valid JSON: { "line1": "...", "line2": "...", "nudge": "..." }. No markdown, no extra text.`;

/**
 * Generate the Daily Pulse for "Your Aura Today" using the Aura Agent (OpenAI).
 * Uses PremiumService.canUseAI / incrementAIUsage. Falls back to a deterministic
 * (non‑random) pulse if API is unavailable or the user is over the free limit.
 * Caches by date + today’s entry count; invalidates when new check‑ins are added.
 */
export async function generateDailyPulse(todayEntries: JournalEntry[]): Promise<DailyPulse> {
  const entryCount = todayEntries.length;
  const cached = await getCached(entryCount);
  if (cached) return cached;

  const canUse = await PremiumService.canUseAI();
  const openai = getOpenAIClient();
  if (!openai || !canUse) return getFallbackDailyPulse(todayEntries);

  const timeOfDay = getTimeOfDay();
  const context = buildTodayContext(todayEntries);
  const userPrompt = `Time of day: ${timeOfDay}\n\nToday's check-ins:\n${context}`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 220,
    });

    const raw = res.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as { line1?: string; line2?: string; nudge?: string };
    const f = getFallbackDailyPulse(todayEntries);

    const pulse: DailyPulse = {
      line1: (typeof parsed.line1 === "string" && parsed.line1.length > 0) ? parsed.line1 : f.line1,
      line2: (typeof parsed.line2 === "string" && parsed.line2.length > 0) ? parsed.line2 : f.line2,
      nudge: (typeof parsed.nudge === "string" && parsed.nudge.length > 0) ? parsed.nudge : f.nudge,
    };

    await Promise.all([PremiumService.incrementAIUsage(), setCache(pulse, entryCount)]);
    return pulse;
  } catch {
    return getFallbackDailyPulse(todayEntries);
  }
}
