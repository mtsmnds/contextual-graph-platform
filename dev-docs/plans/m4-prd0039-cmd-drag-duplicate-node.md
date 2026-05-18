# m4-prd0039 — Cmd+drag to Duplicate Node

## Overview

Hold Cmd while dragging a node in the React Flow canvas to create a full clone at the drop endpoint. The clone copies the source entity's `kind`, `content`, and `metadata` (with a unique ID). Multi-selection Cmd+drag duplicates all selected nodes while preserving their relative spatial offsets. The clone appears as a plain node — no auto-inline-editing.

## Specification / Acceptance Criteria

1. **Cmd held on drag start → clone on drop:**
   - When the user holds Cmd while starting to drag a node, and releases the mouse button, a new entity is created with the same `kind`, `content`, and `metadata` as the source.
   - The new entity gets a unique ID (via `generateUniqueId`).
   - The cloned node is positioned at the pointer location at drop, snapped to the 15px grid.
   - The original node stays in place.

2. **Normal drag (no Cmd) is unaffected:**
   - Standard drag behavior is preserved exactly. No duplication occurs.

3. **Multi-selection Cmd+drag:**
   - When multiple nodes are selected and Cmd+drag is initiated on one of them, all selected nodes are duplicated.
   - Each clone retains the same relative spatial offset from the primary drag target.
   - All clones snap to the 15px grid.

4. **No auto-edit mode:**
   - The cloned node does NOT auto-enter inline editing mode. It appears as a plain node with the copied content displayed.

5. **No relations duplicated:**
   - The clone is standalone — no relations are copied from the source entity.

6. **Edge creation unaffected:**
   - Cmd key detection is gated to skip when a connection line is actively being drawn.

7. **Key state is captured at drag start:**
   - The Cmd key state is read when `onNodeDragStart` fires. Mid-drag changes to the modifier key do not affect the outcome.

## Files Changed (inferred)

- `src/canvas/GraphCanvas.tsx` — add `onNodeDragStart` to capture Cmd state + source nodes; modify `onNodeDragStop` to run duplication logic; add refs for key tracking

## Phases

Single pass — the feature is contained to one file with clear entry/exit points.

## Size Advisory

~1 file, straightforward. No phase split needed.
