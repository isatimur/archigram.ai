# Editor UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle the ArchiGram editor into a professional dark IDE (VS Code aesthetic): refined CSS tokens, VS Code-style activity bar replacing the current sidebar, and a decluttered header with a single indigo primary CTA.

**Architecture:** Five independent tasks touching CSS variables, UIContext state, two new components (ActivityBar, SidePanel wrapper), EditorShell layout, and Header visual cleanup. No logic changes — all existing handlers and modals stay wired identically.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, TypeScript, Lucide icons.

---

## Task 1: Update Dark Theme CSS Tokens

**Goal:** Tighten the dark palette. Deeper blacks, narrower border contrast, add `--surface-elevated`, `--primary-bg`, `--text-dim` tokens. Other themes (midnight, forest, neutral) are **unchanged**.

**Files:**

- Modify: `app/globals.css`
- Modify: `app/_components/EditorShell.tsx` (THEMES.dark object only)

**Step 1: Update `app/globals.css` @theme block**

Replace the existing `@theme` block contents with:

```css
@theme {
  --font-family-sans: 'Inter', sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;

  --color-background: rgb(var(--bg) / <alpha-value>);
  --color-surface: rgb(var(--surface) / <alpha-value>);
  --color-surface-hover: rgb(var(--surface-hover) / <alpha-value>);
  --color-surface-elevated: rgb(var(--surface-elevated) / <alpha-value>);
  --color-border: rgb(var(--border) / <alpha-value>);
  --color-text: rgb(var(--text) / <alpha-value>);
  --color-text-muted: rgb(var(--text-muted) / <alpha-value>);
  --color-text-dim: rgb(var(--text-dim) / <alpha-value>);
  --color-primary: rgb(var(--primary) / <alpha-value>);
  --color-primary-hover: rgb(var(--primary-hover) / <alpha-value>);
  --color-primary-bg: rgb(var(--primary-bg) / <alpha-value>);
  --color-accent: rgb(var(--accent) / <alpha-value>);

  --animate-fade-in: fadeIn 0.4s ease-in-out;
  --animate-slide-up: slideUp 0.5s ease-out;
  --animate-pulse-slow: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  @keyframes slideUp {
    0% {
      transform: translateY(20px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
}
```

**Step 2: Update `:root` dark theme values in `app/globals.css`**

Replace the existing `:root` block with:

```css
:root {
  --bg: 13 13 15;
  --surface: 20 20 22;
  --surface-hover: 28 28 31;
  --surface-elevated: 36 36 40;
  --border: 42 42 46;
  --text: 228 228 231;
  --text-muted: 113 113 122;
  --text-dim: 63 63 70;
  --primary: 99 102 241;
  --primary-hover: 79 70 229;
  --primary-bg: 30 30 63;
  --accent: 168 85 247;
}
```

**Step 3: Update `THEMES.dark` in `app/_components/EditorShell.tsx`**

Find the `dark:` entry inside the `THEMES` const (lines ~38–48) and replace it:

```typescript
  dark: {
    '--bg': '13 13 15',
    '--surface': '20 20 22',
    '--surface-hover': '28 28 31',
    '--surface-elevated': '36 36 40',
    '--border': '42 42 46',
    '--text': '228 228 231',
    '--text-muted': '113 113 122',
    '--text-dim': '63 63 70',
    '--primary': '99 102 241',
    '--primary-hover': '79 70 229',
    '--primary-bg': '30 30 63',
    '--accent': '168 85 247',
  },
```

**Step 4: Run tests**

```bash
bun run test:run
```

Expected: All 134 tests pass (no logic changed).

**Step 5: Commit**

```bash
git add app/globals.css app/_components/EditorShell.tsx
git commit -m "style(tokens): tighten dark theme palette, add surface-elevated/primary-bg/text-dim"
```

---

## Task 2: Add `activePanel` to UIContext

**Goal:** Replace `isSidebarOpen / isSidebarCollapsed` with `activePanel: ActivePanel` where `ActivePanel = 'projects' | 'templates' | 'community' | null`. Panel starts open on desktop (`'projects'`), closed on mobile (`null`).

**Files:**

