"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { addMonths, formatDisplayDate, toDateKey } from "@/lib/date";
import { Entry } from "@/lib/types";

const REMINDER_MONTHS = 3;
const SOON_THRESHOLD_DAYS = 14;

export default function FleaReminderCard({
  refreshKey,
  onLogClick,
}: {
  refreshKey: number;
  onLogClick: () => void;
}) {
  const [latest, setLatest] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("entries")
      .select("*")
      .eq("type", "flea")
      .order("occurred_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setLatest((data?.[0] as Entry) ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const lastDateKey = latest ? toDateKey(new Date(latest.occurred_at)) : null;
  const dueDateKey = lastDateKey ? addMonths(lastDateKey, REMINDER_MONTHS) : null;

  let status: { label: string; className: string } | null = null;
  if (dueDateKey) {
    const todayKey = toDateKey(new Date());
    const daysLeft = Math.round(
      (new Date(`${dueDateKey}T00:00:00`).getTime() - new Date(`${todayKey}T00:00:00`).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
      status = { label: `已逾期 ${Math.abs(daysLeft)} 天，該點藥囉！`, className: "bg-red-100 text-red-700" };
    } else if (daysLeft <= SOON_THRESHOLD_DAYS) {
      status = { label: `還有 ${daysLeft} 天到期`, className: "bg-orange-100 text-orange-700" };
    } else {
      status = { label: `還有 ${daysLeft} 天到期`, className: "bg-emerald-100 text-emerald-700" };
    }
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700">
          <span className="text-xl">💊</span>
          <span className="font-medium">除蟲藥</span>
        </div>
        <button
          type="button"
          onClick={onLogClick}
          aria-label="新增除蟲藥紀錄"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-500 transition hover:bg-orange-200"
        >
          +
        </button>
      </div>

      {error && <div className="mt-2 text-xs text-red-500">發生錯誤：{error}</div>}

      {loading ? (
        <div className="mt-2 text-sm text-stone-400">載入中...</div>
      ) : latest && lastDateKey && dueDateKey ? (
        <div className="mt-2 space-y-1 text-sm">
          <div className="text-stone-500">上次點藥：{formatDisplayDate(lastDateKey)}</div>
          <div className="text-stone-500">下次應點：{formatDisplayDate(dueDateKey)}</div>
          {status && (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
            >
              {status.label}
            </span>
          )}
        </div>
      ) : (
        <div className="mt-2 text-sm text-stone-400">
          還沒有紀錄，點右上角「+」新增第一次點藥紀錄
        </div>
      )}
    </div>
  );
}
