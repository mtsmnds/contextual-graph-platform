# Architecture

## Purpose
How the system is designed and where core responsibilities live.

## System Architecture

```
Entity Graph → Projection Layer → Renderer
```

The core is a **Relation-Native Content Engine**. Entities carry content directly. Relations carry typed links. Projections interpret the graph for a specific use case. Renderers display projections.

React Flow will be reintroduced as one renderer among many (graph visualization) in Phase 4. It is NOT the core runtime.

Guiding principle: *The graph is infrastructure. The viewport is the product. Renderers are interchangeable. Contextual reading is the core interaction.*

## System Style
- Architecture style: React SPA with a content-graph engine at the core
- Deployment style: Tauri-packaged desktop app (dev via `npm run dev`)
- Execution model: Client-side SPA, no server

## Tech Stack
- Vite 8 + React 19 + TypeScript
- Zustand 5 — global state
- @xyflow/react (React Flow) — optional graph renderer (Phase 4+, installed but not imported)
- @phosphor-icons/react — icon library
- Native CSS nesting (no preprocessor)
- TipTap — rich text editor (future)
- @dagrejs/dagre — auto-layout (future)

## Build Pipeline
Entrypoint: `npm run build` → `vite build`

1. **Vite dev** (`npm run dev`) — esbuild transpilation, HMR, static file serving.
2. **Production build** (`npm run build`) — rolldown bundling, CSS/JS minification, output to `dist/`.

## Data Contracts

### Domain Model (`src/types/graph.ts`)

#### Entity
The atomic semantic object. Two roles:

- **Containers** (`kind: "container"`) — structural labels with `title`. Their body content lives in a separate content store (`react-roadmap:content:{id}` in localStorage), not inline on the entity. This keeps the graph lightweight and queryable without parsing document bodies. Examples: work ("Hamlet"), note ("Meeting Notes").
- **Segments** (`kind: "segment"`) — legacy content carriers from the hamlet import. They have both `title` and inline `content` (plain text). New documents use containers with external content storage instead.

```ts
type EntityKind = "segment" | "container" | "annotation" | "concept" | "summary"

type Entity = {
  id: string
  kind: EntityKind
  title?: string         // container heading or segment label
  content?: string       // LEGACY: body text for hamlet segments only. Containers store content externally via getContent/saveContent.
  metadata: Record<string, unknown>   // type-specific data (e.g. character name, work type)
}
```

#### Relation
Typed edge between entities. No `EdgeBehavior` — behavior belongs to the interaction layer, not storage.

```ts
type RelationType = "contains" | "next" | "references" | "annotates" | "summarizes" | "related_to"

type Relation = {
  id: string
  source: string
  target: string
  type: RelationType
  metadata: Record<string, unknown>
}
```

Key relation patterns:
- `contains` — hierarchy (work → act → scene → segments)
- `next` — document order chain within a container
- `annotates` — annotation linked to a segment
- `references` — cross-work reference

#### View State
Separate from domain state entirely.

```ts
type ViewState = {
  focusedEntityId: string | null   // the root container in view (resolved to work)
  anchorEntityId: string | null    // the original entity clicked (for breadcrumb)
  visibleEntityIds: string[]
  expandedPanels: string[]
}
```

### Store (`src/store/useGraphStore.ts`)
- `entities: Entity[]` — domain graph entities (lightweight: no inline content for containers).
- `relations: Relation[]` — typed edges.
- `view: ViewState` — UI-only state, separate from domain.
- `contentLoaded: Record<string, boolean>` — tracks which container contents have been loaded from storage.
- Mutations: `addEntity`, `updateEntity`, `deleteEntity`, `addRelation`, `removeRelation`.
- View actions: `focusEntity(id, anchorId?)`, `expandPanel`, `closePanel`.
- Content actions: `getContent(id)` — reads from localStorage key `react-roadmap:content:{id}` and caches; `saveContent(id, data)` — writes to localStorage; `clearContent(id)` — removes from localStorage. Container document bodies are NOT stored on the entity.
- ID scheme: New containers use `generateDocId()` (timestamp-based `doc_{timestamp}`); segments use `{parent}_seg-{counter}`; root entities use slugified title.
- Persistence: localStorage — auto-save is debounced (300ms) to key `react-roadmap:graph` on every entity/relation change.
- Initialization: On first load (no stored data), seed data is loaded from `src/data/seed.ts` (two containers with Tiptap content) and written to localStorage.
- URL sync: On view state change, `focusedEntityId` and `anchorEntityId` are synced to URL search params (debounced 200ms, `history.replaceState`). On app load, URL params are read to restore the view.

