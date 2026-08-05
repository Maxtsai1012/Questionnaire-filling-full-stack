# 登入、會員、驗證與權限參考分析計畫

## 1. 分析範圍與限制

- 目標專案：`Questionnaire-filling-full-stack`
- 參考專案：`Shopping-project/website_template`
- 本次只研究登入、註冊、會員、JWT／Session、Spring Security、HTTP Interceptor、Route Guard、角色權限與會員資料表。
- 未讀取、未分析 Product、Cart、Order、Payment、Shipping、Coupon 等購物業務實作。
- 參考專案保持唯讀；本文件不授權後續直接修改程式碼。

## 2. 技術基線

| 項目 | 目標專案 | 參考專案 | 採用原則 |
|---|---|---|---|
| Angular | 17.2、NgModule | 18.2、Standalone | 保留目標專案版本與 NgModule，不升級或全面改 Standalone |
| Spring Boot | 3.2.2 | 3.3.1 | 保留目標專案 3.2.2 |
| Java | 17 | 17 | 相容 |
| 安全框架 | 自製 MVC Interceptor | Spring Security | 可移植安全概念與相容版本依賴，不複製購物 API 規則 |
| Token | 自製 HMAC 字串、`X-Auth-Token` | JJWT、Bearer JWT | 建議改為標準 Bearer JWT |
| 密碼 | 無 salt 的 SHA-256 | BCrypt | 建議改 BCrypt，並設計舊密碼遷移方式 |
| 角色 | `app_user.role` 單一字串 | `roles` + `user_roles` 多對多 | 先保留單一角色即可；用 Enum/authority 對應，未來再擴充多角色 |

## 3. 參考專案認證流程

### 3.1 註冊

1. Angular Reactive Form 驗證姓名、Email、密碼。
2. `POST /api/auth/register` 傳送 `SignUpRequest`。
3. `UserServiceImpl` 檢查 Email 唯一性。
4. `BCryptPasswordEncoder` 雜湊密碼。
5. 從 `roles` 取得 `ROLE_USER`，寫入 `users` 與 `user_roles`。
6. 回傳不含密碼的 `UserDTO`；註冊後前端導向登入，不自動登入。

### 3.2 登入與 JWT

1. `AuthenticationManager` 使用 Email、密碼驗證。
2. `UserDetailsServiceImpl` 由 Email 載入 User 與 EAGER roles。
3. `UserPrincipal` 將角色轉成 Spring Security authorities。
4. `JwtTokenProvider` 以 HS256 簽章，subject 為 Email，包含簽發與過期時間。
5. 前端將 token 存在 `localStorage.auth_token`，會員摘要存在 `user_details`。
6. Angular interceptor 對請求加入 `Authorization: Bearer <token>`。
7. `JwtAuthenticationFilter` 每次請求驗證 JWT，再由資料庫載入會員與角色，建立 `SecurityContext`。

參考專案是無狀態 JWT：`SessionCreationPolicy.STATELESS`，不使用伺服器 HttpSession 保存登入狀態。

### 3.3 路由與 API 權限

- Angular `authGuard`：沒有本機會員狀態時導向登入，保留 `returnUrl`。
- Angular `adminGuard`：必須登入且 roles 包含 `ROLE_ADMIN`。
- Spring Security：登入／註冊公開；管理 API 使用 `hasAuthority("ROLE_ADMIN")`；其餘受保護 API要求登入。
- 真正安全邊界在後端 SecurityFilterChain，Route Guard 只負責使用者體驗。

### 3.4 會員資料表

- `users`：id、唯一 Email、BCrypt password、name、enabled。
- `roles`：角色 ID 與唯一 Enum 名稱。
- `user_roles`：會員與角色多對多關聯，複合主鍵並具外鍵。
- 預設角色為 `ROLE_USER`；管理員為 `ROLE_ADMIN`。

## 4. 目標專案現況

### 4.1 後端

