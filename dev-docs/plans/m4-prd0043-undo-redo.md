# m4-prd0042 — Undo/Redo

## Overview

Snapshot-based undo/redo system that captures the full domain state (`entities`, `relations`, `canvas`) before each tracked mutation. Batch operations (multi-select delete, Cmd+drag duplicate, re-layout) are grouped into a single undoable step via `beginBatch`/`endBatch`. Position drags and viewport changes are excluded. Keyboard shortcuts (Cmd+Z / Cmd+Shift+Z) and panel buttons provide access.

This closes a critical safety gap: the user can recover from accidental deletes, bad edits, and mistaken relation changes with a single keystroke.

**Why snapshots (not commands):** The product will grow — more store actions, more mutation types. A command-pattern approach requires per-mutation undo/redo logic that must be kept in sync with each new feature. Snapshots require zero per-mutation logic: every new feature is automatically undoable. The graph is small enough that memory is not a constraint (50 snapshots of the full domain state is negligible).

## Specification / Acceptance Criteria

### 1. Snapshot-Based History

Before each tracked mutation, the current domain state is pushed onto an undo stack. Undo restores a previous snapshot; redo restores a later one.

```
undo stack: [S₀, S₁, S₂, ...]  ← most recent at end
redo stack: [Sₐ, S_b, ...]     ← cleared on every new snapshot
```

**Snapshot entry** (internal, not persisted — lives in memory only, lost on page reload):

```ts
type HistoryEntry = {
  entities: Entity[];
  relations: Relation[];
  canvas: CanvasState;     // includes positions, dimensions, viewport
  description: string;     // human-readable label (e.g., "Create node", "Delete 3 nodes")
}
```

Max history: **50 entries**. Oldest dropped when exceeded. Redo stack is cleared whenever a new snapshot is pushed (standard undo/redo behavior). After restoring a snapshot via `setState`, React Flow's existing `useEffect` in `GraphCanvas.tsx` automatically reconciles nodes and edges from the restored domain state.

### 2. Tracked Operations

These store actions take a snapshot before mutating:

| Store action | Description example |
|-------------|---------------------|
| `addEntity(...)` | "Create node" |
| `updateEntity(id, ...)` | "Edit node" |
| `deleteEntity(id)` | "Delete node" (cascade captured automatically in the snapshot) |
| `addRelation(...)` | "Connect nodes" |
| `removeRelation(id)` | "Delete edge" |
| `updateRelation(id, ...)` | "Edit edge" |
| `replaceCanvasPositions(...)` | "Re-layout" |

Each is wrapped internally with `beginBatch(desc)` / `endBatch()` so a single store call = one history entry. The batch wrapper takes the snapshot at `beginBatch` and pushes it at `endBatch`.

### 3. Excluded from History

These operations do NOT take snapshots:

- `setNodePosition` / `setCanvasPositions` — position changes from drag are too noisy
- `setViewport` — viewport changes are view state, not data
- `setCanvasDimensions` — resize is view state
- `focusEntity` / `expandPanel` / `closePanel` — view state
- `saveContent` / `clearContent` — Tiptap editor has its own undo/redo; annotation entity reconciliation inside `saveContent` is a derived side effect, not a direct user action

### 4. Batch Grouping

Multiple mutations from a single user action are grouped as one undoable step via the store's `beginBatch(description)` / `endBatch()` API. The snapshot is taken at the outermost `beginBatch` and pushed at the outermost `endBatch`.

**Depth-counter pattern:** `beginBatch` increments a batch depth counter; `endBatch` decrements. The snapshot is only taken at 0→1 and only pushed at 1→0. Nested batches (e.g., a tracked store method called inside a canvas-level batch) are invisible — they neither take nor push snapshots.

Canvas-level batches:

| User action | Batched calls |
|-------------|---------------|
| **Multi-select delete** (Backspace) | `onNodesDelete` loop (N × `deleteEntity`) + optional `onEdgesDelete` loop |
| **Cmd+drag duplicate** | `addEntity` + `setNodePosition` (for the clone) |
| **Re-layout button** | Already a single `replaceCanvasPositions` call (wrapped internally) |
| **Connect handles** (drag edge) | Single `addRelation` call (wrapped internally) |
| **Context menu delete** | Single `deleteEntity` — no external batch needed |
| **Node inline text edit** (Enter/blur) | Single `updateEntity` — no external batch needed |
| **Edge inline text edit** (Enter/blur) | Single `updateRelation` — no external batch needed |

