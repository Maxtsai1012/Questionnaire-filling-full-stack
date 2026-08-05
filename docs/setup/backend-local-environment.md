# 後端本機環境設定

## 1. 必要環境

| 工具 | 專案需求／建議 |
|---|---|
| Java | 專案編譯目標 Java 17；目前已驗證 JDK 21 可執行 Build 與 Test |
| Maven | 使用專案內 `backend/mvnw.cmd`，固定 Maven 3.9.9，不需全域安裝 Maven |
| MySQL | MySQL 8.0 或相容版本 |
| Node.js | 前端依 `frontend/package.json` 與既有 Node 環境執行 |
| 後端 Port | 8080 |
| 前端開發 Port | Angular 預設 4200 |
| Schema | `survey_db` |

後端使用 Spring Boot 3.2.2、Maven 與 `com.survey.SurveyApplication` 啟動類別。

## 2. 設定 JAVA_HOME

目前 `java` 與 `javac` 都可從 PATH 執行，但 Maven Wrapper 在 Windows 需要 `JAVA_HOME`。

只設定目前 PowerShell 工作階段：

```powershell
$env:JAVA_HOME = (Split-Path -Parent (Split-Path -Parent (Get-Command java.exe).Source))
java -version
javac -version
```

若要永久設定，請先在 Windows 執行 `where.exe java` 確認 JDK 根目錄，再到「系統內容 → 進階 → 環境變數」新增使用者變數 `JAVA_HOME`。請將值設為 JDK 根目錄，不要設到 `bin`，並重新開啟 PowerShell 驗證：

```powershell
$env:JAVA_HOME
& "$env:JAVA_HOME\bin\java.exe" -version
& "$env:JAVA_HOME\bin\javac.exe" -version
```

不要為了本專案修改系統級 Java 設定，使用者層級或目前工作階段即可。

## 3. 建立安全的 Local Profile

從專案根目錄執行：

```powershell
Copy-Item `
  backend\src\main\resources\application-local.example.yml `
  backend\src\main\resources\application-local.yml
```

編輯 `application-local.yml`，由你自行填入：

- MySQL URL。
- MySQL Username。
- MySQL Password。

實際檔案已由 `.gitignore` 排除。不要把密碼貼到 issue、文件、Console 截圖或 Git commit。

範本的 Schema 是由專案現有設定與 `init.sql` 確認的 `survey_db`，不是推測值。範本將 `ddl-auto` 設為 `validate`，啟動時只驗證既有 Schema，不自動建立、刪除或修改資料表。專案基礎 `application.yml` 原本使用 `update`；啟用 local profile 後會由 local 設定覆蓋為 `validate`。

## 4. MySQL Workbench 唯讀確認

先用你自己的本機連線設定登入 MySQL Workbench，再執行：

```sql
SELECT DATABASE();
SHOW DATABASES;
USE survey_db;
SHOW TABLES;
SELECT COUNT(*) FROM app_user;
```

如需檢查會員資料，只選取非敏感欄位：

```sql
SELECT id, name, email, phone, role
FROM app_user
ORDER BY id DESC
LIMIT 20;
```

不要查詢或截圖 `password_hash`，也不要執行 DROP、TRUNCATE 或 DELETE。

## 5. 後端建置與啟動

```powershell
cd backend
.\mvnw.cmd -version
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

成功時應看到 Tomcat 監聽 8080、JPA Schema validation 通過，且沒有資料庫認證或連線錯誤。

專案沒有 Actuator 健康檢查，請使用既有公開 API smoke test：

```powershell
Invoke-WebRequest http://localhost:8080/api/quiz -UseBasicParsing
```

## 6. 前端啟動

`frontend/package.json` 的實際指令為：

```powershell
cd frontend
npm start
```

Angular dev server 沒有 `proxyConfig`。若要讓 `/api` 與前端同源，建議使用既有 Docker／Nginx 架構；單獨以 4200 啟動前端時，需要確認目前開發環境如何將 `/api` 導向後端 8080，不要任意修改 API URL。

## 7. 常見錯誤

### `JAVA_HOME not found`

- 判斷：Wrapper 立即停止並顯示找不到 JAVA_HOME。
- 處理：依本文件第 2 節設定目前工作階段或使用者層級 JAVA_HOME，確認指向 JDK 根目錄。

### `Access denied for user`

- 判斷：MySQL 回傳錯誤 1045，後端 log 顯示資料庫認證失敗。
- 處理：確認 `application-local.yml` 的 username/password 與 Workbench 中可用帳號一致；不要重設 root 密碼，也不要把密碼寫回 `application.yml`。

### `Unknown database 'survey_db'`

- 判斷：MySQL 回傳錯誤 1049。
- 處理：先在 Workbench 執行 `SHOW DATABASES;`。若不存在，請由專案負責人確認是否可套用 `init.sql`，不要自行刪除或覆蓋其他 Schema。

### `Communications link failure`／`Connection refused`

- 判斷：後端無法建立 JDBC connection。
- 處理：用 `Get-Service MySQL80` 與 `Get-NetTCPConnection` 確認 MySQL 服務與實際 Port，再核對 JDBC URL；不要直接重裝 MySQL。

### Java 版本不相容

- 判斷：出現 `UnsupportedClassVersionError`、編譯 release 不支援或 java/javac 版本不同。
- 處理：確認 `java -version`、`javac -version` 與 `$env:JAVA_HOME` 指向同一 JDK；專案目標為 Java 17。

### Port 已被占用

- 判斷：Spring 顯示 8080 已在使用。
- 處理：執行 `Get-NetTCPConnection -LocalPort 8080 -State Listen` 找出程序，確認是否為既有後端；不要直接終止不明程序。

### Maven Wrapper 無法下載

- 判斷：首次執行無法存取 Maven Central。
- 處理：確認公司代理、防火牆與 `https://repo.maven.apache.org` 存取；不要改用未知鏡像。下載成功後 distribution 會快取在使用者 `.m2/wrapper/dists`。

### MySQL 尚未啟動

- 判斷：Windows 服務為 Stopped 或資料庫 Port 未監聽。
- 處理：在 Windows Services 啟動既有 MySQL 服務；不要建立新的匿名帳號或修改現有密碼。
