# m4-prd0041 — Node Metadata Panel

## Overview

When a node is selected on the canvas, a form card appears on the right side of the node showing editable entity fields: `content` (textarea), `kind` (select dropdown of entity kinds), `metadata` (two-column key-value table), and `id` (read-only). The context menu "Edit" action opens this panel instead of triggering inline text editing. Inline editing from double-click on the node body is preserved.

## Specification / Acceptance Criteria

1. **Panel appears on node selection:**
   - When a node is selected (single click), a metadata panel card renders to the right of the node.
   - The panel is positioned relative to the node's bounding rect on the canvas.
   - When the node is deselected, the panel closes.
   - When a different node is selected, the panel updates to show the new node's data.

2. **Form fields:**
   - **`content`** — editable textarea. Changes commit via `updateEntity(id, { content })` on blur.
   - **`kind`** — select dropdown with options: `segment`, `container`, `annotation`, `concept`, `summary`. Changing kind updates the entity and re-renders the node.
   - **`metadata`** — two-column key-value table. Each row has a key input, value input, and delete button. An "Add entry" button appends a new row. Changes commit immediately on blur or row removal.
   - **`id`** — read-only display (monospace, muted).

3. **Context menu "Edit" opens the panel:**
   - The context menu "Edit" action now activates the metadata panel for that node (instead of triggering inline text editing).
   - Inline text editing via double-click on the node body is preserved.

4. **Shadcn components:**
   - Uses shadcn `Card`, `Select`, `Label` components.
   - Styled consistently with the existing graph UI (card, popover, dialog).

## Files Changed (inferred)

- Install shadcn: `card`, `select`, `label`
- `src/canvas/panels/MetadataPanel.tsx` (new) — form card with content textarea, kind select, metadata key-value table, id display
- `src/canvas/GraphCanvas.tsx` — render MetadataPanel for selected node; rewire context menu "Edit" action to activate panel
- `src/canvas/nodes/EntityNode.tsx` — keep inline editing via double-click, remove editTrigger from context menu path
- `src/canvas/GraphContextMenu.tsx` — no changes needed (already calls back to GraphCanvas for action handling)

## Phases

Single pass — the work is one new component plus wiring in GraphCanvas.

## Size Advisory

~3 new/modified files plus shadcn component installs. Straightforward.
