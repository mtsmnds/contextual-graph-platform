# 2026-05-22: prd0041 — node metadata panel

## Context
- The graph canvas had no way to inspect or edit entity metadata beyond inline content editing.
- The metadata field (`Record<string, unknown>`) on entities was invisible to the user.
- We needed a mechanism where some metadata keys (like `author`) are backed by graph relations, not just plain strings.
- Positioning a floating card on the canvas was brittle due to React Flow viewport transforms.

## Decision
1. **Metadata as a React Flow node** — Not a floating card. A custom `"metadata"` node type connected to the entity node by a decorative dashed edge. This leverages existing canvas UX (drag, resize, zoom) without fighting viewport transforms.
2. **Context menu toggle lifecycle** — Not selection-based. "Metadata: Hidden" / "Metadata: Visible" toggle per entity. Multiple metadata nodes can be visible at once, independently. Deletion of the entity removes its metadata node.
3. **Edge-derived metadata registry** — `src/engine/edge-metadata.ts` with declarative mapping of metadata keys → relation config. The `author` key creates a `contains` relation from an author entity to the book entity when written. Read path resolves the author name from the edge.
4. **Position persistence** — Metadata node positions stored in `canvas.positions["metadata:{entityId}"]`. Default position: left of the entity node (against the normal left-to-right flow). Drag saves position via existing `setCanvasPositions`.

## Alternatives Considered
- **Floating card positioned via bounding rect** — Brittle with viewport transforms, would get covered or overlap other nodes, no drag/resize.
  - Rejected: the node-as-card approach reuses existing canvas infrastructure.
- **Sidebar panel instead of canvas node** — Clean separation, but removes the spatial association between entity and metadata. User loses drag/resize.
  - Rejected: too big a departure from the canvas-centric UX.
- **Selection-based show/hide** — Auto-show on select, auto-hide on deselect. Simple but prevents multiple metadata nodes being visible simultaneously.
  - Rejected: the toggle approach gives the user control over persistence during long operations.

## Consequences
- **Positive:** Metadata editing is now possible. Users can edit content, kind, and metadata key-value pairs inline on the canvas. Metadata nodes are draggable and resizable.
- **Positive:** The `"metadata"` node type proves the pattern for future view-only nodes (thread headers, group containers).
- **Positive:** The edge-derived metadata registry (`edge-metadata.ts`) extends naturally to other keys (`publisher`, `illustrator`, etc.).
- **Trade-off:** Metadata nodes are React Flow nodes with full property overhead (position, dimensions) per entity. At scale (hundreds of visible metadata nodes), this adds render cost. Mitigated by toggling — users control how many are visible.
- **Risk:** The decorative edge requires hidden `<Handle>` components on the metadata node for React Flow's path calculation. This is a harmless but visible implementation detail.

## Follow-ups
- Extend edge-derived metadata registry with more keys (publisher, year, etc.)
- Consider performance if users keep many metadata nodes visible simultaneously
- Thread and group views will reuse the `"metadata"` node type pattern for container headers and thread labels
