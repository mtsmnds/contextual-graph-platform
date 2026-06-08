# 2026-06-03: prd0061 — ParentId Deprecation

## Context
- The graph model had two redundant mechanisms for parent-child relationships: `entity.parentId` (a field on Entity) and `contains` relations (edges in the relations array with `type: "contains"` and `sortOrder`).
- Both were kept in sync by the store, but they diverged in practice — `hello2/graph.json` had entities with `parentId` and no matching `contains` edge, and vice versa.
- `contains` edges are the canonical representation (used by the query engine, drag-to-nest actions, and persistence). `parentId` is a cached duplicate with no ordering information.
- Removing `parentId` eliminates a field that is `undefined` for most entities and is a source of branching in every entity-processing loop.
- A side effect: entities with outgoing `contains` edges but `type !== "container"` must be promoted to `container`, since React Flow requires parent nodes to be group nodes. This affects geography nodes and structural summary groups.

## Decision
- **Remove `parentId` from the Entity data type** entirely. No entity carries a `parentId` field.
- **All parentage is expressed solely through `contains` edges.** The `sortOrder` field on `contains` edges determines child ordering.
- **`parentId` is derived at the React Flow boundary** via `getParentId()` query function, which finds the incoming `contains` edge for an entity and returns its source.
- **Store actions use edges:** `addEntity` converts a `parentId` parameter into a `contains` edge (kept as sugar for call-sites). `updateEntity` no longer writes `parentId`. `deleteEntity` cascade walks `contains` edges for reparenting.
- **Drag-to-nest creates/removes `contains` edges** instead of setting/clearing `parentId`.
- **Migration is a one-time standalone script** (`scripts/migrate-remove-parentId.ts`), not in-app migration. This avoids runtime complexity for old data.
- **Non-container parents are promoted to `container`** without adding `metadata.groupType`. The old type is replaced entirely (geoType is preserved in `metadata.geoType`).
- **Geography leaf nodes** (`city--stratford-upon-avon`, `place--kronborg-castle`, `city--athens`) were incorrectly kept as `concept` in the initial migration. They should be `container` since they are part of the geography `contains` chain and can have children.

## Alternatives Considered
- **Keep `parentId` and sync both sources:** Rejected — proven source of drift. `parentId` has no ordering information.
- **In-app migration on load:** Rejected — adds runtime complexity (version check, migration logic in the critical load path) for a one-time data transformation.
- **Use a computed property (getter):** Rejected — `Entity` is a plain data type, not a class. Getters don't survive JSON serialization.
- **Keep `metadata.groupType` on promoted containers:** Rejected — the old type was incorrect for those entities. No need to preserve it in metadata. The type change is semantically correct.

## Consequences
- **Positive:** Single source of truth for nesting. Simpler data model. No branching on `parentId` in entity-processing loops. Migration is isolated and idempotent.
- **Trade-offs:** React Flow's nesting model requires `parentId` on nodes — this is now derived at the boundary layer (`GraphCanvas.tsx`), which is the correct abstraction boundary.
- **Risks:** If `getParentId()` is called before the store is hydrated, the result is `undefined` — existing code already handles `undefined` parentId, so this is safe. The migration script must be run once on existing workspaces; the script is safe to re-run (idempotent).

## Follow-ups
- Geography leaf nodes (`city--stratford-upon-avon`, `place--kronborg-castle`, `city--athens`) were promoted to `container` as a manual fix after the initial migration ran.
