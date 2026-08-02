import { supabase } from "@/lib/supabase";

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
