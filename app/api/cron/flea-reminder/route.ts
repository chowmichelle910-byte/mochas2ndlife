import { NextRequest, NextResponse } from "next/server";
import webPush from "web-push";
import { supabase } from "@/lib/supabase";
import { addMonths, toDateKey } from "@/lib/date";

const REMINDER_MONTHS = 3;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "missing VAPID keys" }, { status: 500 });
  }
  webPush.setVapidDetails("mailto:cat-tracker@example.com", vapidPublicKey, vapidPrivateKey);

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

  const { data: state, error: stateError } = await supabase
    .from("reminder_state")
    .select("last_notified_due_date")
    .eq("type", "flea")
    .maybeSingle();

  if (stateError) {
    return NextResponse.json({ error: stateError.message }, { status: 500 });
  }
  if (state?.last_notified_due_date === dueDateKey) {
    return NextResponse.json({ skipped: "already notified", dueDateKey });
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (subscriptionsError) {
    return NextResponse.json({ error: subscriptionsError.message }, { status: 500 });
  }

  const payload = JSON.stringify({
    title: "🐾 該幫 Mocha 點除蟲藥囉！",
    body: `上次點藥是 ${lastDateKey}，已經超過 ${REMINDER_MONTHS} 個月`,
  });

  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subscriptions ?? []) {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent += 1;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        staleEndpoints.push(sub.endpoint);
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  await supabase
    .from("reminder_state")
    .upsert({ type: "flea", last_notified_due_date: dueDateKey }, { onConflict: "type" });

  return NextResponse.json({ sent, dueDateKey });
}
