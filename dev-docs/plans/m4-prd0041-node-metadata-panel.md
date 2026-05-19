# m4-prd0041 — Node Metadata Panel

## Overview

When a node is selected on the canvas (single click or context menu "Edit"), a **metadata node** appears to the right of the selected entity node, connected by a decorative dashed edge. The metadata node is a React Flow custom node type (`"metadata"`) containing a form card with editable fields: `content`, `kind`, `metadata` key-value table, and `id` (read-only).

The metadata node lives within React Flow's canvas — the user can drag it, resize it, and it participates in the existing canvas UX (zoom, pan, context menu). Its position is persisted per entity in `canvas.positions`. The connecting edge is view-only (not a domain relation) — it's decorative, rendered to show the association.

Context menu "Edit" opens the metadata node instead of triggering inline text editing. Inline text editing via double-click on the entity node body is preserved.

## Specification / Acceptance Criteria

### 1. Metadata Node

- A new React Flow node type `"metadata"` is registered alongside `"entity"` and `"edgelabel"`.
- When an entity node is **selected** (single click), the metadata node is injected into the React Flow nodes array.
- When the entity node is **deselected**, the metadata node is removed.
- When a **different** entity node is selected, the current metadata node is replaced with one for the new entity.
- **Only one metadata node** is visible at a time.

### 2. Connecting Edge

- A decorative dashed edge connects the entity node to its metadata node.
- The edge is **view-only** — it does NOT correspond to a domain `Relation` in the store. It exists only in React Flow's edges state.
- Edge type: `smoothstep` or `default` with dashed styling (`strokeDasharray: "5 5"`), muted color.
- When the metadata node is removed (deselection), the decorative edge is removed too.

### 3. Positioning

- **Initial position:** If no saved position exists, the metadata node appears to the right of the selected entity node: `x = entityNode.position.x + entityNode.width + 40`, `y = entityNode.position.y`.
- **Saved position:** Position is stored in `canvas.positions` under key `"metadata:{entityId}"`. On subsequent selection, the saved position is restored.
- **Drag save:** When the user drags the metadata node, its new position is saved via `setCanvasPositions` (same debounced persist path as entity nodes).
- **Resize:** The metadata node supports resize via `NodeResizeControl` on all edges (same pattern as EntityNode). Min width sufficient for the form content.

### 4. Form Fields

The metadata node contains:

- **`content`** — editable textarea. Changes commit via `updateEntity(id, { content })` on blur.
- **`kind`** — select dropdown: `segment`, `container`, `annotation`, `concept`, `summary`. Changing kind updates the entity and re-renders the entity node.
- **`metadata`** — two-column key-value table:
  - Each row: key input, value input, delete button (trash icon).
  - "Add entry" button at the bottom.
  - Changes commit immediately on blur or row removal.
  - Key names are freeform text (not a restricted enum).
- **`id`** — read-only display (monospace, muted text).

### 5. Edge-Derived Metadata

Some metadata keys are backed by domain relations. Writing the key creates both a metadata entry AND a relation. Reading resolves from the edge if present, falling back to the raw metadata value.

**Registry:** `src/engine/edge-metadata.ts`:
```ts
// Maps metadata key → relation type + direction + entity kind
const EDGE_METADATA_KEYS: Record<string, {
  relationType: string;
  direction: "source" | "target";   // relative to the entity bearing the metadata
  targetKind: EntityKind;            // what kind of entity to find/create on the other end
}> = {
  author: { relationType: "contains", direction: "target", targetKind: "container" },
}
```

**Write path:** Setting `metadata.author = "William Shakespeare"` on a book entity:
1. Stores `metadata.author = "William Shakespeare"` on the entity (via `updateEntity`)
2. Finds or creates an author entity with `content: "William Shakespeare"`, `kind: "container"`
3. Creates/updates a `contains` relation: `{ source: authorEntity.id, target: bookEntity.id, type: "contains" }`
4. If the key is deleted, the relation is NOT automatically deleted (user may want to keep the author entity + edge and just remove the metadata key for display purposes)

**Read path:** When displaying metadata, for each key in `EDGE_METADATA_KEYS`:
1. Look up the relation described by the registry entry
2. If found, resolve the connected entity's `content` as the display value
3. If not found, show the raw `metadata[key]` value

**Scope (v1):** Write path and read path for `author` are implemented. Other edge-derived keys can be added to the registry later without changing the panel UI.

### 6. Context Menu "Edit"

- The context menu "Edit" action on a node selects that node in React Flow (if not already selected), which triggers the metadata node to appear.
- The inline text editing path (double-click on entity node body) is preserved and unchanged.

### 7. Edge Cases

- **Delete entity with open metadata node:** Selecting a node via context menu that gets deleted — the metadata node is removed. If the user deletes the selected node (Backspace/Delete), the metadata node is also removed.
- **Multi-selection:** If multiple nodes are selected, the metadata node shows data for the most recently selected node (React Flow's nodesSelectionActive behavior). If the user deselects all (clicking pane), metadata node closes.
- **Metadata node itself:** The metadata node is NOT selectable in the normal sense — clicking inside it focuses form fields, but the canvas selection state keeps the entity node as the selected node. The metadata node does not appear in context menus and cannot be deleted independently.

## Files Changed (inferred)

- `src/canvas/nodes/MetadataNode.tsx` (new) — Custom React Flow node component with content textarea, kind select, metadata key-value table, id display, NodeResizeControl
- `src/canvas/nodes/EntityNode.tsx` — Keep inline editing via double-click, remove editTrigger from context menu path
- `src/canvas/GraphCanvas.tsx` — Register `"metadata"` node type; inject/remove metadata node based on selection state; inject/remove decorative connecting edge; rewire context menu "Edit" to select node; handle deletion cascade
- `src/engine/edge-metadata.ts` (new) — Edge-derived metadata registry + resolve/write functions
- `src/store/useGraphStore.ts` — (potentially) add `getOrCreateEntityByContent` helper for edge-derived metadata write path
- `src/index.css` — Styles for metadata node, decorative edge, metadata form fields
- Install shadcn: `select`, `label` (if not already installed)
- `src/types/graph.ts` — No changes (metadata is `Record<string, unknown>`, edge-derived keys are convention-based)

## Phases

Single pass — one new node type, one new engine module, wiring in GraphCanvas.

## Size Advisory

~4 new/modified files plus one engine module plus shadcn installs. The metadata node reuses existing patterns (NodeResizeControl, BaseNode structure, position persistence). The edge-derived metadata is a focused piece of logic isolated in `edge-metadata.ts`.

## Relationship to i2 Vision

This PRD closes out i1 (the graph canvas initiative) and serves as the bridge into i2 (View Data as Threads and Groups). It establishes:

1. **Custom node types beyond entities** — The `"metadata"` node proves the pattern for future view-only nodes (thread headers, group containers, roadmap milestones).
2. **Edge-derived metadata** — The registry pattern (`edge-metadata.ts`) extends naturally to other context-revealing keys.
3. **Select-triggered view nodes** — The select→inject→deselect→remove lifecycle is reused by future node types (inspector, thread preview, annotation panel).
