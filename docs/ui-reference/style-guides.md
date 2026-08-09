# Style Guides

> 本文件為本專案前端視覺設計的唯一主要規範（Single Source of Truth）。
>
> 新增頁面、修改 UI、重構 CSS、建立圖片、調整圖表或進行全站 Style Refresh 時，應優先遵循本文件。
>
> **Primary / Brand Color 固定為 `#1F8196`。**

---

# 1. Purpose

本專案為動態問卷管理系統，包含：

- 公開問卷瀏覽
- 問卷填答
- 會員登入／註冊
- 問卷建立與管理
- 回答列表與回答明細
- 基礎統計
- MEMBER 個人管理功能
- ADMIN 後台管理功能

視覺設計的核心目標為：

```text
Modern
Clean
Friendly
Lightweight
Professional
Questionnaire SaaS Web Application
```

介面應保持：

- 清楚
- 可信
- 易讀
- 易操作
- 資訊層級明確
- 表格容易掃描
- 表單容易填寫
- 錯誤與操作結果容易理解

不追求過度華麗的行銷頁效果，也避免過度傳統、厚重的 ERP 後台感。

---

# 2. Design Principles

整體設計遵循以下原則：

```text
功能正確
↓
操作清楚
↓
資訊層級
↓
視覺一致
↓
細節與裝飾
```

任何視覺修改不得破壞：

- 原有功能
- API 串接
- 權限控制
- 表單驗證
- 問卷流程
- 回答流程
- Accessibility

視覺效果應服務功能，而不是讓裝飾凌駕資訊。

---

# 3. Current vs Target

目前專案仍存在兩套主要設計語言。

| Area                 | Current                                | Target                                         |
| -------------------- | -------------------------------------- | ---------------------------------------------- |
| Legacy 問卷／管理 UI | 藍色 `#3B82F6` 為主要操作色            | 統一使用 `#1F8196`                             |
| Homepage／Account UI | 已使用接近品牌方向的 `--ds-*` 青綠系統 | 收斂成統一 Design Tokens                       |
| Buttons              | `.btn-*` 與 `.ds-button-*` 並存        | 視覺統一，功能語意保留                         |
| Cards                | Legacy 與 DS 樣式略有差異              | 統一 Surface／Radius／Shadow                   |
| Forms                | Focus Color 與 spacing 不完全一致      | 統一 Primary Focus System                      |
| Tables               | Legacy 系統為主                        | 保留易掃讀結構並統一 Token                     |
| Typography           | Plus Jakarta Sans 為主要方向           | 統一 Typography Scale                          |
| Charts               | 使用多組既有高辨識色                   | Primary 重點改為 `#1F8196`，多序列仍維持辨識度 |
| Images               | 現有圖片風格未完全統一                 | Style Refresh 時統一重新生成                   |
| Icons                | 可能存在不同來源或風格                 | 統一尺寸與視覺語言                             |

## 原則

Legacy 色碼可以存在於：

```text
Current State
Migration Notes
Historical Reference
```

但不得再被定義成新的品牌 Primary。

---

# 4. Brand Color

## 4.1 Primary

唯一品牌主色：

```text
#1F8196
```

CSS Token：

```css
--color-primary: #1f8196;
```

用途：

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
- Selected State
- 主要統計強調
- 主要品牌識別

不得再新增第三套 Primary Color。

---

# 5. Color System

## 5.1 Primary Palette

```css
:root {
  --color-primary: #1f8196;
  --color-primary-hover: #17697c;
  --color-primary-active: #155e70;

  --color-primary-light: #e3f2f6;
  --color-primary-subtle: #f0f8fa;
  --color-primary-border: #a8ccd4;
}
```

| Token                    | Color     | Usage                 |
| ------------------------ | --------- | --------------------- |
| `--color-primary`        | `#1F8196` | Main CTA / Brand      |
| `--color-primary-hover`  | `#17697C` | Hover                 |
| `--color-primary-active` | `#155E70` | Active / Pressed      |
| `--color-primary-light`  | `#E3F2F6` | Selected background   |
| `--color-primary-subtle` | `#F0F8FA` | Soft primary surface  |
| `--color-primary-border` | `#A8CCD4` | Primary-tinted border |

---

# 6. Neutral Palette

