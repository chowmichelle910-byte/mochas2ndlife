"use client";

import { useEffect, useRef, useState } from "react";
import { getAvatarUrl, uploadAvatar } from "@/lib/avatar";
import { getSetting, setSetting } from "@/lib/settings";
import { toDateKey } from "@/lib/date";

const PET_NAME = "Mocha";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const HOME_DATE_KEY = "home_date";

function daysSince(dateKey: string): number {
  const start = new Date(`${dateKey}T00:00:00`);
  const today = new Date(`${toDateKey(new Date())}T00:00:00`);
  const diff = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export default function PetProfile() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [homeDateKey, setHomeDateKey] = useState<string | null>(null);
  const [editingHomeDate, setEditingHomeDate] = useState(false);
  const [homeDateInput, setHomeDateInput] = useState("");
  const [savingHomeDate, setSavingHomeDate] = useState(false);

  useEffect(() => {
    getAvatarUrl().then(setAvatarUrl).catch(() => {});
    getSetting(HOME_DATE_KEY).then((value) => {
      if (value) setHomeDateKey(value);
    });
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("請選擇圖片檔案");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("圖片檔案不能超過 5MB");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch (err) {
      console.error("avatar upload failed", err);
      setError("上傳失敗，請稍後再試");
    } finally {
      setUploading(false);
    }
  }

  function openHomeDateEditor() {
    setHomeDateInput(homeDateKey ?? toDateKey(new Date()));
    setEditingHomeDate(true);
  }

  async function handleSaveHomeDate() {
    if (!homeDateInput) return;
    setSavingHomeDate(true);
    setError(null);
    try {
      await setSetting(HOME_DATE_KEY, homeDateInput);
      setHomeDateKey(homeDateInput);
      setEditingHomeDate(false);
    } catch (err) {
      console.error("save home date failed", err);
      setError("儲存到家日期失敗，請稍後再試");
    } finally {
      setSavingHomeDate(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
        <div className="relative h-16 w-16 shrink-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="上傳 Mocha 的頭像照片"
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-rose-300 bg-rose-50 text-3xl disabled:opacity-60"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={PET_NAME} className="h-full w-full object-cover" />
            ) : (
              "🐱"
            )}
          </button>
          <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-400 text-xs text-white shadow">
            {uploading ? "…" : "📷"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-stone-800">{PET_NAME}</div>
          <div className="text-xs text-stone-400">今天也要健康長大喔！</div>
          <button
            type="button"
            onClick={openHomeDateEditor}
            className="mt-1 text-xs font-medium text-orange-600 hover:underline"
          >
            {homeDateKey ? `🏠 到家第 ${daysSince(homeDateKey)} 天` : "設定到家日期"}
          </button>
        </div>
      </div>

      {editingHomeDate && (
        <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <input
            type="date"
            value={homeDateInput}
            onChange={(e) => setHomeDateInput(e.target.value)}
            className="flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-base focus:border-orange-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSaveHomeDate}
            disabled={savingHomeDate}
            className="rounded-lg bg-orange-400 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
          >
            {savingHomeDate ? "儲存中..." : "儲存"}
          </button>
          <button
            type="button"
            onClick={() => setEditingHomeDate(false)}
            className="rounded-lg px-2 py-1.5 text-sm text-stone-400 hover:bg-stone-50"
          >
            取消
          </button>
        </div>
      )}

      {error && <div className="px-1 text-xs text-red-500">{error}</div>}
    </div>
  );
}
