# AGENTS Guide

## Project Overview

A unified node-and-edge system powering two products from one core: a visual project roadmap and a relational reading workspace. Built with React + TypeScript on Vite, using @xyflow/react for graph rendering and Zustand for state.

## Build & Verify

```sh
npm install        # install deps
npm run dev        # dev server with HMR
npm run build      # production build to dist/
npm run preview    # serve production build locally
npx tsc --noEmit   # type checking (main TS verification)
npm run lint        # ESLint — only covers .js/.jsx, NOT .ts/.tsx
```

No test framework is configured. No pre-commit hooks.

## Project Overview

React 19 + TypeScript (strict) Vite SPA. Graph canvas via `@xyflow/react`, state via Zustand 5, icons via `@phosphor-icons/react`. Native CSS nesting — no preprocessor. Dark mode via `prefers-color-scheme` in `index.css`.

Store is pre-seeded with sample data (two Tiptap containers: "About This Workspace" and "Editor Playground").

## Before Implementing

1. Load the `dev-workflow` skill (`skill({ name: "dev-workflow" })`) — merged workflow for dev-docs management, PRD lifecycle (write/start/end/merge), and post-completion documentation.
2. Read in order: `README.md` → `dev-docs/requirements.md` → `dev-docs/architecture.md` → `dev-docs/roadmap.md` → `dev-docs/changelog.md` + `dev-docs/archive/`.

## After Completing

Run `npx tsc --noEmit` and `npm run build`, then load the `dev-workflow` skill (`skill({ name: "dev-workflow" })`) to keep docs current.

## Key Paths

| Path | Role |
|------|------|
| `src/main.tsx` | App entrypoint |
| `src/App.tsx` | Root component — BrowserRouter shell, routes `/` (WorkspaceRoot) and `/tiptap-editor-test` (LegacyApp) |
| `src/routes/WorkspaceRoot.tsx` | Graph canvas workspace — adapter init, full-height GraphCanvas |
| `src/routes/LegacyApp.tsx` | Original Tiptap editor app (mounted at `/tiptap-editor-test`) |
| `src/canvas/GraphCanvas.tsx` | React Flow graph with Background/Controls/MiniMap, edge inline editing, context menu, Panel buttons |
| `src/canvas/nodes/EntityNode.tsx` | Custom entity node — BaseNode + Badge + 4 handles + inline text editing + resize |
| `src/canvas/edges/EdgeLabel.tsx` | Custom edge component with inline label editing (double-click → input + combobox) |
| `src/components/base-handle.tsx` | Handle component (14px dot, 2px border, ::before hit-area expansion) |
| `src/components/base-node.tsx` | BaseNode layout components from reactflow.dev registry |
| `src/canvas/GraphContextMenu.tsx` | Manual positioned context menu (no Radix/shadcn — avoids trigger-wrapper conflicts with React Flow) |
| `src/engine/layout.ts` | Dagre LR layout: entities/relations → React Flow nodes/edges |
| `src/engine/queries.ts` | Query engine (getEntity, getRelations, getLinkedContext, getContainerChildren, etc.) |
| `src/types/graph.ts` | TypeScript types: Entity, Relation, ViewState, GraphSnapshot |
| `src/store/useGraphStore.ts` | Zustand store: entities, relations, view state + adapter-based persistence + version 1→2 migration |
| `src/store/persistence/` | Pluggable persistence adapters (IndexedDB default, FS Access opt-in) |
| `src/data/seed.ts` | Seed data (2 containers with Tiptap content) |
| `src/index.css` | Global styles (dark/light vars, React Flow edge label overrides) |
| `dist/` | Build output (gitignored — never patch manually) |
| `dev-docs/` | Requirements, architecture, roadmap, changelog, ADR archive |

## Rules

- **`dist/` is generated** — never edit manually.
- **ESLint ignores `.ts`/`.tsx`** — use `npx tsc --noEmit` for type checking.
- **Changelog: most recent on top** — entries sorted newest-to-oldest, grouped by `## YYYY-MM-DD`. Purpose/Rules section stays at the very top. No duplicate date headings.
- **Roadmap: flat lists only** — three sections (Now/Next/Later), no milestones or phases. Completed items go in changelog, not roadmap.
