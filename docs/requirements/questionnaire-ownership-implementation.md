# 問卷 Ownership 實作

## 修改前 IDOR 風險

原本 `quiz` 沒有 owner。MEMBER 建立 Controller 雖取得 `UserPrincipal`，卻未使用；建立操作直接呼叫 ADMIN 共用 Service。MEMBER 沒有自有管理清單、讀取、修改或刪除 API，ADMIN 更新／刪除只依 quiz id 查詢。若直接開放這些方法給 MEMBER，會形成可用任意 id 操作其他問卷的 IDOR。

公開列表已過濾 `is_published=true`，但公開明細與統計原本可用 id 讀取未發布問卷，本階段一併封閉。

## Ownership 與 Legacy 規則

- 訪客：只使用公開已發布問卷；不能管理。
- MEMBER：建立問卷並自動成為 owner；只能管理自己的所有狀態問卷。
- ADMIN：建立時 owner 為 ADMIN 自己；可管理所有會員與 Legacy 問卷。
- Legacy/System：Migration 前存在且無可信建立者的問卷保持 `owner_id IS NULL`，只能由 ADMIN 管理。

不存在問卷回傳 404。問卷存在但目前 MEMBER 不是 owner（含 Legacy）回傳 403；在回應中不洩漏私人問卷內容。

## Schema Migration

`docs/requirements/migrations/V20260805_03__add_quiz_owner.sql` 新增：

```text
quiz.owner_id INT NULL
fk_quiz_owner → app_user(id), ON DELETE RESTRICT
idx_quiz_owner(owner_id)
```

Migration 前分別檢查欄位、Foreign Key 與 Index，確認都不存在才執行。4 份既有問卷（3 份初始化＋先前階段測試草稿）全部保持 NULL。`init.sql` 已同步，但未在既有資料庫重跑。

題目與填答外鍵仍對 quiz 使用 `ON DELETE CASCADE`；刪除問卷會連帶刪除其題目、填答與答案。本階段刪除測試只使用新建專用草稿。

## Entity、DTO 與 Principal 綁定

`Quiz.owner` 使用 optional LAZY `ManyToOne`。所有 API 都回傳 DTO，不直接序列化 `AppUser`，因此不會洩漏密碼 Hash、Token Version、手機或產生雙向遞迴。管理清單只在需要時回傳 `ownerId` 與 `ownerName`。

`QuizSaveRequestDto` 沒有 owner、userId、createdBy 或 role 欄位。建立時 Controller 將目前 `UserPrincipal.getUser()` 傳入 Service，新 Quiz 只使用該 Principal 設定 owner。JSON 中惡意附加 ownerId 無法改變 owner。

## MEMBER API

| Method | URL | 用途 |
|---|---|---|
| GET | `/api/member/quiz` | 依 Principal owner id 查詢自己的全部狀態問卷 |
| GET | `/api/member/quiz/{id}` | 讀取自己的管理明細 |
| POST | `/api/member/quiz` | 建立或修改自己的問卷 |
| POST | `/api/member/quiz/delete` | 依既有狀態規則刪除自己的問卷 |

清單 Query 不接受 ownerId，只使用 `searchOwnedQuizzes(currentUserId, ...)`。修改／刪除先取得 quiz；不存在為 404，owner NULL 或不同為 403，通過後才執行狀態檢查與寫入。發布與關閉目前沒有獨立 API，`isPublished` 透過同一個受保護的 Save 流程更新。

## ADMIN 規則

`/api/admin/**` 仍由 Spring Security `ROLE_ADMIN` 保護。ADMIN 清單查詢全部問卷，包含 Legacy 與 MEMBER 問卷；建立時 owner 為 ADMIN，修改與刪除可跨 owner，但不會轉移或覆寫既有 owner。

## 公開流程

公開列表仍固定傳入 `isPublished=true`，實測只回傳 2 份已發布問卷。公開明細與統計改用 `findByIdAndIsPublishedTrue`；未發布或不存在都回傳 404。填寫仍套用既有發布、開始／結束日期與重複 Email 規則。

## Angular 調整

- 新增 `/member/quizzes`、`/member/quizzes/new`、`/member/quizzes/:id/edit`。
- 共用既有管理清單與編輯元件；MEMBER 呼叫 `/api/member/quiz`，ADMIN 呼叫 `/api/admin/quiz`。
- Navbar 新增「我的問卷」，MEMBER 的「建立問卷」導向會員路由。
- 編輯明細改用受保護的管理明細 API，不再用公開明細載入草稿。
- Payload 型別沒有 ownerId／userId／createdBy／role；403 顯示合理訊息。

## 已知限制與下一階段

尚未提供 Ownership 轉移、多人協作、完整 Audit Log或 MEMBER 私人問卷回覆管理頁。會員刪除受 `ON DELETE RESTRICT` 限制。下一階段可新增 owner 專用回覆／統計 API，或規劃具備稽核紀錄的 Ownership 轉移流程。
