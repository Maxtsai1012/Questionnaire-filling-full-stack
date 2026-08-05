# 真實註冊、登入與會員資料整合驗證報告

## 1. 執行環境

| 項目 | 實際結果 |
|---|---|
| 前端 Port | 4200 |
| 後端 Port | 8080 |
| Active Profile | `local` |
| MySQL Schema | `survey_db` |
| Token Header | `X-Auth-Token` |
| Token 儲存 Key | `survey_auth` |
| 測試方式 | Browser UI、HTTP smoke test、MySQL 安全查詢、Angular Build、Maven Test |

前端使用 Angular 17.2 NgModule。AuthService 使用 BehaviorSubject 保存登入狀態；Token 由 Interceptor 透過 `X-Auth-Token` 傳送。沒有改成 Bearer JWT、Spring Security 或其他登入機制。

## 2. 測試會員

| 項目 | 結果 |
|---|---|
| Email | `codex.auth.test.***@example.com` |
| 角色 | `MEMBER` |
| 是否由本階段建立 | 是 |
| 是否保留於資料庫 | 是，標記為測試資料 |

報告、Console 與 Git 均未記錄完整密碼、完整 Token、Token Secret 或密碼雜湊。

## 3. 現有認證實作確認

- 註冊：`POST /api/auth/register`，欄位為 name、phone、email、password。
- 登入：`POST /api/auth/login`，欄位為 email、password。
- 會員查詢：`GET /api/auth/me`，需要 `X-Auth-Token`。
- 會員更新：`PUT /api/auth/me`，只傳 name、phone、newPassword。
- 一般會員預設角色：`MEMBER`；前端不傳 role。
- MEMBER 登入預設導向 `/quiz`；ADMIN 導向 `/admin`；既有 `returnUrl` 優先。
- 登出沒有後端 Request，會清除 `survey_auth`、更新 BehaviorSubject 並導向 `/quiz`。
- 會員頁目前從 AuthService 的登入摘要初始化，並未主動呼叫 `GET /api/auth/me`。

## 4. API 與 UI 驗證結果

| 流程 | Method／URL | 預期 | 實際 | 結果 |
|---|---|---|---|---|
| 註冊 | POST `/api/auth/register` | 建立 MEMBER 並登入 | UI 成功後導向 `/quiz`；DB 新增 1 筆 | PASS |
| 重複 Email | POST `/api/auth/register` | 拒絕且不新增第二筆 | 顯示「此 Email 已註冊！」；DB 仍只有 1 筆測試會員 | PASS |
| 登入 | POST `/api/auth/login` | 成功保存既有 Token 狀態 | 成功登入；MEMBER 導向正確 | PASS |
| returnUrl | POST `/api/auth/login` | 回到原受保護頁面 | 從 `/member/profile` Guard 登入後回到會員頁 | PASS |
| 不存在帳號 | POST `/api/auth/login` | 拒絕 | 顯示帳號或密碼錯誤 | PASS |
| 錯誤密碼 | POST `/api/auth/login` | 拒絕且不建立登入狀態 | 顯示帳號或密碼錯誤 | PASS |
| 會員資料讀取 | 會員頁既有流程 | 顯示登入會員摘要 | 顯示測試姓名、遮罩後 Email、手機與一般會員角色 | PASS |
| GET 會員 API | GET `/api/auth/me` | 有效 Token 回傳會員 | 現有前端沒有觸發此 Request，未另外取得或輸出 Token | NOT VERIFIED |
| 會員資料更新 | PUT `/api/auth/me` | 只更新姓名與手機 | UI 顯示「會員資料修改成功！」；DB 與重載畫面一致 | PASS |
| 登出後受保護 API | GET `/api/auth/me` | 拒絕 | 無 Token與格式錯誤 Token 均為 HTTP 403 | PASS |
| 公開問卷 | GET `/api/quiz` | 未登入仍可使用 | HTTP 200 | PASS |

註冊表單另外驗證空白欄位、錯誤姓名、手機、Email 與確認密碼不一致；錯誤可同時顯示，修正欄位後錯誤會更新。登入表單驗證空白帳號、空白密碼及錯誤 Email 格式。前端的 `submitting`／`saving` 防重複送出邏輯保持生效。

## 5. MySQL 持久化

| 驗證項目 | 結果 | 說明 |
|---|---|---|
| 註冊後會員存在 | PASS | 測試 Email 查得 1 筆 |
| 重複 Email 未新增 | PASS | 重複註冊後仍為 1 筆 |
| 密碼非明文 | PASS | `password_hash` 長度 64，且不等於測試明文 |
| 預設角色 MEMBER | PASS | DB role 為 MEMBER |
| 會員資料更新 | PASS | 姓名為 `Codex Updated`、手機為 `0987654321` |
| 頁面重新整理仍存在 | PASS | 會員頁重載後顯示新值 |
| 登出再登入後仍存在 | PASS | 使用同一會員重新登入後顯示新值 |
| 後端重啟後仍存在 | PASS | local profile 重啟後重新登入成功並顯示新值 |

安全 SQL 只查詢 id/name/email/phone/role 與 `LENGTH(password_hash)`；未查詢或輸出完整雜湊。

## 6. Console 與 Network

