# 訪客、會員與管理員導覽權限驗證報告

## 1. 權限矩陣結果

| 功能 | 訪客 | MEMBER | ADMIN |
|---|---|---|---|
| 首頁 | PASS | PASS | PASS |
| 公開問卷／填寫 | PASS | PASS | PASS |
| 會員資料 | Guard 拒絕 | PASS | PASS |
| 建立問卷 | Guard 拒絕／保存 returnUrl | PASS | PASS |
| 管理後台 | 登入導向 | 拒絕並保留登入 | PASS |
| 管理 API | 401 | 403 | 200 |

## 2. Navbar

| 狀態 | 預期項目 | 實際項目 | 結果 |
|---|---|---|---|
| 訪客 | 首頁、瀏覽、建立、登入、註冊 | 全部存在 | PASS |
| MEMBER | 首頁、瀏覽、建立、會員資料、登出 | 全部存在；無管理後台 | PASS |
| ADMIN | 首頁、瀏覽、管理後台、會員資料、登出 | 全部存在；無 MEMBER 建立入口 | PASS |

登入、角色同步及登出均透過既有 BehaviorSubject 即時更新。驗證時曾發現啟動 `/me` 與登出的競態，已以 Token 快照比對修正；共用 Navbar 登出後不需重新整理即可恢復訪客顯示。

## 3. Guard 與導向

| 情境 | 預期 | 實際 | 結果 |
|---|---|---|---|
| 訪客進會員頁 | 登入＋完整 returnUrl | `/login?returnUrl=...query...fragment` | PASS |
| 訪客點建立問卷 | 提示並導向登入 | 程式實作為指定提示與 `/admin/new` returnUrl；瀏覽器 alert 控制不穩定 | CONDITIONAL |
| 訪客直接進建立問卷 | 不顯示內容 | 導向登入，query／fragment 保留 | PASS |
| 訪客進管理頁 | 登入＋returnUrl | 導向登入 | PASS |
| MEMBER 進會員頁 | 允許 | 顯示會員資料 | PASS |
| MEMBER 進建立問卷 | 允許 | 顯示新增問卷 | PASS |
| MEMBER 進管理頁 | 拒絕且不登出 | `/quiz?accessDenied=admin`，仍是 MEMBER | PASS |
| ADMIN 進管理頁 | 允許 | 後台載入且重新整理正常 | PASS |
| MEMBER returnUrl 一般頁 | 返回完整 URL | `/admin/new?draft=1#questions` | PASS |
| MEMBER returnUrl 管理頁 | 不可繞過 | AdminGuard 導回 `/quiz?accessDenied=admin` | PASS |
| 已登入進登入頁 | 適當導向 | MEMBER `/quiz`、ADMIN `/admin` | PASS |

## 4. API 權限

| 身分 | API | Status | 結果 |
|---|---|---:|---|
| 訪客 | GET `/api/auth/me` | 403 | 拒絕；語意待統一 |
| 訪客 | POST `/api/member/quiz` | 403 | PASS（拒絕） |
| 訪客 | GET `/api/admin/quiz` | 401 | PASS（拒絕） |
| MEMBER | GET `/api/auth/me` | 200 | PASS |
| MEMBER | POST `/api/member/quiz` | 200 | PASS；建立一份未發布測試問卷 |
| MEMBER | GET `/api/admin/quiz` | 403 | PASS（拒絕且登入狀態保留） |
| ADMIN | GET `/api/admin/quiz` | 200 | PASS |
| 訪客 | GET `/api/quiz` | 200 | PASS |

## 5. `/api/auth/me`

| 情境 | Status | 結果 |
|---|---:|---|
| 合法 MEMBER Token | 200 | MEMBER 資料與 MySQL 一致；無密碼／雜湊欄位 |
| 合法 ADMIN Token | 200 | ADMIN 資料與 MySQL 一致；無密碼／雜湊欄位 |
| 無 Token | 403 | 拒絕；HTTP 語意不一致 |
| 無效 Token | 403 | 拒絕；啟動同步會清除無效摘要 |
| 登出後舊 Token | 200 | FAIL；目前 client-only logout 無撤銷機制 |

