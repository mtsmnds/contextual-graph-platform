# 2026-05-18: prd0039 — Cmd+drag to duplicate node

## Context

- Users need a fast way to duplicate nodes on the graph canvas without leaving the canvas or using context menus.
- Node positions must remain stable — Dagre's automatic layout was fighting user-positioned nodes and causing visual jumps.
- During Cmd+drag development, a critical bug was discovered: the Cmd+drag handler was constructing a partial positions map and passing it to `setCanvasPositions`, which hard-replaced all saved positions. Every Cmd+drag silently dropped every other node's saved position. On reload, those nodes piled up at (0,0).
- The system had no defense against partial position writes. The bug was a design issue, not a coding mistake — `setCanvasPositions`'s contract was "replace everything" with no guardrails.

## Decision

### 1. `setCanvasPositions` changed from replace to merge

The store action now spreads existing positions under the passed object:
```ts
canvas: { ...state.canvas, positions: { ...state.canvas.positions, ...positions } }
```

A new action `replaceCanvasPositions` preserves the old hard-replace contract for the one caller that needs it (`onRelayout`).

### 2. Dagre disabled via `__experimentalNoDagre`

The initial layout and layout effect skip `getLayoutedElements` entirely. Nodes are created directly from entities/relations with positions from `canvas.positions` or a staggered fallback.

### 3. Position fallback as a canary

When a node has no saved position, the fallback position is used and a `console.warn` is emitted. This surfaces position leaks immediately rather than silently stacking nodes at (0,0).

### 4. Ghost node UX during Cmd+drag

When Cmd+drag starts, semi-transparent ghost copies appear at the original positions. On drop they're removed, originals revert, and real clones appear. This confirms to the user that duplication will occur before they release the mouse.

## Alternatives Considered

- **Keep Dagre, use saved positions as override:** This was the existing behavior. Dagre still ran on every entities/relations change, causing visual jumps and a re-layout tax. Disabling Dagre completely removes this overhead and lets user positions be the sole authority.
- **Keep `setCanvasPositions` as replace, fix each caller:** Would leave the system vulnerable to future partial writes. Making merge the default and replace the explicit escape hatch is the only way to prevent recurrence.
- **Validate positions argument size in `setCanvasPositions`:** Possible but fragile — threshold-based validation would need tuning and wouldn't catch all cases.

## Consequences

- **Positive:** Clone is instantaneous. Positions are preserved atomically (no partial-write damage possible). Console noise if positions ever leak again. Ghost UX makes the feature discoverable.
- **Positive:** Store API is now defensive by default — the common operation (merge) is safe, the rare operation (replace) is explicit.
- **Trade-off:** `replaceCanvasPositions` is available for relayout but currently unused (Dagre is disabled). If re-enabled, the relayout code must remember to use replace, not merge.
- **Risk:** Nodes genuinely lacking saved positions (fresh install, migration edge case) get piled in the staggered fallback instead of at (0,0). The console.warn makes this visible.
