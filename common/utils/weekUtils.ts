import moment from "moment";

export type DayState = "history" | "today" | "future";

export interface WeekDay {
  date: string; // YYYY-MM-DD
  label: string; // M, T, W, T, F, S, S
  dayOfWeek: number; // 1=Mon .. 7=Sun
  timestamp: number; // start of day
  state: DayState;
}

/**
 * Get Monday 00:00 of the week that contains the given date.
 */
export function getMondayOfWeek(m: moment.Moment): moment.Moment {
  const d = m.clone();
  const iso = d.isoWeekday();
  return d.subtract(iso - 1, "days").startOf("day");
}

/**
 * Get the week identifier: YYYY_WW (e.g. "2025_04").
 */
export function getWeekId(m: moment.Moment): string {
  const monday = getMondayOfWeek(m);
  const year = monday.year();
  const week = monday.isoWeek();
  return `${year}_${String(week).padStart(2, "0")}`;
}

/**
 * Get [start, end] timestamps for the week (Mon 00:00 to Sun 23:59:59.999).
 */
export function getWeekRange(m: moment.Moment): { start: number; end: number } {
  const monday = getMondayOfWeek(m);
  const sunday = monday.clone().add(6, "days").endOf("day");
  return {
    start: monday.valueOf(),
    end: sunday.valueOf(),
  };
}

/**
 * Build the 7 week days (Mon–Sun) for the week containing `m`.
 * `today` is used to compute state: history, today, future.
 */
export function getWeekDays(weekMoment: moment.Moment, today: moment.Moment): WeekDay[] {
  const monday = getMondayOfWeek(weekMoment);
  const labels = ["M", "T", "W", "T", "F", "S", "S"];

  return Array.from({ length: 7 }, (_, i) => {
    const d = monday.clone().add(i, "days");
    const date = d.format("YYYY-MM-DD");
    const todayDate = today.format("YYYY-MM-DD");
    let state: DayState = "history";
    if (date === todayDate) state = "today";
    else if (d.isAfter(today, "day")) state = "future";

    return {
      date,
      label: labels[i] ?? "?",
      dayOfWeek: i + 1,
      timestamp: d.startOf("day").valueOf(),
      state,
    };
  });
}

/**
 * Get the week moment for a week offset: 0 = current week, -1 = previous, etc.
 */
export function getWeekMomentForOffset(offset: number): moment.Moment {
  const today = moment();
  const monday = getMondayOfWeek(today);
  return monday.add(offset * 7, "days");
}

/**
 * Format a week for display: e.g. "Jan 27 – Feb 2, 2025"
 */
export function formatWeekRange(weekMoment: moment.Moment): string {
  const monday = getMondayOfWeek(weekMoment);
  const sunday = monday.clone().add(6, "days");
  const sameYear = monday.year() === sunday.year();
  if (sameYear) {
    return `${monday.format("MMM D")} – ${sunday.format("MMM D, YYYY")}`;
  }
  return `${monday.format("MMM D, YYYY")} – ${sunday.format("MMM D, YYYY")}`;
}
