# 2026-06-03: prd0060 — Reintroducing Dagre to Canvas

## Context
- Dagre auto-layout was hardcoded off (`__experimentalNoDagre = true`) during Container Group Nodes (PRD 0045) because the old approach single-sourced everything through the store and conflicted with group node dimensions.
- The i2 threaded-view vision needs dagre to arrange nodes in ordered sequences (vertical stacks for threaded containers, horizontal chains for roadmap), with user control over spacing and node ordering.
- Three distinct concerns were identified: (1) estimating node height from content, (2) reactive dagre sync during edits, (3) a one-shot "run full layout" action.
- Phase 1 (feature flag + basic toggle) preserved the reactive sync. Phase 2 added the UI controls and `runFullLayout` action.

## Decision
- **Three isolated pieces,** not one coupled system:
  - `estimateNodeHeight()` — stopgap function that estimates node height from content text length. Replaceable when DOM auto-sizing lands.
  - Reactive dagre sync — runs when `autoLayout` is ON, respects saved positions (only moves nodes without canvas data).
  - `runFullLayout()` — one-shot action that ignores saved positions, computes fresh layout for all nodes, writes to store via batch (one Cmd+Z undoes it).
- **`autoLayout` toggle in Experimental gates the entire Canvas Layout section.** Toggle OFF = no dagre involvement. Toggle ON = section visible + reactive sync runs.
- **Default rankdir: `TB`** (top-to-bottom, vs old `LR`). Matches book/thread reading order.
- **Sibling segments** (same `parentId`, `contains` edges, sorted by `sortOrder`) **share the same node width** — all segments under a parent get the max width of any sibling.
- **Container nodes** get `Math.max(nodeWidth * 2, 400)` width.
- **`fitViewRef` pattern** — the `fitView` function cannot be passed through the store (ReactFlowProvider boundary). Instead `GraphCanvasContent` exposes a ref, `GraphCanvas` stores it, and passes `onRunLayout` to `AppSidebar` which passes it to `CanvasLayoutSectionContainer`.

## Alternatives Considered
- **Reactive-only (no one-shot action):** Rejected — users need a way to trigger a full layout pass that ignores manual positions.
- **`fitView` through the store:** Rejected — `fitView` comes from `useReactFlow()` which requires ReactFlowProvider. The store is not in the React tree.
- **`LR` (left-to-right) as default:** Rejected — `TB` matches the reading order of books/threads, which is the primary use case.
- **Inlining `estimateNodeHeight` into `getLayoutedElements`:** Rejected — the function is marked as a removable stopgap; keeping it isolated makes removal clean.

## Consequences
- **Positive:** Users can toggle auto-layout on/off, adjust spacing/direction, and trigger a full layout. Three pieces can evolve independently. `runFullLayout` is undoable.
- **Trade-offs:** `estimateNodeHeight` is inaccurate for rich content (Tiptap). Dagre treats the entire graph as one pass — no per-container sub-layout (sub-dagre). Both are tracked for Phase 3.
- **Risks:** The `fitViewRef` pattern is manual wiring — if `GraphCanvasContent` unmounts and remounts, the ref must be repopulated. Currently safe because `GraphCanvas` owns the lifecycle.

## Follow-ups
- **sortOrder-based constraints:** Use dagre `constraints` to enforce ordering based on sibling sort orders.
- **Sub-dagre pass:** Run dagre independently per container group instead of one flat pass.
- **Replace `estimateNodeHeight`:** Use DOM-measured heights from auto-sized entity nodes.
