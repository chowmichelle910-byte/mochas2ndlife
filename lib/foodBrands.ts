import { supabase } from "@/lib/supabase";

export type CalorieMode = "per100g" | "percan";

export interface FoodType {
  id: string;
  name: string;
  calorie_mode: CalorieMode | null;
  kcal_per_100g: number | null;
  kcal_per_can: number | null;
  grams_per_can: number | null;
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
    .select("id, name, calorie_mode, kcal_per_100g, kcal_per_can, grams_per_can")
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

export function calculateFoodKcal(
  entries: { note: string | null; amount: number | null }[],
  foodTypes: FoodType[]
): FoodKcalSummary {
  const byName = new Map(foodTypes.map((f) => [f.name, f]));
  let kcal = 0;
  let hasUnknown = false;

  for (const entry of entries) {
    const amount = entry.amount ?? 0;
    if (amount <= 0) continue;
    const ft = entry.note ? byName.get(entry.note) : undefined;
    if (ft?.calorie_mode === "per100g" && ft.kcal_per_100g != null) {
      kcal += (amount / 100) * ft.kcal_per_100g;
    } else if (ft?.calorie_mode === "percan" && ft.kcal_per_can != null && ft.grams_per_can) {
      kcal += (amount / ft.grams_per_can) * ft.kcal_per_can;
    } else {
      hasUnknown = true;
    }
  }

  return { kcal, hasUnknown };
}
