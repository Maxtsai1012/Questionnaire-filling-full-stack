# 首頁 UI 驗證報告

## 1. 技術基線確認

| 項目 | 實際結果 |
|---|---|
| Angular 版本 | 17.2.x |
| 架構 | NgModule |
| 樣式格式 | CSS |
| 根路由位置 | `frontend/src/app/app-routing.module.ts` |
| UI 參考圖片 | `docs/ui-reference/homePage.jpg`（1024 × 780） |

## 2. 修改檔案

| 檔案路徑 | 修改內容 | 修改原因 |
|---|---|---|
| `frontend/src/styles.css` | 新增 `--ds-*` tokens 與 opt-in 共用元件樣式 | 建立可維護、避免污染既有頁面的 Design System |
| `frontend/src/app/pages/home/home.component.ts` | 建立首頁並注入既有 AuthService | 顯示首頁及既有登入角色狀態 |
| `frontend/src/app/pages/home/home.component.html` | Header、Hero、功能、流程、CTA、Footer | 實作真正的 Angular 首頁 |
| `frontend/src/app/pages/home/home.component.css` | 參考圖視覺與 900／600px 響應式規則 | 支援桌面、平板與手機排列 |
| `frontend/src/app/app.module.ts` | 宣告 HomeComponent | 符合現有 NgModule 架構 |
| `frontend/src/app/app-routing.module.ts` | `/` 與 `/home` 顯示首頁，保留 `/quiz` | 首頁成為預設入口且不移除舊功能 |
| `frontend/src/app/components/navbar/navbar.component.ts` | 既有角色導覽與小畫面可用性 | 保留功能並避免窄畫面溢位 |
| `frontend/src/index.html` | `<!html>` 改為 `<!doctype html>` | 修正 Vite parse5 500，讓執行時驗證可進行 |
| `docs/requirements/homepage-ui-implementation.md` | 實作紀錄 | 文件要求 |
| `docs/requirements/homepage-ui-verification-report.md` | 驗證證據與結論 | 文件要求 |

## 3. 驗證指令

實際執行：

```text
Get-Content frontend/package.json、angular.json、main.ts、index.html、AppModule、Routing Module
Get-ChildItem docs/ui-reference 並讀取圖片尺寸
git diff --check -- <本階段相關前端檔案>
npm run build
npm start -- --host 127.0.0.1 --port 4200
curl.exe --noproxy * http://127.0.0.1:4200/<各路由>
Browser DOM snapshot：/、/quiz、/login、/admin/new
```

`package.json` 只有 `start`、`build`、`watch`，沒有 lint 或 test script，因此沒有虛構或安裝額外測試工具。

## 4. 驗證結果

| 驗證項目 | 結果 | 證據或說明 |
|---|---|---|
| 靜態檢查 | PASS | `git diff --check` 通過；Angular template、TypeScript、CSS 均完成 production 編譯 |
| Angular Build | PASS | `npm run build` 成功；main bundle 584.17 kB，輸出至 `frontend/dist/survey-frontend` |
| 前端測試 | NOT AVAILABLE | package scripts 沒有 test／lint |
| 根路由首頁 | PASS | `/` HTTP 200；Browser DOM 顯示首頁 Header、Hero、功能、流程、CTA、Footer |
| `/home` | PASS | HTTP 200 |
| 原問卷頁 | PASS | `/quiz` HTTP 200；Browser DOM 顯示「問卷列表（前台）」與搜尋表單 |
| 登入路由 | PASS | `/login` HTTP 200；Browser DOM 顯示登入表單 |
| 註冊路由 | PASS | `/register` HTTP 200 |
| 建立問卷訪客流程 | PASS | `/admin/new` HTTP 200；Browser DOM 確認 AuthGuard 顯示登入頁；首頁連結帶 `returnUrl=/admin/new` |
| 未知路由 | PASS | `/route-that-does-not-exist` HTTP 200，由 Angular wildcard 處理，無循環 redirect |
| Refresh／資源入口 | PASS | dev server 對 `/`、`/home`、`/quiz`、`/login`、`/register`、`/admin/new` 均回傳 200 |
| Console | NOT VERIFIED | Browser DOM 可正常讀取，但本次瀏覽器控制介面無可用 Console 擷取操作 |
| Network 首頁資源 | PASS | 首頁沒有外部圖片資產；HTML 入口及主要路由均為 200 |
| Desktop 1440 × 900 | NOT VERIFIED | CSS 桌面結構已編譯；無法在工具中設定指定 viewport 並截圖 |
| Tablet 768 × 1024 | NOT VERIFIED | 已建立 `max-width: 900px` 規則；未完成指定尺寸視覺截圖 |
| Mobile 390 × 844 | NOT VERIFIED | 已移除 1024px 最小寬度並建立 `max-width: 600px` 單欄規則；未完成指定尺寸視覺截圖 |

## 5. 發現的問題

### 問題一：Angular 開發伺服器所有路由回傳 500

- 錯誤內容：Vite `parse5 error code incorrectly-opened-comment`。
- 錯誤位置：`frontend/src/index.html:1` 的 `<!html>`。
- 是否由本次首頁修改造成：否，為既有 HTML 宣告錯誤。
- 已採取修正：改為標準 `<!doctype html>`。
- 修正後結果：`/` 與所有受測路由均回傳 HTTP 200，Browser 可讀取頁面 DOM。

### 問題二：首頁強制最小寬度造成小畫面水平捲動

- 錯誤內容：`.home-page { min-width: 1024px; }` 無法符合 768 與 390 寬度。
- 錯誤位置：`frontend/src/app/pages/home/home.component.css`。
- 是否由本次首頁修改造成：是，來自先前只製作桌面版的需求。
- 已採取修正：移除最小寬度，新增平板與手機 media queries，卡片與流程於手機改為單欄。
- 修正後結果：CSS 與 Angular Build 通過；指定尺寸視覺仍待人工驗證。

### 問題三：無法產生指定 viewport 截圖

- 錯誤內容：目前瀏覽器控制介面不提供本次可用的 viewport 調整方法。
- 錯誤位置：驗證工具限制，不是專案程式錯誤。
- 是否由本次修改造成：否。
- 已採取修正：完成 HTTP 與 Browser DOM 驗證，未虛報視覺結果。
- 修正後結果：三尺寸標記為 NOT VERIFIED，未建立 `docs/requirements/verification/homepage/` 截圖。

## 6. 階段結論

```text
階段結果：CONDITIONAL PASS
是否可以進行下一階段：是
原因：Angular Build、根路由首頁、問卷列表、登入與建立問卷既有流程均可正常使用，且沒有本次修改造成的阻斷性錯誤；但指定的三種 viewport 與 Console 尚未取得實際驗證證據。
下一階段建議：先以可調整 viewport 的瀏覽器完成 1440、768、390 三尺寸人工驗收與 Console 檢查，再進行其他頁面的 Design System 整合。
```
