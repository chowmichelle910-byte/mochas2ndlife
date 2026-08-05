"use client";

import { useEffect, useState } from "react";
import { ReportSeries, ReportType, fetchReportSeries } from "@/lib/reports";
import { useVisibilityRefresh } from "@/lib/useVisibilityRefresh";

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

function weekdayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  return WEEKDAY_LABELS[d.getDay()];
}

function monthDayLabel(dateKey: string): string {
  const [, m, d] = dateKey.split("-");
  return `${Number(m)}/${Number(d)}`;
}

const CONFIG: Record<
  ReportType,
  { label: string; emoji: string; unit: string; iconBg: string; bar: string; text: string; badge: string }
> = {
  food: {
    label: "食物",
    emoji: "🍚",
    unit: "g",
    iconBg: "bg-amber-100",
    bar: "bg-amber-300",
    text: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
  poop: {
    label: "便便",
    emoji: "💩",
    unit: "次",
    iconBg: "bg-orange-100",
    bar: "bg-orange-300",
    text: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
  },
  pee: {
    label: "尿尿",
    emoji: "🚽",
    unit: "次",
    iconBg: "bg-sky-100",
    bar: "bg-sky-300",
    text: "text-sky-600",
    badge: "bg-sky-100 text-sky-700",
  },
};

export default function ReportCard({
  type,
  rangeDays,
  compareLabel,
  endDateKey,
}: {
  type: ReportType;
  rangeDays: number;
  compareLabel: string;
  endDateKey: string;
}) {
  const [series, setSeries] = useState<ReportSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const visibilityKey = useVisibilityRefresh();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchReportSeries(type, rangeDays, endDateKey)
      .then(setSeries)
      .catch((err) => setError(err instanceof Error ? err.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [type, rangeDays, endDateKey, visibilityKey]);

  const cfg = CONFIG[type];
  const isMonth = rangeDays > 7;
  const maxValue = series ? Math.max(...series.values, 1) : 1;
  const avgRounded = series ? Math.round(series.currentAvg * 10) / 10 : 0;

  const trendLabel = (() => {
    if (!series) return null;
    if (series.changePercent === null) return series.currentAvg > 0 ? "新紀錄" : null;
    const rounded = Math.round(Math.abs(series.changePercent));
    if (series.changePercent > 0) return `↑ 比上${compareLabel} ${rounded}%`;
    if (series.changePercent < 0) return `↓ 比上${compareLabel} ${rounded}%`;
    return "持平";
  })();

  const summarySentence = (() => {
    if (!series) return "";
    const trend =
      series.changePercent === null
        ? ""
        : series.changePercent > 0
          ? `，比上${compareLabel}多`
          : series.changePercent < 0
            ? `，比上${compareLabel}少`
            : `，跟上${compareLabel}差不多`;
    if (type === "food") return `Mocha 平均每天吃了 ${avgRounded} g${trend}`;
    return `Mocha 平均每天${cfg.label}了 ${avgRounded} 次${trend}`;
  })();

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${cfg.iconBg}`}>
          {cfg.emoji}
        </div>
        <p className="text-sm text-stone-700">
          {loading ? "載入中..." : error ? `發生錯誤：${error}` : summarySentence}
        </p>
      </div>

      {series && !loading && !error && (
        <div className="mt-3 rounded-2xl bg-stone-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-medium ${cfg.text}`}>過去 {rangeDays} 天的平均值</span>
            {trendLabel && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
                {trendLabel}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-end gap-4">
            <div className="shrink-0">
              <div className={`text-2xl font-bold ${cfg.text}`}>
                {avgRounded}
                <span className="ml-1 text-sm font-normal text-stone-500">{cfg.unit}/天</span>
              </div>
              <div className="text-xs text-stone-400">平均</div>
            </div>

            <div className="flex-1 overflow-x-auto pb-1">
              <div
                className="relative flex h-16 items-end gap-1"
                style={isMonth ? { minWidth: `${series.values.length * 12}px` } : undefined}
              >
                <div
                  className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-stone-300"
                  style={{
                    bottom: `${Math.min(100, (series.currentAvg / maxValue) * 100)}%`,
                  }}
                />
                {series.values.map((v, i) => (
                  <div key={series.days[i]} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-2.5 rounded-t ${cfg.bar}`}
                      style={{ height: `${Math.max(3, (v / maxValue) * 64)}px` }}
                    />
                  </div>
                ))}
              </div>
              {!isMonth && (
                <div className="mt-1 flex gap-1">
                  {series.days.map((day) => (
                    <span key={day} className="flex-1 text-center text-[10px] text-stone-400">
                      {weekdayLabel(day)}
                    </span>
                  ))}
                </div>
              )}
              {isMonth && (
                <div className="mt-1 flex justify-between text-[10px] text-stone-400">
                  <span>{monthDayLabel(series.days[0])}</span>
                  <span>{monthDayLabel(series.days[series.days.length - 1])}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
