# i1 Graph Canvas — Initiative PRD

## Overview

Two-phase initiative running in parallel with m3 (Tiptap). Phase I isolates the current product behind a router so the graph canvas can grow without destabilizing the editor. Phase II builds the graph canvas itself — React Flow rendering, node/edge CRUD, ~~query-driven thread views, and a query builder UI.~~ (moved to i2)

The core thesis: documents are projections of graph queries. Every paragraph is an entity with a stable UUID. Every connection between entities is a typed, directed relation with sort order. What we call a "document" is `queryThread({ target, relationType })` rendered as an ordered list.

## Update


---

## Phase I — Isolate Current Product

### I.1 Add routing

**PRD:** `dev-docs/plans/m4-prd0024-(i1).md`

Install `react-router-dom`, create two routes:
- `/tiptap-editor-test` — mounts the current app as-is (exact behavior preserved, including query param handling)
- `/` — placeholder shell for the graph canvas workspace

The legacy app is extracted to `src/routes/LegacyApp.tsx`. A new `src/routes/WorkspaceRoot.tsx` renders the sidebar shell + a placeholder. `App.tsx` becomes a thin `<BrowserRouter><Routes>...</Routes></BrowserRouter>`.

**Constraint:** Zero modifications to component, store, engine, or renderer code.

### I.2 Extract editor into own route component

The Tiptap editor and its reading viewport infrastructure live under `/tiptap-editor-test`. The graph canvas route (`/`) won't import them. This creates a clean module boundary — editor code can be removed or replaced without touching the canvas.

### I.3 Create new root shell

`WorkspaceRoot.tsx` shares `SidebarProvider`, `AppSidebar`, `SidebarTrigger` with the legacy app but renders the graph canvas (or a placeholder) in the main content area. This shell is the permanent app frame — different "renderers" (graph canvas, thread view, editor) swap into the content slot.

### ~~I.4 Install MongoDB / migrate from DexieJS~~ - deffered: using dexiejs until there is need for more, better, or different approach

~~**Open question** (see review above): server vs. local vs. embedded. The goal is to replace DexieJS with a more robust storage layer that supports queries across entities and relations without loading the entire graph into memory. The persistence adapter interface (`src/store/persistence/`) was designed for exactly this kind of swap — a MongoDB adapter implements `PersistenceAdapter` and the store doesn't change.~~

~~If MongoDB is the target, the adapter pattern means we can defer implementation and build the data API (step I.6) against DexieJS first, then swap the adapter later.~~

~~**Move to Later** if consensus is to validate the graph canvas on existing persistence first.~~

---

## Phase II — Graph Canvas

### II.5 Define core data types in MongoDB

Mapping from the existing `Entity`/`Relation` types to the proposed schema:

```
// Current (src/types/graph.ts)
Entity  → { id, kind, title?, content?, metadata }
Relation → { id, source, target, type, metadata }

// Proposed (extends current)
Entity  → { id, kind, content?, meta (was metadata), createdAt, updatedAt }
Relation → { id, sourceId (was source), targetId (was target),
             relationType (was type), sortOrder (new), meta (was metadata) }
```

Key additions:
- `sortOrder` on relations — enables ordered threads (paragraph order, chapter sequence)
- `createdAt`/`updatedAt` on entities — enables sync and conflict resolution
- UUID-based IDs (already the direction — current `generateUniqueId` produces semantic IDs; UUIDs make them stable across renames)

**Decision needed:** Replace the existing types or extend them? `sortOrder` is the only structural gap.

### II.6 Data API layer

A plain module (`src/engine/data-api.ts`), zero React imports. Wraps the store + persistence adapter behind a stable interface:

```ts
createNode(kind, content, meta?): string        // returns UUID
updateNode(id, patch: Partial<Entity>): void     // partial update, bumps updatedAt
deleteNode(id): void                              // cascades to edges
createEdge(sourceId, targetId, relationType, sortOrder?): string
deleteEdge(id): void
getEdgesForNode(id, direction?: "in" | "out" | "both"): Relation[]
queryThread(filter: { target: string; relationType: string }): Entity[]
```

