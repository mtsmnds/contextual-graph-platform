# 2026-06-07: Fixed sortOrder comparison — localeCompare vs raw code point order

## Context
- `stackChildren` and 6 other call sites sorted `sortOrder` keys using `localeCompare`
- Fractional-indexing keys (e.g. "Zz", "a0") from `fractional-indexing-jittered` assume raw Unicode code point order for correct lexical sorting
- `localeCompare` is locale-aware: `"Zz"` (uppercase Z) sorted AFTER `"a0"` (lowercase a) because letters are compared alphabetically — correct for natural language, wrong for fractional-indexing keys
- Raw `</>` comparison: `"Zz"` sorts BEFORE `"a0"` because 'Z' (code point 90) < 'a' (code point 97) — correct for fractional indexing

## Decision
- Added `compareSortOrder(a, b)` utility to `src/engine/queries.ts` using `<`/`>` comparison
- Replaced all 7 `localeCompare` call sites across the codebase

## Consequences
- All sortOrder-based sorting is now consistent — mixed-case keys sort correctly everywhere
- No behavior change for lowercase-only keys (e.g. "a0", "a1") which were already correct
- No locale-dependent behavior — the comparison is deterministic regardless of user locale
