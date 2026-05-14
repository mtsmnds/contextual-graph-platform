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

Store is pre-seeded with sample data (one phase + two task nodes with a dependency edge).

## Before Implementing

Read in order: `README.md` → `dev-docs/requirements.md` → `dev-docs/architecture.md` → `dev-docs/roadmap.md` → `dev-docs/changelog.md` + `dev-docs/archive/`.

## After Completing

Run `npx tsc --noEmit` and `npm run build`, then load the `dev-docs` skill (`skill({ name: "dev-docs" })`) to keep docs current.

## Key Paths

| Path | Role |
|------|------|
| `src/main.tsx` | App entrypoint |
| `src/App.tsx` | React Flow canvas mount |
| `src/types/graph.ts` | TypeScript types: NodeKind, EdgeKind, EdgeBehavior, AppNode, AppEdge |
| `src/store/useGraphStore.ts` | Zustand store: nodes, edges, documents + mutation actions |
| `src/index.css` | Global styles (dark/light vars) |
| `dist/` | Build output (gitignored — never patch manually) |
| `dev-docs/` | Requirements, architecture, roadmap, changelog, ADR archive |

## Rules

- **`dist/` is generated** — never edit manually.
- **ESLint ignores `.ts`/`.tsx`** — use `npx tsc --noEmit` for type checking.
