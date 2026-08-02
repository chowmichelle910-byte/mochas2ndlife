"use client";

import { useEffect, useState } from "react";
import {
  PushStatus,
  getPushSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

export default function PushReminderToggle() {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPushSubscriptionStatus().then(setStatus);
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      await subscribeToPush();
      setStatus("subscribed");
    } catch (err) {
      console.error("push subscribe failed", err);
      setError("開啟推播失敗，請確認瀏覽器通知權限");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      setStatus("unsubscribed");
    } catch (err) {
      console.error("push unsubscribe failed", err);
      setError("關閉推播失敗，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return <p className="text-xs text-stone-400">這個瀏覽器不支援推播通知。</p>;
  }

  if (status === "denied") {
    return (
      <p className="text-xs text-stone-400">
        瀏覽器通知權限已被封鎖，請到瀏覽器設定手動開啟後再試一次。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-stone-500">
          {status === "subscribed" ? "已開啟到期推播提醒" : "開啟後，到期會推播通知你"}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={status === "subscribed" ? handleDisable : handleEnable}
          className="shrink-0 rounded-full border border-orange-300 px-3 py-1 text-xs font-medium text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
        >
          {busy ? "處理中..." : status === "subscribed" ? "關閉推播" : "啟用推播"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
