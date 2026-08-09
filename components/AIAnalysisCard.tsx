"use client";

import { useState } from "react";

export default function AIAnalysisCard({
  rangeDays,
  endDateKey,
}: {
  rangeDays: number;
  endDateKey: string;
}) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
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
    } catch {
      setError("分析失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

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
          className="rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-600 transition hover:bg-orange-200 disabled:opacity-50"
        >
          {loading ? "分析中..." : analysis ? "重新分析" : "開始分析"}
        </button>
      </div>

      {error && <div className="mt-3 text-sm text-red-500">發生錯誤：{error}</div>}

      {analysis && !error && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">
          {analysis}
        </p>
      )}

      {!analysis && !error && !loading && (
        <p className="mt-3 text-sm text-stone-400">
          按「開始分析」，AI 會根據這段期間的食物、飲水、體重、如廁紀錄，幫你看看有沒有值得注意的趨勢。
        </p>
      )}
    </div>
  );
}
