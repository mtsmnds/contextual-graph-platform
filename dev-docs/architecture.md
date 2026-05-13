# Architecture

## Purpose
How the system is designed and where core responsibilities live.

## System Style
- Architecture style: React SPA with graph visualization
- Deployment style: Tauri-packaged desktop app (dev via `npm run dev`)
- Execution model: Client-side SPA, no server

## Tech Stack
- Vite 8 + React 19 + TypeScript
- @xyflow/react (React Flow) — graph canvas
- Zustand 5 — global state
- @phosphor-icons/react — icon library
- Native CSS nesting (no preprocessor)

## Build Pipeline
Entrypoint: `npm run build` → `vite build`

1. **Vite dev** (`npm run dev`) — esbuild transpilation, HMR, static file serving.
2. **Production build** (`npm run build`) — rolldown bundling, CSS/JS minification, output to `dist/`.

## Data Contracts

### Graph Schema (`src/types/graph.ts`)
- Nodes extend React Flow's `Node<NodeData, NodeKind>`:
  - `type` field doubles as the NodeKind discriminator.
  - `data` contains `label: string`, `status: pending|in-progress|done|active`, optional `specRef`.
  - Must include `[key: string]: unknown` index signature to satisfy React Flow's generic constraint.
- Edges extend React Flow's `Edge<EdgeData>`:
  - `data` contains `kind: EdgeKind`, `behavior: EdgeBehavior`, optional `label`.
  - Must include `[key: string]: unknown` index signature.
- `EdgeKind` → `EdgeBehavior` resolved via `kindToBehavior` lookup in the store.

### Store (`src/store/useGraphStore.ts`)
- `nodes: AppNode[]` — current graph nodes.
- `edges: AppEdge[]` — current graph edges.
- `documents: Record<string, string>` — rich text content keyed by docId.
- Mutations: `addNode`, `deleteNode`, `updateNodeData`, `addEdge`, `deleteEdge`, `updateDocument`.
- React Flow integration: `onNodesChange`, `onEdgesChange` wired through `applyNodeChanges`/`applyEdgeChanges`.

### Output / State
- `dist/` — production build.
- Store lives in memory only (no persistence yet).

## Module Map

| Path | Role |
|------|------|
| `src/main.tsx` | App entrypoint |
| `src/App.tsx` | React Flow canvas mount |
| `src/types/graph.ts` | TypeScript type definitions |
| `src/store/useGraphStore.ts` | Zustand store + mutations |
| `src/index.css` | Global styles, dark mode |
| `src/assets/` | Static images |

## Change Impact
- Schema change → update `src/types/graph.ts` + `dev-docs/architecture.md` + `dev-docs/changelog.md` + ADR.
- Store action change → update `src/store/useGraphStore.ts` + `dev-docs/architecture.md`.
- Pipeline change → update this doc + `dev-docs/changelog.md` + ADR.

## Verification
- `npx tsc --noEmit` — type check.
- `npm run build` — production build.

## Related Docs
- `requirements.md` — intent and constraints.
- `roadmap.md` — priorities.
- `changelog.md` — history.
- `AGENTS.md` — operating conventions.
