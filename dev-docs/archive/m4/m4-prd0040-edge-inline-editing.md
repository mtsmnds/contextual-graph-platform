> **Completion note (2026-05-18):**
> - **What was built:** Edge label double-click → inline text input + combobox of existing relation types. Custom edge component (`EdgeLabel`) with Bezier path + EdgeLabelRenderer for interactive label. Removed EdgeDialog entirely. Added pane double-click guard to prevent accidental node creation when editing edge labels.
> - **Key decisions:** EdgeLabelRenderer + getBezierPath for label rendering (standard React Flow pattern). Dropdown is simple positioned `div` list (not Popover+Command) to avoid integration complexity with absolute edge label positioning.
> - **Deviations from plan:** Added pane double-click guard (`el.closest(".react-flow__edge-label")` / `.react-flow__edge` check) to fix edge label clicks creating nodes. Not in the original spec, but required for correct UX.
> - **Postponed:** None.

# m4-prd0040 — Edge Inline Editing

## Overview

Replace the EdgeDialog modal with inline editing on the edge label. Double-click any edge label to enter edit mode — an inline text input with a combobox dropdown of existing relation types. User can pick an existing type or type a new one. Enter/blur to commit, Escape to cancel. Removes EdgeDialog entirely.

## Specification / Acceptance Criteria

1. **Double-click edge label enters inline edit:**
   - Double-clicking an edge label in the canvas replaces the text label with an inline input field.
   - The input is pre-filled with the current `relation.type` value.
   - A combobox popover shows all distinct `type` values across all relations in the store.
   - User can pick from the dropdown or type a freeform value.

2. **Commit and cancel:**
   - **Enter** or **blur** commits the new value via `updateRelation(id, { type })`.
   - **Escape** cancels and reverts to the original label text.
   - Edge label updates immediately in the canvas.

3. **EdgeDialog removed:**
   - The modal EdgeDialog component is deleted entirely.
   - The `onEdgeDoubleClick` handler in GraphCanvas is replaced by the edge component's own handler.
   - Edge context menu "Edit Relation" is removed or re-pointed to open inline editing.

4. **Relation type query:**
   - A new function `getRelationTypes(state): string[]` returns distinct `type` values from all relations.
   - The combobox dropdown is populated from this query.

5. **Hover affordance:**
   - Edge labels subtly highlight on hover to signal interactivity (same pattern as node hover ring).

## Files Changed (inferred)

- `src/canvas/edges/EdgeLabel.tsx` (new) — custom edge component that renders the label with double-click → inline input + combobox
- `src/canvas/GraphCanvas.tsx` — register `edgeTypes` with the new edge component; remove EdgeDialog import, state, and handlers; remove edge context menu "Edit Relation" item
- `src/engine/queries.ts` — add `getRelationTypes(state)` utility
- Remove `src/canvas/EdgeDialog.tsx`

## Phases

Single pass — the work is self-contained (~4 files, tightly coupled).

## Size Advisory

~4 files. Clear boundaries: new custom edge component, one store query, remove old dialog.
