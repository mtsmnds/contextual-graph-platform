# PRD 0066: Forced Dimension Render — Node `width`/`height` in Sync Effect

## Overview

A permanent fix for a recurring bug: programmatic dimension changes (width/height on `canvasData`) are written to the store and appear in React Flow node properties, but the DOM element stays at the old size until a page reload. The fix sets `node.width` and `node.height` directly on the React Flow node object in the sync effect whenever dimensions change, forcing the renderer to use the new size.

## Root Cause

The sync effect at `GraphCanvas.tsx:~178` updates a node's `style` object with new width/height:

```ts
style: { ...merged[idx].style, ...nodeStyle(entity.canvasData, isContainer) },
```

React Flow v12's `NodeWrapper` renders node dimensions from `getNodeInlineStyleDimensions(node)`:

```ts
width: node.width ?? node.initialWidth ?? node.style?.width,
height: node.height ?? node.initialHeight ?? node.style?.height,
```

`node.width` takes precedence over `style`. Since `node.width` is never set (only `style` is), it falls through to `node.style?.width`. But React Flow's `NodeWrapper` memo prevents re-rendering when only `style` changes — the memo check ignores the `style` property. This means the DOM stays at the old measured size until a full page reload (which re-reads `canvasData` fresh).

## Failed Approaches

Three approaches were tested before finding the correct fix:

### 1. `fallbackWidth` removal (fixed a data bug, not the render)

**What:** Removed the `fallbackWidth` parameter from `nodeStyle()`. Previously, the sync effect passed the old style width as `fallbackWidth`, which took precedence over `canvasData.width` in the style resolution chain:
```ts
width: fallbackWidth (384) ?? cd.width (400) ?? fallback → always 384
```
**Result:** Fixed the data side — the node object now has the correct style. But React Flow still didn't re-render because its memo check ignores `style`.

### 2. `updateNodeInternals` (wrong React Flow v12 API)

**What:** Called `storeApi.getState().updateNodeInternals(...)` after the batch to force React Flow to re-measure the container node from the DOM.
**Result:** `updateNodeInternals` exists in the internal React Flow v12 store but requires `Map<string, InternalNodeUpdate>` with DOM element references. The public `ReactFlowInstance` does not expose it. Not usable from the context menu handler.

### 3. `measured` property (overridden by `adoptUserNodes`)

**What:** Set `node.measured = { width, height }` on the node object using the same `dimChanged` guard.
**Result:** `adoptUserNodes` explicitly overrides `measured` from the user node:
```js
internalNode = {
    ...userNode,
    measured: { width: userNode.measured?.width, height: userNode.measured?.height },
}
```
Setting `measured` on the user node does propagate, but `getNodeInlineStyleDimensions` does NOT check `measured` — it checks `node.width` first, then `initialWidth`, then `style`. So even if `measured` is set, the rendered dimensions are read from `node.width` (undefined → falls through to `style` which has the correct value but the memo prevents the re-render).

### 4. `width`/`height` on node (✅ correct fix)

**What:** Set `width` and `height` as top-level properties on the React Flow node object.
**Why it works:**
- `adoptUserNodes` spreads `...userNode` into `internalNode`, so `internalNode.width` and `internalNode.height` come from the user node
- `getNodeInlineStyleDimensions` reads `node.width` FIRST, so setting it overrides both `initialWidth` and `style`
- React Flow's memo comparison does check `width`/`height` — when they change, `NodeWrapper` re-renders with the correct inline dimensions

## Solution

In the sync effect's merge block, detect when dimensions actually changed and set `width`/`height` directly on the node:

```ts
const oldStyle = merged[idx].style as Record<string, unknown> | undefined
const dimChanged =
  oldStyle?.width !== entity.canvasData.width ||
  oldStyle?.height !== entity.canvasData.height

// ... inside the existing condition:
if (posChanged || contentChanged || parentChanged || typeChanged || w != null) {
  merged[idx] = {
    ...merged[idx],
    // ... existing properties ...
    style: { ...merged[idx].style, ...nodeStyle(entity.canvasData, isContainer) },
    ...(dimChanged ? { width: entity.canvasData.width, height: entity.canvasData.height } : {}),
  }
}
```

### Why this is permanent

1. **Lives in the sync effect** — every code path that writes dimensions flows through here: Stack Children, resize, drag, keyboard move, dagre auto-layout, future layout actions.
2. **`width`/`height` are first-class Node properties** — checked by `NodeWrapper`'s memo, read by `getNodeInlineStyleDimensions` with highest priority, propagated through `adoptUserNodes` via the user node spread.
3. **`dimChanged` guard** — skips unchanged nodes, so no unnecessary renders.

## Acceptance Criteria

- AC1: Stack Children resizes the container visually without a page reload.
- AC2: Manual node resize (drag handle) still works — `NodeResizeControl` goes through a different pipeline and the sync effect's `dimChanged` is a no-op when dimensions match.
- AC3: Keyboard move + debounced write doesn't cause double-renders — `dimChanged` only fires when dimensions actually differ.
- AC4: Dagre auto-layout (Run Layout button) reflects new container dimensions immediately.
- AC5: No unnecessary re-renders — `dimChanged` is false when dimensions haven't changed.

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | Add `dimChanged` detection and `width`/`height` spread in sync effect's node merge block |

## Tests

| Test | What it verifies |
|------|------------------|
| `width/height set when dimensions change` | Sync effect applies `width`/`height` when `canvasData` dimensions differ from style |
| `width/height not set when dimensions match` | `dimChanged` is false → no `width`/`height` spread |

## Dependencies

- PRD 0064 (Stack Container Children) — this fix was discovered during 0064 testing but is a cross-cutting infrastructure fix. It should be merged before or alongside 0064 to unblock container dimension updates.
