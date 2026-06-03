# PRD 0063: Dagre Phase 3 — Sub-Dagre, DOM Height, sortOrder Constraints

## Overview

PRD0060 reintroduced dagre with a one-size-fits-all flat layout. The current output is suboptimal: all entities are arranged in a single dagre pass regardless of container boundaries, node heights are estimated from text length (often wrong), and sort order within ranks is undefined. This PRD addresses all three in one phase.

Three changes:
1. **Sub-dagre per container** — instead of one flat dagre pass, run dagre independently for each container group. Each container's children are laid out as a sub-graph. This produces compact, readable per-container stacks.
2. **DOM-measured node heights** — replace `estimateNodeHeight()` stopgap with actual DOM measurements from auto-sized nodes. Nodes expand to fit their content; dagre reads the real height.
3. **sortOrder-based constraints** — feed `dagre.constraints` with the sibling sort order so children within a container appear in the correct sequence (left-to-right or top-to-bottom depending on rankdir).

## Phase 1 — DOM-Measured Node Heights

### Problem
`estimateNodeHeight()` counts characters and estimates line breaks. It's always wrong for Tiptap-rich content and off by 1-2 lines for plain text. Nodes are either too tall (wasted space) or too short (text clipped behind overflow).

### Solution
Entity nodes are already auto-sized (no fixed height). After React Flow renders, read the actual DOM height via `useNodesInitialized` + `useNodeId` + `useUpdateNodeInternals`. Write the measured height back to `entity.canvasData.height` via `updateEntity`. The dagre layout engine then reads `canvasData.height` as the authoritative height.

### Detail
- `EntityNode.tsx`: on mount + content change, measure `ref.current.offsetHeight`, call a new store action `setNodeHeight(id, height)` (or reuse `updateEntity` with `{ canvasData: { height } }`)
- Dagre sync in `GraphCanvas.tsx` must then use the stored height instead of `estimateNodeHeight()`
- Keep `estimateNodeHeight()` as fallback when no `canvasData.height` exists (newly created nodes, migration)

### Acceptance Criteria
- **AC1:** Every entity node measures its DOM height after render and on content change, writing it to `entity.canvasData.height`
- **AC2:** The dagre sync in `GraphCanvas.tsx` reads `entity.canvasData.height` when available, falling back to `estimateNodeHeight()` otherwise
- **AC3:** `estimateNodeHeight()` is retained but annotated `@deprecated` — removable when all nodes have measured heights

### Files Changed

| File | Change |
|------|--------|
| `src/canvas/nodes/EntityNode.tsx` | Add `useEffect` to measure `ref.current.offsetHeight` on mount & content change; write to store |
| `src/engine/layout.ts` | Update `estimateNodeHeight` call sites to prefer `canvasData.height` over estimate; add `@deprecated` annotation |

### Stories
- EntityNode stories: verify the effect of content changes on measured height (can read story assertion via node style)

---

## Phase 2 — Sub-Dagre Per Container

### Problem
The current flat dagre pass treats all 50+ entities as one graph. Container group nodes (which are visually large rectangles containing child nodes) are laid out as peers of their own children. The output is a sprawling graph where containers and their contents are interleaved.

### Solution
Before the dagre pass, group entities by top-level container. Run dagre independently for each group:
1. Identify containers (entities with outgoing `contains` edges)
2. For each container, collect its descendants via `contains` edge walk
3. For each container: run dagre on { container + its descendants }, with the container as a group node
4. Root-level entities (no parent) stay in a top-level dagre pass
5. After all sub-dagre runs, position each sub-graph by stacking them vertically (or side-by-side for roadmap layout)

### Detail
- New function: `groupByContainer(entities, relations): Map<string, Entity[]>`
- New function: `runSubDagre(containerEntity, children, options): NodePosition[]`
- Modify `getLayoutedElements` to call `runSubDagre` per container, then position sub-graphs in rank order
- The sub-dagre for a container passes `{ width: containerWidth, height: estimatedHeight }` as the container group node dimension, so dagre routes edges through the container boundary

### Acceptance Criteria
- **AC4:** Entities inside a container are laid out independently from entities in other containers
- **AC5:** Sub-graphs are stacked below each other (TB) or beside each other (LR) in the final layout
- **AC6:** Edges that cross container boundaries (reference edges between entities in different containers) still route correctly between sub-graphs
- **AC7:** The sub-dagre pass respects `nodeWidth`, `nodesep`, `ranksep`, and `rankdir` from `LayoutOptions`

