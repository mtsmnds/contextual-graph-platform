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
- `adapterId: string | null` — which persistence adapter is active (`"indexeddb"` or `"fs-access"`).
- `folderName: string | null` — folder name when FS Access adapter is active.
- Initialization: `init(adapter)` — injects a `PersistenceAdapter` at startup, calls `loadWorkspace()`, applies version 1→2 migration (pads `createdAt`/`updatedAt` on entities, `sortOrder` on relations), loads container content docs. Falls back to seed data if the adapter returns no workspace.
- Mutations: `addEntity`, `updateEntity`, `deleteEntity`, `addRelation`, `updateRelation`, `removeRelation`.
- View actions: `focusEntity(id, anchorId?)`, `expandPanel`, `closePanel`.
- Content actions: `getContent(id)` — reads from in-memory content cache; `saveContent(id, data)` — writes to cache + adapter's `saveDocument()`; `clearContent(id)` — removes from cache + adapter's `deleteDocument()`. Container document bodies are NOT stored on the entity. `refreshFolderName()` — syncs `folderName` from the active adapter.
- ID scheme: New containers use `generateDocId()` (timestamp-based `doc_{timestamp}`); segments use `{parent}_seg-{counter}`; root entities use slugified title.
- Persistence: Auto-save is debounced (300ms) — writes `GraphSnapshot` (entities + relations) to the active adapter's `saveGraph()` on every entity/relation change. Content docs go through `saveDocument()`.
- URL sync: On view state change, `focusedEntityId` and `anchorEntityId` are synced to URL search params (debounced 200ms, `history.replaceState`). On app load, URL params are read to restore the view.

### Persistence Adapter Layer (`src/store/persistence/`)
Pluggable persistence backends behind a uniform interface. The store never touches persistence directly.

```ts
interface PersistenceAdapter {
  readonly id: AdapterType  // "indexeddb" | "fs-access"
  loadWorkspace(): Promise<WorkspaceSnapshot | null>
  saveGraph(snapshot: WorkspaceSnapshot): Promise<void>
  loadDocument(id: string): Promise<Record<string, unknown> | null>
  saveDocument(id: string, data: Record<string, unknown>): Promise<void>
  deleteDocument(id: string): Promise<void>
  getFolderName(): string | null
}
```

Implementations:
- **IndexedDBAdapter** — default adapter. Uses Dexie.js for IndexedDB access (async, unlimited quota for current scale). Table `graph` stores the workspace snapshot; table `documents` stores per-container content docs. No user interaction needed.
- **FSAccessAdapter** — optional, Chromium-only. Reads/writes `graph.json` in a user-picked folder. Per-container content stored as `documents/{id}.json`. Handle persisted in IndexedDB (`react-roadmap-fs` database) so the folder reconnects silently on reload without re-prompting. Shows a "Reconnect" button if permission was revoked — never calls `requestPermission()` without a user gesture.

Resolver (`src/store/persistence/resolver.ts`):
- Auto-detection: tries FS Access reconnection first, falls back to IndexedDB.
- Overridable via `VITE_PERSISTENCE_ADAPTER` env var or `?adapter=` URL param for testing.
- `App.tsx` calls `resolveAdapter().then(init)` once on mount.

### Query Engine (`src/engine/queries.ts`)
Pure functions over store state — no hooks, no components:

```ts
getEntity(state, id): Entity | undefined
getRelations(state, entityId): Relation[]
getLinkedContext(state, entityId): { entity: Entity; relation: Relation }[]

getContainerChildren(state, containerId, depth?): Entity[]
  // Recursive: returns all descendant segments flattened.
  // Children are ordered by relation.sortOrder (fractional-indexing).
  // Sub-containers (acts, scenes) are kept as visual dividers;
  // their children (speeches, stage directions) follow inline.

resolveContainer(state, entityId): string
  // Walks up `contains` relations to the root (work-level container).

getContainerBreadcrumb(state, containerId): { id: string; title: string }[]
  // Path from root to the given entity (e.g. "Hamlet / Act I / Scene I").
```

Store actions (live `useGraphStore`):

```ts
getEdgesForNode(id, direction?): Relation[]
  // Returns relations scoped to source (out), target (in), or both.

queryThread({ target, relationType }): Entity[]
  // Filters relations by target id + relation type, sorts by sortOrder,
  // maps to source entities. This is the "document" projection primitive.
```

