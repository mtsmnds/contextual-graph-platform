# PRD 0055: Shared Node Hooks — useResizePersistence + useNodeEdit

## Overview

Extract two duplicated patterns from `EntityNode` and `ContainerGroupNode` into shared hooks. The resize hook fixes the container resize-not-persisting bug and prevents it from recurring. The edit hook eliminates ~30 lines of identical inline-editing boilerplate from each node.

## Hook 1: `useResizePersistence(entityId)`

- Returns `onResizeEnd` callback compatible with `NodeResizeControl`
- On resize end:
  - Snaps `x`, `y`, `width`, `height` to 16px grid
  - Writes to store via `updateEntity` wrapped in `beginBatch("Resize node")` / `endBatch()`
- **EntityNode**: replaces inline `handleResizeEnd` with the hook
- **ContainerGroupNode**: wires `onResizeEnd` on Right and Bottom resize controls (currently missing)
- Both nodes: remove `handleResizeEnd` definition (~12 lines each saved)

## Hook 2: `useNodeEdit(data, opts?)`

Extracts the inline editing state machine:

| Concern | Hook output |
|---------|-------------|
| `isEditing`, `setIsEditing` | returned |
| `editValue`, `setEditValue` | returned |
| `commitRef` double-commit guard | internal |
| `lastTriggerRef` remote trigger detection | internal |
| `enterEdit()`, `commitEdit()` | returned |
| Escape handler | `opts.onEscape?: (value: string) => string` — return the value to revert to |
| Blur handler | returned as `handleBlur` |
| Auto-focus ref | returned as `editRef` |
| React ref for the input/textarea | returned as `editRef` |
| Focus + select/cursor on edit start | internal `useEffect` |

Returns `{ isEditing, editValue, setEditValue, editRef, enterEdit, commitEdit, handleBlur, handleKeyDown }`.

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/hooks/useResizePersistence.ts` | **NEW** |
| `src/canvas/hooks/useNodeEdit.ts` | **NEW** |
| `src/canvas/nodes/EntityNode.tsx` | Use both hooks; remove inline handlers (~25 lines removed) |
| `src/canvas/nodes/ContainerGroupNode.tsx` | Use both hooks; add `onResizeEnd` to Right+Bottom (~20 lines removed, ~5 added for resize wiring) |

## Verification

- `npx tsc --noEmit` passes
- `npm run build` passes
- `npx vitest run` passes
- Manual: resize a container → reload → container stays at new size
- Manual: double-click to edit a node → edit works as before
- Manual: resize an entity node → works as before (regression check)
