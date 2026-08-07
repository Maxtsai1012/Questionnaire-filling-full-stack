# Style Guides

本文件整理 `D:\MegumiNoSurvey` 前端目前實際使用的配色、字體與視覺風格，供 Demo 前維護、後續 UI 調整與新增頁面時對齊使用。主要依據：

- `frontend/src/styles.css`
- `frontend/src/index.html`
- `frontend/src/app/pages/home/home.component.css`
- `frontend/src/app/components/navbar/navbar.component.ts`
- 既有 admin、client、auth、member 頁面中的 inline style

## 1. 整體視覺定位

本專案是動態問卷管理系統，視覺風格應保持「清楚、可信、效率導向」。整體不走華麗行銷頁，而是以 SaaS / 後台工具感為主：資訊層級清楚、表格可掃描、表單易填寫、錯誤提示明確。

目前專案存在兩套相容中的設計語言：

| 區域 | 主要用途 | 視覺特徵 |
|---|---|---|
| Global Legacy UI | 問卷列表、填答、管理頁、統計頁 | 藍色主色、淺灰背景、白色卡片、表格導向 |
| Homepage Design System (`--ds-*`) | 首頁、Navbar、登入/註冊/會員資料頁 | 青綠主色、柔和背景、較完整的 spacing / typography token |

後續新增 Demo 相關畫面時，若是前台首頁或帳號流程，優先使用 `--ds-*` token；若是既有問卷管理、表格、填答、統計流程，優先沿用 legacy `.btn`、`.card`、`.table`、`.form-control` 樣式，避免同頁混搭過重。

## 2. 色彩系統

### 2.1 Legacy UI Colors

| Token | Hex | 用途 |
|---|---:|---|
| `--primary` | `#3b82f6` | 主要按鈕、連結、焦點、統計重點 |
| `--primary-hover` | `#2563eb` | 主要互動 hover |
| `--primary-light` | `#eff6ff` | 淺藍提示、pagination hover、資訊背景 |
| `--secondary` | `#64748b` | 次要文字、label、弱化資訊 |
| `--success` | `#10b981` | 成功狀態 |
| `--warning` | `#f59e0b` | 警告狀態 |
| `--danger` | `#ef4444` | 錯誤、必填、刪除、危險操作 |
| `--danger-hover` | `#dc2626` | 危險操作 hover |
| `--bg-main` | `#f8fafc` | 頁面背景、資料區塊背景 |
| `--bg-card` | `#ffffff` | 卡片、表格、modal 背景 |
| `--text-dark` | `#0f172a` | 主標題、主要內文 |
| `--text-muted` | `#64748b` | 次要文字 |
| `--text-light` | `#94a3b8` | empty state、placeholder 類文字 |
| `--border` | `#e2e8f0` | 表格、卡片、分隔線 |
| `--border-focus` | `#3b82f6` | input focus |

### 2.2 Homepage / Account Design System Colors

| Token | Hex | 用途 |
|---|---:|---|
| `--ds-color-primary` | `#1f8196` | 首頁 CTA、Logo mark、Navbar active、主要操作 |
| `--ds-color-primary-hover` | `#17697c` | 首頁/帳號頁主要 hover |
| `--ds-color-secondary` | `#526b78` | 首頁導航、輔助文字 |
| `--ds-color-accent` | `#35a995` | focus、accent badge、輔助亮點 |
| `--ds-color-background` | `#f4f8fb` | 首頁與帳號頁背景 |
| `--ds-color-surface` | `#ffffff` | 卡片、Header、Panel 背景 |
| `--ds-color-text-primary` | `#17232c` | 首頁主標題、卡片標題 |
| `--ds-color-text-secondary` | `#52616b` | 首頁內文與輔助資訊 |
| `--ds-color-border` | `#d6e0e7` | 首頁卡片與區塊邊線 |
| `--ds-color-success` | `#21875f` | 成功 badge / alert |
| `--ds-color-warning` | `#b7791f` | 警告 badge / alert |
| `--ds-color-error` | `#c43d4b` | 錯誤 badge / alert |

### 2.3 狀態色使用規則

| 狀態 | 建議用色 | 使用場景 |
|---|---|---|
| 成功 | `#10b981` / `#21875f` | 儲存成功、登入成功、發布成功 |
| 警告 | `#f59e0b` / `#b7791f` | 草稿、尚未開始、提醒使用者注意 |
| 錯誤 | `#ef4444` / `#c43d4b` | 表單錯誤、API 失敗、刪除警示 |
| 資訊 | `#3b82f6` / `#1f8196` | 說明提示、統計數字、主要導向 |
| 停用/空資料 | `#94a3b8` / `#cbd5e1` | Disabled、empty state、不可操作資訊 |

