# m5-prd0045 — Container Group Nodes

## Overview

Entities with `type: "container"` render as visual group nodes on the canvas using React Flow's sub-flow mechanism (`parentId` + `extent: "parent"`). Children are assigned to containers via drag-and-drop or double-click-inside-create. The parent-child relationship is a first-class domain field (`parentId` on Entity) — this directly models data hierarchy (e.g., "Hamlet" is the parent of its content). `contains` edges may be added later as a parallel representation, but `parentId` remains the authoritative field. This PRD establishes the visual grouping infrastructure that threaded views, subgraph loading, and URL-routed pages will build on.

> **Renaming:** This PRD renames `EntityKind` to `EntityType` across the codebase. The term "kind" is replaced with "type" everywhere — in types, enums, store actions, component props, and documentation. The values stay the same (`"segment"`, `"container"`, `"annotation"`, `"concept"`, `"summary"`).

**Out of scope:** `contains` edges in the data model, threaded vertical layout, collapse/expand, container breadcrumbs, URL routing for container views.

---

## Specification / Acceptance Criteria

### 1. Container Group Node Component (Story 1.0)

Entities with `type: "container"` render as a new React Flow node type `"containerGroup"` — a visual container box that encloses its children.

- **Header bar:** Container title (entity `content`) on the left. **No badge** — the entity type badge is removed from container group nodes (it lives in the metadata panel already; showing it in two places is redundant).
- **Title editing:** Double-clicking the header title area enters inline text editing on the container's `content` (same `editTrigger` pattern as EntityNode). Escape/blur to commit.
- **Child area:** Padded region (`.p-3`) where child nodes render inside the parent bounds. Subtle inner background tint (`bg-accent/30`) to visually distinguish the container interior.
- **Handles:** Four `BaseHandle` components (top/right/bottom/left) on the group node itself, enabling edges to/from the container as a whole. These use `type: "source"` (same as EntityNode).
- **Resize:** `NodeResizeControl` on all four edges. Min dimensions: `minWidth: 260, minHeight: 120`.
- **Selection highlight:** Same `.in-[.selected]` border/shadow pattern as EntityNode via `BaseNode`.

### 2. Layout Engine — Parent-Child Derivation (Story 1.5)

When converting entities to React Flow nodes, `entity.parentId` drives React Flow's `parentId` and `extent`:

- **Entity with `parentId` set:** React Flow node gets `parentId: entity.parentId`, `extent: "parent"`, `expandParent: true`. Position is relative to the parent's top-left corner. `expandParent: true` ensures the parent auto-grows when a child is dragged toward the edge.
- **Entity without `parentId`:** Root-level node (no `parentId`). Position is absolute (existing behavior).
- **Entity with `type: "container"`:** Renders as `type: "containerGroup"`. If it has no explicit width/height in `canvasData`, defaults to `width: 400, height: 300`.

**Dagre and user positions:** Container group nodes (and their children) follow the same rule as regular nodes — Dagre does NOT overwrite user-chosen positions or dimensions. If the user has saved `canvasData` positions/width/height, those are authoritative. Dagre is only a fallback for new entities without saved canvasData. The sub-Dagre pass for children within a parent also respects saved positions.

**Z-indexing:** Children must render on top of parents. React Flow handles this automatically for sub-flows — edges connected to children render above nodes, and the parent-first ordering in the `nodes` array ensures correct stacking.

**Node array ordering rule:** Parent (container group) nodes must appear before their children in the `nodes` array — enforced by the layout builder.

### 3. Double-Click to Create Child Node (Story 1.2)

- **Double-click on empty space inside a container's child area** → creates a new entity as a child of that container.
- The new entity gets `parentId = containerId` and `canvasData: { x: clickX - parentX, y: clickY - parentY }` (position relative to parent).
- Default `type: "segment"` for children created inside containers (different from pane double-click which creates `"concept"`).
- The new node enters inline edit mode immediately (`editTrigger` pattern, existing).

> **Bug note:** Currently, newly created nodes do NOT enter inline edit mode, even though the `editTrigger` mechanism exists. This is a bug — the expected behavior is that any node created by the user (pane double-click, container double-click, context menu) enters inline edit mode immediately. This PRD depends on that bug being fixed (either as a prerequisite or as part of this work).

