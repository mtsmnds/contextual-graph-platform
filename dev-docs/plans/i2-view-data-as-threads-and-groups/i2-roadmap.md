# Initiative: View Data as Threads and Groups (i2)

**Objective:** Move from a flat node-and-edge canvas to structured, contextual views — threaded sequences inside nested container groups, metadata that projects from edges, and multi-projection layouts.

**Status:** In progress — 1 of 6 Now PRDs completed.

**Parent-child decision (2026-05-23):** Container grouping uses React Flow's native `parentId`/`extent` mechanism. `parentId` is a first-class field on `Entity` — it directly models data hierarchy (e.g., "Hamlet" is the parent of its content). NOT buried in `canvasData`. `contains` edges may be added later as a parallel representation, but `parentId` remains the authoritative domain field.

**PRD renumbering (2026-05-25):** Nested Containers (PRD0046) inserted as #2, bumping Threaded Container View to PRD0047 and View Toggling to PRD0049.

---

## ✅ Done

### Container Group Nodes — m5-prd0045
Entities with `type: "container"` render as visual group nodes on the canvas using React Flow's sub-flow mechanism (`parentId` + `extent: "parent"`). Children assigned via drag-and-drop or double-click-inside-create. `parentId` is a first-class field on `Entity` — directly models data hierarchy. Entity node height rewritten — user-controlled via Top/Bottom NodeResizeControl.

- Container group custom node (`"containerGroup"`) with header (title), padded child area, 4-edge resize, inner background tint
- Double-click header → inline edit container title
- Double-click container child area → create child node (`type: "segment"`), enters edit mode immediately
- Drag node over container → drop → `parentId` assigned
- Container drag moves all children (React Flow native)
- Cross-boundary edges supported natively
- Entity nodes: Top/Bottom resize, flex-1 textarea, container query CSS for padding at tight vs normal heights
- 16px grid alignment (`snapGrid [16,16]`, `Math.ceil` snap)
- Container group styles, ns-resize cursor

**Not implemented in this PRD:**
- Layout engine sub-Dagre pass — Dagre is disabled (`__experimentalNoDagre`). Node positions are store-authoritative.
- Pane double-click option to create "New Group" vs "New Node" — only "New Node" is offered.

**Archive:** `dev-docs/archive/m5-i2-view-data-as-threads-and-groups/m5-prd0045-container-group-nodes.md`

### Undo/Redo (independent, built as m4-prd0043)
Snapshot-based undo/redo system with batch grouping and workspace backup panel. 50-entry in-memory history. Cmd+Z / Cmd+Shift+Z. Built as part of m4 (not under i2) but fulfills the Next item listed below.

---

## Now (ordered by dependency)

### 2. Nested Containers

**PRD:** `m5-prd0046-nested-containers`

Containers can be nested inside other containers — the same `parentId`/`extent`/`expandParent` mechanics from PRD0045 extended to container-type entities. Drag a container onto another container to nest it. Right-click container → "Add Child Container". Cycle detection prevents circular nesting. Depth-limited to 4 levels. Visual depth indicator (progressively deeper background tint).

Depends on: Container group nodes (PRD0045) — ✅ done.

### 3. Threaded Container View

**PRD:** `m5-prd0047-threaded-container-view`

A vertical projection layer that renders containers as collapsible sections with threaded children stacked top-to-bottom. Children ordered by `sortOrder`. Collapse/expand handles "annotations-only" views. Operates separately from the free-form canvas layout — same data, different projection.

Depends on: Container group nodes (PRD0045) + nested containers (PRD0046).

### 4. Contextual Subgraph Loading

**PRD:** `m5-prd0044-contextual-subgraph`

New query engine function: `getContextualSubgraph(entityId, maxDepth)` — BFS outward from the focused entity up to N hops. Pure query over store state. Foundation for performance at scale.

Depends on: Container group nodes + threaded view + Hamlet test data.

### 5. Metadata-as-Edge Resolution

**PRD:** `m5-prd0043-metadata-edge-resolution`

Define which metadata keys resolve to edges at read time and create edges at write time. Registry-driven (`src/engine/edge-metadata.ts`). `author` key maps to `contains` relation. Metadata panel already exists from i1 — this adds edge-awareness to it.

Depends on: metadata panel (built in i1). Non-blocking for grouping/threading.

### 6. View Toggling

**PRD:** `m5-prd0049-view-toggling`

Focus modes: text-focus (full content + annotations aligned) vs annotations-focus (text collapsed, annotations threaded). Toggle control near viewport. Projection filter over contextual subgraph, not a data mutation.

Depends on: Container grouping + threaded view + subgraph loading.

---

### Test Data (interleaved)

Hamlet entities built incrementally as each feature ships — not a sequential PRD. Book → acts → scenes → paragraphs → annotations. Created through existing `addEntity`/`addRelation` store actions to validate real CRUD paths. Validates: metadata panel → grouping → threading → collapse → persistence (end-to-end).

---

## Next (m6)

- **Roadmap Projection** — Horizontal PRD chain view. PRDs as nodes connected left-to-right by dependency edges. Milestones and initiatives as group containers. Same `contains` + `sortOrder` infrastructure, projected horizontally instead of vertically. Initiative nodes provide labels without being visible as nodes in the roadmap view.

- **Annotations Inline Alignment** — When reading Hamlet text, annotations attach horizontally to their source paragraphs. The layout engine positions annotation nodes adjacent to their anchor paragraphs. Uses the existing `annotates` relation type for anchoring.

## Later (m7+)

- **Query Builder UI** — Target dropdown + relation type dropdown + "Show" button. Generates thread views from arbitrary `queryThread` calls. (i1 carry-forward)
- **Thread View Component** — Vertical list of query results with metadata strip and inline inspector. Separate from the canvas; mounts as a panel in the sidebar or content area. (i1 carry-forward)
- **Highlight Active Thread** — When a thread is shown in the thread view, highlight corresponding nodes/edges in the canvas. Bridges the two views. (i1 carry-forward)
- **Cross-Document Passage Linking** — Expand on the existing `annotates` relation to link passages between different works.
- **Selection-Based Grouping** — Select multiple nodes → group them in a new container (creates `contains` relations automatically).

---

## Notes

- `sortOrder` (fractional indexing) is already implemented on the `Relation` type. Threading uses it as-is.
- `getContainerChildren` already handles recursive flattening sorted by `sortOrder`. Threaded view builds on this.
- The `containerGroup` node type is a new React Flow node type, registered alongside `entity`, `metadata`, and `edgelabel`.
- Hamlet is chosen because it's public domain and provides a real-world hierarchy to test against (book → act → scene → paragraph).
- The metadata panel (key-value editor) was built in i1. Edge-derived metadata (`edge-metadata.ts`) adds edge-awareness to it.
- Parent-child grouping uses React Flow's `parentId` property layer. `parentId` is a first-class field on `Entity` — not in `canvasData`. `contains` edges may be added later as a parallel representation but `parentId` remains authoritative.
- Undo/Redo was built as m4-prd0043 (independent of i2) and moved from Next to Done.
