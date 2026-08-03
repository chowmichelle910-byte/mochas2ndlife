import { supabase } from "@/lib/supabase";
import { addDays, dateKeyToRange, toDateKey } from "@/lib/date";

export type ReportType = "food" | "poop" | "pee";

export interface ReportSeries {
  days: string[];
  values: number[];
  currentAvg: number;
  previousAvg: number;
  changePercent: number | null;
}

function fallbackAmount(type: ReportType): number {
  return type === "food" ? 0 : 1;
}

export async function fetchReportSeries(type: ReportType, rangeDays: number): Promise<ReportSeries> {
  const todayKey = toDateKey(new Date());
  const startCurrent = addDays(todayKey, -(rangeDays - 1));
  const startPrevious = addDays(startCurrent, -rangeDays);

  const { start } = dateKeyToRange(startPrevious);
  const { end } = dateKeyToRange(todayKey);

  const { data, error } = await supabase
    .from("entries")
    .select("amount, occurred_at")
    .eq("type", type)
    .gte("occurred_at", start)
    .lte("occurred_at", end);

  if (error) throw error;

  const byDay = new Map<string, number>();
  for (const row of data ?? []) {
    const key = toDateKey(new Date(row.occurred_at));
    const value = row.amount ?? fallbackAmount(type);
    byDay.set(key, (byDay.get(key) ?? 0) + value);
  }

  const days: string[] = [];
  const values: number[] = [];
  let cursor = startCurrent;
  for (let i = 0; i < rangeDays; i++) {
    days.push(cursor);
    values.push(byDay.get(cursor) ?? 0);
    cursor = addDays(cursor, 1);
  }

  let previousSum = 0;
  let prevCursor = startPrevious;
  for (let i = 0; i < rangeDays; i++) {
    previousSum += byDay.get(prevCursor) ?? 0;
    prevCursor = addDays(prevCursor, 1);
  }

  const currentAvg = values.reduce((a, b) => a + b, 0) / rangeDays;
  const previousAvg = previousSum / rangeDays;
  const changePercent = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : null;

  return { days, values, currentAvg, previousAvg, changePercent };
}
