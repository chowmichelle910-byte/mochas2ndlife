"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  WaterPendingStart,
  clearPendingWaterStart,
  getPendingWaterStart,
  setPendingWaterStart,
} from "@/lib/waterTracking";

export default function WaterMeasureSheet({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState<WaterPendingStart | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPendingWaterStart()
      .then(setPending)
      .finally(() => setLoading(false));
  }, []);

  async function handleSetStart(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await setPendingWaterStart(value);
      onSaved();
      onClose();
    } catch (err) {
      console.error("set water start failed", err);
      setError("設定失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    if (!pending || amount === "") return;
    const remaining = Number(amount);
    if (remaining < 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const consumed = Math.max(0, pending.amount - remaining);
      const { error: insertError } = await supabase.from("entries").insert({
        type: "water",
        amount: consumed,
        note: `起始 ${pending.amount}ml，剩餘 ${remaining}ml`,
        occurred_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      await clearPendingWaterStart();
      onSaved();
      onClose();
    } catch (err) {
      console.error("finish water measure failed", err);
      setError("記錄失敗，請稍後再試");
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
        onSubmit={pending ? handleFinish : handleSetStart}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-4 rounded-t-3xl bg-white p-5 pb-6 sm:max-w-sm sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800">
            💧 {pending ? "量剩餘水量" : "設定起始水量"}
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

        {loading ? (
          <p className="text-sm text-stone-400">載入中...</p>
        ) : (
          <>
            {pending && (
              <p className="text-sm text-stone-500">
                起始水量 {pending.amount} ml（
                {new Date(pending.setAt).toLocaleString("zh-TW", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                設定）
              </p>
            )}

            <label className="flex flex-col text-sm text-stone-600">
              {pending ? "剩餘水量（ml）" : "起始水量（ml）"}
              <input
                type="number"
                min={0}
                step="1"
                inputMode="numeric"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 rounded-xl border border-stone-200 px-3 py-2 text-base focus:border-orange-400 focus:outline-none"
                placeholder="0"
              />
            </label>

            {pending && (
              <button
                type="button"
                onClick={() => {
                  setPending(null);
                  setAmount("");
                }}
                className="self-start text-xs text-stone-400 underline underline-offset-2"
              >
                重新設定起始水量
              </button>
            )}
          </>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        {!loading && (
          <button
            type="submit"
            disabled={submitting || amount === ""}
            className="rounded-xl bg-sky-400 py-2.5 font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
          >
            {submitting ? "處理中..." : pending ? "計算並記錄" : "設定"}
          </button>
        )}
      </form>
    </div>
  );
}
