# m5-prd0057: Sort Order & Fractional Indexing

## Overview

Introduce a consistent, documented approach to ordering children within containers using `fractional-indexing-jittered`. The core mechanism — fractional-indexing strings on edges — already exists in the schema (`Relation.sortOrder` in `graph.ts`). This PRD codifies the conventions (previously implicit) and swaps the existing `fractional-indexing` dependency for `fractional-indexing-jittered` to get deterministic, collision-resistant key generation via jitter (random suffix).

Sort order applies universally to **any entity type** under a `contains` edge — containers, segments, concepts, annotations, summaries. There is no type restriction on sortability.

This feature directly enables "Threaded Container View" in the i2 roadmap.

## Specification / Acceptance Criteria

### 1. Dependency swap

`npm uninstall fractional-indexing && npm install fractional-indexing-jittered`

Both packages expose the same API: `generateKeyBetween(a, b)` and `generateNKeysBetween(a, b, count)`. The jittered variant appends a random suffix to each key so concurrent inserts (e.g. from different clients or async editing sessions) never collide.

Update all imports from `fractional-indexing` to `fractional-indexing-jittered`.

### 2. Append to end

When a new child is added to a container via a `contains` edge:

```
generateKeyBetween(lastSiblingKey, null)
```

Returns a string that sorts after every existing sibling.

### 3. Insert between siblings

```
generateKeyBetween(prevKey, nextKey)
```

- `prevKey = null` → inserts before the first sibling.
- `nextKey = null` → inserts after the last sibling.
- Both non-null → inserts strictly between the two neighbors.

### 4. Batch import

When importing N items at once (e.g. 24 lines for Scene 1):

```
generateNKeysBetween(null, null, 24)
```

Returns an array of N evenly-spaced keys. Avoids O(n) key regeneration from sequential single inserts.

### 5. No reindex on delete

When a child is deleted, the entity and its edges are removed. Remaining siblings keep their existing `sortOrder` values. There is never a reindex operation.

### 6. Move within container

Update the `sortOrder` field on the existing `contains` edge to `generateKeyBetween(newPrevKey, newNextKey)`. Same reordering result as delete-and-recreate, but preserves `createdAt` and any other edge metadata. Simpler operation.

### 7. Move across containers

Delete the old `contains` edge from the source container, create a new edge in the target container with its own independent key (append or insert per rules 2–3).

### 8. Universal sort scope

Any entity type placed under a container via a `contains` edge gets a `sortOrder` on that edge. There is no type filtering — containers, segments, annotations, concepts, and summaries all participate in the same sort namespace within a given parent container.

**Sort order is global within a container:** edges of different types interleave under the same parent. A segment at position 1 and a container at position 2 are ordered by their `sortOrder` values, not by type.

### 9. Query order

When querying children of a container, sort by the `sortOrder` field of the `contains` edges, **not** by `createdAt`, `updatedAt`, or array position.

### 10. Route-agnostic store actions

Sort order operations are not tied to any renderer. Shared Zustand store actions provide the canonical interface:

| Action | Behaviour |
|--------|-----------|
| `appendChild(containerId, childId)` | Creates a `contains` edge with `sortOrder = generateKeyBetween(lastSiblingKey, null)` |
| `insertChild(containerId, childId, prevKey, nextKey)` | Creates a `contains` edge at a specific position |
| `moveChild(containerId, childId, newPrevKey, newNextKey)` | Updates `sortOrder` on the existing `contains` edge |
| `backfillContainerOrder(containerId)` | Generates `sortOrder` for any `contains` edges that lack one (migration helper) |

Both routes — React Flow canvas (`src/routes/WorkspaceRoot.tsx`) and d3 viz-test-1 (`src/routes/VizTest1.tsx`) — call the same store actions. Each renderer reads the sorted child list from the store via the existing query engine (AC 9). No route-specific ordering logic.

This design directly enables "Threaded Container View" in the i2 roadmap: adding a new renderer (threaded list) means it plugs into the same store actions and query engine.

## Files changed (inferred)

| File | Change |
|------|--------|
| `package.json` | Dependency swap |
| `src/types/domain.ts` | Document `sortOrder` convention and fractional-indexing rules |
| `src/store/useGraphStore.ts` | Add `appendChild`, `insertChild`, `moveChild`, `backfillContainerOrder` actions |
| `src/engine/queries.ts` | Ensure child queries sort by `sortOrder` on `contains` edges |
| `src/routes/WorkspaceRoot.tsx` | Consume store actions (no route-local ordering logic) |
| `src/routes/VizTest1.tsx` | Consume same store actions |
| `dev-docs/plans/hello-migration-sort-order.md` | Replace with this PRD (the draft served its purpose) |

## Migration: Existing sortOrder values

No automatic migration on load. The app should not carry dead code for a one-time data fix.

Strategy: **manual fix by an agent** with access to the relevant data stores.

| Data source | Approach |
|-------------|----------|
| **Local storage (IndexedDB)** — test graphs from development | An agent reads each graph snapshot, finds `contains` edges, generates `generateNKeysBetween(null, null, count)` for each container's children, and writes the keys back. This runs once — existing graphs are few and all under our control. |
| **Seed data** (`src/data/seed.ts`) | Check if seed entities have `contains` edges with `sortOrder`. If they lack them or have null values, generate keys in the seed data directly — same `generateNKeysBetween` call per container. This is part of the implementation pass. |
| **`hello2/graph.json`** | Same approach: agent generates keys per container. Verify the dev-docs nodes match this PRD after migration. |

No migration-on-load code is added to the app itself.

## Phases

Single phase — moderate scope, clear boundary, ~5 files + data migration.

## Size advisory

Small-to-medium. One dependency swap, query ordering change, sort conventions documented in `domain.ts`, plus a one-time data migration of existing graphs. No UI changes. No schema migration (field already exists).
