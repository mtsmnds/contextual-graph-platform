# m4-prd0044 — Schema v5: Canvas Data on Entity

> **Completion note (2026-05-23):**
> - **What was built:** Schema v5 migration — `canvasData: { x, y, width?, height? }` added to `Entity`, `CanvasState` stripped to `viewport` only. All position/dimension APIs removed (`setNodePosition`, `setCanvasPositions`, `replaceCanvasPositions`). Drag-end and resize-end create undo entries via `updateEntity({ canvasData })`. Auto-measurement uses non-tracked `applyMeasuredDimensions`. Backup restore passes through `migrateSnapshot` for v4 compat.
> - **Key decisions:** Resize-end handler placed in `EntityNode.tsx` (not GraphCanvas) since React Flow's `NodeResizeControl` only has `onResizeEnd` inside the node component. `updateEntity` now merges `canvasData` with spread to avoid overwriting width/height on drag-only updates.
> - **Deviations from plan:** `onNodeResizeEnd` moved from GraphCanvas to EntityNode. Metadata node position for new panels uses entity canvasData directly instead of a separate saved position lookup.
> - **Postponed:** Nothing.

## Overview

Move node positions and dimensions from a separate `canvas.positions`/`canvas.dimensions` map onto the entity itself as `canvasData`. This eliminates the persistent reconciliation gap between domain state and view state that has caused bugs in every feature touching positions — save, undo, restore, Cmd+drag. After this change, position IS part of the entity, and the existing snapshot-based undo/redo system captures it automatically.

## Specification / Acceptance Criteria

### 1. Schema v5

```ts
type CanvasData = {
  x: number
  y: number
  width?: number
  height?: number
}

type Entity = {
  id: string
  kind: EntityKind
  content: string
  metadata: Record<string, unknown>
  createdAt: number
  updatedAt: number
  canvasData: CanvasData
}

type CanvasState = {
  viewport?: { x: number; y: number; zoom: number }
}

type GraphSnapshot = {
  version: 5
  entities: Entity[]
  relations: Relation[]
  canvas: CanvasState
}
```

`CanvasState` loses `positions` and `dimensions`. Only `viewport` remains.

### 2. Migration v4 → v5

On load, for each entity:
- `entity.canvasData.x` = `canvas.positions[entity.id]?.x ?? (fallback layout x)`
- `entity.canvasData.y` = `canvas.positions[entity.id]?.y ?? (fallback layout y)`
- `entity.canvasData.width` = `canvas.dimensions[entity.id]?.width ?? undefined`
- `entity.canvasData.height` = `canvas.dimensions[entity.id]?.height ?? undefined`

New entities (no saved position) get a layout-derived fallback position — same as current Dagre/row behavior. After migration, `canvas` only carries `viewport`.

### 3. Removed Store Actions

| Removed | Replacement |
|---------|-------------|
| `setNodePosition()` | `updateEntity(id, { canvasData })` — tracked via `beginBatch("Move nodes")` |
| `setCanvasPositions()` | Individual `updateEntity` calls wrapped in a batch |
| `replaceCanvasPositions()` | Batch of `updateEntity` calls, tracked as "Re-layout" |
| `setCanvasDimensions()` | Non-tracked direct setter (see §5) |

### 4. Undo Tracking: Every User Action

The rule: **any user-initiated change to node or edge data is undoable.** This includes:

| User action | Store call(s) | Batch description |
|-------------|--------------|-------------------|
| Create node (double-click / keyboard) | `addEntity` with `canvasData` | "Create node" |
| Edit node content (inline text) | `updateEntity` | "Edit node" |
| Delete node (Backspace / context menu) | `deleteEntity` | "Delete node" (already tracked) |
| Move nodes (drag-end) | N × `updateEntity(id, { canvasData })` | "Move nodes" |
| Resize node (resize-end) | `updateEntity(id, { canvasData })` | "Resize node" |
| Connect nodes (drag handle) | `addRelation` | "Connect nodes" (already tracked) |
| Delete edge (Backspace / context menu) | `removeRelation` | "Delete edge" (already tracked) |
| Edit edge label (inline text) | `updateRelation` | "Edit edge" (already tracked) |
| Re-layout button | Batch of `updateEntity` calls | "Re-layout" |
| Cmd+drag duplicate | N × `addEntity` with `canvasData` | "Duplicate N nodes" (already tracked) |

