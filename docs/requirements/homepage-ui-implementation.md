# 首頁與前端設計系統實作紀錄

## 1. 技術基線

| 項目 | 實際結果 |
|---|---|
| Angular 版本 | Angular `17.2.x`（`package.json` 為 `^17.2.0`） |
| 架構 | NgModule；`main.ts` 啟動 `AppModule` |
| 樣式格式 | 一般 CSS |
| 路由定義 | `frontend/src/app/app-routing.module.ts` |
| UI 套件 | 未使用 Angular Material、Bootstrap；既有依賴只有 Angular、RxJS、Chart.js 等 |
| package.json | `frontend/package.json` |

專案沒有 `app.config.ts` 或 `app.routes.ts`，實際架構不是 Standalone Component。

## 2. UI 參考圖片

主要參考圖片：

```text
docs/ui-reference/homePage.jpg
```

尺寸為 1024 × 780。實作只參考視覺語言與版面，沒有把圖片直接放入頁面或當成背景，也沒有複製購物業務內容。

### 參考圖設計規範

- 主色：深青藍，實作值 `#1f8196`；hover 使用 `#17697c`。
- 輔助色：藍灰 `#526b78`；Accent 使用柔和青綠 `#35a995`。
- 背景：淡藍灰 `#f4f8fb`；Surface 為白色。
- 文字：主文字深藍灰 `#17232c`，次文字 `#52616b`。
- Header：白底、細邊框、水平導覽與青藍 CTA。
- Hero：桌面雙欄，左側標題、說明與 CTA，右側以 HTML/CSS 製作統計示意圖。
- 字級：Hero 約 48px、區塊標題 28px、卡片標題 18px、內文 16px。
- 按鈕：8px 圓角、至少 40px 高，提供 primary、secondary、outline 與 focus 樣式。
- 卡片：白底、1px 淡色邊框、10px 圓角與低對比陰影。
- 間距：4、8、12、16、24、32、48、64px scale。
- 最大內容寬度：1120px。
- 響應式：桌面雙欄／三卡；平板 Hero 單欄、卡片 2+1；手機單欄與滿寬 CTA。
- 整體風格：簡潔、柔和、現代 SaaS／資料分析介面。

## 3. Design System

Design tokens 位於 `frontend/src/styles.css`，使用 `--ds-*` 命名，避免影響既有問卷、登入、表格與後台樣式。

涵蓋：

- Primary、Primary hover、Secondary、Accent、Background、Surface。
- Text primary、Text secondary、Border、Success、Warning、Error。
- 標題、卡片、內文、輔助文字、按鈕與表單提示字級。
- spacing scale、圓角、邊框、陰影、focus ring、1120px 容器及 section 間距。
- `.ds-button`、`.ds-card`、`.ds-section-container`、`.ds-badge` 等 opt-in 共用樣式。

沒有安裝或引入新的 UI Framework。

## 4. 首頁實作

首頁使用 Angular Template、HTML 與 Component CSS 實作，包含：

1. Header／Navigation。
2. Hero 與純 HTML/CSS 統計視覺。
3. 瀏覽填寫、建立問卷、查看統計三項功能卡。
4. 尋找或建立 → 填寫與分享 → 查看回覆與統計流程。
5. 依訪客、MEMBER、ADMIN 顯示的 CTA。
6. CTA 行動呼籲與 Footer。

公開入口使用 `/quiz`、`/login`、`/register`；建立問卷使用既有 `/admin/new`，訪客透過既有 `returnUrl` 登入流程。沒有假按鈕或不存在路由。

## 5. 路由前後差異

原本根路由：

```text
'' → redirectTo: 'quiz'
```

修改後：

```text
'' → HomeComponent
/home → HomeComponent
/quiz → QuizListComponent
```

原問卷列表與搜尋功能完整保留在 `/quiz`；登入 `/login`、註冊 `/register`、會員與後台路由維持原路徑與 Guard。

## 6. 新增檔案

- `frontend/src/app/pages/home/home.component.ts`
- `frontend/src/app/pages/home/home.component.html`
- `frontend/src/app/pages/home/home.component.css`
- `docs/requirements/homepage-ui-implementation.md`
- `docs/requirements/homepage-ui-verification-report.md`

## 7. 修改檔案

- `frontend/src/styles.css`：新增 namespaced Design System。
- `frontend/src/app/app.module.ts`：宣告 HomeComponent。
- `frontend/src/app/app-routing.module.ts`：加入首頁並將根路由指向首頁。
- `frontend/src/app/components/navbar/navbar.component.ts`：整合現有角色顯示與小畫面導覽。
- `frontend/src/index.html`：將錯誤的 `<!html>` 修正為標準 `<!doctype html>`，排除 Angular dev server 500。

## 8. 尚未完成項目

- 瀏覽器工具未提供本次可用的 viewport 調整與指定路徑截圖能力，因此沒有產生 1440、768、390 三張驗證截圖。
- 尚未用真實 MEMBER、ADMIN 帳號完整操作登入與登出流程；角色模板已通過 Angular 編譯。
- 登入頁仍有既有的非問卷文案，不屬於首頁任務，未修改。

## 9. 下一階段建議

1. 在可調整 viewport 的瀏覽器中完成 1440 × 900、768 × 1024、390 × 844 人工驗收。
2. 使用真實 MEMBER／ADMIN 帳號驗證角色導覽與登出即時切換。
3. 後續若要統一全站視覺，再逐頁採用 `.ds-*`，不要一次覆寫既有表單與後台樣式。
