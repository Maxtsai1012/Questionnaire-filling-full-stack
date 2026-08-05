# 後端環境就緒度報告

## 1. 實際技術環境

| 項目 | 實際結果 |
|---|---|
| 建置工具 | Maven，依據 `backend/pom.xml` |
| Wrapper | 已新增 Apache Maven Wrapper 3.3.2 only-script，固定 Maven 3.9.9 |
| Java 版本 | OpenJDK 21.0.11；專案目標 Java 17；Build/Test 相容 |
| JAVA_HOME | 未設定；使用本次命令的暫時環境值完成驗證 |
| java／javac | 皆指向同一套 OpenLogic JDK 21 |
| Spring Boot 版本 | 3.2.2 |
| 啟動類別 | `com.survey.SurveyApplication` |
| 後端 Port | 8080 |
| MySQL Schema | `survey_db`，由 application.yml 與 init.sql 確認 |
| Datasource | 環境變數覆蓋，否則使用 application.yml 預設值 |
| Local Profile | 原本沒有；已提供 `application-local.example.yml`，實際 local 檔待使用者建立 |
| DDL Strategy | 基礎設定為 `update`；local 範本覆蓋為非變更性的 `validate` |
| 健康檢查 API | 沒有 Actuator；可用既有 `GET /api/quiz` smoke test |

## 2. Wrapper 來源與安全性

- 腳本來源：Apache Maven 官方 `apache/maven-wrapper` repository。
- 版本：3.3.2，固定 commit `629ae27d224af93822164450d365930412ffcf9e`。
- Distribution type：`only-script`，Repository 不加入未知二進位 JAR。
- Maven distribution：固定 `https://repo.maven.apache.org/.../apache-maven-3.9.9-bin.zip`。
- 首次執行已成功下載並顯示 Maven 3.9.9。

第一次錯誤下載到一般 JAR 型模板，因 only-script properties 不相容而失敗；已改為同一官方 commit 的 `only-mvnw`／`only-mvnw.cmd`，重新驗證成功。

## 3. 修改檔案

| 檔案路徑 | 修改內容 | 修改原因 |
|---|---|---|
| `backend/mvnw` | 官方 Maven Wrapper 3.3.2 only-script Unix 腳本 | 提供不依賴全域 Maven的可重現建置 |
| `backend/mvnw.cmd` | 官方 Maven Wrapper 3.3.2 only-script Windows 腳本 | Windows 本機建置入口 |
| `backend/.mvn/wrapper/maven-wrapper.properties` | 固定 Wrapper 3.3.2 與 Maven 3.9.9 | 固定可信下載來源與版本 |
| `backend/src/main/resources/application-local.example.yml` | 無敏感資訊的 MySQL local profile 範本，DDL validate | 讓使用者安全提供本機設定且不變更 Schema |
| `.gitignore` | 忽略 local／secret properties、YAML 與 `.env*` | 防止本機敏感資訊提交 |
| `docs/setup/backend-local-environment.md` | Java、MySQL、Wrapper、啟動與除錯說明 | 可重現本機設定 |
| `docs/requirements/backend-environment-readiness-report.md` | 就緒度與阻塞紀錄 | 本階段報告 |

未修改 pom.xml、Java 業務程式、API、Token、會員資料表或 MySQL 使用者。

## 4. 實際執行指令

```text
java -version
javac -version
$env:JAVA_HOME
Get-Command java.exe / javac.exe
Get-Service MySQL80
docker --version
mvn -version
Apache Maven GitHub API tags/tree 查詢
.\mvnw.cmd -version
.\mvnw.cmd test
MySQL client connection attempt（未輸出認證值）
git check-ignore / git diff --check
```

## 5. 驗證結果