- If the double-click lands on an existing child node, that node enters inline edit (existing behavior, no change).

**Implementation note:** GraphCanvas's existing double-click handler already checks `el.closest(".react-flow__node")`. For Story 3, we need to distinguish between "clicked on the container group node's child area" vs "clicked on a child node inside" vs "clicked on the container header." The container group's header triggers inline title editing (Story 1). Only clicks in the child area (below the header, not on a child node) trigger child creation.

### 4. Drag-to-Assign Node into Container (Story 1.3)

- **Drag an existing node over a container's visual bounds and drop** → the node becomes a child of that container.
- Detection happens in `onNodeDragStop`: compare the dragged node's final absolute position against all container group node bounds. If the node center falls within a container's rect, set `parentId = containerId`.
- If the node is already a child of a different container, `parentId` is updated (reassigned). No confirmation dialog — immediate.
- If the node is dragged to empty space outside any container, any existing `parentId` is removed (set to `undefined`).
- **React Flow's native `extent: "parent"`** prevents children from being dragged outside parent bounds during drag. For the transition period (dragging a root node into a container or reassigning), `extent` is updated after the drop.

### 5. Group Creation (Story 1.6)

- **Pane double-click → context menu offers two options:** "New Node" (existing, creates `type: "concept"`) and "New Group" (creates `type: "container"` at the click position with default dimensions 400×300).
- **Context menu on pane** gains "New Group" action alongside existing "New Node."
- **Context menu on container group nodes:** gains "Add Child Node" action (creates `type: "segment"` at `{x: 20, y: 60}` relative to parent, below the header).
- **Context menu on child nodes inside a group:** gains "Detach from Group" action — removes `parentId`, converts position to absolute, node becomes root-level.

### 6. Relative Position Retention (Story 1.4)

