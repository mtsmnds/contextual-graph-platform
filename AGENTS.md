# react-roadmap

## Quick start

```sh
npm install        # install deps
npm run dev        # dev server with HMR
npm run build      # production build to dist/
npm run preview    # serve production build locally
npm run lint       # ESLint (flat config) on .
```

## Tech stack

- **Vite 8** + **React 19** — **TypeScript** (`.tsx`/`.ts`)
- **npm** (package-lock.json present)
- **ESLint 10** flat config (`eslint.config.js`) with `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- **Native CSS nesting** (no preprocessor)
- **Zustand 5** — global state (`useGraphStore`)

## Key dependencies

| Package | Purpose |
|---------|---------|
| `@xyflow/react` | React Flow — node/edge graph canvas |
| `@phosphor-icons/react` | Phosphor icon library |
| `zustand` | Lightweight global state |

## Architecture

| Path | Purpose |
|------|---------|
| `src/main.tsx` | App entrypoint, mounts `<App />` into `#root` |
| `src/App.tsx` | Main (and only) page component — renders `<ReactFlow>` canvas |
| `src/index.css` | Global reset & layout styles, dark mode via `prefers-color-scheme` |
| `src/types/graph.ts` | TypeScript types: `NodeKind`, `EdgeKind`, `EdgeBehavior`, `AppNode`, `AppEdge` |
| `src/store/useGraphStore.ts` | Zustand store: nodes, edges, documents + mutation actions |
| `src/assets/` | Static images (hero.png, react.svg, vite.svg) |
| `public/` | Static files served at `/` |

## Notes

- No test framework is configured.
- **`eslint.config.js` only covers `.js`/`.jsx`** — TypeScript files are NOT linted. Run `npx tsc --noEmit` for type checking instead.
- CSS uses `@media` queries nested inside selectors (native CSS nesting — no preprocessor needed).
- Standard Vite HMR: edits to `src/App.tsx` reflect instantly.
- Store is pre-seeded with sample data (one phase + two task nodes with a dependency edge).
