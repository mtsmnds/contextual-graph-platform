# 2026-06-01: prd0057 — sort order & fractional indexing

## Context
- Sort order existed as `Relation.sortOrder` but was undocumented and had no store-level API for creating/managing it.
- The `fractional-indexing` package was used in one place (`addRelation`) but the jitter-free variant meant concurrent inserts could collide.
- Multiple renderers (canvas, threaded container view in i2) need a shared ordering mechanism.

## Decision
- Swap `fractional-indexing` → `fractional-indexing-jittered` for collision-resistant key generation.
- Add four store actions as the canonical interface: `appendChild`, `insertChild`, `moveChild`, `backfillContainerOrder`.
- Document the convention in `domain.ts` with 5 rules: append, insert, move, delete (no reindex), batch import.
- **In scope:** store-level actions, domain docs, dependency swap.
- **Out of scope:** renderer-specific sort order UI, migration-on-load, bulk backfill (`backfillAllOrders` removed).

## Alternatives Considered
- **Keep jitter-free**: simpler dependency but collisions possible — rejected because concurrent editing is a stated goal.
- **No store actions, just utilities**: callers would repeat the sibling-finding logic — rejected because every renderer would reimplement it.
- **Query-level sort only, no store actions**: ordering would be read-only at the query level — rejected because writers need a clear API too.

## Consequences
- Positive: all renderers share the same ordering logic. No route-specific ordering code.
- Positive: jitter prevents key collisions from concurrent editing sessions.
- Positive: conventions documented so future contributors don't guess the rules.
- Trade-off: the store actions only handle `contains` edges — other relation types don't get sort order management.
- Trade-off: `backfillContainerOrder` is for migrations only — no runtime reindex on delete.

## Follow-ups
- Wire `appendChild` into the canvas's "Add Child Node" / "Add Child Container" context menu items (currently `addRelation` is called directly — should use the new action for correct key generation).
