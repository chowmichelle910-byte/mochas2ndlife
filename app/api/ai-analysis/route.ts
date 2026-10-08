import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { addDays, dateKeyToRange, toDateKey } from "@/lib/date";
import { fetchReportSeries, ReportSeries } from "@/lib/reports";
import { ageInYears, estimateDailyKcalNeed, getCatBirthdate } from "@/lib/catProfile";
import { setCachedAnalysis } from "@/lib/aiAnalysisCache";
import { FoodType, kcalForFoodEntry } from "@/lib/foodBrands";

export const maxDuration = 60;

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

interface FoodCalorieIntake {
  avgKcalPerDay: number | null;
  hasUnknownFoodTypes: boolean;
}

async function fetchFoodCalorieIntake(
  rangeDays: number,
  endDateKey: string
): Promise<FoodCalorieIntake> {
  const startCurrent = addDays(endDateKey, -(rangeDays - 1));
  const { start } = dateKeyToRange(startCurrent);
  const { end } = dateKeyToRange(endDateKey);

  const [{ data: entries, error: entriesError }, { data: foodTypes, error: foodTypesError }] =
    await Promise.all([
      supabase
        .from("entries")
        .select("amount, note, occurred_at")
        .eq("type", "food")
        .gte("occurred_at", start)
        .lte("occurred_at", end),
      supabase
        .from("food_brands")
        .select("name, calorie_mode, kcal_per_100g, kcal_per_can, grams_per_can"),
    ]);

  if (entriesError) throw entriesError;
  if (foodTypesError) throw foodTypesError;

  const byName = new Map((foodTypes ?? []).map((f) => [f.name as string, f as FoodType]));
  const byDay = new Map<string, number>();
  let hasUnknownFoodTypes = false;

  for (const row of entries ?? []) {
    const amount = (row.amount as number | null) ?? 0;
    if (amount <= 0) continue;
    const kcal = kcalForFoodEntry({ note: row.note as string | null, amount }, byName);
    if (kcal === null) {
      hasUnknownFoodTypes = true;
      continue;
    }
    const key = toDateKey(new Date(row.occurred_at as string));
    byDay.set(key, (byDay.get(key) ?? 0) + kcal);
  }

  if (byDay.size === 0) return { avgKcalPerDay: null, hasUnknownFoodTypes };
  const total = [...byDay.values()].reduce((a, b) => a + b, 0);
  return { avgKcalPerDay: total / byDay.size, hasUnknownFoodTypes };
}

interface DailyKcalNeed {
  need: number | null;
  weightKg: number | null;
  ageYears: number | null;
}

