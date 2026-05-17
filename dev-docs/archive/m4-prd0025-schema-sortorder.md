> **Completion note (2026-05-16):**
> - **What was built:** Schema changes (removed `RelationType`, added `sortOrder` to Relation, `createdAt`/`updatedAt` to Entity), updated store (`addRelation` auto-generates sortOrder, `getEdgesForNode`, `queryThread`), updated query engine (removed `getSequentialContext`, replaced `next`-chain with `sortOrder` in `getContainerChildren`).
> - **Key decisions:** `sortOrder` is first-class string (not in metadata). `RelationType` union removed in favor of free-form `string`. `"next"` relation type removed entirely — ordering delegated to fractional-indexing on `sortOrder` scoped to `(targetId, type)`.
> - **Deviations from plan:** None.

## Task: Schema alignment + `sortOrder` on Relation + `queryThread`

### Context

Phase II of the Graph Canvas initiative starts here. The current `Relation` type lacks an ordering field. Sibling ordering is currently done via `"next"` relations (a `type: "next"` chain). This PRD replaces `"next"` with a `sortOrder` field using fractional-indexing, adds timestamps to `Entity`, opens up `RelationType` to free-form strings, and adds `getEdgesForNode` / `queryThread` to the store.

**Decision log:**
- `sortOrder` is a first-class `string` field on `Relation` (not buried in `metadata`)
- `"next"` relation type is removed — ordering is entirely `sortOrder` scoped to `(targetId, type)`
- `RelationType` union becomes `string` — structural types like `"contains"` stay as conventions, but the type system no longer enumerates them
- `Entity` gets `createdAt: number` and `updatedAt: number`

### Steps

#### 1. Install `fractional-indexing`

```sh
npm install fractional-indexing
```

Provides `generateKeyBetween(a, b)` and `generateNKeysBetween(a, b, n)`.

#### 2. Update `src/types/graph.ts`

```ts
type Entity = {
  id: string
  kind: EntityKind
  title?: string
  content?: string
  metadata: Record<string, unknown>
  createdAt: number      // new
  updatedAt: number      // new
}

// RelationType union is removed — use `string` directly
type Relation = {
  id: string
  source: string
  target: string
  type: string           // was RelationType, now free-form string
  sortOrder: string      // new — fractional-indexing key
  metadata: Record<string, unknown>
}
```

Remove the `RelationType` type export entirely. Remove `"next"` from any union it appears in (it's only in the now-removed `RelationType`).

#### 3. Update `src/store/useGraphStore.ts`

- `addRelation`: accept `type: string` instead of `type: RelationType`, auto-generate `sortOrder` via `generateKeyBetween(null, null)` as the default (first item), or accept optional `sortOrder` parameter.
- `addEntity`: set `createdAt` and `updatedAt` to `Date.now()` on creation.
- `updateEntity`: bump `updatedAt` to `Date.now()` on each mutation.
- Add `getEdgesForNode(state, id, direction?)`: returns relations scoped to `source === id`, `target === id`, or both.
- Add `queryThread(state, { target, relationType })`: filters relations by `target === id && type === relationType`, sorts by `sortOrder`, maps to source entities.

#### 4. Update `src/engine/queries.ts`

- `getSequentialContext` — remove this function entirely (it was built on `"next"` relations, now obsolete).
- `getContainerChildren` — remove the `next`-chain ordering logic (lines 74–98). Children of a `"contains"` relation are now ordered by `sortOrder` instead of a `next` chain. Sort by `relation.sortOrder` within the child set.
- All other functions that filter by `r.type === "contains"` stay unchanged.

#### 5. Update callers

- `src/renderers/ReadingViewport.tsx` — no `"next"`-dependent code found (it uses `getContainerChildren` which will be updated). Verify.
- `src/components/tiptap/PassageLinkPopover.tsx` — uses `"quote"` literal, stays the same (just changes from `RelationType` to `string`, no behavioral change).

#### 6. Update `src/data/seed.ts` if needed

No seed data uses `"next"`, so no migration needed. All existing relations are untouched (they just lose the compile-time `RelationType` guard).

### GraphSnapshot version

Bump `GraphSnapshot.version` from `1` to `2` to signal the schema change. On load, check version and skip migration (no data transformation needed since `sortOrder` is new-optional for writes and will be populated on first edit).

### Constraint

No React Flow installation yet (that's II.7 in the next PRD). This is purely schema + store + query engine work. The app should run identically after these changes — existing `"contains"` and `"quote"` relations continue to work, just without the compile-time type union.

### Files changed

| File | Change |
|------|--------|
| `src/types/graph.ts` | Remove `RelationType`, add `createdAt`/`updatedAt` to Entity, add `sortOrder` to Relation, change `type` to `string` |
| `src/store/useGraphStore.ts` | Update `addRelation`/`addEntity`/`updateEntity` signatures, add `getEdgesForNode` and `queryThread` |
| `src/engine/queries.ts` | Remove `getSequentialContext`, replace `next`-chain with `sortOrder` in `getContainerChildren` |
| `package.json` | Add `fractional-indexing` dependency |
| `dev-docs/architecture.md` | Update schema docs |
