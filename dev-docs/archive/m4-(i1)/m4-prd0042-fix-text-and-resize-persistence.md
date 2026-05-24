# m4-prd0042-fix: Text & Resize Persistence Bugs

## Context

Two runtime bugs discovered post-PRD0040:

- **Bug 1 — text disappears after edit:** User double-clicks a node, types new text, blurs to commit. The text is correctly saved to the Zustand store (confirmed via reload), but the node on screen reverts to old text immediately after leaving edit mode.
- **Bug 2 — resize not persisted:** User drags the `NodeResizeControl` handle to widen/narrow a node. The new size holds during the session, but on reload the node snaps back to the default 200px width.

## Root Causes

### Bug 1

In `GraphCanvas.tsx:100-158`, the `useEffect` that syncs store `entities` → React Flow `nodes` only handles *new* entities (`if (!prevById.has(entity.id))`). When `updateEntity` fires after a text edit commit, entities change, the effect runs, but existing nodes are skipped — their `data.content` remains stale from initial creation. The store has the correct value; the React Flow node's `data` does not.

### Bug 2

Node dimensions (width/height from `NodeResizeControl`) exist only in React Flow's internal `useNodesState`. The Zustand `CanvasState` only persisted `positions` and `viewport` — no dimension data. On reload, `layoutRef.current` creates all nodes with `style: { width: 200 }` hardcoded, discarding any prior resize.

## Decision

### Bug 1 fix

In the noDagre branch of the `useEffect`, after the new-entity loop, iterate existing entities too. When an entity's `content` or `kind` differs from the corresponding node's `data`, create a new node object with updated `data`.

### Bug 2 fix

1. **Type:** Add `dimensions: Record<string, { width: number; height: number }>` to `CanvasState`.
2. **Store:** Add `setCanvasDimensions` action. Normalize missing `dimensions` in `migrateSnapshot` (for v4 snapshots saved before this field existed). Initialize canvas with `dimensions: {}`.
3. **GraphCanvas — restore:** Read `savedDimensions` from store. Use saved dimensions in both `layoutRef` (initial mount) and the `useEffect` (runtime new nodes) via `style.width` and node-level `width`/`height`.
4. **GraphCanvas — persist:** A new `useEffect` watches `nodes` and saves any dimension changes back to the store using a deterministic string-key dedup to avoid unnecessary writes.

## Alternatives Considered

- **Bug 1 — wrap `onNodesChange` instead:** Could have intercepted the React Flow node state via a custom `onNodesChange` handler. Rejected because the sync effect already owns the entity→node mapping; keeping the fix there is simpler.
- **Bug 2 — wrap `onNodesChange` for dimension persistence:** Could intercept `{ type: "dimensions" }` changes in a custom handler. Rejected because a `useEffect` watching `nodes` captures all dimension sources (resize, auto-measure, programmatic) uniformly, with a dedup ref to avoid store churn.

## Consequences

- Text edits now immediately reflect on the canvas without reload.
- Resized node dimensions survive page reloads.
- Added `dimensions` field is backward-compatible — existing v4 snapshots without it are normalized on load.
- `CanvasState` objects grow slightly (one entry per resized node).

## Files Changed

- `src/types/graph.ts` — added `dimensions` to `CanvasState`
- `src/store/useGraphStore.ts` — added `setCanvasDimensions`, normalized dimensions in migration/init/seed, updated all `canvas` initializations
- `src/data/seed.ts` — added `dimensions: {}` to seed canvas
- `src/canvas/GraphCanvas.tsx` — sync existing node data in noDagre `useEffect`, apply saved dimensions on node create, persist dimensions via deduped `useEffect`