`queryThread` is the foundation of the thread view:
1. Find all edges where `target = filter.target AND type = filter.relationType`
2. Sort by `edge.sortOrder`
3. Return the source entities in that order

This API is CRUD-complete for the graph. Every UI operation (React Flow, thread view, query builder) goes through this layer.

### II.7 Install React Flow, render static graph

Install `@xyflow/react` (already in package.json, stripped after PRD0015). Render nodes for every entity and edges for every relation. No interaction yet — just verify the graph renders.

Use Dagre for auto-layout (already in package.json as `@dagrejs/dagre`).

### II.8 Node and edge CRUD via React Flow

All mutations go through the data API (step II.6), not React Flow's internal state. React Flow is a view, not the source of truth.

| Action | Gesture | Behavior |
|--------|---------|----------|
| Add node | Double-click empty space | Creates entity, opens inline edit for kind + content |
| Edit node | Double-click existing node | Inline edit fields (kind, content, meta) |
| Delete node | Select + Backspace, or right-click menu | Calls `deleteNode(id)` — cascades to all edges |
| Add edge | Drag from handle to node | Prompts for `relationType`, assigns next `sortOrder` |
| Edit edge | Click edge label | Inline edit for relationType and sortOrder |
| Delete edge | Select + Backspace | Calls `deleteEdge(id)` |

Edge labels are always visible (no hover state). Exposing the graph is a design principle.

### II.9 Implement queryThread

The function from step II.6, implemented and tested independently. Key behaviors:

- `queryThread({ target: "book-moby-dick", relationType: "content" })` → all content paragraphs in order
- `queryThread({ target: "book-moby-dick", relationType: "note" })` → all notes about the book
- Returns `Entity[]` — the same type as any other entity, so rendering is uniform
- Zero-knowledge about what the caller will render — pure data

### II.10 Thread view component

A vertical list component that renders the output of `queryThread`. Each block shows:

1. **Node content** — plain text for now (Tiptap integration deferred to after m3 converges)
2. **Metadata strip** — node ID (truncated), entity kind, edge count (number of other relations this node has)
3. **Inline inspector** — clicking edge count expands to show all relations for this node

Mount this as a panel alongside (or replacing) the React Flow canvas. Both are views of the same graph.

### II.11 Query builder UI

Dead simple — no query language:

- **Dropdown 1:** Select target node (populated from all entities in the store)
- **Dropdown 2:** Select relation type (populated from all distinct `relationType` values)
- **Button:** "Show Thread" → calls `queryThread`, renders thread view

This is the primary user interaction: changing one dropdown switches between "book content" and "book notes" on the same target.

### II.12 Highlight active thread in the graph

When a thread is shown in the thread view, the corresponding nodes and edges are highlighted in the React Flow canvas. This bridges the two views — the user sees the thread as a list and the same data highlighted in the graph.

---

## Dependencies & Sequencing

```
Phase I:
  I.1 ──→ I.2 ──→ I.3 ──→ I.4 (deferred to Later, or parallel)

Phase II:
  II.5 ──→ II.6 ──→ II.7 ──→ II.8
                                   \
                                    ──→ II.9 ──→ II.10 ──→ II.11 ──→ II.12
```

II.7 and II.8 can proceed independently once II.6 is stable. II.9–II.12 are sequential.

---

## Open Decisions

1. **MongoDB vs. DexieJS** — server vs. local vs. embedded. See review question #1.
2. **Schema evolution** — extend existing `Entity`/`Relation` types or create new `Node`/`Edge` types?
3. **`sortOrder` scope** — universal on all relation types, or specific to ordering relations?
4. **Tiptap in thread view** — plain text blocks first, editor swap later, or wire Tiptap from the start?
5. **Data API vs. store** — wrapper around Zustand or standalone query layer that bypasses it?
