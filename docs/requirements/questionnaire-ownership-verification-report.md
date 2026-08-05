# 問卷 Ownership 驗證報告

驗證日期：2026-08-05

## 1. Schema

| 項目 | 結果 |
|---|---|
| quiz.owner_id | PASS；`INT` |
| Foreign Key | PASS；`fk_quiz_owner` → `app_user(id)`，RESTRICT |
| Index | PASS；`idx_quiz_owner(owner_id)` |
| 允許 NULL | PASS |
| Legacy 問卷保留 | PASS；4 份均為 NULL |
| init.sql 同步 | PASS；未執行完整 init.sql |
| 其他資料未刪除 | PASS；Migration 後 5 題、3 填答、9 答案 |

## 2. Ownership

| 情境 | 預期 | 結果 |
|---|---|---|
| MEMBER A 建立 Quiz A | owner A | PASS；quiz 6 → user id 3 |
| MEMBER B 建立 Quiz B | owner B | PASS；quiz 7 → user id 7 |
| 惡意 ownerId | 無效 | PASS；Quiz A Payload 指定 B，DB 仍為 A |
| Legacy owner | NULL | PASS；quiz 1–4 |
| 重啟後 Ownership | 保留 | PASS；NULL／3／7 均保持 |

保留合成 MEMBER B：`ownership-b-1785906664@example.com`。保留專用問卷 6「Ownership Quiz A Updated」與 7「Ownership Quiz B」。

## 3. 授權

| 身分 | Method／URL／操作 | Status | 結果 |
|---|---|---:|---|
| 訪客 | POST `/api/member/quiz` 建立 | 401 | PASS |
| MEMBER A | POST `/api/member/quiz` 修改 Quiz A | 200 | PASS |
| MEMBER A | POST `/api/member/quiz` 修改 Quiz B | 403 | PASS |
| MEMBER A | POST `/api/member/quiz` 修改 Legacy 3 | 403 | PASS |
| MEMBER B | POST `/api/member/quiz` 修改 Quiz A | 403 | PASS |
| MEMBER A | 修改不存在問卷 | 404 | PASS |
| ADMIN | POST `/api/admin/quiz` 修改 Quiz A | 200 | PASS |
| ADMIN | POST `/api/admin/quiz` 原樣修改 Legacy 3 | 200 | PASS |
| MEMBER A | POST `/api/member/quiz/delete` 刪 Quiz B | 403 | PASS |
| MEMBER A | POST `/api/member/quiz/delete` 刪 Legacy | 403 | PASS |
| MEMBER A | 刪自己的專用測試草稿 | 200 | PASS |
| ADMIN | 刪 ADMIN 專用測試草稿 | 200 | PASS |
| 訪客 | POST `/api/member/quiz/delete` | 401 | PASS |
| ADMIN | GET `/api/admin/quiz?size=100` | 200 | PASS；含 A、B、Legacy |

刪除 API 的正確契約是 JSON id 陣列。驗證工具第一次送出單值時為格式錯誤；改用正確陣列後才記錄上表結果，且只刪除本階段新建的專用草稿。

## 4. 清單

| 身分 | 預期內容 | 結果 |
|---|---|---|
| 訪客 | 公開已發布 | PASS；2 份，未發布明細／統計 404 |
| MEMBER A | 自己的管理清單 | PASS；只含 A 所有問卷，不含 B／Legacy |
| MEMBER B | 自己的管理清單 | PASS；只含 B，不含 A／Legacy |
| ADMIN | 全部問卷 | PASS；含 A、B、4 份 Legacy |

## 5. 安全回歸

| 項目 | 結果 |
|---|---|
| BCrypt | PASS；固定帳號登入正常 |
| Legacy SHA-256 | PASS；自動相容測試保留 |
| Token Version | PASS |
| 登出後舊 JWT 401 | PASS |
| MEMBER 管理 API 403 | PASS |
| ADMIN 管理 API 200 | PASS |
| JWT 篡改拒絕 | PASS；signature byte XOR 測試保留 |

## 6. Build

| 項目 | 結果 |
|---|---|
| Maven Test | PASS；45 tests，0 failures，0 errors，0 skipped |
| Angular Build | PASS |
| Hibernate validate | PASS |
| Console | PASS；MEMBER／ADMIN／登出流程 0 error、0 warn |
| Network | PASS；前端透過本機 Proxy 成功載入公開清單、自有清單、受保護明細與 ADMIN 全清單 |

瀏覽器回歸確認 MEMBER Navbar 含「建立問卷／我的問卷／會員資料」，`/member/quizzes` 只顯示 owner 為該會員的 Quiz 6，且編輯頁沒有可偽造 owner 的欄位。ADMIN `/admin` 同時顯示 Legacy Quiz 1～4 與會員問卷 6、7。兩種角色登出後均立即恢復訪客導覽。

## 7. 修改檔案

| 檔案 | 修改內容 | 原因 |
|---|---|---|
| `docs/requirements/migrations/V20260805_03__add_quiz_owner.sql` | owner、FK、Index | Schema 升級 |
| `init.sql` | 新環境同步 | 初始化一致 |
| `backend/.../entity/Quiz.java` | LAZY owner 關聯 | Entity 映射 |
| `backend/.../dto/QuizListDto.java` | 最小 owner 摘要 | 管理清單 |
| `backend/.../common/ResourceNotFoundException.java` | 404 類型 | 一致授權策略 |
| `backend/.../common/GlobalExceptionHandler.java` | 404 Handler | JSON 錯誤格式 |
| `backend/.../repository/QuizRepository.java` | owner 與 published 查詢 | 防 IDOR／公開過濾 |
| `backend/.../service/AdminQuizService.java` | Principal 綁定、自有清單、授權 | 核心 Ownership |
| `backend/.../service/QuizService.java` | 公開明細限 published | 防止草稿洩漏 |
| `backend/.../service/StatisticsService.java` | 公開統計限 published | 防止私人資料洩漏 |
| `backend/.../controller/MemberQuizController.java` | MEMBER 管理 API | 自有管理流程 |
| `backend/.../controller/AdminQuizController.java` | Principal 建立與管理明細 | ADMIN 流程 |
| `backend/.../service/QuestionnaireOwnershipServiceTest.java` | 10 個 Ownership 測試 | 自動回歸 |
| `frontend/.../core/services/admin-quiz.service.ts` | MEMBER API 方法 | 前端串接 |
| `frontend/.../core/models/survey.model.ts` | owner 摘要型別 | DTO 同步 |
| `frontend/.../app-routing.module.ts` | MEMBER 管理路由 | 導覽與 Guard |
| `frontend/.../components/navbar/navbar.component.ts` | 建立／我的問卷 | 角色導覽 |
| `frontend/.../pages/admin/admin-list/admin-list.component.ts` | 共用清單與刪除 | 最小 UI 修改 |
| `frontend/.../pages/admin/admin-edit/admin-edit.component.ts` | 管理明細與儲存 | 草稿編輯 |
| `frontend/.../pages/home/home.component.*` | 建立路由 | 正確 returnUrl |
| `frontend/.../pages/client/quiz-list/quiz-list.component.ts` | 建立路由 | 正確角色路由 |
| `README.md` | 規則、Schema、矩陣、限制 | 操作文件 |
| `docs/requirements/questionnaire-ownership-implementation.md` | 架構文件 | 實作紀錄 |
| `docs/requirements/questionnaire-ownership-verification-report.md` | 驗證矩陣 | 實測證據 |
