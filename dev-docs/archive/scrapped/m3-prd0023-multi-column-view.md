> **STATUS: SCRAPPED — Not implemented. Retained for reference only.**

# PRD0023: Multi-Column View (Phase 3)

**Status:** Draft

---

## 1. The Problem

The reading viewport shows one document at a time. To reference content across documents, the user must navigate away from their current document, losing their place. Cross-document passage linking (Phase 2) works in a single-document view, but the target selection requires a modal dialog — the user can't see both documents simultaneously.

Multi-column layout solves this: the user opens two documents side by side, reads both, creates passages in each, and links them by clicking the gutter icon — all without losing context. This is the foundation for the drag-to-link interaction in Phase 4.

## 2. Dependencies

**PRD0017 (Toolbar Overhaul) must be completed first** (at least Pass 1: strip persistent toolbar, floating menubar). The current persistent toolbar would appear in every column, wasting vertical space and creating visual noise. The floating menubar (appears on editor focus, one at a time) is the right pattern for multi-column.

## 3. What We're Building

The reading viewport becomes a multi-column layout. Each column is an independent editor/viewport instance. A "+ Column" icon on the right lets the user add documents.

### 3.1 Layout

```
ReadingViewport
├── Column 1 (focused)
│   └── TiptapEditor / SegmentCard list
├── Column 2
│   └── TiptapEditor / SegmentCard list
├── Column 3 (if any)
│   └── …
└── "+ Column" icon (always visible on the right)
```

- Columns are arranged horizontally, side by side
- Each column has a fixed minimum width of **420px**, can grow
- **12px gutters** between columns (gaps are multiples of 12)
- Each column slot = 432px (420px content + 12px gutter)
- If columns exceed viewport width, the container scrolls horizontally
- Each column is a self-contained document view — same component as the current single-document view
- Only one column has focus at a time (the active editor)
- Focused column gets a visual indicator (border highlight, slightly different background)

### 3.2 Column state

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

### 3.3 "+ Column" button

An **icon-only** button on the right side of the viewport (no vertical bar, no z-index layer). It sits after the last column in the flex row. Icon is larger than the 16px text-formatting icons (e.g., 20–24px).

Clicking it opens a popover (same pattern as the mention/passage popovers) listing:
- Root containers (documents) to open
- A "New page" option that creates a new container and opens it

The button maintains column-alignment spacing: its clickable area matches the column slot width (432px) to keep visual rhythm.

### 3.4 Column header

Each column has a thin header bar at the top showing:
- Document title (truncated)
- An `X` button to close the column
- Entity ID is **not shown** in the header (removed from PRD — debugging info goes elsewhere)

**Height: 28px** (not 32px — at 420px column width, every pixel counts).

The header is **always visible** but styled minimally: small text, subtle background, no heavy borders.

### 3.5 Editor responsiveness (preparation for narrow columns)

The current editor is tuned for a ~648px content area. At 420px column width, these things break:

- **`.simple-editor-content` has `max-width: 648px`** — in a 420px column the outer container is the limit, but the `max-width` rule is harmless since `width: 100%` wins. No change needed, but verify.
- **Horizontal padding (`3rem` on each side)** — at 420px column width, this leaves only 324px for content. In column mode, reduce padding to `1.5rem` (24px) on each side → 372px content. Implement via a `.simple-editor-wrapper[data-in-column]` selector or a `className` prop on `TiptapEditor`.
- **Drag handle (`right: -28px`)** — will clip outside column boundaries. Reposition to use `left` offset or `margin-left` so it stays within the column's overflow bounds.
- **Passage gutter button (`right: -28px`)** — same clipping issue. Reposition to avoid negative rights, or allow column overflow to handle it.
- **BubbleMenu** — uses Floating UI, repositions automatically. No action needed.

### 3.6 Backward compatibility (single-column mode)

If there's only one column (the default), the column header is hidden and the layout is identical to the current single-document view. This ensures no visual regression for users who don't use multiple columns.

When there's exactly one column, the editor uses its current padding (`3rem`) and the drag handle/gutter buttons remain in their current position. Responsive adjustments only apply when `columns.length > 1`.

### 3.7 Store migration

Current ReadingViewport reads `focusedEntityId` from `view.focusedEntityId`. With columns, the active column determines the focused entity. For backward compatibility:

- `view.focusedEntityId` still exists for URL sync / page restore
- The columns array replaces it as the runtime state
- On app load: if no columns exist, create one column from the URL's `focusedEntityId`

## 4. Files Changed

| File | Change |
|------|--------|
| `src/store/useGraphStore.ts` | Add `columns: ColumnState[]`, `activeColumnId`, and actions (`addColumn`, `removeColumn`, `focusColumn`, `setColumnEntity`) |
| `src/renderers/ReadingViewport.tsx` | Replace single-document render with column-based render. Map over `columns`, render each as `ColumnView`. Add "+ Column" icon. |
| `src/renderers/ColumnView.tsx` | **New** — a single column: header bar + TiptapEditor or SegmentCard list. Extracted from current ReadingViewport's content rendering. |
| `src/components/ColumnAddPopover.tsx` | **New** — popover shown when clicking "+ Column", lists documents + "New page" |
| `src/renderers/TiptapEditor.tsx` | Accept optional `inColumn` prop. When true: reduce padding, reposition drag handle / gutter buttons. |
| `src/components/tiptap-templates/simple/simple-editor.scss` | Add `.simple-editor-wrapper[data-in-column]` rule with reduced padding |

## 5. Out of Scope (Phase 4+)

- Drag-to-link between columns (Phase 4)
- Column reordering (Later)
- Horizontal scroll sync between columns (Later)
- Opening the same document in multiple columns (Later)
- Column drag to resize (Later)

## 6. Open Decisions

- **Max columns**: No hard limit. Horizontal scroll handles overflow.
- **Column header visibility**: Always visible, 28px height, minimal styling.
- **"+ Column" icon size**: 20px or 24px — decide during implementation based on visual balance with other icons.
- **Single-column padding fallback**: When `columns.length === 1`, restore 3rem padding. The `inColumn` prop is `true` only when `columns.length > 1`.
