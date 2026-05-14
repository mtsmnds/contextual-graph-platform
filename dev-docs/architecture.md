# Architecture

## Purpose
How the system is designed and where core responsibilities live.

## System Architecture

```
Entity Graph → Projection Layer → Renderer
```

The core is a **Relation-Native Content Engine**. Entities carry content directly. Relations carry typed links. Projections interpret the graph for a specific use case. Renderers display projections.

React Flow is one renderer among many (graph visualization), introduced in Phase 4. It is NOT the core runtime.

Guiding principle: *The graph is infrastructure. The viewport is the product. Renderers are interchangeable. Contextual reading is the core interaction.*

## System Style
- Architecture style: React SPA with a content-graph engine at the core
- Deployment style: Tauri-packaged desktop app (dev via `npm run dev`)
- Execution model: Client-side SPA, no server

## Tech Stack
- Vite 8 + React 19 + TypeScript
- Zustand 5 — global state
- @xyflow/react (React Flow) — optional graph renderer (Phase 4+)
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
The atomic semantic object. Content is native — no separate `docId` indirection.

```ts
type EntityKind = "segment" | "container" | "annotation" | "concept" | "summary"

type Entity = {
  id: string
  kind: EntityKind
  title?: string
  content?: string        // rich text, native to entity
  metadata: Record<string, unknown>   // product-specific fields (e.g. status, priority)
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

#### View State
Separate from domain state entirely.

```ts
type ViewState = {
  focusedEntityId?: string
  visibleEntityIds: string[]
  expandedPanels: PanelState[]
  layout?: LayoutState
}
```

### Store (`src/store/useGraphStore.ts`)
- `entities: Entity[]` — domain graph entities.
- `relations: Relation[]` — typed edges.
- `view: ViewState` — UI-only state, separate from domain.
- Mutations: `addEntity`, `updateEntity`, `deleteEntity`, `addRelation`, `removeRelation`.
- View actions: `focusEntity`, `expandPanel`, `promotePanel`.

### Output / State
- `dist/` — production build.
- Store persisted to localStorage initially; SQLite (via Tauri) later.

## Module Map

| Path | Role |
|------|------|
| `src/main.tsx` | App entrypoint |
| `src/App.tsx` | Root component — routes to active renderer |
| `src/types/graph.ts` | Entity/Relation type definitions |
| `src/store/useGraphStore.ts` | Zustand store (domain + view state) |
| `src/engine/` | Query engine: getEntity, getRelations, getSequentialContext, getLinkedContext |
| `src/renderers/` | Renderer implementations: reading, outline, graph (future) |
| `src/index.css` | Global styles, dark mode |

## Change Impact
- Schema change → update `src/types/graph.ts` + `dev-docs/architecture.md` + `dev-docs/changelog.md` + ADR.
- Store action change → update `src/store/useGraphStore.ts` + `dev-docs/architecture.md`.
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