### Files Changed

| File | Change |
|------|--------|
| `src/engine/layout.ts` | Add `groupByContainer`, `runSubDagre`; modify `getLayoutedElements` to orchestrate sub-dagre runs |
| `src/engine/layout.test.ts` | New — unit tests for grouping logic, sub-dagre output, cross-container edge routing |

### Tests
- Unit tests for `groupByContainer`: empty entities, single container, nested containers, entities with no parent
- Unit tests for sub-dagre output: positions are within container bounds, siblings are ranked by sortOrder

---

## Phase 3 — sortOrder-Based Constraints

### Problem
Children within a container appear in dagre-determined order (topology-based), which is often wrong. The canonical order is stored in `contains` edge `sortOrder` fields. For example, a book's chapters might appear in creation order rather than chapter order.

### Solution
Feed dagre's `constraints` option with sibling order: for each pair of adjacent siblings (sorted by `sortOrder`), add a `{ left: earlier.id, right: later.id }` constraint. This tells dagre to place `earlier` before `later` at the same rank.

### Detail
- In `getLayoutedElements`, after grouping by container, for each group:
  1. Sort the container's outgoing `contains` edges by `sortOrder`
  2. For each adjacent pair, add `{ type: dagre.constraint.LEFT_TO_RIGHT | TOP_TO_BOTTOM, left: earlierChild.id, right: laterChild.id }`
  3. The constraint axis depends on `rankdir` — `LR` uses `TOP_TO_BOTTOM`, `TB` uses `LEFT_TO_RIGHT`

### Acceptance Criteria
- **AC8:** Children within a container appear in the order specified by their `contains` edge `sortOrder`
- **AC9:** Unrelated entities (no `contains` edge connecting them) are unaffected by sortOrder constraints
- **AC10:** sortOrder direction is based on `rankdir`: `LEFT_TO_RIGHT` in `TB` mode, `TOP_TO_BOTTOM` in `LR` mode
- **AC11:** When sortOrder is equal between two edges, order is undefined but must not throw

### Files Changed

| File | Change |
|------|--------|
| `src/engine/layout.ts` | Add constraints building in `getLayoutedElements` or `runSubDagre` |
| `src/engine/layout.test.ts` | Tests for constraint building, edge cases (equal sortOrder, single child, no children) |

### Tests
- Constraint building for TB rankdir: verify `{ left: a, right: b }` pairs
- Constraint building for LR rankdir: verify `{ top: a, bottom: b }` pairs
- Equal sortOrder: no constraint generated (warning logged)
- Single child: no constraints generated

---

## Phase 4 — Debounced Auto-Layout on Option Change

### Problem
Users must click "Run Layout" after every option change. For rapid iteration (tweaking nodesep, then ranksep, then nodeWidth), this is tedious.

### Solution
When the reactive dagre sync is ON and the user changes any `LayoutOption`, debounce a full re-layout by 300ms. The debounce resets on each subsequent change. The layout function called is the reactive sync (respects saved positions), not `runFullLayout`.

### Acceptance Criteria
- **AC12:** Changing any layout option triggers a debounced re-layout (300ms)
- **AC13:** Rapid changes (e.g., dragging a slider) only trigger one re-layout after the user stops
- **AC14:** The debounce does not apply to the "Run Layout" button (it runs immediately)
- **AC15:** If `autoLayout` is toggled OFF while debounce is pending, the pending layout is cancelled

### Files Changed

| File | Change |
|------|--------|
| `src/canvas/panels/sections/CanvasLayoutSectionContainer.tsx` | Add `useEffect` with debounce on `options`; call reactive layout (not `runFullLayout`) |

### Stories
- Story with `onChange` spy: verify debounce timing
- Story with rapid option changes: verify only one call after debounce settles

---

## Notes

- Phase 1 should be implemented first — it unblocks the other phases by providing accurate node heights
- Phase 3 depends on Phase 2 (constraints operate within a container group)
- Phase 4 is independent (UI-only change with no layout engine modifications)
- `estimateNodeHeight` is deprecated after Phase 1 but not removed — it remains as fallback for nodes without measured heights
- Cross-container edges in sub-dagre (Phase 2) are the trickiest part — edges reference entities in different sub-graphs, and dagre must route them across the boundary
