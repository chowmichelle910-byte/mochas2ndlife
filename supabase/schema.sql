-- 貓咪健康紀錄 schema
-- 在 Supabase 專案的 SQL Editor 貼上並執行整份檔案

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('food', 'water', 'pee', 'poop')),
  amount numeric,
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists entries_occurred_at_idx on entries (occurred_at desc);

alter table entries enable row level security;

-- 這是單人使用的寵物紀錄應用，預設用 anon key 開放讀寫。
-- 若之後要加上登入驗證，記得把以下 policy 換成依 auth.uid() 過濾。
drop policy if exists "public read" on entries;
create policy "public read" on entries for select using (true);

drop policy if exists "public insert" on entries;
create policy "public insert" on entries for insert with check (true);

drop policy if exists "public delete" on entries;
create policy "public delete" on entries for delete using (true);
