# Spring Security＋Bearer JWT 實作說明

## 修改前架構

- `AuthService` 以硬編碼 HMAC Secret 產生自製 `userId.expiry.signature` Token。
- Angular 透過 `X-Auth-Token` 傳送 Token。
- `/api/admin/**` 由 MVC `AdminAuthorizationInterceptor` 判斷 `ADMIN` 字串。
- `/api/auth/me`、會員更新、會員建立問卷與會員填答由 Controller 手動呼叫 `authenticate()`。
- 未登入 `/api/auth/me` 回傳 403，安全邊界分散。

## 修改後架構

```text
Authorization: Bearer JWT
→ JwtAuthenticationFilter
→ JwtTokenProvider 驗證 HMAC 簽章、exp 與 numeric sub
→ UserDetailsServiceImpl 依 userId 重新讀取 app_user
→ UserPrincipal 集中映射 ROLE_MEMBER／ROLE_ADMIN
→ SecurityContext
→ SecurityFilterChain 授權
→ Controller 使用 @AuthenticationPrincipal
```

採 `SessionCreationPolicy.STATELESS`。CSRF 已停用，原因是 API 不使用 Cookie Session 做身份驗證，憑證只由 `Authorization` Header 傳送。CORS 仍由既有 `CorsConfig` 控制。

## JWT 規格

| Claim | 內容 |
|---|---|
| `sub` | 不可變的 `app_user.id` 數字字串 |
| `iat` | 簽發時間 |
| `exp` | 到期時間 |

JWT 不包含角色、Email、手機、密碼或雜湊。Filter 每次依 `sub` 從資料庫載入最新角色，所以資料庫角色變更會在下一個 Request 生效。未知角色會拒絕建立 Principal，不會預設為 ADMIN。

## Secret 設定

```yaml
app:
  security:
    jwt:
      secret: ${JWT_SECRET}
      expiration-seconds: ${JWT_EXPIRATION_SECONDS:86400}
```

`JWT_SECRET` 必填且至少 32 UTF-8 bytes；缺少、過短或 expiration 非正數會啟動失敗。Repository 只包含環境變數參照，沒有真實 Secret。

## SecurityFilterChain

| 規則 | 權限 |
|---|---|
| `/api/auth/login`、`/api/auth/register` | 公開 |
| `/api/quiz/**` | 公開；若附合法 Bearer JWT，Filter 仍建立 Principal |
| `/api/auth/me`、`/api/member/**` | authenticated |
| `/api/admin/**` | `ROLE_ADMIN` |
| Swagger／OpenAPI | 公開 |
| 其他未列 API | denyAll |

訪客存取受保護 API 由 `RestAuthenticationEntryPoint` 統一回傳 JSON 401；已登入但無權限由 `RestAccessDeniedHandler` 統一回傳 JSON 403。

## Authority 映射

| 資料庫 role | Spring Authority |
|---|---|
| `MEMBER` | `ROLE_MEMBER` |
| `ADMIN` | `ROLE_ADMIN` |

映射只存在於 `UserPrincipal.from(...)`，Controller 不再自行拼接或比對 ADMIN。

## Legacy SHA-256 相容

本階段刻意不遷移密碼資料。`LegacySha256PasswordEncoder` 集中實作既有 SHA-256 encode／constant-time matches，供登入、註冊、會員改密碼及 `LocalTestAccountSeeder` 共用。這只是相容元件，不代表 SHA-256 已達 BCrypt 的密碼安全性。

## Angular Bearer 流程

- `AuthInterceptor` 只對相對路徑 `/api/` 加入 `Authorization: Bearer <JWT>`，不會送到第三方網址或 Query String。
- 登入／註冊 401 不觸發導向，避免無限循環並保留表單錯誤。
- 其他 401 清除狀態並帶目前 URL 導向登入。
- 403 不登出有效會員，由既有 Guard／頁面顯示安全導向。
- 啟動時 `validateStoredSession()` 呼叫 `/api/auth/me`；回應摘要會與原 Token 合併，無效 Token 則清除。
- 舊的非 JWT localStorage 格式會安全清除。

## 移除的 Legacy 機制

| 舊機制 | 狀態 | 替代方式 |
|---|---|---|
| `X-Auth-Token` | 已移除 | `Authorization: Bearer JWT` |
| `AuthService.authenticate()` | 已移除 | JWT Filter＋SecurityContext |
| 硬編碼自製 Token Secret／簽章 | 已移除 | 環境 Secret＋JJWT |
| `AdminAuthorizationInterceptor` | 已刪除 | SecurityFilterChain |
| MVC Interceptor 註冊 | 已移除 | Spring Security Filter Chain |
| Controller 手動 Header 驗證 | 已移除 | `@AuthenticationPrincipal` |

## 已知限制與下一階段

1. 登出尚無撤銷，複製的 JWT 到期前仍可能有效。
2. 尚無 Refresh Token、Blacklist、Token Version。
3. 密碼仍是 Legacy SHA-256；下一階段可在成功登入後逐筆升級 BCrypt。
4. 問卷 ownership 未建模；後續需新增 owner 欄位與資料遷移後才能實作資源級授權。

