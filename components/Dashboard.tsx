"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dateKeyToRange, toDateKey } from "@/lib/date";
import { Entry, EntryInput, EntryType } from "@/lib/types";
import PetProfile from "@/components/PetProfile";
import DateNav from "@/components/DateNav";
import TodayGrid from "@/components/TodayGrid";
import AddEntrySheet from "@/components/AddEntrySheet";
import EntryList from "@/components/EntryList";
import FleaReminderCard from "@/components/FleaReminderCard";
import WeightCard from "@/components/WeightCard";
import SideMenu from "@/components/SideMenu";

export default function Dashboard() {
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<EntryType | null>(null);
  const [fleaRefreshKey, setFleaRefreshKey] = useState(0);
  const [weightRefreshKey, setWeightRefreshKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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
    if (input.type === "flea") {
      setFleaRefreshKey((k) => k + 1);
    }
    if (input.type === "weight") {
      setWeightRefreshKey((k) => k + 1);
    }
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
      <div className="relative flex items-center justify-center py-1">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="開啟選單"
          className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-xl text-stone-600 hover:bg-white/60"
        >
          ☰
        </button>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-stone-700">
          🐾 mocha健康紀錄
        </h1>
      </div>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <PetProfile />

      <DateNav dateKey={dateKey} onChange={setDateKey} />

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          發生錯誤：{error}
        </div>
      )}

      <TodayGrid entries={entries} onAdd={setAddingType} />

      <div>
        <h2 className="mb-2 px-1 text-sm font-medium text-stone-500">紀錄列表</h2>
        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-stone-400 shadow-sm">
            載入中...
          </div>
        ) : (
          <EntryList entries={entries} onDelete={handleDelete} />
        )}
      </div>

      <WeightCard refreshKey={weightRefreshKey} onLogClick={() => setAddingType("weight")} />

      <FleaReminderCard refreshKey={fleaRefreshKey} onLogClick={() => setAddingType("flea")} />

      {addingType && (
        <AddEntrySheet
          type={addingType}
          onClose={() => setAddingType(null)}
          onSubmit={handleAdd}
        />
      )}
    </main>
  );
}