- `app_user` 包含 id、name、email、phone、`password_hash`、單一 `role`。
- Email 使用資料庫唯一限制與 `findByEmailIgnoreCase`。
- 密碼目前使用固定 SHA-256，沒有 per-user salt，抗暴力破解能力不足。
- token 格式為 `userId.expiry.signature`，使用程式內硬編碼 HMAC secret；不是 JWT。
- token 放在 `X-Auth-Token`，由 Controller 或 `AdminAuthorizationInterceptor` 手動驗證。
- 只有 `/api/admin/**` 集中套用 Interceptor；其他需要登入的 API 各自在 Controller 呼叫 `authenticate()`。
- 權限使用 `MEMBER`／`ADMIN` 字串比較，沒有型別安全 Enum，也沒有 SecurityContext。
- token 驗證後仍從 MySQL 重新取得會員，角色變更可即時生效，這點與參考專案相似。
- 已有會員資料查詢／修改 API：`GET/PUT /api/auth/me`；Email 唯讀，姓名、手機、密碼可修改。

### 4.2 前端

- `AuthService` 以 BehaviorSubject 保存目前會員，完整 auth response 存於 `localStorage.survey_auth`。
- class-based HTTP interceptor 加入 `X-Auth-Token`。
- `AuthGuard`、`AdminGuard` 分別檢查登入與單一角色。
- 登入成功後依角色導向；Guard 支援 `returnUrl`。
- 本機資料只能代表 UI 狀態，不能證明 token 尚未過期或角色仍有效。

## 5. 可採用的參考設計

### 建議採用

- Spring Security `SecurityFilterChain` 作為唯一後端安全入口。
- `SessionCreationPolicy.STATELESS` 與標準 `Authorization: Bearer`。
- BCrypt `PasswordEncoder`，註冊與改密碼都經同一服務。
- `UserDetailsService`／Principal 封裝會員身分與 authority。
- `OncePerRequestFilter` 驗證 token，成功後設定 SecurityContext。
- URL 規則搭配 method security；Controller/Service 從已驗證 principal 取得 userId，不相信前端傳入身分。
- JWT secret、有效期間改由設定與環境變數提供。
- 前端保留 auth guard、admin guard、returnUrl 與集中 interceptor。

### 不應直接照抄

- 不升級 Angular 18、Spring Boot 3.3.1 或改成 Standalone。
- 不複製參考專案的商品、購物車、訂單或管理路由規則。
- 不照搬 `permitAll` 的 products/categories 規則；應重新定義問卷公開 API。
- 不直接使用參考專案的預設 JWT secret 或測試帳密。
- 不把參考專案 `init.sql` 的 DROP TABLE 或購物資料帶入目標專案。
- 不因參考專案是多角色就立即重建目標資料模型；目前 MEMBER/ADMIN 單一角色足以支援既有需求。

## 6. 參考專案本身的注意事項

- localStorage 中的 `user_details` 不會在啟動時向後端重新驗證，過期 JWT 可能讓 UI 暫時誤判已登入。
- JWT interceptor 只附加 token，沒有集中處理 401／403 或清除過期登入狀態。
- token subject 使用 Email；若未來允許修改 Email，舊 token 與身分識別需明確處理。目標專案建議使用不可變 userId 作 subject。
- CORS `*` 僅適合本機開發，正式環境應限制來源。
- 角色 EAGER 載入在目前小型角色集合可接受，擴大後需注意查詢成本。
- `enabled` 已存在於資料模型，但參考 `UserPrincipal.isEnabled()` 固定回傳 true，尚未真正套用停權狀態。

## 7. 目標專案後續實作計畫

### 階段一：安全核心

1. 加入與 Spring Boot 3.2.2 相容的 `spring-boot-starter-security`、JJWT 與 `spring-security-test`。
2. 建立 `SecurityConfig`、JWT provider、JWT filter、UserPrincipal、UserDetailsService。
3. JWT subject 使用 userId；claims 只放必要資訊，角色仍以資料庫結果為準或定義明確的角色刷新策略。
4. secret 與 expiration 放入 `application.yml`，正式值由環境變數覆寫。
5. 停用伺服器 session、CSRF（僅限純 Bearer API），明確設定 CORS。

### 階段二：密碼安全遷移

