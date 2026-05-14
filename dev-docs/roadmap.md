# Roadmap

## Purpose
Forward-looking work: milestones, current priorities, backlog.
Completed work goes in `changelog.md`.

## Usage Rules
- `roadmap.md` = planned work (Now/Next/Later).
- `changelog.md` = completed work.
- Rolling "Recently Completed" section (max 7 days), then promote to `changelog.md`.

---

## Architectural Direction (Established 2026-05-13, updated 2026-05-14)

The current codebase tightly couples domain entities to React Flow nodes. Per the architecture review, this is being corrected:

```
Entity Graph → Projection Layer → Renderer
```

React Flow becomes one renderer among many, not the core runtime. The domain model (Entity/Relation) is decoupled from view state. Content is native to entities, not a separate `docId` pointer. Behaviors belong to the interaction layer, not the graph store.

**Navigation modes:** The app no longer defaults to the React Flow canvas. Three navigation modes replace it, each URL-addressable:
- **Page view** (default) — root-level containers listed on a home page. Navigate through the graph by clicking linked entities.
- **Tree sidebar** — collapsible `contains` hierarchy for quick structural navigation.
- **Graph viz** — the React Flow canvas, improved and accessible via switcher.

This shift reorders the roadmap significantly: **validate contextual reading first, graph visualization last. Page navigation first, tree sidebar second, graph viz third.**

---

## Milestones

### M1 — Domain Engine (Entity/Relation schema ✅, Query engine ✅, Seed content ✅)
- ~~Entity/Relation schema (decoupled from React Flow)~~ ✅
- ~~Persistence layer (localStorage → SQLite)~~ ✅ (Replaced by PRD0009: File System Access API)
- ~~Query engine (getEntity, getRelations, getSequentialContext, getLinkedContext)~~ ✅
- ~~Seed content for validation~~ ✅
- ~~Entity ID scheme + model rules~~ ✅ (PRD0010)

### M2 — Reading Workspace
- Focused entity viewport with sequential traversal (PRD0004)
- Continuous scroll viewport with recursive container flattening (PRD0005)
- Full text import + work entity (PRD0006)
- Side-panel contextual expansion (PRD0007)
- **Node component design** — the building block for all renderers
- **Context columns v1** — horizontal navigation through related context
- Annotation creation (highlight + note)
- Multi-column reading workspace

### M3 — Projection Layer
- Multiple navigation modes: page view, tree sidebar, graph viz
- Renderer abstraction
- Dev tools panel (node JSON inspector)

### M4 — Graph Visualization
- React Flow re-introduced as optional spatial renderer
- Layout algorithms, filtering, node grouping
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
- **Entity ID scheme + model rules (PRD0010)** — implement `src/engine/ids.ts` with `generateEntityId`, `slugify`, collision logic. Wire into `addEntity`. Enforce: segments no `title`, containers no `content`.

## Next — Rethink first page & navigation

The canvas is no longer the default first page. The app is about choosing how you navigate your graph. Three modes, each URL-addressable (`?view=page`, `?view=tree`, `?view=graph`).

### Phase 1 — Page view as primary (immediate next)
- **Home page** — on launch (no folder, no focused entity), show a page listing root-level containers instead of the canvas
- **Page view becomes the default** — the reading viewport is reframed as the primary navigation surface. Containers render their title and children. Linked entities (author, reference, annotation) navigate to their page.
- **Canvas mode-switcher** — canvas is still accessible, but no longer the default. A switcher in the header lets the user pick page / tree / graph.

### Phase 2 — Tree sidebar
- **Collapsible tree sidebar** showing the `contains` hierarchy (root containers → children → segments)
- Clicking any item navigates the page view to that entity
- Uses shadcn tree primitives

### Phase 3 — Node component + columns
- **Node component design** — segment and container node types with action icons in the border area
- **Context columns v1** — start with 3 columns for horizontal navigation (work → author → reference). Column layout designed for long-term scaling.
- **Dev tools panel** — button showing the focused node's full JSON data

### Phase 4 — TipTap + annotation creation
- **TipTap integration** — explore editing models (per-node vs whole-container). HTML content rendering. Evaluate `metadata.type` rules.
- **Annotation creation** — depends on TipTap for rich text. Selection → annotation entity + `annotates` relation.

## Later (Backlog)
- Column reordering, horizontal cross-column sync
- Sample data re-import (Gutenberg parser with new ID scheme)
- "Talmud mode" — show all annotations at once
- Projection layer abstractions
- React Flow canvas features (layout algorithms, filtering, node grouping)
- Self-hosting roadmap — the roadmap itself expressed as entities and relations in the graph (separate PRD)
- Tauri packaging
- Undo/redo
- Keyboard shortcuts and accessibility

## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
- Canvas improvements wait until the page and tree navigation modes are solid.**

## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
- React Flow stays dormant until Phase 4 — resist the urge to build graph UI early.
