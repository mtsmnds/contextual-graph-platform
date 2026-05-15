# PRD0007 — Contextual Expansion (Inline Annotations)

> **Completion note:** Fully implemented. Annotation cards appear in the right sidebar when clicking relation indicators. Seed data enriched with 5 annotations + 1 reference. Later fixed by PRD0008 (pure domain loader — removed fragile content-matching) and embedding annotations directly in hamlet.json.

## Status
Completed — inline annotation cards, ChatCircleText/Link indicators in right gutter, toggle via expandedPanels, enriched seed data

## Problem

The reading viewport shows the full work as continuous scrollable text. Relations exist in the data — `annotates` links between segments and annotations — but there's no way for the reader to see or interact with them. When a reader encounters a passage that has an annotation or reference, there's no visual cue and no way to view the linked content.

## Goal

Show an icon in the right gutter of segments that have outgoing relations. Clicking the icon reveals the linked content inline, positioned to the right of the segment — like Notion comments or Talmudic layout. Each annotation stays horizontally aligned with its source segment.

## Scope

**In scope:**
- Relation indicator icon in the right gutter of each segment that has outgoing relations
- `ChatCircleText` icon for annotations, `Link` icon for references
- Clicking the icon toggles an annotation card below the segment, aligned with it
- Annotation card shows relation type label, linked entity title, and full content
- Card is closeable via × button or clicking the icon again
- Multiple annotations on the same segment stack in the card
- Seed data enrichment: more sample annotations + a `references` relation
- `view.expandedPanels` tracks which segment IDs have their annotations visible
- Navigating to a new container closes all annotations

**Out of scope:**
- "Talmud mode" (show all annotations at once) — noted in roadmap
- Annotation creation (highlight + note) — separate PRD
- Multi-column synced scroll — separate PRD
- Rich text formatting — TipTap later
- Relation editing — separate PRD

## Design

### 1. Indicator icon

Segments with outgoing relations (`getLinkedContext` returns non-empty) show a small icon in the right gutter:

```
...segment content...      ⟐ ChatCircleText
```

- `ChatCircleText` from @phosphor-icons/react for annotations
- `Link` for references
- 16px, muted foreground color
- Click toggles the annotation card

### 2. Annotation card

When a segment's indicator is clicked, an annotation card appears below the segment, aligned to its right side:

```
┌──────────────────────────────────────────────┐
│  ...segment content...          [ChatCircle] │
│  ┌── annotation card ────────────────────┐   │
│  │  ×  annotates                         │   │
│  │  Identity theme                       │   │
│  │  The play opens with a question...     │   │
│  └───────────────────────────────────────┘   │
│                                               │
│  ...next segment content...                   │
└──────────────────────────────────────────────┘
```

- Card renders below the segment, not floating
- Relation type as a small label
- Linked entity title as heading
- Full content as body text
- × close button in top-right
- Multiple annotations on the same segment stack vertically in the card

### 3. State management

```ts
// In ViewState (exists):
expandedPanels: string[]    // segment IDs with visible annotation cards

// Store actions (exist):
expandPanel(entityId)       // adds segmentId to expandedPanels
closePanel(entityId)        // removes segmentId from expandedPanels
```

When `focusEntity` navigates to a new container, `expandedPanels` resets to [].

### 4. Seed data enrichment

```ts
// New seed entities
{ id: "note_3", kind: "annotation", title: "Opening tension",
  content: "The play begins with a challenge — 'Who's there?' — establishing uncertainty as the central theme.",
  metadata: {} },
{ id: "note_4", kind: "annotation", title: "Supernatural element",
  content: "The ghost appears immediately, grounding the political drama in the supernatural.",
  metadata: {} },
{ id: "ref_1", kind: "segment", title: "Montaigne reference",
  content: "Shakespeare's soliloquy echoes Montaigne's Apology for Raymond Sebond, which questions whether man is 'nobler' than beasts.",
  metadata: {} },

// New relations
{ id: "r_8", source: "hamlet_1", target: "note_3", type: "annotates", metadata: {} },
{ id: "r_9", source: "hamlet_1", target: "note_4", type: "annotates", metadata: {} },
{ id: "r_10", source: "hamlet_2", target: "ref_1", type: "references", metadata: {} },
```

"Who's there?" gets 3 annotations + 2 are new. "To be, or not to be" gets 1 reference. The feature is demonstrable immediately.

### 5. Component changes

- Each SegmentCard computes its linked context via `getLinkedContext`
- If non-empty, renders the indicator icon in the segment's trailing area
- When expanded, renders an `AnnotationCard` below the segment content
- `AnnotationCard` reads from `getLinkedContext(state, segmentId)` and renders each linked entity

No separate side-panel component needed — everything lives in `ReadingViewport.tsx` as part of the segment rendering.

## File Changes

| File | Action |
|------|--------|
| `src/store/useGraphStore.ts` | Enrich seed data; focusEntity resets expandedPanels |
| `src/renderers/ReadingViewport.tsx` | Add indicator icon to SegmentCard; add AnnotationCard component; toggle logic |
| `dev-docs/roadmap.md` | Add "Talmud mode" to Later section |

## Implementation Steps

### Step 1 — Enrich seed data

Add `note_3`, `note_4`, `ref_1` and relations `r_8`, `r_9`, `r_10` to seed data. Update `focusEntity` to reset `expandedPanels`.

### Step 2 — Add indicator to SegmentCard

In `ReadingViewport.tsx`, compute linked context for each child. If non-empty, render `ChatCircleText` or `Link` icon in the segment's trailing area. `useGraphStore` selectors for `getLinkedContext`.

### Step 3 — Build AnnotationCard

Inline component that renders linked entities:
- Maps over `getLinkedContext(state, segmentId)`
- Shows relation type label, entity title, entity content
- × button calls `closePanel(segmentId)`

### Step 4 — Wire toggle

Clicking the indicator calls `expandPanel` or `closePanel` depending on current state.

### Step 5 — Verify

- Open app → click Act I
- See indicator on "Who's there?" and "To be, or not to be"
- Click indicator → annotation card appears below segment
- Click × → card closes
- Click a different canvas node → cards close
- `npx tsc --noEmit` passes
- `npm run build` succeeds

## Acceptance Criteria

1. Segments with outgoing relations show a `ChatCircleText` or `Link` icon in their trailing area
2. Clicking the icon reveals an annotation card below the segment with the linked entity's title and content
3. The card shows the relation type as a small label
4. Each card has a × close button
5. Multiple relations on the same segment stack vertically in the card
6. Navigating to a new container closes all annotation cards
7. Seed data includes 5+ annotations and 1 reference
8. `npx tsc --noEmit` passes
9. `npm run build` succeeds

## Verification

```sh
npx tsc --noEmit
npm run build
npm run dev   # manual: click indicator → card appears → close → navigate
```