```css
:root {
  --color-background: #f4f8fb;
  --color-surface: #ffffff;
  --color-surface-secondary: #f8fafc;

  --color-text-primary: #17232c;
  --color-text-secondary: #52616b;
  --color-text-muted: #94a3b8;

  --color-border: #d6e0e7;
  --color-divider: #e2e8f0;

  --color-disabled-bg: #f1f5f9;
  --color-disabled-text: #94a3b8;
}
```

## Usage

### Background

```text
#F4F8FB
```

用於：

- Page Background
- Dashboard Background
- Account Background
- 大型 Section Background

### Surface

```text
#FFFFFF
```

用於：

- Cards
- Forms
- Tables
- Dialogs
- Navbar
- Panels

### Primary Text

```text
#17232C
```

用於：

- H1
- H2
- Card Title
- 主要資訊

### Secondary Text

```text
#52616B
```

用於：

- 描述
- Metadata
- Label
- 輔助資訊

---

# 7. Semantic Colors

Semantic Color 必須保持功能語意，不可全部改成 Primary。

```css
:root {
  --color-success: #21875f;
  --color-warning: #b7791f;
  --color-danger: #c43d4b;
  --color-info: #1f8196;
}
```

| State   | Target    | Usage              |
| ------- | --------- | ------------------ |
| Success | `#21875F` | 儲存成功、發布成功 |
| Warning | `#B7791F` | 草稿、提醒         |
| Danger  | `#C43D4B` | Error、Delete      |
| Info    | `#1F8196` | 一般資訊、重點     |

## 禁止

不要使用：

```text
Primary = Delete
Primary = Error
Primary = Warning
```

---

# 8. Legacy Color Migration

目前 Legacy UI 仍可能存在：

```css
--primary: #3b82f6;
--primary-hover: #2563eb;
--primary-light: #eff6ff;
--border-focus: #3b82f6;
```

這些屬於：

```text
Legacy UI
```

未來 Style Refresh 時應逐步轉為：

```css
--primary: var(--color-primary);
--primary-hover: var(--color-primary-hover);
--primary-light: var(--color-primary-light);
--border-focus: var(--color-primary);
```

禁止：

```text
一次無差別 Search & Replace 所有 #3B82F6
```

必須先確認該色彩實際語意。

---

# 9. Typography

## 9.1 Font Family

目前主要字體方向維持：

```css
font-family:
  "Plus Jakarta Sans",
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Microsoft JhengHei",
  sans-serif;
```

用途：

```text
English
Numbers
Traditional Chinese UI
```

若使用 Plus Jakarta Sans 無法覆蓋中文字元，中文字體自然由後續 system fallback 接管。

不應因單一頁面另建完全不同 Font Family。

---

# 10. Typography Scale

建議統一：

| Token      |        Size |  Weight | Line Height | Usage              |
| ---------- | ----------: | ------: | ----------: | ------------------ |
| Display    |    `2.5rem` |     700 |        1.18 | Hero               |
| H1         |   `1.75rem` |     700 |         1.3 | Page Title         |
| H2         |    `1.5rem` |     700 |        1.35 | Section            |
| H3         |  `1.125rem` |     700 |         1.4 | Card               |
| Body       |      `1rem` |     400 |        1.65 | General Content    |
| Body Small |  `0.875rem` |     400 |         1.5 | Supporting Content |
| Caption    | `0.8125rem` | 400-600 |         1.5 | Metadata           |
| Button     | `0.9375rem` |     600 |           1 | Button             |

## 中文文案

建議：

```text
新增問卷
查看回答
發布問卷
儲存草稿
查看統計
```

優於：

```text
進行問卷新增作業
前往進行回答資料查看
```

文案應：

- 短
- 直接
- 動詞優先
- 容易掃讀

---

# 11. Spacing System

統一 spacing scale：

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
```

避免大量新增：

```text
7px
13px
19px
21px
27px
```

等無規律間距。

---

# 12. Layout

## Content Width

一般管理與問卷操作：

```css
max-width: 1100px;
```

首頁／Landing Page：

```css
max-width: 1120px;
```

未來若統一，可收斂至單一：

```css
--layout-content-max-width: 1120px;
```

## Standard Page

建議：

```text
Page
└── Container
    ├── Page Header
    ├── Primary Action / Toolbar
    └── Content
        ├── Card
        ├── Table
        └── Form
```

---

# 13. Border Radius

統一：

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-pill: 999px;
```

