# 8/8 Demo 核心狀態

## 完成項目

- MEMBER 建立並管理自己的問卷；owner 由後端 Principal 指定。
- Q 單選、M 多選、T 文字題新增、儲存與重新讀取。
- 草稿不公開；發布且日期有效後進入公開列表；取消發布沿用同一 Ownership 保護的儲存流程。
- 訪客必填驗證、填答送出、同問卷 Email 不得重複填寫。
- MEMBER 查看自己問卷的回答總數、列表、單筆明細與基礎統計。
- ADMIN 查看及管理全部會員與 Legacy 問卷、回答與統計。
- MEMBER 存取其他會員或 Legacy 管理資料回傳 403。

保留本機 Demo 資料：問卷 `#10 8-8 Demo Core QMT 1785910401`、填答 `#4`，以及第二會員 `demo-member-1785910401@example.com`。

## 尚未完成項目

無阻斷 8/8 Demo 的缺項。瀏覽器工具未匯出完整 Network 瀑布，但 API 狀態、MySQL 筆數與前端防重複提交狀態均已驗證。

## Demo 操作順序

`MEMBER 登入 → 我的問卷／建立問卷 → 草稿 → 發布 → 登出 → 訪客填答 → MEMBER 查看回答與統計 → ADMIN 查看全部問卷`

固定帳號請使用 README 的本機 Demo 帳號表。

## Build／Test 結果

- 修改前：Maven 45 tests PASS；Angular production Build PASS。
- 修改後：Maven 47 tests，0 failures、0 errors、0 skipped；Angular production Build PASS。
- Hibernate validate PASS；瀏覽器 Console 0 error／warn。
- 真實資料庫：Quiz 10 owner 為固定 MEMBER；Q／M／T 各一題；Response 4 對應三筆不同 question answer。

## 修改檔案

- 後端：`AdminQuizService`、`StatisticsService`、`AdminQuizController`、`MemberQuizController`、Ownership Service Test。
- 前端：Routing、`AdminQuizService`、管理清單、唯讀明細、回答列表元件。
- 文件：`README.md`、本文件。

## 8/8 後處理清單

- 手機行動版與 Navbar 漢堡選單。
- Ownership 轉移、多人共同編輯與協作者。
- BCrypt 成本調升策略、Refresh Token、忘記密碼 Email。
- Audit Log、進階統計圖表、問卷版本控制與非阻斷 UI 優化。
