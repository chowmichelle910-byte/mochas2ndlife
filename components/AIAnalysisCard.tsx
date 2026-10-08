"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCachedAnalysis } from "@/lib/aiAnalysisCache";
import { formatDisplayDate } from "@/lib/date";
import { useVisibilityRefresh } from "@/lib/useVisibilityRefresh";

export default function AIAnalysisCard({
  rangeDays,
  endDateKey,
}: {
  rangeDays: number;
  endDateKey: string;
}) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [cachedEndDateKey, setCachedEndDateKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const visibilityKey = useVisibilityRefresh();
  const refreshingRef = useRef(false);

  const loadCached = useCallback(async () => {
    if (refreshingRef.current) return;
    const cached = await getCachedAnalysis();
    if (refreshingRef.current) return;
    if (cached) {
      setAnalysis(cached.analysis);
      setGeneratedAt(cached.generatedAt);
      setCachedEndDateKey(cached.endDateKey);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCached();
  }, [loadCached, visibilityKey]);

  async function handleAnalyze() {
    refreshingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rangeDays, endDateKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "分析失敗，請稍後再試");
        return;
      }
      setAnalysis(data.analysis);
      setGeneratedAt(new Date().toISOString());
      setCachedEndDateKey(endDateKey);
    } catch {
      setError("分析失敗，請稍後再試");
    } finally {
      refreshingRef.current = false;
      setLoading(false);
    }
  }

  const generatedAtLabel = generatedAt
    ? new Date(generatedAt).toLocaleString("zh-TW", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700">
          <span className="text-xl">✨</span>
          <span className="font-medium">AI 分析</span>
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          aria-label="重新整理 AI 分析"
          className="rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-600 transition hover:bg-orange-200 disabled:opacity-50"
        >
          {loading ? "分析中..." : "重新整理"}
        </button>
      </div>

      {generatedAtLabel && cachedEndDateKey && !error && (
        <p className="mt-2 text-xs text-stone-400">
          上次分析時間：{generatedAtLabel}（期間到 {formatDisplayDate(cachedEndDateKey)} 為止）
        </p>
      )}

      {error && <div className="mt-3 text-sm text-red-500">發生錯誤：{error}</div>}

      {analysis && !error && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">
          {analysis}
        </p>
      )}

      {!analysis && !error && !loading && (
        <p className="mt-3 text-sm text-stone-400">
          按「重新整理」，AI 會根據這段期間的食物、飲水、體重、如廁、卡路里紀錄，幫你看看有沒有值得注意的趨勢。分析結果會記住，下次打開不用重新問一次。
        </p>
      )}
    </div>
  );
}
