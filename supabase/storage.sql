-- Storage bucket for Mocha's avatar photo
-- 在 Supabase 專案的 SQL Editor 貼上並執行整份檔案（跟 schema.sql 一樣）

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 跟 entries 資料表一樣，這是單人使用的小工具，開放 anon key 讀寫 avatars bucket。
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars public insert" on storage.objects;
create policy "avatars public insert"
  on storage.objects for insert
  with check (bucket_id = 'avatars');

drop policy if exists "avatars public update" on storage.objects;
create policy "avatars public update"
  on storage.objects for update
  using (bucket_id = 'avatars');

drop policy if exists "avatars public delete" on storage.objects;
create policy "avatars public delete"
  on storage.objects for delete
  using (bucket_id = 'avatars');