### Reading Viewport
The reading viewport (`src/renderers/ReadingViewport.tsx`) is the legacy renderer (mounted at `/tiptap-editor-test`).

- **Scope**: When the user clicks any entity on the canvas, `resolveContainer` finds the root work. `getContainerChildren` flattens all descendants into a single scrollable list. The root entity (work) renders first as SegmentCard, then all children in order.
- **Navigation**: Free scrolling is the primary interaction. The breadcrumb shows position in the hierarchy. Clicking a breadcrumb item refocuses the root with that item as anchor (same view, scrolled position).
- **SegmentCard variants**: Act, scene, title-page, front-matter, stage-direction, character speech, end-matter, dramatis-personae — each renders with appropriate typography and spacing.
- **Navigation**: The app is a single-mode reading workspace. `focusedEntityId === null` shows the HomePage (root container listing). `focusedEntityId !== null` shows the ReadingViewport with TipTap editing. Sidebar (`AppSidebar`) provides persistent page navigation.

### Graph Canvas
The graph canvas (`src/canvas/GraphCanvas.tsx`) is the primary renderer at `/`.

- Renders a full-height React Flow canvas with `Background` (dots), `Controls`, `MiniMap`.
- Entities render as built-in `"default"` nodes. Relations render as built-in `"default"` edges with always-visible labels (CSS override on `.react-flow__edge-label`).
- **Panel buttons** (top-right): New Node, Open Folder, Re-layout.
- **Interactions:**
  - Double-click node → opens NodeDialog (edit mode)
  - Double-click edge → opens EdgeDialog (edit relation type + sortOrder)
  - Drag from node handle → creates edge with type "related_to"
  - Select + Backspace → deletes selected nodes/edges (node deletion cascades to relations)
  - Right-click node → context menu (Edit, Delete)
  - Right-click edge → context menu (Edit Relation, Delete Edge)
  - Right-click pane → context menu (New Node)
- **Sync:** Diff-based — positions live in React Flow state, never the store. Store changes add/remove nodes/edges by ID and merge data labels, preserving user-dragged positions.
- **Ref-capture:** Dagre layout computed once on mount. Re-layout button recomputes and resets all positions.

### Output / State
- `dist/` — production build.
- Store persists through the active `PersistenceAdapter`. Default adapter is IndexedDB (`react-roadmap` database). Optional FS Access adapter writes `graph.json` + `documents/` folder to a user-picked directory. On first visit (no stored data), seed data from `src/data/seed.ts` is loaded automatically.

## Module Map

| Path | Role |
|------|------|
| `src/main.tsx` | App entrypoint |
| `src/App.tsx` | Root component — BrowserRouter shell, routes `/` (WorkspaceRoot) and `/tiptap-editor-test` (LegacyApp) |
| `src/components/AppSidebar.tsx` | Permanent shadcn sidebar — page list, home link, new page button |
| `src/components/HomePage.tsx` | Home page — root container cards, new page CTA, save status |
| `src/types/graph.ts` | Entity/Relation/ViewState type definitions |
| `src/store/useGraphStore.ts` | Zustand store (domain + view state + adapter-based persistence) |
| `src/store/persistence/types.ts` | PersistenceAdapter interface, WorkspaceSnapshot, AdapterType |
| `src/store/persistence/indexeddb-adapter.ts` | IndexedDB adapter (Dexie) — default backend |
| `src/store/persistence/fs-access-adapter.ts` | FS Access adapter — optional, Chromium-only |
| `src/store/persistence/resolver.ts` | Adapter auto-detection, env/URL override |
| `src/store/persistence/index.ts` | Re-exports all persistence modules |
| `src/types/fs-access.d.ts` | File System Access API type declarations |
| `src/engine/layout.ts` | Dagre LR layout: entities/relations → React Flow nodes/edges |
| `src/engine/queries.ts` | Query engine (getEntity, getRelations, getSequentialContext, getLinkedContext, getContainerChildren, resolveContainer, getContainerBreadcrumb) |
| `src/canvas/GraphCanvas.tsx` | React Flow graph with Background/Controls/MiniMap, CRUD dialogs, context menu, Panel buttons |
| `src/canvas/NodeDialog.tsx` | Base UI Dialog for create/edit nodes |
| `src/canvas/EdgeDialog.tsx` | Base UI Dialog for edit edge relation type + sortOrder |
| `src/canvas/GraphContextMenu.tsx` | Manual positioned context menu (not shadcn/Radix — avoids trigger-wrapper conflicts with React Flow) |
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
