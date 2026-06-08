# PRD 0068: Undo/Redo Dimension Sync — Post-hoc

## Status: RESOLVED

## Overview

After `syncNodeDimensions` was introduced (PRD 0066) to fix programmatic node resizing, undo/redo stopped updating the canvas visually for containers. Entity data restored correctly (positions moved, dimensions reverted in the store), but the DOM stayed at the post-action size.

## Root Cause

The sync effect had an `if (!autoLayout) { ... return }` structure. The `prevDims` capture and post-loop `syncNodeDimensions` call were **inside** the `!autoLayout` branch only. Stack Children requires `autoLayout=true`, so any undo/redo after Stack Children took the `else` branch which had no dimension sync at all. The `prevDims` never captured, the comparison never ran, and `syncNodeDimensions` was never called.

```
Before (broken)
    useEffect(() => {
        if (!autoLayout) {
            prevDims = ...        ← only for non-autoLayout
            setNodes(...)
            post-loop sync(...)   ← only for non-autoLayout
            return                ← exits early
        }
        // auto-layout code here  ← no dimension sync at all
    }, [...])
```

## Fix

Restructured the sync effect so that `prevDims` capture and the post-loop sync run unconditionally, regardless of `autoLayout`:

```
After (fixed)
    useEffect(() => {
        prevDims = ...            ← always, before any setNodes

        if (!autoLayout) {
            setNodes(...)
        } else {
            // auto-layout code
        }

        post-loop sync(...)       ← always, after whichever branch ran
    }, [...])
```

## Acceptance Criteria

- AC1: Undo after Stack Children restores container dimensions visually (not just in store).
- AC2: Redo after Stack Children restores stacked dimensions visually.
- AC3: Positions still update correctly on undo/redo (no regression from restructuring).
- AC4: Non-autoLayout mode undo/redo still works (unchanged behavior).

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | Restructured sync effect: moved `prevDims` before `if/else`, converted `if/return` to `if/else`, placed post-loop sync after both branches |

## Tests

Manual verification — undo/redo after Stack Children now restores container dimensions visually.

## ADR

See `dev-docs/archive/m5/2026-06-07-m5-prd0068-undo-redo-dimension-sync.md`
