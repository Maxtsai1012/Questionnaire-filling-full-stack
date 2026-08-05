# 首頁 UI 分析與實作規劃

## 1. 本階段範圍

本文件只分析 `docs/ui-reference` 與現有 Angular 架構，未修改 Angular、Spring Boot、MySQL、路由、全域樣式或任何既有程式碼，也未讀取 Shopping-project。

## 2. UI 參考圖片盤點

`docs/ui-reference` 共四張圖片：

| 檔名 | 尺寸 | 畫面用途 |
|---|---:|---|
| `homePage.jpg` | 1024 × 780 | 首頁；檔名與畫面內容皆明確符合本階段目標 |
| `login.png` | 458 × 458 | 登入頁 |
| `buildAccount.png` | 451 × 535 | 註冊頁 |
| `Chart.png` | 1696 × 797 | 圖表樣式與設定參考 |

本次首頁唯一主要參考圖為：

```text
docs/ui-reference/homePage.jpg
```

## 3. `homePage.jpg` 視覺分析

### 3.1 主要版面結構

1. 白色頂部導覽列：左側品牌 Logo／名稱，中間主選單，右側登入與主要 CTA。
2. Hero 區：左右雙欄。左側為大型標題、說明文字、主要 CTA；右側為數據分析插圖。
3. Hero 背景：極淡藍灰色底，右上與左下使用低對比網路節點線條裝飾。
4. 功能區：淡藍灰區塊，上方置中標題與左右短裝飾線，下方三張等寬功能卡片。
5. 圖片只呈現首屏與功能卡片開頭，沒有可確認的 Footer。

### 3.2 主要配色

以下為由畫面目測取得的設計方向，實作前可再以取色工具校正：

- 品牌主色：深青藍／Teal，約 `#177A8F`～`#238DA3`。
- 主色深階：`#155E70` 左右，用於 Logo、按鈕陰影或 hover。
- 標題文字：接近黑色的深藍灰，約 `#17202A`。
- 內文文字：深灰，約 `#3E4A54`。
- 頁面背景：白色與極淡藍灰 `#F4F8FB`。
- 邊框／裝飾線：低飽和藍灰 `#D6E0E7`。
- 插圖輔色：青綠、薄荷綠、灰藍；不應把插圖色全部提升為 UI 主色。

### 3.3 字體層級

- 品牌名稱：約 18～20px、700。
- 導覽項目：約 12～14px、400～500。
- Hero H1：約 36～42px、700～800，行高約 1.15～1.25，最多三行。
- Hero 說明：約 15～17px、400，行高約 1.55～1.7。
- 區塊標題：約 24～28px、700。
- 卡片標題：約 17～19px、700。
- 卡片說明：約 13～15px、400，行高約 1.5。
- 整體為現代無襯線字體；現有專案 `Plus Jakarta Sans` fallback 可延續，但目前沒有看到實際 Web Font 載入來源，需確認是否應改用系統字體或補合法字型資源。

### 3.4 按鈕風格

- 主要 CTA：青藍實心或輕微漸層、白字、中等圓角（約 6～8px）、細緻下方陰影。
- 次要登入按鈕：白底、青藍描邊、深色文字。
- 高度約 34～40px，水平 padding 約 16～22px。
- Hover 建議使用稍深底色與輕微上移；focus 必須保留清楚外框。
- 首頁按鈕不應沿用登入／註冊圖中的大型綠色膠囊按鈕，因為首頁參考圖的 CTA 語彙不同。

### 3.5 卡片風格

- 白底、三欄等寬、內容置中。
- 上方為線性圖示，中間卡片標題，下方兩行左右說明。
- 約 8～10px 圓角。
- 1px 淺灰藍邊框。
- 陰影非常輕，主要用於與淡色背景分層。
- 卡片內距約 24～32px，卡片間距約 18～24px。

### 3.6 圓角、陰影與邊框

