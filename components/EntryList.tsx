"use client";

import { formatTime } from "@/lib/date";
import { ENTRY_META, Entry } from "@/lib/types";

export default function EntryList({
  entries,
  onDelete,
}: {
  entries: Entry[];
  onDelete: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center text-sm text-stone-400 shadow-sm">
        這天還沒有紀錄，新增第一筆吧！
      </div>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((entry) => {
        const meta = ENTRY_META[entry.type];
        return (
          <li
            key={entry.id}
            className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${meta.color}`}>
              {meta.emoji}
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium text-stone-800">
                {meta.label}
                {entry.amount !== null && (
                  <span className="ml-1 text-stone-500">
                    {entry.amount} {meta.unit}
                  </span>
                )}
              </div>
              {entry.note && (
                <div className="text-xs text-stone-500">{entry.note}</div>
              )}
            </div>
            <span className="text-xs text-stone-400">{formatTime(entry.occurred_at)}</span>
            <button
              type="button"
              aria-label="刪除"
              onClick={() => onDelete(entry.id)}
              className="rounded-full p-1 text-stone-300 hover:bg-red-50 hover:text-red-500"
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
