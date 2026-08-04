"use client";

import { ENTRY_META, Entry, EntryType } from "@/lib/types";

const TYPES: EntryType[] = ["food", "water", "poop", "pee"];

function summaryFor(entries: Entry[], type: EntryType): string {
  const matches = entries.filter((e) => e.type === type);
  if (matches.length === 0) return "-";

  const meta = ENTRY_META[type];
  if (type === "poop" || type === "pee") {
    const totalCount = matches.reduce((sum, e) => sum + (e.amount ?? 1), 0);
    return `${totalCount} 次`;
  }

  const total = matches.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  if (type === "food") {
    const feedCount = matches.filter((e) => (e.amount ?? 0) > 0).length;
    return `${total} ${meta.unit} · ${feedCount} 次`;
  }

  return `${total} ${meta.unit} · ${matches.length} 次`;
}

export default function TodayGrid({
  entries,
  onAdd,
  onSubtractFood,
  onMeasureWater,
}: {
  entries: Entry[];
  onAdd: (type: EntryType) => void;
  onSubtractFood: () => void;
  onMeasureWater: () => void;
}) {
  return (
    <div>
      <h2 className="mb-2 px-1 text-sm font-medium text-stone-500">今日紀錄</h2>
      <div className="grid grid-cols-2 gap-3">
        {TYPES.map((type) => {
          const meta = ENTRY_META[type];
          return (
            <div key={type} className="relative rounded-3xl bg-white p-4 pb-12 shadow-sm">
              <div className="flex items-center gap-2 text-stone-700">
                <span className="text-xl">{meta.emoji}</span>
                <span className="font-medium">{meta.label}</span>
              </div>
              <div className="mt-2 text-sm text-stone-400">{summaryFor(entries, type)}</div>
              {type === "food" && (
                <button
                  type="button"
                  aria-label="扣除食物剩量"
                  onClick={onSubtractFood}
                  className="absolute bottom-3 right-14 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-xl font-semibold text-stone-500 transition hover:bg-stone-200"
                >
                  −
                </button>
              )}
              <button
                type="button"
                aria-label={type === "water" ? "量水量" : `新增${meta.label}紀錄`}
                onClick={() => (type === "water" ? onMeasureWater() : onAdd(type))}
                className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xl font-semibold text-orange-500 transition hover:bg-orange-200"
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
