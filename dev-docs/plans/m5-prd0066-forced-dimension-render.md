# PRD 0066: Forced Dimension Render — Node `measured` in Sync Effect

## Overview

A permanent fix for a recurring bug: programmatic dimension changes (width/height on `canvasData`) are written to the store and appear in React Flow node properties, but the DOM element stays at the old size until a page reload. The fix sets `node.measured` in the sync effect whenever dimensions change, forcing React Flow to accept the new dimensions immediately.

## Root Cause

The sync effect at `GraphCanvas.tsx:~178` updates a node's `style` object with new width/height:

```ts
style: { ...merged[idx].style, ...nodeStyle(entity.canvasData, isContainer) },
```

React Flow v12 (`@xyflow/react`) reads node visual dimensions from `node.measured`, not from `style`. The `measured` property is normally populated by a `ResizeObserver` on the node DOM element. When only `style` changes, React Flow skips re-measurement because it relies on `measured` to determine if a re-render is needed. The result: the node object has the correct style, but the rendered DOM element stays at the cached `measured` size.

## Solution

In the sync effect's merge block, detect when dimensions actually changed and set `measured` explicitly:

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
    ...(dimChanged ? { measured: { width: entity.canvasData.width, height: entity.canvasData.height } } : {}),
  }
}
```

`node.measured` is React Flow's official property for "the node's real dimensions as measured from the DOM." Setting it explicitly tells React Flow "I know what the size should be — use this." This bypasses the style-propagation → ResizeObserver → internal-cache pipeline that's breaking.

### Why this is permanent

1. **Lives in the sync effect** — every code path that writes dimensions flows through here: Stack Children, resize, drag, keyboard move, dagre auto-layout, future layout actions.
2. **`measured` is the correct API** — not a hack. React Flow uses `measured` for parent/child boundary calculations, viewport fitting, and edge routing.
3. **`dimChanged` guard** — skips unchanged nodes, so no unnecessary renders.

## Acceptance Criteria

- AC1: Stack Children resizes the container visually without a page reload.
- AC2: Manual node resize (drag handle) still works — `NodeResizeControl` already sets `measured` internally, and the sync effect's `dimChanged` is a no-op when dimensions match.
- AC3: Keyboard move + debounced write doesn't cause double-renders — the `measured` update only fires when dimensions actually differ.
- AC4: Dagre auto-layout (Run Layout button) reflects new container dimensions immediately.
- AC5: No unnecessary re-renders — `dimChanged` is false when dimensions haven't changed.

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | Add `dimChanged` detection and `measured` spread in sync effect's node merge block |

## Tests

| Test | What it verifies |
|------|------------------|
| `measured is set when width changes` | Sync effect applies `measured` when canvasData.width differs from style |
| `measured is set when height changes` | Sync effect applies `measured` when canvasData.height differs from style |
| `measured is not set when dimensions match` | `dimChanged` is false → no `measured` spread |

(Integration tests: create entities, update canvasData dimensions, trigger sync effect, assert React Flow node receives `measured`.)

## Dependencies

- PRD 0064 (Stack Container Children) — this fix was discovered during 0064 testing but is a cross-cutting infrastructure fix. It should be merged before or alongside 0064 to unblock container dimension updates.
