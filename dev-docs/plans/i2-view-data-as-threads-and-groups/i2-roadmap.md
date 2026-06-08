# Initiative: View Data as Threads and Groups (i2)

**Objective:** Move from a flat node-and-edge canvas to structured, contextual views — threaded sequences inside nested container groups, metadata that projects from edges, and multi-projection layouts.

**Status:** Complete — all core items built. Deferred items live in `dev-docs/plans/backlog.md`.

---

## ✅ Done

### Container Group Nodes — m5-prd0045
Entities with `type: "container"` render as visual group nodes on the canvas using React Flow's sub-flow mechanism (`parentId` + `extent: "parent"`). Children assigned via drag-and-drop or double-click-inside-create. Entity node height rewritten — user-controlled via Top/Bottom NodeResizeControl.

- Container group custom node (`"containerGroup"`) with header (title), padded child area, 4-edge resize, inner background tint
- Double-click header → inline edit container title
- Double-click container child area → create child node (`type: "segment"`), enters edit mode immediately
- Drag node over container → drop → `parentId` assigned
- Cross-boundary edges supported natively
- 16px grid alignment (`snapGrid [16,16]`, `Math.ceil` snap)

**Archive:** `dev-docs/archive/m5/m5-prd0045-container-group-nodes.md`

### Nested Containers — m5-prd0046
Containers nested inside other containers — same `parentId`/`extent`/`expandParent` mechanics from PRD0045 extended to container-type entities. Cycle detection prevents circular nesting. No depth limit. Context menu "Add Child Container". 20 new tests (cycle detection, depth sorting, cascade delete, undo/redo).

**Archive:** `dev-docs/archive/m5/m5-prd0046-nested-containers.md`

### Workspace Sidebar — m5-prd0047
Persistent right-side floating sidebar replacing WorkspaceMenu popover. Three collapsible sections (Feature Flags, Backups, Workspace Info). SidebarTrigger replaces DotsThreeOutline. State persisted via shadcn cookie mechanism. Sections are context-independent (Zustand only, no React Flow coupling).

**Archive:** `dev-docs/archive/m5/m5-prd0047-workspace-sidebar.md`

### Sort Order & Fractional Indexing — m5-prd0057
Swapped `fractional-indexing` for `fractional-indexing-jittered` (collision-resistant keys). Added `appendChild`, `insertChild`, `moveChild`, `backfillContainerOrder` store actions as the canonical interface. Documented 5 rules in `domain.ts`. All renderers (canvas, threaded view) share the same ordering logic.

**Archive:** `dev-docs/archive/m5/m5-prd0057-sort-order-fractional-indexing.md`

### Segment Metadata Conventions — m5-prd0058
Codified `metadata.lineNumber` and `metadata.character` conventions in `architecture.md`. Added linking doc comment in `domain.ts`.

**Archive:** `dev-docs/archive/m5/m5-prd0058-segment-metadata-conventions.md`

### Dagre Reintroduction — m5-prd0060
Dagre auto-layout behind `autoLayout` feature flag. Three isolated pieces: `estimateNodeHeight()` stopgap, reactive dagre sync (respects saved positions), `runFullLayout()` one-shot button action (batch-writes → undoable). New "Canvas Layout" sidebar section with rankdir/nodesep/ranksep/nodeWidth controls and Run Layout button.

**Archive:** `dev-docs/archive/m5/m5-prd0060-reintroducing-dagre-to-canvas.md`

### parentId Deprecation — m5-prd0061
Removed `parentId` from `Entity`. All parentage expressed solely through `contains` edges, with `parentId` derived at the React Flow boundary via `getParentId()` query. Migration script handles existing data. Single source of truth for nesting.

**Archive:** `dev-docs/archive/m5/m5-prd0061-parent-id-deprecation.md`

### Hide `contains` Edges on Canvas — m5-prd0062
`contains`-type relations drive `parentId` for nesting but no longer render as visible edge lines. Filtered in all three edge-building sites. Store data unchanged — query functions unaffected.

**Archive:** `dev-docs/archive/m5/m5-prd0062-hide-contain-edges-on-canvas.md`

### Segment Auto-Height — m5-prd0063
SegmentCard component (fixed-width, auto-expanding content block). `autoHeight` feature flag (default off). DOM height measurement → `canvasData.height` with >1px guard. Layout engine prefers `canvasData.height` over deprecated `estimateNodeHeight()`.

**Archive:** `dev-docs/archive/m5/m5-prd0063-segment-auto-height.md`

### Stack Container Children — m5-prd0064
`stackChildren()` — pure function positioning a container's direct children in a vertical column ordered by `sortOrder` with fixed 16px gap. Container auto-sizes to fit. Triggered via right-click context menu on containers, gated by `autoLayout`. This is the realization of "Threaded Container View" — the vertical projection layer.

**Archive:** `dev-docs/archive/m5/m5-prd0064-stack-container-children.md`

### Supporting PRDs (general m5, not i2-specific)

| PRD | What |
|-----|------|
| 0048 | Container/Presenter Pattern — store access extracted from sidebar sections |
| 0049 | IconButton + ZoomControls — project-wide button components |
| 0050 | Switch component with label, description, invalid state |
| 0051 | Experimental section, CollapsibleSection, ViewLogger, MiniMap toggles |
| 0052 | Canvas header, undo/redo relocation, disabled button fix |
| 0054 | Selection Metadata Section — node properties in sidebar |
| 0055 | Shared node hooks (useResizePersistence + useNodeEdit) |
| 0056 | Auto-select on creation, context menu position fix |
| 0059 | Entity form create mode — route-agnostic entity creation UI |
| 0065 | Close/quit workspace, compareSortOrder utility |
| 0066 | Forced dimension render (programmatic node resize via DOM sync) |
| 0068 | Undo/redo dimension sync (post-hoc fix for 0066) |

---

## 🔜 Deferred

Items with clear scope and value but no active implementation. See `dev-docs/plans/backlog.md` for the full deferred list.

- **Contextual Subgraph Loading** — BFS query `getContextualSubgraph(entityId, maxDepth)`. Foundation for performance at scale. Depends on: strong query engine (exists).
- **Metadata-as-Edge Resolution** — Registry-driven edge resolution from metadata keys. `edge-metadata.ts` exists from i1 but needs integration with the metadata panel.
- **View Toggling** — Focus modes: text-focus vs annotations-focus. Depends on: unified chrome, SegmentCard extraction.

---

## Notes

- `sortOrder` (fractional indexing) is implemented on `Relation`. Threading uses it as-is.
- `getContainerChildren` handles recursive flattening sorted by `sortOrder`.
- The `containerGroup` node type is a React Flow node type alongside `entity`, `metadata`, and `edgelabel`.
- Test data (Hamlet, Lord of the Flies) was built incrementally through import scripts, not sequential PRDs.