| 項目 | 結果 | 說明 |
|---|---|---|
| Console Error | PASS | 實際 Browser logs 無 error／warn |
| Network API | PASS | 註冊、登入、更新、403 與公開 200 均有實際端到端結果 |
| 重複 Request | PASS（行為證據） | DB 僅新增一筆；更新一次；按鈕具 submitting/saving 鎖定 |
| 敏感資訊輸出 | PASS | 畫面與 Console 無密碼、Token、Secret 或 hash |
| 401／403 行為 | PASS | 受保護 API 無效登入狀態回傳 403，Guard 導向登入 |

目前 Browser 工具不提供完整 HAR，因此 Method、Payload 與 Request 次數除 UI／程式碼與資料庫結果外，沒有獨立 HAR 檔；未將不存在的 HAR 證據寫成已驗證。

## 7. Viewport 驗證

| 頁面 | 1440 × 900 | 768 × 1024 | 390 × 844 |
|---|---|---|---|
| 首頁 | PASS | PASS | PASS（整頁無 overflow） |
| 登入 | PASS | PASS | PASS（整頁無 overflow） |
| 註冊 | PASS | PASS | PASS（整頁無 overflow） |
| 會員資料 | PASS | PASS | CONDITIONAL：Navbar 連結列採既有內部水平捲動 |
| 問卷列表 | PASS | PASS | CONDITIONAL：Navbar 連結列採既有內部水平捲動 |

五個頁面、三種尺寸共 15 張截圖位於：

`docs/requirements/verification/auth-flow/`

檔名為 `homepage-*`、`login-*`、`register-*`、`member-profile-*`、`questionnaire-list-*`。截圖只使用專用測試會員，沒有密碼、Token、雜湊或真實個資。

## 8. Build 與自動測試

| 項目 | 實際指令 | 結果 |
|---|---|---|
| Angular Build | `npm run build` | PASS；bundle generation complete |
| 前端自動測試 | — | NOT AVAILABLE；package.json 沒有 test／lint／e2e script |
| Maven Test | `.\mvnw.cmd test` | PASS；3 tests、0 failures、0 errors、0 skipped |
| Spring Boot 啟動 | `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"` | PASS；8080、MySQL、Hibernate validate |
| Spring Boot 重啟 | 同上 | PASS；local profile 再次啟動，API ready |

## 9. 修改檔案

| 檔案路徑 | 修改內容 | 根本原因 | 重新驗證結果 |
|---|---|---|---|
| `frontend/proxy.conf.json` | 新增 `/api` → `http://127.0.0.1:8080` 開發 Proxy | Angular dev server 原本未設定 Proxy，相對 `/api` 會送至 4200 而非後端 | 真實註冊、登入、更新與公開 API 均通過 |
| `frontend/angular.json` | serve options 引用 `proxy.conf.json` | 讓既有 `npm start` 自動使用 Proxy | Angular Build 與端到端流程通過 |
| `docs/requirements/auth-flow-integration-verification-report.md` | 更新本次真實整合驗證證據 | 文件要求 | PASS |
| `docs/requirements/verification/auth-flow/*.png` | 新增 15 張 viewport 截圖 | 視覺驗證要求 | 已人工抽查 |

未修改 AuthService、Interceptor、Guard、Token 格式、後端 Controller／Service、密碼演算法、資料庫 Schema 或角色模型。

## 10. 未處理問題

### 現有會員頁沒有主動重新讀取 `/api/auth/me`

- 重現：登入後進入 `/member/profile`，前端只使用 AuthService 儲存的摘要。
- 是否阻斷使用：否；本次登入、更新、重載、重新登入及後端重啟均正常。
- 根本原因：ProfileComponent 現有設計沒有呼叫 GET API。
- 建議階段：後續若要求每次進頁都以伺服器為準，再新增最小 `me()` 同步流程。
- 是否影響下一階段：否，但 GET 成功情境維持 NOT VERIFIED。

### 390px Navbar 使用內部水平捲動

- 重現：390 × 844 開啟已登入的會員或問卷列表頁。
- 是否阻斷使用：否，所有連結仍可操作，整份文件沒有水平 overflow。
- 根本原因：既有 Navbar 在 768px 以下刻意使用 `overflow-x:auto`。
- 建議階段：若未來要正式支援手機版，可另階段改為漢堡選單。
- 是否影響下一階段：否；專案先前已指定只需網頁版，因此本階段不擴大修改。

## 11. 階段判定

```text
階段結果：CONDITIONAL PASS
是否可以進行下一階段：是

Angular Build：PASS
Maven Test：PASS（3 tests／0 failures／0 errors／0 skipped）
真實註冊：PASS
重複 Email：PASS
真實登入：PASS
錯誤密碼：PASS
會員資料讀取：PASS（現有 AuthService 摘要流程）
GET /api/auth/me 成功情境：NOT VERIFIED（現有頁面未呼叫）
會員資料更新：PASS
MySQL 註冊持久化：PASS
MySQL 更新持久化：PASS
後端重啟後持久化：PASS
登出：PASS
受保護頁面／API：PASS
Console：PASS
Network：PASS（無獨立 HAR）
1440 viewport：PASS
768 viewport：PASS
390 viewport：CONDITIONAL（Navbar 內部水平捲動）

建立的測試資料：1 筆 MEMBER；codex.auth.test.***@example.com
阻斷性問題：無
本次修正：補上 Angular 開發環境 /api Proxy
下一階段建議：可以進行訪客／MEMBER／ADMIN 的前端顯示、路由與權限流程；若要正式支援手機版，再獨立處理 Navbar。
```
