# 固定本機測試帳號驗證報告

驗證日期：2026-08-05  
驗證環境：Windows、MySQL 8.0、Spring Boot `local` Profile、Angular 開發伺服器

## 結果摘要

階段結果：**PASS**

| 驗證項目 | 結果 | 證據摘要 |
|---|---|---|
| Maven 自動測試 | PASS | 6 tests，0 failures，0 errors，0 skipped |
| MEMBER 建立 | PASS | `user@example.com` 僅 1 筆，角色 `MEMBER` |
| ADMIN 建立 | PASS | `admin@example.com` 僅 1 筆，角色 `ADMIN` |
| 密碼非明文 | PASS | 兩筆 `password_hash` 長度均為 64，皆不等於 Demo 密碼 |
| 正確密碼登入 | PASS | MEMBER 與 ADMIN 兩次啟動後均可登入，角色正確 |
| 錯誤密碼拒絕 | PASS | 兩個帳號均回傳 HTTP 400 |
| `/api/auth/me` | PASS | 兩者均 HTTP 200；欄位為 email、id、name、phone、role、token，沒有 password／hash |
| MEMBER 管理 API | PASS | `GET /api/admin/quiz` 回傳 HTTP 403 |
| ADMIN 管理 API | PASS | `GET /api/admin/quiz` 回傳 HTTP 200 |
| 重複啟動冪等性 | PASS | 第二次啟動後兩個 Email 仍各 1 筆，角色與雜湊格式不變 |
| 非 local 隔離 | PASS | 自動測試確認 Seeder 的 Spring Profile 唯一值為 `local` |
| Angular 瀏覽器流程 | PASS | MEMBER 登入後到 `/quiz`，可見建立問卷／會員資料且無管理後台；直達 `/admin` 被導回 `/quiz?accessDenied=admin` |
| ADMIN 瀏覽器流程 | PASS | ADMIN 登入後到 `/admin`，可見管理後台與會員資料；會員資料顯示系統管理員 |

## 資料庫驗證

第一次與第二次啟動後都取得下列安全摘要；驗證過程沒有輸出完整雜湊或資料庫密碼：

| Email | 筆數 | 角色 | 雜湊長度 | 是否為明文 |
|---|---:|---|---:|---|
| `user@example.com` | 1 | MEMBER | 64 | 否 |
| `admin@example.com` | 1 | ADMIN | 64 | 否 |

## 自動測試涵蓋

`LocalTestAccountSeederTest` 驗證：

1. 首次執行建立兩個指定帳號與正確角色。
2. 重複執行後資料集合仍只有兩筆，不產生重複 Email。
3. 儲存值是沿用現有雜湊後的 64 字元值，而非明文。
4. Seeder 類別僅標記 `local` Profile。

## 結論與限制

固定帳號可用於本機登入與角色權限 Demo，且不會因重啟持續新增資料。此實作沒有改變既有認證架構；目前仍使用 `X-Auth-Token`、24 小時記憶體 Token 與無 salt SHA-256。帳號與密碼禁止用於正式環境，正式部署也不得啟用 `local` Profile。
