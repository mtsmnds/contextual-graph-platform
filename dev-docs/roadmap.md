# Roadmap

## Purpose
Forward-looking work: milestones, current priorities, backlog.
Completed work goes in `changelog.md`.

## Usage Rules
- `roadmap.md` = planned work (Now/Next/Later).
- `changelog.md` = completed work.
- Rolling "Recently Completed" section (max 7 days), then promote to `changelog.md`.

---

## Architectural Direction (Established 2026-05-13, updated 2026-05-15)

The system follows an Entity Graph → Projection Layer → Renderer model. React Flow is deferred to Phase 5 — the current app is a single-mode reading workspace with a persistent sidebar for page navigation.

```
Entity Graph → Projection Layer → Reading Workspace (renderer)
```

The domain model (Entity/Relation) is decoupled from view state. Content is native to entities. The app has one navigation mode: a permanent shadcn Sidebar (collapsible to icon-only) on the left, with a HomePage showing root containers and a ReadingViewport for content. `focusedEntityId === null` means home, not canvas.

**Priority:** Validate contextual reading + rich text editing first. Graph visualization comes last.

---

## Milestones

### M1 — Domain Engine ✅
- ~~Entity/Relation schema (decoupled from React Flow)~~ ✅
- ~~Persistence layer~~ ✅ (PRD0009: File System Access API)
- ~~Query engine~~ ✅
- ~~Seed content for validation~~ ✅
- ~~Entity ID scheme + model rules~~ ✅ (PRD0010-1)
- ~~Entity viewport with sequential traversal~~ ✅ (PRD0004)
- ~~Continuous scroll with container flattening~~ ✅ (PRD0005)
- ~~Full text import + work entity~~ ✅ (PRD0006)
- ~~Side-panel contextual expansion~~ ✅ (PRD0007)

### M2 — Reading Workspace ✅
- ~~Home page + page view as default~~ ✅ (PRD0015)
- ~~Sidebar + page navigation~~ ✅ (PRD0015: permanent shadcn Sidebar with page list, home link, new page)
- ~~TipTap integration~~ ✅ (PRD0013: rich text rendering, editable containers, toolbar)
- Page renaming/delete — next
- Tree sidebar (expandable `contains` hierarchy) — next
- Node component design — segment and container node types with action icons in border area.
- Context columns v1 — horizontal navigation through related context (work → author → reference).
- Annotation creation — depends on TipTap. Selection → annotation entity + `annotates` relation.
- Multi-column reading workspace — column reordering, horizontal sync.

### M3 — Navigation & Projection Layer
- Mode switcher (page / tree / graph) — each URL-addressable
- Renderer abstraction
- Dev tools panel (node JSON inspector)

### M4 — Graph Visualization
- React Flow improvements: layout algorithms, filtering, node grouping, search
- Self-hosting roadmap — the roadmap expressed as entities and relations in the graph

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
- 2026-05-14 — Minimal Entity Model (PRD0010-1): ID scheme, slugify, model rules enforced in store, HTML content rendering
- 2026-05-14 — Popover sidebar navigation (PRD0012): replaced AppHeader with floating three-dots + shadcn Popover/Sidebar for root-level entity navigation. Removed ReadingViewport header. Added `getRootContainers` to query engine. See `archive/2026-05-14-sidebar-navigation.md`.
- 2026-05-15 — TipTap + page navigation (PRD0013): TipTap integration, root containers (playground/books/roadmap), URL view param, editable empty containers. See `archive/2026-05-14-tiptap-page-navigation.md`.
- 2026-05-15 — Sidebar home navigation (PRD0015): Stripped React Flow, replaced popover sidebar with permanent shadcn Sidebar, added HomePage view, one-click page creation and selection. See `archive/2026-05-15-prd0015-sidebar-home-navigation.md`.
- 2026-05-15 — TipTap UI Phase 1 (PRD0014): Simple Editor scaffold, full toolbar, debounced save strategy, Playground full-width layout. See `archive/2026-05-15-prd0014-tiptap-ui-p1.md`.
- 2026-05-15 — TipTap UI Phase 2 (PRD0016): BubbleMenu, Drag Handle, Placeholder, Emoji, additional free extensions. See `archive/2026-05-15-prd0016-tiptap-ui-p2.md`.

## Now (Current Sprint) — Reading workspace UX

### 1. TipTap UI Phase 2 — Free Notion-like delta (shipped, see PRD0016)
- **BubbleMenu** — floating toolbar on text selection (bold, italic, link, highlight)
- **Drag Handle** — block drag-and-drop reordering (needs size/alignment fix — polish later)
- **Additional extensions** — Underline, Highlight, TextAlign, TaskList, Placeholder, Emoji, Typography
- **Emoji autocomplete** — `:smile:` → 😄 works but is basic. Needs a proper emoji picker UI later.
- **Slash commands** — TBD. Look at open-source projects (Notion clones, BlockNote, Novel) for inspiration before building.

### 2. Storage format + Title schema
- **ProseMirror JSON as storage** ✅ — switched from `getHTML()` to `JSON.stringify(getJSON())`. Content stored as TipTap JSON in `Entity.content`. Legacy HTML content handled via `parseContent()` fallback.
- **Title as first heading** ✅ — custom `TitleDocument` extension enforces `content: "heading block+"`. First block is always a heading. Title syncs to `entity.title` on every edit. No drag handle on the title block.
- **Model A confirmed** — per-container editor instances, not shared documents.
- **Annotation mapping** — still open, deferred.

### 3. Cross-doc mentions (Phase 3.3) — current step
- **Build suggestion popup render** — `@` triggers a popover listing root containers, selecting one inserts a mention node with the entity ID. Extension installed, items wired to graph store, need the UI.
- **Inspect JSON structure** — once mentions work, confirm `attrs.id` and `attrs.label` survive round-trip.
- **Click navigation** — clicking a mention navigates to the referenced entity.

### 4. Page UX polish
- ~~Sidebar shows child hierarchy (expandable tree via `contains`)~~ — deferred
- ~~Delete / rename pages from sidebar~~ — deferred

## Next — Columns, annotations, navigation modes

### Phase 3 — Context columns + dev tools
- **Context columns v1** — start with 3 columns for horizontal navigation (work → author → reference)
- **Dev tools panel** — button showing the focused node's full JSON data

### Phase 4 — Annotation creation
- **Annotation creation** — selection → annotation entity + `annotates` relation. Depends on TipTap.

### Phase 5 — Graph visualization (React Flow)
- React Flow reintroduction: layout algorithms, filtering, node grouping, search
- Self-hosting roadmap — the roadmap itself expressed as entities and relations in the graph

## Later (Backlog)
- Page reordering in sidebar
- Drag-and-drop page reorder in sidebar
- Column reordering, horizontal cross-column sync
- Sample data re-import (Gutenberg parser with new ID scheme)
- "Talmud mode" — show all annotations at once
- Projection layer abstractions
- Tauri packaging
- Undo/redo
- Keyboard shortcuts and accessibility

## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
- React Flow stays dormant until Phase 5 — resist the urge to build graph UI early.
