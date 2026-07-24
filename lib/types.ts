export type EntryType = "food" | "water" | "pee" | "poop";

export interface Entry {
  id: string;
  type: EntryType;
  amount: number | null;
  note: string | null;
  occurred_at: string;
  created_at: string;
}

export interface EntryInput {
  type: EntryType;
  amount: number | null;
  note: string | null;
  occurred_at: string;
}

export const ENTRY_META: Record<
  EntryType,
  { label: string; unit: string; emoji: string; color: string }
> = {
  food: { label: "食物", unit: "g", emoji: "🍚", color: "bg-amber-100 text-amber-800" },
  water: { label: "喝水", unit: "ml", emoji: "💧", color: "bg-blue-100 text-blue-800" },
  pee: { label: "尿尿", unit: "ml", emoji: "🚽", color: "bg-sky-100 text-sky-800" },
  poop: { label: "便便", unit: "次", emoji: "💩", color: "bg-amber-200 text-amber-900" },
};
