# Token Version 撤銷驗證報告

驗證日期：2026-08-05

## 1. Schema

| 項目 | 結果 |
|---|---|
| `token_version` 建立 | PASS |
| 型別 `INT` | PASS |
| NOT NULL | PASS |
| Default 0 | PASS |
| 既有資料保留 | PASS；4 筆會員保留 |
| init.sql 同步 | PASS；未執行 init.sql |
| 其他資料表未修改 | PASS |

Migration 前先確認欄位不存在，僅執行 `docs/requirements/migrations/V20260805__add_token_version.sql`。Migration 後欄位為 `int`、`NO`、Default `0`；固定帳號角色與密碼雜湊長度仍正確，未輸出完整雜湊。

## 2. JWT

| 項目 | 結果 |
|---|---|
| JWT 包含 Version Claim | PASS；Claim 名稱為 `tokenVersion` |
| Claim 與 DB 一致 | PASS |
| Claim 缺失拒絕 | PASS；自動測試 |
| Claim 非數字拒絕 | PASS；自動測試 |
| Claim 為負數拒絕 | PASS；自動測試 |
| Claim 不一致為 401 | PASS；單元與真實 API |
| 舊 JWT 無 Claim 為 401 | PASS；嚴格解析，無預設 0 相容 |
| JWT 無敏感資料 | PASS；僅 `sub`、`iat`、`exp`、`tokenVersion` |

實際登入 token 的 Claim 名稱與型別已解碼確認，但未保存或輸出完整 JWT。

## 3. Logout

| 情境 | Status | 結果 |
|---|---:|---|
| 訪客登出 | 401 | PASS |
| MEMBER 登出 | 200 | PASS |
| ADMIN 登出 | 200 | PASS |
| MEMBER 舊 JWT `/me` | 401 | PASS |
| ADMIN 舊 JWT 管理 API | 401 | PASS |
| 舊 JWT 再次登出 | 401 | PASS |
| 新 JWT | 200 | PASS |
| 使用者間隔離 | 200 | PASS；另一帳號原 Token 保持有效 |
| Body 偽造其他 userId | 200 | PASS；只撤銷 Principal 帳號 |

回歸權限：MEMBER 管理 API 403；ADMIN 管理 API 200。公開 API 沒有 Token 時 200。

## 4. 資料庫版本

| 帳號 | 登出前 | 登出後 | 重啟後 |
|---|---:|---:|---:|
| MEMBER | 0 | 2 | 2 |
| ADMIN | 0 | 1 | 1 |

MEMBER 的第二次成功登出用來驗證 Request Body 偽造其他 userId，因此 API 檢查點版本為 2。每次成功登出恰好增加 1；舊 Token 再次登出為 401，不再增加。兩個固定 Email 重啟後仍各一筆，Seeder 未重設版本。

上表記錄 API 與重啟檢查點。其後瀏覽器成功登出 MEMBER 與 ADMIN 各一次，最終資料庫版本分別為 MEMBER 3、ADMIN 2；離線登出未送達後端，沒有再增加版本，符合已知限制。

## 5. 前端

| 項目 | 結果 |
|---|---|
| Logout API | PASS；單一 POST |
| Bearer Header | PASS；沿用 Interceptor |
| Request 不重複 | PASS；`logoutInProgress` 防重入 |
| Token 不在 URL／Body | PASS；Body 為空物件 |
| localStorage 清除 | PASS；成功與失敗共用清理 |
| Navbar 同步 | PASS；MEMBER／ADMIN 登出後立即恢復訪客導覽 |
| 重新登入 | PASS；真實 API |
| 401／403 回歸 | PASS；真實 API |
| returnUrl | PASS；未修改既有登入／Guard 流程 |

## 6. Build 與執行

| 項目 | 結果 |
|---|---|
| Maven Test | PASS；21 tests，0 failures，0 errors，0 skipped |
| Angular Build | PASS；production bundle 完成 |
| Spring Boot local | PASS；最新程式碼於獨立埠啟動 |
| Hibernate validate | PASS；啟動成功，未自動改 Schema |
| Console | PASS；0 error、0 warn、無未處理 Observable Error |
| Network | PASS；實際 UI 登出成功；Request 結構由 Interceptor、Service 與 API 實測交叉確認 |

Spring Boot 重啟後固定 MEMBER `/me` 200、管理 API 403；固定 ADMIN 管理 API 200。

瀏覽器依序驗證固定 MEMBER 與 ADMIN 登入、角色 Navbar、登出與重新回到 `/quiz`。成功登出後 Navbar 立即恢復「登入／註冊」，沒有無限導向。另在登入後停止測試後端再點擊登出，頁面導向 `/quiz?logout=local-only`、本機狀態清除、Navbar 恢復訪客，Console 仍為 0 error／0 warn。瀏覽器工具未提供可匯出的 Request 明細，因此 Bearer Header、空 Body 與單次 POST 以 Angular 原始碼及真實 API 結果交叉驗證，報告未保存完整 Authorization Header。

## 7. 修改檔案

| 檔案 | 修改內容 | 原因 |
|---|---|---|
| `docs/requirements/migrations/V20260805__add_token_version.sql` | 新增非破壞性欄位 Migration | 既有資料庫升級 |
| `init.sql` | 新環境加入 `token_version` | Schema 同步 |
| `backend/src/main/java/com/survey/entity/AppUser.java` | Entity 欄位與新會員預設 | 映射版本 |
| `backend/src/main/java/com/survey/repository/AppUserRepository.java` | 原子遞增 Query | 防止競態 |
| `backend/src/main/java/com/survey/security/JwtTokenProvider.java` | Claim 簽發與嚴格解析 | 攜帶版本 |
| `backend/src/main/java/com/survey/security/JwtAuthenticationFilter.java` | DB 版本比對 | 撤銷舊 JWT |
| `backend/src/main/java/com/survey/service/AuthService.java` | Transactional logout | 帳號版本遞增 |
| `backend/src/main/java/com/survey/controller/AuthController.java` | `POST /logout` | 提供伺服器登出 |
| `backend/src/main/java/com/survey/config/SecurityConfig.java` | Logout 須認證 | 保護端點 |
| `backend/src/test/java/com/survey/security/JwtTokenProviderTest.java` | Claim 與錯誤型別測試 | JWT 回歸 |
| `backend/src/test/java/com/survey/security/JwtAuthenticationFilterTest.java` | 相符／不符／刪除會員測試 | Filter 回歸 |
| `backend/src/test/java/com/survey/service/AuthServiceLogoutTest.java` | 原子更新測試 | Logout 回歸 |
| `backend/src/test/java/com/survey/service/LocalTestAccountSeederTest.java` | 版本保留測試 | Seeder 回歸 |
| `frontend/src/app/core/services/auth.service.ts` | API 登出、失敗清理與防重入 | 前端串接 |
| `README.md` | Token Version、Migration、限制 | 操作文件同步 |
| `docs/requirements/token-version-revocation-implementation.md` | 架構與限制 | 實作紀錄 |
| `docs/requirements/token-version-revocation-verification-report.md` | 實測證據 | 驗證紀錄 |