- Modify: `lib/contexts/UIContext.tsx`

**Step 1: Replace UIContext**

Rewrite `lib/contexts/UIContext.tsx` completely:

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewMode } from '@/types';
import type { DiagramTheme } from '@/types';

export type ActivePanel = 'projects' | 'templates' | 'community' | null;

type UIContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  // Keep legacy aliases so EditorShell and Sidebar compile without changes initially
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  theme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;
  isPublishModalOpen: boolean;
  setIsPublishModalOpen: (open: boolean) => void;
  isImageImportModalOpen: boolean;
  setIsImageImportModalOpen: (open: boolean) => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  isPublishPromptModalOpen: boolean;
  setIsPublishPromptModalOpen: (open: boolean) => void;
  isAIChatExpanded: boolean;
  setIsAIChatExpanded: React.Dispatch<React.SetStateAction<boolean>>;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [activePanel, setActivePanel] = useState<ActivePanel>('projects');
  const [theme, setTheme] = useState<DiagramTheme>('dark');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isImageImportModalOpen, setIsImageImportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isPublishPromptModalOpen, setIsPublishPromptModalOpen] = useState(false);
  const [isAIChatExpanded, setIsAIChatExpanded] = useState(true);

  // Responsive: close panel on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode(ViewMode.Preview);
        setActivePanel(null);
      } else {
        setActivePanel((p) => p ?? 'projects');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Legacy aliases derived from activePanel
  const isSidebarOpen = activePanel !== null;
  const setIsSidebarOpen = (open: boolean) => setActivePanel(open ? 'projects' : null);
  const isSidebarCollapsed = false;
  const setIsSidebarCollapsed = (_: boolean) => {};

  return (
    <UIContext.Provider
      value={{
        viewMode,
        setViewMode,
        activePanel,
        setActivePanel,
        isSidebarOpen,
        setIsSidebarOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        theme,
        setTheme,
        isPublishModalOpen,
        setIsPublishModalOpen,
        isImageImportModalOpen,
        setIsImageImportModalOpen,
        isAuditModalOpen,
        setIsAuditModalOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isShortcutsModalOpen,
        setIsShortcutsModalOpen,
        isPublishPromptModalOpen,
        setIsPublishPromptModalOpen,
        isAIChatExpanded,
        setIsAIChatExpanded,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
```

**Step 2: Run type-check**

```bash
bun run type-check 2>&1 | head -40
```

Expected: 0 errors (legacy aliases ensure existing consumers still compile).

**Step 3: Run tests**

```bash
bun run test:run
```

Expected: All 134 tests pass.

**Step 4: Commit**

```bash
git add lib/contexts/UIContext.tsx
git commit -m "refactor(ui-context): replace isSidebarOpen/Collapsed with activePanel, keep legacy aliases"
```

---

## Task 3: Create ActivityBar Component

**Goal:** Build the 48px VS Code-style icon rail. Icons: Projects (folder), Templates (layout), Community (globe). Footer: Copilot (sparkles). Active state: 2px left indigo stripe + indigo icon. No labels (tooltip on hover).

**Files:**

- Create: `app/_components/ActivityBar.tsx`

**Step 1: Create the file**

```typescript
// app/_components/ActivityBar.tsx
'use client';

import { FolderOpen, LayoutTemplate, Globe, Sparkles } from 'lucide-react';
import type { ActivePanel } from '@/lib/contexts/UIContext';

interface ActivityBarProps {
  activePanel: ActivePanel;
  onPanelToggle: (panel: Exclude<ActivePanel, null>) => void;
  onOpenCopilot: () => void;
}

const TOP_ITEMS = [
  { id: 'projects' as const, icon: FolderOpen, label: 'Projects' },
  { id: 'templates' as const, icon: LayoutTemplate, label: 'Templates' },
  { id: 'community' as const, icon: Globe, label: 'Community' },
] as const;

export default function ActivityBar({ activePanel, onPanelToggle, onOpenCopilot }: ActivityBarProps) {
  return (
    <div
      className="w-12 h-full flex flex-col items-center py-1 bg-surface border-r border-border shrink-0"
      role="navigation"
      aria-label="Activity bar"
    >
      {/* Top: panel toggles */}
      <div className="flex-1 flex flex-col items-center gap-0.5 pt-1">
        {TOP_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activePanel === id;
          return (
            <button
              key={id}
              title={label}
              aria-label={label}
              aria-pressed={isActive}
              onClick={() => onPanelToggle(id)}
              className={`
                relative w-10 h-10 flex items-center justify-center rounded-md transition-colors
                ${isActive
                  ? 'text-primary bg-primary-bg'
                  : 'text-text-dim hover:text-text-muted hover:bg-surface-hover'}
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full" />
              )}
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Bottom: copilot */}
      <div className="flex flex-col items-center gap-0.5 pb-2">
        <button
          title="AI Copilot"
          aria-label="Open AI Copilot"
          onClick={onOpenCopilot}
          className="w-10 h-10 flex items-center justify-center rounded-md text-text-dim hover:text-text-muted hover:bg-surface-hover transition-colors"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Run type-check**

```bash
bun run type-check 2>&1 | grep ActivityBar
```

Expected: No errors for ActivityBar.

**Step 3: Commit**

```bash
git add app/_components/ActivityBar.tsx
git commit -m "feat(activity-bar): VS Code-style 48px icon rail with panel toggles and copilot shortcut"
```

---

## Task 4: Wire ActivityBar into EditorShell

**Goal:** Replace the conditional `<Sidebar>` blocks and the floating "open sidebar" button with `<ActivityBar>` (always visible) + a sliding panel wrapper around `<Sidebar>`. The `Sidebar` component itself is unchanged.

**Files:**

- Modify: `app/_components/EditorShell.tsx`

**Step 1: Add imports at top of EditorShell.tsx**

After the existing `import { PanelLeftOpen, Trash2, Loader2 } from 'lucide-react';` line, add:

```typescript
import ActivityBar from '@/app/_components/ActivityBar';
import type { ActivePanel } from '@/lib/contexts/UIContext';
```

**Step 2: Pull `activePanel` and `setActivePanel` from UIContext**

In the `useUI()` destructure block (around line 98), add after `isSidebarCollapsed`:

```typescript
    activePanel,
    setActivePanel,
```

**Step 3: Add panel toggle handler**

After the `setCurrentView` helper (around line 171), add:

```typescript
const handlePanelToggle = (panel: Exclude<ActivePanel, null>) => {
  setActivePanel(activePanel === panel ? null : panel);
};
```

**Step 4: Replace the entire sidebar + floating button section**

The current code in `<main>` has three blocks:

1. `{isSidebarOpen && (<div className="hidden md:block ..."> <Sidebar ... /> </div>)}` — desktop sidebar
2. `{isSidebarOpen && (<div className="md:hidden absolute ..."> ... mobile overlay ... </div>)}`
3. `{!isSidebarOpen && (<button ... PanelLeftOpen>)}`

Replace all three blocks with this single structure, placed as the **first child of `<main>`** before the CodeEditor:

```tsx
{
  /* Activity Bar — always visible */
}
<ActivityBar
  activePanel={activePanel}
  onPanelToggle={handlePanelToggle}
  onOpenCopilot={() => setIsAIChatExpanded(true)}
/>;

{
  /* Side Panel — slides open when activePanel is set */
}
<div
  className={`
            hidden md:flex h-full transition-[width] duration-150 ease-out overflow-hidden shrink-0
            border-r border-border bg-surface
            ${activePanel !== null ? 'w-60' : 'w-0'}
          `}
>
  <div className="w-60 h-full overflow-hidden">
    <Suspense fallback={<div className="w-full h-full bg-surface" />}>
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onCreateFromTemplate={handleCreateFromTemplate}
        onDeleteProject={handleDeleteProject}
        onClose={() => setActivePanel(null)}
        lastSaved={lastSaved}
        saveStatus={saveStatus}
        onRenameProject={handleRenameProject}
        isCollapsed={false}
        toggleCollapse={() => {}}
        onOpenGallery={() => setCurrentView('gallery')}
        onScanImage={() => setIsImageImportModalOpen(true)}
      />
    </Suspense>
  </div>
</div>;

{
  /* Mobile Side Panel Overlay */
}
{
  activePanel !== null && (
    <div className="md:hidden absolute inset-0 z-40 flex">
      <div className="w-60 h-full shadow-2xl relative z-50 bg-surface">
        <Suspense fallback={<div className="w-full h-full bg-surface" />}>
          <Sidebar
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => {
              handleSelectProject(id);
              setActivePanel(null);
            }}
            onCreateProject={() => {
              handleCreateProject();
              setActivePanel(null);
            }}
            onCreateFromTemplate={(name, code) => {
              handleCreateFromTemplate(name, code);
              setActivePanel(null);
            }}
            onDeleteProject={handleDeleteProject}
            onClose={() => setActivePanel(null)}
            lastSaved={lastSaved}
            saveStatus={saveStatus}
            onRenameProject={handleRenameProject}
            isCollapsed={false}
            toggleCollapse={() => {}}
            onOpenGallery={() => {
              setCurrentView('gallery');
              setActivePanel(null);
            }}
            onScanImage={() => setIsImageImportModalOpen(true)}
          />
        </Suspense>
      </div>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setActivePanel(null)} />
    </div>
  );
}
```

**Step 5: Remove the `PanelLeftOpen` import** from lucide-react (it's no longer used):

Change:

```typescript
import { PanelLeftOpen, Trash2, Loader2 } from 'lucide-react';
```

To:

```typescript
import { Trash2, Loader2 } from 'lucide-react';
```

**Step 6: Run type-check**

```bash
bun run type-check 2>&1 | head -30
```

Expected: 0 errors.

**Step 7: Run tests**

```bash
bun run test:run
```

Expected: All 134 tests pass.

**Step 8: Commit**

```bash
git add app/_components/EditorShell.tsx
git commit -m "feat(layout): replace sidebar toggle with VS Code activity bar + sliding panel"
```

---

## Task 5: Redesign Header — Declutter and Swap Primary CTA

**Goal:**

1. Slim header from `h-16` to `h-11` (44px IDE feel)
2. **Swap colors**: `Share` loses primary indigo fill → becomes ghost outline; `Publish` gains indigo fill
3. **Remove standalone buttons**: `Audit` (orange), `Save` (green), `New` — all move to `···` overflow dropdown
4. **Remove** `Tools` dropdown from center (navigation is now in activity bar / top nav — not needed in editor header)
5. Keep view mode toggles and theme toggle in center zone

**Files:**

- Modify: `components/Header.tsx`

**Step 1: Add `MoreHorizontal` to the lucide-react import**

Find the import block at the top of `components/Header.tsx`. Add `MoreHorizontal` to it:

```typescript
import {
  Share2,
  Palette,
  Code2,
  Columns,
  Eye,
  Image as ImageIcon,
  FileCode,
  Check,
  ChevronDown,
  Plus,
  Pencil,
  UploadCloud,
  Rocket,
  Sun,
  Moon,
  Save,
  ShieldCheck,
  Twitter,
  Linkedin,
  Link2,
  Copy,
  Code,
  X,
  User,
  LogOut,
  Mail,
  MoreHorizontal,
} from 'lucide-react';
```

(Remove `Grid` and `Binary` — they were only used in the Tools dropdown which we're removing.)

**Step 2: Add `showOverflow` state**

In the component's state declarations (around line 84), add:

```typescript
const [showOverflow, setShowOverflow] = useState(false);
```

**Step 3: Slim the header height**

Find line 190:

```typescript
      <header className="h-16 border-b border-border bg-background/80 ...
```

Change `h-16` to `h-11`:

```typescript
      <header className="h-11 border-b border-border bg-background/80 ...
```

**Step 4: Remove the Tools dropdown block**

Delete the entire `{/* Tools Dropdown */}` block (lines ~252–320) from the middle section. This is the `<div className="relative">` containing the `showTools` state button and its dropdown. Also remove the `<div className="hidden md:block h-6 w-px bg-border/50">` divider immediately after it.

Also remove the `showTools` state declaration and the `setShowTools` calls (they become dead code).

**Step 5: Restyle the Share button from primary → ghost outline**

Find the Share button (around line 528–538):

```typescript
className =
  'flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg shadow-primary/20 border border-primary/20 transition-all hover:scale-105 active:scale-95 group';
```

Replace with:

```typescript
className =
  'flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text border border-border hover:border-text-muted/50 rounded-lg transition-all';
```

**Step 6: Restyle the Publish button from ghost → primary indigo fill**

Find the Publish button (around line 484–493):

```typescript
className =
  'hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text border border-border hover:border-text-muted/50 rounded-lg transition-all';
```

Replace with:

```typescript
className =
  'hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg shadow-primary/20 transition-all';
```

**Step 7: Remove the standalone Audit button**

Delete the entire `{/* Audit Button (Visible on MD+) */}` block (lines ~464–472) — the `<button>` with `text-orange-400` styling.

**Step 8: Remove the standalone Save Version button**

Delete the entire `{/* Save Version Button */}` block (lines ~474–482) — the `<button>` with `text-emerald-400` styling.

**Step 9: Remove the standalone New Project button**

Delete the `<button onClick={onNewProject} ...>` block with `Plus` icon (lines ~495–503).

**Step 10: Add the `···` overflow button and dropdown**

Place this immediately **after** the Publish button and **before** the closing `</div>` of the actions zone:

```tsx
{
  /* ··· Overflow Menu */
}
<div className="relative">
  <button
    onClick={() => setShowOverflow(!showOverflow)}
    className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
    title="More options"
    aria-label="More options"
    aria-expanded={showOverflow}
    aria-haspopup="menu"
  >
    <MoreHorizontal className="w-4 h-4" />
  </button>

  {showOverflow && (
    <>
      <div className="fixed inset-0 z-10" onClick={() => setShowOverflow(false)} />
      <div className="absolute top-full right-0 mt-2 w-52 py-1 bg-surface border border-border rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-text-dim font-semibold border-b border-border/50">
          Actions
        </div>
        <button
          onClick={() => {
            onNewProject();
            setShowOverflow(false);
          }}
          className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
        >
          <Plus className="w-4 h-4 text-text-muted" />
          New Project
        </button>
        <button
          onClick={() => {
            onSaveVersion('Manual Save');
            setShowOverflow(false);
          }}
          className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
        >
          <Save className="w-4 h-4 text-text-muted" />
          Save Checkpoint
        </button>
        <button
          onClick={() => {
            onAudit();
            setShowOverflow(false);
          }}
          className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
        >
          <ShieldCheck className="w-4 h-4 text-text-muted" />
          Run Audit
        </button>
        <div className="h-px bg-border/50 my-1" />
        <button
          onClick={() => {
            onExportSvg();
            setShowOverflow(false);
          }}
          className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
        >
          <FileCode className="w-4 h-4 text-text-muted" />
          Export SVG
        </button>
        <button
          onClick={() => {
            onExportPng();
            setShowOverflow(false);
          }}
          className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
        >
          <ImageIcon className="w-4 h-4 text-text-muted" />
          Export PNG
        </button>
      </div>
    </>
  )}
</div>;
```

Note: `FileCode` and `ImageIcon` are already imported.

**Step 11: Run type-check**

```bash
bun run type-check 2>&1 | head -30
```

Expected: 0 errors.

**Step 12: Run tests**

```bash
bun run test:run
```

Expected: All 134 tests pass.

**Step 13: Commit**

```bash
git add components/Header.tsx
git commit -m "style(header): slim to 44px, indigo Publish CTA, move Audit/Save/New to overflow menu"
```

---

## Final Verification

After all 5 tasks:

```bash
bun run validate
```

Expected output:

```
✓ Type check passed
✓ Lint passed (0 warnings)
✓ 134 tests passed
```

Then push and check the Vercel preview URL visually:

- Header is 44px, uncluttered, single indigo Publish button
- Activity bar (48px) shows folder/template/globe/sparkles icons
- Clicking Projects icon slides a 240px panel open/closed
- `···` overflow opens a dropdown with New, Save, Audit, Export SVG, Export PNG
- All existing modals (Auth, Publish, Audit, Shortcuts, Command Palette) still open correctly
- Dark theme has deeper blacks than before
