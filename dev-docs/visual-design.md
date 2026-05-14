# Visual Design

## Principles

- **Leverage existing quality** — shadcn/ui (Base UI) + Tailwind v4 for all components. No custom component primitives unless shadcn doesn't provide them.
- **Consistency through the system** — CSS variables, Tailwind theme tokens, and shadcn component variants are the single source of truth. No ad-hoc styles.
- **Transparency for agents** — components are in `src/components/ui/`, imported via `@/components/ui/button`. If it's not in that directory, it's custom.
- **Dark mode** — system preference (`prefers-color-scheme`), applied via `.dark` class on `<html>`, styled entirely through CSS variables. No dark-mode-specific component branches.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| CSS framework | Tailwind v4 | Utility-first, CSS-variable theming, no build step |
| Component primitives | shadcn/ui (Base UI) | Accessible, well-documented, source-in-repo customization |
| Icon library | @phosphor-icons/react | Already in the project, clean line icons |
| Font | Geist Variable (sans) | Default from shadcn init; performant, modern |
| CSS organization | Tailwind utility classes in components; global styles in `src/index.css` | Avoids CSS file sprawl |

## Component Source Rules

1. **Prefer shadcn components** — add them via `npx shadcn@latest add <name>`. This keeps them in `src/components/ui/` with consistent APIs.
2. **Custom components** go in `src/components/` or `src/renderers/` — but only when shadcn has no suitable primitive.
3. **One-off layout styles** use Tailwind utilities inline. If a pattern repeats three times, extract a component.

## Layout

- **Mode switch** — the app shows either the canvas (React Flow) or the reading viewport, never both at once. The focused entity determines which.
- **Canvas** — full viewport (`100vw x 100vh`), used for spatial overview.
- **Reading viewport** — full viewport with a fixed header (nav + title) and scrollable content column (max 720px).
- **Future** — side panels, split views, and multi-column layouts will be layered on top of this single-mode foundation.

## Theming

Defined in `src/index.css` via CSS variables set by shadcn init. Key tokens:

- `--background`, `--foreground` — page bg and default text
- `--primary`, `--primary-foreground` — primary action color
- `--muted`, `--muted-foreground` — secondary text and backgrounds
- `--border` — border color for dividers and outlines
- `--radius` — base border radius (0.625rem), with `--radius-sm/md/lg` variants

Dark mode values are in the `.dark` block. Override tokens there — never in components.