用途：

| Token  | Usage                |
| ------ | -------------------- |
| `sm`   | Small Input / Badge  |
| `md`   | Button / Card / Form |
| `lg`   | Modal / Large Panel  |
| `pill` | Badge / Chip         |

一般 Card 不應使用過度巨大的圓角。

---

# 14. Shadows

```css
--shadow-sm: 0 2px 8px rgb(31 67 82 / 0.06);
--shadow-md: 0 8px 24px rgb(31 67 82 / 0.08);
--shadow-lg: 0 16px 40px rgb(31 67 82 / 0.12);
```

使用：

| Shadow | Usage                     |
| ------ | ------------------------- |
| SM     | Card                      |
| MD     | Dropdown / Floating Panel |
| LG     | Modal                     |

禁止：

- 每個 Input 都加 Shadow
- Heavy Floating Effect
- 過度立體化

---

# 15. Buttons

## Primary

```text
Background: #1F8196
Hover: #17697C
Active: #155E70
Text: #FFFFFF
```

適用：

- 儲存
- 建立
- 發布
- 登入
- 註冊
- 主要 CTA

## Secondary

適用：

- 返回
- 取消
- 次要操作

視覺：

```text
White / Neutral Surface
Neutral Border
Primary or Secondary Text
```

## Ghost

用於低強度操作：

- 查看
- 次要 Navigation
- Table Actions

## Danger

必須使用：

```text
Danger Red
```

用於：

- 刪除
- 永久移除
- 高風險操作

不得使用 Primary Teal 表示刪除。

---

# 16. Button States

所有 Buttons 需定義：

```text
Default
Hover
Active
Focus
Disabled
Loading
```

Hover 可使用：

```css
transform: translateY(-1px);
```

但動畫應輕量。

Disabled：

```text
不可保留 Hover
不可顯示 pointer cursor
必須明顯降低操作感
```

---

# 17. Forms

包含：

- Input
- Textarea
- Select
- Checkbox
- Radio
- Date
- Search
- Read-only

## Input

建議高度：

```text
40px - 46px
```

Border：

```text
#D6E0E7
```

Focus：

```text
#1F8196
```

搭配 Primary Light Focus Ring。

例如：

```css
input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgb(31 129 150 / 0.12);
}
```

---

# 18. Validation

Validation Error：

```text
Danger Color
＋
文字說明
```

禁止只顯示紅框而沒有文字。

例如：

```text
請輸入有效 Email
```

優於：

```text
格式錯誤
```

Required Mark：

```text
Danger
```

---

# 19. Cards

統一：

```text
Background: White
Border: Subtle
Radius: 10px
Shadow: SM
Padding: 24px
```

適用：

- Questionnaire Card
- Form Section
- Dashboard Summary
- Statistics
- Member Profile

避免：

```text
Card 裡再塞很多視覺上完全一樣的 Card
```

除非資訊階層確實需要。

---

# 20. Tables

適用：

- 問卷管理
- 回答列表
- ADMIN
- 會員管理資料

## Header

```text
Soft Background
Bold Label
Secondary Text
```

## Row

```text
White
Subtle Divider
```

## Hover

```text
#F8FAFC
```

## Empty State

不能只有：

```text
No data
```

建議：

```text
目前沒有回答資料。
問卷收到填答後會顯示在這裡。
```

---

# 21. Badges

狀態色應保持 Semantic。

## Draft / Unpublished

Neutral。

## Not Started

Warning。

## In Progress

Success。

## Ended

Danger / Muted Danger。

Badge 不應全部使用 Primary。

---

# 22. Navbar

Navbar 應保持：

```text
Simple
Predictable
Desktop-oriented
Role-aware
```

## Active

```text
#1F8196
```

## Inactive

```text
Secondary Text
```

Guest／MEMBER／ADMIN 可以顯示不同導覽功能，但視覺系統應相同。

不要因不同 Role 建立三種完全不同 Navbar Style。

---

# 23. Homepage

Homepage 可以比管理介面具有更多品牌感。

## Direction

Primary：

```text
#1F8196
```

Accent 可使用：

```text
#35A995
```

背景：

```text
#F4F8FB
#EDF6F8
#F6FAFB
```

CTA Gradient 如需要可使用：

```text
#17697C
→
#248FA0
```

Footer 可維持：

