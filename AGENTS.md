# Project Agent Instructions

本文件為此 Repository 中 AI Agent／Codex 的主要專案操作規範。

所有任務開始前，都必須先閱讀本文件並遵循以下規則。

---

# 1. Repository Root

本專案可能在不同電腦上開發，例如：

- 桌上型電腦
- 筆記型電腦
- 其他未來 Clone 此 Repository 的電腦

因此：

> 永遠以「目前 Git Repository Root」作為專案根目錄。

不得假設專案位於固定磁碟或固定本機絕對路徑，例如：

```text
C:\
D:\
C:\Users\...
D:\MegumiNoSurvey
```

需要確認 Repository Root 時，使用：

```powershell
git rev-parse --show-toplevel
```

將結果視為：

```text
REPO_ROOT
```

後續所有專案操作都以 `REPO_ROOT` 為基準。

---

# 2. Repository-relative Paths

專案內部檔案一律優先使用 Repository-relative path，例如：

```text
frontend/
backend/
docs/
docs/ui-reference/
README.md
AGENTS.md
style-guides.md
init.sql
```

不要把目前電腦的絕對路徑寫入：

- Java 程式碼
- Angular 程式碼
- README.md
- AGENTS.md
- style-guides.md
- 共用 Markdown 文件
- npm scripts
- Maven 設定
- Git 共用設定
- 前後端正式設定
- 文件內部連結

本機絕對路徑只能用於：

```text
單次終端機操作
或
當次問題診斷
```

不得成為專案永久依賴。

---

# 3. Read Before Act

任何任務開始時：

> 先讀取專案現有檔案，再分析，再決定是否操作。

禁止只根據：

- 使用者口頭描述
- 舊 Prompt
- 過去印象
- AI 自己的推測

直接修改專案。

開始任務時至少需要：

```text
1. 確認 Repository Root
2. 讀取 AGENTS.md
3. 讀取與目前任務直接相關的程式碼
4. 讀取相關設定檔
5. 讀取既有文件／規格
6. 確認目前實際實作
7. 再分析修改範圍
```

例如：

前端任務應優先讀取：

```text
frontend/package.json
frontend/angular.json
frontend/src/
相關 Component
相關 Service
相關 Router
相關 Style
```

後端任務應優先讀取：

```text
backend/pom.xml
backend/src/main/
相關 Controller
相關 Service
相關 Repository
相關 Entity
Security 設定
相關 Test
```

資料庫任務應優先讀取：

```text
init.sql
既有 migrations
Entity
Repository
相關文件
```

不得重新建立已經存在的功能。

---

# 4. Do Not Guess

如果在執行任務時遇到以下情況：

```text
需求不明確
規格互相衝突
找不到預期檔案
不知道使用者想採哪一種方案
無法確認某個操作是否安全
無法確認資料是否可以刪除
無法確認 UI 要採哪個版本
無法確認功能是否應擴充
```

必須：

```text
停止相關操作
→ 說明發現的問題
→ 提出需要確認的事項
→ 詢問使用者
→ 等待使用者確認
```

不得：

```text
自行猜測
自行選一個方案
自行擴充需求
自行刪除資料
自行重構
```

原則：

> 不知道，就問。

不要為了「完成任務」而自行補完沒有被使用者定義的需求。

---

# 5. Scope Control

只能處理目前任務要求的範圍。

如果執行過程發現其他問題：

```text
先記錄
```

若不屬於目前任務：

```text
不要順手修改
```

除非該問題會：

```text
直接阻斷目前任務
```

這種情況才允許提出：

```text
發現問題
→ 說明原因
→ 說明建議修改
→ 必要時詢問使用者
```

禁止因為看到可以改善就自行擴大 Scope。

---

# 6. Markdown / Documentation Rules

專案中的 Markdown 文件：

```text
*.md
```

可以被 AI Agent 使用。

## Read

為了理解專案：

```text
讀取 Markdown 文件不需要額外取得使用者同意。
```

例如：

```text
README.md
AGENTS.md
style-guides.md
docs/**/*.md
```

都可以在分析任務時讀取。

---

## Create / Update / Delete

如果 Agent 判斷需要：

```text
建立新的 .md
修改既有 .md
刪除 .md
重新命名 .md
搬移 .md
```

在實際操作前：

> 必須先取得使用者同意。

必須先說明：

```text
1. 想修改哪個 Markdown 文件
2. 為什麼需要修改
3. 預計新增／修改／刪除什麼內容
4. 是否會影響其他文件連結
```

使用者同意後才能執行。

---

## Markdown 修改完成後

必須明確回報：

```text
修改了哪些 .md
新增了什麼
刪除了什麼
修改了什麼
為什麼修改
```

不得偷偷同步修改 Markdown。

---

# 7. Documentation Source of Truth

若專案已有相關文件：

```text
README.md
style-guides.md
docs/requirements/
docs/**/*.md
```

在處理相應任務前應先閱讀。

但是：

```text
實際程式碼
>
過時文件
```

如果文件與目前程式碼不同：

不得自行修改其中任一方。

