"use client";

import { useState } from "react";
import { ENTRY_META, EntryInput, EntryType } from "@/lib/types";

function nowLocalInputValue(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

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
  const needsAmount = type !== "poop" && type !== "flea";

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowLocalInputValue());
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        amount: needsAmount && amount !== "" ? Number(amount) : null,
        note: note.trim() || null,
        occurred_at: new Date(occurredAt).toISOString(),
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

        {needsAmount && (
          <label className="flex flex-col text-sm text-stone-600">
            數量（{meta.unit}）
            <input
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 rounded-xl border border-stone-200 px-3 py-2 focus:border-orange-400 focus:outline-none"
              placeholder="0"
            />
          </label>
        )}

        <label className="flex flex-col text-sm text-stone-600">
          時間
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="mt-1 rounded-xl border border-stone-200 px-3 py-2 focus:border-orange-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col text-sm text-stone-600">
          備註（選填）
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 rounded-xl border border-stone-200 px-3 py-2 focus:border-orange-400 focus:outline-none"
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
