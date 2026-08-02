import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { addMonths, toDateKey } from "@/lib/date";
import { alreadyNotified, broadcastPush, configureWebPush, markNotified } from "@/lib/reminders";

const REMINDER_MONTHS = 3;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    configureWebPush();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data: latestFlea, error: latestFleaError } = await supabase
    .from("entries")
    .select("occurred_at")
    .eq("type", "flea")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestFleaError) {
    return NextResponse.json({ error: latestFleaError.message }, { status: 500 });
  }
  if (!latestFlea) {
    return NextResponse.json({ skipped: "no flea entries yet" });
  }

  const lastDateKey = toDateKey(new Date(latestFlea.occurred_at));
  const dueDateKey = addMonths(lastDateKey, REMINDER_MONTHS);
  const todayKey = toDateKey(new Date());

  if (dueDateKey > todayKey) {
    return NextResponse.json({ skipped: "not due yet", dueDateKey });
  }

  try {
    if (await alreadyNotified("flea", dueDateKey)) {
      return NextResponse.json({ skipped: "already notified", dueDateKey });
    }

    const sent = await broadcastPush({
      title: "🐾 該幫 Mocha 點除蟲藥囉！",
      body: `上次點藥是 ${lastDateKey}，已經超過 ${REMINDER_MONTHS} 個月`,
    });

    await markNotified("flea", dueDateKey);

    return NextResponse.json({ sent, dueDateKey });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
