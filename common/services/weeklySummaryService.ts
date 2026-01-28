import OpenAI from "openai";
import moment from "moment";
import { JournalEntry, MOOD_LABELS } from "../models/JournalEntry";
import { entriesWithoutAiInsight } from "../utils/entriesForAI";
import { WeeklySummaryStorage, WeeklySummary } from "./weeklySummaryStorage";


const getOpenAIClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey || apiKey.length < 10) return null;
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
};

function buildEntriesContext(entries: JournalEntry[]): string {
  const cleaned = entriesWithoutAiInsight(entries);
  return cleaned
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e) => {
      const d = moment(e.timestamp).format("ddd M/D");
      const mood = MOOD_LABELS[e.mood] ?? e.mood;
      const tags = (e.tags ?? []).length ? ` [${(e.tags ?? []).join(", ")}]` : "";
      const emotions = (e.emotions ?? []).length ? ` [emotions: ${(e.emotions ?? []).join(", ")}]` : "";
      const note = (e.quickNote ?? "").trim() ? ` [note: ${(e.quickNote ?? "").trim()}]` : "";
      const preview = (e.text ?? "").slice(0, 120);
      const extra = [tags, emotions, note].filter(Boolean).join("");
      return `- ${d}: ${mood}${extra}\n  "${preview}${preview.length >= 120 ? "…" : ""}"`;
    })
    .join("\n\n");
}

function buildFallbackSummary(entries: JournalEntry[], weekId: string): WeeklySummary {
  const moods = entries.map((e) => MOOD_LABELS[e.mood] ?? e.mood);
  const tags = entries.flatMap((e) => e.tags ?? []);
  const tagCounts = tags.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const first = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
  const topTag = (first && first[0]) || "reflection";

  return {
    weekId,
    title: `Quiet Growth`,
    arc: `You logged ${entries.length} ${entries.length === 1 ? "entry" : "entries"} this week. Your moods touched ${[...new Set(moods)].join(", ")}. Small steps add up.`,
    connection: `"${topTag}" showed up most in your tags—a thread worth following.`,
    nudge: `Next week, try one extra check-in on a day you usually skip.`,
    generatedAt: Date.now(),
  };
}

export async function generateWeeklySummary(
  entries: JournalEntry[],
  weekId: string
): Promise<WeeklySummary> {
  const cached = await WeeklySummaryStorage.get(weekId);
  if (cached) return cached;

  const openai = getOpenAIClient();
  const context = buildEntriesContext(entries);

  if (!openai) {
    return buildFallbackSummary(entries, weekId);
  }
  if (entries.length === 0) {
    const fallback = buildFallbackSummary(entries, weekId);
    await WeeklySummaryStorage.set(fallback);
    return fallback;
  }

  const prompt = `You are My Aura Log. Write a short **Weekly Reflection** for this user's journal week.

Entries (date, mood, tags, text preview):
${context || "No entries this week."}

Return JSON only:
{
  "title": "A 2–4 word poetic title for this week (e.g. 'Small Wins' or 'Gentle Shifts')",
  "arc": "The Arc: 2–3 sentences on how mood/energy shifted across the week (max 60 words)",
  "connection": "The Connection: One specific insight, e.g. 'I noticed your Anxiety dropped on days you tagged Yoga' or similar (max 50 words)",
  "nudge": "The Nudge: One concrete, kind goal for next week (max 40 words)"
}`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are My Aura Log. Reply with valid JSON only, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 320,
    });
    const raw = res.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as { title?: string; arc?: string; connection?: string; nudge?: string };
    const summary: WeeklySummary = {
      weekId,
      title: parsed.title ?? "This Week",
      arc: parsed.arc ?? "",
      connection: parsed.connection ?? "",
      nudge: parsed.nudge ?? "",
      generatedAt: Date.now(),
    };
    await WeeklySummaryStorage.set(summary);
    return summary;
  } catch (e) {
    return buildFallbackSummary(entries, weekId);
  }
}

/**
 * Get cached summary or generate and cache for the given week.
 * For past weeks we only use cache or generate once (no re-gen to save tokens).
 */
export async function ensureWeeklySummary(
  weekId: string,
  entries: JournalEntry[]
): Promise<WeeklySummary> {
  const cached = await WeeklySummaryStorage.get(weekId);
  if (cached) return cached;
  return generateWeeklySummary(entries, weekId);
}