```text
#132931
```

首頁仍應避免：

- Heavy Animation
- Full-page Neon Gradient
- Overdone Glassmorphism

---

# 24. Icons

未來統一：

```text
Icon Family
Icon Size
Stroke / Fill Style
Icon + Label Gap
```

推薦尺寸：

```text
16px
20px
24px
```

不要在同一操作類別中混用：

```text
Emoji
SVG
Unicode
多種 Icon Library
```

除非有明確理由。

Icon-only Button 必須提供：

```html
aria-label
```

---

# 25. Charts & Statistics

目前多色 Chart Palette 可以繼續存在，因為多系列圖表需要辨識度。

Primary 強調色應統一：

```text
#1F8196
```

推薦圖表起始 Palette：

```text
#1F8196
#35A995
#4F6EDB
#B7791F
#C43D4B
#8B5CF6
#EC4899
#64748B
```

## 規則

單一 Dataset：

```text
優先 #1F8196
```

多 Dataset：

```text
保持色彩辨識
```

不要為了品牌一致把所有 Series 都改成相同青綠。

Chart Text：

```text
Plus Jakarta Sans / System Fallback
約 12px
```

---

# 26. Images & Illustrations

Style Refresh 時可以重新生成：

- Hero
- Banner
- Illustration
- Empty State
- Decorative Background
- Feature Image

## Target Image Style

```text
Modern
Clean
Friendly
Lightweight
Professional
Questionnaire SaaS
```

圖片配色應與：

```text
#1F8196
```

協調。

可以搭配：

```text
Soft Teal
Mint
Light Blue-gray
White
Muted Neutral
```

---

# 27. Image Generation Rules

重新產圖時：

## Do

- 保持相同 Illustration Family
- 使用相近 Lighting
- 使用相近線條粗細
- 使用統一 Saturation
- 使用 `#1F8196` 作品牌視覺線索
- 保留 UI 主內容閱讀性

## Don't

避免：

```text
Cyberpunk
Heavy Neon
過度 Cartoon
過度 3D
Heavy Glassmorphism
大量高飽和 Gradient
每個頁面使用完全不同藝術風格
```

---

# 28. Motion

Transition：

```text
160ms - 200ms
```

建議：

```css
transition:
  color 180ms ease,
  background-color 180ms ease,
  border-color 180ms ease,
  box-shadow 180ms ease,
  transform 180ms ease;
```

動畫應：

```text
快速
輕量
有目的
```

不要加入純裝飾性的長動畫。

---

# 29. Reduced Motion

必須保留：

```css
@media (prefers-reduced-motion: reduce);
```

降低或移除非必要動畫。

---

# 30. Accessibility

## Contrast

文字必須保持足夠辨識度。

特別避免：

```text
過淺 Gray Text
Primary Light Background + 過淺 Text
```

## Focus

Keyboard Focus 必須清楚可見。

Focus 不得被：

```css
outline: none;
```

直接移除而沒有替代方案。

## Error

不得只靠顏色傳達。

## Icons

Icon-only Action：

```text
需要 aria-label
```

## Heading

保持：

```text
H1
→ H2
→ H3
```

合理層級。

---

# 31. Responsive Principles

目前主要 Target：

```text
Desktop Web Application
```

桌面流程是第一優先。

但 Layout 原則仍需：

- 避免不必要固定寬度
- Table 可使用 horizontal overflow
- Card 不超出 Container
- Form 不因較窄畫面完全失效

Mobile-specific redesign 可獨立處理，不影響 Desktop Design System。

---

# 32. Design Tokens

建議最終收斂成：

```css
:root {
  /* Brand */
  --color-primary: #1f8196;
  --color-primary-hover: #17697c;
  --color-primary-active: #155e70;
  --color-primary-light: #e3f2f6;
  --color-primary-subtle: #f0f8fa;
  --color-primary-border: #a8ccd4;

  /* Neutral */
  --color-background: #f4f8fb;
  --color-surface: #ffffff;
  --color-surface-secondary: #f8fafc;

  --color-text-primary: #17232c;
  --color-text-secondary: #52616b;
  --color-text-muted: #94a3b8;

  --color-border: #d6e0e7;
  --color-divider: #e2e8f0;

  /* Semantic */
  --color-success: #21875f;
  --color-warning: #b7791f;
  --color-danger: #c43d4b;
  --color-info: #1f8196;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-pill: 999px;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgb(31 67 82 / 0.06);
  --shadow-md: 0 8px 24px rgb(31 67 82 / 0.08);
  --shadow-lg: 0 16px 40px rgb(31 67 82 / 0.12);

  /* Layout */
  --content-max-width: 1120px;

  /* Motion */
  --transition-fast: 160ms ease;
  --transition-normal: 180ms ease;
  --transition-slow: 200ms ease;
}
```

