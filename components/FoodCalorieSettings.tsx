"use client";

import { useEffect, useState } from "react";
import { CalorieMode, FoodType, listFoodTypes, upsertFoodType } from "@/lib/foodBrands";

const EMPTY_NEW = { name: "", calorie_mode: "per100g" as CalorieMode, kcal_per_100g: "", kcal_per_can: "", grams_per_can: "" };

function Row({ item, onSaved }: { item: FoodType; onSaved: (updated: FoodType) => void }) {
  const [mode, setMode] = useState<CalorieMode>(item.calorie_mode ?? "per100g");
  const [kcalPer100g, setKcalPer100g] = useState(item.kcal_per_100g?.toString() ?? "");
  const [kcalPerCan, setKcalPerCan] = useState(item.kcal_per_can?.toString() ?? "");
  const [gramsPerCan, setGramsPerCan] = useState(item.grams_per_can?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated: FoodType = {
        id: item.id,
        name: item.name,
        calorie_mode: mode,
        kcal_per_100g: mode === "per100g" && kcalPer100g !== "" ? Number(kcalPer100g) : null,
        kcal_per_can: mode === "percan" && kcalPerCan !== "" ? Number(kcalPerCan) : null,
        grams_per_can: mode === "percan" && gramsPerCan !== "" ? Number(gramsPerCan) : null,
      };
      await upsertFoodType(updated);
      onSaved(updated);
    } catch (err) {
      console.error("save food type calories failed", err);
      setError("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-stone-100 p-3">
      <div className="font-medium text-stone-700">{item.name}</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("per100g")}
          className={`flex-1 rounded-lg py-1.5 text-sm transition ${
            mode === "per100g" ? "bg-orange-100 text-orange-700 ring-2 ring-orange-400" : "bg-stone-50 text-stone-600"
          }`}
        >
          每100g
        </button>
        <button
          type="button"
          onClick={() => setMode("percan")}
          className={`flex-1 rounded-lg py-1.5 text-sm transition ${
            mode === "percan" ? "bg-orange-100 text-orange-700 ring-2 ring-orange-400" : "bg-stone-50 text-stone-600"
          }`}
        >
          每罐（可選一罐/半罐/三分之一罐）
        </button>
      </div>

      {mode === "per100g" ? (
        <label className="flex flex-col text-sm text-stone-600">
          每100g 幾多卡路里（kcal）
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={kcalPer100g}
            onChange={(e) => setKcalPer100g(e.target.value)}
            className="mt-1 rounded-lg border border-stone-200 px-3 py-1.5 text-base focus:border-orange-400 focus:outline-none"
            placeholder="0"
          />
        </label>
      ) : (
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col text-sm text-stone-600">
            每罐幾多卡路里
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={kcalPerCan}
              onChange={(e) => setKcalPerCan(e.target.value)}
              className="mt-1 rounded-lg border border-stone-200 px-3 py-1.5 text-base focus:border-orange-400 focus:outline-none"
              placeholder="0"
            />
          </label>
          <label className="flex flex-1 flex-col text-sm text-stone-600">
            每罐幾多g
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={gramsPerCan}
              onChange={(e) => setGramsPerCan(e.target.value)}
              className="mt-1 rounded-lg border border-stone-200 px-3 py-1.5 text-base focus:border-orange-400 focus:outline-none"
              placeholder="0"
            />
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-lg bg-orange-400 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
      >
        {saving ? "儲存中..." : "儲存"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function FoodCalorieSettings() {
  const [items, setItems] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_NEW);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);

  useEffect(() => {
    listFoodTypes()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  function handleRowSaved(updated: FoodType) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }

  async function handleAdd() {
    const name = newItem.name.trim();
    if (!name) return;
    setAddSaving(true);
    setAddError(null);
    try {
      await upsertFoodType({
        name,
        calorie_mode: newItem.calorie_mode,
        kcal_per_100g: newItem.calorie_mode === "per100g" && newItem.kcal_per_100g !== "" ? Number(newItem.kcal_per_100g) : null,
        kcal_per_can: newItem.calorie_mode === "percan" && newItem.kcal_per_can !== "" ? Number(newItem.kcal_per_can) : null,
        grams_per_can: newItem.calorie_mode === "percan" && newItem.grams_per_can !== "" ? Number(newItem.grams_per_can) : null,
      });
      const refreshed = await listFoodTypes();
      setItems(refreshed);
      setNewItem(EMPTY_NEW);
      setAdding(false);
    } catch (err) {
      console.error("add food type failed", err);
      setAddError("新增失敗，請稍後再試");
    } finally {
      setAddSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-sm text-stone-500">
        設定每款食物的卡路里，新增食物紀錄時才可以換算成卡路里，也才能在「AI 分析」裡比較每日攝取量跟所需量。
      </p>

      {loading ? (
        <div className="rounded-3xl bg-white p-4 text-sm text-stone-400 shadow-sm">載入中...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Row key={item.id} item={item} onSaved={handleRowSaved} />
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-orange-300 p-3">
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
            placeholder="食物種類名稱"
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-base focus:border-orange-400 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNewItem((v) => ({ ...v, calorie_mode: "per100g" }))}
              className={`flex-1 rounded-lg py-1.5 text-sm transition ${
                newItem.calorie_mode === "per100g" ? "bg-orange-100 text-orange-700 ring-2 ring-orange-400" : "bg-stone-50 text-stone-600"
              }`}
            >
              每100g
            </button>
            <button
              type="button"
              onClick={() => setNewItem((v) => ({ ...v, calorie_mode: "percan" }))}
              className={`flex-1 rounded-lg py-1.5 text-sm transition ${
                newItem.calorie_mode === "percan" ? "bg-orange-100 text-orange-700 ring-2 ring-orange-400" : "bg-stone-50 text-stone-600"
              }`}
            >
              每罐
            </button>
          </div>
          {newItem.calorie_mode === "per100g" ? (
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={newItem.kcal_per_100g}
              onChange={(e) => setNewItem((v) => ({ ...v, kcal_per_100g: e.target.value }))}
              placeholder="每100g 幾多卡路里"
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-base focus:border-orange-400 focus:outline-none"
            />
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={newItem.kcal_per_can}
                onChange={(e) => setNewItem((v) => ({ ...v, kcal_per_can: e.target.value }))}
                placeholder="每罐幾多卡路里"
                className="flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-base focus:border-orange-400 focus:outline-none"
              />
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={newItem.grams_per_can}
                onChange={(e) => setNewItem((v) => ({ ...v, grams_per_can: e.target.value }))}
                placeholder="每罐幾多g"
                className="flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-base focus:border-orange-400 focus:outline-none"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={addSaving || !newItem.name.trim()}
              className="rounded-lg bg-orange-400 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              {addSaving ? "新增中..." : "新增"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewItem(EMPTY_NEW);
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-stone-400 hover:bg-stone-50"
            >
              取消
            </button>
          </div>
          {addError && <p className="text-xs text-red-500">{addError}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="self-start rounded-full border border-dashed border-orange-300 px-4 py-1.5 text-sm text-orange-500 hover:bg-orange-50"
        >
          + 新增食物種類
        </button>
      )}
    </div>
  );
}
