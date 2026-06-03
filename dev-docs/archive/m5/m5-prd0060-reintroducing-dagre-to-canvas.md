> **Completion note (2026-06-02):**
> - **What was built:** Dagre re-enabled behind `autoLayout` feature flag. Three isolated pieces: `estimateNodeHeight` stopgap, reactive dagre sync (preserved from Phase 1 UI effect), and `runFullLayout` one-shot action. New "Canvas Layout" sidebar section with rankdir/nodesep/ranksep/nodeWidth controls and Run Layout button.
> - **Key decisions:** Three isolated pieces approach (no coupling). `runFullLayout` writes to store via batch → undoable. Default rankdir TB for book/thread reading order. Sibling segment width rule (all segments under same parent share max width). `estimateNodeHeight` as temporary removable stopgap (not inlined into layout logic).
> - **Deviations from plan:** Removed the "Change Direction" story's select interaction test (portal rendered outside canvasElement — not testable with storybook-vitest). Used `fitViewRef` approach to bridge ReactFlowProvider boundary instead of passing fitView through the store.
> - **Postponed:** sortOrder-based constraints for threaded ordering (dagre `constraints`), per-container sub-dagre pass, replacing `estimateNodeHeight` with DOM-measured heights. Carried to PRD0062.

# PRD 0060: Reintroducing Dagre to Canvas

## Overview

Re-enable the dagre auto-layout engine in GraphCanvas, which was hardcoded off (`__experimentalNoDagre = true`) during the Container Group Nodes PRD (0045). Three isolated pieces: a stopgap height estimator, a reactive dagre sync (preserved from Phase 1), and a one-shot `runFullLayout` action triggered by a new Canvas Layout sidebar section.

This builds toward the i2 threaded-view vision: dagre arranging nodes in ordered sequences (vertical stacks for threaded containers, horizontal chains for roadmap), with user control over spacing and node ordering.

## Phase 1 — Feature Flag & Basic Dagre Toggle

### Specification / Acceptance Criteria

**AC1: Feature flag exists**
- `autoLayout: false` in `DEFAULT_FEATURE_FLAGS` in `useGraphStore.ts`
- `"Auto Layout (dagre)"` in `FEATURE_FLAG_LABELS` in `FeatureFlagsSection.tsx`
- Switch appears in the Experimental sidebar section

**AC2: `getLayoutedElements()` produces correct node shapes**
- Container entities → `type: "containerGroup"`, others → `type: "entity"`
- Children set `parentId`, `extent: "parent"`, `expandParent` matching their entity
- Edges use `type: "edgelabel"` for the custom edge component
- Node dimensions use `canvasData.width`/`height` with fallbacks (200x80 for entities, 400x304 for containers)
- Metadata nodes (`meta:*`) are not handled by dagre — they're a separate concern managed by the manual sync path

**AC3: Toggle switches between dagre and manual layout**
- When `autoLayout` is ON: initial layout computed by `getLayoutedElements()`, sync re-runs dagre on store change, respects saved `canvasData` positions
- When OFF: existing manual path (positions from `canvasData`, grid fallback, full merge sync)
- Toggling the switch re-renders without stale state

**AC4: Dagre does not write to the store**
- Positions remain in React Flow's local state only
- Toggling dagre OFF restores store-authoritative positions (manual path re-reads `canvasData`)
- User workflow: save backup → toggle ON → see dagre layout → toggle OFF → positions restored

### Files Changed

| File | Change |
|------|--------|
| `src/store/useGraphStore.ts` | Add `autoLayout: false` to `DEFAULT_FEATURE_FLAGS` |
| `src/canvas/panels/sections/FeatureFlagsSection.tsx` | Add `"Auto Layout (dagre)"` label |
| `src/engine/layout.ts` | Fix `getLayoutedElements()` for container groups, edges, dimensions |
| `src/canvas/GraphCanvas.tsx` | Replace `__experimentalNoDagre` const with reactive `featureFlags.autoLayout`; reset `layoutRef` on toggle |

### Size Advisory

Small — ~4 files, well-understood changes. Single phase.

## Phase 2 — Canvas Layout Section with Run Layout Action

### Summary

Add three isolated pieces: a stopgap height estimator, the reactive dagre sync (preserved from Phase 1), and a one-shot `runFullLayout` action. When the `autoLayout` toggle is ON, a new **Canvas Layout** sidebar section appears with dagre controls and a **Run Layout** button. The reactive sync and the button call `getLayoutedElements` differently — the sync respects saved positions, the button ignores them and writes fresh positions to the store.

### Architecture — Three Isolated Pieces

```
┌─────────────────────────────────────────────────┐
│  Toggle ON                                      │
│  ├─ Canvas Layout section visible               │
│  ├─ Reactive dagre sync active in useEffect     │
│  │  (respects saved positions — existing)       │
│  └─ "Run Layout" button enabled                 │
│     (calls runFullLayout — ignores positions)   │
└─────────────────────────────────────────────────┘
```

