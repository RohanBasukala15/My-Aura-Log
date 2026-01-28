import { JournalEntry } from "../models/JournalEntry";

/**
 * Strip `aiInsight` from entries before sending to any AI.
 * The rest (mood, text, tags, emotions, sleep, healthActivities, hobbies, quickNote, etc.)
 * stays so the model can understand the user's raw input without prior AI output.
 */
export function entriesWithoutAiInsight(entries: JournalEntry[]): Omit<JournalEntry, "aiInsight">[] {
  return entries.map(({ aiInsight: _, ...rest }) => rest);
}
