# PRD 0053: Container Padding — Child Safe Zone

## Overview

Add a padded "safe zone" inside container nodes so child entities and containers cannot touch the container's border or overlap its header content. Left/right/bottom padding is 16px (one grid unit). Top padding is header height + 16px, accounting for single-line and multi-line header text. Children that land inside the padded zone on drag or creation are clamped into the safe zone.

## Specification / Acceptance Criteria

### US1: Left, right, bottom padding of 16px

- When a child node is dragged into a container, its relative position is clamped so that:
  - `x >= 16` (left padding)
  - `x + child.width <= parent.width - 16` (right padding)
  - `y + child.height <= parent.height - 16` (bottom padding)
- When a child is created inside a container, its initial position respects the same padding.
- The `extent` of each child constrains movement to the padded bounds during drag, not just on drop.

### US2: Top padding that protects the header content

- When a child is inside a container, its `y` position is clamped so that:
  - `y >= headerHeight + 16` (top padding)
- `headerHeight` is measured from the actual DOM header element of the parent container node.
- If the header wraps to multiple lines, the measured height accounts for it — children cannot overlap any line of the title text.
- If header measurement is unavailable (e.g. node not yet rendered), a fallback constant of 40px is used.

### US3: Extent is dynamic and recalculated on dimension changes

- Each child's `extent` is set as a `CoordinateExtent` tuple (`[[minX, maxX], [minY, maxY]]`) instead of `'parent'`.
- The extent is recalculated whenever:
  - The parent container is resized
  - The child is resized
  - The parent's header height changes (e.g. title wraps)
- The `expandParent` flag remains `true` — dragging a child toward the parent edge still expands the parent.

### US4: Clamp on drop, not just extent

- Even with `extent` set, `onNodeDragStop` explicitly clamps the child's relative position to the padded bounds as a safety net.
- This ensures that rapid resizes or race conditions don't leave a child in the padded zone.

### US5: Minimum viable parent size

- If a parent container is resized so small that the padded zone would leave no room for children (e.g. width < 48px), the padding is reduced proportionally rather than making the container impossible to use.
- Below a reasonable minimum (width < 64px, height < 80px), children are placed at 0,0 rather than allowing impossible constraints.

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Container with no children | No behavioral change — no extent to compute |
| Container resized below padding threshold | Padding reduces proportionally; hard minimum before clamping at 0 |
| Deeply nested containers | Padding applies at every nesting level, each relative to its own parent |
| Child larger than parent's padded area | Child is not shrunk — it overlaps the padding zone (padded zone is a placement constraint, not a sizing constraint) |
| Header wraps to N lines | Measured height `N * line-height + padding` — top padding adjusts |
| Child created via double-click in container | Position clamped to safe zone |
| Child dragged between containers | On entry, position converted to relative and clamped to new parent's safe zone |
| Parent has no header element rendered yet | Fallback to 40px constant |
| Undo/redo a drag that was clamped | Undo restores the pre-clamp position — no data loss from clamping |

### Out of Scope

- Visual indication of the safe zone (colored overlay, dashed border, etc.) — defer to a visual design pass.
- Re-layout of existing children when a container is resized — children are reclamped on the next dimension sync, not animated.
- Container min-width/min-height changes — already 272 x 128 from `NodeResizeControl`.

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | Replace `extent: "parent"` with padded `CoordinateExtent` in all 3 node-build sites. Add position clamping to `onNodeDragStop` for drag-to-nest and drag-between-containers. Add position clamping to double-click create. |
| `src/canvas/nodes/ContainerGroupNode.tsx` | Expose header height via a data attribute, ref, or CSS custom property for measurement. |
| `src/engine/queries.ts` or new util | Optional: helper function to compute padded extent for a given parent-child pair. |
| `src/index.css` | Optional: CSS variable for header height if measured approach is used. |

## Implementation Strategy

### Step 1: Header height measurement

In `ContainerGroupNode.tsx`, the `BaseNodeHeader` already renders a `<header>` element. Add a `data-container-header` attribute or expose the height via a ref/CSS custom property. Two options:

A. **CSS custom property** — Set `--container-header-height` on the container node's wrapper element, updated via a `ResizeObserver` on the header element. React Flow's node sync code reads it.

B. **DOM query in sync code** — In the entity→node sync loop in `GraphCanvas.tsx`, query `[data-container-header]` within the container's DOM element and read `offsetHeight`.

Option A is more robust (reactive) but requires more plumbing. Option B is simpler. Recommend **Option A** for correctness (handles multi-line dynamically) but **Option B** for a first pass.

### Step 2: Padded extent computation

In all 3 node-build sites, replace:

```
extent: entity.parentId ? "parent" : undefined
```

with something like:

```
extent: entity.parentId ? computePaddedExtent(parentNode, childWidth, childHeight, headerHeight) : undefined
```

Where `computePaddedExtent` returns a `CoordinateExtent` tuple:

```typescript
function computePaddedExtent(
  parentWidth: number,
  parentHeight: number,
  childWidth: number,
  childHeight: number,
  headerHeight: number,
): CoordinateExtent {
  const padding = 16
  const topPadding = headerHeight + padding
  return [
    [padding, parentWidth - childWidth - padding],
    [topPadding, parentHeight - childHeight - padding],
  ]
}
```

### Step 3: Clamp on drop

In `onNodeDragStop`, after the relative position is computed, clamp it:

```typescript
const clampedX = Math.max(padding, Math.min(relativeX, containerWidth - childWidth - padding))
const clampedY = Math.max(topPadding, Math.min(relativeY, containerHeight - childHeight - padding))
```

### Step 4: Re-extent on resize

When `onResizeEnd` fires for a container or a child inside a container, trigger a re-sync of extents for all affected children.

## Size Advisory

Medium — ~3-4 files, moderate complexity due to the dynamic extent recalculation and multi-line header measurement. Single pass.
