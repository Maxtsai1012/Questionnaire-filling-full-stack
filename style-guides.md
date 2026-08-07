# Style Guides

## 1. Purpose

This file defines the shared visual direction for the project. It is a lightweight source of truth for future frontend visual work and post-demo style refresh planning.

Current priority is stability. This file records the target visual rules; it does not mean the current Angular UI has already been fully refactored to match every target token.

## 2. Development Priority

Current development priority:

```text
1. 功能正確
2. 核心流程穩定
3. 阻斷性問題
4. 視覺一致
5. 細部美化
```

Codex token / usage budget is limited. Do not refactor working functionality only for visual consistency unless the user explicitly requests it.

## 3. Brand Direction

The target brand style is:

```text
Modern
Clean
Friendly
Lightweight
Professional
Questionnaire SaaS Web Application
```

The interface should feel trustworthy and efficient for survey creation, submission, response review, and basic statistics.

## 4. Primary Color

Primary / Brand Color is fixed:

```text
#1F8196
```

Design token example:

```css
:root {
  --color-primary: #1F8196;
  --color-primary-hover: #17697C;
  --color-primary-active: #155E70;
  --color-primary-light: #E3F2F6;
  --color-primary-subtle: #F0F8FA;
  --color-primary-border: #A8CCD4;
}
```

Do not replace `#1F8196` with another brand primary color.

Primary color should be used for future target design in:

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
- 主要品牌 Highlight

Semantic colors remain independent. Success, warning, danger, and disabled states should not be collapsed into the primary color.

## 5. Color Tokens

Target token direction:

| Token | Target | Purpose |
|---|---:|---|
| `--color-primary` | `#1F8196` | Brand primary, CTA, active state |
| `--color-primary-hover` | `#17697C` | Primary hover |
| `--color-primary-active` | `#155E70` | Pressed / active emphasis |
| `--color-primary-light` | `#E3F2F6` | Soft selected background |
| `--color-primary-subtle` | `#F0F8FA` | Very light primary surface |
| `--color-primary-border` | `#A8CCD4` | Primary-tinted border |
| `--color-text-primary` | `#17232C` | Main headings and body emphasis |
| `--color-text-secondary` | `#52616B` | Supporting text |
| `--color-surface` | `#FFFFFF` | Cards, panels, dialogs |
| `--color-background` | `#F4F8FB` | App and section background |
| `--color-border` | `#D6E0E7` | Borders and dividers |
| `--color-success` | keep semantic green | Success status |
| `--color-warning` | keep semantic amber | Warning status |
| `--color-danger` | keep semantic red | Error and destructive action |

## 6. Typography Principle

Use the existing font direction unless a future style refresh explicitly changes it:

```css
'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

Typography should be clear and compact for desktop web application workflows:

- Page titles should be direct and not oversized in dashboard or table screens.
- Card titles should remain smaller than page titles.
- Helper text should be readable and not overly pale.
- Chinese UI copy should be short, action-oriented, and easy to scan.

## 7. Spacing Principle

Use consistent spacing steps:

```text
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
```

Prefer predictable layout spacing over decorative empty space. Admin and survey workflows should remain dense enough for scanning and repeated use.

## 8. Button / Form / Card / Table Principle

Buttons:

- Primary actions use the primary brand color in the target system.
- Secondary actions use neutral surfaces or muted text.
- Destructive actions keep a semantic danger color.
- Disabled buttons should visibly disable hover and click affordance.

Forms:

- Focus state should use the primary color.
- Validation errors must include text, not only color.
- Required marks use semantic danger color.

Cards:

- Use white surface, subtle border, light shadow.
- Keep border radius moderate, generally 6px to 10px.
- Avoid card-inside-card layouts unless structurally necessary.

Tables:

- Prioritize readability, alignment, and scanning.
- Header rows should use subtle background and strong label weight.
- Empty states should explain what happened and the next available action.

## 9. Navbar Principle

Target navbar direction:

- Active navigation uses Primary / Brand Color `#1F8196`.
- Inactive navigation uses secondary text.
- Keep layout predictable for desktop web application use.
- Do not introduce a mobile hamburger navbar unless explicitly requested.

## 10. Images / Illustrations

Currently do not regenerate images.

This includes:

- Hero Image
- Banner
- Illustration
- Empty State Image
- Background Image
- Other decorative images

Existing images remain for now. Future generated or replaced images should match:

```text
Primary #1F8196
Modern
Clean
Friendly
Lightweight
Professional
Questionnaire SaaS Web Application
```

Avoid:

```text
Different visual style per page
Heavy neon
Cyberpunk
Excessive gradient
Excessive glassmorphism
Excessive cartoon style
```

## 11. Current vs Target

| Area | Current | Target |
|---|---|---|
| Legacy admin / survey UI | Some screens still use legacy blue such as `#3B82F6` | Gradually migrate primary actions and active states to `#1F8196` in a future style refresh |
| Homepage / account UI | Already uses a teal direction close to `#1F8196` | Standardize tokens around `--color-primary: #1F8196` |
| Charts | Some colors may include legacy blue or mixed chart palettes | Use `#1F8196` for primary emphasis while preserving multi-series readability |
| Images | Existing images and references are retained | Regenerate or replace together during post-demo visual refresh |

Do not describe the current UI as fully migrated. Current and target states must remain clearly separated.

## 12. Post-Demo Visual Refresh

Record only for later. Do not implement this refresh now.

Future refresh checklist:

1. 全站 Color Token 化
2. Primary 統一 `#1F8196`
3. Typography 統一
4. Spacing 統一
5. Border Radius 統一
6. Shadow 統一
7. Button 統一
8. Form 統一
9. Card 統一
10. Table 統一
11. Navbar 視覺統一
12. Icon 統一
13. Empty State 統一
14. Loading / Feedback State 統一
15. Hero / Banner / Illustration 重新產圖
16. 最後執行完整 Visual QA

## 13. Do / Don't

Do:

- Keep functional correctness first.
- Use repository-relative paths in shared documentation.
- Treat `#1F8196` as the future target primary color.
- Keep semantic colors independent.
- Record visual inconsistencies for the later style refresh.

Don't:

- Do not perform broad UI refactors now.
- Do not search all hex colors and replace them globally.
- Do not regenerate project images now.
- Do not introduce Tailwind, Bootstrap, Angular Material, or another large UI framework without explicit request.
- Do not change working business logic for visual reasons.
