# Social Sharing & Embeds Design — 2026-02-26

## Scope

Two features to drive viral growth:

1. **Embed view** — a clean `?embed=true` renderer for iframes, with three modes
2. **Embed code generator** — upgraded modal with mode/size picker and live preview
3. **Social sharing improvements** — richer OG titles and better share text

## Approach

Query-param route in the existing SPA. Detect `?embed=true` at App.tsx load time and short-circuit to `EmbedView` before rendering the normal app. No new build entrypoints, no new Vercel routes.

---

## Section 1: Embed View

### URL Format

```
https://archigram.ai/?embed=true&mode=toolbar#<lz-hash>
```

- `?embed=true` — triggers embed mode
- `?mode=minimal|toolbar|interactive` — embed variant (default: `toolbar`)
- `#<lz-hash>` — LZ-string compressed diagram code (same format as existing share links)

### Modes

| Mode          | What's shown                                                                                |
| ------------- | ------------------------------------------------------------------------------------------- |
| `minimal`     | Diagram only, no chrome                                                                     |
| `toolbar`     | Diagram + zoom in/out/reset + "Made with ArchiGram.ai" badge                                |
| `interactive` | Toolbar + "Fork this diagram →" button (opens ArchiGram in new tab with diagram pre-loaded) |

### Component: `EmbedView.tsx`

- Reads `mode` from `URLSearchParams`
- Decodes diagram code from `window.location.hash` via existing `decodeCodeFromUrl`
- Renders `<DiagramPreview>` (already exists) for the diagram
- Minimal chrome: zoom controls and badge are absolutely positioned overlays
- "Fork" button constructs the full ArchiGram URL with the same hash and opens in new tab
- Handles missing/invalid hash gracefully (shows a placeholder)

### App.tsx change

At the very top of the `App` component body, before any other rendering:

```ts
const searchParams = new URLSearchParams(window.location.search);
if (searchParams.get('embed') === 'true') {
  return <EmbedView />;
}
```

---

## Section 2: Embed Code Generator

### Upgraded Embed Modal (in `Header.tsx`)

**Mode selector** — three pill buttons:

- Minimal
- Toolbar (default selected)
- Interactive

**Size selector:**

- Width: `100%` (default) or custom px input
- Height: `400` / `500` (default) / `600` / custom px

**Generated `<iframe>` snippet** — updates live:

```html
<iframe
  src="https://archigram.ai/?embed=true&mode=toolbar#<hash>"
  width="100%"
  height="500"
  frameborder="0"
  style="border-radius: 8px; border: 1px solid #333;"
  title="<diagram-name> — ArchiGram.ai"
></iframe>
```

**Copy button** — copies the snippet. Shows "Copied!" for 2s.

No live thumbnail preview (YAGNI — the diagram is already visible in the editor behind the modal).

---

## Section 3: Social Sharing Improvements

### OG Image Title

The existing `handleShareTwitter` and `handleShareLinkedIn` in `Header.tsx` construct a `shareUrl` from the current hash. Add `?title=<diagram-name>` to the base URL:

```ts
const shareUrl = `${base}?title=${encodeURIComponent(activeProject?.name || 'Architecture Diagram')}#${hash}`;
```

The existing `/api/og-image` already reads `?title=` — social crawlers will pick up the branded card with the diagram name.

### Share Text

**Twitter:**

```
I just built a "{diagram name}" with @ArchiGram_ai — check it out:
```

**LinkedIn:** URL only (their sharer ignores `summary` param for most users).

---

## Files Changed

| File                       | Change                                                                 |
| -------------------------- | ---------------------------------------------------------------------- |
| `components/EmbedView.tsx` | **New** — embed renderer with mode support                             |
| `App.tsx`                  | Detect `?embed=true`, short-circuit to `EmbedView`                     |
| `components/Header.tsx`    | Upgrade embed modal with mode/size picker; improve share URLs and text |
| `types.ts`                 | Add `EmbedMode` type (`'minimal' \| 'toolbar' \| 'interactive'`)       |

## Out of Scope

- Embed analytics (view counts per embed)
- Password-protected embeds
- Dark/light mode toggle in embed
- Embed preview thumbnail in modal
