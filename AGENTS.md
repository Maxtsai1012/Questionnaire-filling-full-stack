# Project Agent Instructions

## 1. Repository Root

永遠以目前 Git Repository Root 作為專案根目錄。

不得假設專案位於固定磁碟或固定本機絕對路徑，例如：

```text
C:\
D:\
```

需要確認 Repository Root 時，使用：

```powershell
git rev-parse --show-toplevel
```

所有專案內部檔案優先使用 Repository-relative path，例如：

```text
frontend/
backend/
docs/
README.md
style-guides.md
```

不要把本機絕對路徑寫進：

- Java 程式碼
- Angular 程式碼
- README.md
- 共用 Markdown 文件
- npm scripts
- Maven 設定
- Git 共用設定
- 前後端正式設定
- 文件內部連結

本專案可能在桌機、筆電或其他電腦 clone，因此所有專案設定都應維持可攜性。

## 2. Development Priority

目前專案開發優先順序：

```text
1. 功能正常
2. Demo／主要流程穩定
3. 修復阻斷性錯誤
4. 視覺一致
5. UI／UX 細節
```

目前 Codex 使用額度有限。

除非使用者明確要求，否則不要主動：

- 大規模重構。
- 新增大型功能。
- 全面重新設計 UI。
- 修改已通過的安全架構。
- 修改已正常運作的 API。
- 升級 Angular。
- 升級 TypeScript。
- 升級 Spring Boot。
- 升級 Java。
- 升級 MySQL。
- 更換主要套件。
- 引入新的大型 UI Framework。

對已經正常運作的程式：

```text
優先保持穩定
```

不要只為了「看起來更漂亮」或「架構更理想」而增加 Demo 前的回歸風險。

## 3. Existing Core Features

除非任務明確要求修正，以下已完成的核心功能不要主動重構：

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

修改任何相關功能時，都必須避免造成既有功能回歸。

## 4. Visual Style

所有前端視覺修改都必須參考 Repository Root：

```text
style-guides.md
```

如果 `style-guides.md` 尚未建立，先依目前 UI 維持既有風格，不自行發明新的 Design System。

專案未來固定品牌主色：

```text
#1F8196
```

名稱：

```text
Primary / Brand Color
```

未來主要應用於：

- Primary Button
- CTA
- Active Navigation
- Active Tab
- Input Focus
- Checkbox
- Radio
- Primary Icon
- Link Highlight
- Loading Indicator
- 主要品牌狀態

## 5. Current Visual Development Rule

目前階段：

```text
功能穩定優先於視覺一致
```

除非使用者明確要求，不要：

- 全站重新換色。
- 全面修改 CSS。
- 全面修改 HTML Layout。
- 重做 Navbar。
- 重新產生 Hero Image。
- 重新產生 Banner。
- 重新產生 Illustration。
- 全面替換 Icon。
- 引入 Tailwind。
- 引入 Bootstrap。
- 引入 Angular Material。
- 引入其他大型 Design System。
- 因視覺原因修改正常的業務邏輯。

如果發現目前 UI 與未來 Style Guide 不一致：

```text
記錄問題
→ 不立即全面修改
→ 留待後續統一 Style Refresh
```

## 6. Future Style Refresh

未來會另外進行一次完整 Style Refresh。

屆時再統一處理：

```text
Color Tokens
Primary #1F8196
Typography
Spacing
Border Radius
Shadow
Buttons
Forms
Cards
Tables
Navbar Visual Style
Icons
Empty States
Loading States
Feedback States
Hero Images
Banner Images
Illustrations
```

目前不要提前進行全面改版。

## 7. Responsive Scope

目前不主動開發：

```text
手機行動版
Mobile-specific Layout
Navbar Hamburger Menu
```

除非使用者後續明確要求。

目前以：

```text
Desktop Web Application
```

主要操作流程正常為優先。

## 8. Deferred Features

除非使用者另外要求，目前不要主動實作：

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

不要因為看到可以改善就自行擴大 Scope。

## 9. Modification Principle

修改前：

```text
先分析
→ 找根本原因
→ 確認最小修改範圍
→ 再修改
```

修改後：

```text
只執行與修改範圍必要的驗證
```

如果只修改：

```text
Markdown
Documentation
Agent Instructions
Prompt
```

不需要浪費資源執行完整 Maven／Angular／Browser E2E。

可以只執行：

```powershell
git diff --check
git status --short
```

如果修改：

```text
frontend/src/
package.json
tsconfig
angular.json
```

才執行相應 Angular Build。

如果修改：

```text
backend/src/
pom.xml
Spring Security
Database-related code
```

才執行相應 Maven Test。

## 10. Safety

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

則可以保留於 README。

## 11. Destructive Operations

除非使用者明確要求，且已確認影響，禁止執行：

```text
git reset --hard
git clean -fd

DROP DATABASE
DROP TABLE
TRUNCATE TABLE
```

不得：

- 刪除既有會員。
- 清除既有問卷。
- 清除填答資料。
- 重新執行會破壞資料的完整 init.sql。
- 覆蓋與目前任務無關的使用者修改。

如果需要 Schema 變更：

```text
優先使用非破壞性 Migration
```

## 12. Git Rules

不要自動：

```text
git commit
git push
git force-push
```

除非使用者明確要求。

修改完成後可以：

```powershell
git status --short
git diff --check
```

回報修改檔案。

## 13. Documentation Paths

Repository 內文件連結優先使用相對路徑：

正確：

```text
README.md
style-guides.md
docs/requirements/demo-core-status.md
frontend/src/
backend/src/
```

避免：

```text
C:\Users\...
D:\Project\...
```

本機絕對路徑只能在：

```text
目前單次操作說明
```

中暫時使用，不應成為專案永久規格。

## 14. AI Prompt / Agent Rules

如果專案中另有：

```text
Prompt
Agent
Codex Instructions
CLAUDE.md
GEMINI.md
.github instructions
```

其規則與本文件衝突時：

```text
先指出衝突
→ 採取最小必要同步
```

不要把整份 `AGENTS.md` 重複複製到所有 Prompt。

可以改成引用：

```text
Follow the repository root AGENTS.md.
```

視覺相關 Prompt 可以引用：

```text
Follow /style-guides.md.
Primary brand color: #1F8196.
```
