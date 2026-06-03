# PRD 0064: Dagre Phase 3 — Sub-Dagre, Container Sizing, sortOrder, Mixed Directions, Debounced Re-Layout

## Overview

PRD 0060 reintroduced dagre with a flat layout across all entities. PRD 0063 provides accurate child dimensions via DOM-measured heights. This PRD builds on both to make containers aware of their children, order siblings correctly, support mixed layout directions, and re-layout automatically on option change.

Four changes, ordered by dependency:
1. **Sub-dagre per container + container sizing** — run dagre bottom-up per container group. Each container's size is computed from its children's bounding box + 16px padding.
2. **sortOrder-based constraints** — feed dagre constraints with sibling `sortOrder` so children appear in the correct sequence.
3. **Mixed direction layout** — support `TB` and `LR` per container, not just one global `rankdir`.
4. **Debounced auto-layout on option change** — re-run layout 300ms after the user stops adjusting layout options.

---

## Phase 1 — Sub-Dagre Per Container + Container Sizing

### Problem

The current flat dagre pass treats all 50+ entities as one graph. Container group nodes are laid out as peers of their own children. The output is a sprawling graph where containers and their contents are interleaved. Container sizes are hardcoded defaults, not derived from their contents.

### Solution

Run dagre independently for each container group, bottom-up:

1. Build a nesting tree from `contains` edges.
2. Process leaf containers first — run dagre on their children using measured dimensions from PRD 0063.
3. After children are positioned, compute the container's bounding box: children's collective bounds + 16px padding on each side.
4. Write the container's computed size to `canvasData.width` and `canvasData.height`.
5. Move up one level — the container is now a node with known dimensions. Its parent container runs dagre on its children (including this now-sized container).
6. Repeat until root containers are sized.
7. Root-level entities (no parent) get a top-level dagre pass.

### Container sizing detail

```
containerX = min(child.x for child in children) - 16
containerY = min(child.y for child in children) - 16
containerW = max(child.x + child.width for child in children) - containerX + 16
containerH = max(child.y + child.height for child in children) - containerY + 16
```

This depends on PRD 0063 for accurate child heights — without DOM-measured heights, the bounding box computation would be based on estimated heights and produce wrong container sizes.

### Functions

- `buildNestingTree(entities, relations): Map<string, Entity[]>` — maps container ID to its direct children (via `contains` edges), ordered bottom-up.
- `runSubDagre(containerEntity, children, options): NodePosition[]` — runs dagre on the sub-graph, returns positions relative to the container.
- `computeContainerBounds(positions: NodePosition[], padding: number): { width, height }` — computes bounding box from child positions.
- Modify `getLayoutedElements` to orchestrate sub-dagre runs bottom-up, then position sub-graphs.

### Acceptance Criteria

- **AC1:** Entities inside a container are laid out independently from entities in other containers.
- **AC2:** Container size is computed from its children's bounding box + 16px padding, written to `canvasData`.
- **AC3:** Root-level entities (no parent container) get a top-level dagre pass.
- **AC4:** Edges that cross container boundaries (reference edges between entities in different containers) route correctly between sub-graphs.
- **AC5:** The sub-dagre pass respects `nodeWidth`, `nodesep`, `ranksep`, and `rankdir` from `LayoutOptions`.
- **AC6:** Nested containers (container inside container) are processed bottom-up — inner containers are sized before outer containers.

### Files Changed

| File | Change |
|------|--------|
| `src/engine/layout.ts` | Add `buildNestingTree`, `runSubDagre`, `computeContainerBounds`; modify `getLayoutedElements` to orchestrate sub-dagre runs |
| `src/engine/layout.test.ts` | Unit tests for grouping, sub-dagre output, container sizing, nested containers, cross-container edge routing |

### Tests

- `buildNestingTree`: empty entities, single container, nested containers, entities with no parent
- Sub-dagre output: positions are within container bounds, siblings ranked correctly
- Container sizing: bounding box computed correctly, padding applied, written to canvasData
- Cross-container edges: positions reference entities in different sub-graphs

---

## Phase 2 — sortOrder-Based Constraints

### Problem

Children within a container appear in dagre-determined order (topology-based), which is often wrong. The canonical order is stored in `contains` edge `sortOrder` fields. For example, chapters might appear in creation order rather than chapter order.

### Solution

Feed dagre's `constraints` option with sibling ordering. For each pair of adjacent siblings (sorted by `sortOrder`), add a constraint telling dagre to place the earlier sibling before the later one at the same rank.

```
for each adjacent pair (a, b) in siblingsBySortOrder:
    constraint = { type: LEFT_TO_RIGHT, left: a.id, right: b.id }   // TB rankdir
    constraint = { type: TOP_TO_BOTTOM,   top: a.id, bottom: b.id } // LR rankdir
```

The constraint axis depends on `rankdir`:
- `TB` → `LEFT_TO_RIGHT` (siblings go left-to-right within a rank)
- `LR` → `TOP_TO_BOTTOM` (siblings go top-to-bottom within a rank)

