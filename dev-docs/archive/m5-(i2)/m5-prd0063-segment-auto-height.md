# PRD 0063: Segment Node Auto-Height

> **Completion note (2026-06-03):**
> - **What was built:** SegmentCard component (fixed-width, auto-expanding), autoHeight feature flag in store, EntityNode autoHeight mode (gates resize handles, measures DOM height to canvasData with >1px guard, textarea auto-expand), layout.ts reads canvasData.height and deprecates estimateNodeHeight. Stories for SegmentCard (4) and EntityNode AutoHeightEnabled (1). Unit tests for SegmentCard rendering and measurement guard logic.
> - **Key decisions:** Used `container-type: inline-size` override (via `data-auto-height` attribute) to fix CSS containment preventing content-driven height. Block layout (no flex-col) in autoHeight mode for natural content flow.
> - **Deviations from plan:** None — implementation matches the plan.
> - **Postponed:** Grid snapping for segments (deferred — segments are always inside containers).

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


# appendix

Handoff: Finish PRD 0063 (Segment Auto-Height)
Branch: m5-prd0063-segment-auto-height (on /Users/mats/Code/main/react-roadmap) Diffs against main: 4 files changed — SegmentCard.tsx (new), EntityNode.tsx, useGraphStore.ts, layout.ts

Step 1 — SegmentCard Storybook story
New file: src/stories/SegmentCard.stories.tsx

Pattern: pure component stories (no React Flow wrapper, unlike EntityNode stories). Stories to cover:

ShortContent — "Hello World" text, confirms baseline rendering at fixed width
LongContent — A paragraph of text (~300 chars) that wraps, confirms auto-expand height
EmptyContent — no children, confirms renders without breaking
CustomWidth — width={400} prop, confirms prop works
Import from @/components/SegmentCard, use @storybook/react-vite.

Step 2 — EntityNode autoHeight story
Add to existing src/stories/EntityNode.stories.tsx:

AutoHeightEnabled — entity with long content, wrapped in a store provider that sets featureFlags.autoHeight = true
Key visual check: top/bottom resize handles should be absent (AC3)
The trick: the EntityNode reads useGraphStore directly. To set autoHeight: true, wrap in a store provider or use a pre-configured store via ReactFlowProvider. Look at existing pattern — the story needs to provide a store context with featureFlags.autoHeight = true. Might need a StoreProvider wrapper, or use sb.mock to mock useGraphStore.

Alternative approach (simpler): Use sb.mock in preview.ts to mock the store module, or create a lightweight wrapper component that provides store context. Check existing Decorator patterns in .storybook/preview.ts.

Step 3 — Unit tests
src/components/SegmentCard.test.tsx:

// Test rendering
it("renders at given width")
it("renders children")
it("applies className and style")

// Use vitest + @testing-library/react (already in project)
src/canvas/nodes/EntityNode.test.tsx:

Test the measurement guard logic (the useEffect that reads offsetHeight → writes to canvasData.height)
Key: the >1px delta guard (if (Math.abs(newHeight - currentHeight) > 1))
Mock useGraphStore to verify updateEntity is called with correct canvasData.height
Verify updateEntity is NOT called when delta ≤ 1px
Step 4 — Verification
cd /Users/mats/Code/main/react-roadmap
npx tsc --noEmit
npm run build
npx vitest run
npx storybook test --url http://localhost:6006  # or run-story-tests tool
Step 5 — Merge
# On m5-prd0063-segment-auto-height branch
git add -A && git commit -m "m5: prd0063 - segment auto-height (+ stories + tests)"
git checkout main && git merge --no-ff m5-prd0063-segment-auto-height
After merge
Dagre Phase 1 (sub-dagre + container sizing from PRD 0064) is next since it depends on PRD 0063's measured heights. FS Access improvement and multi-file graph arch deferred to after dagre.


