# m4-prd0042 — Undo/Redo

## Overview

Command-pattern undo/redo system that tracks every entity and relation mutation on the graph. Batch operations (multi-select delete, context menu delete that cascades) are grouped into a single undoable action. Position drags and viewport changes are excluded. Keyboard shortcuts (Cmd+Z / Cmd+Shift+Z) and panel buttons provide access.

This closes a critical safety gap: the user can recover from accidental deletes, bad edits, and mistaken relation changes with a single keystroke.

## Specification / Acceptance Criteria

### 1. Command-Pattern History

Each graph mutation records a reversible command:

```
undo stack: [command, command, command, ...]  ← most recent at end
redo stack: [command, command, ...]           ← cleared on new mutation
```

**Command structure** (internal, not persisted — lives in memory only, lost on page reload):

```ts
type HistoryCommand = {
  undo: () => void       // reverse the mutation
  redo: () => void       // re-apply the mutation
  description: string     // human-readable label (e.g., "Create node", "Delete 3 nodes")
}
```

Max history: **50 commands**. Oldest dropped when exceeded. Redo stack is cleared whenever a new command is pushed (standard undo/redo behavior).

### 2. Covered Mutations

| Store action | Undo behavior | Redo behavior |
|-------------|---------------|---------------|
| `addEntity(...)` | Delete the created entity and its auto-generated relations | Re-create the entity with same id/content/kind/metadata |
| `updateEntity(id, ...)` | Revert entity to state before the update | Re-apply the update |
| `deleteEntity(id)` | Restore the deleted entity AND all its relations (source+target) | Delete the entity and cascade its relations again |
| `addRelation(...)` | Remove the created relation | Re-create the relation with same id/source/target/type/sortOrder |
| `removeRelation(id)` | Restore the deleted relation | Remove the relation again |
| `updateRelation(id, ...)` | Revert relation to state before the update | Re-apply the update |

### 3. Batch Grouping

Multiple mutations that result from a single user action are grouped as one undoable step:

- **Multi-select delete** (select N nodes, press Backspace): `onNodesDelete` calls `deleteEntity` N times → grouped as "Delete N nodes". Undoing it restores all N entities and their relations in one step.
- **Node deletion cascade** (deleteEntity also removes the entity's relations): The entity delete + relation cascades are part of the same command. Undoing restores entity + all its relations.
- **Cmd+drag duplicate** (creates N entities + optional auto-relations): Grouped as "Duplicate N nodes".
- **Connect handles** (creates a relation via drag): Single command.

**API pattern:** The store exposes `beginBatch(description: string)` and `endBatch()` methods. Between begin/end, all pushed commands are coalesced into one composite command. Nested batches are ignored (only the outermost counts).

### 4. Excluded from History

These operations do NOT push history commands:

- `setNodePosition` / `setCanvasPositions` — position changes from drag are too noisy
- `setViewport` — viewport changes are view state, not data
- `setCanvasDimensions` — resize is view state
- `focusEntity` / `expandPanel` / `closePanel` — view state
- `saveContent` / `clearContent` — container content (not entity/relation mutations)

### 5. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Z` | Undo (pop from undo stack, push to redo stack) |
| `Cmd+Shift+Z` | Redo (pop from redo stack, push to undo stack) |

**Guard:** If a text input, textarea, or contentEditable element is focused, the keyboard shortcut is NOT intercepted — the browser handles the native text undo/redo.

**Implementation:** Global `keydown` listener on `window` (or React Flow pane). Check `e.metaKey` (Mac) / `e.ctrlKey` (Windows). Use `document.activeElement` to check for text inputs.

### 6. UI Buttons

Two buttons added to the top-right panel button group:

- **Undo** (arrow-left / undo icon), disabled when undo stack is empty
- **Redo** (arrow-right / redo icon), disabled when redo stack is empty

Position: to the left of "New Node" in the existing top-right `ButtonGroup`. Separated by a subtle visual divider (or use a nested ButtonGroup if shadcn supports it).

Buttons should use tooltip/title attributes showing the last command description on hover (e.g., tooltip on Undo reads "Undo: Delete 3 nodes").

### 7. State Reset

- On `init()` (workspace load, switch folder), the history stacks are cleared.
- On page reload, history is lost (commands are in-memory only). This is acceptable — undo/redo is for intra-session recovery, not cross-session.

## Files Changed (inferred)

- `src/engine/undo-redo.ts` (new) — `HistoryManager` class with `push(cmd, description?)`, `beginBatch(desc)`, `endBatch()`, `undo()`, `redo()`, `canUndo`/`canRedo` getters, `clear()`, getter for top-of-stack description
- `src/store/useGraphStore.ts` — Wrap `addEntity`, `updateEntity`, `deleteEntity`, `addRelation`, `removeRelation`, `updateRelation` to push commands; add `undo()`, `redo()`, `beginBatch()`, `endBatch()`, `canUndo`/`canRedo` to store interface; initialize history manager
- `src/canvas/GraphCanvas.tsx` — Add undo/redo buttons to top-right Panel; add keyboard listener for Cmd+Z / Cmd+Shift+Z with text input guard; wire `onNodesDelete` to batch
- `src/canvas/GraphContextMenu.tsx` — No changes (delete context menu calls `deleteEntity` which is already wrapped)

## Phases

Single pass — one new engine module, store wrappers, canvas keyboard + button wiring.

## Size Advisory

~3 files modified, 1 new. The history manager is a standalone class with no React imports. Store changes are mechanical wrappers around existing mutations. Keyboard listener is a single `useEffect`. The tricky part is ensuring batch operations (multi-delete) are correctly grouped.

## Design Notes

- Commands capture **full entity snapshots** at the time of the mutation — not diffs. This avoids tracking property-level changes across multiple updates to the same entity.
- The `deleteEntity` command must snapshot ALL relations before deleting (to restore them on undo).
- The `addEntity` with `parentId` may auto-generate an ID that must be preserved on redo (use the same ID that was generated on the first create).
- Redo after undo of a delete should re-generate the same entity ID, not create a new one. Commands carry the original ID for this reason.
