# 測試報告

測試日期：2026-08-03（Asia/Taipei）

## 靜態檢查

| 項目                      | 指令                                         | 結果                                                                     |
| ------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| Git 差異空白檢查          | `git diff --check`                           | 通過，無 whitespace error                                                |
| Angular Build（首次）     | `npm run build`                              | 未執行完成：專案原先沒有 node_modules，缺少 Angular builder              |
| 安裝鎖定依賴              | `npm ci`、`npm ci --cache .npm-cache`        | 失敗：本機 npm 回報 `Exit handler never called`；產生的暫存 cache 已移除 |
| Angular Build（最新重試） | `npm ci --cache .npm-cache`、`npm run build` | 通過；bundle 輸出至 `frontend/dist/survey-frontend`                      |
| Maven Test                | `.\mvnw.cmd test`                            | 未執行：專案沒有 Maven Wrapper                                           |
| 系統 Maven                | `mvn -v`                                     | 未執行：系統沒有 Maven                                                   |
| Docker Build              | `docker compose build backend frontend`      | 未執行：系統沒有 Docker CLI                                              |

Angular build 已通過；Maven test、瀏覽器與 MySQL 整合測試仍未執行。已新增 `SubmissionEligibilityServiceTest`，待 Maven 可用時執行。

## 建議驗證指令

```powershell
cd frontend
npm ci
npm run build

cd ..\backend
mvn test
mvn spring-boot:run
```

若採 Docker Desktop：

```powershell
docker compose build
docker compose up -d
docker compose ps
```

## Migration 與資料檢查 SQL

先備份資料，執行 `docs/requirements/migrations/V20260803__auth_and_submission_identity.sql`。該 migration 第一個 SELECT 會列出目前的訪客重複鍵；若有資料，應先人工確認，不得直接刪除。

```sql
-- 主回覆
SELECT id, quiz_id, user_id, respondent_name, normalized_name,
       phone, normalized_phone, email, submitted_at
FROM quiz_response
WHERE quiz_id = :quizId
ORDER BY id DESC;

-- 回答明細與主回覆關聯
SELECT qr.id AS response_id, qr.quiz_id, ra.question_id, ra.answer
FROM quiz_response qr
JOIN response_answer ra ON ra.response_id = qr.id
WHERE qr.id = :responseId
ORDER BY ra.id;

-- 應為 0：沒有找不到主回覆的孤兒明細
SELECT COUNT(*) AS orphan_answers
FROM response_answer ra
LEFT JOIN quiz_response qr ON qr.id = ra.response_id
WHERE qr.id IS NULL;

-- 同問卷 Email 重複檢查
SELECT quiz_id, LOWER(TRIM(email)) AS normalized_email, COUNT(*)
FROM quiz_response
GROUP BY quiz_id, normalized_email
HAVING COUNT(*) > 1;
```

## 手動驗收清單

- [ ] 首頁預設進入公開問卷列表。
- [ ] 訪客點新增問卷顯示「請您先登入，再建立表單 ！」並前往登入。
- [ ] MEMBER 登入回前台；ADMIN 登入進後台。
- [ ] MEMBER 不能進 `/admin`；未授權呼叫 `/api/admin/**` 得 401/403。
- [ ] 搜尋結束日期早於開始日期時不發 API 並顯示指定訊息。
- [ ] 姓名、手機、Email 與必填題同時錯誤時，各欄錯誤同時顯示。
- [ ] 修正單一欄位後只清除該欄錯誤；全部正確後可前往確認頁。
- [ ] invalid 時 Network 無提交/檢查重複 API。
- [ ] 會員基本資料為唯讀且後端以 token 對應資料覆寫 request。
- [ ] 同一 Email 不得重複填寫同一問卷；相同 Email 可填不同問卷。
- [ ] 後台列表同時顯示未發佈、尚未開始、進行中、已結束資料。
- [ ] 會員可修改姓名、手機與密碼，Email 保持唯讀。
- [ ] 同一人可填不同問卷。
- [ ] 成功送出後 `quiz_response` 與 `response_answer` 同時存在；失敗時 Transaction rollback。
- [ ] 統計圖為參考圖風格的分離圓角甜甜圈；無資料顯示空狀態。
- [ ] 重啟 Spring Boot 後 MySQL 資料仍存在（登入 token 需重新登入）。

## 資料保存說明

實際填答存放於 MySQL Server 的 `quiz_response` 與 `response_answer`。Spring Boot 重啟不應使資料消失；GitHub 不會自動保存 MySQL Server 的內容。`init.sql` 只用於全新 Docker volume 初始化，migration SQL 只描述既有 schema 變更；跨電腦同步測試資料須另外使用 `mysqldump` 匯出並匯入。