1. 新註冊與改密碼一律寫入 BCrypt。
2. 既有 SHA-256 不可由 hash 還原；可採「登入時辨識舊格式，驗證成功即升級 BCrypt」或要求重設密碼。
3. 在欄位或設定中保留可判定演算法的方式，例如 `{bcrypt}` 前綴；不要僅靠長度永久猜測。
4. 不在 migration 中清空或直接覆寫既有密碼。

### 階段三：API 授權矩陣

| API 類型 | 建議權限 |
|---|---|
| 登入、註冊 | 公開 |
| 公開問卷列表、可填問卷詳情、公開統計 | 公開，但後端仍驗證發布與狀態 |
| 填答 | 公開或會員；會員身分由 principal 取得 |
| `/api/auth/me` | 已登入 |
| 會員新增問卷 | MEMBER 或 ADMIN |
| 會員修改問卷 | 擁有者或 ADMIN，由 Service 驗證 ownership |
| `/api/admin/**` | ADMIN |

前端隱藏按鈕或 Guard 不算授權；Service 必須再次檢查角色與擁有者。

### 階段四：Angular 整合

1. 保留 NgModule 與 class-based service/guard 架構。
2. interceptor 改送 `Authorization: Bearer`。
3. 集中處理 401：清除 localStorage，保留 returnUrl 並導向登入。
4. 403 顯示無權限，不應一律當成未登入。
5. 啟動時呼叫 `/api/auth/me` 驗證 token；驗證完成前 Guard 應支援 loading 狀態，避免閃爍或誤導向。
6. localStorage 只保存必要 token/顯示摘要；不將其內容當成後端授權依據。

### 階段五：資料模型

短期建議保留 `app_user.role`，新增 Java Enum 對應 `ROLE_MEMBER`／`ROLE_ADMIN` 或在 authority 轉換層統一前綴。只有在確認需要一人多角色後，才新增 `role`、`user_role` 表。

會員表建議至少保留：

- id
- unique normalized email
- BCrypt password hash
- name
- phone
- role
- enabled
- created_at／updated_at

所有 schema 變更使用獨立 migration，先檢查 Email 重複與現有角色值，不修改或刪除既有會員資料。

## 8. 預計影響檔案（僅規劃）

### 後端

- `backend/pom.xml`
- `backend/src/main/resources/application.yml`
- 新增 `config/SecurityConfig.java`
- 新增 `security/JwtTokenProvider.java`
- 新增 `security/JwtAuthenticationFilter.java`
- 新增 `security/UserPrincipal.java`
- 新增 `security/UserDetailsServiceImpl.java`
- 調整 `AuthController`、`AuthService`、`AppUser`、`AuthDtos`
- 移除或停用 `AdminAuthorizationInterceptor` 與重複的 Controller 手動驗證
- 新增不破壞資料的 auth migration 與 security tests

### 前端

- `core/services/auth.service.ts`
- `core/auth.interceptor.ts`
- `core/auth.guard.ts`
- `core/admin.guard.ts`
- `app-routing.module.ts`
- 登入、註冊、會員資料元件

## 9. 測試計畫

- 註冊：Email 格式、唯一性、密碼長度、預設 MEMBER、BCrypt 不存明碼。
- 登入：正確／錯誤密碼、停權會員、token 簽章與到期。
- Filter：缺 token、錯誤 token、過期 token、合法 token、SecurityContext authorities。
- 權限：訪客、MEMBER、ADMIN 對每類 API 的 200／401／403。
- 所有權：會員不能修改其他會員建立的問卷，ADMIN 行為依規格。
- 會員資料：只允許本人讀寫；修改密碼後舊密碼不可登入。
- Angular：interceptor header、401 清除狀態、403 提示、returnUrl、Guard 與 `/me` 啟動驗證。
- Migration：既有會員、角色、問卷與填答資料完整保留。

## 10. 建議決策

建議採用參考專案的 Spring Security、BCrypt、Bearer JWT、SecurityContext 與後端 authority 模式，但保留目標專案的 Angular 17 NgModule、Spring Boot 3.2.2、現有 API response 格式、手機欄位與 MEMBER/ADMIN 業務名稱。實作時應先完成安全核心和舊密碼遷移測試，再逐步替換現有自製 token 與 MVC Interceptor，避免同時存在兩套授權機制造成漏洞。
