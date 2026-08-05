# 固定本機測試帳號實作說明

## 目的

提供可預期的 MEMBER 與 ADMIN 本機 Demo 帳號，讓登入、會員資料、導覽與管理權限可以重複驗證。這些帳號僅供 `local` Profile 使用，不是正式環境預設帳號。

## 帳號規格

| 身分 | 姓名 | Email | 本機 Demo 密碼 | 角色 |
|---|---|---|---|---|
| 一般會員 | 測試會員 | `user@example.com` | `user123` | `MEMBER` |
| 系統管理員 | 系統管理員 | `admin@example.com` | `admin123` | `ADMIN` |

## 實作位置與流程

- `LocalTestAccountSeeder` 是 Spring `ApplicationRunner`，並以 `@Profile("local")` 限制只在本機 Profile 載入。
- 每次本機啟動時，Seeder 透過 `AuthService.ensureLocalTestAccount(...)` 依 Email 不分大小寫查找帳號。
- 帳號不存在時新增；已存在時校正姓名、Email、手機、角色與密碼雜湊，因此重複啟動不會新增重複資料。
- 密碼沿用 `AuthService` 現有 SHA-256 `hash(...)` 方法，沒有建立第二套雜湊實作；資料庫不儲存明文密碼。
- 未修改資料表、`init.sql`、Hibernate schema 策略或既有會員資料。Seeder 也不會刪除其他測試帳號。

## 正式環境限制

Seeder 類別只有 `local` Profile 才會成為 Spring Bean。未啟用 `local` 時不會執行固定帳號建立流程。部署正式環境時不得啟用 `local` Profile，也不得沿用 Demo 帳號密碼。

## 本階段檔案

- `backend/src/main/java/com/survey/service/LocalTestAccountSeeder.java`
- `backend/src/main/java/com/survey/service/AuthService.java`
- `backend/src/test/java/com/survey/service/LocalTestAccountSeederTest.java`
- `README.md`
- `docs/requirements/default-test-accounts-implementation.md`
- `docs/requirements/default-test-accounts-verification-report.md`

