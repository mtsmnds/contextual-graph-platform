# PRD 0064: Container Layout Children

## Overview

One-shot dagre layout for a single container's direct children, triggered via right-click context menu. Container auto-sizes to fit its children after layout. TB only, no global pipeline integration.

This is the first dagre feature that works *inside* a container. It depends on PRD 0063 (Segment Auto-Height) for accurate child heights — without DOM-measured heights, the bounding box computation would produce wrong container sizes.

## Feature Flag

The "Layout Children" context menu item is gated by the existing `autoLayout` feature flag in the sidebar:

- `autoLayout: true` → menu item is enabled and clickable
- `autoLayout: false` → menu item is present but **disabled** (greyed out, not clickable)

This lets users toggle the feature without losing discoverability of the option.

## Solution

### `layoutContainerChildren(containerId: string): void`

A standalone function exported from `src/engine/layout.ts`. Reads the store directly (same pattern as `runFullLayout`). Steps:

1. Read the container entity from the store.
2. Find its direct children via `contains` relations (filter by `r.source === containerId && r.type === "contains"`).
3. If no children, return early (no-op).
4. Build a dagre graph:
   - `rankdir: "TB"`
   - `nodesep`, `ranksep`, `nodeWidth` from existing `LayoutOptions` defaults (or store state)
   - Each child node sized by its `canvasData.width` / `canvasData.height` (from PRD 0063 measurement, falls back to `estimateNodeHeight`)
5. Run `dagre.layout(g)`.
6. Read positions from the output:
   - Positions are dagre-center (need `x - w/2`, `y - h/2` conversion).
7. Compute container bounding box:
   ```
   minX = min(child.position.x for child in children)
   minY = min(child.position.y for child in children)
   maxX = max(child.position.x + child.canvasData.width for child in children)
   maxY = max(child.position.y + child.canvasData.height for child in children)
   containerW = maxX - minX + 32   // 16px padding left + right
   containerH = maxY - minY + 48   // 16px bottom padding + 32px header
   ```
   Note: header height is estimated at 32px for now, not measured. If headers grow taller in the future (multi-line), this can be refined.
8. Write to store via `useGraphStore.getState()`:
   - `beginBatch("Layout Children")`
   - For each child: `updateEntity(child.id, { canvasData: { x, y, width, height } })` — positions are relative to container (same as drag/drop).
   - For container: `updateEntity(containerId, { canvasData: { width: containerW, height: containerH } })`
   - `endBatch()`

### Context menu item

In `src/canvas/GraphCanvas.tsx`, add to the `contextMenuItems` for `containerGroup` nodes:

```
label: "Layout Children"
disabled: !featureFlags.autoLayout
action: layoutContainerChildren(contextMenu.nodeId)
```

Placed after "Add Child Container" and before "Detach from Group".

### Visual behavior

- User right-clicks a container with segments.
- Clicks "Layout Children".
- Segments snap into a TB column inside the container (16px from left edge).
- Container resizes to fit (header + children + padding).
- Undo (Cmd+Z) restores original positions and container size (single batch entry).

## Acceptance Criteria

- **AC1:** Right-clicking a container shows "Layout Children" in the context menu when the node is a `containerGroup`.
- **AC2:** The item is **enabled** when `autoLayout` is `true`, **disabled** (greyed, non-interactive) when `autoLayout` is `false`.
- **AC3:** Clicking "Layout Children" positions the container's direct children in a vertical column (TB) with `nodesep` spacing.
- **AC4:** The container resizes to fit its children: width = widest child + 32px, height = sum of child heights + gaps + 32px header + 16px bottom padding.
- **AC5:** Children with no measured height (PRD 0063 not yet run) use `estimateNodeHeight()` as fallback.
- **AC6:** Empty container shows no-op (no position changes, no console error).
- **AC7:** Single child centers inside container (dagre generates one node at origin).
- **AC8:** Undo restores all child positions and container dimensions to pre-layout state.
- **AC9:** Cross-container edges (edges from a child to an entity outside this container) are preserved — their positions reference the child's new location correctly.
- **AC10:** Non-`contains` edges between children within the container are preserved and their routing updates to new positions.

## Files Changed

| File | Change |
|------|--------|
| `src/engine/layout.ts` | Add `layoutContainerChildren(containerId)` — standalone function, reads store, runs dagre TB, writes positions + container size |
| `src/canvas/GraphCanvas.tsx` | Add "Layout Children" item in context menu for `containerGroup`, gated by `autoLayout` flag for enabled/disabled |
| `src/engine/layout.test.ts` | New — unit tests for `layoutContainerChildren` |

## Tests

### `src/engine/layout.test.ts`

| Test | What it verifies |
|------|------------------|
| `positions children in TB column` | Given a container with 3 segments, verify their x/y positions form a vertical stack with correct spacing |
| `computes container width from widest child` | Widest child determines container width + 32px padding |
| `computes container height from stacked children` | Sum of child heights + gaps + header + padding |
| `empty container no-op` | No children → returns without writing to store |
| `single child` | Single child positioned at origin inside container |
| `uses measured height when available` | `canvasData.height` is preferred over `estimateNodeHeight` |
| `falls back to estimated height` | When `canvasData.height` is missing, uses `estimateNodeHeight` |
| `writes positions relative to container` | Child positions are relative (not absolute canvas coordinates) |

## Dependencies

- **PRD 0063** (Segment Auto-Height) — must be complete and merged to `main` first. Without measured heights, container sizing will be based on estimates and produce wrong dimensions.

## Notes

- This is intentionally a **standalone function**, not integrated into `getLayoutedElements` or the global layout pipeline. That integration (bottom-up all-containers pass) is deferred to PRD 0065.
- Header height is hardcoded at 32px for now. Current container headers are single-line. If multi-line titles become common, measure dynamically via `ResizeObserver` on the header element.
- `nodesep`, `ranksep`, and `nodeWidth` use `DEFAULT_LAYOUT_OPTIONS` for now. They are not user-configurable per container — that's a PRD 0065 concern.
