# 2026-05-27: prd0050 — Switch Component

## Context
- The existing `<Switch>` was a bare Base UI toggle with no label or description.
- Each consumer had to provide its own layout, leading to inconsistent spacing and repetition.
- Feature flags needed a consistent labeled-toggle pattern (label left, switch right).

## Decision
- Replace the bare switch with a self-contained `<Switch>` that accepts `label`, `description`, `invalid`, `disabled`, and standard `checked`/`onCheckedChange`.
- Use `<label htmlFor={id}>` with `useId()` so clicking the label text toggles the switch — no custom click handlers needed.
- Invalid state sets `aria-invalid` on the Base UI root (red border via existing CSS) and `text-destructive` on the description.

## Alternatives Considered
- **Keep bare switch, add Field components from shadcn.** More flexible for complex forms but heavier — Field doesn't exist yet and adds another dependency.
- **SwitchItem name.** User preferred replacing `Switch` directly since there's only one consumer.

## Consequences
- Single consistent toggle pattern across the app.
- FeatureFlagsSection simplified (no manual `<label>` / `<span>` layout).
- Invalid state pattern reusable for future form components.
- No architectural changes — this is a component addition only.
