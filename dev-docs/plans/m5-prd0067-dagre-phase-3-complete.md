# PRD 0067: Dagre Phase 3 — Full Container Pipeline (Deferred from PRD 0064)

## Overview

PRD 0064 implemented a focused, manually-triggered layout for one container's children. This PRD completes the original Phase 1 vision by making the layout automatic, bottom-up, and multi-level. It also adds sortOrder constraints, mixed direction support, and debounced auto-re-layout.

This PRD is deferred — PRD 0064 ships first, then this one.

## Scope

Five independent additions, ordered by dependency:

1. **Bottom-up sub-dagre for all containers** — extend the per-container layout from PRD 0064 to run bottom-up across the entire nesting tree. Inner containers are sized first, then their parents, all the way to root containers. Root-level entities (no parent) get a top-level dagre pass.
2. **Cross-container edge routing** — edges that connect entities in different sub-graphs (e.g. a note in container A referencing a concept in container B) are routed in the parent-level dagre pass, not in the child's sub-dagre.
3. **sortOrder-based constraints** — feed dagre `constraints` with sibling `sortOrder` so children appear in the correct sequence (e.g. chapters in reading order).
4. **Mixed direction layout** — support `TB` and `LR` per container, determined by nesting depth via a heuristic table. Later, explicit `metadata.layoutDirection` can override.
5. **Debounced auto-layout on option change** — re-run the reactive layout 300ms after the user stops adjusting layout options.

## Phase 1 — Bottom-Up Sub-Dagre + Cross-Container Edges

### Problem

PRD 0064's `layoutContainerChildren` only handles one container at a time, manually triggered. There is no automatic layout pass that:
- Walks all containers bottom-up
- Sizes nested containers before their parents
- Routes cross-container edges correctly

### Solution

Add a `layoutAllContainers()` function that:

1. Build a nesting tree from all `contains` edges: `buildNestingTree(entities, relations): Map<string, Entity[]>` — maps container ID to its direct children.
2. Topologically sort containers bottom-up (leaves first).
3. For each container, call the existing `layoutContainerChildren` (or its extracted core) — this handles child positioning + container sizing.
4. After all containers are sized, run a top-level dagre pass for root entities (containers with no parent).
5. Cross-container edges: during the top-level pass, edges whose source and target are in different sub-graphs are included so dagre routes them across the boundary.

### Acceptance Criteria

- **AC1:** `buildNestingTree` correctly maps container IDs to their direct children.
- **AC2:** Bottom-up traversal processes leaf containers before their parents.
- **AC3:** Nested containers (container inside container) are sized correctly — grandchild dimensions propagate to child container, then to parent.
- **AC4:** Root-level entities (no parent) get a top-level dagre pass and are not interleaved with container children.
- **AC5:** Cross-container edges are excluded from sub-dagre runs and included in the top-level pass.
- **AC6:** Existing PRD 0064 "Layout Children" context menu still works and runs the standalone function for the selected container only (not the full pipeline).

### Files Changed

| File | Change |
|------|--------|
| `src/engine/layout.ts` | Add `buildNestingTree`, `layoutAllContainers`; extract core from `layoutContainerChildren` for reuse |
| `src/engine/layout.test.ts` | Tests for nesting tree, bottom-up order, nested container sizing, cross-container edges |

---

## Phase 2 — sortOrder-Based Constraints

### Problem

Children within a container appear in dagre-determined order (topology-based), which is often wrong. The canonical order is stored in `contains` edge `sortOrder` fields.

### Solution

Feed dagre's `constraints` option with sibling ordering. For each pair of adjacent siblings (sorted by `sortOrder`), add a constraint telling dagre to place the earlier sibling before the later one at the same rank.

```
for each adjacent pair (a, b) in siblingsBySortOrder:
    constraint = { type: LEFT_TO_RIGHT, left: a.id, right: b.id }   // TB rankdir
```

TB is the only direction in scope (PRD 0064 is TB-only). When LR is added (Phase 3), the constraint axis changes to `TOP_TO_BOTTOM`.

### Acceptance Criteria