- Header 底部只有極淡分隔線或陰影。
- CTA 陰影比卡片明顯，但仍屬柔和風格。
- 卡片邊框低對比，避免目前系統某些 Auth 卡片使用的 3px 深色框與 8px 實心偏移陰影。
- 首頁不使用過大的 20px 以上圓角；視覺更偏專業 SaaS／分析平台。

### 3.7 區塊間距與留白

- Header 內容最大寬度約 860～900px，左右保留 8%～10% 空間。
- Hero 上下 padding 約 70～90px；左右欄中間約 40～64px。
- 標題、內文、CTA 垂直間距約 18～28px。
- Hero 與功能區有明顯背景色切換，不依賴粗分隔線。
- 功能區標題上方約 50～70px，下方卡片約 30～40px。
- 大量留白是主要視覺特徵，不宜塞入現有問卷表格或搜尋表單。

### 3.8 桌面與手機布局推論

參考圖只有 1024px 桌面版，沒有手機稿，以下是合理推論而非已確認規格：

- 桌面 ≥ 992px：Header 三區排列；Hero 兩欄約 45%／55%；功能卡三欄。
- 平板 768～991px：縮小 Hero 標題與插圖，兩欄仍可保留或在較窄寬度改堆疊；功能卡可三欄或 2+1。
- 手機 < 768px：導覽選單需折疊或只保留核心 CTA；Hero 改為單欄，文案在上、插圖在下；文字置中或維持左對齊需視品牌選擇；CTA 建議接近滿寬。
- 手機功能卡改單欄；頁面左右 padding 約 16～20px；裝飾網路線應裁切或隱藏，避免水平溢位。
- 插圖必須 `max-width: 100%` 並保留寬高比；目前尚未提供可直接使用的原始插圖資產，不能從參考截圖任意裁切當正式素材。

## 4. 現有 Angular 架構

### 4.1 基本資訊

| 項目 | 現況 |
|---|---|
| Angular 版本 | `17.2.x`（package.json 使用 `^17.2.0`） |
| 架構 | NgModule，不是 Standalone Component |
| 啟動方式 | `main.ts` 啟動 `AppModule` |
| 樣式格式 | CSS；未發現 SCSS |
| package.json | `frontend/package.json` |
| AppModule | `frontend/src/app/app.module.ts` |
| Routing Module | `frontend/src/app/app-routing.module.ts` |
| 全域樣式 | `frontend/src/styles.css`，由 `angular.json` 載入 |
| 根元件 | `AppComponent`：固定 Navbar + `<router-outlet>`，沒有 Layout 抽象 |

### 4.2 現有共用版面元件

- Header／Navbar：`NavbarComponent`，固定存在於所有路由上方。
- Footer：無。
- Layout Component：無。
- Navbar 目前為 64px 深藍底，與首頁參考圖的白色 Header 有明顯差異。
- 多數頁面 Component 使用 inline template；Navbar 也使用 inline styles。

### 4.3 AuthService 能力

`AuthService` 目前可提供：

- `user`：目前會員摘要，包含 token、id、name、email、phone、role。
- `user$`：BehaviorSubject 對外 Observable。
- `token`：目前 token。
- `isAdmin`：角色是否為 `ADMIN`。
- `login()`、`register()`、`updateProfile()`。
- `clearSession()`、`logout()`。
- 以 `localStorage.survey_auth` 恢復登入摘要。

首頁因此可以依現況安全地決定「顯示登入／註冊 CTA」或「顯示會員入口／後台入口」，但前端角色只應控制顯示；後端仍是最終授權來源。

## 5. 現有路由表

