# m5-prd0045 — Container Group Nodes

## Overview

Entities with `kind: "container"` render as visual group nodes on the canvas using React Flow's sub-flow mechanism (`parentId` + `extent: "parent"`). Children are assigned to containers via drag-and-drop or double-click-inside-create. The parent-child relationship is a first-class domain field (`parentId` on Entity) — this is NOT just a canvas concern; it directly models data hierarchy (e.g., "Hamlet" is the parent of its content). `contains` edges may be added later as a parallel representation, but `parentId` remains the authoritative field. This PRD establishes the visual grouping infrastructure that threaded views, subgraph loading, and URL-routed pages will build on.

**Out of scope:** `contains` edges in the data model, threaded vertical layout, collapse/expand, container breadcrumbs, URL routing for container views.

---

## Specification / Acceptance Criteria

### 1. Container Group Node Component (Story 1.0)

Entities with `kind: "container"` render as a new React Flow node type `"containerGroup"` — a visual container box that encloses its children.

- **Header bar:** Container title (entity `content`) on the left, kind badge on the right. Uses existing `BaseNodeHeader` + `Badge` patterns.
- **Child area:** Padded region (`.p-3`) where child nodes render inside the parent bounds. Subtle inner background tint (`bg-accent/30`) to visually distinguish the container interior.
- **Handles:** Four `BaseHandle` components (top/right/bottom/left) on the group node itself, enabling edges to/from the container as a whole. These use `type: "source"` (same as EntityNode).
- **Resize:** `NodeResizeControl` on all four edges. Min dimensions: `minWidth: 260, minHeight: 120`.
- **No inline text editing on the container itself** — double-click inside the child area creates a child node (Story 3), not inline edit on the container. Container title editing remains via metadata panel (existing) or future context menu action.
- **Selection highlight:** Same `.in-[.selected]` border/shadow pattern as EntityNode via `BaseNode`.

### 2. Layout Engine — Parent-Child Derivation (Story 1.5)

When converting entities to React Flow nodes, `entity.parentId` drives React Flow's `parentId` and `extent`:

- **Entity with `parentId` set:** React Flow node gets `parentId: entity.parentId`, `extent: "parent"`. Position is relative to the parent's top-left corner.
- **Entity without `parentId`:** Root-level node (no `parentId`). Position is absolute (existing behavior).
- **Entity with `kind: "container"`:** Renders as `type: "containerGroup"`. If it has no explicit width/height in `canvasData`, defaults to `width: 400, height: 300`.
- **Layout execution:** Root-level nodes + container group nodes are positioned via existing Dagre (or no-Dagre fallback). For each container, a sub-Dagre pass lays out its children within the parent coordinate space (positions treated as relative offsets). The sub-Dagre is triggered on `useNodesInitialized` and on demand.

**Node array ordering rule:** Parent (container group) nodes must appear before their children in the `nodes` array — enforced by the layout builder.

### 3. Double-Click to Create Child Node (Story 1.2)

- **Double-click on empty space inside a container's child area** → creates a new entity as a child of that container.
- The new entity gets `parentId = containerId` and `canvasData: { x: clickX - parentX, y: clickY - parentY }` (position relative to parent).
- Default `kind: "segment"` for children created inside containers (different from pane double-click which creates `"concept"`).
- The new node enters inline edit mode immediately (`editTrigger` pattern, existing).
- If the double-click lands on an existing child node, that node enters inline edit (existing behavior, no change).

**Implementation note:** GraphCanvas's existing double-click handler already checks `el.closest(".react-flow__node")`. For Story 3, we need to distinguish between "clicked on the container group node's child area" vs "clicked on a child node inside." The container group's header area should NOT trigger child creation (double-clicking the header does nothing or enters container title edit — deferred).

### 4. Drag-to-Assign Node into Container (Story 1.3)

- **Drag an existing node over a container's visual bounds and drop** → the node becomes a child of that container.
- Detection happens in `onNodeDragStop`: compare the dragged node's final absolute position against all container group node bounds. If the node center falls within a container's rect, set `parentId = containerId`.
- If the node is already a child of a different container, `parentId` is updated (reassigned). No confirmation dialog — immediate.
- If the node is dragged to empty space outside any container, any existing `parentId` is removed (set to `undefined`).
- **React Flow's native `extent: "parent"`** prevents children from being dragged outside parent bounds during drag. For the transition period (dragging a root node into a container or reassigning), `extent` is updated after the drop.

### 5. Relative Position Retention (Story 1.4)

