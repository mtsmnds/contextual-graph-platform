# 2026-05-18: prd0037 — zoom improvements

## Context
- The canvas launched with a default `fitView` that could zoom in too far on small graphs.
- Users had no way to see or control their current zoom level.
- Viewport state was lost on every reload.

## Decision
- Added a viewport logger (live `x: y: z:` display, debounced 500ms).
- Added zoom controls: Zoom In, Zoom Out, Fit View, and a 1:1 reset button.
- Capped initial `fitView` at `maxZoom: 1` to prevent excessive zoom-in.
- Persisted viewport to `localStorage` as a quick interim solution — explicitly deferred schema-level persistence to prd0038.
- **In scope:** logger UI, zoom buttons, initial zoom cap, localStorage persistence.
- **Out of scope:** schema-level persistence (prd0038), sub-flow viewports.

## Alternatives Considered
- **Schema-level viewport** in GraphSnapshot — deferred to prd0038, which replaced the localStorage approach entirely.
- **No persistence** — rejected: losing viewport on reload was the primary user complaint.

## Consequences
- Positive: users can see their zoom level, reset to 1:1, and viewport survives reloads.
- Trade-off: localStorage is separate from the main snapshot, creating two persistence paths.
- Risk: localStorage viewport is superseded by prd0038's schema-level persistence — migration from localStorage to canvas.viewport occurs on first load with prd0038.

## Follow-ups
- prd0038 replaced localStorage with `canvas.viewport` in GraphSnapshot v4.
