# PRD 0063: Segment Node Auto-Height

## Context & Previous Attempt

PRD 0045 (2026-05-25) tried auto-height via textarea auto-expand. It failed because the textarea continuously grew to content, making user resize handles useless and causing layout instability. Height was made user-controlled via `NodeResizeControl` as a workaround.

This time the approach is different: auto-height and manual resize coexist under a feature flag. When auto-height is on, resize handles are hidden and the node expands naturally. When off, the current resize behavior is unchanged.

## Solution

### 1. `SegmentCard` component

A reusable content block — fixed width (from props/parent), height grows with content. No React Flow knowledge. Usable inside canvas nodes and later in other views (reading view, accordions, sidebar).

For the textarea variant: `textarea.style.height = 'auto'; textarea.style.height = textarea.scrollHeight + 'px'`. For `contenteditable` or Tiptap: don't set a fixed height — it grows naturally.

### 2. Feature flag: `autoHeight`

- `autoHeight: true` → `SegmentCard` auto-expands, top/bottom resize handles are hidden, height is content-determined.
- `autoHeight: false` → current behavior, user controls height via resize handles.

Don't delete the old resize code — gate it behind the flag. Both modes coexist.

### 3. Write measured height to `canvasData.height`

After content renders and DOM settles, read `offsetHeight` and write to the store via `updateEntity`. Guard: only write when the delta from current `canvasData.height` exceeds 1px. This prevents measure → write → re-render loops. This is the only "measurement" step — the auto-expand itself is pure CSS/HTML.

### 4. Grid snapping

Deferred. Segments are always inside containers — they don't need 16px canvas grid alignment.

## Acceptance Criteria

- **AC1:** `SegmentCard` renders at fixed width, auto-expands height with content.
- **AC2:** Feature flag `autoHeight: false` in defaults. When OFF, existing resize behavior is unchanged.
- **AC3:** When `autoHeight` is ON, top/bottom resize handles are hidden and height follows content.
- **AC4:** On mount and content change, measured DOM height is written to `canvasData.height`, guarded by >1px delta.
- **AC5:** Container nodes are unaffected (container sizing is PRD 0064).

## Files Changed

| File | Change |
|------|--------|
| `src/components/SegmentCard.tsx` | New — fixed-width, auto-expanding content block |
| `src/canvas/nodes/EntityNode.tsx` | Use `SegmentCard`; gate resize handles on `autoHeight` flag; write measured height to store |
| `src/store/useGraphStore.ts` | Add `autoHeight: false` to feature flags |
| `src/engine/layout.ts` | Read `canvasData.height` when available, fall back to `estimateNodeHeight()`; mark estimate `@deprecated` |

## Notes

- Container sizing (bbox of children + padding) belongs in PRD 0064 (sub-dagre pass). That PRD depends on this one for accurate child heights.
- `estimateNodeHeight()` stays as `@deprecated` fallback for nodes without measured heights.