### Acceptance Criteria

- **AC7:** Children within a container appear in the order specified by their `contains` edge `sortOrder`.
- **AC8:** Unrelated entities (no `contains` edge connecting them) are unaffected by constraints.
- **AC9:** Constraint axis matches `rankdir`: `LEFT_TO_RIGHT` for `TB`, `TOP_TO_BOTTOM` for `LR`.
- **AC10:** When `sortOrder` is equal between two edges, order is undefined but must not throw (warning logged).

### Files Changed

| File | Change |
|------|--------|
| `src/engine/layout.ts` | Add constraints building in `runSubDagre` |
| `src/engine/layout.test.ts` | Tests for constraint building, edge cases |

### Tests

- Constraint building for TB rankdir: verify `{ left: a, right: b }` pairs
- Constraint building for LR rankdir: verify `{ top: a, bottom: b }` pairs
- Equal sortOrder: no constraint generated (warning logged)
- Single child: no constraints generated

---

## Phase 3 — Mixed Direction Layout (TB + LR)

### Problem

A global `rankdir` doesn't reflect real document structure. Root nodes (authors) might work best in a row (LR), while books under authors should stack vertically (TB), and book contents might fan out horizontally (LR) again.

### Solution

Support `rankdir` per container instead of one global setting. Pass a `rankdir` parameter to `runSubDagre`. For v1, use a simple heuristic:

| Nesting depth | Direction | Rationale |
|---------------|-----------|-----------|
| 0 (root) | LR | Authors in a row |
| 1 | TB | Books stacked under authors |
| 2 | LR | Content/notes/synopsis side by side |
| 3+ | TB | Acts, scenes, segments stacked |

Later, this can be replaced with an explicit `metadata.layoutDirection: "TB" | "LR"` on containers.

### Acceptance Criteria

- **AC11:** Each sub-dagre run uses its own `rankdir` determined by nesting depth.
- **AC12:** Root-level entities are laid out in LR direction.
- **AC13:** Depth 1 containers use TB direction.
- **AC14:** Depth 2 entities use LR direction.
- **AC15:** Depth 3+ entities use TB direction.
- **AC16:** The global `rankdir` option in the Canvas Layout section controls root-level direction only.

### Files Changed

| File | Change |
|------|--------|
| `src/engine/layout.ts` | Pass `rankdir` per sub-dagre call based on nesting depth |

---

## Phase 4 — Debounced Auto-Layout on Option Change

### Problem

Users must click "Run Layout" after every option change. For rapid iteration (tweaking `nodesep`, then `ranksep`, then `nodeWidth`), this is tedious.

### Solution

When the reactive dagre sync is ON and the user changes any layout option, debounce a full re-layout by 300ms. The debounce resets on each subsequent change. The layout function called is the reactive sync (respects saved positions), not `runFullLayout`.

### Acceptance Criteria

- **AC17:** Changing any layout option triggers a debounced re-layout (300ms).
- **AC18:** Rapid changes (e.g., dragging a slider) only trigger one re-layout after the user stops.
- **AC19:** The debounce does NOT apply to the "Run Layout" button — it runs immediately.
- **AC20:** If `autoLayout` is toggled OFF while a debounce is pending, the pending layout is cancelled.

### Files Changed

| File | Change |
|------|--------|
| `src/canvas/panels/sections/CanvasLayoutSectionContainer.tsx` | Add `useEffect` with debounce on layout options; call reactive layout (not `runFullLayout`) |

### Stories

- Story with `onChange` spy: verify debounce timing
- Story with rapid option changes: verify only one call after debounce settles

---

## Dependencies & Execution Order

| Phase | Depends on | Can be done in parallel with |
|-------|-----------|------------------------------|
| 1 (sub-dagre + container sizing) | PRD 0063 (segment auto-height) | — |
| 2 (sortOrder constraints) | Phase 1 (sub-dagre) | Phase 4 |
| 3 (mixed directions) | Phase 1 (sub-dagre) | Phase 2, Phase 4 |
| 4 (debounced re-layout) | — | Phase 2, Phase 3 |

Recommended order: PRD 0063 first → Phase 1 → Phase 2 + Phase 4 (parallel) → Phase 3.

Phase 4 is the only independent piece — it's a UI-only change with no layout engine modifications and could be done at any point.

## Notes

- Cross-container edges in sub-dagre (Phase 1) are the trickiest part — edges reference entities in different sub-graphs, and dagre must route them across the boundary. These edges need to be laid out in the parent-level dagre pass, not the child's sub-dagre.
- The bottom-up algorithm ensures nested containers are sized before their parents: a3's segments → a3 sized → a2's children (including sized a3) laid out → a2 sized → a1's children laid out → a1 sized.
- `computeContainerBounds` must account for the container's own header height (title bar) in addition to child bounds + padding.