回傳欄位實際為 email、id、name、phone、role、token，沒有 password 或 password_hash。API 不接受 userId 參數，而是從已簽署 Token 取得 ID 並查詢資料庫。

## 6. Viewport

| 狀態／頁面 | 1440 × 900 | 768 × 1024 | 390 × 844 |
|---|---|---|---|
| 訪客 Navbar | PASS | PASS | PASS |
| MEMBER Navbar | PASS | PASS | PASS（內部水平捲動可操作） |
| ADMIN Navbar／管理頁 | PASS | PASS | PASS（內部水平捲動可操作） |
| 會員頁 | PASS | PASS | PASS（沿用前階段證據） |
| 建立問卷頁 | PASS | PASS | PASS；無整頁水平 overflow |
| 管理頁 | PASS | PASS | PASS；無整頁水平 overflow |

截圖位於 `docs/requirements/verification/role-navigation/`，包含 guest/member/admin 三種 Navbar 的三尺寸截圖，以及建立問卷、MEMBER 拒絕與 ADMIN 後台畫面。頁面沒有重複 Navbar；390px 沿用既有可水平捲動的連結列。

## 7. Console 與 Network

| 項目 | 結果 | 證據 |
|---|---|---|
| Angular／Guard Error | PASS | Browser error／warn logs 為空 |
| 無限重新導向 | PASS | MEMBER 管理 returnUrl 一次導回安全前台 |
| CORS／404 | PASS | 真實 API 全部經開發 Proxy |
| MEMBER 管理 API | PASS | 403，沒有重試或登出 |
| ADMIN 管理 API | PASS | 200 |
| 公開 API | PASS | 200 |
| 敏感資訊 | PASS | 報告／截圖／Console 無密碼、完整 Token、雜湊或 Secret |

Browser 工具沒有完整 HAR 匯出；Status Code 由直接 HTTP 測試取得，沒有將未取得的 HAR 證據標記為 PASS。

## 8. Build 與測試

| 項目 | 結果 |
|---|---|
| Angular Build | PASS；`npm run build` |
| Maven Test | PASS；3 tests、0 failures、0 errors、0 skipped |
| 前端自動測試 | NOT AVAILABLE；package.json 無 test／lint／e2e script |

## 9. 修改檔案

| 檔案路徑 | 修改內容 | 根本原因 | 驗證結果 |
|---|---|---|---|
| `frontend/src/app/core/services/auth.service.ts` | `/me`、啟動同步、Token 快照防競態 | 本機摘要未經後端驗證；登出期間回應可能復活狀態 | PASS |
| `frontend/src/app/core/auth.interceptor.ts` | 401 清除與登入導向；403 不強制登出 | 區分未登入與權限不足 | PASS |
| `frontend/src/app/core/admin.guard.ts` | MEMBER 導回安全前台 | 原本把有效 MEMBER 送回登入 | PASS |
| `frontend/src/app/app.component.ts` | 啟動時驗證儲存 Session | 同步 Token／角色有效性 | PASS |
| Navbar／Home TS、HTML、CSS | 訪客建立入口、提示與 returnUrl | 訪客 Navbar 缺少建立入口 | PASS／alert 自動化 CONDITIONAL |
| Login／Register Component | 已登入角色導向 | 避免重複登入 | PASS |
| 本文件與實作文件、截圖 | 記錄驗證證據 | 文件要求 | PASS |

## 10. 測試資料

- 保留上一階段 MEMBER：`codex.auth.test.***@example.com`。
- 新增本階段 ADMIN：`codex.admin.test.***@example.com`；先正常註冊，再以精確 Email 條件更新一筆角色。
- MEMBER API 建立一份名稱以 `Codex role access` 開頭的未發布測試問卷。
- 未修改既有會員角色、Schema 或其他問卷。