## 3. 字體與文字階層

### 3.1 字體

目前 `index.html` 載入 Google Font：`Plus Jakarta Sans`，全域 fallback 為：

```css
'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

注意：production build 若啟用 Angular font inline，會需要連線 Google Fonts；目前 build 設定已關閉 font inline，以避免離線或受限網路環境造成 build 失敗。

### 3.2 Legacy UI Typography

| 類型 | 尺寸 | 字重 | 用途 |
|---|---:|---:|---|
| Body | `15px` | 400 | 全站基礎文字 |
| Page title `.page-title` | `1.75rem` | 700 | 管理頁、列表頁主標題 |
| Card / Section heading | `1.1rem` - `1.3rem` | 700 | 卡片標題、問卷區段標題 |
| Table header | `0.85rem` | 700 | 表格欄位名稱，使用 uppercase |
| Button | `0.925rem` | 600 | legacy `.btn` |
| Helper / meta text | `0.8rem` - `0.9rem` | 400-600 | 日期、提示、狀態輔助文字 |

### 3.3 Homepage Design System Typography

| Token | 尺寸 | 行高 | 用途 |
|---|---:|---:|---|
| `--ds-font-size-page-title` | `2.5rem` | `1.18` | 首頁大型標題 |
| `--ds-font-size-section-title` | `1.75rem` | `1.3` | 首頁 section 標題、帳號頁主標題 |
| `--ds-font-size-card-title` | `1.125rem` | `1.4` | Feature card、流程卡標題 |
| `--ds-font-size-body` | `1rem` | `1.65` | 首頁段落文字 |
| `--ds-font-size-helper` | `0.875rem` | `1.5` | 輔助文字、Badge |
| `--ds-font-size-button` | `0.9375rem` | `1` | `ds-button` |
| `--ds-font-size-form-hint` | `0.8125rem` | `1.5` | 表單提示與錯誤 |

### 3.4 中文內容建議

- 標題短而直接，避免過長句子擠壓卡片。
- 操作按鈕使用動詞開頭，例如「新增問卷」、「查看回答」、「發布」。
- 錯誤訊息需說明下一步，例如「請輸入有效 Email」優於「格式錯誤」。
- Empty state 文字保持溫和，不要使用技術性語句。

## 4. Layout 與間距

### 4.1 Legacy Layout

| 元素 | 規格 |
|---|---|
| `.container` | `max-width: 1100px; padding: 24px 16px` |
| `.page-header` | Flex，標題與操作按鈕左右排列 |
| `.card` | `padding: 24px; margin-bottom: 24px` |
| `.search-grid` | `auto-fit minmax(220px, 1fr)` |
| `.table-responsive` | 橫向 overflow，保護窄螢幕表格 |

### 4.2 Homepage / DS Layout

| Token | 值 | 用途 |
|---|---:|---|
| `--ds-content-max-width` | `1120px` | 首頁內容最大寬度 |
| `--ds-section-padding-block` | `64px` | section 上下間距 |
| `--ds-space-1` | `4px` | 極小間距 |
| `--ds-space-2` | `8px` | icon gap、輕量 gap |
| `--ds-space-3` | `12px` | button padding、form gap |
| `--ds-space-4` | `16px` | 基礎區塊 padding |
| `--ds-space-5` | `24px` | card/form 區塊間距 |
| `--ds-space-6` | `32px` | 大卡片 padding |
| `--ds-space-7` | `48px` | 首頁大區塊 gap |
| `--ds-space-8` | `64px` | 帳號頁/section 大間距 |

## 5. Component 規範

### 5.1 Buttons

Legacy UI 使用 `.btn` 系列：

| Class | 用途 |
|---|---|
| `.btn-primary` | 主要操作，例如查詢、新增、送出 |
| `.btn-secondary` | 次要操作，例如返回、取消 |
| `.btn-danger` | 刪除與危險操作 |
| `.btn-outline` | 查看、細節、低強度操作 |

Homepage / Account UI 使用 `.ds-button` 系列：

| Class | 用途 |
|---|---|
| `.ds-button--primary` | 首頁 CTA、登入/註冊送出 |
| `.ds-button--secondary` | 次要 CTA |
| `.ds-button--outline` | 邊框型 CTA |

互動規則：

- Hover 應只做輕量色彩變化或 `translateY(-1px)`。
- Disabled 按鈕透明度約 `0.5` - `0.55`，不可保留 hover 效果。
- 危險操作一定用紅色系，不與主要藍/青綠混用。

### 5.2 Cards

| 系統 | Radius | Shadow | 用途 |
|---|---:|---|---|
| Legacy `.card` | `10px` | `--shadow-sm` | 表單、列表、統計內容 |
| DS `.ds-card` | `10px` | `0 8px 24px rgb(31 67 82 / 0.08)` | 首頁 feature、帳號 panel |
| Modal `.modal-content` | `16px` | `--shadow-lg` | 對話框 |

卡片應保持白底、清楚 border，不建議使用重度漸層或大面積裝飾陰影。

### 5.3 Forms

- Input 高度約 `40px` - `46px`。
- Border 使用 `#e2e8f0` 或 `--ds-color-border`。
- Focus 使用主色 border 加淡色 ring。
- 錯誤訊息使用紅色，字重 600，位置靠近欄位。
- 必填星號使用 `#ef4444`。

