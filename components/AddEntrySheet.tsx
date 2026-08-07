"use client";

import { useState } from "react";
import { ENTRY_META, EntryInput, EntryType } from "@/lib/types";
import { addFoodBrand, getCustomFoodBrands } from "@/lib/foodBrands";
import { addActivityType, getCustomActivityTypes } from "@/lib/activityTypes";
import { addSnackType, getCustomSnackTypes } from "@/lib/snackTypes";
import QuickSelectChips from "@/components/QuickSelectChips";

function nowLocalInputValue(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const PERIODS: { key: string; label: string; hour: number }[] = [
  { key: "morning", label: "上午", hour: 9 },
  { key: "noon", label: "中午", hour: 12 },
  { key: "afternoon", label: "下午", hour: 15 },
  { key: "evening", label: "晚上", hour: 20 },
];

function defaultPeriodKey(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 14) return "noon";
  if (h >= 14 && h < 18) return "afternoon";
  return "evening";
}

const DEFAULT_FOOD_BRANDS = ["皇家乾糧", "皇家罐罐"];
const DEFAULT_ACTIVITY_TYPES = ["剪指甲", "剃腳毛"];
const DEFAULT_SNACK_TYPES = ["肉泥", "化毛肉泥", "潔牙餅", "凍乾"];

export default function AddEntrySheet({
  type,
  onClose,
  onSubmit,
}: {
  type: EntryType;
  onClose: () => void;
  onSubmit: (input: EntryInput) => Promise<void>;
}) {
  const meta = ENTRY_META[type];
  const usesPeriodPicker = type === "pee" || type === "poop";
  const usesBrandChips = type === "food";
  const usesActivityChips = type === "activity";
  const usesSnackChips = type === "snack";
  const needsAmount =
    !usesPeriodPicker && type !== "flea" && type !== "activity" && type !== "snack";
  const isDecimal = type === "weight";

  const [amount, setAmount] = useState("");
  const [count, setCount] = useState(1);
  const [period, setPeriod] = useState(defaultPeriodKey());
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowLocalInputValue());
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let occurred_at: string;
      let amountValue: number | null;

      if (usesPeriodPicker) {
        const chosen = PERIODS.find((p) => p.key === period) ?? PERIODS[0];
        const now = new Date();
        const occurredDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          chosen.hour,
          0,
          0
        );
        occurred_at = occurredDate.toISOString();
        amountValue = count;
      } else {
        occurred_at = new Date(occurredAt).toISOString();
        amountValue = needsAmount && amount !== "" ? Number(amount) : null;
      }

      await onSubmit({
        type,
        amount: amountValue,
        note: note.trim() || null,
        occurred_at,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-4 rounded-t-3xl bg-white p-5 pb-6 sm:max-w-sm sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800">
            {meta.emoji} 新增{meta.label}紀錄
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="rounded-full p-1 text-stone-400 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        {usesBrandChips && (
          <QuickSelectChips
            label="種類"
            defaults={DEFAULT_FOOD_BRANDS}
            selected={note}
            onSelect={setNote}
            fetchCustom={getCustomFoodBrands}
            addCustom={addFoodBrand}
            addLabel="新增食物種類"
            addPlaceholder="輸入新的種類名稱"
          />
        )}

        {usesActivityChips && (
          <QuickSelectChips
            label="活動類型"
            defaults={DEFAULT_ACTIVITY_TYPES}
            selected={note}
            onSelect={setNote}
            fetchCustom={getCustomActivityTypes}
            addCustom={addActivityType}
            addLabel="新增活動類型"
            addPlaceholder="輸入新的活動類型"
          />
        )}

        {usesSnackChips && (
          <QuickSelectChips
            label="零食種類"
            defaults={DEFAULT_SNACK_TYPES}
            selected={note}
            onSelect={setNote}
            fetchCustom={getCustomSnackTypes}
            addCustom={addSnackType}
            addLabel="新增零食種類"
            addPlaceholder="輸入新的零食種類"
          />
        )}

        {needsAmount && (
          <label className="flex flex-col text-sm text-stone-600">
            數量（{meta.unit}）
            <input
              type="number"
              min={0}
              step={isDecimal ? "0.1" : "1"}
              inputMode={isDecimal ? "decimal" : "numeric"}
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 rounded-xl border border-stone-200 px-3 py-2 text-base focus:border-orange-400 focus:outline-none"
              placeholder="0"
            />
          </label>
        )}

        {usesPeriodPicker && (
          <>
            <div className="flex flex-col text-sm text-stone-600">
              時段
              <div className="mt-1 grid grid-cols-4 gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPeriod(p.key)}
                    className={`rounded-xl py-2 text-sm transition ${
                      period === p.key
                        ? "bg-orange-100 text-orange-700 ring-2 ring-orange-400"
                        : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col text-sm text-stone-600">
              次數
              <div className="mt-1 flex items-center gap-4">
                <span className="w-8 text-center text-2xl font-semibold text-stone-800">
                  {count}
                </span>
                <div className="flex flex-col overflow-hidden rounded-lg border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setCount((c) => Math.min(20, c + 1))}
                    aria-label="增加次數"
                    className="px-3 py-1 text-stone-500 hover:bg-stone-50"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => setCount((c) => Math.max(1, c - 1))}
                    aria-label="減少次數"
                    className="border-t border-stone-200 px-3 py-1 text-stone-500 hover:bg-stone-50"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {!usesPeriodPicker && (
          <label className="flex flex-col text-sm text-stone-600">
            時間
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="mt-1 rounded-xl border border-stone-200 px-3 py-2 text-base focus:border-orange-400 focus:outline-none"
            />
          </label>
        )}

        <label className="flex flex-col text-sm text-stone-600">
          備註（選填）
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 rounded-xl border border-stone-200 px-3 py-2 text-base focus:border-orange-400 focus:outline-none"
            placeholder={
              type === "poop" ? "軟便 / 正常 / 稀便..." : type === "flea" ? "藥品名稱..." : ""
            }
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-orange-400 py-2.5 font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
        >
          {submitting ? "儲存中..." : "儲存"}
        </button>
      </form>
    </div>
  );
}