- **AC7:** Children within a container appear in the order specified by their `contains` edge `sortOrder`.
- **AC8:** Unrelated entities (no `contains` edge connecting them) are unaffected by constraints.
- **AC9:** When `sortOrder` is equal between two edges, order is undefined but must not throw (warning logged).
- **AC10:** Only the first PRD 0064 `layoutContainerChildren` call is constrained — the change is internal to the dagre graph setup.

### Files Changed

| File | Change |
|------|--------|
| `src/engine/layout.ts` | Add constraint building in the core layout function shared by both `layoutContainerChildren` and `layoutAllContainers` |
| `src/engine/layout.test.ts` | Tests for constraint building, edge cases |

---

## Phase 3 — Mixed Direction Layout (TB + LR)

### Problem

A global rankdir doesn't reflect real document structure. Root nodes (authors) work best in a row (LR), books under authors stack vertically (TB), book contents fan out horizontally (LR) again.

### Solution

Support `rankdir` per container. Pass a `rankdir` parameter to the core layout function. For v1, use a heuristic based on nesting depth:

| Nesting depth | Direction | Rationale |
|---------------|-----------|-----------|
| 0 (root) | LR | Authors in a row |
| 1 | TB | Books stacked under authors |
| 2 | LR | Content/notes/synopsis side by side |
| 3+ | TB | Acts, scenes, segments stacked |

Later, this can be replaced with an explicit `metadata.layoutDirection: "TB" | "LR"` on containers.

When called from the context menu (PRD 0064), the direction is always TB. The heuristic only applies when called from `layoutAllContainers`.

### Acceptance Criteria

- **AC11:** Each sub-dagre run uses its own `rankdir` determined by nesting depth.
- **AC12:** Root-level entities are laid out in LR direction.
- **AC13:** Depth 1 containers use TB direction.
- **AC14:** Depth 2 entities use LR direction.
- **AC15:** Depth 3+ entities use TB direction.
- **AC16:** The global `rankdir` option in the Canvas Layout section controls root-level direction only.
- **AC17:** PRD 0064 context menu "Layout Children" remains TB-only regardless of depth.

### Files Changed

| File | Change |
|------|--------|
| `src/engine/layout.ts` | Pass `rankdir` per sub-dagre call based on nesting depth |

---

## Phase 4 — Debounced Auto-Layout on Option Change

### Problem

Users must click "Run Layout" after every option change. For rapid iteration (tweaking `nodesep`, then `ranksep`, then `nodeWidth`), this is tedious.

### Solution

When `autoLayout` is ON and the user changes any layout option, debounce a full re-layout by 300ms. The debounce resets on each subsequent change. Call `layoutAllContainers` (not `runFullLayout`) so the layout respects container boundaries.

### Acceptance Criteria

- **AC18:** Changing any layout option triggers a debounced re-layout (300ms).
- **AC19:** Rapid changes (e.g., dragging a slider) only trigger one re-layout after the user stops.
- **AC20:** The debounce does NOT apply to the "Run Layout" button — it runs immediately.
- **AC21:** If `autoLayout` is toggled OFF while a debounce is pending, the pending layout is cancelled.
- **AC22:** PRD 0064's context menu "Layout Children" is unaffected by debounce — it always runs immediately.

### Files Changed

| File | Change |
|------|--------|
| `src/canvas/panels/sections/CanvasLayoutSectionContainer.tsx` | Add `useEffect` with debounce on layout options; call `layoutAllContainers` |

---

## Execution Order

| Phase | Depends on | Can be parallel |
|-------|-----------|-----------------|
| 1 (bottom-up + cross-container) | PRD 0064 | — |
| 2 (sortOrder constraints) | Phase 1 | Phase 4 |
| 3 (mixed directions) | Phase 1 | Phase 2, Phase 4 |
| 4 (debounce) | — | Phase 2, Phase 3 |

Recommended order: Phase 1 → Phase 2 + Phase 4 (parallel) → Phase 3.

Phase 4 is the only independent piece — UI-only, no layout engine changes. Could be done at any time after PRD 0064.
