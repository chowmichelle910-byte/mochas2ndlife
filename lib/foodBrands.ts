import { supabase } from "@/lib/supabase";

export type CalorieMode = "per100g" | "percan";

export interface FoodType {
  id: string;
  name: string;
  calorie_mode: CalorieMode | null;
  kcal_per_100g: number | null;
  kcal_per_can: number | null;
  grams_per_can: number | null;
  moisture_percent: number | null;
}

export async function getCustomFoodBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from("food_brands")
    .select("name")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => row.name as string);
}

export async function addFoodBrand(name: string): Promise<void> {
  const { error } = await supabase.from("food_brands").upsert({ name }, { onConflict: "name" });
  if (error) throw error;
}

export async function listFoodTypes(): Promise<FoodType[]> {
  const { data, error } = await supabase
    .from("food_brands")
    .select("id, name, calorie_mode, kcal_per_100g, kcal_per_can, grams_per_can, moisture_percent")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as FoodType[];
}

export async function upsertFoodType(input: {
  name: string;
  calorie_mode: CalorieMode | null;
  kcal_per_100g: number | null;
  kcal_per_can: number | null;
  grams_per_can: number | null;
  moisture_percent: number | null;
}): Promise<void> {
  const { error } = await supabase
    .from("food_brands")
    .upsert(input, { onConflict: "name" });
  if (error) throw error;
}

export interface FoodKcalSummary {
  kcal: number;
  hasUnknown: boolean;
}

// 扣除食物剩量會在備註後面加上「(已剩下Xg)」（舊版叫「(已扣除Xg)」），
// 比對卡路里設定時要先把這段拿掉，不然會對不上原本設定好的食物種類名稱。
export function stripSubtractionNote(note: string): string {
  return note.replace(/\s*\(已(剩下|扣除)[\d.]+g\)/g, "").trim();
}

export function kcalForFoodEntry(
  entry: { note: string | null; amount: number | null },
  foodTypes: FoodType[] | Map<string, FoodType>
): number | null {
  const byName = foodTypes instanceof Map ? foodTypes : new Map(foodTypes.map((f) => [f.name, f]));
  const amount = entry.amount ?? 0;
  const baseName = entry.note ? stripSubtractionNote(entry.note) : null;
  const ft = baseName ? byName.get(baseName) : undefined;

  if (ft?.calorie_mode === "per100g" && ft.kcal_per_100g != null) {
    return (amount / 100) * ft.kcal_per_100g;
  }
  if (ft?.calorie_mode === "percan" && ft.kcal_per_can != null && ft.grams_per_can) {
    return (amount / ft.grams_per_can) * ft.kcal_per_can;
  }
  return null;
}

export function calculateFoodKcal(
  entries: { note: string | null; amount: number | null }[],
  foodTypes: FoodType[]
): FoodKcalSummary {
  const byName = new Map(foodTypes.map((f) => [f.name, f]));
  let kcal = 0;
  let hasUnknown = false;

  for (const entry of entries) {
    if ((entry.amount ?? 0) <= 0) continue;
    const entryKcal = kcalForFoodEntry(entry, byName);
    if (entryKcal === null) {
      hasUnknown = true;
    } else {
      kcal += entryKcal;
    }
  }

  return { kcal, hasUnknown };
}

// 沒有另外設定含水量時用的預設值：罐頭/濕糧水分通常佔 7-8 成，乾糧大約一成。
export const DEFAULT_MOISTURE_PERCENT: Record<CalorieMode, number> = {
  percan: 78,
  per100g: 10,
};

export interface FoodMoistureSummary {
  ml: number;
  hasUnknown: boolean;
}

export function waterMlForFoodEntry(
  entry: { note: string | null; amount: number | null },
  foodTypes: FoodType[] | Map<string, FoodType>
): number | null {
  const byName = foodTypes instanceof Map ? foodTypes : new Map(foodTypes.map((f) => [f.name, f]));
  const amount = entry.amount ?? 0;
  const baseName = entry.note ? stripSubtractionNote(entry.note) : null;
  const ft = baseName ? byName.get(baseName) : undefined;

  if (!ft?.calorie_mode) return null;
  const moisturePercent = ft.moisture_percent ?? DEFAULT_MOISTURE_PERCENT[ft.calorie_mode];
  return amount * (moisturePercent / 100);
}

export function calculateFoodMoisture(
  entries: { note: string | null; amount: number | null }[],
  foodTypes: FoodType[]
): FoodMoistureSummary {
  const byName = new Map(foodTypes.map((f) => [f.name, f]));
  let ml = 0;
  let hasUnknown = false;

  for (const entry of entries) {
    if ((entry.amount ?? 0) <= 0) continue;
    const entryMl = waterMlForFoodEntry(entry, byName);
    if (entryMl === null) {
      hasUnknown = true;
    } else {
      ml += entryMl;
    }
  }

  return { ml, hasUnknown };
}
