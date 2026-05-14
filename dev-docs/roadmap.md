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

### M1 — Domain Engine (Entity/Relation schema ✅, Query engine ✅, Seed content ✅)
- ~~Entity/Relation schema (decoupled from React Flow)~~ ✅
- ~~Persistence layer (localStorage → SQLite)~~ ✅ (Replaced by PRD0009: File System Access API)
- ~~Query engine (getEntity, getRelations, getSequentialContext, getLinkedContext)~~ ✅
- ~~Seed content for validation~~ ✅

### M2 — Reading Workspace
- Focused entity viewport with sequential traversal (PRD0004)
- Continuous scroll viewport with recursive container flattening (PRD0005)
- Full text import + work entity (PRD0006)
- Side-panel contextual expansion (current sprint)
- Annotation creation (highlight + note)
- Multi-column reading workspace

### M3 — Projection Layer
- Multiple graph interpretations: reading, outline, thematic, notes
- Renderer abstraction

### M4 — Graph Visualization
- React Flow re-introduced as optional spatial renderer
- Only after domain model, projections, and reading UX are stable

---

## Recently Completed (Rolling)
- 2026-05-13 — Typed data layer + Zustand store + React Flow canvas (tightly-coupled; refactored in PRD0002)
- 2026-05-13 — Domain engine refactor (PRD0002): Entity/Relation schema, query engine, fresh seed data. See `archive/2026-05-13-domain-engine-refactor.md`
- 2026-05-13 — Persistence layer (PRD0003): localStorage auto-save, hydration, export/import
- 2026-05-13 — Reading viewport (PRD0004): focused entity display, prev/next navigation, mode-switch rendering, shadcn/ui + Tailwind foundation
- 2026-05-13 — Continuous scroll viewport (PRD0005): container-aware rendering, segment variants, breadcrumb nav, canvas-to-container resolution
- 2026-05-13 — Full text import (PRD0006): Gutenberg parser, 1342 entities / 2634 relations, first-run seed data
- 2026-05-13 — Work entity + full-play scrolling: `hamlet--william-shakespeare` as root container, recursive flattening, canvas shows work node, all 1,349 entities scrollable in one view
- 2026-05-13 — Contextual expansion (PRD0007): inline annotation cards, relation indicators, seed data enrichment
- 2026-05-14 — Pure Domain Loader (PRD0008): stripped all runtime merging/detection from `loadInitialState()` — each data source is self-contained
- 2026-05-14 — File System Persistence (PRD0009): user picks a folder, app reads/writes `graph.json` directly, no seed data, no localStorage
- 2026-05-14 — Handle Persistence & URL Navigation (PRD0011): feature-flagged IndexedDB handle persistence (skip folder picker on reload), URL-based view state sync (reloads restore focused entity)

## Now (Current Sprint)
- **Annotation creation (highlight + note)** — users need to populate their graph with annotations
- Sample data import workflow — giving users a way to load existing content (e.g., hamlet) into their folder

## Next (Near-Term)
- Multi-column reading workspace
- "Talmud mode" toggle — show all annotations at once

## Later (Backlog)
- "Talmud mode" toggle — show all annotations at once, each aligned with its source segment
- Projection layer abstractions
- React Flow graph visualization (Phase 4+)
- Tauri packaging
- Undo/redo
- Keyboard shortcuts and accessibility

## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
- React Flow stays dormant until Phase 4 — resist the urge to build graph UI early.
