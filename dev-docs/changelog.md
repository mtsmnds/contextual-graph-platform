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

### Continuous scroll viewport — PRD0005
- **What:** Replaced the single-segment reading viewport with a container-aware scrollable view. Containers now render all child segments stacked vertically — acts as large headings, scenes as medium headings, character speeches with labels, stage directions in italic. Breadcrumb navigation shows the container path. Canvas clicks resolve to the parent container so users enter the reading viewport at the work level, not the segment level. Added `getContainerChildren`, `resolveContainer`, and `getContainerBreadcrumb` to the query engine.
- **Reason:** The segment-by-segment prev/next model destroyed reading flow for long-form text. The UX vision requires continuous vertical scrolling as the primary reading axis, with segments as the content *of* a work, not separate pages.
- **Files changed:**
  - `src/renderers/ReadingViewport.tsx`: Rewrote — SegmentCard variants for act/scene/character/stage-direction/annotation, breadcrumb header, prev/next within container children
  - `src/engine/queries.ts`: Added `getContainerChildren` (ordered child chain resolution), `resolveContainer` (walk up contains to find parent), `getContainerBreadcrumb` (path traversal)
  - `src/App.tsx`: Updated — canvas click resolves to parent container via `resolveContainer`
  - `src/store/useGraphStore.ts`: Updated seed data — added `contains` relations for all hamlet segments under act_1, added `type: "act"` metadata
  - `dev-docs/roadmap.md`: Updated milestones and sprint order
  - `dev-docs/plans/prd0005-hamlet-import.md` → `prd0006-hamlet-import.md`: Renumbered
- **Impact:** Reading viewport now works like a book — scroll through the full text. Container resolution means clicking any node on the canvas opens its work context. Foundation laid for side-panel expansion and multi-column reading.

---

## 2026-05-13

### Reading viewport + shadcn/ui — PRD0004
- **What:** Built the first real renderer — a focused reading viewport that displays entity content with prev/next navigation. Added Tailwind v4 and shadcn/ui (Base UI) as the component foundation. Canvas now supports click-to-focus mode switching.
- **Reason:** The canvas adapter bridge was temporary — the product validates on a clean reading experience. shadcn/ui provides high-quality accessible components without obscuring custom styles, laying a scalable design foundation.
- **Files changed:**
  - `src/renderers/ReadingViewport.tsx`: Created — focused entity display with prev/next/back navigation
  - `src/App.tsx`: Updated — mode-switch rendering (canvas vs viewport), onNodeClick wiring
  - `src/index.css`: Replaced Vite template styles with full shadcn/Tailwind theme, cleaned up conflicts
  - `index.html`: Added dark mode class toggle script
  - `vite.config.js`: Added tailwindcss plugin, @/ path alias
  - `tsconfig.json`: Added @/ path alias
  - `package.json`: Added tailwindcss, @tailwindcss/vite
  - `src/components/ui/button.tsx`: Created by shadcn init
  - `src/lib/utils.ts`: Created by shadcn init (cn utility)
  - `dev-docs/visual-design.md`: Created — design principles and conventions
- **Impact:** First real renderer replaces the temporary canvas bridge. Prev/Next navigation works via query engine. Component foundation clean and scalable.

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
