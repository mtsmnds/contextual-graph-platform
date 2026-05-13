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

- **Vite 8** + **React 19** — JSX (`.jsx`), **no TypeScript**
- **npm** (package-lock.json present)
- **ESLint 10** flat config (`eslint.config.js`) with `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- **Native CSS nesting** (no preprocessor)

## Dependencies

- `@xyflow/react` (React Flow) — graph/flow diagrams
- `@phosphor-icons/react` — icon library

## Architecture

| Path | Purpose |
|------|---------|
| `src/main.jsx` | App entrypoint, mounts `<App />` into `#root` |
| `src/App.jsx` | Main (and only) page component |
| `src/index.css` | Global reset & layout styles, dark mode via `prefers-color-scheme` |
| `src/App.css` | Component-level styles |
| `src/assets/` | Static images (hero.png, react.svg, vite.svg) |
| `public/` | Static files served at `/` |

## Notes

- No test framework is configured.
- No type checking step exists; the `lint` script is the only verification.
- CSS uses `@media` queries nested inside selectors (native CSS nesting — no preprocessor needed).
- Standard Vite HMR: edits to `src/App.jsx` reflect instantly.
