# Strategy Decision — Navigation Modes & MVP Path

## Context

The app defaults to the React Flow canvas as the first page, but the canvas "helps very little" in its current state. We agree it's not priority right now. At the same time, two things are genuinely exciting:

1. **Manipulating the roadmap visually** — seeing our own project graph in the graph
2. **Adding master nodes** (william-shakespeare, authors, works) — populating the graph with real entities

These share a common need: a usable navigation system that lets the user explore and interact with their graph without fighting the UI.

## Three Navigation Modes

The graph can be entered through three different lenses. Each is a projection of the same Entity/Relation data. Each should be URL-addressable so the user can link to any view.

### 1. Folder Tree
A hierarchical sidebar (like VS Code's file explorer, Notion's sidebar) showing the `contains` tree. Root-level containers (works, projects, note collections) are top-level items. Expanding reveals their children recursively.

- **Implementation:** Query `getContainerChildren` recursively. shadcn has tree-view primitives.
- **Effort:** Low — pure data query, no new rendering infra.
- **Value:** High — immediate orientation in the graph. Shows the containment hierarchy at a glance.

### 2. Root Node Page (Notion-style)
A page-based view where each container is its own page. The home page lists root-level containers. Clicking one shows its content (title + child segments) with inline links to related entities. Navigation is link-to-link, not canvas-to-canvas.

- **Implementation:** Near what the reading viewport already does. The container renders its title and children. Links point to other containers.
- **Effort:** Medium — reframe reading viewport as the primary navigation surface, not a "detail view" reached from the canvas.
- **Value:** Highest — this is the core reading and navigation experience.

### 3. Graph Viz (Obsidian-style)
A spatial canvas showing nodes and edges. The current React Flow canvas, but improved: node grouping, layout algorithms, filtering by kind/type, search.

- **Implementation:** Builds on the existing `CanvasView` in App.tsx. Needs layout engine (dagre), filtering, search.
- **Effort:** High — requires layout, interaction design, performance for large graphs.
- **Value:** High for exploration, low for reading. This is Phase 4+ per the architecture.

## Decision: MVP Path

**Start with the Root Node Page as the default first page.** It's the closest to what we have (the reading viewport), it's the most useful for reading and navigation, and it unblocks both roadmap self-hosting and master-node exploration.

### Phase 1 — Rethink first page (immediate)
1. The app no longer defaults to the React Flow canvas. On launch (no folder, no focused entity), show a **home page** listing root-level containers.
2. The home page is itself a container rendered in the reading viewport — `@home` or similar.
3. The canvas becomes one of three navigation options, accessible via a switcher. No longer the default.
4. Each navigation mode is URL-addressable: `/?view=tree`, `/?view=page`, `/?view=graph`.

### Phase 2 — Root node page as primary (next sprint after PRD0010)
1. The "page" view (current reading viewport) becomes the primary navigation surface.
2. Clicking linked entities (author, reference, annotation) navigates to their page instead of opening a side panel.
3. Side panel becomes a secondary view (for annotations/references alongside the main page).

### Phase 3 — Tree sidebar (next-next)
1. Add a collapsible tree sidebar showing the `contains` hierarchy.
2. Root-level containers at top. Expand to drill down.
3. Clicking any item navigates the main page view to that entity.

### Phase 4 — Graph viz improvements
1. Only after the page view and tree are solid.
2. Proper layout, filtering, search, node grouping.
3. The roadmap itself visualized here.

### Phase 5 — Self-hosting roadmap
1. The roadmap.md and changelog.md are expressed as entities and relations.
2. Navigable through all three modes. This dogfoods the product.

## What this unblocks

| Goal | Blocked by | Now unblocked via |
|------|-----------|-------------------|
| Adding master nodes (william-shakespeare) | No place to show them | Root node page container listing |
| Roadmap visualization | Canvas is priority-gated | Phase 5, after tree + page are solid |
| URL-addressable views | Canvas-only routing | `?view=` param + entity routing |
| Author → Works navigation | No link-to-link flow | Root node page with inline relations |

## Risks

- **Re-routing the app away from the canvas** is a mental shift for existing users. Mitigation: the canvas is still accessible via the mode switcher.
- **Three navigation modes = three renderers to maintain.** Mitigation: they share the same data layer and Node component. The projection layer abstraction (M3) is the long-term solution.
- **URL-addressable views add routing complexity.** Mitigation: keep it simple — a query parameter for the mode and an entity ID in the path. No nested routes.

## Open questions

| # | Question | Status |
|---|----------|--------|
| A | Where does the folder tree sidebar live? Always visible or toggleable? | TBD |
| B | Should the "page" view show one container at a time or flatten descendants (like current viewport)? | TBD |
| C | How does the mode switcher UI look? (tabs, dropdown, sidebar toggle?) | TBD |
