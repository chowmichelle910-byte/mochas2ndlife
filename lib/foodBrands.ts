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
