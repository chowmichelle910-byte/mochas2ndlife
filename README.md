# 🐾 mocha健康紀錄

紀錄貓咪每天的飲食（食物 g）、喝水（ml）、尿尿與便便次數、體重變化、除蟲藥的點藥週期提醒，以及到家累計天數的小網站。
用 Next.js + Supabase 打造，可部署到 Vercel。

畫面採用溫暖米色系、白色卡片 + 橘色重點色的風格，並支援上傳 Mocha 的頭像照片。除蟲藥點藥滿 3 個月、每週三量體重，都會透過瀏覽器推播通知提醒。

## 技術棧

- [Next.js 14](https://nextjs.org/)（App Router + TypeScript）
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)（Postgres 資料庫 + 前端直連的 REST API）
- 部署：[Vercel](https://vercel.com/)

## 資料結構

主要資料表 `entries`，每一筆是一個事件（吃飯 / 喝水 / 尿尿 / 便便 / 點除蟲藥 / 量體重 / 活動 / 零食），可以一天記錄多次，畫面上會依日期加總顯示：

| 欄位 | 說明 |
| --- | --- |
| `type` | `food` / `water` / `pee` / `poop` / `flea` / `weight` / `activity` / `snack` |
| `amount` | 數量（食物用 g、喝水用 ml、體重用 kg、尿尿/便便用次數，除蟲藥、活動、零食可留空） |
| `note` | 備註，例如食物種類、便便軟硬程度、除蟲藥品名、活動類型、零食種類 |
| `occurred_at` | 發生時間（尿尿/便便沒有精確時間，用上午/中午/下午/晚上換算成代表時間存入） |

另外還有 `push_subscriptions`（瀏覽器推播訂閱資訊）、`reminder_state`（避免同一次到期重複推播）、`settings`（單一設定值，目前用來存到家日期、飲水起始量）、`food_brands`（食物種類快捷選項）、`activity_types`（活動類型快捷選項）、`snack_types`（零食種類快捷選項）六張輔助表。完整定義見 [`supabase/schema.sql`](./supabase/schema.sql)。

Mocha 的頭像照片存在 Supabase Storage 的 `avatars` bucket 裡（固定檔名 `mocha.*`，上傳新照片會直接覆蓋舊的），設定見 [`supabase/storage.sql`](./supabase/storage.sql)。

## 修改紀錄

「紀錄列表」裡的每一筆紀錄都可以點下去修改（例如打錯數量、選錯種類、時間不對），會打開跟新增時一樣的表單並帶入原本的內容，改完按「更新」就會儲存回原本那一筆紀錄（不會變成新的一筆）。點右邊的「✕」則維持原本刪除整筆紀錄的功能。

## 推播提醒怎麼運作

1. 點首頁左上角的「☰」打開側邊選單 → 「設定」進入設定頁，按「啟用推播」，瀏覽器會請你同意通知權限，同意後會把訂閱資訊存進 `push_subscriptions`（這組訂閱同時涵蓋除蟲藥跟體重兩種提醒，只要開一次）。
2. 兩種提醒各自的 Vercel Cron Job（設定在 `vercel.json`）：
   - `/api/cron/flea-reminder`：每天檢查一次，算出「上次點藥日期 + 3 個月」，到期且這次到期還沒推播過，就發送推播並清掉已經失效的訂閱。
   - `/api/cron/weight-reminder`：只在每週三檢查，直接對所有訂閱裝置發送「該量體重了」的推播提醒。
3. 收到提醒後，用「體重」或「除蟲藥」卡片右上角的「+」補上這次的紀錄即可。

> ⚠️ **iPhone 限制**：iOS Safari 只有在把網站「加入主畫面」變成 App 之後，Web Push 才會生效，直接用瀏覽器分頁開啟是收不到通知的（Apple 的限制，不是這個網站的 bug）。Android／桌機瀏覽器（Chrome、Edge、Firefox）不需要額外設定。
>
> Vercel Hobby（免費）方案的 Cron Job 上限是 2 個、且每個最多一天觸發一次，這個專案剛好用滿 2 個（除蟲藥每天檢查、體重每週三檢查），如果之後想加更多提醒，需要升級 Vercel Pro 方案。

## 加到主畫面 / App 圖示

網站有設定 `app/icon.png`（一般網站圖示）跟 `app/apple-icon.png`（iOS「加入主畫面」用的圖示，180×180），以及 `public/manifest.json`（讓加入主畫面後用全螢幕、沒有網址列的方式開啟，比較有 App 的感覺）。

目前的圖示是預設的貓臉圖案，如果想換成 Mocha 的真實照片，把照片傳給我，我直接把 `app/apple-icon.png`（建議至少 180×180）跟 `app/icon.png` 換掉重新部署即可。

> ⚠️ iOS 在「加入主畫面」的當下就會把圖示存起來，之後就算網站的圖示換了，桌面上已經加好的捷徑也不會自動更新，要重新加一次（先移除舊的捷徑，再重新「加入主畫面」）才會看到新圖示。

## 體重與到家天數

- **體重**：卡片右上角「+」新增一筆量體重紀錄，會顯示最新體重，以及跟上一次相比是變重（▲）還是變輕（▼）。每週三會推播提醒你量體重。
- **到家第 N 天**：在寵物資訊卡點「設定到家日期」，選一個日期存起來（到家當天算第 1 天），之後首頁就會一直顯示累計天數；要修改的話再點一次同一個位置就能改。

## 食物種類

新增食物紀錄時，上方有快捷種類按鈕，預設是「皇家乾糧」、「皇家罐罐」，選一個會自動填入備註欄。按旁邊的「+」可以輸入新的種類名稱，存進 `food_brands` 資料表後，之後每次新增食物都會看到這個新種類。

「食物」卡片上除了橘色「+」，左邊還有一個灰色「−」，如果貓咪沒吃完：
1. 按「−」會列出當天所有的餵食紀錄（時間、種類、份量），選出沒吃完的是哪一筆
2. 輸入剩下多少克，會直接從那一筆紀錄的份量扣掉（例如原本餵 50g，剩 15g，那筆紀錄就會改成 35g）

「今日紀錄」顯示的總克數就是實際吃下去的量，不用另外靠加總負數紀錄來換算。

## 飲水量怎麼記錄

「喝水」卡片有兩個按鈕：

- **橘色「+」**：跟食物一樣直接輸入喝了多少 ml，簡單快速
- **藍色「🧮」**：用「起始水量 → 剩餘水量」相減的方式計算，適合沒辦法一口一口秤、但可以秤水碗前後重量的情況
  1. 幫水碗加滿水（或決定一個測量基準）時，按「🧮」，輸入「起始水量（ml）」存起來
  2. 之後要記錄時再按「🧮」，這次畫面會顯示剛剛設定的起始水量，輸入「剩餘水量（ml）」
  3. 按「計算並記錄」，系統會自動算出「起始 − 剩餘」的差，存成一筆喝水紀錄（例如起始 300ml、剩餘 180ml，就會記成喝了 120ml）；記錄完成後起始水量會清空，下次要重新設定。中途量錯的話，畫面上有「重新設定起始水量」可以直接覆蓋

兩種方式記的都是同一種「喝水」紀錄，「今日紀錄」會把兩種方式加總顯示。

## 尿尿與便便怎麼記錄

因為在旁邊看到貓咪尿尿/便便的當下很難精準記時間，這兩種紀錄改成：

- **時段**：上午 / 中午 / 下午 / 晚上四選一（預設依現在時間自動選好，會轉換成代表時間存進資料庫）
- **次數**：用上下箭頭調整，預設 1 次

「今日紀錄」卡片上顯示的是當天的**加總次數**（同一筆紀錄如果選了 3 次，就算 3 次）。

## 活動

「紀錄列表」下方多一張「活動」卡片，用來記錄剪指甲、剃腳毛這類不定期的護理活動：

- 按「+」新增，上方有快捷類型按鈕，預設是「剪指甲」、「剃腳毛」，選一個會自動填入備註欄
- 按類型按鈕旁的「+」可以輸入新的活動名稱，存進 `activity_types` 資料表後，之後每次新增活動都會看到這個新類型（跟食物種類的邏輯一樣）
- 卡片上顯示最近一次的活動類型與日期

## 零食

「活動」卡片下方多一張「零食」卡片，記錄方式跟活動完全一樣：

- 按「+」新增，上方有快捷類型按鈕，預設是「肉泥」、「化毛肉泥」、「潔牙餅」、「凍乾」，選一個會自動填入備註欄
- 按類型按鈕旁的「+」可以輸入新的零食名稱，存進 `snack_types` 資料表後，之後每次新增零食都會看到這個新類型
- 卡片上顯示最近一次的零食種類與日期

## 自動更新資料（不用手動滑掉重開）

有兩種情境會讓畫面上的資料變舊，這個網站都處理了（`lib/useVisibilityRefresh.ts`）：

1. **App 從背景切回前景**：iOS「加入主畫面」的網頁 App，切到背景再切回來時，系統通常只是把畫面原封不動地恢復，不會重新跟伺服器要資料。現在只要 App 從背景切回前景、視窗重新取得焦點、或瀏覽器從快取恢復頁面，就會自動重新抓取資料。
2. **別人在其他裝置新增了資料，但你的畫面一直開著沒有切走**：這種情況不會有背景/前景切換可以偵測，所以另外加了**每 30 秒自動檢查一次**（只有畫面顯示中才會檢查，切到背景不會浪費流量），就算你一直盯著同一頁，家人新增的紀錄也會在 30 秒內自動出現。

不管哪種情況觸發更新，都**不會**跳回首頁或重設你正在看的日期、報表區間等狀態——資料是新的，但你還停在原本那一頁。

## 報表

側邊選單「報表」可以看食物、便便、尿尿三項的趨勢，上方切換「1週」/「1個月」/「自訂期間」：

- 每張卡片顯示「平均每天多少」跟跟上一個週期比較的漲跌幅（例如這週平均 vs 上週平均；自訂期間則是跟前一個等長的區間比較）。平均值只算「有紀錄的天數」，忘記記錄的空白天不會被算進分母，才不會被拉低
- 下方是每天的長條圖，虛線是這個週期的平均值；範圍 7 天以內會標星期幾，超過 7 天長條比較多，用手指左右滑動看
- 食物看的是總重量（g/天），便便、尿尿看的是次數（次/天）
- 如果上一個週期完全沒有紀錄，會顯示「新紀錄」而不是漲跌幅（避免除以 0 算出奇怪的數字）
- 「自訂期間」可以自己選開始跟結束日期（不能選未來的日期），適合想看特定那幾天的狀況時使用

## AI 分析

報表頁最下方有一張「AI 分析」卡片，按「開始分析」會把目前檢視期間的食物、飲水、體重、便便、尿尿數據整理起來，交給 Google Gemini（免費方案）生成一段繁體中文分析，說明這些數據之間可能有什麼關聯（例如食量增加是否對應體重上升），並提醒有沒有需要留意的地方。

- 每次都是使用者主動按按鈕才會呼叫 AI（不會自動觸發），避免浪費免費額度
- 切換「1週」/「1個月」/「自訂期間」分頁後，分析結果會清空，需要重新按一次「開始分析」
- 分析內容只是根據紀錄數據做的推論、不是醫療診斷，如果數字異常還是建議帶去給獸醫看
- 需要設定 `GEMINI_API_KEY` 環境變數才能使用，申請方式見下方部署步驟

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

## 3. 申請 AI 分析用的 Gemini API Key（免費）

報表頁的「AI 分析」功能需要一組 Google Gemini API Key：

1. 到 [Google AI Studio](https://aistudio.google.com/apikey)（用 Google 帳號登入）
2. 按「Create API key」，選一個 Google Cloud 專案（沒有的話會自動幫你建一個）
3. 複製產生的 API Key，等一下本機開發跟 Vercel 都要用到

> Gemini 有免費方案（有次數限制，但這個 app 是個人／家人用量，需要按到「開始分析」才會呼叫一次，應該不會超過額度），不需要绑信用卡。如果不需要 AI 分析功能，可以跳過這步，`GEMINI_API_KEY` 留空即可，按「開始分析」時會顯示錯誤訊息但不影響其他功能。

## 4. 本機開發

```bash
npm install
cp .env.local.example .env.local
# 編輯 .env.local，填入 Supabase URL / anon key、VAPID 金鑰、自訂的 CRON_SECRET，以及上一步的 GEMINI_API_KEY
npm run dev
```

開啟 http://localhost:3000 即可使用。

> Cron Job 只有部署到 Vercel 後才會自動排程執行，本機開發若要手動測試提醒邏輯，可以自己呼叫：
> `curl -H "Authorization: Bearer 你的CRON_SECRET" http://localhost:3000/api/cron/flea-reminder`
> `curl -H "Authorization: Bearer 你的CRON_SECRET" http://localhost:3000/api/cron/weight-reminder`

## 5. 部署到 Vercel

1. 把這個 repo 推到 GitHub（已經在這個 repo 裡了）。
2. 到 [vercel.com](https://vercel.com/) → **Add New Project** → 選擇這個 GitHub repo。
3. **Framework Preset** 確認是 **Next.js**。
4. 在 **Environment Variables** 設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `CRON_SECRET`（自己取一組隨機字串，Vercel 呼叫 Cron Job 時會自動帶上這個值驗證身分）
   - `GEMINI_API_KEY`（上一步申請的 Gemini API Key，沒有的話 AI 分析功能會顯示錯誤，但不影響其他功能）
5. 點 **Deploy**，完成後即可透過 Vercel 提供的網址使用。

之後每次 push 到部署分支，Vercel 都會自動重新部署；`vercel.json` 裡設定的兩個 Cron Job 也會跟著自動排程（除蟲藥每天、體重每週三，都是台灣時間早上 9 點檢查）。

## 專案結構

```
app/                          # Next.js App Router 頁面與 API 路由
app/settings                  # 設定頁（側邊選單點「設定」進入），目前放推播開關
app/reports                   # 報表頁（側邊選單點「報表」進入），食物/便便/尿尿週或月比較
app/api/cron/flea-reminder    # Vercel Cron 呼叫的除蟲藥提醒檢查（每天）
app/api/cron/weight-reminder  # Vercel Cron 呼叫的體重提醒（每週三）
app/api/ai-analysis           # 報表頁「AI 分析」按鈕呼叫的 API，整理數據後轉發給 Gemini
components/                   # 前端元件（側邊選單、寵物資訊卡、推播開關、體重卡、除蟲藥提醒卡、活動/零食卡、快捷選項按鈕、報表卡、AI 分析卡、今日紀錄格、新增/編輯紀錄彈窗、扣除食物剩量彈窗、量水量彈窗、清單、日期切換）
lib/                          # Supabase client、型別定義、日期工具、頭像上傳、推播訂閱、報表統計、飲水量起始值追蹤、食物/活動/零食類型快捷選項、App 恢復前景時自動刷新、共用的推播發送邏輯
public/sw.js                  # 接收推播通知的 Service Worker
supabase/schema.sql           # entries / push_subscriptions / reminder_state / settings 資料表結構
supabase/storage.sql          # 頭像照片 storage bucket 與權限
vercel.json                   # 除蟲藥、體重兩個提醒的 Cron Job 排程設定
```

## 待辦

- [ ] 視需求調整分類與單位（例如便便軟硬度改成固定選項）
