import { Storage } from "./Storage";

const PREFIX = "myauralog_weekly_summary_";

export interface WeeklySummary {
  weekId: string;
  title: string;
  arc: string;
  connection: string;
  nudge: string;
  generatedAt: number;
}

function storageKey(weekId: string): string {
  return `${PREFIX}${weekId}`;
}

export const WeeklySummaryStorage = {
  async get(weekId: string): Promise<WeeklySummary | null> {
    return Storage.getItem<WeeklySummary>(storageKey(weekId), null);
  },

  async set(summary: WeeklySummary): Promise<void> {
    await Storage.setItem(storageKey(summary.weekId), {
      ...summary,
      generatedAt: Date.now(),
    });
  },
};
