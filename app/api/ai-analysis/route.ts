import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { addDays, dateKeyToRange, toDateKey } from "@/lib/date";
import { fetchReportSeries, ReportSeries } from "@/lib/reports";

export const maxDuration = 30;

interface WeightPoint {
  amount: number;
  occurred_at: string;
}

interface WeightTrend {
  baseline: WeightPoint | null;
  latest: WeightPoint | null;
}

async function fetchWeightTrend(rangeDays: number, endDateKey: string): Promise<WeightTrend> {
  const startCurrent = addDays(endDateKey, -(rangeDays - 1));
  const { start: startOfCurrent } = dateKeyToRange(startCurrent);
  const { end } = dateKeyToRange(endDateKey);

  const [{ data: latestRows, error: latestError }, { data: baselineRows, error: baselineError }] =
    await Promise.all([
      supabase
        .from("entries")
        .select("amount, occurred_at")
        .eq("type", "weight")
        .lte("occurred_at", end)
        .order("occurred_at", { ascending: false })
        .limit(1),
      supabase
        .from("entries")
        .select("amount, occurred_at")
        .eq("type", "weight")
        .lt("occurred_at", startOfCurrent)
        .order("occurred_at", { ascending: false })
        .limit(1),
    ]);

  if (latestError) throw latestError;
  if (baselineError) throw baselineError;

  return {
    latest: (latestRows?.[0] as WeightPoint) ?? null,
    baseline: (baselineRows?.[0] as WeightPoint) ?? null,
  };
}

function formatChange(changePercent: number | null): string {
  if (changePercent === null) return "（沒有上一期資料可比較）";
  const sign = changePercent > 0 ? "+" : "";
  return `（比上一期 ${sign}${changePercent.toFixed(0)}%）`;
}

function buildPrompt(params: {
  rangeDays: number;
  endDateKey: string;
  food: ReportSeries;
  water: ReportSeries;
  poop: ReportSeries;
  pee: ReportSeries;
  weightTrend: WeightTrend;
}): string {
  const { rangeDays, endDateKey, food, water, poop, pee, weightTrend } = params;

  const weightLines: string[] = [];
  if (weightTrend.baseline) {
    weightLines.push(
      `期初體重（${toDateKey(new Date(weightTrend.baseline.occurred_at))}）：${weightTrend.baseline.amount} kg`
    );
  }
  if (weightTrend.latest) {
    weightLines.push(
      `期末體重（${toDateKey(new Date(weightTrend.latest.occurred_at))}）：${weightTrend.latest.amount} kg`
    );
  }
  if (weightTrend.baseline && weightTrend.latest) {
    const delta = weightTrend.latest.amount - weightTrend.baseline.amount;
    weightLines.push(`體重變化：${delta > 0 ? "+" : ""}${delta.toFixed(2)} kg`);
  }
  const weightSection =
    weightLines.length > 0 ? weightLines.join("\n") : "- 體重：這段期間沒有量體重紀錄";

  return `你是一位親切的貓咪照護助理。以下是我家貓咪 Mocha 最近 ${rangeDays} 天（到 ${endDateKey} 為止）的健康紀錄數據，請用繁體中文寫一段簡短分析（約 150-250 字），說明食物、飲水、體重、如廁狀況彼此之間可能有什麼關聯（例如食量增加是否對應體重上升），並指出有沒有需要留意的地方。

規則：
- 只根據下面提供的數據做推論，不要編造沒有的數字
- 如果資料量太少無法下結論，誠實說明資料不足，不要硬掰
- 這不是醫療診斷，只是觀察與提醒，若有異常建議諮詢獸醫
- 語氣自然、像在跟貓咪的家人聊天，不要用條列式，直接寫成一段話

數據：
- 食物：本期平均 ${food.currentAvg.toFixed(1)} g/天 ${formatChange(food.changePercent)}
- 飲水：本期平均 ${water.currentAvg.toFixed(1)} ml/天 ${formatChange(water.changePercent)}
- 便便次數：本期平均 ${poop.currentAvg.toFixed(1)} 次/天 ${formatChange(poop.changePercent)}
- 尿尿次數：本期平均 ${pee.currentAvg.toFixed(1)} 次/天 ${formatChange(pee.changePercent)}
${weightSection}
`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "尚未設定 GEMINI_API_KEY 環境變數" }, { status: 500 });
  }

  let body: { rangeDays?: number; endDateKey?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const endDateKey = body.endDateKey ?? toDateKey(new Date());
  const rangeDays = body.rangeDays && body.rangeDays > 0 ? body.rangeDays : 7;

  try {
    const [food, water, poop, pee, weightTrend] = await Promise.all([
      fetchReportSeries("food", rangeDays, endDateKey),
      fetchReportSeries("water", rangeDays, endDateKey),
      fetchReportSeries("poop", rangeDays, endDateKey),
      fetchReportSeries("pee", rangeDays, endDateKey),
      fetchWeightTrend(rangeDays, endDateKey),
    ]);

    const hasAnyData =
      food.values.some((v) => v > 0) ||
      water.values.some((v) => v > 0) ||
      poop.values.some((v) => v > 0) ||
      pee.values.some((v) => v > 0) ||
      weightTrend.latest !== null;

    if (!hasAnyData) {
      return NextResponse.json({
        analysis: "這段期間還沒有足夠的紀錄可以分析，多記錄幾天之後再試試看吧！",
      });
    }

    const prompt = buildPrompt({ rangeDays, endDateKey, food, water, poop, pee, weightTrend });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json({ error: `AI 服務錯誤：${errText}` }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const analysis: string | undefined = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
      return NextResponse.json({ error: "AI 沒有回傳分析內容，請稍後再試" }, { status: 502 });
    }

    return NextResponse.json({ analysis: analysis.trim() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
