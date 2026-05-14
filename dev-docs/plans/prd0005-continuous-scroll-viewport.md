# PRD0005 — Continuous Scroll Viewport

## Status
Completed — container-aware viewport renders children as scrollable text. SegmentCard handles act/scene/character/stage-direction/annotation variants. Breadcrumb navigation in header. Canvas click resolves to parent container.

## Problem

The current reading viewport (PRD0004) shows one segment at a time with prev/next navigation. This works for discrete entities but fails for long-form text. A reader expects to scroll through a work vertically — acts, scenes, and speeches flowing top-to-bottom like a book. The segment-at-a-time model destroys reading flow and makes the text feel disjointed.

The UX vision makes this explicit: the primary reading axis is **vertical** (linear flow through a work). Segments are the content *of* a work, not separate pages to navigate between.

## Goal

When focusing a **container** entity (a work, act, or scene), render all its child segments in a continuous scrollable view — stacked vertically with visual hierarchy (headings for acts/scenes, character names for speeches). The reader scrolls freely, like reading a book.

Segment-focused entity navigation is replaced: clicking a segment on the canvas opens its parent container, not the segment alone.

## Scope

**In scope:**
- Container-aware reading viewport: render child segments of a container in sequence
- Query engine: `getContainerChildren` to fetch ordered child segments
- Visual hierarchy: act headings, scene headings, speech labels, stage directions formatted distinctly
- Scroll navigation: free scrolling replaces prev/next as primary interaction
- Segment anchoring: clicking a segment on the canvas resolves to its parent container
- Header: shows container path (Work → Act → Scene), back to canvas
- Keep prev/next as secondary nav (jump between segments within the container)

**Out of scope:**
- Side-panel expansion (future PRD)
- Multi-column layout (future)
- Rich text formatting / TipTap (future)
- Importing real content at scale (PRD0006)

## Design

### 1. Query engine addition

Add `getContainerChildren` to `src/engine/queries.ts`:

```ts
function getContainerChildren(
  state: GraphState,
  containerId: string,
): Entity[]
```

Returns entities linked by `contains` relations from the container, ordered by their `next` chain. If no `next` chain exists, falls back to insertion order.

### 2. Parent resolution

When focusing a non-container entity (segment, annotation), resolve its parent container via `contains` relations and focus that instead. The original entity ID is stored as a scroll anchor.

```ts
function resolveContainer(state: GraphState, entityId: string): string {
  // Walk up contains relations until hitting a container or root
  const parentRel = state.relations.find(
    (r) => r.target === entityId && r.type === "contains",
  )
  if (!parentRel) return entityId
  const parent = getEntity(state, parentRel.source)
  if (parent?.kind === "container") return parentRel.source
  return resolveContainer(state, parentRel.source)
}
```

### 3. Reading viewport redesign

The viewport renders two layers of hierarchy:

```
┌─────────────────────────────────────┐
│ ← Back    Hamlet → Act I → Scene I  │  ← header with breadcrumb
├─────────────────────────────────────┤
│                                     │
│  ACT I                              │  ← act heading (h2)
│  ─────────────────────              │
│                                     │
│  SCENE I. Elsinore.                 │  ← scene heading (h3)
│  A platform before the castle.      │
│                                     │
│  [Stage direction]                  │  ← italic, muted
│  FRANCISCO at his post...           │
│                                     │
│  BERNARDO                           │  ← character label (bold)
│  Who's there?                       │
│                                     │
│  FRANCISCO                          │
│  Nay, answer me...                  │
│                                     │
│  ...                                │  ← scroll continues
│                                     │
└─────────────────────────────────────┘
```

The content column is a scrollable list of segments. Each segment renders differently based on metadata:
- `metadata.type === "act"` → large heading
- `metadata.type === "scene"` → medium heading with location
- `metadata.type === "stage-direction"` → italic, muted text
- `metadata.character` set → character name label + dialogue content
- Default → plain segment

### 4. Navigation within container

Prev/Next in the header now jumps between segments within the current container:

- **Prev**: scroll to the previous sibling segment (previous `next` chain link)
- **Next**: scroll to the next sibling segment
- Buttons are disabled at the start/end of the container's children

Free scrolling remains the primary interaction — prev/next are convenience shortcuts.

## File Changes

| File | Action |
|------|--------|
| `src/renderers/ReadingViewport.tsx` | Rewrite — container-aware rendering, segment list, visual hierarchy |
| `src/engine/queries.ts` | Add `getContainerChildren`, `resolveContainer` |
| `src/store/useGraphStore.ts` | Update focus logic — segment clicks resolve to parent container |
| `src/App.tsx` | Update canvas click — use parent container resolution |
| `src/index.css` | Add styles for segment types (headings, character labels, stage directions) |

## Implementation Steps

### Step 1 — Add query functions

Add `getContainerChildren` and `resolveContainer` to `src/engine/queries.ts`.

### Step 2 — Rewrite ReadingViewport

Replace the single-segment display with:
- Resolve the focused entity to its container (if needed)
- Fetch ordered children via `getContainerChildren`
- Render each child segment with type-appropriate formatting
- Keep the header with back button and breadcrumb path
- Add prev/next segment jumping within the container

### Step 3 — Update canvas click

In `App.tsx`, when a segment is clicked, resolve to its parent container before focusing.

### Step 4 — Style

Add CSS for:
- Act/scene headings (large typography, horizontal rule separators)
- Character labels (small caps or bold, muted color)
- Stage directions (italic, text-muted-foreground)
- Breadcrumb navigation in header

### Step 5 — Verify

- Focus container (act_1) → see all 3 child segments in scrollable view
- Click a segment on canvas → parent container opens with that segment visible
- Free scroll through the full content
- Prev/Next jump between segments within the container
- Back returns to canvas
- `npx tsc --noEmit` passes
- `npm run build` succeeds

## Acceptance Criteria

1. Focusing a container renders all its child segments in a single scrollable list
2. Child segments are ordered correctly (follows `next` chain within `contains`)
3. Act headings render as large section headers
4. Scene headings render with location subtitle
5. Character speeches render with character name label + dialogue
6. Stage directions render in italic/muted style
7. Clicking a segment on the canvas opens its parent container
8. Prev/Next buttons jump between child segments within the container
9. Header shows breadcrumb path (container → sub-container)
10. Back button returns to canvas
11. `npx tsc --noEmit` passes
12. `npm run build` succeeds

## Verification

```sh
npx tsc --noEmit
npm run build
npm run dev   # manual: click act_1 → scroll through segments
```
