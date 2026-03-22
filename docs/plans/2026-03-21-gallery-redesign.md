# Gallery Page Redesign — Design Doc

**Date:** 2026-03-21
**Status:** Approved

## Goal

Redesign `components/CommunityGallery.tsx` into a dark editorial gallery that makes diagrams the visual hero. Improves discoverability with tag/type pill filtering and a more polished card layout.

## Aesthetic Direction

**Dark Editorial** — inspired by design portfolios (Dribbble, Behance dark mode). Diagram previews are the primary visual element. High contrast, dramatic hover states, crisp typography.

- Typography: display font for the header, geometric mono for tags/counts
- Color: existing CSS variables (`--bg`, `--surface`, `--primary`) plus richer shadow/glow on hover
- Motion: card lift + glow on hover, staggered entrance animation on load, animated heart on like

## Components

### Sticky Filter + Sort Strip

A single sticky bar just below the navbar (not the navbar itself):

```
[ All ] [ Flowchart ] [ Sequence ] [ C4 ] [ Architecture ] [ ER Diagram ] [ Class ] [ State ] …    Trending ▾
```

- Tag pills derived from `tags` field across all loaded diagrams (deduplicated)
- Active pill: `bg-primary text-white`
- Sort dropdown or 3-tab group, right-aligned

### Card Grid

- CSS columns masonry, 3 → 2 → 1 columns
- Card preview: `min-h-[200px] max-h-[340px]`, dark canvas `#0d0d10`
- Hover overlay: two CTA buttons — **Fork** (primary) + **View Code** (ghost)
- Card footer: author initials avatar, `@author`, ❤ likes (tap-to-like), 💬 comments, 👁 views
- Tags as `#tag` chips, small, `bg-primary/10 text-primary`

### Header

- "Community Diagrams" in bold display font
- Subtitle: diagram count + "from the community"
- Import URL button, top-right

### Empty / Loading States

- Skeleton cards (pulsing) during load — same masonry layout
- Empty state: centered illustration + "No diagrams match your filter"

## What's Removed / Fixed

- Remove inline "Contribution Rewards Program" CTA from the grid — it always renders even when diagrams exist
- No layout change to the navbar (back button, search, workspace button stay)

## Files Changed

- `components/CommunityGallery.tsx` — full rewrite of layout and card design
- `app/gallery/page.tsx` — no changes needed

## Non-Goals

- No server-side filtering (all client-side on the 100-item fetch)
- No infinite scroll (future work)
- No auth-gated features
