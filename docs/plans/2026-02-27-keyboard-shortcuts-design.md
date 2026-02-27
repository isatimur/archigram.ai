# Keyboard Shortcuts Design — 2026-02-27

## Scope

Three additions to complete the keyboard shortcuts feature (Phase 2: Viral Growth):

1. **Wire `⌘⇧S`** — copy share link shortcut (handler already exists, not yet bound)
2. **Shortcut hints in CommandPalette** — show shortcut badge next to each command
3. **`KeyboardShortcutsModal`** — full cheat sheet opened via `?` key

## What Already Works (undiscoverable)

| Shortcut | Action                              |
| -------- | ----------------------------------- |
| `⌘K`     | Open command palette                |
| `⌘N`     | New diagram                         |
| `⌘D`     | Duplicate diagram                   |
| `⌘E`     | Export PNG                          |
| `⌘⇧E`    | Export SVG                          |
| `⌘⇧P`    | Publish to gallery                  |
| `⌘G`     | Toggle gallery                      |
| `⌘/`     | Toggle AI chat                      |
| `⌘S`     | "Saved" toast                       |
| `Esc`    | Close modals                        |
| `Enter`  | Submit AI prompt (in chat textarea) |
| `⇧↵`     | New line in AI chat                 |

## New Shortcuts

| Shortcut | Action                          |
| -------- | ------------------------------- |
| `⌘⇧S`    | Copy share link (`handleShare`) |
| `?`      | Open keyboard shortcuts modal   |

---

## Section 1: Wire `⌘⇧S` in `useKeyboardShortcuts`

Add `handleShare` to the hook's options interface and dependency array. Add binding:

```ts
if (modKey && e.shiftKey && e.key === 'S') {
  e.preventDefault();
  handleShare();
  return;
}
```

---

## Section 2: `KeyboardShortcutsModal` Component

### Layout

Centered overlay modal. Two-column grid of shortcuts, grouped into sections with uppercase labels.

```
┌─────────────────────────────────────────┐
│  Keyboard Shortcuts              ⌘?  ✕  │
├─────────────────────────────────────────┤
│  EDITOR                                 │
│  New diagram          ⌘ N               │
│  Duplicate            ⌘ D               │
│  Copy share link      ⌘ ⇧ S             │
│  Publish to gallery   ⌘ ⇧ P             │
├─────────────────────────────────────────┤
│  EXPORT                                 │
│  Export PNG           ⌘ E               │
│  Export SVG           ⌘ ⇧ E             │
├─────────────────────────────────────────┤
│  VIEW                                   │
│  Toggle AI chat       ⌘ /               │
│  Command palette      ⌘ K               │
│  Open gallery         ⌘ G               │
│  This panel           ?                 │
├─────────────────────────────────────────┤
│  AI CHAT                                │
│  Submit prompt        ↵                 │
│  New line             ⇧ ↵               │
└─────────────────────────────────────────┘
```

### Key rendering

Each key rendered as a `<kbd>` element — small rounded pill, `bg-zinc-700`, `text-zinc-300`, `text-xs`, `px-1.5 py-0.5`.

### Props

```ts
interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### Dismiss

- Click overlay backdrop → close
- `Escape` → close (handled by existing `useKeyboardShortcuts` Escape block)

---

## Section 3: CommandPalette Shortcut Hints

Add optional `shortcut?: string` field to the `Command` interface. Render it as a small grey badge aligned right in each command row.

Commands to annotate:

| Command id     | Shortcut hint |
| -------------- | ------------- |
| `new`          | `⌘N`          |
| `duplicate`    | `⌘D`          |
| `export-png`   | `⌘E`          |
| `export-svg`   | `⌘⇧E`         |
| `share`        | `⌘⇧S`         |
| `publish`      | `⌘⇧P`         |
| `gallery`      | `⌘G`          |
| `view-split`   | —             |
| `view-code`    | —             |
| `view-preview` | —             |
| `audit`        | —             |
| `scan-image`   | —             |

---

## Files Changed

| File                                    | Change                                                                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/useKeyboardShortcuts.ts`         | Add `handleShare` + `isShortcutsModalOpen` + `setIsShortcutsModalOpen` params; add `⌘⇧S` and `?` bindings; add `isShortcutsModalOpen` to Escape block |
| `components/KeyboardShortcutsModal.tsx` | **New** — cheat sheet modal                                                                                                                           |
| `components/CommandPalette.tsx`         | Add `shortcut?: string` to `Command` type; populate for relevant commands; render badge                                                               |
| `App.tsx`                               | Add `isShortcutsModalOpen` state; pass new props to `useKeyboardShortcuts`; lazy-load and render `KeyboardShortcutsModal`                             |

## Out of Scope

- Customisable keybindings
- Per-platform shortcut variations displayed differently (Mac vs Windows labels shown the same)
- Shortcut onboarding tooltip on first visit
