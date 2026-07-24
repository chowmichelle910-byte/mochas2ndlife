import { supabase } from "@/lib/supabase";

const BUCKET = "avatars";
const FILE_PREFIX = "mocha";

export async function getAvatarUrl(): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).list("", {
    search: FILE_PREFIX,
  });
  if (error || !data) return null;

  const file = data.find((f) => f.name.startsWith(FILE_PREFIX));
  if (!file) return null;

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(file.name);
  const version = file.updated_at ?? file.created_at ?? String(Date.now());
  return `${publicData.publicUrl}?v=${encodeURIComponent(version)}`;
}

export async function uploadAvatar(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${FILE_PREFIX}.${ext}`;

  const { data: existing } = await supabase.storage.from(BUCKET).list("", {
    search: FILE_PREFIX,
  });
  const stale = (existing ?? []).filter((f) => f.name !== path).map((f) => f.name);
  if (stale.length > 0) {
    await supabase.storage.from(BUCKET).remove(stale);
  }

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw error;

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${publicData.publicUrl}?v=${Date.now()}`;
}
