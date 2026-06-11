# m8 — Decomposing useGraphStore and Data Separation

## Goal

Split the monolithic store and persistence layer into focused slices with separated data files. Domain data (entities, relations) and view data (canvas positions, viewport, collapse state, feature flags) become independent concerns — separate files on disk, separate slices in the store, independently loadable and saveable.

## Part 1: Store Decomposition

`useGraphStore.ts` is ~900 lines with actions spanning six domains. Split into Zustand slice pattern:

| Slice | Actions | File |
|-------|---------|------|
| Entity | addEntity, updateEntity, deleteEntity, applyMeasuredDimensions | `store/slices/entities.ts` |
| Relation | addRelation, updateRelation, removeRelation | `store/slices/relations.ts` |
| Sort Order | appendChild, insertChild, moveChild, backfillContainerOrder | `store/slices/sort-order.ts` |
| Canvas/View | setViewport, toggleContainerCollapse, setSelectedNode, featureFlags | `store/slices/canvas.ts` |
| Persistence | openFromDisk, saveToDisk, closeDisk, setFsAdapter, isDirty | `store/slices/persistence.ts` |
| History | undo, redo, beginBatch, endBatch, snapshot capture | `store/slices/history.ts` |

`useGraphStore.ts` becomes a thin composition root importing all slices.

## Part 2: Data Separation

Split `graph.json` into two files:

| File | Contents | Concern |
|------|----------|---------|
| `graph.json` | entities, relations, version | Domain — the graph itself |
| `canvas.json` | viewport, collapsedContainers, featureFlags, per-entity canvasData (positions, dimensions) | View — how the graph appears |

Both save to IndexedDB at runtime and to the user's folder on explicit save. Load order: `graph.json` first (domain), then `canvas.json` overlays view data onto entities.

## Depends on

- Current CanvasState/canvasData architecture (in place)
- FSAdapter save/load pipeline (in place)

## Risk

Medium — history snapshots currently capture the full state including canvasData on entities. Separating view data means snapshots either capture both files or only domain. Undo/redo design needs revisiting.
