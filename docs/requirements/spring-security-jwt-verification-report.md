# Spring Security＋Bearer JWT 驗證報告

驗證日期：2026-08-05  
階段結果：**PASS**

## 1. 修改檔案

| 類別 | 修改內容 | 原因 |
|---|---|---|
| `backend/pom.xml` | Security、Security Test、JJWT 0.12.6 | 標準 JWT 認證與測試 |
| `application.yml`、local example | JWT Secret／expiration 環境設定 | 移除硬編碼 Secret |
| `security/*`、`SecurityConfig` | Provider、Filter、Principal、Handlers、FilterChain | 集中認證授權 |
| `AuthService`、`AuthDtos` | 簽發 JWT、Bearer metadata、Legacy encoder | 登入遷移與密碼相容 |
| Auth／Front／Member Controller | `@AuthenticationPrincipal` | 移除手動 Token 驗證 |
| `CorsConfig` | 移除 Admin MVC Interceptor | 唯一安全邊界改為 Spring Security |
| Angular AuthService／Interceptor | Bearer Header、儲存格式、401／403 | 前端原子遷移 |
| Tests | JWT Provider、Filter、Seeder 回歸 | 自動驗證 |
| README 與本文件 | 設定、流程、限制與證據 | 操作文件同步 |

## 2. 修改前基準

| 項目 | 結果 |
|---|---|
| Maven Test | PASS，6 tests |
| Angular Build | PASS |
| 既有固定帳號／API 權限 | 依前一階段 PASS 報告確認 |

## 3. 移除舊機制

| 舊機制 | 是否移除 | 替代方式 |
|---|---|---|
| `X-Auth-Token` 程式碼 | 是 | Bearer JWT |
| 自製 Token 驗證 | 是 | `JwtTokenProvider` |
| Admin MVC Interceptor | 是，檔案已刪除 | `SecurityFilterChain` |
| Controller 手動驗證 | 是 | SecurityContext／Principal |
| 硬編碼 Token Secret | 是 | `JWT_SECRET` |

歷史需求文件仍保留當時架構敘述，作為遷移前證據；可執行程式碼與 README 已無 Legacy 認證入口。

## 4. API 權限實測

| 身分 | API | Status | 結果 |
|---|---|---:|---|
| 訪客 | 公開問卷 | 200 | PASS |
| 訪客 | `/api/auth/me` | 401 | PASS |
| 訪客 | 管理 API | 401 | PASS |
| MEMBER | `/api/auth/me` | 200 | PASS |
| MEMBER | 管理 API | 403 | PASS |
| ADMIN | `/api/auth/me` | 200 | PASS |
| ADMIN | 管理 API | 200 | PASS |
| Legacy X Header only | `/api/auth/me` | 401 | PASS |

## 5. JWT

| 項目 | 結果 |
|---|---|
| Bearer Header | PASS |
| userId numeric Subject | PASS |
| `iat`／`exp` 與 86400 秒期限 | PASS |
| 錯誤簽章／篡改 | 401，PASS |
| 過期 Token | 自動測試拒絕，PASS |
| 格式錯誤 | 401，PASS |
| Claims | 僅 `sub,iat,exp` |
| 未輸出 Secret／完整 JWT | PASS |
| JWT 無敏感資料 | PASS |

## 6. 固定帳號回歸

| 項目 | 結果 |
|---|---|
| MEMBER 登入 | Bearer JWT、角色 MEMBER，PASS |
| ADMIN 登入 | Bearer JWT、角色 ADMIN，PASS |
| 錯誤密碼 | 401、無 JWT，PASS |
| 不存在 Email | 與錯誤密碼相同 401 訊息，PASS |
| Local Seeder | 冪等、local only、非明文，PASS |
| MEMBER Navbar／管理阻擋 | PASS |
| ADMIN Navbar／管理後台 | PASS |
| returnUrl | `/admin` 訪客導向登入，MEMBER 登入後仍被 AdminGuard 擋下，PASS |

## 7. Build 與自動測試

| 項目 | 結果 |
|---|---|
| Maven Test | PASS：16 tests、0 failures、0 errors、0 skipped |
| JWT Provider tests | 5 PASS |
| JWT Filter tests | 5 PASS |
| Seeder／問卷既有 tests | 6 PASS |
| Maven dependency tree | BUILD SUCCESS；Security 6.2.1、JJWT 0.12.6 無衝突 |
| Angular production Build | PASS |
| Spring Boot local | PASS |
| Browser Console | 0 error／warn |
| Network 認證 | API 與程式碼驗證只使用 Bearer；Legacy Header 401 |

## 8. README 與敏感資料

| 項目 | 結果 |
|---|---|
| Bearer JWT 說明 | PASS |
| `JWT_SECRET`／expiration | PASS，只有變數名與無效 placeholder |
| 401／403 | PASS |
| Demo 帳號與 local-only 警告 | PASS |
| 撤銷、Refresh、SHA-256、ownership 限制 | PASS |
| 真實 Secret／完整 JWT／Hash | 未寫入 Repository 或報告 |
| `application-local.yml` | Git ignore 維持有效 |

## 9. 未驗證與風險

- 沒有建立伺服器端撤銷、Refresh Token、BCrypt 或 ownership；皆明確排除於本階段。
- Network Header 由 Angular 原始碼搜尋、真實 API 結果與 Legacy Header 401 交叉驗證；瀏覽器工具未直接匯出 HAR。
- 登出後複製的 JWT 仍可能在到期前使用，符合目前 Stateless 設計的已知限制。
