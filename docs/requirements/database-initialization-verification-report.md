# survey_db 初始化與後端啟動驗證報告

## 1. 執行前狀態

| 項目 | 結果 |
|---|---|
| MySQL80 | Running |
| mysql.exe | PASS，使用既有 MySQL Server 8.0 Client |
| Local Profile | `application-local.yml` 已存在、可讀取且被 Git 忽略 |
| 目標 Host／Port | localhost:3306 |
| 目標 Schema | `survey_db` |
| MySQL Username | 已遮蔽確認，報告不記錄完整值 |
| MySQL Password | 已透過暫時環境變數使用，未輸出或寫入報告 |
| survey_db 原本是否存在 | NO |
| 是否有既有資料 | 不適用；Schema 在操作前不存在 |

在執行完整初始化前，已先執行 `SHOW DATABASES LIKE 'survey_db';`，回傳空值。只有在這項結果確定為不存在後，才執行包含 `DROP TABLE IF EXISTS` 的 `init.sql`。本次從未執行 `DROP DATABASE`，也未刪除其他 Schema。

## 2. 初始化 SQL 確認

實際初始化檔案：專案根目錄 `init.sql`。

確認包含：

- `CREATE DATABASE IF NOT EXISTS survey_db`
- `USE survey_db`
- `app_user`
- `quiz`
- `quiz_question`
- `quiz_response`
- `response_answer`
- 三份問卷、五題、三筆填答與九筆答案測試資料

SQL 中的 `DROP TABLE IF EXISTS` 只會作用於剛建立、原先不存在的 `survey_db`，沒有既有使用者資料可被刪除。

## 3. 初始化結果

| 項目 | 結果 |
|---|---|
| 建立 survey_db | PASS |
| 建立 app_user | PASS |
| 建立 quiz | PASS |
| 建立 quiz_question | PASS |
| 建立 quiz_response | PASS |
| 建立 response_answer | PASS |
| 插入測試資料 | PASS |

## 4. 資料筆數

| 資料表 | 實際數量 | 預期數量 | 結果 |
|---|---:|---:|---|
| app_user | 0 | 0（初始化 SQL 未建立會員） | PASS |
| quiz | 3 | 3 | PASS |
| quiz_question | 5 | 5 | PASS |
| quiz_response | 3 | 3 | PASS |
| response_answer | 9 | 9 | PASS |

問卷發布狀態：ID 1、2 為已發布；ID 3 為未發布。未發布問卷在資料庫中維持 `is_published=false`。

## 5. Hibernate DDL 安全檢查

| 設定來源 | ddl-auto |
|---|---|
| `application.yml` | `update` |
| `application-local.yml` | `validate` |

本次 Spring Boot 使用 `local` profile，因此實際採用 `validate`。Log 顯示 EntityManagerFactory 成功初始化，沒有 `create`、`create-drop`、missing table 或 Schema validation 錯誤。啟動過程沒有刪除、建立或修改資料表。

## 6. 後端驗證

| 項目 | 結果 | 證據 |
|---|---|---|
| Maven Test | PASS | 3 tests，0 failures，0 errors，0 skipped；BUILD SUCCESS |
| Spring Boot 啟動 | PASS | `Started SurveyApplication`，Tomcat 8080 啟動 |
| Local Profile | PASS | Log：`The following 1 profile is active: "local"` |
| MySQL 連線 | PASS | HikariPool connection 建立完成 |
| Hibernate Schema Validation | PASS | EntityManagerFactory 初始化完成，無缺表或 validation error |
| 公開 API Smoke Test | PASS | `GET /api/quiz?page=0&size=10` 回傳 HTTP 200、success=true |
| Unknown database | PASS | 不再出現 `Unknown database 'survey_db'` |
| 認證／缺表錯誤 | PASS | 無 Access denied、Table doesn't exist 或 missing table |

公開 API 依現有業務規則只回傳兩份已發布問卷；第三份未發布問卷仍存在資料庫，並未遺失或被改成發布。

驗證完成後已停止本次 Spring Boot 程序，沒有終止其他不相關服務。

## 7. 實際執行操作

```text
Get-Service MySQL80
尋找既有 mysql.exe
安全解析 application-local.yml（不輸出完整內容）
SHOW DATABASES LIKE 'survey_db'
mysql source init.sql
SHOW TABLES
SELECT COUNT(*)（五張資料表）
SELECT id, name, is_published FROM quiz ORDER BY id
backend\mvnw.cmd test
backend\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
GET http://127.0.0.1:8080/api/quiz?page=0&size=10
git check-ignore -v backend/src/main/resources/application-local.yml
git status --short
```

資料庫密碼只存在於使用者的 Git ignored local profile，連線期間透過暫時 `MYSQL_PWD` 環境變數傳給 Client，操作完成後立即從程序環境移除。

## 8. 修改檔案

| 檔案 | 修改內容 | 原因 |
|---|---|---|
| `docs/requirements/database-initialization-verification-report.md` | 新增初始化與啟動驗證證據 | 本階段文件要求 |

本階段未修改 `init.sql`、application-local.yml、Java 程式、登入／會員／Token、資料表結構或 MySQL 帳號密碼。資料庫變更僅為在原先不存在的 Schema 中執行既有 `init.sql`。

## 9. 安全檢查

| 項目 | 結果 |
|---|---|
| 未輸出 MySQL 密碼 | PASS |
| 未修改 MySQL 密碼 | PASS |
| 未修改 MySQL 帳號或權限 | PASS |
| 未刪除其他 Schema | PASS |
| application-local.yml 被 Git 忽略 | PASS；`.gitignore:10` |
| application-local.yml 未被 Git 追蹤 | PASS |
| 未執行 DROP DATABASE | PASS |
| 完整 SQL 的 DROP TABLE 僅在 Schema 原先不存在時執行 | PASS |
| 未查詢或輸出密碼雜湊 | PASS |

## 10. 階段結論

```text
階段結果：PASS
是否可以重新執行登入會員整合驗證：是

MySQL80：Running
mysql.exe：PASS
survey_db 原本是否存在：NO
survey_db 建立：PASS
資料表建立：PASS，五張資料表齊全
測試資料：PASS，3／5／3／9
Maven Test：PASS，3/3
Spring Boot 啟動：PASS，local profile／8080
公開 API：PASS，HTTP 200；回傳兩份已發布問卷
application-local.yml Git Ignore：PASS

阻斷性問題：無
本次修正：使用既有 init.sql 建立原先不存在的 survey_db、資料表及測試資料，解除 Unknown database 啟動錯誤。
尚未驗證：本階段未執行真實註冊、登入與會員更新，應在下一階段進行。
下一步：重新執行登入／註冊／會員資料與 MySQL 持久化整合驗證。
```
