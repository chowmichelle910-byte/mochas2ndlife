import { getSetting, setSetting } from "@/lib/settings";

const BIRTHDATE_KEY = "cat_birthdate";

export async function getCatBirthdate(): Promise<string | null> {
  return getSetting(BIRTHDATE_KEY);
}

export async function setCatBirthdate(dateKey: string): Promise<void> {
  await setSetting(BIRTHDATE_KEY, dateKey);
}

export function ageInYears(birthdateKey: string, atDateKey: string): number {
  const birth = new Date(`${birthdateKey}T00:00:00`);
  const at = new Date(`${atDateKey}T00:00:00`);
  const ms = at.getTime() - birth.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 365.25));
}

function lifeStageFactor(ageYears: number): number {
  if (ageYears < 1) return 2.5;
  if (ageYears < 7) return 1.2;
  return 1.1;
}

export function estimateDailyKcalNeed(weightKg: number, ageYears: number): number {
  const rer = 70 * Math.pow(weightKg, 0.75);
  return rer * lifeStageFactor(ageYears);
}
