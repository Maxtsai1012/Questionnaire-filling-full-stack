# Token Version 撤銷實作

## 修改前安全問題

原本登出只刪除 Angular 保存的 JWT；若舊 JWT 已被複製，在到期前仍可呼叫受保護 API。此階段加入帳號版本，讓伺服器能立即撤銷已簽發的 JWT。

## 架構

```text
登入 → 讀取 app_user.token_version → 簽入 JWT tokenVersion
請求 → 驗證簽章與 exp → 解析 userId／tokenVersion → 載入使用者
     → JWT version 等於 DB version → 建立 SecurityContext
登出 → Principal userId → DB 原子加一 → 舊版本 JWT 全部失效
```

Claim 缺失、非整數、負數、使用者不存在或版本不一致時不建立認證；受保護 API 最終沿用既有 JSON 401 Handler。公開 API 沒有 Bearer Token 時維持可用；帶入錯誤 Token 不會造成 500。

## Schema Migration

- Migration：`docs/requirements/migrations/V20260805__add_token_version.sql`
- 欄位：`app_user.token_version INT NOT NULL DEFAULT 0`
- 既有資料庫先查 `information_schema.COLUMNS`，欄位不存在才執行單一 `ALTER TABLE`。
- 未執行完整 `init.sql`，也未刪除或重建資料。
- 根目錄 `init.sql` 已同步欄位，僅供新環境初始化。

## Entity 與 Repository

`AppUser` 新增不可為 null 的 `Integer tokenVersion`，Java 預設與 `@PrePersist` 都保證新會員為 0。該欄位未加入任何 Request DTO 或 API Response。

`AppUserRepository.incrementTokenVersion(userId)` 使用 JPQL：

```text
tokenVersion = tokenVersion + 1 where id = :userId
```

更新在 Transaction 中執行，回傳筆數必須為 1；未採用「先查詢、Java 加一、再儲存」。

## JWT Claim 與驗證

新 JWT 保留 `sub`、`iat`、`exp`，並加入整數 `tokenVersion`。簽發值只來自已載入的 `AppUser`。解析器嚴格拒絕 Claim 缺失、非 `Integer` 或負數；Filter 載入最新使用者後比對資料庫版本，相同才建立 Authentication。

JWT 不包含密碼、密碼雜湊、手機、角色或 Secret。穩定篡改測試仍使用「解碼 signature、XOR 第一個 byte、重新 Base64URL 編碼」，未退回修改最後字元的做法。

## Logout API

`POST /api/auth/logout` 必須通過 Spring Security 認證，回應固定為 `200 OK`。Controller 只從 `UserPrincipal` 取得 userId，不讀取 Request Body 或 Query String，因此 body 中偽造其他 userId 不會影響其他帳號。

登出採帳號層級 **Logout All Sessions**：任一裝置成功登出，該帳號所有舊版本 JWT 一起失效；其他會員的版本不變。

## Angular 登出流程

現有 `AuthService.logout()` 只送出一次 `POST /api/auth/logout`。既有 HTTP Interceptor 將 JWT 放在 `Authorization: Bearer`；Request Body 是空物件，URL 與 Body 都沒有 Token。

成功或失敗都會執行同一個本機清理流程：移除 localStorage、sessionStorage、登入摘要與 BehaviorSubject，接著導向公開問卷頁。失敗時使用 `logout=local-only` 保留「伺服器未確認」的非敏感提示狀態，且 Observable error 已處理，不會形成未處理 Console Error。`logoutInProgress` 防止重複點擊送出多次 Request。

## Seeder 相容

Local Seeder 只在 `local` Profile 執行。新帳號由 Entity 預設版本 0；既有帳號載入後修改姓名、Email、電話、密碼與角色時，不會覆寫 `tokenVersion`。測試確認重複執行不重建帳號，也不把既有版本重設為 0；Legacy SHA-256 登入流程保持不變。

## 離線登出限制

若 Logout Request 因斷線或伺服器無回應而未送達，Angular 仍會清除本機狀態，但資料庫版本不會增加；已被複製的 JWT 可能持續有效至到期。系統目前沒有 Refresh Token 或單一裝置 Session，因此無法只撤銷目前裝置。

## 下一階段建議

Token Version 階段完成後，可獨立規劃 Legacy SHA-256 至 BCrypt 的漸進式遷移；不應與 Refresh Token、問卷 ownership 或本階段 Schema 混合修改。
