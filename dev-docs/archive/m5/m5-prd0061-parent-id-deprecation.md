> **Completion note (2026-06-03):**
> - **What was built:** Removed `parentId` from Entity data model. All parentage via `contains` edges. Migration script created and run. Store/engine/canvas updated. Geography leaf nodes promoted to `container`. Tech Stack group hierarchy fixed.
> - **Key decisions:** Standalone migration script (not in-app). Non-container parents promoted without `metadata.groupType`. `deleteEntity` cascade reads `deletedEntity` from the `set` callback's state parameter (`s`) rather than from a pre-captured `get()` call, preventing stale references.
> - **Deviations from plan:** The plan specified `concept-7` (vite) as promoted to `container` with `metadata.groupType: "stack-group"`. In practice, the `concept-7 → concept-1` contains edge was incorrect (reversed parentage) — removed the edge and demoted `concept-7` back to `concept`. Geography leaves (`city--stratford-upon-avon`, `place--kronborg-castle`, `city--athens`) were initially left as `concept` but later promoted to `container` to match the geography `contains` chain pattern.
> - **Postponed:** None.

# PRD: Deprecate `parentId` — Single Source of Parentage via `contains` Edges

## Overview

The graph model has two redundant mechanisms for parent-child relationships:

1. `entity.parentId` — a field directly on the Entity type
2. `contains` relations — edges in the relations array with `type: "contains"` and `sortOrder`

Both are kept in sync by the store, but they diverge in practice (`hello2/graph.json` has entities with `parentId` and no matching `contains` edge, and vice versa). This PRD removes `parentId` from the data model entirely. All parentage is expressed solely through `contains` edges, with `parentId` derived at the React Flow boundary via a query selector.

A side effect: entities that have child `contains` edges but are not `type: container` must be promoted to `container`, since React Flow requires the parent node type to be a group node. This affects geography nodes and structural summary groups.

```
                     load                    write
                ┌──────────┐           ┌──────────┐
                ▼          │           │          ▼
┌──────────────────────────┼───────────┼──────────────────────────┐
│  Graph JSON              │           │                          │
│  • entities: no parentId │           │  (unchanged — persists   │
│  • relations: contains   │           │   entities + relations,  │
│    edges with sortOrder  │           │   no parentId involved)  │
└──────────────────────────┼───────────┼──────────────────────────┘
                           │           │
                           ▼           ▲
┌──────────────────────────────────────────────────────────────────┐
│  Zustand Store (indexed layer)                                   │
│  • entities[]: as-is from JSON                                   │
│  • relations[]: as-is from JSON                                  │
│  • query function:                                               │
│    getParentId(entityId) →                                       │
│      find contains edge where                                    │
│      target === entityId, return edge.source                     │
└─────────────────────┬────────────────────────────────────────────┘
           │ read                        ▲ write
           ▼                             │
┌─────────────────────┐    ┌──────────────────────────────────────────┐
│  React Flow         │    │  Store Actions (write path)             │
│  Canvas             │    │                                         │
│  • node.parentId    │    │  • onNodeDragStop: addRelation(         │
│    = derived from   │    │      parent, child, "contains")         │
│    getParentId()    │    │    (was: updateEntity parentId)         │
│  • node.extent      │    │                                         │
│    = "parent"       │    │  • "Detach from Group":                 │
│                     │    │      removeRelation(contains-edge)      │
│                     │    │    (was: updateEntity parentId=undef)   │
│                     │    │                                         │
│                     │    │  • addEntity(type, data, parentId?):    │
│                     │    │      parentId param → contains edge     │
│                     │    │    (was: store parentId on entity)      │
│                     │    │                                         │
│                     │    │  • deleteEntity cascade: reparent       │
│                     │    │      via contains edges                 │
│                     │    │    (was: clear parentId on children)    │
└─────────────────────┘    └──────────────────────────────────────────┘
```

---

## Motivation

- **Single source of truth**: Two representations for the same relationship are a proven source of drift. `contains` edges are already the canonical representation (used by the query engine, drag-to-nest actions, and persistence). `parentId` is a cached duplicate.
- **Sort order lives on edges**: The `sortOrder` field on `contains` edges determines child ordering. `parentId` has no ordering information, making it strictly inferior.
- **React Flow boundary responsibility**: `parentId` is only needed by React Flow's nesting model. Deriving it from edges keeps the store clean and the dependency explicit.
- **Simpler data model**: Removing `parentId` from `Entity` eliminates a field that is `undefined` for most entities and is a source of branching in every entity-processing loop.

