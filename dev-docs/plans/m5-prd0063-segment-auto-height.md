# PRD 0063: Segment Node Auto-Height (DOM-Measured)

## Overview

Replace the `estimateNodeHeight()` stopgap with actual DOM-measured heights for segment (leaf) nodes. Segments render at their natural content height — no fixed height in styles. After render, measure the real DOM height and write it to `canvasData.height` so dagre and the store use accurate dimensions.

**Containers are excluded.** A container's size comes from the bounding box of its laid-out children, not its own text content. Container sizing is part of the sub-dagre pass (PRD 0064) and depends on this PRD landing first — the sub-dagre pass needs accurate child dimensions to compute a container's bounds.

## Context & Previous Attempt

**PRD 0045** (2026-05-25) tried auto-height via textarea content expansion. It failed because:
- The textarea always grew to content, making user resize handles useless
- The continuous expand-on-type caused layout instability
- Height was user-controlled via `NodeResizeControl` as a workaround

This approach is fundamentally different:
1. **No textarea expand.** The DOM lays out naturally at a fixed width; height is whatever the content needs.
2. **One-time measurement.** Height is measured after render and persisted to `canvasData` — it does not continuously fight resize handles.
3. **Only segments.** Leaf nodes (segments) only. Containers are sized by their children (PRD 0064).
4. **No grid snapping.** The 16px grid alignment that caused the previous approach to fail is deferred. Segments are always inside containers in practice and don't need to align with the canvas grid.

## Problem

`estimateNodeHeight()` in `src/engine/layout.ts` counts characters and estimates line breaks. It's always wrong for Tiptap-rich content and off by 1–2 lines for plain text. Nodes are either too tall (wasted space) or too short (text clipped behind overflow).

Dagre uses this estimate as the node's height input, producing a layout that doesn't match what the user sees on screen.

## Solution

1. Remove fixed `height` from segment node styles — let the DOM determine height naturally at the given width.
2. After render, measure the node's actual DOM height via `ref.current.offsetHeight`.
3. Write the measured height to `entity.canvasData.height` via `updateEntity`.
4. Dagre and the store read `canvasData.height` as the authoritative height.

### Infinite loop guard

Only write to the store when height actually changes. Compare the new measured height with the current `entity.canvasData.height`. Only call `updateEntity` if the difference is greater than 1px. This prevents measure → write → re-render → measure infinite loops.

```
newHeight = Math.round(ref.current.offsetHeight)
currentHeight = entity.canvasData.height ?? 0
if Math.abs(newHeight - currentHeight) > 1:
    updateEntity(id, { canvasData: { height: newHeight } })
```

### Grid snapping

Deferred. Segments are always inside containers in practice — they don't need to align with the 16px canvas grid. Prioritize correct height first. If grid alignment becomes necessary later, the snapping can be done on the measured value before writing to the store.

### `estimateNodeHeight` fallback

`estimateNodeHeight()` is retained as a fallback for nodes without measured heights (newly created nodes before first render, or nodes migrated from older data). Mark it `@deprecated` in JSDoc. Once every entity in the store has a `canvasData.height`, the function can be deleted.

## Acceptance Criteria

- **AC1:** Segment entity nodes have no fixed `height` in their React Flow node style.
- **AC2:** After mount and on content change, `EntityNode.tsx` measures `ref.current.offsetHeight` and writes it to `entity.canvasData.height` via `updateEntity`.
- **AC3:** The store write is guarded — only fires when the new height differs from current `canvasData.height` by more than 1px.
- **AC4:** The dagre sync in `GraphCanvas.tsx` reads `entity.canvasData.height` when available, falling back to `estimateNodeHeight()` otherwise.
- **AC5:** `estimateNodeHeight()` is annotated `@deprecated` with a JSDoc note pointing to `canvasData.height` as the replacement.
- **AC6:** Container entity nodes are unaffected — their height continues to be determined by the dagre pass or user resize (container sizing is PRD 0064).
- **AC7:** EntityNode stories verify that content changes update `canvasData.height` and that the guard prevents redundant writes.

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/nodes/EntityNode.tsx` | Add `useEffect` to measure `ref.current.offsetHeight` on mount & content change; guard against redundant writes; write to store |
| `src/canvas/GraphCanvas.tsx` | In the three node-build sites, remove fixed `height` from segment node styles |
| `src/engine/layout.ts` | Update `estimateNodeHeight` call sites to prefer `canvasData.height`; add `@deprecated` JSDoc annotation |

## Stories

- EntityNode with short content — verify measured height is written to store, height > 0
- EntityNode with multi-line content — verify height grows compared to short content
- EntityNode content unchanged — verify no redundant store write (guard prevents it)
- EntityNode with pre-existing `canvasData.height` — verify it is not overwritten unless content changes

## Notes

- Container auto-height / container sizing from children's bounding box belongs in PRD 0064 (sub-dagre pass). That PRD depends on this one — the sub-dagre pass needs accurate child heights from this work to compute container bounds.
- The existing `applyMeasuredDimensions` in `GraphCanvas.tsx` already snaps measured values — the node builder reads those back into style. The measurement in this PRD is orthogonal: it writes to `canvasData.height` for dagre consumption, not for React Flow's internal measurement system.
- If a segment node has an existing user-set height (from manual resize), the measurement should not overwrite it. Only nodes without explicit user height should be auto-measured.
