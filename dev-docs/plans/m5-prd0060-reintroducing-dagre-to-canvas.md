# PRD 0060: Reintroducing Dagre to Canvas

## Overview

Re-enable the dagre auto-layout engine in GraphCanvas, which was hardcoded off (`__experimentalNoDagre = true`) during the Container Group Nodes PRD (0045). Step 1 wires dagre behind a feature flag toggle in the Experimental sidebar section. Further steps will add a dedicated Layout sidebar section for user-facing dagre controls (direction, spacing, sortOrder-based constraints).

This builds toward the i2 threaded-view vision: dagre arranging nodes in ordered sequences (horizontal chains for roadmap, vertical stacks for threaded containers), with user control over spacing and node ordering.

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

## Phase 2+ (TBD)

- Dedicated "Layout" sidebar section with dagre controls (rankdir, nodesep, ranksep)
- sortOrder-based constraints for threaded ordering within ranks
- Per-container sub-dagre passes
- Stories for any new sidebar components
