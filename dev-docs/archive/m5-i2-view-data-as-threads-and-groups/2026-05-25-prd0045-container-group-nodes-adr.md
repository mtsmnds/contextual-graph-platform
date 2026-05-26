# 2026-05-25: prd0045 — container group nodes

## Context
- Entities with `type: "container"` needed visual grouping on the canvas (sub-flows, parent-child hierarchy).
- The previous `EntityKind` naming was ambiguous with other "kind" concepts in the domain.
- Entity node height was auto-sized by textarea content — this made resize pointless (textarea always won) and caused layout instability.
- The 15px grid (inherited from an earlier React Flow default) produced fractional-pixel positions and visual misalignment.
- Badges on entity nodes showed `EntityType` but duplicated information already visible in the metadata panel.

## Decision
### Schema
- `parentId` is a first-class domain field on `Entity` — not in `canvasData`, not represented by `contains` edges.
- `EntityKind` renamed to `EntityType` project-wide; the field on `Entity` is now `.type` (not `.kind`).

### Grid
- Grid gap: 16px (Background). snapGrid: `[16, 16]`. Node sizes snap UP via `Math.ceil`.
- Default node width: 208 (16×13). Container default height: 304 (16×19).
- Min node width: 64 (entity) / 272 (container). Min node height: 32 (entity) / 128 (container).

### Height model
- Height is user-controlled via Top/Bottom `NodeResizeControl`. Textarea is `flex-1` and fills available space — it no longer dictates card height.
- Three sync branches in GraphCanvas (initial layoutRef, sync update, sync new-node) share a single `nodeStyle()` helper for width/height/minHeight fallback.
- `applyMeasuredDimensions` snaps measured values; the node builder reads them back into style.

### Padding switching
- Pure CSS container query approach: `.entity-card` has `container-type: size`, `.entity-card-content` has `@container (min-height: 56px)`.
- Default (tight) padding: 4.75px. Normal padding: 6px.
- No `isTight` data prop, no conditional rendering, no Zustand subscriptions in EntityNode.

### Badges
- Badges removed from all node types (EntityNode and ContainerGroupNode). Type is only visible in the metadata panel.

## Alternatives Considered
- **`parentId` in `canvasData`**: Rejected — parent-child is a domain relationship, not a view concern. Storing it in `canvasData` would require migration on every view change.
- **`contains` edges as parent-child mechanism**: Rejected — edges are for relations between peers, not hierarchy. `parentId` models hierarchy directly and avoids edge-counting logic for nesting depth.
- **Auto-height textarea with resize**: Rejected — textarea always grew to content, making resize handles useless. User-controlled height gives predictable layout.
- **JS-based tight-mode detection**: Rejected — would require Zustand subscriptions in EntityNode per resize event. Container query is simpler, more performant, and survives React re-renders.
- **shadcn `@container` utility**: Rejected — Tailwind's `@container` defaults to `inline-size` only, but we need `container-type: size` for height queries.

## Consequences
- Positive: Container hierarchy is directly queryable via `entity.parentId`. Graph layout uses parent-first ordering (containers render first, children nest inside).
- Positive: Removing badges simplifies node rendering and eliminates a stale visual element.
- Positive: Grid-aligned positions and sizes eliminate the fractional-pixel visual jitter from the 15px grid.
- Positive: Container query padding switching is zero-JS — no Zustand subscriptions, no re-render overhead on resize.
- Trade-off: Badges are no longer visible on the canvas — users must open the metadata panel to see entity type.
- Risk: `@container (min-height: 56px)` depends on browser container query support (Caniuse: ~93%). Graceful degradation: `.entity-card-content` uses `container-type: size` which squashes to inline-size-only in unsupported browsers — padding stays at default (4.75px), which is functional albeit slightly tight.

## Follow-ups
- Sub-Dagre layout for containers (auto-arrange children inside a container)
- Collapse/expand toggles on container headers
- Container breadcrumb navigation in the canvas header
- `contains` edges as a parallel user-facing representation (optional)