### 5. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Z` | Undo |
| `Cmd+Shift+Z` | Redo |

**Guard:** If the active element is a text input, textarea, `[contenteditable]` element, or inside the Tiptap editor or NodeAppendix panel, the keyboard shortcut is NOT intercepted — the browser handles native text undo/redo.

**Implementation:** `document.addEventListener('keydown', handler)` (not React Flow's `useKeyPress`). Check `e.metaKey` (Mac) / `e.ctrlKey` (Windows). Use `document.activeElement` and `e.preventDefault()` to suppress browser default only when a graph undo/redo fires.

### 6. UI Buttons

Two buttons added to the top-right panel, using a **nested ButtonGroup** to create a visual gap from the existing buttons:

```
[Nested ButtonGroup:  [Undo] [Redo]]  ──gap──  [New Node] [Open Folder]
```

- **Undo** — `ArrowUUpLeft` icon (Phosphor), disabled when undo stack is empty
- **Redo** — `ArrowURightDown` icon (Phosphor), disabled when redo stack is empty

Both buttons show a tooltip on hover with the top-of-stack description (e.g., "Undo Delete 3 nodes").

### 7. State Reset

- On `init()` (workspace load, switch folder), both stacks are cleared.
- On page reload, history is lost (in-memory only). This is acceptable — undo/redo is for intra-session recovery, not cross-session.

## Files Changed

| File | Change |
|------|--------|
| `src/store/useGraphStore.ts` | Add `undoStack`, `redoStack`, `batchDepth`, `batchDescription`, `_takeSnapshot`, `undo`, `redo` to store; wrap `addEntity`, `updateEntity`, `deleteEntity`, `addRelation`, `removeRelation`, `updateRelation`, `replaceCanvasPositions` with internal `beginBatch`/`endBatch`; clear history on `init()` |
| `src/canvas/GraphCanvas.tsx` | Add undo/redo buttons to top-right Panel (nested ButtonGroup, left of existing); add `keydown` listener for Cmd+Z / Cmd+Shift+Z with focus guard; wrap `onNodesDelete` + `onEdgesDelete` in batch; wrap Cmd+drag duplicate in batch |
| `src/canvas/edges/EdgeLabel.tsx` | No changes needed — calls `updateRelation` which is already wrapped |
| `src/canvas/GraphContextMenu.tsx` | No changes needed — calls store mutations which are already wrapped |

No new files. No separate `HistoryManager` class. The snapshot logic lives directly in the Zustand store, keeping undo/redo colocated with the state it manages.

## Phases

Single pass — store-level wrapping, canvas keyboard + button wiring.

## Size Advisory

2 files modified, 0 new. Store changes are mechanical wrappers around 7 existing mutator methods plus undo/redo methods and batch depth state. Canvas changes are a `useEffect` for keyboard + a nested ButtonGroup for buttons.

## Design Notes

- Snapshot capture is `get().entities`, `get().relations`, `get().canvas` — a shallow reference copy of three arrays/objects. Zustand's `set()` creates new references on every mutation, so the captured arrays remain frozen at snapshot time.
- Because the undo stack stores full references, old snapshots are not affected by subsequent mutations (Zustand's `set` produces new arrays/objects each time).
- The auto-save subscriber (300ms debounce) is never suspended during undo/redo — it simply saves whatever the current state is after each `setState` call, which is correct.
- `setNodePosition` and `setCanvasPositions` are excluded from undo history but their effects ARE captured in snapshots taken by tracked operations. If you create a node (triggering a snapshot) then drag it around (no snapshots), then undo — the node returns to its creation position, not its last drag position. This is intentional: drags are ephemeral.
- `replaceCanvasPositions` IS tracked because re-layout is a deliberate user action, unlike drag.
- When restoring a snapshot, all three state slices are set atomically:
  ```ts
  set({ entities: entry.entities, relations: entry.relations, canvas: entry.canvas });
  ```
- The `GraphCanvas.tsx` `useEffect` (lines 100-221) watches `entities` and `relations` and reconciles React Flow nodes/edges. After undo/redo restores domain state, this effect re-derives the correct nodes/edges automatically — no manual `setNodes`/`setEdges` calls needed.
