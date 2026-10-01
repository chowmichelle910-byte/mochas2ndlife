"use client";

import { useEffect, useState } from "react";
import { getCatBirthdate, setCatBirthdate } from "@/lib/catProfile";
import { toDateKey } from "@/lib/date";

export default function CatProfileSettings() {
  const [birthdate, setBirthdate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCatBirthdate()
      .then((value) => setBirthdate(value ?? ""))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!birthdate) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await setCatBirthdate(birthdate);
      setSaved(true);
    } catch (err) {
      console.error("save cat birthdate failed", err);
      setError("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-sm text-stone-600">
        生日用來估算「AI 分析」裡每日所需卡路里（跟體重一起推算），沒有設定的話分析會略過這部分。
      </p>
      {loading ? (
        <div className="text-sm text-stone-400">載入中...</div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={birthdate}
            max={toDateKey(new Date())}
            onChange={(e) => {
              setBirthdate(e.target.value);
              setSaved(false);
            }}
            className="flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-base focus:border-orange-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !birthdate}
            className="rounded-lg bg-orange-400 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
          >
            {saving ? "儲存中..." : "儲存"}
          </button>
        </div>
      )}
      {saved && <p className="text-xs text-emerald-600">已儲存</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
