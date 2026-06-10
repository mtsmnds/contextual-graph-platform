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

Added to `src/index.css`. Classes use theme variables (`--border`, `--radius`, `--card`, `--card-foreground`) which are already defined by shadcn.

Variants apply only to the container frame — no padding. Padding is a content-layer concern controlled by the consumer (`BaseNodeContent` or equivalent).

```css
.segment-card-bordered {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--card-foreground);
}

.segment-card-none {
  border: none;
  background: transparent;
}

.segment-card-hover {
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: transparent;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.segment-card-hover:hover {
  border-color: var(--border);
  background: var(--card);
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/SegmentCard.tsx` | Add `variant` prop, remove empty `.segment-card` class, use variant class instead. Export `SegmentCardVariant` type. |
| `src/index.css` | Add `.segment-card-bordered`, `-none`, `-hover` styles. |
| `src/components/base-node.tsx` | Remove `bg-card`, `rounded-md`, `border`, `text-card-foreground` classes — keeps only `relative`, `hover:ring-1`, `in-[.selected]` styles (canvas-specific). |
| `src/components/SegmentCard.test.tsx` | Update `"segment-card"` assertion to assert variant class (e.g. `"segment-card-bordered"`). Add tests for each variant. |
| `src/stories/SegmentCard.stories.tsx` | Keep existing use-case stories (ShortContent, LongContent, EmptyContent, CustomWidth, EditableContent) but wrap them with different `variant` props — e.g. ShortContent uses `bordered`, LongContent uses `none`, EmptyContent uses `hover`. Adds a new ExplicitBordered story for clarity. |
| `src/canvas/nodes/EntityNode.tsx` | No change needed — `variant="bordered"` (default) matches current visual. |

## Acceptance Criteria

- AC1: `SegmentCard` with no `variant` prop renders with border, background, rounded corners, correct foreground color — matches current BaseNode visual.
- AC2: `variant="none"` renders with no border, no background, no padding.
- AC3: `variant="hover"` renders borderless and transparent by default, shows border and background on hover (with `0.15s ease` transition).
- AC4: `width` prop still works across all variants.
- AC5: `className` and `style` props compose with variant classes.
- AC6: `BaseNode` no longer has `bg-card`, `rounded-md`, `border`, `text-card-foreground` — those moved to `SegmentCard`'s `bordered` variant.
- AC7: Existing EntityNode rendering is visually identical (card border/bg/color come from SegmentCard instead of BaseNode).
- AC8: ContainerGroupNode rendering is unaffected (it uses BaseNode directly without SegmentCard).
- AC9: No double padding — SegmentCard adds no padding; BaseNodeContent's `p-3` is the sole padding source.

## Effort

Small — one component change, one CSS addition (+ removal from BaseNode), test updates, story reshuffle.

## Risk

Low. The `bordered` variant reproduces the same visual as BaseNode currently provides (border, bg, rounded, foreground color). Only consumers to verify: EntityNode (visual identical), ContainerGroupNode (unaffected — uses BaseNode without SegmentCard), and Storybook stories (explicitly checked by variant).