## Migration — `hello2/graph.json` and `seed.ts`

### Promote non-container parents to `container`

These entities currently have outgoing `contains` edges but are NOT `type: container`. They must become containers so React Flow renders them as group nodes:

| Id | Current type | New type | Preserved in metadata |
|---|---|---|---|
| `concept-1` (Tech Stack) | `summary` | `container` | `metadata.groupType: "summary"` |
| `concept-7` (vite) | `concept` | `container` | `metadata.groupType: "stack-group"` |
| `country--united-kingdom` | `concept` | `container` | `metadata.geoType: "country"` (already exists) |
| `state--england` | `concept` | `container` | `metadata.geoType: "state"` (already exists) |
| `county--warwickshire` | `concept` | `container` | `metadata.geoType: "county"` (already exists) |
| `country--denmark` | `concept` | `container` | `metadata.geoType: "country"` (already exists) |
| `region--capital` | `concept` | `container` | `metadata.geoType: "region"` (already exists) |
| `city--helsingor` | `concept` | `container` | `metadata.geoType: "city"` (already exists) |
| `country--greece` | `concept` | `container` | `metadata.geoType: "country"` (already exists) |

These entities stay as-is (they have no outgoing `contains` edges):

| Id | Type | Reason |
|---|---|---|
| `concept-2..concept-8` (react, typescript, etc.) | `concept` | Children, not parents |
| `type--book`, `type--author`, `gender--male`, etc. | `concept` | Leaf classification nodes |
| `city--stratford-upon-avon`, `city--athens`, `place--kronborg-castle` | `concept` | Geography leaf nodes (no children) |
| All `segment` entities | `segment` | Content leaves |

### Remove `parentId` from all entities

Some entities in `hello2/graph.json` still carry `parentId`:

| Entity | Has `contains` edge? | Migration action |
|---|---|---|
| `hamlet--shakespeare--a1s1-001` | Yes (`r_1780260000300`) | Delete `parentId` |
| `hamlet--shakespeare--a1s1-002` | Yes (`r_1780260000301`) | Delete `parentId` |
| `doc_1780257825446_seg-0001` | **No** | Create `contains` edge, delete `parentId` |
| `doc_1780257825446_container` | **No** | Create `contains` edge, delete `parentId` |

### Migration script

```ts
// scripts/migrate-remove-parentId.ts
// Reads a graph.json, performs the above transformations,
// writes graph.json back. Idempotent — safe to re-run.
```

---

## Specification / Acceptance Criteria

### AC1: `parentId` removed from `Entity` type

- `src/types/graph.ts`: Remove `parentId?: string` from the `Entity` type
- All code that reads or writes `entity.parentId` must be updated (see Files Changed)

### AC2: `getParentId()` query function added

```ts
// In src/engine/queries.ts
export function getParentId(state: GraphState, entityId: string): string | undefined {
  return state.relations.find(
    (r) => r.target === entityId && r.type === "contains",
  )?.source
}
```

Also add `getChildIds(state, parentId): string[]` (returns sorted child IDs for a parent — useful for the sibling-width logic in `layout.ts`).

### AC3: React Flow node builder derives `parentId` from edges

In `GraphCanvas.tsx`, all three node-build sites (initial `layoutRef`, sync update, sync new-node) replace `entity.parentId` with `getParentId(storeState, entity.id)`.

### AC4: Drag-to-nest creates `contains` edges, not `parentId`

The `onNodeDragStop` handler currently calls:

```ts
s.updateEntity(node.id, { parentId: container.id })
```

This must become:

```ts
const s = useGraphStore.getState()
// Remove old contains edge if moving from another parent
const oldParentRel = state.relations.find(
  (r) => r.target === node.id && r.type === "contains"
)
if (oldParentRel) s.removeRelation(oldParentRel.id)
// Create new contains edge
s.addRelation(container.id, node.id, "contains", { sortOrder: generateKeyBetween(null, null) })
```

### AC5: "Detach from Group" removes the `contains` edge

The context menu action currently sets `parentId: undefined`. Must become "find and delete the `contains` edge targeting this entity".

