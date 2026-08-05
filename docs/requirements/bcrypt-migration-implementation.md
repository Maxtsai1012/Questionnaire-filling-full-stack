# BCrypt 漸進式遷移實作

## 修改前架構

`LegacySha256PasswordEncoder` 對所有新密碼執行單次 SHA-256，資料庫 `app_user.password_hash` 為 `VARCHAR(64)`。登入由 `AuthService` 查詢會員並比對 Hash，成功後直接以目前 Token Version 簽發 JWT。註冊、Local Seeder 與會員更新密碼都使用相同 SHA-256 元件。

專案沒有 Forgot Password、Reset Password 或 Admin Reset Password；這些功能本階段為 NOT APPLICABLE。既有會員頁的 `newPassword` 是真正修改密碼功能，已同步處理。

## 新密碼架構與格式

- 新密碼格式：`{bcrypt}` 加上 Spring Security BCrypt Hash。
- Legacy 格式：64 位十六進位字元，只允許驗證既有資料。
- 未知前綴、null、空白、截斷 BCrypt 或其他格式一律不匹配，不當作明文。
- 新密碼、註冊、固定帳號新建與真正修改密碼都只產生 BCrypt。

`MigratingPasswordEncoder` 是唯一集中式元件，提供 `encode`、`matches`、`isLegacySha256`、`isBcrypt` 與 `needsUpgrade`。BCrypt 交由 `BCryptPasswordEncoder` 驗證；Legacy SHA-256 使用既有 UTF-8 演算法，並以 `MessageDigest.isEqual` 比較。

BCrypt strength 由 `app.security.password.bcrypt-strength` 設定，環境變數是 `BCRYPT_STRENGTH`，預設 12，允許範圍 4–31。測試直接建立 strength 4 的 Encoder 以縮短測試時間，不影響 local／正式預設。

## 登入成功後升級

```text
查詢會員 → 驗證 Legacy SHA-256 → 產生 `{bcrypt}` Hash
→ CAS 更新 WHERE id 且 password_hash = 舊值
→ 重新讀取會員 → 讀取最新 token_version → 簽發 JWT
```

Repository 的 `upgradePasswordHash` 使用單一 Compare-and-Set JPQL。更新 1 筆表示本次完成；更新 0 筆時重新讀取，若另一個並行登入已升級且仍能匹配原始密碼，就正常登入；若 Hash 已被其他密碼變更取代則拒絕，不覆蓋新密碼。

錯誤密碼不產生新 Hash、不更新資料庫、不簽發 JWT。已是 BCrypt 時不執行 CAS，因此不會每次登入重 Hash。未知或損毀格式對外沿用統一的 401「帳號或密碼錯誤」。

## 新會員與 Seeder

註冊直接使用 `{bcrypt}`，預設角色仍為 MEMBER、Token Version 為 0，Response 不包含 Hash。

Local Seeder 僅處理兩個固定 Demo Email：

- 新建固定帳號：直接 BCrypt。
- 既有密碼可匹配：不重 Hash；Legacy 留待登入升級。
- 密碼不匹配：只對精確固定 Email 以 BCrypt 恢復 Demo 密碼。
- 所有情況均保留既有 Token Version；其他會員完全不處理。

## Token Version 互動

單純把相同密碼的儲存格式從 SHA-256 升級為 BCrypt，不增加 Token Version。JWT 一律在升級與重新載入完成後簽發，Claim 使用資料庫最新版本。

會員真正透過既有個人資料功能修改密碼時，Repository 以單一更新同時寫入 BCrypt 並將 Token Version 加一；舊 JWT 立即失效，Response 回傳以新版本簽發的 JWT。

## Schema Migration

`docs/requirements/migrations/V20260805_02__expand_password_hash_for_bcrypt.sql` 將欄位擴充為 `VARCHAR(255) NOT NULL`。執行前查詢欄位長度，只有小於 255 才執行；未修改任何 Hash、會員識別、Email、角色、Token Version或其他資料表。`init.sql` 只為未來新環境同步，未在既有資料庫重跑。

## 已知限制與下一階段

尚未登入的一般舊會員仍保留 SHA-256；無法在不知道原始密碼時直接批次轉換。系統尚無忘記密碼、Refresh Token 或單裝置 Session。下一階段可規劃安全的忘記密碼／重設密碼流程，或為 BCrypt strength 提供日後的 `upgradeEncoding` 成本調升策略。
