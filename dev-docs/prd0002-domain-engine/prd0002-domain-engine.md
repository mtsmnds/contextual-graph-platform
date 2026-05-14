# PRD0002 — Domain Engine

## Status
Draft — ready for implementation

## Problem

The current `src/types/graph.ts` and `src/store/useGraphStore.ts` tightly couple domain entities to React Flow internals:

- `AppNode` extends `Node<NodeData, NodeKind>` from `@xyflow/react`, pulling in `x`/`y` coordinates, width, selection state, drag handles — all viewport concerns — into what should be a pure domain model.
- Content is stored as a separate `documents: Record<string, string>` map keyed by `docId`, creating an indirection between entities and their content.
- `EdgeBehavior` lives on the domain edge data, but it's an interaction-layer concern the renderer should decide.
- `NodeStatus` is hardcoded into the universal type, making it roadmap-product-specific.

This coupling makes it impossible to build a reading workspace (M2) without dragging React Flow canvas complexity into the reading experience. It also makes AI-agent implementation brittle — agents inevitably fight React Flow internals instead of product logic.

## Goal

Decouple the domain model from React Flow. Establish the Entity/Relation schema as the source of truth. React Flow becomes a consumer of the domain, not its container.

## Scope

**In scope:**
- New `Entity` / `Relation` / `ViewState` types in `src/types/graph.ts`
- Rewrite `src/store/useGraphStore.ts` to hold domain state and view state separately
- Create `src/engine/queries.ts` with the query engine
- Create an adapter bridge so the existing React Flow canvas continues to render during the transition
- Migrate existing seed data (phase/task nodes) to the new schema
- Add reading-oriented seed content (Hamlet excerpts)
- Remove all old coupled types and dead code

**Out of scope:**
- Persistence layer (next sprint — PRD0003)
- Custom node components (M2)
- Reading viewport UI (M2)
- Any edge behavior implementation (M2+)

## Design

### 1. Types (`src/types/graph.ts`)

Replace the current React-Flow-coupled types with three pure domain types:

```ts
// ---- Domain types (pure, no framework dependency) ----

type EntityKind =
  | "segment"   // a passage of text
  | "container" // a group/collection (chapter, act, phase)
  | "annotation" // a note attached to another entity
  | "concept"   // a named idea or term
  | "summary"   // a condensed version of another entity

type Entity = {
  id: string
  kind: EntityKind
  title?: string
  content?: string
  metadata: Record<string, unknown>
}

type RelationType =
  | "contains"
  | "next"
  | "references"
  | "annotates"
  | "summarizes"
  | "related_to"

type Relation = {
  id: string
  source: string
  target: string
  type: RelationType
  metadata: Record<string, unknown>
}
```

Plus a separate view state type:

```ts
// ---- View state (UI-only, separate from domain) ----

type ViewState = {
  focusedEntityId: string | null
  visibleEntityIds: string[]
  expandedPanels: string[]
}
```

These types import NOTHING from `@xyflow/react`. The old `AppNode`, `AppEdge`, `NodeKind`, `EdgeKind`, `EdgeBehavior`, `NodeStatus`, `NodeData`, `EdgeData` are all removed.

### 2. Store (`src/store/useGraphStore.ts`)

Rewritten to hold three slices:

```ts
interface GraphStore {
  // Domain state
  entities: Entity[]
  relations: Relation[]

  // View state (UI-only)
  view: ViewState

  // Domain mutations
  addEntity: (kind: EntityKind, data?: Partial<Entity>) => string
  updateEntity: (id: string, data: Partial<Entity>) => void
  deleteEntity: (id: string) => void
  addRelation: (source: string, target: string, type: RelationType) => void
  removeRelation: (id: string) => void

  // View actions
  focusEntity: (id: string | null) => void
  expandPanel: (entityId: string) => void
  closePanel: (entityId: string) => void
}
```

All React Flow imports (`applyNodeChanges`, `applyEdgeChanges`, `OnNodesChange`, `OnEdgesChange`) are removed from the store. The store no longer knows about React Flow.

Seed data is migrated:

```ts
// Domain entities (pure)
entities: [
  { id: "phase_1", kind: "container", title: "Phase 1", content: "Initial project phase.", metadata: { status: "active" } },
  { id: "task_1", kind: "segment", title: "Research", content: "Research phase tasks.", metadata: { status: "in-progress" } },
  { id: "task_2", kind: "segment", title: "Implementation", content: "Build phase.", metadata: { status: "pending" } },
  // Reading seed content
  { id: "hamlet_1", kind: "segment", title: "Hamlet — Act 1, Scene 1", content: "Who's there?", metadata: { source: "hamlet" } },
  { id: "hamlet_2", kind: "segment", title: "Hamlet — Act 3, Scene 1", content: "To be, or not to be, that is the question.", metadata: { source: "hamlet" } },
  { id: "note_1", kind: "annotation", title: "Notable opening", content: "The play opens with a question of identity.", metadata: {} },
]

// Relations (pure)
relations: [
  { id: "rel_1", source: "phase_1", target: "task_1", type: "contains", metadata: {} },
  { id: "rel_2", source: "phase_1", target: "task_2", type: "contains", metadata: {} },
  { id: "rel_3", source: "task_1", target: "task_2", type: "next", metadata: {} },
  { id: "rel_4", source: "hamlet_2", target: "note_1", type: "annotates", metadata: {} },
  { id: "rel_5", source: "hamlet_1", target: "hamlet_2", type: "next", metadata: {} },
]
```