**Drag-end:** Wrapped in `beginBatch("Move nodes")` / `endBatch()`. Each `updateEntity` call inside is a no-op at the snapshot level (depth > 0). One snapshot for the entire multi-node drag.

**Multi-select delete:** Already handled by `onNodesDelete` batch wrapping (PRD0043).

### 5. Auto-Measurement: Not a User Action

When React Flow first renders a node and the browser computes its size, that measurement initializes `canvasData.width` and `canvasData.height` **only if they aren't already set**. This write must NOT go through `updateEntity` and must NOT create an undo entry — it's the system initializing layout, not the user acting.

**Implementation:** A non-tracked store method `setCanvasDimensions(dimensions)` that writes directly via `set()` without calling `beginBatch`/`endBatch`. The GraphCanvas dimension effect calls this.

After auto-measurement, only user-initiated resize writes `canvasData.width`/`canvasData.height` via `updateEntity` — which IS tracked.

**Rule for the dimension setter:**
- If the entity already has `canvasData.width` and `canvasData.height` set → skip (don't overwrite user-set values)
- If not set → write the measured values directly via non-tracked `set()`
- Never create an undo entry

**Edge case — partial dimensions:** The skip check uses `AND` (both width and height must already be set). This is correct because resize always sets both dimensions together. If a bug were to produce a partial state (width set but height missing), the `AND` condition would re-measure and overwrite — but that bug shouldn't exist. The implementation must ensure `canvasData` is always written atomically (both width and height set together or neither).

### 6. GraphCanvas Simplification

**Before (current):** The `useEffect` reads `entities`, `relations`, `canvas.positions`, and `canvas.dimensions` as four separate slices. It merges positions from the canvas map onto React Flow nodes, reconciles dimensions separately, and has complex stale-node/vs-new-node logic.

**After:** The `useEffect` reads `entities` and `relations` only. Position and dimensions come from `entity.canvasData` directly — no separate map lookups, no merge conflicts, no stale-position reconciliation.

Initial layout and the effect both read:
```ts
const position = { x: entity.canvasData.x, y: entity.canvasData.y }
const width = entity.canvasData.width ?? 200
```

**Drag-end handler** (moves single or multi-node):
```ts
const onNodeDragStop = useCallback((_: React.MouseEvent) => {
  const allNodes = reactFlowInstance.getNodes()
  const store = useGraphStore.getState()
  const movedIds = allNodes.filter(n => n.selected || n.dragging).map(n => n.id)
  if (movedIds.length === 0) return

  store.beginBatch(`Move ${movedIds.length} nodes`)
  for (const id of movedIds) {
    const node = allNodes.find(n => n.id === id)
    if (!node) continue
    store.updateEntity(id, {
      canvasData: {
        x: node.position.x,
        y: node.position.y,
        width: node.measured?.width ?? node.width ?? undefined,
        height: node.measured?.height ?? node.height ?? undefined,
      }
    })
  }
  store.endBatch()
}, [reactFlowInstance])
```

**Resize-end handler** (NodeResizeControl onEnd):
```ts
const onNodeResizeEnd = useCallback((_: any, params: any) => {
  const store = useGraphStore.getState()
  store.beginBatch("Resize node")
  store.updateEntity(params.id, {
    canvasData: {
      x: params.position.x,
      y: params.position.y,
      width: params.width,
      height: params.height,
    }
  })
  store.endBatch()
}, [])
```

**Auto-measurement effect** (runs after render, writes without undo):
```ts
useEffect(() => {
  const dims: Record<string, CanvasData> = {}
  const store = useGraphStore.getState()
  for (const node of nodes) {
    const entity = store.entities.find(e => e.id === node.id)
    if (!entity) continue
    // Only set dimensions if not already present
    if (entity.canvasData.width != null && entity.canvasData.height != null) continue
    const w = node.measured?.width ?? node.width
    const h = node.measured?.height ?? node.height
    if (w != null && h != null) {
      dims[node.id] = {
        x: entity.canvasData.x,
        y: entity.canvasData.y,
        width: w,
        height: h,
      }
    }
  }
  if (Object.keys(dims).length > 0) {
    store.setCanvasDimensions(dims) // non-tracked
  }
}, [nodes])
```

### 7. Seed Data

Seed entities get `canvasData` with `{ x: 0, y: 0 }` — they'll be re-laid out on first render by the layout engine (or by auto-measurement for dimensions).

### 8. Edge Cases

- **Entity with no saved position:** `canvasData.x/y` defaults to `0` for seed entities, or to a fallback row/column position computed at load time.
- **Entity missing `canvasData` entirely (v4 data):** Migration fills it. If somehow still missing, default to `{ x: 0, y: 0 }`.
- **Resize without drag:** Resize-end handler fires with the new position and dimensions, writes via `updateEntity`, creates "Resize node" undo entry.
- **Drag without resize:** Drag-end handler fires with new position, preserves existing width/height, creates "Move nodes" undo entry.
- **User resets viewport:** Viewport is still separate on `canvas.viewport`, no change.
- **Existing backups (in `backups/manual/` and `backups/auto/`):** Contain v4 snapshots. Restore logic must handle v4 data with migration. The backup engine reads stored graph and passes it through `migrateSnapshot()` before applying.

## Files Changed

| File | Change |
|------|--------|
| `src/types/graph.ts` | Add `CanvasData` type; add `canvasData: CanvasData` to `Entity`; remove `positions`/`dimensions` from `CanvasState`; bump `GraphSnapshot.version` to `5` |
| `src/store/useGraphStore.ts` | v4→v5 migration in `migrateSnapshot()`; remove `setNodePosition`, `setCanvasPositions`, `replaceCanvasPositions`; add non-tracked `setCanvasDimensions`; `addEntity` accepts initial `canvasData`; update `GraphStore` interface |
| `src/canvas/GraphCanvas.tsx` | Initial layout reads `entity.canvasData`; effect simplified (no position/dimension map merges); drag-end wraps position updates in `beginBatch("Move nodes")`; add resize-end handler; auto-measurement effect calls non-tracked setter |
| `src/data/seed.ts` | Add `canvasData: { x: 0, y: 0 }` to seed entities |
| `src/engine/layout.ts` | Read saved positions from `entity.canvasData` |
| `src/canvas/nodes/EntityNode.tsx` | Wire resize-end handler to store; read initial size from `entity.canvasData.width/height` |
| `src/store/persistence/types.ts` | `WorkspaceSnapshot` matches v5 schema |
| `src/engine/backup.ts` | Restore passes snapshot through migration |
| `src/canvas/panels/WorkspaceMenu.tsx` | No changes needed |
| `src/canvas/edges/EdgeLabel.tsx` | No changes needed |
| `src/canvas/GraphContextMenu.tsx` | No changes needed |

## Implementation Notes

- **Migration is destructive for positions:** After v4→v5 migration, `canvas.positions` data is discarded. The migrated `canvasData` on each entity becomes the sole source of truth. Any code still reading `canvas.positions` after migration will find an empty object — this is intentional.
- **GraphCanvas drag-end must be the ONLY place that updates canvasData on drag.** The React Flow `onNodesChange` handler (which fires on every pixel of drag) writes position to the React Flow node state via `onNodesChange`, but that state is local to React Flow. Only the `onNodeDragStop` callback persists to the store.
- **`canvasData` is always present** on every entity after migration. No optionality — every entity has `{ x, y }` at minimum. The `CanvasData` type has `x` and `y` required, `width` and `height` optional.
- **Relations are unchanged.** Only entities gain `canvasData`.
- **Backward compat for backups:** The `restoreManualBackup` and `restoreAutoSnapshot` functions must run the loaded snapshot through `migrateSnapshot()` before applying. This can be done in the restore confirmation handler or in the engine function itself.