| 驗證項目 | 結果 | 說明 |
|---|---|---|
| Java 可用 | PASS | java 與 javac 21.0.11 可用且來自同一 JDK；專案 Test 成功 |
| Wrapper 可用 | PASS | `mvnw.cmd -version` 顯示 Apache Maven 3.9.9 |
| 後端 Test | PASS | 3 tests，0 failures，0 errors，0 skipped；BUILD SUCCESS |
| Local Profile | CONDITIONAL | 安全範本已建立；實際 `application-local.yml` 需由使用者建立並填寫 |
| MySQL 服務 | PASS | Windows MySQL80 服務為 Running |
| MySQL 連線 | BLOCKED | 專案預設認證與本機 MySQL 實際認證不同，錯誤 1045；未猜測或重設密碼 |
| Spring Boot 啟動 | BLOCKED | 沒有安全提供的有效 local datasource 設定，因此未啟動 |
| 公開 API Smoke Test | NOT VERIFIED | Spring Boot 尚未啟動 |
| 資料安全 | PASS | 無 DROP／TRUNCATE／DELETE、無修改資料庫帳密或使用者、無真實密碼寫入 Repository |

## 6. DDL 安全評估

- `application.yml` 既有值為 `spring.jpa.hibernate.ddl-auto: update`。
- `update` 不會像 `create`／`create-drop` 主動清空全部 Schema，但仍可能修改結構，因此不適合純驗證既有資料。
- 新增的 local 範本覆蓋為 `validate`；後端只驗證 mapping 與 Schema，不建立、刪除或改動表。
- 因實際 `application-local.yml` 尚不存在，本次沒有啟動 JPA，也沒有對資料庫執行 DDL。

## 7. 阻塞問題

### JAVA_HOME 未設定

- 錯誤：`JAVA_HOME not found in your environment`。
- 指令：首次 `mvnw.cmd -version`／`mvnw.cmd test`。
- 根本原因：Java 在 PATH，但 Windows 使用者／系統 JAVA_HOME 為空。
- 是否需要使用者操作：是，若希望每次不手動設定。
- 建議修正：依 setup 文件設定使用者層級 JAVA_HOME，指向現有 JDK 根目錄。
- 重新驗證：新 PowerShell 執行 `$env:JAVA_HOME` 與 `backend\mvnw.cmd -version`。

### MySQL 認證失敗

- 錯誤：MySQL error 1045，Access denied。
- 指令：使用專案現有預設 datasource 認證作連線測試。
- 根本原因：本機 MySQL 實際帳密／權限與 Repository 預設開發值不同。
- 是否需要使用者操作：是。
- 建議修正：複製 example 為 Git 忽略的 `application-local.yml`，填入能在 Workbench 成功連線的本機帳號與密碼；不要重設 root 密碼。
- 重新驗證：啟動 `local` profile，確認 JPA validate、8080 監聽及 `GET /api/quiz`。

## 8. 使用者需要手動完成的事項

- [ ] 設定目前工作階段或使用者層級 `JAVA_HOME`，指向已安裝 JDK 根目錄。
- [ ] 複製 `application-local.example.yml` 為 `application-local.yml`。
- [ ] 在 `application-local.yml` 填入可由 MySQL Workbench 成功登入的本機 Username。
- [ ] 在 `application-local.yml` 填入對應 Password。
- [ ] 在 Workbench 唯讀確認 `survey_db` 與現有資料表存在。

MySQL80 已啟動、Schema 名稱已由專案確認、Wrapper 已可下載與執行，因此不需安裝 Maven、Docker 或重新安裝 MySQL。

## 9. 階段結論

```text
階段結果：CONDITIONAL PASS
是否可以重新執行登入會員整合驗證：否

實際建置工具：Maven
Java：PASS；JDK 21 可用，專案目標 Java 17
Wrapper：PASS；Maven Wrapper 3.3.2 / Maven 3.9.9
後端 Test：PASS；3/3
Local Profile：範本完成，實際設定待使用者填寫
MySQL 連線：BLOCKED；本機認證未安全提供
Spring Boot 啟動：BLOCKED
DDL Strategy：基礎 update；local 範本 validate

使用者需要完成：設定 JAVA_HOME，建立被 Git 忽略的 application-local.yml，填入自己的本機 MySQL Username/Password，並以 Workbench 確認 survey_db 存在。
阻斷性問題：缺少有效且安全提供的 local datasource 認證，因此不能啟動後端或執行 Auth 整合測試。
本次修改：加入官方 Maven Wrapper、安全 local 範本、敏感檔案忽略規則、環境設定文件與 readiness 報告。
下一步：完成上述本機設定後，執行 `mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"`，再重新進行登入／註冊／會員與 MySQL 持久化驗證。
```