### 5.4 Tables

- 表頭背景使用 `#f8fafc`。
- 表頭文字使用 `0.85rem`、700、次要灰色。
- Row hover 使用極淡灰 `#f8fafc`。
- 表格外層應有 border、圓角與水平 overflow。

### 5.5 Badges

Legacy 問卷狀態 badge：

| Class | 背景 | 文字 | 用途 |
|---|---:|---:|---|
| `.badge-unpublished` | `#f1f5f9` | `#64748b` | 未發布 |
| `.badge-notstarted` | `#fef3c7` | `#d97706` | 尚未開始 |
| `.badge-inprogress` | `#dcfce7` | `#15803d` | 進行中 |
| `.badge-ended` | `#fee2e2` | `#b91c1c` | 已結束 |

DS badge 使用 `.ds-badge--accent`、`.ds-badge--success`、`.ds-badge--warning`、`.ds-badge--error`。

## 6. 首頁視覺語言

首頁走比較完整的產品介紹風格，但仍保持工具型可信感：

- 主色是青綠 `#1f8196`，輔以 mint green `#35a995`。
- 背景使用非常淡的青灰：`#f4f8fb`、`#edf6f8`、`#f6fafb`。
- Hero 使用柔和漸層和問卷/圖表視覺 panel。
- Feature card 圖示底色可用淡藍、淡綠、淡琥珀，但不可讓整頁變成單一色調。
- CTA 區可使用深青綠漸層 `#17697c` 到 `#248fa0`。
- Footer 使用深色 `#132931`，文字用低飽和淺青灰。

## 7. 圖表與統計

目前 Chart.js 色盤包含：

```text
#4f6edb, #b6dc22, #555978, #ff9749,
#18a5d1, #ec4899, #8b5cf6, #10b981,
#64748b, #d97706
```

使用規則：

- 單一重點統計可用 `--primary` / `#3b82f6`。
- 多選項圖表可使用上述高辨識色盤。
- 圖表文字仍使用 `Plus Jakarta Sans`，12px 左右。
- 圖表容器維持白底或淡灰底，避免彩色背景干擾資料判讀。

## 8. 無障礙與互動

- Focus visible 需保留，DS 系統使用 `--ds-shadow-focus` 或 accent outline。
- 動畫只使用 160-200ms 的短 transition。
- 已有 `prefers-reduced-motion: reduce` 支援，新增動畫時也需提供降動態處理。
- 文字與背景需維持足夠對比，尤其是灰色輔助文字不得低於目前 `#64748b` / `#52616b` 的辨識度。
- 表單錯誤不可只靠顏色，需搭配文字訊息。

## 9. 後續新增 UI 的建議

### Do

- 優先使用既有 CSS variables，不直接新增相近色。
- 管理頁使用 `.container`、`.card`、`.table`、`.btn`。
- 首頁、登入、註冊、會員頁使用 `.ds-*` token。
- 保持卡片 radius 在 6px - 10px，modal 可到 16px。
- Empty state 使用 `--text-light` 搭配簡短行動提示。

### Do Not

- 不要為了單一頁面新增第三套主色。
- 不要隨意把 legacy 管理頁整批改成 homepage style。
- 不要移除 focus 樣式。
- 不要用過重陰影或大面積高飽和背景。
- 不要把錯誤、警告、成功狀態都用主色表示。

## 10. 快速參考

| 類型 | 首選樣式 |
|---|---|
| 一般頁背景 | `--bg-main` 或 `--ds-color-background` |
| 內容卡片 | 白底、淡 border、輕陰影 |
| 主要操作 | `--primary` 或 `--ds-color-primary` |
| 危險操作 | `--danger` / `--ds-color-error` |
| 表單 focus | 主色 border + 淡色 ring |
| 分隔線 | `--border` / `--ds-color-border` |
| 字體 | Plus Jakarta Sans + system fallback |
| 管理頁最大寬 | `1100px` |
| 首頁最大寬 | `1120px` |
