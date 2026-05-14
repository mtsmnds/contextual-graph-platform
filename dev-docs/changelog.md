# Changelog

## Purpose
Significant completed changes with reasoning and references.
Use this to recover context after breaks.

## Entry Rules
- Completed, meaningful changes only (not tentative ideas).
- Short entries: what changed, why, impact.
- Significant design/process changes need a paired ADR in `archive/`.

---

## 2026-05-13

### Persistence layer — PRD0003
- **What:** Added localStorage auto-save with debounce, startup hydration, and manual export/import of entities and relations. Domain state survives page refresh for the first time.
- **Reason:** The graph store was entirely in-memory — any work was lost on refresh. Persistence is a prerequisite for the reading workspace (M2) where users need to keep annotations and notes across sessions.
- **Files changed:**
  - `src/types/graph.ts`: Added `GraphSnapshot` type
  - `src/store/useGraphStore.ts`: Added `loadInitialState()` hydration, debounced auto-save subscription, `exportGraph` (JSON download), `importGraph` (replace state)
- **Impact:** State persists automatically. Manual export/import enables backups and sharing. Foundation for future SQLite storage (PRD0003 out of scope: no schema migrations, no settings UI).
- **Archive:** `archive/2026-05-13-persistence-layer.md`

---

## 2026-05-13

### Domain engine refactor — PRD0002
- **What:** Replaced the React-Flow-coupled AppNode/AppEdge types with a pure Entity/Relation domain model. Rewrote the store to hold separate domain state and view state. Created the query engine. Added a canvas adapter bridge to keep React Flow rendering alive during the transition.
- **Reason:** The old architecture treated React Flow nodes as domain entities, mixing viewport state (coordinates, dragging, selection) with the semantic model. The new model decouples state from rendering, enabling the reading workspace (M2) without fighting canvas internals.
- **Files changed:**
  - `src/types/graph.ts`: Rewrote — Entity/Relation/ViewState types, removed AppNode/AppEdge/NodeKind/EdgeKind/EdgeBehavior
  - `src/store/useGraphStore.ts`: Rewrote — entities/relations/view slices, no React Flow imports
  - `src/engine/queries.ts`: Created — getEntity, getRelations, getSequentialContext, getLinkedContext
  - `src/App.tsx`: Updated — canvas adapter bridge transforms domain entities to React Flow nodes
  - `src/App.css`: Deleted (unused Vite template residuals)
  - `dev-docs/requirements.md`: Updated — reflects new type ontology
  - `dev-docs/architecture.md`: Already updated in prior commit
- **Impact:** Domain model is now framework-agnostic. Store is simpler and testable. React Flow canvas still renders the same seed data. Foundation for reading workspace laid.
- **ADR:** `archive/2026-05-13-domain-engine-refactor.md`

---

## 2026-05-13

### Architectural pivot: decouple domain model from React Flow
- **What:** Adopted the architecture review recommendation to restructure the system as Entity Graph → Projection Layer → Renderer. React Flow demoted from core runtime to optional spatial renderer (Phase 4+). Roadmap reordered to validate contextual reading before graph visualization.
- **Reason:** The original plan coupled domain state to canvas coordinates and React Flow internals, which would make reading workspace UX brittle. Decoupling lets us validate the core interaction (contextual reading) without fighting canvas complexity.
- **Files changed:**
  - `dev-docs/roadmap.md`: Full rewrite with 4 new milestones
- **Impact:** The immediate work shifts from building custom graph nodes to refactoring the domain schema and building a reading workspace. React Flow work deferred to Phase 4.

---

## 2026-05-13

### Typed graph schema and Zustand store
- **What:** Created the typed data layer and global state management for the graph system, replacing the stock Vite template.
- **Reason:** Establish the foundation before building any UI — NodeKind/EdgeKind types, store actions, and a React Flow canvas.
- **Files changed:**
  - `src/types/graph.ts`: Node/Edge TypeScript types with React Flow integration
  - `src/store/useGraphStore.ts`: Zustand store with mutation actions and seed data
  - `src/App.tsx`: React Flow canvas (replaced stock Vite demo template)
  - `src/main.tsx`: Entrypoint (migrated to TypeScript)
  - `tsconfig.json`: Strict TypeScript config
  - `package.json`: Added typescript, zustand
  - `index.html`: Script ref → main.tsx
- **Impact:** Foundation for all future graph features. No visual custom nodes yet.
- **ADR:** N/A — scaffolding, not a design decision requiring an ADR.
