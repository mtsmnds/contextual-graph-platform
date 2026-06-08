> **Completion note (2026-06-03):**
> - **What was built:** Filtered `contains` relations out of three edge-building sites in `GraphCanvas.tsx` (non-dagre initial builder, non-dagre sync useEffect) and `layout.ts` (`getLayoutedElements`). `contains` edges no longer render as visible lines; nesting is driven solely by `parentId`.
> - **Key decisions:** Filter at the view layer only — store and query functions untouched.
> - **Deviations from plan:** None.
> - **Postponed:** None.

# PRD 0062: Hide `contains` Edges on Canvas

## Overview

`contains`-type relations express structural nesting (an entity is inside a container), not visible connections. They should drive `parentId` on React Flow nodes, not render as edge lines on the canvas. This PRD filters them out of the edge builder in two places so they never appear as visible edges, while keeping them intact in the store for querying.

## Specification / Acceptance Criteria

**AC1: `GraphCanvas.tsx` sync `useEffect` filters `contains` edges**
- In the edge-building branch of the sync `useEffect`, filter relations before converting to React Flow edges: `relations.filter(r => r.type !== "contains")`
- Non-`contains` relations (e.g., `references`) continue to render as normal edges

**AC2: `getLayoutedElements` in `layout.ts` applies the same filter**
- The edge builder inside `getLayoutedElements` filters `contains` edges out of the dagre graph
- Nesting is handled by `parentId` on nodes, not by edges — dagre should not route `contains` edges

**AC3: No data changes to the store**
- `contains` relations remain in `useGraphStore` entities/relations state
- Query functions (`getContainerChildren`, `getParentId`, etc.) continue to work unchanged
- Only the view layer (React Flow edge array) excludes them

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | Add `.filter(r => r.type !== "contains")` in sync `useEffect` edge builder |
| `src/engine/layout.ts` | Add same filter in `getLayoutedElements` edge builder |

## Size

Trivial — two one-line filter additions.