| 路由 | Component／行為 | 權限 |
|---|---|---|
| `/` | redirect 到 `/quiz` | 公開 |
| `/quiz` | `QuizListComponent`，問卷列表／搜尋頁 | 公開 |
| `/quiz/:id/form` | `QuizFormComponent` | 公開 |
| `/quiz/:id/confirm` | `QuizConfirmComponent` | 公開 |
| `/quiz/:id/stats` | `QuizStatsComponent` | 公開 |
| `/login` | `LoginComponent` | 公開 |
| `/register` | `RegisterComponent` | 公開 |
| `/member/profile` | `ProfileComponent` | `AuthGuard` |
| `/admin` | `AdminListComponent` | `AdminGuard` |
| `/admin/new` | `AdminEditComponent` | `AuthGuard` |
| `/admin/:id/edit` | `AdminEditComponent` | `AdminGuard` |
| `/admin/:id/detail` | `AdminDetailComponent` | `AdminGuard` |
| `**` | redirect 到 `/quiz` | 公開 |

建立問卷實際路由為 `/admin/new`。它目前允許任何已登入使用者進入，而 `/admin`、編輯與詳細頁限制管理員。

## 6. 首頁預計包含的區塊

1. 沿用或調整 Navbar：品牌、填寫問卷、依登入狀態顯示登入／註冊、會員資料、建立問卷、後台管理。
2. Hero：動態問卷價值主張、簡短說明、主要 CTA、次要 CTA、問卷／統計主題插圖。
3. 核心功能區：三張卡片，建議對應「快速建立問卷」「彈性題型與填答」「即時統計分析」。這些是問卷功能，不引用購物內容。
4. 可選流程區：建立 → 發布 → 填答 → 統計；是否加入須先確認首頁長度需求。
5. 最終 CTA：前往填寫問卷或登入建立問卷。
6. Footer：目前不存在；是否新增需確認，不應在第一輪擅自擴張。

## 7. 預計 Design System

建議以首頁專用語意 token 建立，先作用於 `.homepage` 範圍，確認後再決定是否提升為全站 token：

```text
color-brand-600 / color-brand-700
color-brand-soft
color-surface / color-surface-muted
color-text-strong / color-text-body / color-text-muted
color-border-subtle
space-1 ... space-8
radius-button / radius-card
shadow-button / shadow-card
container-home
font-hero / font-section-title / font-card-title / font-body
```

設計原則：

- 8px 間距系統。
- 首頁容器約 1100～1200px；與現有 `.container` 的 1100px 基線相容。
- Button 至少具 default、hover、focus-visible、disabled。
- 卡片與 Hero 使用低對比邊框和柔和陰影。
- 響應式斷點先採 768px、992px，實作時依內容測試微調。
- 尊重 `prefers-reduced-motion`；不加入不必要的大幅動畫。

## 8. 首頁按鈕與實際路由

| 首頁元素 | 建議文字 | 實際路由／行為 |
|---|---|---|
| Header 公開主入口 | 填寫問卷 | `/quiz` |
| Header 訪客入口 | 登入 | `/login` |
| Header 訪客 CTA | 免費註冊 | `/register` |
| Hero 主要 CTA | 開始填寫問卷 | `/quiz` |
| Hero 次要 CTA（訪客） | 登入建立問卷 | `/login?returnUrl=/admin/new` |
| Hero 次要 CTA（已登入） | 建立問卷 | `/admin/new` |
| 會員入口 | 修改會員資料 | `/member/profile` |
| 管理員入口 | 後台管理 | `/admin` |

不應使用參考圖中的英文產品名稱、Solutions、Pricing 或 Free Trial 文案；只借用布局與視覺語彙。

## 9. 預計新增或修改檔案（後續階段）

本階段沒有執行以下變更，僅列規劃：

### 預計新增

- `frontend/src/app/pages/home/home.component.ts`
- 視現有 inline-template 慣例決定是否同檔使用 template/styles；若拆分則新增 `.html`、`.css`。
- `frontend/src/assets/` 下的首頁正式插圖或裝飾資產；必須由使用者提供或另行授權生成。

### 預計修改

