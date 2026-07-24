"use client";

import { ENTRY_META, Entry, EntryType } from "@/lib/types";

function sumFor(entries: Entry[], type: EntryType): number {
  return entries
    .filter((e) => e.type === type)
    .reduce((total, e) => total + (e.amount ?? 0), 0);
}

function countFor(entries: Entry[], type: EntryType): number {
  return entries.filter((e) => e.type === type).length;
}

export default function SummaryCards({ entries }: { entries: Entry[] }) {
  const cards: { type: EntryType; value: string }[] = [
    { type: "food", value: `${sumFor(entries, "food")} g` },
    { type: "water", value: `${sumFor(entries, "water")} ml` },
    { type: "pee", value: `${sumFor(entries, "pee")} ml · ${countFor(entries, "pee")} 次` },
    { type: "poop", value: `${countFor(entries, "poop")} 次` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ type, value }) => {
        const meta = ENTRY_META[type];
        return (
          <div
            key={type}
            className="flex flex-col items-center gap-1 rounded-2xl bg-white p-3 shadow-sm"
          >
            <span className="text-2xl">{meta.emoji}</span>
            <span className="text-xs text-stone-500">{meta.label}</span>
            <span className="text-sm font-semibold text-stone-800">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
