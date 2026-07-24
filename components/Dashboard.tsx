"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dateKeyToRange, toDateKey } from "@/lib/date";
import { Entry, EntryInput } from "@/lib/types";
import DateNav from "@/components/DateNav";
import SummaryCards from "@/components/SummaryCards";
import EntryForm from "@/components/EntryForm";
import EntryList from "@/components/EntryList";

export default function Dashboard() {
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    const { start, end } = dateKeyToRange(key);
    const { data, error: fetchError } = await supabase
      .from("entries")
      .select("*")
      .gte("occurred_at", start)
      .lte("occurred_at", end)
      .order("occurred_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setEntries([]);
    } else {
      setEntries(data as Entry[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries(dateKey);
  }, [dateKey, loadEntries]);

  async function handleAdd(input: EntryInput) {
    const { error: insertError } = await supabase.from("entries").insert(input);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await loadEntries(dateKey);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase.from("entries").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <main className="flex flex-col gap-4">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-amber-800">🐾 貓咪健康紀錄</h1>
        <p className="text-sm text-stone-500">紀錄吃飯、喝水、尿尿與便便狀況</p>
      </header>

      <DateNav dateKey={dateKey} onChange={setDateKey} />

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          發生錯誤：{error}
        </div>
      )}

      <SummaryCards entries={entries} />

      <EntryForm onSubmit={handleAdd} />

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-stone-400 shadow-sm">
          載入中...
        </div>
      ) : (
        <EntryList entries={entries} onDelete={handleDelete} />
      )}
    </main>
  );
}
