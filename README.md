# 🐾 貓咪健康紀錄

紀錄貓咪每天的飲食（食物 g）、喝水（ml）、尿尿（ml）與便便（次數）狀況的小網站。
用 Next.js + Supabase 打造，可部署到 Vercel。

畫面目前是簡潔的預設樣式，等收到設計稿後再套用視覺風格，不影響底層資料結構與功能。

## 技術棧

- [Next.js 14](https://nextjs.org/)（App Router + TypeScript）
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)（Postgres 資料庫 + 前端直連的 REST API）
- 部署：[Vercel](https://vercel.com/)

## 資料結構

單一資料表 `entries`，每一筆是一個事件（吃飯 / 喝水 / 尿尿 / 便便），可以一天記錄多次，畫面上會依日期加總顯示：

| 欄位 | 說明 |
| --- | --- |
| `type` | `food` / `water` / `pee` / `poop` |
| `amount` | 數量（食物用 g、喝水/尿尿用 ml、便便可留空） |
| `note` | 備註，例如便便軟硬程度 |
| `occurred_at` | 發生時間 |

完整定義見 [`supabase/schema.sql`](./supabase/schema.sql)。

## 1. 建立 Supabase 專案

1. 到 [supabase.com](https://supabase.com/) 建立一個新專案。
2. 進入專案的 **SQL Editor**，貼上 [`supabase/schema.sql`](./supabase/schema.sql) 的整份內容並執行，建立 `entries` 資料表。
3. 到 **Settings → API**，複製：
   - `Project URL`
   - `anon public` key

> `entries` 資料表目前開放給 anon key 讀寫（沒有登入機制），適合個人／家人使用的小工具。如果之後要公開分享或加上多人帳號管理，建議加上 Supabase Auth 並把 `schema.sql` 裡的 RLS policy 改成依 `auth.uid()` 過濾。

## 2. 本機開發

```bash
npm install
cp .env.local.example .env.local
# 編輯 .env.local，填入上一步取得的 Supabase URL 與 anon key
npm run dev
```

開啟 http://localhost:3000 即可使用。

## 3. 部署到 Vercel

1. 把這個 repo 推到 GitHub（已經在這個 repo 裡了）。
2. 到 [vercel.com](https://vercel.com/) → **Add New Project** → 選擇這個 GitHub repo。
3. 在 **Environment Variables** 設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 點 **Deploy**，完成後即可透過 Vercel 提供的網址使用。

之後每次 push 到部署分支，Vercel 都會自動重新部署。

## 專案結構

```
app/                 # Next.js App Router 頁面
components/          # 前端元件（表單、清單、日期切換、每日總覽卡片）
lib/                 # Supabase client、型別定義、日期工具
supabase/schema.sql  # 資料庫結構
```

## 待辦（等設計稿）

- [ ] 套用正式視覺設計（配色、字體、版面）
- [ ] 視需求調整分類與單位（例如便便軟硬度改成固定選項）