## 11. 未完成事項

### 登出後舊 Token 仍有效

- 問題：前端登出只刪除 localStorage／BehaviorSubject，伺服器無 Token 撤銷清單。
- 是否阻斷一般使用：否；UI 與新請求會立即回到訪客狀態。
- 根本原因：現有自製 HMAC Token 為無狀態且有效 24 小時。
- 建議階段：安全架構遷移，導入短效 Token、撤銷／版本機制或標準 Security Session 策略。
- 是否影響安全：是；已取得舊 Token 的持有者可在到期前繼續呼叫 API。

### `/me` 未登入回傳 403 而非 401

- 問題：GlobalExceptionHandler 將所有 SecurityException 映射為 403。
- 是否阻斷：否；啟動驗證會清除無效摘要，沒有無限重試。
- 根本原因：Controller 手動認證與管理 Interceptor 使用不同狀態碼策略。
- 建議階段：Spring Security／HTTP 語意統一階段。
- 是否影響安全：低；拒絕本身正確，但客戶端語意不一致。

### 問卷 ownership 尚未建模

- 問題：Quiz 沒有建立者欄位，一般會員問卷無法歸屬。
- 是否阻斷：不阻斷新增；阻斷「只能修改自己的問卷」需求。
- 根本原因：Schema 與 Service 沒有 ownership 模型。
- 建議階段：資料模型與後端授權專案。
- 是否影響安全：是；目前以禁止 MEMBER 修改既有問卷降低風險。

### 訪客提示的瀏覽器自動化限制

- 問題：指定 alert 實際被觸發，但內建瀏覽器在 dialog 關閉時狀態不穩定，無法完整自動驗證後續導向。
- 是否阻斷：否；直接輸入 `/admin/new` 的 Guard／returnUrl 已實際 PASS，程式碼導向亦已編譯。
- 根本原因：測試瀏覽器 dialog 控制限制。
- 建議階段：人工點擊一次或加入既有 E2E 測試基礎後驗證。
- 是否影響安全：否；真正限制由 AuthGuard 與後端 API 提供。

## 12. 階段判定

```text
階段結果：CONDITIONAL PASS
是否可以進行下一階段：是

Angular Build：PASS
Maven Test：PASS（3／0／0／0）
訪客 Navbar：PASS
MEMBER Navbar：PASS
ADMIN Navbar：PASS
訪客建立問卷導向：CONDITIONAL（提示已觸發；直接 Guard/returnUrl PASS）
AuthGuard：PASS
AdminGuard：PASS
returnUrl：PASS，包含 Query／Fragment，無角色繞過
MEMBER 管理頁限制：PASS
MEMBER 管理 API 限制：PASS（403）
ADMIN 管理頁：PASS
ADMIN 管理 API：PASS（200）
GET /api/auth/me：PASS（MEMBER／ADMIN 200；無效／缺少 403）
登出後舊 Token：FAIL（仍為 200；現有架構無撤銷）
401 處理：PASS
403 處理：PASS；不強制登出有效 MEMBER
Console：PASS
Network：PASS，舊 Token 撤銷除外
1440 viewport：PASS
768 viewport：PASS
390 viewport：PASS（既有內部水平捲動）

建立的本機測試資料：1 筆專用 ADMIN、1 份 MEMBER 未發布測試問卷
阻斷性問題：無一般操作阻斷
安全風險：登出後舊 Token 到期前仍有效；問卷 ownership 未建模
未驗證項目：訪客 alert 關閉後導向的完整自動化（直接 Guard 流程已驗證）
本次修正：角色 Navbar、AdminGuard、啟動 /me 同步、401/403 前端處理、登出競態
下一階段建議：先規劃 Token 撤銷／短效 Token 與 ownership，再進行 Spring Security／BCrypt 遷移。
```