### AC6: Store `addEntity` creates `contains` edge instead of setting `parentId`

The `addEntity` signature changes from:

```ts
addEntity(type, data?, parentId?)  // stores parentId on entity
```

The `parentId` parameter is removed. Instead, the caller creates the entity first, then calls `appendChild(containerId, childId)` to establish the parentage. Or the function creates the `contains` edge internally if `parentId` is passed.

Decision: **Keep the `parentId` parameter on `addEntity` as syntactic sugar**, but internally convert it to a `contains` edge instead of storing it on the entity. This minimizes call-site churn. However, the parameter must be typed as `parentId?: string` (not stored) with a JSDoc note that it creates a `contains` edge.

### AC7: `getContainerChildren` recursion filter updated

```ts
// queries.ts line 55
if (child.type === "container" && depth > 0)
```

This hardcodes `type === "container"` as the only parent type. After the promotion of geography nodes to containers, this becomes correct for all cases. However, the guard should be more robust — check for outgoing `contains` edges instead of entity type:

```ts
function hasChildren(state: GraphState, entityId: string): boolean {
  return state.relations.some((r) => r.source === entityId && r.type === "contains")
}
```

This way any entity type can be a parent (even if we don't currently use that), and the recursion condition is about graph structure, not arbitrary type labels.

### AC8: `getRootContainers` uses edges, not type

Currently:

```ts
state.entities.filter((e) => e.type === "container" && !childIds.has(e.id))
```

After geography nodes become containers, this returns them as root containers (correct — `country--united-kingdom` has no parent). No change needed.

### AC9: `getNestingDepth` and `wouldCreateCycle` use `contains` edges

Both in `queries.ts` currently walk `entity.parentId`. Must walk `contains` edges upward instead:

```ts
export function getNestingDepth(state: GraphState, entityId: string): number {
  let depth = 0
  let current = entityId
  for (let i = 0; i < 100; i++) {
    const parentRel = state.relations.find(
      (r) => r.target === current && r.type === "contains"
    )
    if (!parentRel) break
    depth++
    current = parentRel.source
  }
  return depth
}
```

### AC10: `layout.ts` reads parentage from edges

The sibling-width grouping code in `layout.ts` currently uses `entity.parentId`. Must use `getChildIds()` or a direct `contains` edge lookup.

### AC11: Seed data updated

`src/data/seed.ts` must:
- Remove all `parentId` fields
- Use `contains` edges for all parent-child relationships
- Promote any remaining non-container parents to `container`

### AC12: Data migration run on seed + existing workspaces

When the app loads a v5 snapshot, the migration script is applied:
- Any entity with `parentId` → create `contains` edge if missing, delete `parentId`
- Any entity with outgoing `contains` edges and type != `container` → set `type: container`, preserve old type in `metadata.previousType` or `metadata.groupType`

---

## What does NOT change

- **Graph JSON schema** — `parentId` is removed from entities. `contains` edges were already present. Version stays at 5 (or bumps to 6 if the change is considered breaking for third-party consumers).
- **Store shape** — `entities[]` and `relations[]` stay. `parentId` is simply not written anymore.
- **Store actions** — `appendChild`, `insertChild`, `moveChild`, `backfillContainerOrder` already work with `contains` edges. They do not need changes.
- **Persistence layer** — reads/writes entities and relations. No `parentId` involvement.
- **Undo/redo** — batch operations still work; the undo stack records relation adds/removes as before.
- **Query engine functions that don't touch parentId** — `getEntity`, `getRelations`, `getLinkedContext`, `getContainerBreadcrumb`, `resolveContainer`, `getRelationTypes` are all unaffected.

---

## Files Changed

| File | Change |
|---|---|
| `src/types/graph.ts` | Remove `parentId?: string` from `Entity` type |
| `src/engine/queries.ts` | Add `getParentId`, `getChildIds`, `hasChildren`. Rewrite `getNestingDepth` and `wouldCreateCycle` to use `contains` edges. Update `getContainerChildren` recursion guard. |
| `src/canvas/GraphCanvas.tsx` | All 3 node-build sites: derive parentId from `getParentId` selector. `onNodeDragStop`: create `contains` edge instead of `parentId`. "Detach from Group": delete `contains` edge instead of `parentId: undefined`. |
| `src/store/useGraphStore.ts` | `addEntity`: convert `parentId` param to `contains` edge internally. `updateEntity`: remove `parentId` write path. `deleteEntity`: cascade uses `contains` edges. Remove cycle detection against `parentId`. |
| `src/engine/layout.ts` | Sibling-width grouping: use `getChildIds` instead of `entity.parentId`. Node builder within dagre: derive `parentId` from edges. |
| `src/engine/ids.ts` | Remove `parentId` from `generateEntityId` / `generateUniqueId` signatures (or keep as informational, not stored on entity). |
| `src/data/seed.ts` | Remove `parentId` from seed entities. Ensure all parent-child relationships use `contains` edges. Promote non-container parents to `container` with `metadata.groupType`. |
| `src/store/nesting.test.ts` | Rewrite all tests to use `contains` edges instead of `parentId`. Test cycle detection via edge walk. Test cascade delete via edge walk. |

---

## Tests

### `src/store/nesting.test.ts` — rewrite existing

| Current test | New behavior |
|---|---|
| `addEntity with parentId` | `addEntity` with parentId → entity has no `parentId`, but a `contains` edge exists |
| `drag container into container` | `updateEntity` does NOT set parentId; instead, store action creates `contains` edge |
| `detach child container` | Dettach deletes the `contains` edge instead of clearing `parentId` |
| `delete parent cascade` | Delete finds all entities targeted by `contains` edges from the deleted entity → reparents their `contains` edges |
| `undo drag-to-nest` | Undo restores old `contains` edge (same as before — undo stack handles relations) |
| `wouldCreateCycle` | Walks `contains` edges upward instead of `parentId` |
| `getNestingDepth` | Walks `contains` edges, ignores `parentId` |

### `src/engine/queries.test.ts` — new tests

| Test | What it verifies |
|---|---|
| `getParentId finds contains edge` | Entity with `contains` target edge → returns source |
| `getParentId no parent` | Entity with no incoming `contains` → returns `undefined` |
| `getChildIds returns sorted` | Parent with multiple children → returns sorted by `sortOrder` |
| `hasChildren positive/negative` | Entity with/without outgoing `contains` edges |

### Regression tests

| Test | What it verifies |
|---|---|
| Load `hello2/graph.json` | All entities load without `parentId`. Geography nodes are `container`. `contains` edges exist for all parent-child relationships. |
| Drag-to-nest | Creates `contains` edge in store. React Flow renders with correct nesting. |
| Detach | Deletes `contains` edge. React Flow renders at correct absolute position. |
| Layout (dagre) | Dagre arranges nested containers correctly. Sibling-width grouping works via edges. |

---

## Size Advisory

Medium-large — ~7 files, moderate complexity. The migration script and test rewrites are the bulk of the work. The code changes are mechanical (replace `parentId` read with `getParentId()`, replace `parentId` write with edge operation).

---

## Manual Test Checklist

- [ ] Load `hello2/graph.json` — all entities render, no missing nodes, no console errors
- [ ] Geography chain (UK → England → Warwickshire → Stratford) renders as nested containers
- [ ] Geography chain (Denmark → Capital → Helsingør → Kronborg) renders as nested containers
- [ ] Geography chain (Greece → Athens) renders as nested containers
- [ ] Tech Stack group (vite → Tech Stack → [react, typescript, ...]) renders as nested containers
- [ ] Hamlet content hierarchy (Hamlet → Content → Act 1 → Scene 1 → line segments) renders correctly
- [ ] Dev-docs hierarchy (Dev Docs → ID Conventions → segment children) renders correctly
- [ ] Drag-to-nest creates a `contains` edge, no `parentId` written
- [ ] Drag-to-nest is undoable (Cmd+Z)
- [ ] Detach from Group deletes the `contains` edge, restores absolute position
- [ ] Detach is undoable
- [ ] Create new container via "New Group" — no `parentId` set, no `contains` edge created
- [ ] Create child node via double-click inside container — `contains` edge created
- [ ] Delete parent container — children reparented via `contains` edge deletion
- [ ] Delete cascade is undoable
- [ ] Dagre auto-layout works with nested containers (all types)
- [ ] Export graph.json from FS Access — no `parentId` in any entity
- [ ] Reload page — nesting preserved
