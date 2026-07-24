"use client";

import { useEffect, useRef, useState } from "react";
import { getAvatarUrl, uploadAvatar } from "@/lib/avatar";

const PET_NAME = "Mocha";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function PetProfile() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAvatarUrl().then(setAvatarUrl).catch(() => {});
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
        <div>
          <div className="text-lg font-semibold text-stone-800">{PET_NAME}</div>
          <div className="text-xs text-stone-400">今天也要健康長大喔！</div>
        </div>
      </div>
      {error && <div className="px-1 text-xs text-red-500">{error}</div>}
    </div>
  );
}
