# PRD 0066: Forced Dimension Render — Programmatic Node Resize

## Status: RESOLVED

## Overview

Programmatic dimension changes (width/height on `canvasData`) are written to the store and appear in React Flow node properties, but the DOM element stays at the old size until a page reload. This affects all features that dynamically resize nodes (Stack Children, dagre auto-layout, etc.).

## Root Cause

React Flow v12's `NodeWrapper` component is memoized with a `shallow` comparison that does not detect changes to `node.width`, `node.height`, or `node.style` when they are updated programmatically through `setNodes`. The render pipeline has two dimension sources:

1. **`getNodeInlineStyleDimensions(node)`** — used for the wrapper div's inline style. Priority: `node.width` → `node.initialWidth` → `node.style?.width` (before measurement), or `node.width` → `node.style?.width` (after measurement).

2. **`getNodeDimensions(node)`** — used for the custom node component's props. Priority: `node.measured?.width` → `node.width` → `node.initialWidth` → `0`.

Setting `node.width` or `node.style.width` through `setNodes` → `adoptUserNodes` correctly writes to the internal node, but the NodeWrapper memo prevents the DOM from ever receiving the new values. React DevTools confirms the internal node has the correct data; the DOM wrapper div does not.

The only pipeline that reliably updates the DOM is the **ResizeObserver → `updateNodeInternals`** chain:

1. A `ResizeObserver` watches each node's wrapper div
2. When the DOM dimensions change, it fires `updateNodeInternals`
3. `updateNodeInternals` reads the actual DOM size via `getDimensions(nodeElement)`
4. It sets `node.measured` to the measured dimensions
5. It calls `set({})` to unconditionally notify all store subscribers
6. NodeWrapper re-evaluates and picks up the new `node.measured` values

This is the same pipeline `NodeResizeControl` uses during manual drag resize.

## Why `node.width` Fails

`adoptUserNodes` creates a fresh internal node from the user node on every `setNodes` call:

```js
internalNode = {
    ...userNode,
    measured: { width: userNode.measured?.width, height: userNode.measured?.height },
    internals: { ... },
};
```

Our user nodes never carry `measured` (it's set by the measurement system, not by us), so `node.measured` resets to `{ width: undefined, height: undefined }` on every sync cycle. Even though `node.width` is written correctly from the spread, the NodeWrapper memo prevents the updated node from reaching the DOM.

Calling `storeApi.setState({})` (forcing store subscribers to re-evaluate) also fails — the selector returns the new internal node, but NodeWrapper's `shallow` comparison still returns `true` because the relevant dimension paths are not in its comparison.

## Failed Approaches

### 1. `style.width`/`style.height` only

**What:** Updated `node.style.width` and `node.style.height` in the sync effect via `nodeStyle()`.

**Result:** The style object is ignored by NodeWrapper's memo — no DOM update.

### 2. `updateNodeInternals` without DOM change

**What:** Called `storeApi.getState().updateNodeInternals(...)` after the batch to force React Flow to re-measure from the DOM.

**Result:** Requires DOM element references (`Map<string, { id, nodeElement, force }>`). The function reads from the DOM — if the DOM hasn't changed (because NodeWrapper didn't re-render), it confirms the old dimensions. Chicken-and-egg problem.

### 3. `node.measured` on user node

**What:** Set `node.measured = { width, height }` on the user node object.

**Result:** `adoptUserNodes` explicitly overwrites `measured` from `userNode.measured`, so the value propagates. But `getNodeInlineStyleDimensions` does NOT read `measured` — it reads `node.width` and `node.style?.width`. So even with correct `measured`, the wrapper div style still comes from the stale `node.width`/`style`.

### 4. `node.width`/`node.height` on user node

**What:** Set `width` and `height` as top-level properties on the user node object.

**Result:** `adoptUserNodes` spreads `...userNode` so the values reach the internal node. But NodeWrapper's memoization prevents the DOM update. The internal node has the correct data (confirmed in DevTools); the DOM does not receive it.

## Solution: `syncNodeDimensions`

Direct DOM manipulation on the node's wrapper div, which triggers React Flow's native ResizeObserver → `updateNodeInternals` pipeline — the same mechanism `NodeResizeControl` uses.

```ts
function syncNodeDimensions(nodeId: string, width: number, height: number) {
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement | null
    if (el) {
      el.style.width = `${width}px`
      el.style.height = `${height}px`
    }
  })
}
```

The `requestAnimationFrame` gives React time to commit any pending renders before touching the DOM. The ResizeObserver fires asynchronously, calls `updateNodeInternals`, which:
- Reads the new DOM dimensions via `getDimensions`
- Sets `node.measured` to the new values
- Calls `set({})` to force all store subscribers to re-evaluate
- NodeWrapper picks up the new `node.measured` dimensions on the next render

## Invariant Rule

Any future code path that programmatically changes a node's width or height MUST call `syncNodeDimensions(nodeId, width, height)` after the store update. The store update handles persistence and data consistency; the DOM call handles visual rendering.

Do NOT try to set dimensions through `setNodes` alone (via `node.width`, `node.height`, or `node.style`) — those paths are blocked by NodeWrapper's memo and will not reach the DOM.

## Acceptance Criteria

- AC1: Stack Children resizes the container visually without a page reload.
- AC2: Dagre auto-layout (Run Layout button) reflects new container dimensions immediately.
- AC3: Manual node resize (drag handle) still works — `NodeResizeControl` triggers the same ResizeObserver pipeline.
- AC4: No double-renders or flashes — `requestAnimationFrame` ensures the DOM write happens after React commits.

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | Added `syncNodeDimensions()`, calls from Stack Children and Run Layout handlers |

## Tests

| Test | What it verifies |
|------|------------------|
| (existing) `stackChildren` layout tests | Container and child dimensions compute correctly |

## Dependencies

- PRD 0064 (Stack Container Children) — the Stack Children feature that prompted this fix.
- `@xyflow/react` v12.10.2 — the behavior is specific to v12's NodeWrapper memoization.

## ADR

See `dev-docs/archive/m5/2026-06-07-m5-prd0066-forced-dimension-render-adr.md` for the full architectural decision record.
