# Roadmap

## Purpose
Forward-looking work: what we're doing now, next, and later.
Completed work goes in `changelog.md`.

## Usage Rules
- `roadmap.md` = planned work (Now/Next/Later).
- `changelog.md` = completed work — the source of truth for what's done.
- When a task is finished, move it from roadmap to changelog.

---

## Now

- _Empty — no active PRDs._

## Next

- _Empty — no queued PRDs._

## Later

- **ID system rework** — `slugify` strips hyphens (spaces→hyphens then immediately removed), producing continuous slugs (`"Hello World"` → `"helloworld"`). `SEG_PREFIX_RE` strip on parent IDs runs after child slug is appended, so `_seg-N` suffixes on parents are never actually removed. Rework to use fractional-indexing or UUIDs for reliable, collision-resistant IDs.
