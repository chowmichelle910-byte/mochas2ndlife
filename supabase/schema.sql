-- mocha健康紀錄 schema
-- 在 Supabase 專案的 SQL Editor 貼上並執行整份檔案（重複執行也安全，可用來更新舊的資料庫）

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('food', 'water', 'pee', 'poop', 'flea', 'weight', 'activity')),
  amount numeric,
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 如果資料表是舊版建立的（缺少較新的 type），把限制條件更新成最新版本。
alter table entries drop constraint if exists entries_type_check;
alter table entries add constraint entries_type_check
  check (type in ('food', 'water', 'pee', 'poop', 'flea', 'weight', 'activity'));

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

-- 除蟲藥推播提醒用的資料表

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions public read" on push_subscriptions;
create policy "push_subscriptions public read" on push_subscriptions for select using (true);

drop policy if exists "push_subscriptions public insert" on push_subscriptions;
create policy "push_subscriptions public insert" on push_subscriptions for insert with check (true);

drop policy if exists "push_subscriptions public update" on push_subscriptions;
create policy "push_subscriptions public update" on push_subscriptions for update using (true);

drop policy if exists "push_subscriptions public delete" on push_subscriptions;
create policy "push_subscriptions public delete" on push_subscriptions for delete using (true);

create table if not exists reminder_state (
  type text primary key,
  last_notified_due_date date
);

alter table reminder_state enable row level security;

drop policy if exists "reminder_state public read" on reminder_state;
create policy "reminder_state public read" on reminder_state for select using (true);

drop policy if exists "reminder_state public insert" on reminder_state;
create policy "reminder_state public insert" on reminder_state for insert with check (true);

drop policy if exists "reminder_state public update" on reminder_state;
create policy "reminder_state public update" on reminder_state for update using (true);

-- 通用設定值（例如「到家日期」），key-value 形式方便之後擴充

create table if not exists settings (
  key text primary key,
  value text
);

alter table settings enable row level security;

drop policy if exists "settings public read" on settings;
create policy "settings public read" on settings for select using (true);

drop policy if exists "settings public insert" on settings;
create policy "settings public insert" on settings for insert with check (true);

drop policy if exists "settings public update" on settings;
create policy "settings public update" on settings for update using (true);

-- 食物種類快捷選項（例如「皇家乾糧」），使用者可以自己新增

create table if not exists food_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table food_brands enable row level security;

drop policy if exists "food_brands public read" on food_brands;
create policy "food_brands public read" on food_brands for select using (true);

drop policy if exists "food_brands public insert" on food_brands;
create policy "food_brands public insert" on food_brands for insert with check (true);

drop policy if exists "food_brands public update" on food_brands;
create policy "food_brands public update" on food_brands for update using (true);

-- 活動類型快捷選項（例如「剪指甲」「剃腳毛」），使用者可以自己新增

create table if not exists activity_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table activity_types enable row level security;

drop policy if exists "activity_types public read" on activity_types;
create policy "activity_types public read" on activity_types for select using (true);

drop policy if exists "activity_types public insert" on activity_types;
create policy "activity_types public insert" on activity_types for insert with check (true);

drop policy if exists "activity_types public update" on activity_types;
create policy "activity_types public update" on activity_types for update using (true);
