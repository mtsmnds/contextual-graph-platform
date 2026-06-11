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

- **Decorators for providers:** Use decorators for provider/layout wrapping
  (`SidebarProvider`, context providers, layout containers). Stories should only
  show the component and its props in the code panel. Use `parameters` for per-story
  configuration passed to the decorator.
- **Never wrapper components:** Never create wrapper components (e.g., `SidebarDemo`)
  as the story's `component`. Use real components directly in `render` or let the
  decorator + `component` default handle it.
- **JSDoc on every component:** Add a JSDoc description explaining what it does
  and when to use it. Storybook picks these up for the docs page.
- **ArgTypes with descriptions:** Every prop should have a description in `argTypes`,
  not just a type. One line explaining what it controls.
- **Stories are use cases, not prop permutations:** Each story should represent a
  meaningful, visually distinct state (e.g., "With multiple backups", "Empty workspace",
  "Loading state"). If two stories render identically, remove one.
- **Mock data fixtures:** Create mock data in a `__mocks__` or `__fixtures__` directory
  colocated with stories. Reuse across stories and tests.
- **Run story tests:** When a PRD touches UI components, run story tests for affected
  stories (`storybook_run-story-tests` or `npx storybook test`) as part of verification.
- **Presenters:** Accept explicit props with `fn()` callbacks for actions.
- **Interactive stories:** Use stateful `render` wrappers for controlled components.


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
| `src/routes/WorkspaceRoot.tsx` | Graph canvas workspace — IndexedDBAdapter init + beforeunload dirty check |
| `src/routes/LegacyApp.tsx` | Original Tiptap editor app (mounted at `/tiptap-editor-test`) |
| `src/canvas/GraphCanvas.tsx` | React Flow graph with Background/Controls/MiniMap, edge inline editing, context menu, Panel buttons, FSAdapter open pipeline |
| `src/canvas/nodes/EntityNode.tsx` | Custom entity node — canvas chrome div + handles + SegmentCard(ContentEditor) + resize |
| `src/canvas/edges/EdgeLabel.tsx` | Custom edge component with inline label editing (double-click → input + combobox) |
| `src/components/base-handle.tsx` | Handle component (14px dot, 2px border, ::before hit-area expansion) |
| `src/components/SegmentCard.tsx` | Portable card component for non-container entities — variant (bordered/none/hover), width prop, padding/layout built in |
| `src/components/ContainerCard.tsx` | Portable card frame for container entities — variant system, header slot, consumer-controlled children |
| `src/components/ContentEditor.tsx` | Reusable view/edit content editor — auto-sizing textarea, double-click to edit, no React Flow dependency |
| `src/canvas/GraphContextMenu.tsx` | Manual positioned context menu (no Radix/shadcn — avoids trigger-wrapper conflicts with React Flow) |
| `src/engine/layout.ts` | Dagre LR layout: entities/relations → React Flow nodes/edges |
| `src/engine/queries.ts` | Query engine (getEntity, getRelations, getLinkedContext, getContainerChildren, etc.) |
| `src/types/graph.ts` | TypeScript types: Entity, Relation, ViewState, GraphSnapshot |
| `src/store/useGraphStore.ts` | Zustand store: entities, relations, view state + openFromDisk/saveToDisk/closeDisk/isDirty + seed data reset + stale folder detection |
| `src/store/persistence/` | IndexedDB runtime + FSAdapter for explicit disk save/load |
| `src/store/persistence/FSAdapter.ts` | Standalone FS adapter with FSError, validateSnapshot, operation log |
| `src/data/seed.ts` | Seed data (2 containers with Tiptap content) |
| `src/index.css` | Global styles (dark/light vars, React Flow edge label overrides) |
| `dist/` | Build output (gitignored — never patch manually) |
| `dev-docs/` | Requirements, architecture, roadmap, changelog, ADR archive |

## Rules

- **`dist/` is generated** — never edit manually.
- **ESLint ignores `.ts`/`.tsx`** — use `npx tsc --noEmit` for type checking.
- **Changelog: most recent on top** — entries sorted newest-to-oldest, grouped by `## YYYY-MM-DD`. Purpose/Rules section stays at the very top. No duplicate date headings.
- **Roadmap: flat lists only** — three sections (Now/Next/Later), no milestones or phases. Completed items go in changelog, not roadmap.
- **Merge style:** always use `git merge --no-ff <feature-branch>` when merging feature branches into `main`. This preserves branch history as explicit merge commits. Never merge downstream (higher stack into lower stack).

## Code style

- Add a guard comment when code exists for a non-obvious reason — especially
  when removing or simplifying it would reintroduce a bug. Format:
  `// GUARD: <why this exists and what breaks without it>`
- Do NOT add comments that describe what code does. Only comment WHY.

## FS Adapter lifecycle

- `openFromDisk` sets `localStorage` flag `react-roadmap:folder-open` — on reload without FS handle, `init` forces seed data to avoid showing stale IndexedDB data the user can't save back to disk.
- `closeDisk` clears the flag, closes the FS handle, keeps entities/relations in place.
- `closeWorkspace` clears the flag, closes the FS handle, resets to seed data (not empty canvas).
- `isDirty = lastMutationTime > lastDiskSaveAt`. `beforeunload` fires when dirty.
- Save button is disabled when no folder is open.

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
