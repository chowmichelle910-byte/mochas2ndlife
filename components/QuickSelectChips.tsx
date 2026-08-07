"use client";

import { useEffect, useState } from "react";

export default function QuickSelectChips({
  label,
  defaults,
  selected,
  onSelect,
  fetchCustom,
  addCustom,
  addLabel,
  addPlaceholder,
}: {
  label: string;
  defaults: string[];
  selected: string;
  onSelect: (value: string) => void;
  fetchCustom: () => Promise<string[]>;
  addCustom: (name: string) => Promise<void>;
  addLabel: string;
  addPlaceholder: string;
}) {
  const [options, setOptions] = useState<string[]>(defaults);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustom().then((custom) => {
      setOptions([...defaults, ...custom.filter((c) => !defaults.includes(c))]);
    });
    // only fetch once on mount — this component is remounted fresh each time the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    try {
      await addCustom(name);
      setOptions((prev) => (prev.includes(name) ? prev : [...prev, name]));
      onSelect(name);
      setNewName("");
      setAdding(false);
    } catch (err) {
      console.error("add quick-select option failed", err);
      setError("新增失敗，請稍後再試");
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm text-stone-600">
      {label}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              selected === option
                ? "border-orange-400 bg-orange-100 text-orange-700"
                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            {option}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          aria-label={addLabel}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-orange-300 text-orange-500 hover:bg-orange-50"
        >
          +
        </button>
      </div>
      {adding && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={addPlaceholder}
            className="flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-base focus:border-orange-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg bg-orange-400 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-500"
          >
            新增
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
