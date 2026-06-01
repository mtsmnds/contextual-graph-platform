# m5-prd0058: Segment Metadata Conventions

## Overview

Codify the `metadata.lineNumber` and `metadata.character` conventions for segment entities in `src/types/domain.ts`. These fields are already used in practice (e.g. in the hello migration's Hamlet import) but lack documented conventions and live only in the draft at `dev-docs/plans/hello-migration-sort-order.md`. This PRD moves them into the project's type documentation layer for a single source of truth.

## Specification / Acceptance Criteria

### 1. `metadata.lineNumber`

- Type: `number`.
- User decides whether a segment has a `lineNumber` (not enforced by the system).
- Usually present for works with canonical line numbering (plays, poems).
- Usually absent for prose (novels, essays).
- Example: `{ metadata: { character: "barnardo", lineNumber: 1 } }`

### 2. `metadata.character`

- Type: `string`.
- User decides whether a segment has a `character` (not enforced by the system).
- Usually present in play dialogue lines.
- Usually absent for prose, narration, stage directions, and non-dialogue segments.

### 3. Documentation location

Both conventions are documented in a new metadata conventions section in `src/types/domain.ts` (or in an adjacent type-level doc comment). The project has a single source of truth for these field semantics — no more relying on the draft PRD file.

### 4. No type-system enforcement (open)

Whether to tighten `Entity.metadata` from `Record<string, unknown>` to a typed union (e.g. `SegmentMetadata & Record<string, unknown>`) is deferred. This PRD only documents conventions. A follow-up PRD can add discriminated metadata types if the pattern stabilises.

## Files changed (inferred)

| File | Change |
|------|--------|
| `src/types/domain.ts` | Add metadata conventions section documenting `lineNumber` and `character` |
| `dev-docs/plans/hello-migration-sort-order.md` | Remove segment metadata content (now lives here) |

## Phases

Single phase.

## Size advisory

Trivial — one documentation file changed.