應先指出：

```text
文件與實際程式碼不一致
```

並詢問使用者希望：

```text
以程式碼為準更新文件
或
以文件為準修改程式
```

---

# 8. Development Priority

專案開發優先順序：

```text
1. 功能正確
2. 核心流程穩定
3. 修復阻斷性錯誤
4. 資料與權限安全
5. 視覺一致
6. UI／UX 細節
7. 額外功能
```

功能已經正常時：

```text
優先保持穩定
```

不要只為了：

```text
看起來架構更漂亮
程式碼更理想
想使用更新的技術
```

而增加回歸風險。

---

# 9. Existing Core Features

除非目前任務明確要求，以下已完成的核心架構不要主動重構：

```text
Spring Security
Bearer JWT
Token Version
Logout Token Revocation
BCrypt
Legacy SHA-256 Migration
MEMBER / ADMIN Roles
Questionnaire Ownership
AuthGuard
AdminGuard
401 / 403 Handling
Questionnaire Q / M / T Types
Draft / Publish
Guest Submission
Response List
Response Detail
Basic Statistics
```

修改任何與上述功能相關的程式時：

```text
必須先閱讀現有實作
```

並避免造成既有功能回歸。

---

# 10. Technology Stability

除非使用者明確要求，不要主動：

- 升級 Angular
- 升級 TypeScript
- 升級 Node.js
- 升級 Java
- 升級 Spring Boot
- 升級 Spring Security
- 升級 MySQL
- 更換 ORM
- 更換 Authentication 架構
- 更換 UI Framework
- 大規模更換主要套件

若真的需要升級才能完成任務：

```text
先說明原因
→ 說明影響
→ 詢問使用者
```

確認後才能執行。

---

# 11. Visual Source of Truth

所有前端視覺修改都必須先讀取：

```text
style-guides.md
```

品牌主色固定為：

```text
#1F8196
```

名稱：

```text
Primary / Brand Color
```

若實際舊 UI 尚未完全套用：

```text
#1F8196
```

不得因此把 Legacy Color 誤判成新的品牌主色。

---

# 12. UI Reference Assets

專案所有美術相關參考資料主要放置於：

```text
docs/ui-reference/
```

所有涉及以下工作的任務：

```text
UI
UX
Layout
頁面排版
人物頭像
插圖
Hero Image
Banner
Empty State
Card Design
視覺重構
圖片生成
圖片替換
```

開始前：

> 必須先檢查 `docs/ui-reference/`。

裡面可能包含：

```text
人物大頭貼
角色圖片
排版參考
UI 截圖
Illustration
Banner
Hero Reference
其他視覺素材
```

---

# 13. UI Reference Priority

處理視覺任務時，參考優先順序：

```text
1. 使用者當次明確要求
2. style-guides.md
3. docs/ui-reference/
4. 目前既有 UI
5. Agent 建議
```

若：

```text
style-guides.md
```

和：

```text
docs/ui-reference/
```

存在明顯衝突：

不要自行決定。

必須：

```text
指出差異
→ 詢問使用者
```

---

# 14. Images / Illustrations

如果 `docs/ui-reference/` 已有可用素材：

```text
優先使用或參考既有素材
```

不要在沒檢查 reference 的情況下自行重新產圖。

如果需要：

```text
重新生成圖片
新增 Illustration
修改人物
替換 Banner
建立 Hero Image
```

先確認：

```text
style-guides.md
docs/ui-reference/
```

再執行。

如對人物、風格或構圖不確定：

```text
先問使用者
```

不得自己假設。

---

# 15. Visual Style

所有新增或修改的 UI 應遵循：

```text
style-guides.md
```

目前品牌方向：

```text
Modern
Clean
Friendly
Lightweight
Professional
Questionnaire SaaS Web Application
```

Primary：

```text
#1F8196
```

禁止自行建立第三套品牌主色。

Semantic Colors：

```text
Success
Warning
Danger
Info
```

必須保持原本語意，不應全部改成 Primary。

---

# 16. UI Modification Principle

進行 UI 修改時：

```text
先分析目前 Component
→ 檢查共用 Style
→ 檢查 style-guides.md
→ 檢查 docs/ui-reference/
→ 確認修改範圍
→ 再修改
```

不要直接：

```text
重寫整頁
重新建立整套 CSS
新增另一套 Design System
```

除非使用者明確要求完整 Style Refresh。

---

# 17. Responsive Scope

除非使用者明確要求，目前不要自行擴充：

```text
Mobile-specific redesign
Navbar Hamburger Menu
大型 Responsive Refactor
```

目前主要操作目標為：

```text
Desktop Web Application
```

但修改時仍不得破壞目前既有可用的其他尺寸。

---

# 18. Deferred / Optional Features

除非目前任務明確要求，不要主動實作：

```text
Ownership Transfer
多人共同編輯
多人協作
Refresh Token
Audit Log
問卷版本控制
BCrypt 成本調升策略
大型進階統計
大規模 Responsive Refactor
Mobile Navbar
```

這些不是禁止永久實作。

