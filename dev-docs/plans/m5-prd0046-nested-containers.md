# PRD0046 — Nested Containers (containers within containers)

## Overview

Containers (entity type `"container"`) currently render as visual group nodes, but they cannot be nested inside other containers. This PRD extends the `parentId` infrastructure from PRD0045 to allow containers to be children of other containers — the same drag-to-assign, double-click-to-create, and context-menu mechanics that apply to entity nodes also apply to containers. Circular nesting is prevented. Visual depth treatment deferred to a later design pass.

This is the next immediate dependency for Threaded Container View (PRD0047) and Contextual Subgraph Loading (PRD0044), both of which expect a multi-level container hierarchy.

---

## Specification / Acceptance Criteria

### User Stories

#### US1: Create a child container via context menu
- Right-click an existing container node → context menu shows **"Add Child Container"** (in addition to the existing "Add Child Node")
- Clicking it creates a new entity with `type: "container"` and `parentId` set to the clicked container
- The new container opens with the inline title editor auto-focused
- Initial position snapped to grid, centered in the parent's child area (or at a default offset)

#### US2: Drag a container into another container to nest it
- Dragging an existing `"container"` type node over another `"container"` group node assigns `parentId` (same `onNodeDragStop` logic as entity→container drag from PRD0045)
- Position is converted from absolute canvas coordinates to relative-to-parent
- The child container's nodes (its own children) move with it (React Flow native)
- On drop, the store records the operation as a single undo batch entry

#### US3: Detach a child container from its parent
- Right-click a child container → context menu shows **"Detach from Group"**
- Converting clears `parentId` and converts the container's position from relative-to-parent to absolute canvas coordinates
- The container's own children retain their relative positions and remain nested inside it

#### US4: Create a new container as a root (no parent)
- "New Group" from the pane context menu still creates a root-level container (no `parentId`)
- No behavioral change — must continue to work after this PRD

#### US5: Edges between containers
- Edges can be created between any two containers (same parent, different parents, or one nested inside the other) — same `onConnect` mechanics as entity nodes
- Edges between containers render across the canvas; React Flow handles routing across sub-flow boundaries natively

#### US6: Edges from containers to entity nodes
- Already supported by PRD0045 — must not regress

### Edge Cases

- **Circular nesting prevention:** Dragging container A over container B must detect whether A is an ancestor of B (walk up `parentId` chain). If a cycle would form, the drop is rejected (no `parentId` set, node snaps back to original position).
- **Self-nesting:** A container cannot be dropped onto itself.
- **No depth limit:** Containers may nest arbitrarily deep with no enforced maximum.
- **Resize constraint:** Child containers use `extent: 'parent'` to prevent being resized or dragged beyond parent bounds (already applied to entity children from PRD0045).
- **Delete cascade:** When a parent container is deleted, its child containers are reparented (same `deleteEntity` cascade logic as PRD0045 — `parentId` cleared, position converted to absolute). Child containers retain their own children.
- **Undo/redo:** Drag-to-nest and detach must produce single undo entries. Delete cascade must be undoable (wrapped via existing `beginBatch`/`endBatch`).
- **Grid snapping:** Child container positions (x, y) are relative to parent and must snap to the 16px grid via existing `snap16` / `snapCanvasDim`.
- **Empty parent deletion:** Deleting a container that has no children — no cascade, safe to delete. Verified.

### What this PRD does NOT do

- **Sub-Dagre layout pass** — deferred (Dagre remains disabled). Node positions are store-authoritative.
- **Pane double-click "New Group"** — deferred (only "New Node" from pane). See PRD0045.
- **`getContainerChildren` via `parentId`** — the query engine still uses `contains` relations for tree operations, not the `parentId` field. That's a separate refactor.
- **Group-to-entity child conversion** — converting a container to a non-container type. Not in scope.

---

## Files Changed (inferred)

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | Extend `onNodeDragStop` to handle container→container drag (same logic as entity→container). Extend `onNodesDelete`. Add "Add Child Container" to context menu. Extend double-click handler for nested container child creation. Add cycle detection utility. |
| `src/canvas/nodes/ContainerGroupNode.tsx` | No visual changes — same styling at all nesting depths. Update inline editing to work at any nesting level. |
| `src/store/useGraphStore.ts` | Add `parentId` cycle detection in `updateEntity`. Ensure cascade delete handles child containers (already does via `parentId` check). Add undo batch wrapping for nesting operations. |
| `src/types/graph.ts` | No schema changes — `parentId` already on `Entity`. |

### Visual Design

- No visual depth differentiation. Child containers render with the same styling as root containers. Visual depth treatment deferred to a future design pass.
- Child containers sit inside the parent's child area with no extra padding, border, or tint over the parent's existing `hsl(var(--accent) / 0.15)` background.

### Cycle Detection Algorithm

```ts
function wouldCreateCycle(entities: Entity[], childId: string, newParentId: string): boolean {
  if (childId === newParentId) return true; // self-nesting
  let current = newParentId;
  const visited = new Set<string>();
  while (current) {
    if (current === childId) return true; // ancestor would become descendant
    visited.add(current);
    const entity = entities.find((e) => e.id === current);
    current = entity?.parentId ?? '';
  }
  return false;
}
```