async function fetchDailyKcalNeed(endDateKey: string): Promise<DailyKcalNeed> {
  const { end } = dateKeyToRange(endDateKey);
  const [birthdateKey, { data: weightRows, error: weightError }] = await Promise.all([
    getCatBirthdate(),
    supabase
      .from("entries")
      .select("amount")
      .eq("type", "weight")
      .lte("occurred_at", end)
      .order("occurred_at", { ascending: false })
      .limit(1),
  ]);

  if (weightError) throw weightError;
  const weightKg = (weightRows?.[0]?.amount as number | undefined) ?? null;

  if (!birthdateKey || weightKg == null) {
    return { need: null, weightKg, ageYears: null };
  }

  const ageYears = ageInYears(birthdateKey, endDateKey);
  return { need: estimateDailyKcalNeed(weightKg, ageYears), weightKg, ageYears };
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
  calorieIntake: FoodCalorieIntake;
  kcalNeed: DailyKcalNeed;
}): string {
  const { rangeDays, endDateKey, food, water, poop, pee, weightTrend, calorieIntake, kcalNeed } =
    params;

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

  const calorieLines: string[] = [];
  if (calorieIntake.avgKcalPerDay != null) {
    calorieLines.push(
      `本期平均每日攝取卡路里：約 ${Math.round(calorieIntake.avgKcalPerDay)} kcal/天` +
        (calorieIntake.hasUnknownFoodTypes
          ? "（部分食物種類還沒設定卡路里，這個數字可能被低估）"
          : "")
    );
  } else {
    calorieLines.push(
      "本期攝取卡路里：無法計算（食物紀錄的種類都還沒在設定頁設定卡路里，或這段期間沒有食物紀錄）"
    );
  }
  if (kcalNeed.need != null) {
    calorieLines.push(
      `估計每日所需卡路里：約 ${Math.round(kcalNeed.need)} kcal/天（根據體重 ${kcalNeed.weightKg}kg、年齡約 ${kcalNeed.ageYears?.toFixed(1)} 歲估算，是概略值，不是精確醫療數字）`
    );
  } else {
    calorieLines.push("估計每日所需卡路里：無法計算（尚未在設定頁填寫生日，或還沒有體重紀錄）");
  }
  const calorieSection = calorieLines.join("\n");

  return `你是一位親切的貓咪照護助理。以下是我家貓咪 Mocha 最近 ${rangeDays} 天（到 ${endDateKey} 為止）的健康紀錄數據，請用繁體中文寫一段簡短分析（約 150-250 字），說明食物、飲水、體重、如廁狀況、卡路里攝取量跟所需量彼此之間可能有什麼關聯（例如攝取的卡路里是否超過或低於所需量、這是否能解釋體重變化），並指出有沒有需要留意的地方。

規則：
- 只根據下面提供的數據做推論，不要編造沒有的數字
- 如果某項資料缺失或不足以下結論，誠實說明，不要硬掰
- 這不是醫療診斷，只是觀察與提醒，若有異常建議諮詢獸醫
- 語氣自然、像在跟貓咪的家人聊天，不要用條列式，直接寫成一段話

數據：
- 食物：本期平均 ${food.currentAvg.toFixed(1)} g/天 ${formatChange(food.changePercent)}
- 飲水：本期平均 ${water.currentAvg.toFixed(1)} ml/天 ${formatChange(water.changePercent)}
- 便便次數：本期平均 ${poop.currentAvg.toFixed(1)} 次/天 ${formatChange(poop.changePercent)}
- 尿尿次數：本期平均 ${pee.currentAvg.toFixed(1)} 次/天 ${formatChange(pee.changePercent)}
${weightSection}
${calorieSection}
`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

async function callGeminiWithRetry(apiKey: string, prompt: string): Promise<Response> {
  const maxAttempts = 3;
  let lastRes: Response | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (res.ok || !RETRYABLE_STATUS.has(res.status) || attempt === maxAttempts) {
      return res;
    }

    lastRes = res;
    await sleep(1500 * attempt);
  }

  return lastRes!;
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
    const [food, water, poop, pee, weightTrend, calorieIntake, kcalNeed] = await Promise.all([
      fetchReportSeries("food", rangeDays, endDateKey),
      fetchReportSeries("water", rangeDays, endDateKey),
      fetchReportSeries("poop", rangeDays, endDateKey),
      fetchReportSeries("pee", rangeDays, endDateKey),
      fetchWeightTrend(rangeDays, endDateKey),
      fetchFoodCalorieIntake(rangeDays, endDateKey),
      fetchDailyKcalNeed(endDateKey),
    ]);

    const hasAnyData =
      food.values.some((v) => v > 0) ||
      water.values.some((v) => v > 0) ||
      poop.values.some((v) => v > 0) ||
      pee.values.some((v) => v > 0) ||
      weightTrend.latest !== null;

    if (!hasAnyData) {
      const analysis = "這段期間還沒有足夠的紀錄可以分析，多記錄幾天之後再試試看吧！";
      await setCachedAnalysis({
        rangeDays,
        endDateKey,
        analysis,
        generatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ analysis });
    }

    const prompt = buildPrompt({
      rangeDays,
      endDateKey,
      food,
      water,
      poop,
      pee,
      weightTrend,
      calorieIntake,
      kcalNeed,
    });

    const geminiRes = await callGeminiWithRetry(apiKey, prompt);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      const friendlyError = RETRYABLE_STATUS.has(geminiRes.status)
        ? "AI 服務目前請求量較大，已經自動重試了幾次還是失敗，請稍後再按一次「重新整理」"
        : `AI 服務錯誤：${errText}`;
      return NextResponse.json({ error: friendlyError }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const analysisRaw: string | undefined = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisRaw) {
      return NextResponse.json({ error: "AI 沒有回傳分析內容，請稍後再試" }, { status: 502 });
    }

    const analysis = analysisRaw.trim();
    await setCachedAnalysis({
      rangeDays,
      endDateKey,
      analysis,
      generatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ analysis });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
