# 2026-06-07: prd0066 — forced dimension render via direct DOM manipulation

## Context

Programmatic node dimension changes (width/height on `canvasData`) need to visually update the canvas without a page reload. This affects Stack Children, dagre auto-layout, and any future feature that dynamically resizes nodes.

## Attempted approaches (all failed)

1. **`style.width`/`style.height` via `setNodes`** — NodeWrapper memo ignores `style`.
2. **`node.width`/`node.height` via `setNodes`** — Values reach the internal node but NodeWrapper memo prevents DOM update.
3. **`updateNodeInternals` without DOM change** — Reads from DOM; chicken-and-egg.
4. **`node.measured` on user node** — Overwritten by `adoptUserNodes` every cycle, and `getNodeInlineStyleDimensions` doesn't read `measured`.

## Decision

Use `syncNodeDimensions`: direct DOM manipulation on the wrapper div (`el.style.width`/`el.style.height`) inside `requestAnimationFrame`. This triggers React Flow's native ResizeObserver → `updateNodeInternals` pipeline, which:
1. Reads the new DOM dimensions
2. Sets `node.measured` on the internal node
3. Calls `set({})` to unconditionally notify all store subscribers
4. NodeWrapper re-renders with the correct `node.measured` dimensions

This is the same mechanism `NodeResizeControl` uses during manual drag resize.

## Consequences

- Any code that programmatically changes node dimensions must call `syncNodeDimensions(nodeId, width, height)` after the store update.
- The `setNodes` path (`node.width`/`node.height`/`node.style`) cannot be used for dimension changes — it's blocked by NodeWrapper's memo.
- The `syncNodeDimensions` function lives in `GraphCanvas.tsx` alongside the sync effect.
- Callers must use `requestAnimationFrame` (or any timing after the next React commit) to avoid React racing with the DOM write.

## Invariant

Programmatic node resizing requires TWO writes: one to the store (persistence + data layer), one to the DOM (visual layer via `syncNodeDimensions`). Neither alone is sufficient.
