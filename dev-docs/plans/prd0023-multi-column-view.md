# PRD0023: Multi-Column View (Phase 3)

**Status:** Draft

---

## 1. The Problem

The reading viewport shows one document at a time. To reference content across documents, the user must navigate away from their current document, losing their place. Cross-document passage linking (Phase 2) works in a single-document view, but the target selection requires a modal dialog — the user can't see both documents simultaneously.

Multi-column layout solves this: the user opens two documents side by side, reads both, creates passages in each, and links them by clicking the gutter icon — all without losing context. This is the foundation for the drag-to-link interaction in Phase 4.

## 2. What We're Building

The reading viewport becomes a multi-column layout. Each column is an independent editor/viewport instance. A "+ Column" bar on the right lets the user add documents.

### 2.1 Layout

```
ReadingViewport
├── Column 1 (focused)
│   └── TiptapEditor / SegmentCard list
├── Column 2
│   └── TiptapEditor / SegmentCard list
├── Column 3 (if any)
│   └── …
└── "+ Column" bar (always visible on the right)
```

- Columns are arranged horizontally, side by side
- Each column has a fixed minimum width (400px), can grow
- If columns exceed viewport width, the container scrolls horizontally
- Each column is a self-contained document view — same component as the current single-document view
- Only one column has focus at a time (the active editor)
- Focused column gets a visual indicator (border highlight, slightly different background)

### 2.2 Column state

Columns are managed as an array in a new store slice:

```ts
type ColumnState = {
  id: string                    // unique column id
  entityId: string              // the focused entity/container
}
```

Stored in the graph store:
```ts
columns: ColumnState[]
activeColumnId: string | null
```

Actions:
```ts
addColumn(entityId?: string): string   // creates a column, optionally with a document
removeColumn(columnId: string): void
focusColumn(columnId: string): void
setColumnEntity(columnId: string, entityId: string): void
```

### 2.3 "+ Column" button

A vertical bar on the right edge of the viewport. Clicking it opens a popover (same pattern as the mention/passage popovers) listing:
- Root containers (documents) to open
- A "New page" option that creates a new container and opens it

### 2.4 Column header

Each column has a thin header bar at the top showing:
- Document title (truncated)
- The column's entity ID (subtle, for debugging)
- An `X` button to close the column

The header appears on hover or is always visible — TBD during implementation.

### 2.5 Backward compatibility (single-column mode)

If there's only one column (the default), the column header is hidden and the layout is identical to the current single-document view. This ensures no visual regression for users who don't use multiple columns.

### 2.6 Store migration

Current ReadingViewport reads `focusedEntityId` from `view.focusedEntityId`. With columns, the active column determines the focused entity. For backward compatibility:

- `view.focusedEntityId` still exists for URL sync / page restore
- The columns array replaces it as the runtime state
- On app load: if no columns exist, create one column from the URL's `focusedEntityId`

## 3. Files Changed

| File | Change |
|------|--------|
| `src/store/useGraphStore.ts` | Add `columns: ColumnState[]`, `activeColumnId`, and actions (`addColumn`, `removeColumn`, `focusColumn`, `setColumnEntity`) |
| `src/renderers/ReadingViewport.tsx` | Replace single-document render with column-based render. Map over `columns`, render each as `ColumnView`. Add "+ Column" bar. |
| `src/renderers/ColumnView.tsx` | **New** — a single column: header bar + TiptapEditor or SegmentCard list. Extracted from current ReadingViewport's content rendering. |
| `src/components/ColumnAddPopover.tsx` | **New** — popover shown when clicking "+ Column", lists documents + "New page" |

## 4. Out of Scope (Phase 4+)

- Drag-to-link between columns (Phase 4)
- Column reordering (Later)
- Horizontal scroll sync between columns (Later)
- Opening the same document in multiple columns (deferred — warn or allow?)

## 5. Open Decisions

- **Column minimum width**: 400px is a reasonable starting point. Can be made configurable or resizable later.
- **Max columns**: No hard limit. The horizontal scroll handles overflow.
- **Column header visibility**: Always visible vs on hover. Always visible is clearer but consumes vertical space. Recommend always visible, 32px height.
- **Same document in multiple columns**: Should it be allowed? It would show the same content twice. For now, defer — the "+ Column" popover could filter out already-open documents.
