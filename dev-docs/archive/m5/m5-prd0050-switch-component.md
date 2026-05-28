> **Completion note (2026-05-27):**
> - **What was built:** Full labeled Switch component replacing the bare toggle. JSDoc, stories, argTypes, invalid/disabled states.
> - **Key decisions:** Replaced Switch directly (kept name), used `<label htmlFor>` with `useId()` for clickable label.
> - **Deviations from plan:** None — scope expanded slightly to include invalid state description styling.
> - **Postponed:** None.

# PRD 0050: Switch Component (Labeled Switch with Layout)

## Overview

Create a `SwitchItem` component that pairs the existing bare `<Switch>` with a label (and optional description) in a consistent layout: label on the left, switch on the right. Supports disabled and invalid states. The bare `<Switch>` already exists — this PRD adds the higher-level composition.

## Specification / Acceptance Criteria

- New component `SwitchItem` at `src/components/ui/switch-item.tsx`
- Layout: label text on the left, switch on the right, inline (single row)
- Optional `description` prop renders smaller text below the label
- `disabled` prop disables the switch and dims the label
- `invalid` prop sets `aria-invalid` on the switch and optional error styling
- Exposes the underlying switch's `checked` / `onCheckedChange` for controlled usage
- Stories follow standards: JSDoc on component, argTypes descriptions, use-case states (default, with description, disabled, invalid)
- `npx tsc --noEmit` passes

## Files Changed

- `src/components/ui/switch-item.tsx` — new: SwitchItem component
- `src/stories/SwitchItem.stories.tsx` — new: stories

## Phases

Single pass. Well-understood composition component.

## Size Advisory

Small — ~3 files, straightforward layout wrapper.