- When a container is dragged, all children move with it automatically (React Flow's sub-flow system).
- Child positions relative to the parent are preserved in `canvasData` (existing position persistence in `onNodeDragStop`).
- Verified in testing — zero implementation cost on our side. React Flow handles this natively.

### 6. Cross-Boundary Edge Connections (Story 2.1)

- Children inside containers can have edges to nodes outside the container.
- Handles on child nodes remain fully operational.
- Edges cross group boundaries without rendering issues.
- Verified in testing — zero implementation cost. React Flow supports this natively.

---

## Edge Cases

- **Delete container entity:** All children lose their `parentId` (set to `undefined` in `canvasData`). Children become root-level nodes. Their positions are converted from relative-to-parent to absolute screen coordinates (`childX + parentX, childY + parentY`). Batch operation via `beginBatch`/`endBatch`.
- **Drag child out of container:** `extent: "parent"` prevents accidental exit during drag. To move a child out, the user must drag the child to the container edge (which triggers `expandParent` if enabled) or use a future "detach" context menu action. For now, moving a child out requires: drag to edge → container auto-expands enough to let the child reach outside nodes → drop → `onNodeDragStop` detects position outside parent → removes `parentId`.
- **Nested containers:** Container A inside Container B is supported by React Flow's sub-flow system (deep nesting). Both are `kind: "container"`. Layout engine handles recursively. No depth limit enforced.
- **Existing `"container"` entities at upgrade:** When this PRD ships, any entity with `kind: "container"` renders as a `containerGroup` node. If no `canvasData.width`/`height` exist, defaults to 400×300. Existing children (if any had `parentId` manually set) are preserved.
- **Empty container:** Renders at minimum size (260×120) with just the header bar. No placeholder text. Resize handles allow expansion.
- **Container too small for children:** If children positions exceed the parent bounds and `extent: "parent"` is set, children are visually clipped. `expandParent: true` on children causes the parent to auto-grow when a child approaches the edge during drag.
- **Double-click on container header vs child area:** The header bar (title + badge) does NOT trigger child creation on double-click. Only the padded child area does. This requires the container group component to differentiate between header and body click targets.
- **Entity schema:** `Entity` gains optional `parentId?: string`. Schema version stays at v5 (backward-compatible optional field). Migration not required — field is optional.
- **Re-layout button (currently gated):** If the re-layout button is ungated later, it must handle sub-flows: root nodes laid out by Dagre, then each container's children laid out by sub-Dagre within their parent bounds.

---

## Interface / Implementation

### New files

- `src/canvas/nodes/ContainerGroupNode.tsx` — Custom React Flow node component.

### Changes to existing files

- `src/types/graph.ts` — Add `parentId?: string` to `CanvasData`.
- `src/canvas/GraphCanvas.tsx` — Register `"containerGroup"` node type. Update node builder to set `parentId`/`extent`/`expandParent` from `canvasData`. Update `onNodeDragStop` for drag-to-assign detection. Update double-click handler for container child creation. Update `onNodesDelete` for container deletion cascade (reparent children).
- `src/engine/layout.ts` — Add sub-Dagre pass: for each container, lay out children within parent coordinate space.
- `src/index.css` — Styles for container group node (inner background, child area padding, header styling).

### Tech stack

| Concern | Choice | Why |
|---------|--------|-----|
| Styling | Tailwind CSS | Already in use project-wide |
| Node layout | `BaseNode`, `BaseNodeHeader`, `BaseNodeContent` | Existing pattern from EntityNode |
| Badge | `@/components/ui/badge` | Already in use |
| Handles | `@/components/base-handle` | Existing pattern |
| Resize | `NodeResizeControl` from `@xyflow/react` | Existing pattern in EntityNode |
| Icons | `@phosphor-icons/react` | Already in project |
| No new shadcn installs | — | Badge, Button, ButtonGroup already available |

### New buttons / actions

- **No new toolbar/panel buttons.** The feature is canvas-interaction-driven (drag, double-click).
- **Context menu on container group nodes:** gains "Add Child Node" action — creates a child at `{x: 20, y: 60}` relative to parent (below the header). Same batch as existing context menu actions.

### UX flow summary

| Action | Gesture | Result |
|--------|---------|--------|
| Create container | Existing pane double-click, then change kind to "container" (or future toolbar option) | New container group node at click position |
| Add child to container | Double-click in container child area | New "segment" node inside container, enters edit mode |
| Assign existing node to container | Drag node over container, drop | Node's `parentId` set, `extent: "parent"` applied |
| Remove child from container | Drag child to container edge → out → drop | `parentId` removed, node becomes root-level |
| Move container | Drag container | All children move with it automatically |
| Connect to/from container | Drag from container handle to another node (or vice versa) | Edge created to/from the container entity |
| Delete container | Select + Backspace/Delete | Children reparented to root, positions converted to absolute |
| Resize container | Drag resize handles | Container grows/shrinks, children remain within bounds |

---

## Files Changed (inferred)

- `src/canvas/nodes/ContainerGroupNode.tsx` (new) — Container group custom node with header, child area, handles, resize controls
- `src/types/graph.ts` — `Entity` gains `parentId?: string` (first-class domain field, not in canvasData)
- `src/store/useGraphStore.ts` — `addEntity` accepts optional `parentId`; `deleteEntity` cascade reparents children (sets `parentId` to `undefined`)
- `src/canvas/GraphCanvas.tsx` — Register `"containerGroup"` node type; update node builder for `parentId`/`extent`/`expandParent`; update double-click handler for container-aware creation; update `onNodeDragStop` for drag-to-assign; update `onNodesDelete` for container deletion cascade; context menu "Add Child Node" on containers
- `src/engine/layout.ts` — Sub-Dagre pass for container children; ensure parent-first ordering
- `src/canvas/GraphContextMenu.tsx` — "Add Child Node" action for container type nodes
- `src/index.css` — Container group node styles
- `src/store/useGraphStore.ts` — `addEntity` accepts optional `parentId`; `deleteEntity` cascade reparents children

## Phases

Single pass. The work is tightly coupled — group node component + layout derivation + interaction handlers all depend on each other.

## Size Advisory

~5-6 files. One new component (~80-100 lines), schema field addition (1 line), wiring in GraphCanvas (~60-80 lines), sub-Dagre in layout (~40 lines), CSS (~15 lines). Existing patterns reused throughout.
