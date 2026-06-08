> **Completion note (2026-06-01):**
> - **What was built:** "Graph & Object Shapes" section in `architecture.md` with metadata conventions (`lineNumber`, `character`), plus linking doc comment in `domain.ts`.
> - **Key decisions:** Documentation goes in `architecture.md` (not just `domain.ts`) so there's a single discoverable section for all graph shape conventions.
> - **Deviations from plan:** None.
> - **Postponed:** Type-system enforcement of metadata fields (discriminated union on `Entity.metadata`).

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

Both conventions are documented in a new **"Graph & Object Shapes"** section in `dev-docs/architecture.md`. That section references `src/types/domain.ts` and `src/types/graph.ts` as the source of truth for all entity/relation shapes, and documents the metadata field conventions (`lineNumber`, `character`) inline. A linking comment is also added in `src/types/domain.ts` pointing to the architecture doc. The project has a single source of truth for these field semantics — no more relying on the draft PRD file.

### 4. No type-system enforcement (open)

Whether to tighten `Entity.metadata` from `Record<string, unknown>` to a typed union (e.g. `SegmentMetadata & Record<string, unknown>`) is deferred. This PRD only documents conventions. A follow-up PRD can add discriminated metadata types if the pattern stabilises.

## Files changed (inferred)

| File | Change |
|------|--------|
| `dev-docs/architecture.md` | Add "Graph & Object Shapes" section referencing `domain.ts` & `graph.ts`, with metadata conventions |
| `src/types/domain.ts` | Add linking doc comment pointing to architecture.md |
| `dev-docs/plans/hello-migration-sort-order.md` | Remove segment metadata content (now lives here) |

## Phases

Single phase.

## Size advisory

Trivial — one documentation file changed.
