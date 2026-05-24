# 2026-05-18: prd0038 — save node positions

## Context
- Node positions were ephemeral (stored only in React Flow's internal state, lost on reload).
- Viewport was saved to `localStorage` — separate from the main snapshot, no migration path.
- Dagre was the sole source of truth for layout; any user arrangement was discarded on every entity/relation change.
- The system needed a foundation for user-arranged layouts, sub-flows, and positional work.

## Decision
- Add `canvas: { positions: Record<string, { x, y }>, viewport?: { x, y, zoom } }` to `GraphSnapshot` at version 4.
- Saved positions are authoritative. Dagre is a fallback for entities without a saved position.
- Viewport moves from `localStorage` into `canvas.viewport` — debounce-saved on pan/zoom.
- On drag end, all current node positions are saved (handles multi-select drag via `getNodes()`).
- The Re-layout button is hidden behind `__experimentalReLayout` — not shipped yet.
- **In scope:** schema bump, migration, store actions, canvas wiring, viewport persistence.
- **Out of scope:** sub-flow scoping, undo/redo, multi-canvas.

## Alternatives Considered
- **Positions per entity metadata** — storing positions in `entity.metadata`. Rejected: positions are a canvas concern, not an entity concern. Every entity renderer would need to read/write metadata, coupling rendering logic to persistence.
- **Separate positions store** (e.g. a dedicated IndexedDB table). Rejected: adds complexity of synchronizing two persistence targets. The snapshot is already the single source of truth.

## Consequences
- Positive: user layouts persist across reloads. Multi-select drag works correctly. Viewport is part of the snapshot (backup/migration-friendly).
- Trade-off: snapshot size grows with `positions` map (negligible in practice — coordinates are tiny).
- Risk: migration from v3 → v4 is silent — users don't lose data. The `canvas` field is optional in the migration function.

## Follow-ups
- Enable `__experimentalReLayout` when ready — the wiring is in place.
- Sub-flow support: positions are entity-keyed, which maps naturally to scoped canvases.
