"use client";

import Link from "next/link";
import { useState } from "react";
import ReportCard from "@/components/ReportCard";

const RANGES = [
  { key: "week", label: "1週", compareLabel: "週", days: 7 },
  { key: "month", label: "1個月", compareLabel: "個月", days: 30 },
] as const;

export default function ReportsPage() {
  const [rangeKey, setRangeKey] = useState<(typeof RANGES)[number]["key"]>("week");
  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[0];

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
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRangeKey(r.key)}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${
              range.key === r.key
                ? "bg-orange-400 text-white"
                : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ReportCard type="food" rangeDays={range.days} compareLabel={range.compareLabel} />
      <ReportCard type="poop" rangeDays={range.days} compareLabel={range.compareLabel} />
      <ReportCard type="pee" rangeDays={range.days} compareLabel={range.compareLabel} />
    </main>
  );
}
