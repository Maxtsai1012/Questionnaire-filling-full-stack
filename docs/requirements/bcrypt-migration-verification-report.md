# BCrypt 漸進式遷移驗證報告

驗證日期：2026-08-05

## 1. Schema Migration

| 項目 | 結果 |
|---|---|
| password_hash VARCHAR(255) | PASS |
| NOT NULL | PASS |
| 既有 Hash 保留 | PASS；Migration 後仍為 4 筆 Legacy |
| token_version 保留 | PASS |
| init.sql 同步 | PASS；未執行完整 init.sql |
| 其他資料表未修改 | PASS |

Migration 前長度 64，僅執行欄位擴充；Migration 後為 `varchar(255) NOT NULL`。未輸出完整 Hash。

## 2. Password Encoder

| 情境 | 結果 |
|---|---|
| 新 encode 為 BCrypt | PASS |
| `{bcrypt}` 前綴 | PASS |
| BCrypt 正確密碼 | PASS |
| BCrypt 錯誤密碼 | PASS |
| Legacy SHA-256 正確密碼 | PASS |
| Legacy SHA-256 錯誤密碼 | PASS |
| 未知格式拒絕 | PASS；含 null、空白、未知前綴與截斷 BCrypt |
| 不儲存明文 | PASS |

正式／local 預設 strength 12；自動測試使用 strength 4 的獨立 Encoder。

## 3. 漸進式升級

| 情境 | 登入 | Hash 升級 | Token Version |
|---|---|---|---|
| Legacy 正確密碼 | 200 | `{bcrypt}` | 不變 |
| Legacy 錯誤密碼 | 401 | 不變 | 不變 |
| BCrypt 正確密碼 | 200 | 不重複 Hash | 不變 |
| BCrypt 錯誤密碼 | 401 | 不變 | 不變 |

CAS 更新 1 與並行更新 0 後重新讀取均有自動測試。真實 API 以資料庫內部值比對確認錯誤密碼不改 Hash，第二次成功登入 Hash 完全相同。

## 4. 固定帳號

| 帳號 | 登入前格式 | 登入後格式 | 第二次登入 | 角色 |
|---|---|---|---|---|
| MEMBER | LEGACY_SHA256 | BCRYPT | 200，Hash 不變 | MEMBER |
| ADMIN | LEGACY_SHA256 | BCRYPT | 200，Hash 不變 | ADMIN |

首次登入格式升級時 Token Version 保持 MEMBER 4、ADMIN 3。之後各完成一次登出，版本依既有規則成為 MEMBER 5、ADMIN 4；舊 JWT 均為 401。重啟後固定帳號短指紋、完整內部 Hash 與版本比對均保持不變，固定 Email 各一筆。

瀏覽器回歸又讓兩個固定帳號各成功登出一次，最終版本為 MEMBER 6、ADMIN 5；這些增加都來自既有 Logout All Sessions 規則，而不是 Hash 升級。

## 5. 新會員

| 項目 | 結果 |
|---|---|
| 註冊成功 | PASS |
| BCrypt | PASS；不是 64 位 SHA-256 |
| role MEMBER | PASS |
| token_version 0 | PASS |
| 登入成功 | PASS；`/api/auth/me` 200，管理 API 403 |
| 第二次登入不重 Hash | PASS |

保留合成測試會員 `bcrypt-stage-1785903065@example.com`。另保留 `bcrypt-change-1785903084@example.com` 驗證既有修改密碼流程：新 Hash 為 BCrypt、Token Version 加一、舊 JWT 與舊密碼均 401、新密碼登入 200。報告未記錄測試密碼。

## 6. 安全回歸

| 項目 | 結果 |
|---|---|
| MEMBER 管理 API 403 | PASS |
| ADMIN 管理 API 200 | PASS |
| 登出後舊 JWT 401 | PASS；MEMBER／ADMIN |
| JWT Version | PASS；Hash 升級不變、真正改密碼加一 |
| 篡改 JWT 401 | PASS；signature byte XOR 測試保留 |
| `/api/auth/me` | PASS；合法 200、訪客 401 |
| returnUrl | PASS；前端未修改 |

## 7. Build

| 項目 | 結果 |
|---|---|
| Maven Test | PASS；35 tests，0 failures，0 errors，0 skipped |
| Angular Build | PASS |
| Spring Boot local | PASS |
| Hibernate validate | PASS |
| Console | PASS；0 error、0 warn |
| Network | PASS；瀏覽器流程與真實 API／原始碼交叉驗證 |

瀏覽器實測固定 MEMBER／ADMIN 登入、錯誤密碼統一訊息、角色 Navbar、管理頁導向與登出；無無限導向或未處理錯誤。登入 Request 的密碼只在 JSON Body，不在 URL；Auth DTO、`/api/auth/me` 與會員更新 Response 都沒有 `password_hash` 欄位。登出仍由 Interceptor 使用 Bearer JWT，程式庫沒有新增 Legacy `X-Auth-Token`。瀏覽器工具不提供可匯出的 Request 明細，因此 Header／Body 契約由 Angular 原始碼與真實 API 結果交叉確認，未保存完整 Token 或 Header。

最終資料庫統計：6 位使用者，2 位尚未登入的一般 Legacy SHA-256、4 位 BCrypt、0 位 null／空白 Hash。未批次修改兩位一般 Legacy 使用者。

## 8. 修改檔案

| 檔案 | 修改內容 | 原因 |
|---|---|---|
| `docs/requirements/migrations/V20260805_02__expand_password_hash_for_bcrypt.sql` | 欄位擴充 | 容納前綴 BCrypt |
| `init.sql` | password_hash 255 | 新環境同步 |
| `backend/src/main/resources/application.yml` | BCrypt strength | 集中設定 |
| `backend/src/main/resources/application-local.example.yml` | 設定範例 | 本機說明 |
| `backend/src/main/java/com/survey/entity/AppUser.java` | 欄位長度 255 | JPA validate |
| `backend/src/main/java/com/survey/security/MigratingPasswordEncoder.java` | BCrypt 與 Legacy 相容 | 集中式密碼處理 |
| `backend/src/main/java/com/survey/security/LegacySha256PasswordEncoder.java` | 移除 | 禁止新 SHA-256 |
| `backend/src/main/java/com/survey/repository/AppUserRepository.java` | CAS 升級與改密碼原子 Query | 並行安全與撤銷 JWT |
| `backend/src/main/java/com/survey/service/AuthService.java` | 登入升級、註冊、Seeder、改密碼 | 核心流程 |
| `backend/src/main/java/com/survey/config/SecurityConfig.java` | 使用新 Encoder | Spring Security 整合 |
| `backend/src/test/java/com/survey/security/MigratingPasswordEncoderTest.java` | 格式與比對測試 | 密碼回歸 |
| `backend/src/test/java/com/survey/service/AuthServicePasswordMigrationTest.java` | 升級、CAS、註冊、改密碼測試 | 服務回歸 |
| `backend/src/test/java/com/survey/service/LocalTestAccountSeederTest.java` | 冪等與隔離測試 | Seeder 回歸 |
| `backend/src/test/java/com/survey/service/AuthServiceLogoutTest.java` | 新 Encoder 建構 | 測試相容 |
| `README.md` | 架構、設定、Migration、限制 | 操作文件 |
| `docs/requirements/bcrypt-migration-implementation.md` | 實作說明 | 技術紀錄 |
| `docs/requirements/bcrypt-migration-verification-report.md` | 驗證證據 | 階段報告 |
