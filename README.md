# 🐾 貓咪健康紀錄

紀錄貓咪每天的飲食（食物 g）、喝水（ml）、尿尿與便便次數、體重變化、除蟲藥的點藥週期提醒，以及到家累計天數的小網站。
用 Next.js + Supabase 打造，可部署到 Vercel。

畫面採用溫暖米色系、白色卡片 + 橘色重點色的風格，並支援上傳 Mocha 的頭像照片。除蟲藥點藥滿 3 個月、每週三量體重，都會透過瀏覽器推播通知提醒。

## 技術棧

- [Next.js 14](https://nextjs.org/)（App Router + TypeScript）
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)（Postgres 資料庫 + 前端直連的 REST API）
- 部署：[Vercel](https://vercel.com/)

## 資料結構

主要資料表 `entries`，每一筆是一個事件（吃飯 / 喝水 / 尿尿 / 便便 / 點除蟲藥 / 量體重），可以一天記錄多次，畫面上會依日期加總顯示：

| 欄位 | 說明 |
| --- | --- |
| `type` | `food` / `water` / `pee` / `poop` / `flea` / `weight` |
| `amount` | 數量（食物用 g、喝水用 ml、體重用 kg、尿尿/便便用次數，除蟲藥可留空） |
| `note` | 備註，例如食物種類、便便軟硬程度、除蟲藥品名 |
| `occurred_at` | 發生時間（尿尿/便便沒有精確時間，用上午/中午/下午/晚上換算成代表時間存入） |

另外還有 `push_subscriptions`（瀏覽器推播訂閱資訊）、`reminder_state`（避免同一次到期重複推播）、`settings`（單一設定值，目前用來存到家日期）、`food_brands`（食物種類快捷選項）四張輔助表。完整定義見 [`supabase/schema.sql`](./supabase/schema.sql)。

Mocha 的頭像照片存在 Supabase Storage 的 `avatars` bucket 裡（固定檔名 `mocha.*`，上傳新照片會直接覆蓋舊的），設定見 [`supabase/storage.sql`](./supabase/storage.sql)。

## 推播提醒怎麼運作

1. 在寵物資訊卡下方按「啟用推播」，瀏覽器會請你同意通知權限，同意後會把訂閱資訊存進 `push_subscriptions`（這組訂閱同時涵蓋除蟲藥跟體重兩種提醒，只要開一次）。
2. 兩種提醒各自的 Vercel Cron Job（設定在 `vercel.json`）：
   - `/api/cron/flea-reminder`：每天檢查一次，算出「上次點藥日期 + 3 個月」，到期且這次到期還沒推播過，就發送推播並清掉已經失效的訂閱。
   - `/api/cron/weight-reminder`：只在每週三檢查，直接對所有訂閱裝置發送「該量體重了」的推播提醒。
3. 收到提醒後，用「體重」或「除蟲藥」卡片右上角的「+」補上這次的紀錄即可。

> ⚠️ **iPhone 限制**：iOS Safari 只有在把網站「加入主畫面」變成 App 之後，Web Push 才會生效，直接用瀏覽器分頁開啟是收不到通知的（Apple 的限制，不是這個網站的 bug）。Android／桌機瀏覽器（Chrome、Edge、Firefox）不需要額外設定。
>
> Vercel Hobby（免費）方案的 Cron Job 上限是 2 個、且每個最多一天觸發一次，這個專案剛好用滿 2 個（除蟲藥每天檢查、體重每週三檢查），如果之後想加更多提醒，需要升級 Vercel Pro 方案。

## 體重與到家天數

- **體重**：卡片右上角「+」新增一筆量體重紀錄，會顯示最新體重，以及跟上一次相比是變重（▲）還是變輕（▼）。每週三會推播提醒你量體重。
- **到家第 N 天**：在寵物資訊卡點「設定到家日期」，選一個日期存起來（到家當天算第 1 天），之後首頁就會一直顯示累計天數；要修改的話再點一次同一個位置就能改。

## 食物種類

新增食物紀錄時，上方有快捷種類按鈕，預設是「皇家乾糧」、「皇家罐罐」，選一個會自動填入備註欄。按旁邊的「+」可以輸入新的種類名稱，存進 `food_brands` 資料表後，之後每次新增食物都會看到這個新種類。

## 尿尿與便便怎麼記錄

因為在旁邊看到貓咪尿尿/便便的當下很難精準記時間，這兩種紀錄改成：

- **時段**：上午 / 中午 / 下午 / 晚上四選一（預設依現在時間自動選好，會轉換成代表時間存進資料庫）
- **次數**：用上下箭頭調整，預設 1 次

「今日紀錄」卡片上顯示的是當天的**加總次數**（同一筆紀錄如果選了 3 次，就算 3 次）。

## 1. 建立 Supabase 專案

1. 到 [supabase.com](https://supabase.com/) 建立一個新專案。
2. 進入專案的 **SQL Editor**，依序貼上並執行：
   - [`supabase/schema.sql`](./supabase/schema.sql) — 建立 `entries`、`push_subscriptions`、`reminder_state`、`settings` 資料表（如果你之前已經執行過舊版，重新整份貼上執行一次也沒關係，會自動升級）
   - [`supabase/storage.sql`](./supabase/storage.sql) — 建立存放頭像照片的 `avatars` storage bucket
3. 到 **Settings → API**，複製：
   - `Project URL`
   - `anon public` key

> 目前所有資料表跟 `avatars` bucket 都開放給 anon key 讀寫（沒有登入機制），適合個人／家人使用的小工具。如果之後要公開分享或加上多人帳號管理，建議加上 Supabase Auth 並把 SQL 裡的 RLS policy 改成依 `auth.uid()` 過濾。

## 2. 產生推播用的 VAPID 金鑰

除蟲藥推播提醒需要一組 VAPID 金鑰（瀏覽器推播的憑證），本機執行：

```bash
npx web-push generate-vapid-keys
```

會得到一組 Public Key 和 Private Key，等一下本機開發跟 Vercel 都要用到。

## 3. 本機開發

```bash
npm install
cp .env.local.example .env.local
# 編輯 .env.local，填入 Supabase URL / anon key，以及上一步產生的 VAPID 金鑰、自訂的 CRON_SECRET
npm run dev
```

開啟 http://localhost:3000 即可使用。

> Cron Job 只有部署到 Vercel 後才會自動排程執行，本機開發若要手動測試提醒邏輯，可以自己呼叫：
> `curl -H "Authorization: Bearer 你的CRON_SECRET" http://localhost:3000/api/cron/flea-reminder`
> `curl -H "Authorization: Bearer 你的CRON_SECRET" http://localhost:3000/api/cron/weight-reminder`

## 4. 部署到 Vercel

1. 把這個 repo 推到 GitHub（已經在這個 repo 裡了）。
2. 到 [vercel.com](https://vercel.com/) → **Add New Project** → 選擇這個 GitHub repo。
3. **Framework Preset** 確認是 **Next.js**。
4. 在 **Environment Variables** 設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `CRON_SECRET`（自己取一組隨機字串，Vercel 呼叫 Cron Job 時會自動帶上這個值驗證身分）
5. 點 **Deploy**，完成後即可透過 Vercel 提供的網址使用。

之後每次 push 到部署分支，Vercel 都會自動重新部署；`vercel.json` 裡設定的兩個 Cron Job 也會跟著自動排程（除蟲藥每天、體重每週三，都是台灣時間早上 9 點檢查）。

## 專案結構

```
app/                          # Next.js App Router 頁面與 API 路由
app/api/cron/flea-reminder    # Vercel Cron 呼叫的除蟲藥提醒檢查（每天）
app/api/cron/weight-reminder  # Vercel Cron 呼叫的體重提醒（每週三）
components/                   # 前端元件（寵物資訊卡、推播開關、體重卡、除蟲藥提醒卡、今日紀錄格、新增紀錄彈窗、清單、日期切換）
lib/                          # Supabase client、型別定義、日期工具、頭像上傳、推播訂閱、共用的推播發送邏輯
public/sw.js                  # 接收推播通知的 Service Worker
supabase/schema.sql           # entries / push_subscriptions / reminder_state / settings 資料表結構
supabase/storage.sql          # 頭像照片 storage bucket 與權限
vercel.json                   # 除蟲藥、體重兩個提醒的 Cron Job 排程設定
```

## 待辦

- [ ] 視需求調整分類與單位（例如便便軟硬度改成固定選項）
