"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDisplayDate, toDateKey } from "@/lib/date";
import { Entry } from "@/lib/types";

export default function ActivityCard({
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
      .eq("type", "activity")
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

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700">
          <span className="text-xl">✂️</span>
          <span className="font-medium">活動</span>
        </div>
        <button
          type="button"
          onClick={onLogClick}
          aria-label="新增活動紀錄"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-500 transition hover:bg-orange-200"
        >
          +
        </button>
      </div>

      {error && <div className="mt-2 text-xs text-red-500">發生錯誤：{error}</div>}

      {loading ? (
        <div className="mt-2 text-sm text-stone-400">載入中...</div>
      ) : latest ? (
        <div className="mt-2 text-sm text-stone-500">
          最近一次：{latest.note ?? "活動"} ·{" "}
          {formatDisplayDate(toDateKey(new Date(latest.occurred_at)))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-stone-400">
          還沒有紀錄，點右上角「+」新增第一筆活動紀錄
        </div>
      )}
    </div>
  );
}
