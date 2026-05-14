# Roadmap

## Purpose
Forward-looking work: milestones, current priorities, backlog.
Completed work goes in `changelog.md`.

## Usage Rules
- `roadmap.md` = planned work (Now/Next/Later).
- `changelog.md` = completed work.
- Rolling "Recently Completed" section (max 7 days), then promote to `changelog.md`.

---

## Architectural Direction (Established 2026-05-13)

The current codebase tightly couples domain entities to React Flow nodes. Per the architecture review, this is being corrected:

```
Entity Graph → Projection Layer → Renderer
```

React Flow becomes one renderer among many, not the core runtime. The domain model (Entity/Relation) is decoupled from view state. Content is native to entities, not a separate `docId` pointer. Behaviors belong to the interaction layer, not the graph store.

This shift reorders the roadmap significantly: **validate contextual reading first, graph visualization last.**

---

## Milestones

### M1 — Domain Engine
- Entity/Relation schema (decoupled from React Flow)
- Persistence layer (localStorage → SQLite)
- Query engine (getEntity, getRelations, getSequentialContext, getLinkedContext)
- Seed content for validation

### M2 — Reading Workspace
- Focused entity viewport with contextual radius
- Sequential traversal (next/previous)
- Side-panel contextual expansion
- Focus promotion (secondary → primary)
- Annotation creation (highlight + note)

### M3 — Projection Layer
- Multiple graph interpretations: reading, outline, thematic, notes
- Renderer abstraction

### M4 — Graph Visualization
- React Flow re-introduced as optional spatial renderer
- Only after domain model, projections, and reading UX are stable

---

## Recently Completed (Rolling)
- 2026-05-13 — Typed data layer + Zustand store + React Flow canvas (tightly-coupled; to be refactored)

## Now (Current Sprint)
- **Refactor domain model to decouple from React Flow** — Entity/Relation schema independent of view state. `status` and `EdgeBehavior` removed from domain types (product-specific / interaction-layer concepts). Content lives directly on entities. See `dev-docs/prd0001-contextual-graph-platform/contextual_graph_platform_architecture_review.md` for full rationale.

## Next (Near-Term)
- Persistence layer (localStorage)
- Query engine (getEntity, getRelations, getSequentialContext, getLinkedContext)
- Seed content (hardcoded excerpts + annotations)
- Reading viewport with focused entity display

## Later (Backlog)
- Annotation creation (highlight + note)
- Side-panel contextual expansion
- Multi-column reading workspace
- Projection layer abstractions
- React Flow graph visualization (Phase 4+)
- Tauri packaging
- Undo/redo
- Keyboard shortcuts and accessibility

## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
- React Flow stays dormant until Phase 4 — resist the urge to build graph UI early.
