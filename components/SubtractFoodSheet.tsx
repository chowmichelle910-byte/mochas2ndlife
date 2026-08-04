"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatTime } from "@/lib/date";
import { Entry } from "@/lib/types";

export default function SubtractFoodSheet({
  entries,
  onClose,
  onSaved,
}: {
  entries: Entry[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(entries[0]?.id ?? null);
  const [leftover, setLeftover] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = entries.find((e) => e.id === selectedId) ?? null;
  const leftoverAmount = Number(leftover);
  const canSubmit = selected != null && leftoverAmount > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const newAmount = Math.max(0, (selected.amount ?? 0) - leftoverAmount);
      const { error: updateError } = await supabase
        .from("entries")
        .update({ amount: newAmount })
        .eq("id", selected.id);
      if (updateError) throw updateError;
      onSaved();
      onClose();
    } catch (err) {
      console.error("subtract food failed", err);
      setError("扣除失敗，請稍後再試");
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
          <h2 className="text-lg font-semibold text-stone-800">🍚 扣除食物剩量</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="rounded-full p-1 text-stone-400 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-stone-500">這天還沒有餵食紀錄，請先新增一筆食物紀錄。</p>
        ) : (
          <>
            <div className="flex flex-col gap-2 text-sm text-stone-600">
              扣哪一筆
              <div className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedId(entry.id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selectedId === entry.id
                        ? "border-orange-400 bg-orange-50"
                        : "border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-stone-700">
                      {formatTime(entry.occurred_at)}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </span>
                    <span className="font-medium text-stone-800">{entry.amount} g</span>
                  </button>
                ))}
              </div>
            </div>

            {selected && (
              <label className="flex flex-col text-sm text-stone-600">
                剩下多少（g，最多 {selected.amount} g）
                <input
                  type="number"
                  min={0}
                  max={selected.amount ?? undefined}
                  step="1"
                  inputMode="numeric"
                  autoFocus
                  value={leftover}
                  onChange={(e) => setLeftover(e.target.value)}
                  className="mt-1 rounded-xl border border-stone-200 px-3 py-2 text-base focus:border-orange-400 focus:outline-none"
                  placeholder="0"
                />
              </label>
            )}
          </>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="rounded-xl bg-stone-500 py-2.5 font-medium text-white transition hover:bg-stone-600 disabled:opacity-50"
        >
          {submitting ? "處理中..." : "扣除"}
        </button>
      </form>
    </div>
  );
}