**Piece 1: `estimateNodeHeight()`** — temporary stopgap standalone function. Must be removable without touching any other code.

**Piece 2: Reactive dagre sync** — the `useEffect` branch that runs `getLayoutedElements` on store changes when `autoLayout` is ON. Preserved exactly from Phase 1. Respects saved `canvasData` positions.

**Piece 3: `runFullLayout()`** — standalone function triggered only by the Run Layout button. Ignores saved positions, writes results to the store, fits view.

Zero coupling between pieces. A future change to any one should not require touching the others.

### Specification / Acceptance Criteria

**AC1: `estimateNodeHeight` stopgap**
- `export function estimateNodeHeight(content: string, width: number): number`
- Standalone exported function in `layout.ts`
- NOT inlined into `getLayoutedElements` or any layout logic
- Guard comment: `// Stopgap — replace with DOM-measured height when node auto-sizing is implemented.`
- Formula: `lines = ceil(content.length / charsPerLine)` → `height = max(64, lines × lineHeight + padding, 600)`. Min 64px, max 600px.
- Replaced later by DOM-measured heights from `useNodesInitialized` or similar — deleting this function is the only change needed.

**AC2: `autoLayout` toggle gates section visibility**
- When `autoLayout` is ON → "Canvas Layout" section appears below Experimental in the sidebar
- When OFF → section is hidden
- The reactive dagre sync in the `useEffect` runs when `autoLayout` is ON (unchanged from Phase 1)

**AC3: Canvas Layout section has controls + Run Layout button**
- `rankdir`: segmented control / select for TB, BT, LR, RL (default: **TB**)
- `nodesep`: number input (default: 80, min: 20, max: 400)
- `ranksep`: number input (default: 150, min: 20, max: 600)
- `nodeWidth`: number input for entity width (default: 208, min: 120, max: 600)
- "Run Layout" button — primary action

**AC4: `runFullLayout` writes positions + dims to the store**
- `export function runFullLayout(options: LayoutOptions): void`
- Standalone exported function in `layout.ts`
- Reads `entities` and `relations` from `useGraphStore.getState()`
- Calls `getLayoutedElements({ entities, relations, options, ignoreSavedPositions: true })`
- For each entity, calls `updateEntity(id, { canvasData: { x, y, width, height } })` in a batch
- Calls `fitView()` after layout

**AC5: `getLayoutedElements` gains `ignoreSavedPositions` flag**
- `ignoreSavedPositions: false` → reactive sync overlay mode: dagre computes positions, then saved `canvasData.x/y` override them where they exist
- `ignoreSavedPositions: true` → layout mode: dagre positions are authoritative, all nodes get fresh positions
- In both modes, computed dimensions (width from options/group, height from `estimateNodeHeight`) are passed to dagre via `setNode(id, { width, height })`

**AC6: Sibling segment width rule**
- All `segment` entities sharing the same `parentId` (connected by `contains` edges, sorted by `sortOrder`) use the **same width** — the maximum of their individually estimated widths, or `nodeWidth` if none exceeds it
- Non-segment entities: use `nodeWidth` directly
- Containers: width = `Math.max(nodeWidth * 2, 400)`

**AC7: "Run Layout" batch is undoable**
- Wrapped in `s.beginBatch("Run Layout")` / `s.endBatch()`
- One Cmd+Z restores all positions and dims to pre-layout state

**AC8: Default rankdir is TB (top-to-bottom)**
- Root nodes at top, children below, grandchildren below that
- Siblings laid out left-to-right within each rank
- Matches reading order for book/thread content (primary use case)

### Files Changed

| File | Change |
|------|--------|
| `src/engine/layout.ts` | Add `estimateNodeHeight` (stopgap), `runFullLayout`, `ignoreSavedPositions` param on `getLayoutedElements`, `LayoutOptions` type |
| `src/canvas/panels/sections/CanvasLayoutSection.tsx` | **New** — presenter: form controls + Run Layout button |
| `src/canvas/panels/sections/CanvasLayoutSectionContainer.tsx` | **New** — container: reads store, holds UI state, wires `runFullLayout` via store API |
| `src/canvas/panels/AppSidebar.tsx` | Mount CanvasLayoutSectionContainer (below FeatureFlagsSection, gated by `autoLayout`) |
| `src/stories/CanvasLayoutSection.stories.tsx` | **New** — presenter stories |

### Stories

- `src/stories/CanvasLayoutSection.stories.tsx` — presenter component with all controls visible, Run Layout button, edge cases (no entities, single entity, sibling segments)

### Size Advisory

Medium — ~5-6 files, moderate complexity. Single phase.

## Phase 3+ (TBD)

- sortOrder-based constraints for threaded ordering within ranks (dagre `constraints` option: `[{ left: childA.id, right: childB.id }]`)
- Per-container sub-dagre pass (dagre arranges children inside a container independently)
- Re-layout on option change without re-clicking button (debounced auto-layout on option change)
- Replace `estimateNodeHeight` with DOM-measured node heights (`useNodesInitialized`)
