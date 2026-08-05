# 訪客、會員與管理員導覽權限實作

## 1. 實際權限矩陣

| 功能／頁面 | 訪客 | MEMBER | ADMIN |
|---|---|---|---|
| 首頁 `/` | 允許 | 允許 | 允許 |
| 公開問卷 `/quiz` | 允許 | 允許 | 允許 |
| 公開問卷填寫 `/quiz/:id/form` | 允許 | 允許 | 允許 |
| 登入／註冊 | 允許 | 已登入時導向 `/quiz` | 已登入時導向 `/admin` |
| 會員資料 `/member/profile` | 禁止 | 允許本人 | 允許本人 |
| 建立問卷 `/admin/new` | 提示登入，並保存 returnUrl | 允許 | 允許 |
| 修改問卷 `/admin/:id/edit` | 禁止 | 禁止 | 允許 |
| 管理後台 `/admin` | 禁止 | 禁止 | 允許 |
| `/api/auth/me` | 禁止 | 允許本人 | 允許本人 |
| `/api/member/quiz` | 禁止 | 允許新增 | 允許新增，但前端 ADMIN 使用管理 API |
| `/api/admin/**` | 禁止 | 禁止 | 允許 |

問卷 Entity 沒有 `owner_id`、`created_by` 或其他建立者欄位。MEMBER 只能新增問卷，但系統無法表達或驗證「只能修改自己的問卷」；本階段未修改 Schema，也未宣稱 ownership 已完成。

## 2. Navbar 三種狀態

- 訪客：首頁、瀏覽問卷、建立問卷、登入、註冊。
- MEMBER：首頁、瀏覽問卷、建立問卷、會員資料、登出；不顯示管理後台。
- ADMIN：首頁、瀏覽問卷、管理後台、會員資料、登出；不顯示 MEMBER 建立入口。

首頁自有白色 Header 與其他頁面的白色 Navbar 延續現有設計，沒有恢復深色導覽。訪客按建立問卷會顯示「請登入建立表單!!」，再導向 `/login?returnUrl=%2Fadmin%2Fnew`。

## 3. AuthGuard

- 有 AuthService 會員摘要時允許進入。
- 未登入時以完整 `RouterStateSnapshot.url` 保存 returnUrl。
- Query Parameters 與 Fragment 會包含於 returnUrl。
- 套用於會員資料及建立問卷頁。

## 4. AdminGuard

- ADMIN 允許進入管理路由。
- 訪客導向登入並保存完整 returnUrl。
- 已登入但非 ADMIN 導向 `/quiz?accessDenied=admin`，不清除有效 MEMBER 狀態。
- MEMBER 的管理 returnUrl 仍會再次經過 AdminGuard，不可繞過角色限制。

## 5. 登入與 returnUrl

- 無 returnUrl：MEMBER → `/quiz`；ADMIN → `/admin`。
- 有且角色允許：導回完整 returnUrl。
- MEMBER 的管理 returnUrl：AdminGuard 拒絕並導向安全前台。
- 已登入再次開啟登入或註冊：依角色導向預設頁，避免重複登入。

## 6. 會員狀態同步

AuthService 沿用既有 BehaviorSubject 與 `survey_auth`，新增小範圍的：

- `me()`：呼叫既有 `GET /api/auth/me`。
- `validateStoredSession()`：App 啟動時以後端資料驗證本機摘要並同步角色。
- Token 快照比對：若驗證期間已登出，不允許較晚返回的 `/me` 回應重新寫回登入狀態。
- localStorage JSON 損壞仍由既有 try/catch 回復為 null。

Navbar 只控制顯示；後端 Interceptor／Controller 仍是授權安全邊界。

## 7. 401／403 現況

| 後端情境 | 實際 Status | 前端處理 |
|---|---:|---|
| `/api/admin/**` 無 Token | 401 | Interceptor 清除摘要並導向登入 |
| `/api/admin/**` MEMBER Token | 403 | 保留 MEMBER 登入狀態，由頁面顯示／Guard 導回安全頁 |
| `/api/auth/me` 無效或缺少 Token | 403 | 啟動驗證失敗時清除摘要；不做無限重試 |
| `/api/member/quiz` 無效或缺少 Token | 403 | 保留一般 403，交由功能頁顯示錯誤 |

目前未登入語意在不同 API 之間同時存在 401 與 403。本階段未全面改造後端狀態碼；建議在未來 Spring Security 遷移時統一。

## 8. `/api/auth/me`

合法 MEMBER 與 ADMIN Token 均回傳 HTTP 200，欄位只有 token、id、name、email、phone、role；不包含 password 或 password_hash。資料由 Token 中的會員 ID 重新查詢 MySQL，不接受前端 userId。

## 9. ADMIN 測試資料

1. 透過正常註冊建立唯一 `codex.admin.test.***@example.com` MEMBER。
2. SQL 前置確認該帳號為本階段新建且 role=MEMBER。
3. 僅以 `WHERE email=? AND role='MEMBER'` 將該筆更新為 ADMIN。
4. `ROW_COUNT()` 為 1，更新後再次確認 role=ADMIN。

沒有修改既有 MEMBER 或其他會員，測試密碼未寫入文件或 Git。

## 10. 修改檔案

- `frontend/src/app/core/services/auth.service.ts`
- `frontend/src/app/core/auth.interceptor.ts`
- `frontend/src/app/core/admin.guard.ts`
- `frontend/src/app/app.component.ts`
- `frontend/src/app/components/navbar/navbar.component.ts`
- `frontend/src/app/pages/home/home.component.ts`
- `frontend/src/app/pages/home/home.component.html`
- `frontend/src/app/pages/home/home.component.css`
- `frontend/src/app/pages/auth/login.component.ts`
- `frontend/src/app/pages/auth/register.component.ts`
- `docs/requirements/role-navigation-implementation.md`
- `docs/requirements/role-navigation-verification-report.md`
- `docs/requirements/verification/role-navigation/*.png`

## 11. 後續安全遷移建議

1. 建立伺服器端 Token 撤銷或短效 Access Token／Refresh Token 機制；目前 client logout 不會撤銷已簽發 Token。
2. 統一認證失敗為 401、授權不足為 403。
3. 未來遷移 Spring Security／Bearer JWT／BCrypt 時依既有參考規劃另階段處理。
4. 若要實作問卷 ownership，需先增加建立者模型、資料遷移與後端查核，不能只靠 Route Guard。

