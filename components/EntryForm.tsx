"use client";

import { useState } from "react";
import { ENTRY_META, EntryInput, EntryType } from "@/lib/types";

const TYPES: EntryType[] = ["food", "water", "pee", "poop"];

function nowLocalInputValue(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function EntryForm({
  onSubmit,
}: {
  onSubmit: (input: EntryInput) => Promise<void>;
}) {
  const [type, setType] = useState<EntryType>("food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowLocalInputValue());
  const [submitting, setSubmitting] = useState(false);

  const needsAmount = type !== "poop";

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
      setAmount("");
      setNote("");
      setOccurredAt(nowLocalInputValue());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <div className="grid grid-cols-4 gap-2">
        {TYPES.map((t) => {
          const meta = ENTRY_META[t];
          const active = t === type;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-sm transition ${
                active
                  ? "bg-amber-100 ring-2 ring-amber-400"
                  : "bg-stone-50 hover:bg-stone-100"
              }`}
            >
              <span className="text-xl">{meta.emoji}</span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {needsAmount && (
          <label className="flex flex-col text-sm text-stone-600">
            數量（{ENTRY_META[type].unit}）
            <input
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-28 rounded-lg border border-stone-200 px-2 py-1.5 focus:border-amber-400 focus:outline-none"
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
            className="mt-1 rounded-lg border border-stone-200 px-2 py-1.5 focus:border-amber-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-1 flex-col text-sm text-stone-600">
          備註（選填）
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 rounded-lg border border-stone-200 px-2 py-1.5 focus:border-amber-400 focus:outline-none"
            placeholder={type === "poop" ? "軟便 / 正常 / 稀便..." : ""}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-amber-500 py-2 font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
      >
        {submitting ? "新增中..." : `新增一筆${ENTRY_META[type].label}紀錄`}
      </button>
    </form>
  );
}
