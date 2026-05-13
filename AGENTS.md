# AGENTS Guide

## Project Overview

A unified node-and-edge system powering two products from one core: a visual project roadmap and a relational reading workspace. Built with React + TypeScript on Vite, using @xyflow/react for graph rendering and Zustand for state.

## Build

```sh
npm install        # install deps
npm run dev        # dev server with HMR
npm run build      # production build to dist/
npm run preview    # serve production build locally
```

Standard Vite pipeline. No incremental build or caching concerns — Vite handles it.

## Test

No test framework is configured. Verification commands:

```sh
npx tsc --noEmit   # type checking
npm run lint        # ESLint flat config — only covers .js/.jsx files
```

## Secrets

None. This is a client-side app with no backend credentials.

## Doc System (dev-docs/)

| File | Purpose |
|------|---------|
| `requirements.md` | Feature intent, user stories, acceptance criteria |
| `architecture.md` | System design, contracts, build flow |
| `roadmap.md` | Active priorities (Now/Next/Later) |
| `changelog.md` | Completed significant changes with rationale |
| `archive/` | ADR files + executed plans |
| `plans/` | Design blueprints for future features |

### Documentation Map

- `README.md` — human-first project entrypoint and quickstart.
- `dev-docs/requirements.md` — product goals, user stories, non-functional constraints.
- `dev-docs/architecture.md` — system design, contracts, module responsibilities, build flow.
- `dev-docs/roadmap.md` — current priorities and future backlog.
- `dev-docs/changelog.md` — completed significant changes and rationale.
- `dev-docs/archive/` — ADRs linked from significant changelog entries.

### Read Order (before implementing changes)

1. `README.md` — human quickstart and project orientation.
2. `requirements.md` — what/why (feature intent, acceptance criteria).
3. `architecture.md` — how/contracts (system design, data contracts, pipeline).
4. `roadmap.md` — priority (what to do now vs later).
5. `changelog.md` + relevant ADRs — history/decisions.

### Post-completion

After every completed change, load the `dev-docs` skill (`skill({ name: "dev-docs" })`) and follow its update instructions to keep all docs current.

## Conventions

| Path | Role |
|------|------|
| `src/` | App source (main.tsx → App.tsx → ReactFlow canvas) |
| `src/types/graph.ts` | TypeScript types: NodeKind, EdgeKind, EdgeBehavior, AppNode, AppEdge |
| `src/store/useGraphStore.ts` | Zustand store: nodes, edges, documents + mutation actions |
| `src/assets/` | Static images served by Vite |
| `public/` | Static files served at `/` |
| `dist/` | Build output (gitignored) |

- **Stack:** Vite 8 + React 19 + TypeScript + Native CSS nesting + Zustand 5
- **Dependencies:** `@xyflow/react` (graph canvas), `@phosphor-icons/react` (icons)
- **ESLint flat config only covers `.js`/`.jsx`** — TypeScript files are NOT linted. Use `npx tsc --noEmit` for type checking.
- Store is pre-seeded with sample data (one phase + two task nodes with a dependency edge).
- Dark mode: automatic via `prefers-color-scheme` in `index.css`.
