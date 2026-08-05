# 登入、註冊與會員頁 UI 實作紀錄

## 1. 修改前現況

### 登入頁

- 實際檔案：`frontend/src/app/pages/auth/login.component.ts`。
- 使用 Template-driven Form（`ngModel`）。
- 欄位：Email、密碼。
- API：透過既有 `AuthService.login()` 呼叫 `POST /api/auth/login`。
- 成功導向：保留 `returnUrl`；無 returnUrl 時 ADMIN 前往 `/admin`，MEMBER 前往 `/quiz`。
- 失敗顯示：原本只有卡片底部單一錯誤文字，沒有欄位驗證、loading 或重複送出保護。

### 註冊頁

- 實際檔案：`frontend/src/app/pages/auth/register.component.ts`。
- 使用 Template-driven Form（`ngModel`）。
- API 欄位：姓名、手機、Email、密碼。
- API：透過既有 `AuthService.register()` 呼叫 `POST /api/auth/register`。
- 成功導向：保留前往 `/quiz`。
- 原本沒有確認密碼、欄位級錯誤、loading 或重複送出保護。

### 會員資料頁

- 實際檔案：`frontend/src/app/pages/member/profile.component.ts`。
- 使用 Template-driven Form（`ngModel`）。
- 可修改：姓名、手機、可選新密碼。
- 唯讀：Email；角色不可修改。
- API：透過既有 `AuthService.updateProfile()` 呼叫 `PUT /api/auth/me`。
- 已有修改密碼能力，新密碼空白時不修改。
- 路由 `/member/profile` 保留既有 `AuthGuard`。

## 2. 沿用的首頁 Design System

直接沿用 `frontend/src/styles.css` 中既有的：

- `--ds-color-*` 色彩 tokens。
- `--ds-font-*` 字體與層級。
- `--ds-space-*` 間距 scale。
- `--ds-radius-*`、`--ds-shadow-*`、focus ring。
- `.ds-button`、`.ds-button--primary`、`.ds-button--outline`、`.ds-badge`。

沒有建立第二套 tokens，也沒有引入 UI 套件。

## 3. 共用樣式與頁面框架

在既有 `frontend/src/styles.css` 增加 scoped `.account-*` 共用樣式：

- `.account-page`、`.account-panel`、`.account-heading`。
- `.account-form`、`.account-field`、輸入框 hover／focus／readonly／error。
- `.account-alert--success`、`.account-alert--error`。
- `.account-submit`、`.account-spinner`、`.profile-actions`。
- `.account-footer`、手機版單欄表單與按鈕排列。

全站 Header 繼續使用既有 `NavbarComponent`；三頁使用一致的輕量 Footer 結構與共用樣式，沒有重建 App Layout。

## 4. 表單互動改善

### 登入

- 空白 Email／密碼與 Email 格式欄位級驗證。
- 欄位變更時清除該欄位過期錯誤與伺服器錯誤。
- 送出期間鎖定按鈕並顯示「登入中…」。
- API 失敗顯示於 `role="alert"` 區塊。
- 保留原有 ADMIN／MEMBER 與 returnUrl 導向。

### 註冊

- 姓名、手機、Email、密碼與確認密碼同時驗證。
- 確認密碼只用於前端比對，不送往後端。
- 手機規則沿用後端 `09` 加 8 位數；姓名格式與會員更新規則一致。
- 後端沒有密碼長度規則，因此未自行增加強度限制。
- API 錯誤（包含 Email 重複）顯示於表單內。
- 送出期間鎖定按鈕並顯示「註冊中…」。

### 會員資料

- Email 與角色以唯讀方式顯示，角色轉為「一般會員／管理員」。
- 姓名與手機維持既有格式檢查。
- 新密碼仍為可選，沒有顯示或讀取任何密碼／雜湊。
- 儲存期間鎖定取消及儲存按鈕，顯示「儲存中…」。
- 成功與失敗使用一致的 status／alert 樣式。

所有輸入框具正確 `label for`／`id`，錯誤欄位使用 `aria-invalid` 與 `aria-describedby`。

## 5. 修改檔案

- `frontend/src/app/pages/auth/login.component.ts`
- `frontend/src/app/pages/auth/register.component.ts`
- `frontend/src/app/pages/member/profile.component.ts`
- `frontend/src/styles.css`
- `docs/requirements/auth-pages-ui-implementation.md`
- `docs/requirements/auth-pages-ui-verification-report.md`

## 6. 保留不變的行為

- `AuthService`、BehaviorSubject 與 localStorage key 未修改。
- `/api/auth/login`、`/api/auth/register`、`/api/auth/me` 未修改。
- Token 格式與傳送方式未修改。
- 登入成功角色導向、註冊成功導向、returnUrl 與 Guard 未修改。
- 後端、資料庫、角色權限規則均未修改。

## 7. 發現但未處理的認證問題

- 後端目前只要求密碼非空白，沒有長度或複雜度規格；本階段未自行建立不同規則。
- 登入與會員 API 需要可用後端及測試帳號才能完成成功／失敗整合測試，本次環境沒有提供測試帳號。
- 登出後仍沿用既有行為導向 `/quiz`。

## 8. 下一階段建議

1. 準備 MEMBER／ADMIN 測試帳號與獨立測試資料庫，完成登入、修改資料與 API 錯誤人工驗收。
2. 使用可設定 viewport 的瀏覽器完成 1440、768、390 三尺寸視覺驗收。
3. 若要制定密碼強度規則，應由前後端共同確認後另階段實作，不應只加前端限制。
