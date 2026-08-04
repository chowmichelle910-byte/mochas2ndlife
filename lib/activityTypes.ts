import { supabase } from "@/lib/supabase";

export async function getCustomActivityTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from("activity_types")
    .select("name")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => row.name as string);
}

export async function addActivityType(name: string): Promise<void> {
  const { error } = await supabase.from("activity_types").upsert({ name }, { onConflict: "name" });
  if (error) throw error;
}
