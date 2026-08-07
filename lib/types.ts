export type EntryType =
  | "food"
  | "water"
  | "pee"
  | "poop"
  | "flea"
  | "weight"
  | "activity"
  | "snack";

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
  pee: { label: "尿尿", unit: "次", emoji: "🚽", color: "bg-sky-100 text-sky-800" },
  poop: { label: "便便", unit: "次", emoji: "💩", color: "bg-amber-200 text-amber-900" },
  flea: { label: "除蟲藥", unit: "次", emoji: "💊", color: "bg-purple-100 text-purple-800" },
  weight: { label: "體重", unit: "kg", emoji: "⚖️", color: "bg-teal-100 text-teal-800" },
  activity: { label: "活動", unit: "次", emoji: "✂️", color: "bg-emerald-100 text-emerald-800" },
  snack: { label: "零食", unit: "次", emoji: "🍪", color: "bg-pink-100 text-pink-800" },
};
