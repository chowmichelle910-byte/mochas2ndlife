import webPush from "web-push";
import { supabase } from "@/lib/supabase";

export function configureWebPush(): void {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error("missing VAPID keys");
  }
  webPush.setVapidDetails("mailto:cat-tracker@example.com", vapidPublicKey, vapidPrivateKey);
}

export async function broadcastPush(payload: { title: string; body: string }): Promise<number> {
  const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("*");
  if (error) throw error;

  const json = JSON.stringify(payload);
  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subscriptions ?? []) {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        json
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

  return sent;
}

export async function alreadyNotified(type: string, cycleKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("reminder_state")
    .select("last_notified_due_date")
    .eq("type", type)
    .maybeSingle();
  if (error) throw error;
  return data?.last_notified_due_date === cycleKey;
}

export async function markNotified(type: string, cycleKey: string): Promise<void> {
  const { error } = await supabase
    .from("reminder_state")
    .upsert({ type, last_notified_due_date: cycleKey }, { onConflict: "type" });
  if (error) throw error;
}