---

## Automated Tests (vitest)

### `src/store/useGraphStore.test.ts` or new `src/store/nesting.test.ts`

| Test | What it verifies |
|------|------------------|
| `addEntity with parentId` | Creating a container with `parentId` → entity has correct `parentId`, `parentId` stored on entity |
| `drag container into container` | `updateEntity` with new `parentId` → entity's `parentId` updated, position converted to relative |
| `detach child container` | `updateEntity` clearing `parentId` → `parentId` removed, position converted to absolute |
| `delete parent cascade` | `deleteEntity` on parent → child containers get `parentId: undefined`, absolute position |
| `delete parent with nested children` | Parent has child containers, child containers have their own children → all depths reparented correctly |
| `empty parent deletion` | Deleting a container with no children → no cascade, no side effects |
| `undo drag-to-nest` | After drag-nest, undo restores old `parentId` and position |
| `undo detach` | After detach, undo restores `parentId` and relative position |
| `undo delete parent` | After parent delete+reparent, undo restores parent and all child parentIds |

### `src/engine/queries.test.ts` — new tests

| Test | What it verifies |
|------|------------------|
| `wouldCreateCycle self-nest` | `wouldCreateCycle(entities, "A", "A")` → `true` |
| `wouldCreateCycle direct child` | `wouldCreateCycle(entities, "A", "B")` where B is A's child → `true` |
| `wouldCreateCycle ancestor` | `wouldCreateCycle(entities, "A", "D")` where chain is A→B→C→D → `true` |
| `wouldCreateCycle unrelated` | `wouldCreateCycle(entities, "A", "Z")` where no relation → `false` |
| `wouldCreateCycle sibling` | `wouldCreateCycle(entities, "A", "B")` where both are root → `false` |

### `src/canvas/GraphCanvas.test.tsx` — consider but low priority

Canvas interaction tests (drag handling, context menu actions) are integration tests that require jsdom + React Flow rendering. Defer until component testing infrastructure is established.

---

## Manual Test Checklist

Perform each test in order. Mark pass/fail and note any unexpected behavior.

### US1: Create a child container via context menu

- [ ] Right-click a root container → context menu shows **"Add Child Container"**
- [ ] Clicking it creates a new container node inside the parent
- [ ] New container opens with inline title editor auto-focused
- [ ] New container's position snaps to grid within parent bounds
- [ ] Right-click a deeply nested container (depth 3) → "Add Child Container" works
- [ ] Right-click an entity node (non-container) → context menu does NOT show "Add Child Container"

### US2: Drag a container into another container

- [ ] Drag an existing root container onto another root container → drops as child (parentId assigned)
- [ ] Child container's children move with it (React Flow native)
- [ ] Position converts from absolute to relative correctly
- [ ] Undo (Cmd+Z) restores the container to its original position with original parentId
- [ ] Redo (Cmd+Shift+Z) re-applies the nesting
- [ ] Dragging a child container onto a sibling → reparents to the sibling

### US3: Detach a child container from its parent

- [ ] Right-click a child container → context menu shows "Detach from Group"
- [ ] Clicking it clears parentId and converts position to absolute
- [ ] The container's own children remain nested inside it
- [ ] The container appears at the correct absolute position (no visual jump)
- [ ] Undo restores the original parentId and relative position

### US4: Create a root container (no parent)

- [ ] "New Group" from pane context menu creates a root-level container with no parentId
- [ ] New Group button (Panel) creates a root-level container with no parentId

### US5: Edges between containers

- [ ] Drag from container A's handle to container B's handle → edge created
- [ ] Edge between containers in the same parent renders correctly
- [ ] Edge between containers in different parents renders across parent boundaries
- [ ] Edge between a container and an entity node inside a different parent renders correctly
- [ ] Edge reconnects correctly on reload (sourceHandle/targetHandle preserved)

### Edge Cases

- [ ] **Self-nesting rejected:** Attempt to drag a container onto itself → snap back, no parentId change
- [ ] **Cycle detection:** Drag container A into container B, then B into A → B's drag into A rejected (snap back)
- [ ] **Cycle detection (deep):** A→B→C→D exists. Drag D into A → rejected (snap back)
- [ ] **Depth limit:** Create A → B inside A → C inside B → D inside C → E inside D → E creation or drag rejected
- [ ] **Resize constraint:** Child container cannot be resized beyond parent bounds (extent: 'parent')
- [ ] **Drag constraint:** Child container cannot be dragged outside parent bounds (extent: 'parent')
- [ ] **Delete container with children:** Delete parent → children reparented to root, positions correct
- [ ] **Delete deeply nested:** Delete grandparent → children and grandchildren reparented, positions correct
- [ ] **Grid snap:** All nested positions snap to 16px grid (both creation and drag)
- [ ] **Persistence:** Create nested containers, reload page → nesting preserved
- [ ] **Undo cascade delete:** Delete parent with children → Cmd+Z restores everything
- [ ] **Select + delete multiple:** Select parent + child containers → Delete → both deleted, cascade handled

## Size Advisory

Moderate scope — ~4 files, single pass.
