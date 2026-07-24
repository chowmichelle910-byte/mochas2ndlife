"use client";

import { addDays, formatDisplayDate, toDateKey } from "@/lib/date";

export default function DateNav({
  dateKey,
  onChange,
}: {
  dateKey: string;
  onChange: (next: string) => void;
}) {
  const isToday = dateKey === toDateKey(new Date());

  return (
    <div className="flex items-center justify-between rounded-3xl bg-white px-3 py-2 shadow-sm">
      <button
        type="button"
        aria-label="前一天"
        className="rounded-full px-3 py-1 text-lg text-orange-500 hover:bg-orange-50"
        onClick={() => onChange(addDays(dateKey, -1))}
      >
        ←
      </button>
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-stone-700">
          {formatDisplayDate(dateKey)}
        </span>
        {!isToday && (
          <button
            type="button"
            className="text-xs text-orange-500 underline underline-offset-2"
            onClick={() => onChange(toDateKey(new Date()))}
          >
            回到今天
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="後一天"
        className="rounded-full px-3 py-1 text-lg text-orange-500 hover:bg-orange-50 disabled:opacity-30"
        onClick={() => onChange(addDays(dateKey, 1))}
        disabled={isToday}
      >
        →
      </button>
    </div>
  );
}