### Query Engine (`src/engine/queries.ts`)
Pure functions over store state — no hooks, no components:

```ts
getEntity(state, id): Entity | undefined
getRelations(state, entityId): Relation[]
getSequentialContext(state, entityId): { prev?: Entity; next?: Entity } | null
getLinkedContext(state, entityId): { entity: Entity; relation: Relation }[]

getContainerChildren(state, containerId, depth?): Entity[]
  // Recursive: returns all descendant segments flattened.
  // Sub-containers (acts, scenes) are kept as visual dividers;
  // their children (speeches, stage directions) follow inline.

resolveContainer(state, entityId): string
  // Walks up `contains` relations to the root (work-level container).

getContainerBreadcrumb(state, containerId): { id: string; title: string }[]
  // Path from root to the given entity (e.g. "Hamlet / Act I / Scene I").
```

### Reading Viewport
The reading viewport (`src/renderers/ReadingViewport.tsx`) is the primary renderer.

- **Scope**: When the user clicks any entity on the canvas, `resolveContainer` finds the root work. `getContainerChildren` flattens all descendants into a single scrollable list. The root entity (work) renders first as SegmentCard, then all children in order.
- **Navigation**: Free scrolling is the primary interaction. The breadcrumb shows position in the hierarchy. Clicking a breadcrumb item refocuses the root with that item as anchor (same view, scrolled position).
- **SegmentCard variants**: Act, scene, title-page, front-matter, stage-direction, character speech, end-matter, dramatis-personae — each renders with appropriate typography and spacing.
- **Navigation**: The app is a single-mode reading workspace. `focusedEntityId === null` shows the HomePage (root container listing). `focusedEntityId !== null` shows the ReadingViewport with TipTap editing. Sidebar (`AppSidebar`) provides persistent page navigation.

### Output / State
- `dist/` — production build.
- Store persists to `localStorage` under key `react-roadmap:graph`. On first visit (no stored data), seed data from `src/data/seed.ts` is loaded automatically.

## Module Map

| Path | Role |
|------|------|
| `src/main.tsx` | App entrypoint |
| `src/App.tsx` | Root component — SidebarProvider + AppSidebar + HomePage/ReadingViewport routing |
| `src/components/AppSidebar.tsx` | Permanent shadcn sidebar — page list, home link, new page button |
| `src/components/HomePage.tsx` | Home page — root container cards, new page CTA, save status |
| `src/types/graph.ts` | Entity/Relation/ViewState type definitions |
| `src/store/useGraphStore.ts` | Zustand store (domain + view state + persistence) |
| `src/engine/` | Query engine (getEntity, getRelations, getSequentialContext, getLinkedContext, getContainerChildren, resolveContainer, getContainerBreadcrumb) |
| `src/renderers/ReadingViewport.tsx` | Continuous-scroll reading viewport with SegmentCard variants |
| `src/data/seed.ts` | Seed data (2 containers with Tiptap content, loaded on first visit) |
| `src/components/ui/` | shadcn/ui components (sidebar, button, etc.) |
| `src/lib/utils.ts` | cn() utility for Tailwind class merging |
| `src/index.css` | Global styles, Tailwind theme, shadcn CSS variables, dark mode |
| `scripts/import-gutenberg.ts` | Gutenberg HTML → JSON converter |
| `dist/` | Build output (gitignored) |

## Change Impact
- Schema change → update `src/types/graph.ts` + `dev-docs/architecture.md` + `dev-docs/changelog.md` + ADR.
- Store action change → update `src/store/useGraphStore.ts` + `dev-docs/architecture.md`.
- Query engine addition → update `src/engine/` + `dev-docs/architecture.md`.
- Pipeline change → update this doc + `dev-docs/changelog.md` + ADR.

## Verification
- `npx tsc --noEmit` — type check.
- `npm run build` — production build.

## Related Docs
- `requirements.md` — intent and constraints.
- `roadmap.md` — priorities.
- `changelog.md` — history.
- `AGENTS.md` — operating conventions.
- `dev-docs/prd0001-contextual-graph-platform/contextual_graph_platform_architecture_review.md` — full review rationale.
