# m4-prd0041 — Node Metadata Panel

> **Completion note (2026-05-22):**
> - **What was built:** Custom `"metadata"` React Flow node with content textarea, kind select, metadata key-value table, id display, and 4-edge resize. Toggled via context menu "Metadata: Hidden/Visible". Connected to entity node by decorative dashed edge. Positions persisted in `canvas.positions["metadata:{entityId}"]`. Edge-derived metadata registry (`edge-metadata.ts`) maps `author` key to `contains` relation.
> - **Key decisions:** Metadata as a React Flow node (not floating card). Toggle lifecycle (not selection-based). Hidden `<Handle>` components required for decorative edge rendering. Edge-derived metadata uses declarative registry in `src/engine/edge-metadata.ts`.
> - **Deviations from plan:** Node positioning changed from right to left (against normal flow direction). Lifecycle changed from selection-based to context-menu toggle (supports multiple visible at once). Edge-derived metadata `author` key implemented in v1 (not deferred).
> - **Postponed:** Additional edge-derived keys beyond `author`.

## Overview

Each entity node can have a **metadata node** — toggled independently via the context menu action **"Metadata: Hidden"** / **"Metadata: Visible"**. When visible, a metadata node appears to the **left** of the entity node (opposite the normal left-to-right flow direction), connected by a decorative dashed edge. Multiple metadata nodes can be visible at once — the user keeps them open for as long as they need.

The metadata node is a React Flow custom node type (`"metadata"`) containing a form card with editable fields: `content`, `kind`, `metadata` key-value table, and `id` (read-only). It lives within React Flow's canvas — the user can drag it, resize it, and it participates in the existing canvas UX (zoom, pan, context menu). Its position is persisted per entity in `canvas.positions`. The connecting edge is view-only (not a domain relation) — it's decorative, rendered to show the association.

Inline text editing via double-click on the entity node body is preserved and independent from the metadata node.

## Specification / Acceptance Criteria

### 1. Metadata Node Lifecycle

- A new React Flow node type `"metadata"` is registered alongside `"entity"` and `"edgelabel"`.
- Context menu on an entity node shows **"Metadata: Hidden"** if no metadata node is visible for that entity, or **"Metadata: Visible"** if one is visible.
- Clicking the toggle **shows** or **hides** the metadata node for that entity.
- **Multiple metadata nodes** can be visible at once — each entity toggles its own independently. The user can keep metadata visible across multiple entities during long operations.
- Deleting an entity removes its metadata node (if visible). Hiding the metadata node does not affect the entity's data — it only removes the view node and decorative edge.

### 2. Connecting Edge

- A decorative dashed edge connects the entity node to its metadata node.
- The edge is **view-only** — it does NOT correspond to a domain `Relation` in the store. It exists only in React Flow's edges state.
- Edge type: `smoothstep` or `default` with dashed styling (`strokeDasharray: "5 5"`), muted color.
- When the metadata node is removed (toggle hidden or entity deleted), the decorative edge is removed too.

### 3. Positioning

- **Initial position:** If no saved position exists, the metadata node appears to the **left** of the entity node: `x = entityNode.position.x - metadataNode.width - 40`, `y = entityNode.position.y`. (Left side goes against the normal left-to-right flow direction, making the metadata node visually distinct and avoiding collision with downstream nodes.)
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

### 6. Context Menu Actions

- Right-clicking an entity node shows:
  - **"Metadata: Hidden"** (if metadata node is not visible) — click to show it
  - **"Metadata: Visible"** (if metadata node is visible) — click to hide it
  - Existing actions: "Edit" (triggers inline text editing on double-click already), "Delete"
- The **"Edit"** context menu action continues to trigger inline text editing (same as double-click on the node body). It is separate from the metadata toggle.
- The inline text editing path (double-click on entity node body) is preserved and unchanged — it does not affect metadata visibility.

### 7. Edge Cases

- **Delete entity with visible metadata node:** Deleting an entity via Backspace/Delete or context menu → its metadata node and decorative edge are also removed. The entity data is deleted from the store (existing cascade).
- **Multiple metadata nodes visible:** Each entity toggles independently. No conflict — each metadata node reads from its own entity's data. Editing metadata on one entity has no effect on another entity's metadata node.
- **Metadata node itself:** The metadata node is NOT selectable in the normal sense — clicking inside it focuses form fields, but the canvas keeps entity nodes as the selectable units. The metadata node does not appear in context menus and cannot be deleted independently. The only way to remove it is via the context menu toggle or deleting the parent entity.
- **Viewport pan/zoom while metadata visible:** The metadata node is a regular React Flow node — it pans and zooms with the canvas. Its position is saved on drag, surviving pan/zoom changes.
- **Re-layout:** Running Dagre re-layout overwrites all positions. The metadata node positions are also reset (they're in `canvas.positions` under `metadata:{entityId}` keys). The user would need to toggle metadata off and on to recalculate the default left offset, or drag them back into place.

## Files Changed (inferred)

- `src/canvas/nodes/MetadataNode.tsx` (new) — Custom React Flow node component with content textarea, kind select, metadata key-value table, id display, NodeResizeControl
- `src/canvas/nodes/EntityNode.tsx` — Keep inline editing via double-click (unchanged)
- `src/canvas/GraphCanvas.tsx` — Register `"metadata"` node type; manage visible metadata nodes set per entity; inject/remove metadata nodes and decorative edges on toggle; handle deletion cascade (removes metadata node + decorative edge when entity is deleted)
- `src/canvas/GraphContextMenu.tsx` — Add "Metadata: Hidden" / "Metadata: Visible" toggle action for entity nodes
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
3. **Toggle-triggered view nodes** — The context menu toggle → inject/remove lifecycle is reused by future node types (inspector, thread preview, annotation panel).
