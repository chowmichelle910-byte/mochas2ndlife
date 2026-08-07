"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDisplayDate, toDateKey } from "@/lib/date";
import { Entry, EntryType } from "@/lib/types";
import { useVisibilityRefresh } from "@/lib/useVisibilityRefresh";

export default function LatestEntryCard({
  type,
  emoji,
  label,
  refreshKey,
  onLogClick,
  addLabel,
  emptyLabel,
}: {
  type: EntryType;
  emoji: string;
  label: string;
  refreshKey: number;
  onLogClick: () => void;
  addLabel: string;
  emptyLabel: string;
}) {
  const [latest, setLatest] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const visibilityKey = useVisibilityRefresh();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("entries")
      .select("*")
      .eq("type", type)
      .order("occurred_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setLatest((data?.[0] as Entry) ?? null);
    }
    setLoading(false);
  }, [type]);

  useEffect(() => {
    load();
  }, [load, refreshKey, visibilityKey]);

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700">
          <span className="text-xl">{emoji}</span>
          <span className="font-medium">{label}</span>
        </div>
        <button
          type="button"
          onClick={onLogClick}
          aria-label={addLabel}
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
          最近一次：{latest.note ?? label} ·{" "}
          {formatDisplayDate(toDateKey(new Date(latest.occurred_at)))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-stone-400">{emptyLabel}</div>
      )}
    </div>
  );
}
