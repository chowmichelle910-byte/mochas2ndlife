"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dateKeyToRange, toDateKey } from "@/lib/date";
import { Entry, EntryInput, EntryType } from "@/lib/types";
import PetProfile from "@/components/PetProfile";
import DateNav from "@/components/DateNav";
import TodayGrid from "@/components/TodayGrid";
import AddEntrySheet from "@/components/AddEntrySheet";
import SubtractFoodSheet from "@/components/SubtractFoodSheet";
import WaterMeasureSheet from "@/components/WaterMeasureSheet";
import EntryList from "@/components/EntryList";
import FleaReminderCard from "@/components/FleaReminderCard";
import WeightCard from "@/components/WeightCard";
import LatestEntryCard from "@/components/LatestEntryCard";
import SideMenu from "@/components/SideMenu";
import { useVisibilityRefresh } from "@/lib/useVisibilityRefresh";

export default function Dashboard() {
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<EntryType | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [subtractingFood, setSubtractingFood] = useState(false);
  const [measuringWater, setMeasuringWater] = useState(false);
  const [fleaRefreshKey, setFleaRefreshKey] = useState(0);
  const [weightRefreshKey, setWeightRefreshKey] = useState(0);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [snackRefreshKey, setSnackRefreshKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const visibilityKey = useVisibilityRefresh();

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
  }, [dateKey, loadEntries, visibilityKey]);

  function bumpRefreshKeys(type: EntryType) {
    if (type === "flea") {
      setFleaRefreshKey((k) => k + 1);
    }
    if (type === "weight") {
      setWeightRefreshKey((k) => k + 1);
    }
    if (type === "activity") {
      setActivityRefreshKey((k) => k + 1);
    }
    if (type === "snack") {
      setSnackRefreshKey((k) => k + 1);
    }
  }

  async function handleAdd(input: EntryInput) {
    const { error: insertError } = await supabase.from("entries").insert(input);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await loadEntries(dateKey);
    bumpRefreshKeys(input.type);
  }

  async function handleUpdate(id: string, input: EntryInput) {
    const { error: updateError } = await supabase.from("entries").update(input).eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadEntries(dateKey);
    bumpRefreshKeys(input.type);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase.from("entries").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const todaysFeedings = entries.filter((e) => e.type === "food" && (e.amount ?? 0) > 0);

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

      <TodayGrid
        entries={entries}
        onAdd={setAddingType}
        onSubtractFood={() => setSubtractingFood(true)}
        onMeasureWater={() => setMeasuringWater(true)}
      />

      <div>
        <h2 className="mb-2 px-1 text-sm font-medium text-stone-500">紀錄列表</h2>
        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-stone-400 shadow-sm">
            載入中...
          </div>
        ) : (
          <EntryList entries={entries} onDelete={handleDelete} onEdit={setEditingEntry} />
        )}
      </div>

      <WeightCard
        refreshKey={weightRefreshKey + visibilityKey}
        onLogClick={() => setAddingType("weight")}
      />

      <FleaReminderCard
        refreshKey={fleaRefreshKey + visibilityKey}
        onLogClick={() => setAddingType("flea")}
      />

      <LatestEntryCard
        type="activity"
        emoji="✂️"
        label="活動"
        refreshKey={activityRefreshKey}
        onLogClick={() => setAddingType("activity")}
        addLabel="新增活動紀錄"
        emptyLabel="還沒有紀錄，點右上角「+」新增第一筆活動紀錄"
      />

      <LatestEntryCard
        type="snack"
        emoji="🍪"
        label="零食"
        refreshKey={snackRefreshKey}
        onLogClick={() => setAddingType("snack")}
        addLabel="新增零食紀錄"
        emptyLabel="還沒有紀錄，點右上角「+」新增第一筆零食紀錄"
      />

      {(addingType || editingEntry) && (
        <AddEntrySheet
          type={editingEntry ? editingEntry.type : addingType!}
          initialEntry={editingEntry ?? undefined}
          onClose={() => {
            setAddingType(null);
            setEditingEntry(null);
          }}
          onSubmit={handleAdd}
          onUpdate={handleUpdate}
        />
      )}

      {subtractingFood && (
        <SubtractFoodSheet
          entries={todaysFeedings}
          onClose={() => setSubtractingFood(false)}
          onSaved={() => loadEntries(dateKey)}
        />
      )}

      {measuringWater && (
        <WaterMeasureSheet
          onClose={() => setMeasuringWater(false)}
          onSaved={() => loadEntries(dateKey)}
        />
      )}
    </main>
  );
}
