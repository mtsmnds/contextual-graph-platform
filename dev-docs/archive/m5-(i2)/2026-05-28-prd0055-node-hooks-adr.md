# 2026-05-28: prd0055 — shared useResizePersistence + useNodeEdit hooks

## Context
- `EntityNode` and `ContainerGroupNode` had ~40 lines of nearly identical inline editing and resize persistence logic each.
- Container resize did not persist because `ContainerGroupNode` lacked `onResizeEnd` — a class of bug that could recur with any future custom node.
- The inline editing pattern (enter/commit/cancel/blur/escape/auto-focus/remote-trigger) was duplicated verbatim.

## Decision
- Extract resize persistence into `useResizePersistence(entityId)` — a standalone hook that returns an `onResizeEnd` handler. Any custom node with resize controls wires it in one line.
- Extract inline editing into `useNodeEdit(data, onCommit)` — a hook that manages the full state machine. The caller passes a commit callback and receives `{ isEditing, editValue, editRef, enterEdit, handleBlur, handleKeyDown }`.
- Both hooks live in `src/canvas/hooks/` — a new directory for canvas-specific hooks.
- Both nodes updated to use the hooks. ContainerGroupNode gains `onResizeEnd` on Right and Bottom resize controls.

## Alternatives Considered
- **Shared base component** — rejected because EntityNode and ContainerGroupNode have fundamentally different layouts (no-header vs header+content-area). Hooks compose better with divergent JSX.

## Consequences
- Container resize now persists to the store. Resize-and-reload test passes.
- ~27 lines removed from each node file.
- Future custom nodes get resize and edit support by calling a hook — no reimplementation.
- The hooks directory (`src/canvas/hooks/`) is now the canonical location for canvas-specific hook logic.

## Follow-ups
- None — this PRD is self-contained.
