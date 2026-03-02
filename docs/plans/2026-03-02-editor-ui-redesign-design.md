# Editor UI Redesign — Design Doc

**Date:** 2026-03-02
**Status:** Approved for implementation (Option A; Option C as fallback)

---

## Goal

Rethink the ArchiGram editor from the ground up as a **professional dark IDE** (VS Code / Linear / Vercel aesthetic). Fix the cluttered header, incoherent button colors, flat sidebar, and overall lack of visual polish.

## Aesthetic Direction

Professional dark IDE. Subtle zinc grays, single indigo accent, clean Inter typography, dense 13px base size. No visual noise. Serious tool feel.

---

## Color System

Replace current 9-variable palette with a tighter set using true near-black values:

| CSS Variable         | Value                 | Usage                                      |
| -------------------- | --------------------- | ------------------------------------------ |
| `--bg`               | `9 9 11` → `13 13 15` | App background (slightly warmer)           |
| `--surface`          | `20 20 22`            | Activity bar, panel bg                     |
| `--surface-elevated` | `28 28 31`            | Dropdowns, hover states                    |
| `--border`           | `42 42 46`            | All dividers, outlines                     |
| `--text`             | `228 228 231`         | Primary text (unchanged)                   |
| `--text-muted`       | `113 113 122`         | Labels, timestamps                         |
| `--text-dim`         | `63 63 70`            | Line numbers, placeholders                 |
| `--primary`          | `99 102 241`          | Single accent: Publish CTA + active states |
| `--primary-bg`       | `30 30 63`            | Selected sidebar item background           |

**Key rule:** Only the **Publish** button gets primary color. All other actions (Save, Audit, SVG, PNG, New, Share) are zinc ghost/outline.

---

## Layout Structure

```
┌────────────────────────────────────────────────────────┐
│ HEADER 44px                                             │
│ [logo] [Project Name ·]   [Code|Split|Preview]   [Share] [Publish] [···] │
├──┬──────────────────┬────────────────┬─────────────────┤
│  │                  │                │                 │
│48│  ACTIVITY BAR    │  PANEL 240px   │  CODE EDITOR    │
│px│  (icons only)    │  (slides open  │  ─ ─ ─ ─ ─ ─   │
│  │                  │   on click)    │                 │
│  │  📁 Projects     │                │  DIAGRAM        │
│  │  ⊞  Templates   │                │  PREVIEW        │
│  │  🌐 Community   │                │                 │
│  │                  │                │                 │
│  │  ─── spacer ─── │                │  [zoom pill]    │
│  │                  │                │  [copilot btn]  │
│  │  ✦  Copilot     │                │                 │
│  │  ⚙  Settings    │                │                 │
└──┴──────────────────┴────────────────┴─────────────────┘
```

**Activity bar:** 48px wide, icons only. VS Code-style active indicator: 2px left border in indigo + indigo icon. Tooltip on hover. Click toggles panel open/closed for that section.

**Sliding panel:** 240px wide, slides in with 150ms ease-out. Header: section name (10px uppercase zinc-500) + close ×. Separator: 1px right border only — no drop shadow.

**Fallback (Option C):** If Option A feels too hidden/unidiomatic, switch to an 80px rail with icon + short label below each (like JetBrains), no change to panel behavior.

---

## Header Redesign

### Before

9 buttons with 4 colors across the entire header width.

### After

**Left zone:** `⬡ ArchiGram.ai` logo + `[Project Name ·]` (inline-editable, dirty dot indicator)

**Center zone:** View mode toggle group — `</>` Code · `⊞` Split · `👁` Preview
Style: transparent bg + zinc-500 text when inactive; zinc-800 bg + zinc-100 text when active. No border.

**Right zone (left to right):**

1. Theme toggle — sun/moon icon only, no label, no dropdown label
2. `Share ▾` — ghost outline button. Dropdown contains: Copy Link, Copy SVG, Export SVG, Export PNG
3. `Publish` — filled indigo (primary, only colored button in entire UI)
4. `···` overflow — dropdown with: + New Project, Audit, Scan Image, Save, Keyboard Shortcuts

---

## Component Changes

### New: `ActivityBar.tsx`

- 48px vertical icon rail
- Icons: FolderOpen (Projects), LayoutTemplate (Templates), Globe (Community), Sparkles (Copilot), Settings
- Props: `activePanel: string | null`, `onPanelToggle: (panel: string) => void`
- Active state: `border-l-2 border-primary text-primary`; inactive: `text-text-dim hover:text-text-muted`

### New: `SidePanel.tsx`

- Wraps existing Sidebar content
- Width: 240px, animated with CSS `width` transition or `translate-x`
- Renders different content based on `activePanel`: projects list, templates, community link

### Modified: `Header.tsx`

- Remove individual color classes from Audit (orange), Save (green) buttons
- Collapse SVG + PNG + Copy into `Share ▾` dropdown
- Move New, Audit, Scan Image, Save to `···` overflow
- Add dirty indicator dot next to project name

### Modified: `EditorShell.tsx`

- Replace `<Sidebar>` with `<ActivityBar>` + `<SidePanel>`
- UIContext: replace `isSidebarOpen: boolean` with `activePanel: string | null`
- Remove `w-72` / `w-[70px]` sidebar width variants

### Modified: `globals.css`

- Update dark theme CSS variable values
- Add `--surface-elevated` and `--primary-bg` tokens

---

## Themes

The existing 5 theme system (dark/midnight/forest/neutral) is preserved. Only the `dark` theme token values change. Other themes unchanged.

---

## What Stays the Same

- All Tailwind utility classes (`bg-surface`, `text-text`, `border-border`, etc.) — no class renames
- All component logic, hooks, contexts
- All existing modal components
- Vitest tests (no logic changes, only presentational)

---

## Testing

1. Visual: deploy to Vercel preview, compare against current production
2. Functional: all 134 existing Vitest tests must still pass (`bun run test:run`)
3. Manual: verify view mode toggles, panel open/close, overflow menu, theme switcher, Publish button
4. Fallback: if activity bar feels unintuitive after testing → switch to Option C (labeled tab rail, 80px)
