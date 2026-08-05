# 現況分析與實作計畫

## 現有架構摘要

- 實際前端為 Angular 17.2 NgModule（非附件所述 Angular 19 Standalone），路由集中於 `app-routing.module.ts`，表單為 template-driven/元件狀態混合方式。
- 實際後端為 Java 17、Spring Boot 3.2.2、Maven（非 Gradle），分為 Controller / Service / Repository / Entity / DTO。
- 公開路由：`/quiz`、`/quiz/:id/form|confirm|stats`；管理路由：`/admin...`，原先沒有登入、角色或 Guard。
- 登入狀態與角色原先不存在；管理 API 也完全未授權。
- 填答流程為 Angular -> sessionStorage 草稿 -> 確認頁 -> `POST /api/quiz/{id}/response` -> `QuizService` Transaction -> JPA -> MySQL。
- 資料表為 `quiz`、`quiz_question`、`quiz_response`、`response_answer`；原 schema 會以 `(quiz_id,email)` 唯一限制重複。
- 統計頁使用 Chart.js 4.4.1，資料來自 `/api/quiz/{id}/statistics` 或管理端統計 API。

## 問題原因

- 填答表單以連續 `if (...) { errorMessage=...; return; }` 驗證，故只呈現第一個錯誤；沒有 fieldErrors，欄位改值也無法針對性清除錯誤。
- 原始專案以 Email 重複查詢及 `uk_quiz_email` 限制；依最新確認保留此規則，後端寫入前仍須再次檢查。
- 後端 DTO 只有 Email annotation，姓名、手機、動態題目合法性未完整驗證。
- 日期搜尋沒有 start/end 邏輯驗證；管理新增只有部分日期檢查。
- 管理畫面與 API 無身分或角色限制。
- 圓餅圖沒有參考圖的甜甜圈、間隔、圓角與空資料狀態。

## 預計修改/新增

- 前端：Auth service、HTTP interceptor、route guards、登入/註冊頁；navbar 與問卷列表新增身分互動；填答表單改為 fieldErrors 並保留原表單架構；日期驗證；Chart.js 集中選項。
- 後端：User/Auth model 與 API、token 驗證 interceptor、管理權限攔截；填答 validator/eligibility service；結構化 fieldErrors；安全的回答題目與選項驗證。
- DB：新增 `app_user` 與會員關聯欄位；填答唯一限制維持 `(quiz_id,email)`。
- 文件：本需求、此計畫、migration 與 test report。

## 影響與順序

1. 保留工作樹既有修改並建立文件。
2. 修正後端驗證/重複規則/交易與授權。
3. 修正前端驗證、登入導向、Guard、日期與圖表。
4. 執行 Maven test/package、Angular build；若 Docker/MySQL 可用，再做整合與 SQL 驗證。

## 待確認規則

- 依 2026-08-03 最新確認，同一份 Email 不得重複填寫同一問卷；姓名或手機相同不作為重複依據。
- 相同開始/結束日期允許；目前欄位只有日期、沒有時分。
- 會員自動帶入資料設為唯讀，避免前端冒用；日後若需允許修改，應由個人資料 API 處理。
- 一般會員只能修改自己建立的問卷；管理員是否能修改所有問卷，本次採管理員可管理，會員擁有者檢查保留於 Service。