### 3. Query Engine (`src/engine/queries.ts`)

Pure functions over the store state — no hooks, no components:

```ts
function getEntity(state: GraphStore, id: string): Entity | undefined
function getRelations(state: GraphStore, entityId: string): Relation[]
function getSequentialContext(state: GraphStore, entityId: string): { prev?: Entity; next?: Entity } | null
function getLinkedContext(state: GraphStore, entityId: string): { entity: Entity; relation: Relation }[]
```

These are used by renderers (reading viewport, outline, etc.) and will be the primary data access API going forward.

### 4. React Flow Bridge (`src/App.tsx`)

The canvas still renders, but it consumes domain state through a thin adapter:

```ts
// In App.tsx or a helper
function useCanvasAdapter() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)
  // Transform Entity[] into the shape React Flow expects
  // (assign positions from an auto-layout or stable defaults)
}
```

This adapter is temporary — it exists so the app never regresses visually while we refactor. It will be replaced by proper renderers in M2–M4.

## File Changes

| File | Action |
|------|--------|
| `src/types/graph.ts` | Rewrite — replace AppNode/AppEdge/etc with Entity/Relation/ViewState |
| `src/store/useGraphStore.ts` | Rewrite — domain state + view state, no React Flow imports |
| `src/engine/queries.ts` | Create — query engine (getEntity, getRelations, getSequentialContext, getLinkedContext) |
| `src/App.tsx` | Update — add canvas adapter bridge, keep React Flow rendering |
| `src/main.tsx` | No change |
| `src/index.css` | No change |
| `dev-docs/requirements.md` | Update — reflect new type ontology |
| `dev-docs/architecture.md` | Already updated |

## Implementation Steps

### Step 1 — Define new types in `src/types/graph.ts`

Write the `Entity`, `Relation`, `ViewState` types. Remove all old types (`AppNode`, `AppEdge`, `NodeKind`, `EdgeKind`, `EdgeBehavior`, `NodeStatus`, `NodeData`, `EdgeData`). Remove the `@xyflow/react` import.

### Step 2 — Rewrite store in `src/store/useGraphStore.ts`

Replace `nodes`/`edges`/`documents` with `entities`/`relations`/`view`. Remove all React Flow imports (`applyNodeChanges`, `applyEdgeChanges`, `OnNodesChange`, `OnEdgesChange`, `OnConnect`). Implement the new mutation API. Migrate seed data to new schema (including reading content).

### Step 3 — Create `src/engine/queries.ts`

Implement the four query functions as pure functions over store state. Export them.

### Step 4 — Update `App.tsx` with canvas adapter

Create a `useCanvasAdapter` hook that transforms `entities`/`relations` into React Flow nodes/edges with default positions. Keep `ReactFlow` rendering working. This is the bridge that prevents visual regression.

### Step 5 — Cleanup

- Delete `src/App.css` if it exists and is unused
- Remove any remaining references to old types across the codebase
- Verify `npx tsc --noEmit` passes with zero errors
- Verify `npm run build` succeeds

### Step 6 — Verify

- App loads and displays the React Flow canvas with all seed entities/relations
- Old roadmap seed data renders identically to before (same 3 nodes + 1 edge)
- New reading seed data is present in the store (can verify via console or temporarily render entity list)
- No `@xyflow/react` types appear in `src/types/graph.ts` or `src/store/useGraphStore.ts`

## Acceptance Criteria

1. `src/types/graph.ts` imports nothing from `@xyflow/react`
2. `src/store/useGraphStore.ts` imports nothing from `@xyflow/react`
3. Store exposes `entities: Entity[]`, `relations: Relation[]`, `view: ViewState`
4. All old `AppNode`/`AppEdge`/`NodeKind`/`EdgeKind`/`EdgeBehavior`/`NodeStatus`/`NodeData`/`EdgeData` types are deleted
5. All old mutation names (`addNode`, `deleteNode`, `addEdge`, `deleteEdge`, `updateDocument`, `onNodesChange`, `onEdgesChange`) are removed
6. New mutations (`addEntity`, `updateEntity`, `deleteEntity`, `addRelation`, `removeRelation`) are implemented
7. View actions (`focusEntity`, `expandPanel`, `closePanel`) are implemented
8. Query engine exports four functions: `getEntity`, `getRelations`, `getSequentialContext`, `getLinkedContext`
9. Seed data includes both roadmap content (phase/task) and reading content (Hamlet excerpts + annotation)
10. `npx tsc --noEmit` passes with zero errors
11. `npm run build` succeeds
12. The app loads and shows a React Flow canvas with the seed data rendered

## Verification

```sh
npx tsc --noEmit
npm run build
npm run dev   # manual: confirm canvas renders seed data
```
