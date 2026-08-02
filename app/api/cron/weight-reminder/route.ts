import { NextRequest, NextResponse } from "next/server";
import { toDateKey } from "@/lib/date";
import { alreadyNotified, broadcastPush, configureWebPush, markNotified } from "@/lib/reminders";

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

  const todayKey = toDateKey(new Date());

  try {
    if (await alreadyNotified("weight", todayKey)) {
      return NextResponse.json({ skipped: "already notified today" });
    }

    const sent = await broadcastPush({
      title: "⚖️ 該幫 Mocha 量體重囉！",
      body: "今天是星期三，量完記得記錄一下～",
    });

    await markNotified("weight", todayKey);

    return NextResponse.json({ sent });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
