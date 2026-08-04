import { getSetting, setSetting } from "@/lib/settings";

const WATER_PENDING_KEY = "water_pending_start";

export interface WaterPendingStart {
  amount: number;
  setAt: string;
}

export async function getPendingWaterStart(): Promise<WaterPendingStart | null> {
  const raw = await getSetting(WATER_PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WaterPendingStart;
  } catch {
    return null;
  }
}

export async function setPendingWaterStart(amount: number): Promise<void> {
  await setSetting(WATER_PENDING_KEY, JSON.stringify({ amount, setAt: new Date().toISOString() }));
}

export async function clearPendingWaterStart(): Promise<void> {
  await setSetting(WATER_PENDING_KEY, "");
}