- When a container is dragged, all children move with it automatically (React Flow's sub-flow system).
- Child positions relative to the parent are preserved in `canvasData` (existing position persistence in `onNodeDragStop`).
- Verified in testing — zero implementation cost on our side. React Flow handles this natively.

### 7. Cross-Boundary Edge Connections (Story 2.1)

- Children inside containers can have edges to nodes outside the container.
- Handles on child nodes remain fully operational.
- Edges cross group boundaries without rendering issues.
- Verified in testing — zero implementation cost. React Flow supports this natively.

---

## Edge Cases

- **Delete container entity:** All children lose their `parentId` (set to `undefined`). Children become root-level nodes. Their positions are converted from relative-to-parent to absolute screen coordinates (`childX + parentX, childY + parentY`). Batch operation via `beginBatch`/`endBatch`.
- **Detach from group:** Child node context menu gains "Detach from Group" action. Removes `parentId`, converts position from relative-to-parent to absolute screen coordinates (`childX + parentX, childY + parentY`), and removes `extent: "parent"`. Node becomes root-level. (Smart drag-out-to-detach is deferred as a future UX improvement — see i1-backlog.)
- **Nested containers:** Container A inside Container B is supported by React Flow's sub-flow system (deep nesting). Both are `type: "container"`. Layout engine handles recursively. No depth limit enforced.
- **Existing `"container"` entities at upgrade:** When this PRD ships, any entity with `type: "container"` renders as a `containerGroup` node. If no `canvasData.width`/`height` exist, defaults to 400×300. Existing children (if any had `parentId` manually set) are preserved.
- **Empty container:** Renders at minimum size (260×120) with just the header bar. No placeholder text. Resize handles allow expansion.
- **Container too small for children:** If children positions exceed the parent bounds and `extent: "parent"` is set, children are visually clipped. `expandParent: true` on every child causes the parent to auto-grow when a child approaches the edge during drag.
- **Double-click on container header vs child area:** The header bar triggers inline title editing on double-click. The padded child area (below the header, not on an existing node) triggers child node creation.
- **Entity schema:** `Entity` gains optional `parentId?: string`. Schema version stays at v5 (backward-compatible optional field). Migration not required — field is optional.
- **Re-layout button (currently gated):** If ungated later, must respect saved `canvasData` (same as now) and handle sub-flows: root nodes laid out by Dagre, then each container's children laid out by sub-Dagre within parent bounds.
- **`expandParent: true`** is set on ALL child nodes by default. This is not user-configurable — it's the always-on behavior for this milestone.

---

## Interface / Implementation

### New files

- `src/canvas/nodes/ContainerGroupNode.tsx` — Custom React Flow node component.

### Changes to existing files

- `src/types/graph.ts` — Rename `EntityKind` → `EntityType` project-wide. Add `parentId?: string` to `Entity` (first-class domain field, not in `canvasData`).
- `src/store/useGraphStore.ts` — Update all `kind` → `type` references. `addEntity` accepts optional `parentId`. `deleteEntity` cascade reparents children.
- `src/canvas/nodes/EntityNode.tsx` — Update `kind` → `type` in data type and Badge display.
- `src/canvas/nodes/MetadataNode.tsx` — Update `kind` → `type` in the select dropdown.
- `src/canvas/GraphCanvas.tsx` — Register `"containerGroup"` node type. Update node builder for `parentId`/`extent`/`expandParent`. Update double-click handler for container-aware creation. Update `onNodeDragStop` for drag-to-assign. Update `onNodesDelete` for container deletion cascade. Context menu: "New Group" on pane, "Add Child Node" on containers. Fix inline-edit-on-create bug.
- `src/engine/layout.ts` — Sub-Dagre pass for container children (respects saved `canvasData`; Dagre is fallback only). Ensure parent-first ordering.
- `src/data/seed.ts` — Update `kind` → `type` in seed entities.
- `src/canvas/GraphContextMenu.tsx` — "New Group" action on pane; "Add Child Node" and "Detach from Group" actions for container/child nodes.
- `src/components/base-node.tsx` — No changes (reused as-is).
- `src/index.css` — Container group node styles (inner background, child area padding, header styling).

### Tech stack

| Concern | Choice | Why |
|---------|--------|-----|
| Styling | Tailwind CSS | Already in use project-wide |
| Node layout | `BaseNode`, `BaseNodeHeader`, `BaseNodeContent` | Existing pattern from EntityNode |
| Handles | `@/components/base-handle` | Existing pattern |
| Resize | `NodeResizeControl` from `@xyflow/react` | Existing pattern in EntityNode |
| Icons | `@phosphor-icons/react` | Already in project |
| shadcn | Use `shadcn` skill when needed during implementation | Button, Badge, ButtonGroup already installed |

### New buttons / actions

| Location | Action | Result |
|----------|--------|--------|
| Pane context menu | "New Group" | Creates container node at click position (400×300) |
| Container context menu | "Add Child Node" | Creates child node at `{20, 60}` relative, enters edit |

### UX flow summary

| Action | Gesture | Result |
|--------|---------|--------|
| Create group | Pane double-click → "New Group" (or context menu) | New `containerGroup` at click position, 400×300 |
| Create regular node | Pane double-click (existing) → "New Node" | New `entity` at click position (existing behavior) |
| Edit container title | Double-click container header text | Inline edit on container `content` |
| Add child to container | Double-click in container child area | New `type: "segment"` inside container, enters edit mode |
| Assign node to container | Drag node over container, drop | Node's `parentId` set, `extent: "parent"` + `expandParent: true` applied |
| Detach child from container | Context menu on child → "Detach from Group" | `parentId` removed, position converted to absolute, node becomes root-level |
| Move container | Drag container | All children move with it automatically |
| Connect to/from container | Drag from container handle to another node | Edge created to/from the container entity |
| Delete container | Select + Backspace/Delete | Children reparented to root, positions converted to absolute |
| Resize container | Drag resize handles | Container grows/shrinks, children remain within bounds |

---

## Phases

Single pass. The work is tightly coupled — group node component + layout derivation + interaction handlers all depend on each other. The `EntityKind` → `EntityType` rename touches many files but is a mechanical find-and-replace.

## Size Advisory

~8-10 files (including the rename). One new component (~80-100 lines), schema field addition + rename , wiring in GraphCanvas (~80-100 lines), sub-Dagre in layout (~40 lines), CSS (~20 lines). The rename is mechanical (search/replace across the project). Existing patterns reused throughout.
