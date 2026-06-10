# PRD 0072: SegmentCard Visual Variants

## Overview

Give `SegmentCard` real visual identity with three border/presentation variants by **moving the card visual from `BaseNode` into `SegmentCard`**.

Currently the card look (border, background, rounded corners, hover ring) lives on `BaseNode` (line 10 of `base-node.tsx`): `bg-card text-card-foreground relative rounded-md border`. `SegmentCard` applies a `.segment-card` class that has no CSS definition — it's a visual shell that does nothing. This makes SegmentCard unusable outside the canvas.

After this PRD, `SegmentCard` owns its visual identity and `BaseNode` becomes a thin layout wrapper with only canvas-specific concerns (selected-state ring, positioning).

## Variants

| Variant | CSS Class | Visual | Use case |
|---------|-----------|--------|----------|
| `bordered` | `segment-card-bordered` | Border, background, rounded corners (current canvas look) | Canvas nodes, dialogs, any card context |
| `none` | `segment-card-none` | No border, no background, no padding | Continuous reading view, inline display |
| `hover` | `segment-card-hover` | Border and background appear on hover | Terse/interactive lists |

## Interface

```tsx
type SegmentCardVariant = "bordered" | "none" | "hover"

type SegmentCardProps = ComponentProps<"div"> & {
  width?: number | string
  variant?: SegmentCardVariant
}
```

Default is `"bordered"` — matches the current canvas card look.

## CSS

Added to `src/index.css`. Classes use theme variables (`--border`, `--radius`, `--card`) which are already defined by shadcn.

```css
.segment-card-bordered {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  padding: 0.75rem;
}

.segment-card-none {
  border: none;
  background: transparent;
  padding: 0;
}

.segment-card-hover {
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: transparent;
  padding: 0.75rem;
  transition: border-color 0.15s, background 0.15s;
}
.segment-card-hover:hover {
  border-color: var(--border);
  background: var(--card);
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/SegmentCard.tsx` | Add `variant` prop, map to variant CSS class |
| `src/index.css` | Add `.segment-card-bordered`, `-none`, `-hover` styles |
| `src/components/base-node.tsx` | Remove `bg-card`, `rounded-md`, `border` classes — keeps only `relative`, `hover:ring-1`, `in-[.selected]` styles (canvas-specific) |
| `src/components/SegmentCard.test.tsx` | Add tests for each variant renders correct class |
| `src/stories/SegmentCard.stories.tsx` | Add stories: Bordered (default), None, Hover |
| `src/canvas/nodes/EntityNode.tsx` | No change needed — `variant="bordered"` (default) matches current visual |

## Acceptance Criteria

- AC1: `SegmentCard` with no `variant` prop renders with border, background, rounded corners — matches current BaseNode visual.
- AC2: `variant="none"` renders with no border, no background, no padding.
- AC3: `variant="hover"` renders borderless by default, shows border and background on hover.
- AC4: `width` prop still works across all variants.
- AC5: `className` and `style` props compose with variant classes.
- AC6: `BaseNode` no longer has `bg-card`, `rounded-md`, `border` — those moved to SegmentCard.
- AC7: Existing EntityNode rendering is visually identical (card border/bg come from SegmentCard instead of BaseNode).
- AC8: ContainerGroupNode rendering is unaffected (it uses BaseNode directly without SegmentCard).

## Effort

Small to medium — one component change, one CSS addition, one CSS removal from BaseNode, test updates, story updates.

## Risk

Low. The `bordered` variant produces the same visual as BaseNode currently provides. The risk is an edge case where something relies on BaseNode's card classes directly — mitigated by: only EntityNode and ContainerGroupNode use BaseNode, and ContainerGroupNode has its own header layout that doesn't depend on the card background.
