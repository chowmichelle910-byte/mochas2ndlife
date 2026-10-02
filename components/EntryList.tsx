"use client";

import { formatTime } from "@/lib/date";
import { ENTRY_META, Entry } from "@/lib/types";

function wasEdited(entry: Entry): boolean {
  return new Date(entry.updated_at).getTime() - new Date(entry.created_at).getTime() > 2000;
}

function formatEditedAt(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EntryList({
  entries,
  onDelete,
  onEdit,
}: {
  entries: Entry[];
  onDelete: (id: string) => void;
  onEdit: (entry: Entry) => void;
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
            role="button"
            tabIndex={0}
            onClick={() => onEdit(entry)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEdit(entry);
            }}
            className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm transition hover:bg-stone-50"
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
              {wasEdited(entry) && (
                <div className="text-xs text-stone-400">
                  最後修改：{formatEditedAt(entry.updated_at)}
                </div>
              )}
            </div>
            <span className="text-xs text-stone-400">{formatTime(entry.occurred_at)}</span>
            <button
              type="button"
              aria-label="刪除"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
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