- `frontend/src/app/app.module.ts`：宣告 Home Component。
- `frontend/src/app/app-routing.module.ts`：讓 `/` 顯示首頁，保留 `/quiz` 為問卷列表。
- `frontend/src/app/components/navbar/navbar.component.ts`：依首頁設計與登入狀態調整導覽。
- `frontend/src/styles.css`：只加入經確認的共用 token；首頁細節優先 component-scoped。
- 必要時 `frontend/src/app/app.component.ts`：若 Header／Footer 需要路由式 Layout，再做最小調整。

## 10. 可能的樣式衝突

- 現有全域 `.container`、`.card`、`.btn`、`.btn-primary` 名稱過於通用；首頁若直接沿用可能受到既有表單／後台樣式牽動。
- 全域 `* { margin: 0; padding: 0; }` 會影響標題、段落與列表，首頁必須明確定義垂直節奏。
- Navbar 使用 inline styles，首頁 CSS 無法自然覆寫，強行覆寫會造成 specificity 問題。
- Navbar 現為深藍色；參考圖為白色 Header。若只在首頁改色，需要路由感知或 Layout；若全站改色，會影響所有現有頁面。
- Auth 頁使用大型圓角、粗黑框與硬陰影，與首頁專業 SaaS 風格不同；不應把 Auth token 直接當首頁卡片樣式。
- 現有 `main` 固定 `padding-bottom: 40px`，首頁全寬背景分區可能需要檢查底部空白。
- `Plus Jakarta Sans` 被列為首選但沒有確認載入；不同電腦可能回退到 Segoe UI，造成字寬和換行差異。
- 多數既有頁面使用 inline style，未來若擴大全站 Design System，需避免一次大規模重構。

## 11. 尚待確認事項

1. 首頁正式品牌名稱與 Hero 中文文案。
2. `homePage.jpg` 右側插圖只有截圖，是否有原始透明背景素材；若沒有，需另行提供或在下一階段授權生成。
3. Header 是否只在首頁改為白色，或全站統一改版。
4. 手機 Header 使用漢堡選單、簡化連結或允許換行。
5. 是否需要首頁 Footer、流程區、客戶案例或數字指標。
6. 首頁根路由是否確定由 `/quiz` 改成新的 Home Component。
7. 訪客 Hero 次要 CTA 是否直接進登入並帶 `returnUrl=/admin/new`。
8. 首頁功能卡是否可使用現有 SVG／CSS icon，或需提供正式 icon 素材。
9. 首頁需不需要顯示即時問卷資料；若需要才涉及 API，本規劃目前假設純展示內容。
10. 參考圖只有桌面版，手機布局仍屬推論，需在實作後以實際裝置寬度驗收。

## 12. 分階段實作建議

### 階段 A：確認內容與資產

- 確認品牌、Hero 文案、CTA、功能卡文案與插圖來源。
- 決定 Header 是首頁專用或全站共用改版。
- 確認 `/` 改為首頁的產品決策。

### 階段 B：建立首頁骨架

- 新增 Home Component 與 `/` 路由。
- 完成 Header、Hero、三卡片區的語意 HTML。
- 所有按鈕先接到既有實際路由，不修改認證規則。

### 階段 C：Design System 與響應式

- 建立首頁 scoped tokens、按鈕、卡片、容器與字體層級。
- 完成桌面、平板、手機斷點。
- 檢查鍵盤 focus、對比度、reduced motion 與圖片替代文字。

### 階段 D：整合 Navbar 與登入狀態

- 使用現有 AuthService 切換登入／註冊、建立問卷、會員資料與管理員入口。
- 驗證訪客、會員、管理員三種 Header 狀態。
- 不把前端角色顯示當成後端授權。

### 階段 E：回歸驗證

- Angular build 與既有測試。
- 驗證 `/quiz`、`/login`、`/register`、`/admin/new`、`/member/profile`、`/admin`。
- 以 375px、768px、1024px、1440px 檢查排版與水平溢位。
- 確認首頁樣式沒有污染表單、統計與後台頁面。
