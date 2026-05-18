# PRD0037 — Zoom Improvements

## Overview

Add viewport persistence, a live viewport logger, and zoom controls to the graph canvas. The logger shows the current x/y/zoom as floating text next to the control buttons. Initial `fitView` is capped at 100% zoom, but persisted viewport (saved across reloads) takes priority.

## Viewport Logger

Display live x/y/zoom in the bottom-right control area, to the left of the zoom buttons.

- **Source:** React Flow's internal store via `useStore((s) => s.transform)` — gives `[x, y, zoom]` on every viewport change
- **Format:** `x: -120.5 y: 45.2 z: 85%` — `font-mono text-[11px] tabular-nums text-muted-foreground/60` (no border, no background, floats independently)
- **Placement:** In a `flex items-center gap-3` wrapper alongside the `ButtonGroup`, inside the bottom-right `Panel`

## Zoom Controls

| Button | Action | Icon |
|--------|--------|------|
| Zoom In | `reactFlowInstance.zoomIn()` | `ZoomIn` (lucide) |
| Zoom Out | `reactFlowInstance.zoomOut()` | `ZoomOut` (lucide) |
| Fit View | `reactFlowInstance.fitView()` | `Maximize` (lucide) |
| Zoom to 100% | `reactFlowInstance.zoomTo(1)` | `1:1` text label |

The 1:1 button uses `text-xs font-semibold tabular-nums` inside a `size="icon"` outline Button for consistency.

## Initial Zoom Cap

When the canvas opens with no persisted viewport, `fitView` runs with `fitViewOptions={{ maxZoom: 1 }}` — zoom never exceeds 100% on initial load.

If a viewport was previously persisted (user had panned/zoomed), the saved viewport is restored via `setViewport()` and overrides the initial `fitView`. This ensures saved positions >100% zoom are preserved.

## Viewport Persistence

- **Key:** `react-roadmap:viewport` in `localStorage`
- **Save:** Debounced (500ms) on every viewport change via `useStore` subscription
- **Restore:** On mount, reads from localStorage and calls `reactFlowInstance.setViewport(vp)`
- **Guard:** Ref flag `restoredViewportRef` ensures restore runs exactly once (handles React Strict Mode double-fire)

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | Added `useStore` import for live viewport, `VIEWPORT_KEY`, restore/save effects, `onZoom100` callback, `fitViewOptions={{ maxZoom: 1 }}` prop, viewport logger text in Panel |

## Out of Scope

- Schema v4 with `canvas.positions` and `canvas.viewport` in GraphSnapshot — deferred to separate PRD (save node positions)
- Viewport persistence via persistence adapter (uses localStorage directly for simplicity)
- Viewport logger styling customization (beyond the initial muted, borderless look)
