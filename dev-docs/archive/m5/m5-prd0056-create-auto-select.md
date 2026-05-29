# PRD 0056: Auto-Select on Node Creation + Context Menu Position Fix

## Overview

Two changes to node creation in the canvas: (1) every newly created node or container is automatically selected so the sidebar shows its properties immediately, and (2) the context menu "Add Child Node" and "Add Child Container" items use the right-click position instead of hardcoded offsets.

## Specification / Acceptance Criteria

### US1: Auto-select on creation

When a node or container is created via any of these paths, it is automatically selected (highlighted, sidebar shows its properties) and enters inline edit mode:

- Double-click on the pane → new concept node selected + editing
- Right-click pane → "New Group" → new container selected + editing
- Double-click inside a container → new child segment selected + editing
- Right-click a container → "Add Child Node" → new child segment selected + editing
- Right-click a container → "Add Child Container" → new child container selected + editing

Implementation: after every `pendingNodeRef.current = id` assignment, call `useGraphStore.getState().setSelectedNode(id)`.

### US2: Context menu uses right-click position

Both "Add Child Node" and "Add Child Container" context menu items currently hardcode the child's position (`{ x: 16, y: 64 }` and `{ x: 16, y: 128 }`). Replace these with the right-click position:

1. Convert screen coordinates to flow coordinates via `reactFlowInstance.screenToFlowPosition({ x: contextMenu.x, y: contextMenu.y })`
2. Subtract the parent node's position to get coordinates relative to the parent
3. Snap the result to the 16px grid
4. Use the snapped relative position as `canvasData.x` and `canvasData.y`

### Edge Cases

- **Creation and immediate deselection:** User selects a node, it enters edit mode, then user clicks elsewhere → selection clears normally. No special handling needed.
- **Context menu on a deeply nested container:** Parent lookup via `nodes.find((n) => n.id === contextMenu.nodeId)` works at any depth.
- **Context menu position outside parent bounds:** The position is used as-is — React Flow's `extent: "parent"` constrains the child on the next render.

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | Add `setSelectedNode` call at 5 creation sites; fix 2 context menu positions |

## Verification

- `npx tsc --noEmit` passes
- `npm run build` passes
- `npx vitest run` passes
- Manual: create a node via double-click → node is selected, sidebar shows properties
- Manual: right-click a container → "Add Child Node" → child appears at click position
- Manual: right-click a container → "Add Child Container" → child appears at click position
