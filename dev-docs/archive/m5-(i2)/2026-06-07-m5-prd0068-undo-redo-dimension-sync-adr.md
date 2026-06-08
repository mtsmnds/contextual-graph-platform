# 2026-06-07: prd0068 — undo/redo dimension sync — post-hoc

## Context

After PRD 0066 fixed programmatic node resizing via `syncNodeDimensions`, undo/redo restored entity data correctly but the canvas visual never updated for containers. The dimension-sync code (`prevDims` capture + `syncNodeDimensions` call) was inside the `if (!autoLayout)` branch of the sync effect, but Stack Children requires `autoLayout=true`, so undo/redo always took the `else` branch which had no sync.

## Decision

Restructure the sync effect from `if (!autoLayout) { ... return }` to an `if/else` with shared post-loop logic:

1. `prevDims` capture runs **before** the `if/else` (always)
2. Branch-specific `setNodes`/`setEdges` calls run inside the `if/else` (unchanged per-mode logic)
3. Post-loop `syncNodeDimensions` comparison runs **after** the `if/else` (always)

## Consequences

- Any shared post-entity-sync logic will naturally go after the `if/else` block in the future.
- The `if/else` structure is clearer about mutual exclusivity than `if/return`.
- No behavioral change for the non-autoLayout path — `prevDims` capture and post-loop sync were already there, just moved outside the branch.
