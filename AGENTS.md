# AGENTS Guide

## Build & Verify

```sh
npm install        # install deps
npm run dev        # dev server with HMR
npm run build      # production build to dist/
npm run preview    # serve production build locally
npx tsc --noEmit   # type checking (main TS verification)
npm run lint        # ESLint — only covers .js/.jsx, NOT .ts/.tsx
```

## Testing

- When you fix a bug, write a regression test that fails without the fix.
- When you add a pure function or store action, add unit tests.
- When you change behavior that has multiple call sites or timing dependencies
  (e.g. React Flow measurement → store → node builder), test each boundary.
- Don't test React component rendering or visual layout — only logic, state
  transitions, and data transformations.
- Run `npx vitest run` before committing. If vitest is not set up, set it up.

## Storybook

- New UI components need stories under `src/stories/`.
- When a PRD touches UI components, run story tests for affected stories
  (`storybook_run-story-tests` or `npx storybook test`) as part of verification.
- Presenters receive explicit props with `fn()` callbacks for actions.
- Interactive stories use stateful `render` wrappers for controlled components.


## Project Overview

A unified node-and-edge system powering two products from one core: a visual project roadmap and a relational reading workspace. Built with React + TypeScript on Vite, using @xyflow/react for graph rendering and Zustand for state.

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

## Code style

- Add a guard comment when code exists for a non-obvious reason — especially
  when removing or simplifying it would reintroduce a bug. Format:
  `// GUARD: <why this exists and what breaks without it>`
- Do NOT add comments that describe what code does. Only comment WHY.

## Canvas invariants

- All node dimensions must be snapped to the 16px grid via `snap16` / `snapCanvasDim`.
- There are three node-build sites in GraphCanvas.tsx (initial layoutRef, sync
  update, sync new-node). All three must set both `width` and `height` in the
  node style when canvasData has them. Use the shared `nodeStyle()` helper.
- `applyMeasuredDimensions` snaps measured values and writes them to canvasData.
  The node builder must read them back into style, or React Flow re-measures
  at raw DOM height and the snap is lost.
- Never gate height on width (e.g. `if width && height`). Height can exist
  independently.
