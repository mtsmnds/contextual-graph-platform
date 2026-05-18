# m4-prd0038 — Save Node Positions

## Overview

Persist user-arranged node positions and viewport state inside the `GraphSnapshot` schema, so node positions survive page reloads. This flips the position authority from "Dagre always wins" to "user position wins" — Dagre is only a fallback for new entities.

## Specification / Acceptance Criteria

1. **Schema v4 — `GraphSnapshot` gains a `canvas` field:**
   ```ts
   type CanvasState = {
     positions: Record<string, { x: number; y: number }>
     viewport?: { x: number; y: number; zoom: number }
   }

   type GraphSnapshot = {
     version: 4
     entities: Entity[]
     relations: Relation[]
     canvas: CanvasState
   }
   ```
   - `positions` maps entity ID to its last-known flow-viewport position.
   - `viewport` is optional; when present on load, restored immediately. Replaces the current `localStorage`-based viewport persistence.

2. **Migration v3 → v4:**
   - Add a `migrateSnapshot` step in `useGraphStore.ts` that inserts `canvas: { positions: {} }`.
   - Seed data (`SEED_DATA`) updated to `version: 4` with empty canvas.

3. **On load:** apply saved positions. Entities not found in `canvas.positions` get Dagre positions.

4. **On node drag end:** save the new position to `canvas.positions` in the store (triggers the auto-save debounce).

5. **On node create at a specific position** (double-click or "New Node"): save that position to `canvas.positions` immediately.

6. **"Re-layout" button** re-runs Dagre for all entities and overwrites `canvas.positions` with the result, then persists.

7. **Persistence adapters** (`indexeddb-adapter`, `fs-access-adapter`) work unchanged — they already serialize/deserialize the full `GraphSnapshot`. The `WorkspaceSnapshot` type in `persistence/types.ts` should be kept in sync or removed in favor of `GraphSnapshot`.

8. **Viewport:** store in `canvas.viewport` instead of `localStorage`. On load, restore from `canvas.viewport`. On pan/zoom, debounce-save to `canvas.viewport`. The "Re-layout" button does NOT reset the viewport.

## Files Changed (inferred)

- `src/types/graph.ts` — add `CanvasState` type, bump `GraphSnapshot` to v4 with `canvas` field
- `src/store/useGraphStore.ts` — add v3→v4 migration, add `setNodePosition` action, update auto-save to include `canvas`, update viewport persistence from localStorage to store
- `src/data/seed.ts` — update seed snapshot to v4
- `src/canvas/GraphCanvas.tsx` — on load: read positions from store; on drag end: save position; on create: save position; on relayout: overwrite positions; remove localStorage viewport logic
- `src/store/persistence/types.ts` — update `WorkspaceSnapshot` to match new shape (or align with `GraphSnapshot`)

## Phases

One single phase — the work is self-contained (<10 files, tightly coupled).

## Size Advisory

~5-6 files. Straightforward schema bump + wiring. No phase split needed.