---

# 33. Component Migration Strategy

未來全站 Style Refresh 應採：

```text
Token
→ Global Components
→ Shared Components
→ Pages
→ Images
→ Visual QA
```

而不是：

```text
Page A 改一半
→ Page B 換另一套
→ Page C 自己新增 Color
```

---

# 34. Recommended Refresh Order

## Phase 1 — Foundation

1. 建立 Global Design Tokens
2. Legacy Primary 對應至 `#1F8196`
3. Typography
4. Spacing
5. Radius
6. Shadow

## Phase 2 — Shared Components

7. Buttons
8. Inputs
9. Select
10. Checkbox／Radio
11. Cards
12. Badges
13. Tables
14. Alerts
15. Modal

## Phase 3 — Navigation

16. Navbar
17. Page Header
18. Tabs
19. Pagination

## Phase 4 — Pages

20. Homepage
21. Login
22. Register
23. Member
24. Public Quiz List
25. Quiz Fill
26. My Questionnaires
27. Questionnaire Editor
28. Response List
29. Response Detail
30. Statistics
31. ADMIN

## Phase 5 — Visual Assets

32. Hero
33. Illustration
34. Empty State
35. Feature Images

## Phase 6 — QA

36. Color Consistency
37. Typography
38. Spacing
39. Components
40. Accessibility
41. Console
42. Main User Flows

---

# 35. Do

- 使用 `#1F8196` 作為唯一 Brand Primary。
- 優先使用 Design Tokens。
- 新增 UI 時先檢查是否已有相同元件。
- 保持 Semantic Color 意義。
- 保持表格與管理介面的掃讀效率。
- 保持 Homepage 的品牌感。
- 保持錯誤訊息清楚。
- 保持 Focus Visible。
- 統一 Images／Illustrations 的風格。
- Style Refresh 時一次有系統地處理。

---

# 36. Don't

不要：

- 新增第三套 Primary。
- 把所有色彩全部變成青綠。
- 把 Warning／Danger／Success 改成 Primary。
- 任意新增接近但不同的 Hex。
- 每個 Component 自己發明 Radius。
- 使用大量不同 Shadow。
- 為單一頁面加入完全不同 Font。
- 使用過度 Neon。
- 使用 Heavy Cyberpunk。
- 使用大量 Glassmorphism。
- 使用過度複雜 Animation。
- 為視覺理由破壞正常業務邏輯。

---

# 37. Quick Reference

| Category              | Standard                                 |
| --------------------- | ---------------------------------------- |
| Brand Primary         | `#1F8196`                                |
| Primary Hover         | `#17697C`                                |
| Primary Active        | `#155E70`                                |
| Background            | `#F4F8FB`                                |
| Surface               | `#FFFFFF`                                |
| Text Primary          | `#17232C`                                |
| Text Secondary        | `#52616B`                                |
| Border                | `#D6E0E7`                                |
| Success               | `#21875F`                                |
| Warning               | `#B7791F`                                |
| Danger                | `#C43D4B`                                |
| Font                  | Plus Jakarta Sans + System Fallback      |
| Card Radius           | `10px`                                   |
| Modal Radius          | `16px`                                   |
| Standard Card Padding | `24px`                                   |
| Content Max Width     | `1120px`                                 |
| Standard Transition   | `160–200ms`                              |
| Main UI Direction     | Modern / Clean / Friendly / Professional |

---

# 38. Source of Truth

日後若出現以下衝突：

```text
舊 CSS
舊 Prompt
AGENTS.md
新 Component
AI 產生 UI
圖片生成 Prompt
```

視覺設計原則應以：

```text
style-guides.md
```

為主要依據。

其中最不可變更的品牌規則為：

```text
Primary / Brand Color = #1F8196
```

若確實需要更換品牌主色，必須由使用者明確提出，不得由 Agent、Codex 或其他 AI 自行決定。
