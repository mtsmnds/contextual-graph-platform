# 2026-05-23: prd0044 — Schema v5: Canvas Data on Entity

## Context

Every feature touching node positions (undo, restore, save, Cmd+drag) had bugs because positions lived in `canvas.positions` — a separate map from the entity domain model. The effect in `GraphCanvas.tsx` had to reconcile four independent state slices (`entities`, `relations`, `canvas.positions`, `canvas.dimensions`) into React Flow nodes, and the merge logic frequently fell out of sync. Industry research showed that visual canvas products (Figma, Obsidian Canvas, Miro, PowerPoint) all store position as a fundamental property of the node object.

The user ruled out a "view mirror" pattern (option 3) because there is exactly one view and the mirror would add a sync layer with no benefit. The decision was to adopt the industry pattern: position lives on the entity.

## Decision

**Schema v5:** `Entity` gains `canvasData: { x, y, width?, height? }`. `CanvasState` loses `positions` and `dimensions` — only `viewport` remains.

**Undo rule:** every user-initiated change creates an undo entry. Drag-end → `beginBatch("Move N nodes")`, resize-end → `beginBatch("Resize node")`. Auto-measurement (browser-computed dimensions on first render) bypasses tracking — it's system initialization, not user action.

**Removed:** `setNodePosition`, `setCanvasPositions`, `replaceCanvasPositions`. All replaced by `updateEntity(id, { canvasData })` wrapped in appropriate batches.

**Migration v4→v5:** `migrateSnapshot()` maps `canvas.positions[id]` → `entity.canvasData.x/y` and `canvas.dimensions[id]` → `entity.canvasData.width/height`. After migration, `canvas.positions` and `canvas.dimensions` are discarded.

## Alternatives Considered

**Option 1: Keep positions in separate map but fix reconciliation.** Pro: minimal schema change. Con: every future feature would need to remember to reconcile separately; the pattern of bugs would recur.

**Option 2: View mirror pattern.** Store a "fundamental graph" (no positions) mirrored into a "view graph" (with positions). Pro: scales to multiple views. Con: over-engineering for single view; adds a sync layer; debugging complexity.

**Option 3 (chosen): Position on entity.** Pro: position is captured automatically in every snapshot; undo/restore/save work without reconciliation; matches industry practice. Con: schema migration needed for existing data; "view pollution" objection (rejected — for a spatial canvas tool, position IS domain data).

## Consequences

**Positive:** Position bugs in undo, restore, Cmd+drag, and save are permanently fixed. GraphCanvas effect is simplified (4 slices → 2 slices). Drag-end creates undo entries. Resize creates undo entries. No stale-position reconciliation code remains.

**Trade-offs:** Schema migration is destructive for `canvas.positions`/`canvas.dimensions` — after v4→v5 migration, old data cannot revert. Old backups (v4) are migrated on restore via `migrateSnapshot()`.

**Risks:** Entity type gains a `canvasData` field that is irrelevant for non-canvas entities (containers, annotations). Mitigation: the field is `{ x: 0, y: 0 }` by default — zero cost in JSON or memory. Future non-canvas views can ignore it.

## Follow-ups

- None required. The `CanvasData` type is designed for extensibility (`canvas2_data`, `timeline_data` follow the same pattern).
