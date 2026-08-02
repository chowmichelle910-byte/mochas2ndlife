"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDisplayDate, toDateKey } from "@/lib/date";
import { Entry } from "@/lib/types";

export default function WeightCard({
  refreshKey,
  onLogClick,
}: {
  refreshKey: number;
  onLogClick: () => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("entries")
      .select("*")
      .eq("type", "weight")
      .order("occurred_at", { ascending: false })
      .limit(2);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEntries((data as Entry[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const latest = entries[0] ?? null;
  const previous = entries[1] ?? null;
  const delta =
    latest && previous && latest.amount !== null && previous.amount !== null
      ? Math.round((latest.amount - previous.amount) * 100) / 100
      : null;

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700">
          <span className="text-xl">⚖️</span>
          <span className="font-medium">體重</span>
        </div>
        <button
          type="button"
          onClick={onLogClick}
          aria-label="新增體重紀錄"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-500 transition hover:bg-orange-200"
        >
          +
        </button>
      </div>

      {error && <div className="mt-2 text-xs text-red-500">發生錯誤：{error}</div>}

      {loading ? (
        <div className="mt-2 text-sm text-stone-400">載入中...</div>
      ) : latest && latest.amount !== null ? (
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-stone-800">{latest.amount}</span>
          <span className="text-sm text-stone-500">kg</span>
          {delta !== null && (
            <span
              className={`text-xs font-medium ${
                delta > 0 ? "text-orange-500" : delta < 0 ? "text-sky-500" : "text-stone-400"
              }`}
            >
              {delta > 0 ? `▲ ${delta}` : delta < 0 ? `▼ ${Math.abs(delta)}` : "持平"}
            </span>
          )}
          <span className="ml-auto text-xs text-stone-400">
            {formatDisplayDate(toDateKey(new Date(latest.occurred_at)))}
          </span>
        </div>
      ) : (
        <div className="mt-2 text-sm text-stone-400">
          還沒有紀錄，點右上角「+」新增第一次量體重紀錄
        </div>
      )}
    </div>
  );
}
