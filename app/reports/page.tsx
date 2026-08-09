"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ReportCard from "@/components/ReportCard";
import AIAnalysisCard from "@/components/AIAnalysisCard";
import { addDays, daysBetween, toDateKey } from "@/lib/date";

const RANGE_TABS = [
  { key: "week", label: "1週" },
  { key: "month", label: "1個月" },
  { key: "custom", label: "自訂期間" },
] as const;

type RangeKey = (typeof RANGE_TABS)[number]["key"];

export default function ReportsPage() {
  const todayKey = toDateKey(new Date());
  const [rangeKey, setRangeKey] = useState<RangeKey>("week");
  const [customStart, setCustomStart] = useState(() => addDays(todayKey, -6));
  const [customEnd, setCustomEnd] = useState(todayKey);

  const effective = useMemo(() => {
    if (rangeKey === "week") {
      return { days: 7, endDateKey: todayKey, compareLabel: "週" };
    }
    if (rangeKey === "month") {
      return { days: 30, endDateKey: todayKey, compareLabel: "個月" };
    }
    const end = customEnd >= customStart ? customEnd : customStart;
    return { days: daysBetween(customStart, end), endDateKey: end, compareLabel: "個週期" };
  }, [rangeKey, customStart, customEnd, todayKey]);

  return (
    <main className="flex flex-col gap-4">
      <div className="relative flex items-center justify-center py-1">
        <Link
          href="/"
          aria-label="返回"
          className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-xl text-stone-600 hover:bg-white/60"
        >
          ←
        </Link>
        <h1 className="text-lg font-semibold text-stone-700">報表</h1>
      </div>

      <div className="flex gap-2 rounded-full bg-white p-1 shadow-sm">
        {RANGE_TABS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRangeKey(r.key)}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${
              rangeKey === r.key ? "bg-orange-400 text-white" : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {rangeKey === "custom" && (
        <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <input
            type="date"
            value={customStart}
            max={customEnd}
            onChange={(e) => setCustomStart(e.target.value)}
            className="flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-base focus:border-orange-400 focus:outline-none"
          />
          <span className="text-sm text-stone-400">至</span>
          <input
            type="date"
            value={customEnd}
            min={customStart}
            max={todayKey}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-base focus:border-orange-400 focus:outline-none"
          />
        </div>
      )}

      <ReportCard
        type="food"
        rangeDays={effective.days}
        endDateKey={effective.endDateKey}
        compareLabel={effective.compareLabel}
      />
      <ReportCard
        type="poop"
        rangeDays={effective.days}
        endDateKey={effective.endDateKey}
        compareLabel={effective.compareLabel}
      />
      <ReportCard
        type="pee"
        rangeDays={effective.days}
        endDateKey={effective.endDateKey}
        compareLabel={effective.compareLabel}
      />

      <AIAnalysisCard
        key={`${effective.days}-${effective.endDateKey}`}
        rangeDays={effective.days}
        endDateKey={effective.endDateKey}
      />
    </main>
  );
}
