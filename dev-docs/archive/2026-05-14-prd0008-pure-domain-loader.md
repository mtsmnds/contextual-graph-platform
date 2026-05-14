# PRD0008 — Pure Domain Loader

## Status
Proposed

## Problem

`loadInitialState()` in the store does not trust its own data sources. After picking a source (localStorage, hamlet.json, or seed data), it runs a second pass that:

1. Checks if annotation entities are missing and pushes them from seed data
2. Detects whether the data is hamlet-sourced (by scanning for `seg_18`/`seg_1614`)
3. Depending on that detection, pulls annotation relations from either hamlet.json or seed relations

This means the final state is never simply "what was in the source file." It is the source plus a runtime algorithm's best guess at what should be there. This is the same class of bug that caused the content-matching failure in PRD0007 — the algorithm made assumptions that didn't hold.

Beyond annotations, this pattern would repeat for every future data addition:
- Add a new entity type to seed data → add merge code in `loadInitialState()`
- Add new data to hamlet.json → add detection code so the right relations get merged
- Every new data source needs its own detection heuristic

The domain model should be unquestionable: what you put in the data is what you get out. No runtime interpretation layer.

## Goal

`loadInitialState()` becomes a pure selector: given a storage backend, return its data as-is. No post-processing, no merging, no content detection. Each data source (seed data, hamlet.json, filesystem file) is fully self-contained — every entity ID it references exists within the same source.

## Scope

**In scope:**
- Remove all runtime merging logic from `loadInitialState()`
- Ensure hamlet.json is self-contained (already done — annotations and relations are embedded)
- Ensure seed data is self-contained (already is — `hamlet_1`/`hamlet_2` exist in seed entities)
- Remove the `hamletData` import from the store (no longer needed at runtime)
- Move annotation entities and relations out of `seedRelations`/`seedEntities` and into a separate seed file, OR keep them but remove the merging code — they're only valid if the entire seed data block is loaded

**Out of scope:**
- File System Access API (PRD0009)
- Changing the data format/schema
- Annotation creation UI

## Design

### Current flow

```
loadInitialState():
  1. try localStorage
  2. try hamlet.json
  3. fall back to seedEntities + seedRelations
  4. merge annotation entities (note_1–4, ref_1) if missing
  5. detect: is this hamlet data? (check for seg_18/seg_1614)
  6. merge annotation relations from correct source
  → return modified state
```

### Target flow

```
loadInitialState():
  1. try localStorage
  2. try hamlet.json
  3. fall back to seedEntities + seedRelations
  → return state as-is
```

Each source is authored so that all relation targets exist in its entity list:
- `hamlet.json`: contains `seg_18`, `seg_1614`, `note_1`–`note_4`, `ref_1`, and relations `r_6`–`r_10`
- `seedEntities`/`seedRelations`: contains `hamlet_1`, `hamlet_2`, `note_1`–`note_4`, `ref_1`, and relations `r_6`–`r_10` (already true — but annotation entities/relations must NOT be stripped from seed data; the entire seed data block is the source)

### Data source integrity

Each source is validated by convention: every relation's `source` and `target` must resolve to an entity in the same source's entity array. This is enforced by authoring, not by runtime code. If a source is broken, it fails at the point of use (a query returns no result for a missing entity — harmless).

### Removing the hamletData import

Currently `hamletData` is imported at the top of the store and used in two places:
1. Line 118: loading state from hamlet.json on first run
2. Lines 147–151: merging annotation relations from hamlet.json into localStorage data

With the merge logic removed, use 2 disappears. Use 1 stays but can be internalized. The import itself stays unless we move the hamlet loading inside `loadInitialState`.

## File Changes

| File | Action |
|------|--------|
| `src/store/useGraphStore.ts` | Remove annotation merging logic (lines 129–165); clean up `loadInitialState()` to return source data directly |
| `dev-docs/roadmap.md` | Move "Contextual expansion" to Recently Completed; note the loader purity fix |

## Implementation Steps

### Step 1 — Strip the merge logic

Remove everything in `loadInitialState()` after the `if (!base)` block:

```ts
function loadInitialState() {
  // Try localStorage
  // Try hamlet.json
  // Fall back to seed data
  // Return whatever was found
}
```

### Step 2 — Verify data source self-containment

Confirm that:
- `hamlet.json` has all annotation entities and relations (already done)
- `seedEntities` + `seedRelations` have all annotation entities and relations (already true — `note_1`–`note_4`, `ref_1` are in `seedEntities`; `r_6`–`r_10` are in `seedRelations`)

### Step 3 — Verify

- Fresh load from localStorage → shows whatever was persisted
- Fresh load from hamlet.json (clear localStorage) → annotations appear on "Who's there?" and "To be, or not to be"
- Fresh load with no hamlet.json (simulate by removing import) → seed data works, annotations appear
- `npx tsc --noEmit` passes
- `npm run build` succeeds

## Acceptance Criteria

1. `loadInitialState()` contains zero post-processing of the selected data source
2. No content matching, source detection, or entity/relation merging at load time
3. Each data source (hamlet.json, seed data) is self-contained — all relation targets exist within the same source
4. `npx tsc --noEmit` passes
5. `npm run build` succeeds

## Verification

```sh
npx tsc --noEmit
npm run build
npm run dev   # manual: clear localStorage → reload → check annotations on both segments
```
