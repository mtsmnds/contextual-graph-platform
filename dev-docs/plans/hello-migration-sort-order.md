# Sort Order & Fractional Indexing — PRD

## Goal

Introduce a consistent, documented approach to ordering children within
containers across the react-roadmap project and the hello migration.

The core mechanism — fractional-indexing strings on `contains` edges —
already exists in the schema (`Relation.sortOrder` in `graph.ts`). This
PRD codifies the conventions that were previously implicit and adds a
dedicated npm library for deterministic key generation.

## Deps

```
npm install fractional-indexing-jittered
```

https://www.npmjs.com/package/fractional-indexing-jittered

This package provides `generateKeyBetween(a, b)` and
`generateNKeysBetween(a, b, count)` with jitter (random suffix) to
handle concurrent inserts without collision risk.  Same API shape as
the `fractional-indexing` library already used in the codebase.

## Behaviour

### 1. Appending to end

When a new child is added to a container via a `contains` edge, generate
the `sortOrder` by calling:

```
generateKeyBetween(lastSiblingKey, null)
```

Returns a string that sorts after every existing sibling.

### 2. Inserting between siblings

When inserting a child at a specific position:

```
generateKeyBetween(prevKey, nextKey)
```

Returns a string that sorts strictly between the two neighbors.
If `prevKey` is `null`, inserts before the first; if `nextKey` is
`null`, after the last.

### 3. Batch import (book content)

When importing all speeches of a scene at once (e.g. 24 lines for
Scene 1), call:

```
generateNKeysBetween(null, null, 24)
```

Returns an array of 24 evenly-spaced keys.  This avoids O(n) key
regeneration when inserting sequentially.

### 4. No reindex on delete

When a segment is deleted, the entity and its edges are removed.
Remaining siblings keep their existing `sortOrder` values — there is
never a reindex operation.

### 5. Move within container

Delete the old edge, create a new edge with `generateKeyBetween` of the
new neighbours.

### 6. Move across containers

Delete edge from the source container, create an edge in the target
container with its own independent key (appended to end or inserted
between siblings per rules 1–2).

## Segment metadata conventions

These apply to `segment` entities that are content leaves within a
book's structure.

### 7. `metadata.lineNumber`

Present for works with canonical line numbering (plays, poems).
Absent for prose (novels, essays).

```ts
{ metadata: { character: "barnardo", lineNumber: 1 } }
```

### 8. `metadata.character`

Speaker name for dialogue lines in plays.  Absent for prose, narration,
stage directions, and non-dialogue segments.

### 9. `content` field format

Character name and speech text are separated by `\n` inside the
`content` string.  No HTML in the data layer.

```
content: "BARNARDO\nWho's there?"
```

The relational layer never uses `<br>` or other markup.  Rendering
escapes and formats the text (e.g. bold character name, line break
between name and speech) is the view layer's job.

## Querying

### 10. Child order

When querying children of a container, sort by the `sortOrder` field of
the `contains` edges, **not** by `createdAt`, `updatedAt`, or array
position.

## Documentation updates

| File | What to add |
|---|---|
| `src/types/domain.ts` | New section documenting `sortOrder` convention, fractional-indexing rules, segment metadata (`lineNumber`, `character`), and `\n` content format |
| `dev-docs/plans/hello-migration-data-tiers.md` | No change (out of scope) |
| `AGENTS.md` | No change (already references domain.ts) |
| `hello2/graph.json` | The dev-docs nodes already cover fractional indexing and sort order. Verify the `dev-docs--sort-order` segments match this PRD. |

## Open questions

1. Should `lineNumber` be `number` or `string`?  Some plays have
   unconventional numbering (e.g. "1a", "1b").  Initial decision:
   `number` for standard plays, fall back to metadata only for
   edge cases.
   1. Answer: lineNumber is a number


2. Should there be a global `sortOrder` across edges of different types
   (e.g. interleaving `contains` and `references` under the same
   parent)?  No — `sortOrder` is scoped to edges of the same type
   from the same source container.