原則是：

```text
使用者要求時再做
```

---

# 19. Modification Workflow

所有程式修改遵循：

```text
Read
↓
Analyze
↓
Identify Root Cause
↓
Define Scope
↓
Modify
↓
Verify
↓
Report
```

不要採用：

```text
看到 Error
→ 猜原因
→ 直接修改
```

---

# 20. Minimal Necessary Change

修正 Bug 時：

> 優先修改真正造成問題的最小範圍。

不要因單一 Bug：

```text
重構整個 Module
重寫 Authentication
改資料庫 Schema
換 Framework
重寫 Component Tree
```

除非根本原因確實需要。

---

# 21. Verification Rules

修改後只執行與修改範圍必要的驗證。

## Documentation Only

如果只修改：

```text
Markdown
Documentation
Agent Instructions
Prompt
```

可執行：

```powershell
git diff --check
git status --short
```

除非使用者另外要求，不需要完整 Build。

---

## Frontend

如果修改：

```text
frontend/src/
package.json
tsconfig*
angular.json
```

至少依修改範圍執行：

```powershell
npm run build
```

以及必要的相關測試。

---

## Backend

如果修改：

```text
backend/src/
pom.xml
Security
Controller
Service
Repository
Entity
```

至少依修改範圍執行：

```powershell
.\mvnw.cmd test
```

---

## Database

如果修改：

```text
Schema
Migration
Entity Mapping
```

必須：

```text
檢查 Migration
確認非破壞性影響
驗證 Hibernate
驗證既有資料保留
```

---

# 22. Safety

禁止將以下敏感資料加入 Git Repository：

```text
資料庫密碼
JWT Secret
完整 JWT
完整 Authorization Header
password hash
application-local.yml
真實使用者敏感資料
暫存 Log
```

不得在：

```text
README
Markdown Report
Console Log
Source Code
Screenshot
Test Output
```

中公開上述敏感資訊。

固定 Demo 測試帳號若已明確標示：

```text
僅供本機開發與 Demo
```

則可以依專案既有規格保留。

---

# 23. Destructive Operations

除非使用者明確要求且已確認影響，禁止：

```text
git reset --hard
git clean -fd
git force-push

DROP DATABASE
DROP TABLE
TRUNCATE TABLE
```

不得自行：

- 刪除既有會員
- 清除既有問卷
- 清除填答資料
- 重新執行破壞性的完整 init.sql
- 覆蓋與目前任務無關的使用者修改

如果需要 Schema 變更：

```text
優先使用非破壞性 Migration
```

---

# 24. Git Rules

不要自動執行：

```text
git commit
git push
git force-push
git tag
```

除非使用者明確要求。

允許進行唯讀／安全檢查：

```powershell
git status --short
git diff
git diff --check
git log
```

修改完成後：

```text
列出修改的檔案
```

不得偷偷 Commit。

---

# 25. Documentation Paths

Repository 文件中的連結優先使用：

```text
Repository-relative path
```

例如：

```text
README.md
style-guides.md
docs/requirements/demo-core-status.md
docs/ui-reference/
frontend/src/
backend/src/
```

避免：

```text
C:\Users\...
D:\Project\...
```

---

# 26. AI Prompt / Agent Rules

如果 Repository 中存在：

```text
Prompt
Agent
Codex Instructions
CLAUDE.md
GEMINI.md
.github instructions
```

處理相關任務時可以先讀取。

如果發現規則互相衝突：

```text
不要直接同步
```

應：

```text
指出：
- 哪些文件衝突
- 衝突內容
- 建議以哪個為準
```

再詢問使用者是否修改。

---

# 27. Markdown Synchronization

如果因程式修改而發現：

```text
README.md
style-guides.md
docs/*.md
AGENTS.md
```

可能需要同步：

不能自行修改。

必須先回報：

```text
程式已發生什麼變化
哪份文件可能需要同步
建議修改什麼
```

取得使用者同意後才能修改 Markdown。

---

# 28. Reporting Changes

完成程式修改後，必須回報：

```text
1. 發現的問題
2. 根本原因
3. 修改的檔案
4. 每個檔案修改了什麼
5. 為什麼這樣修改
6. 執行哪些驗證
7. 驗證結果
8. 尚未處理的問題
```

不得只回答：

```text
完成
已修好
PASS
```

---

# 29. No Silent Changes

禁止任何未說明的額外修改。

如果任務要求：

```text
修正 A
```

不得順便：

```text
修改 B
重構 C
美化 D
升級 E
刪除 F
```

所有額外變更都必須有：

```text
明確理由
```

必要時先取得使用者同意。

---

# 30. Final Operating Principle

本專案 Agent 的核心原則：

```text
先讀取
↓
再理解
↓
不懂就問
↓
不要猜
↓
不要擴大需求
↓
做最小必要修改
↓
完成後驗證
↓
清楚回報變更
```

尤其：

```text
Repository Path 不固定
專案內容才是主要依據
```

以及：

```text
不知道使用者想要什麼時
不要自己操作
先詢問使用者
```
