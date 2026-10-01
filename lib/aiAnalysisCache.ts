import { getSetting, setSetting } from "@/lib/settings";

const CACHE_KEY = "last_ai_analysis";

export interface CachedAnalysis {
  rangeDays: number;
  endDateKey: string;
  analysis: string;
  generatedAt: string;
}

export async function getCachedAnalysis(): Promise<CachedAnalysis | null> {
  const raw = await getSetting(CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedAnalysis;
  } catch {
    return null;
  }
}

export async function setCachedAnalysis(value: CachedAnalysis): Promise<void> {
  await setSetting(CACHE_KEY, JSON.stringify(value));
}
