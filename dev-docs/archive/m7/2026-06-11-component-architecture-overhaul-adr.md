# 2026-06-11: Component architecture overhaul — BaseNode removal, portable card components

## Context
- The `BaseNode` family (`base-node.tsx` — BaseNode, BaseNodeHeader, BaseNodeHeaderTitle, BaseNodeContent, BaseNodeFooter) from the reactflow.dev registry was the sole card visual provider for both EntityNode and ContainerGroupNode.
- These components were tightly coupled to React Flow (canvas chrome mixed with card visuals), making them unusable outside the graph — impossible to mount SegmentCard in dialogs, Storybook, reading views, or accordions without a React Flow dependency.
- SegmentCard existed as an empty wrapper (`.segment-card` class with no CSS definition) that delegated all layout to BaseNodeContent.
- `.entity-card-content` CSS in `index.css` overrode SegmentCard's `p-3` padding with a custom ~5px via a container query — three layers to express one padding value.
- ContentEditor's textarea used a JS `scrollHeight` hack for auto-sizing instead of native browser behavior.
- ContainerGroupNode rendered its own inline editing UI (`useNodeEdit` + custom `<input>`) instead of reusing ContentEditor.

## Decision
- **Delete `base-node.tsx` entirely.** All four consumers migrated: EntityNode to plain div + SegmentCard, ContainerGroupNode to plain div + ContainerCard. `BaseNodeHeaderTitle` and `BaseNodeFooter` had zero remaining consumers.
- **SegmentCard absorbs BaseNodeContent's layout** (`flex flex-col gap-y-2 p-3`) and gains a `variant` prop (`bordered`/`none`/`hover`). Variant styles are Tailwind classes in the component (`src/components/SegmentCard.tsx`), not CSS in `index.css`. Default variant is `bordered`.
- **New `ContainerCard` component** provides a card frame for container entities — `header` prop (for ContentEditor), `children` slot (consumer-controlled), and same variant system as SegmentCard. No React Flow dependency.
- **ContainerCard is a dumb frame.** Consumers control child area styling. The child area is not wrapped in a hardcoded div — this allows `CollapsibleContent` to fully hide children when collapsed.
- **ContentEditor uses `field-sizing: content`** instead of the JS `scrollHeight` reset-expand pattern. Native browser auto-sizing eliminates the one-line collapse on edit entry. Cursor moves to end via `selectionStart = selectionEnd = value.length`. View mode has `whitespace-pre-wrap`.
- **ContainerGroupNode uses ContentEditor** (via ContainerCard's `header` prop) instead of custom `useNodeEdit` + `<input>` inline editing. Same editing behavior throughout the app.
- **Handles are siblings of card components, not children** in both EntityNode and ContainerGroupNode. Handles are absolutely positioned — their positioning context is the wrapper div (has `position: relative`), so nesting doesn't matter.
- **Removed `.entity-card-content`, `.entity-card`, `.segment-card-*` CSS rules** from `index.css`. All variant styling is now Tailwind in component files.

## Alternatives Considered
- **Keeping BaseNode and adding variants to it:** Rejected because BaseNode would still carry canvas chrome (selection styles, `tabIndex`, `hover:ring-1`) that doesn't belong in a portable component. The split (canvas wrapper div + portable card component) is cleaner — each layer has one responsibility.
- **ContainerCard wrapping children in a styled div:** Initially implemented, then reverted. The hardcoded `bg-accent/15 p-3 flex-1 min-h-[60px]` prevented CollapsibleContent from fully collapsing the child area. Consumer-controlled children are more flexible and let each site choose its own layout.
- **Keeping `.segment-card-*` CSS in `index.css`:** Initially implemented (moved from BaseNode to index.css), then reverted to Tailwind classes in the component. The CSS-in-CSS approach worked but was inconsistent with the project's shadcn conventions where all component styling is Tailwind. Moving to Tailwind in the component eliminates the lookup between component and CSS file.

## Impact
- `SegmentCard` and `ContainerCard` are portable — mountable in dialogs, Storybook, reading views, accordions with zero React Flow dependencies.
- `index.css` reduced by ~40 lines (`.entity-card`, `.entity-card-content`, `.segment-card-bordered`, `.segment-card-none`, `.segment-card-hover`, `.container-child-area`).
- `base-node.tsx` was 84 lines of dead code — fully removed.
- ContentEditor's textarea no longer collapses to one line on edit entry.
- ContainerGroupNode editing is now identical to EntityNode editing (same ContentEditor component).
- Collapsible accordion pattern works naturally with ContainerCard — ContainerCard has no opinion about children.

## Archive
- Changelog: `2026-06-11` — Component architecture overhaul
