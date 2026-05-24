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

### ~~II.5 Define core data types in MongoDB~~ — MongoDB deferred (see I.4). Schema changes (`sortOrder` on Relation, `createdAt`/`updatedAt` on Entity) implemented directly in Zustand store + `src/types/graph.ts`. Field renames (source→sourceId, type→relationType, metadata→meta) were not done — existing field names preserved.

### ~~II.6 Data API layer~~ — not implemented as a separate `data-api.ts` module. `src/engine/queries.ts` handles query functions (`queryThread`, `getContainerChildren`, etc.) and the Zustand store handles CRUD directly (auto-sync to persistence adapter). No wrapping abstraction needed at this scale.

### ✅ II.7 Install React Flow, render static graph — done (PRD0026)

### ✅ II.8 Node and edge CRUD via React Flow — done (PRD0027, PRD0028a, PRD0028b). All mutations go through Zustand store actions. React Flow is a view, not source of truth.

### ✅ II.9 Implement queryThread — done as part of PRD0025 (schema + sortOrder + queryThread). Implemented in `src/engine/queries.ts`.

### ~~II.10 Thread view component~~ — moved to i2 (m7+)

~~A vertical list component that renders the output of `queryThread`. Each block shows:~~

~~1. **Node content** — plain text for now (Tiptap integration deferred to after m3 converges)~~
~~2. **Metadata strip** — node ID (truncated), entity kind, edge count (number of other relations this node has)~~
~~3. **Inline inspector** — clicking edge count expands to show all relations for this node~~

~~Mount this as a panel alongside (or replacing) the React Flow canvas. Both are views of the same graph.~~

### ~~II.11 Query builder UI~~ — moved to i2 (m7+)

~~Dead simple — no query language:~~

~~- **Dropdown 1:** Select target node (populated from all entities in the store)~~
~~- **Dropdown 2:** Select relation type (populated from all distinct `relationType` values)~~
~~- **Button:** "Show Thread" → calls `queryThread`, renders thread view~~

~~This is the primary user interaction: changing one dropdown switches between "book content" and "book notes" on the same target.~~

### ~~II.12 Highlight active thread in the graph~~ — moved to i2 (m7+)

~~When a thread is shown in the thread view, the corresponding nodes and edges are highlighted in the React Flow canvas. This bridges the two views — the user sees the thread as a list and the same data highlighted in the graph.~~

---

~~## Dependencies & Sequencing~~ — all implemented items completed. Remaining items (II.10–II.12) moved to i2.

~~## Open Decisions~~ — all resolved:
1. ~~MongoDB vs. DexieJS~~ → DexieJS kept. MongoDB not needed at current scale.
2. ~~Schema evolution~~ → Existing `Entity`/`Relation` types extended (not replaced). `sortOrder` and `createdAt`/`updatedAt` added.
3. ~~`sortOrder` scope~~ → Universal on all relation types, using fractional indexing.
4. ~~Tiptap in thread view~~ → Deferred to i2. Plain text first.
5. ~~Data API vs. store~~ → Zustand store handles CRUD directly. Query functions in `src/engine/queries.ts`. No separate data-api layer.
