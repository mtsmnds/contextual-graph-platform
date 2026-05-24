# i2 Roadmap — View Data as Threads and Groups

**Objective:** Move from a flat node-and-edge canvas to structured, contextual views — threaded sequences inside nested container groups, metadata that projects from edges, and multi-projection layouts.

**Architectural Direction:** Entity Graph → Projection Layer → Renderer. The canvas is one renderer among many. Containers are structural labels; threading is universal across all `contains` children. Metadata shows edge-derived values without exposing the full edge graph by default. Context loads by hop distance, not all at once.

**Parent-child decision (2026-05-23):** Container grouping uses React Flow's native `parentId`/`extent` mechanism. `parentId` is a first-class field on `Entity` — it directly models data hierarchy (e.g., "Hamlet" is the parent of its content). NOT buried in `canvasData`. `contains` edges may be added later as a parallel representation, but `parentId` remains the authoritative domain field.

**Anti-Overengineering Guardrail:** Don't implement Next or Later items unless promoted to Now. Speculative ideas get one bullet, then move on.

**PRD numbering:** PRD numbers in this document are non-final. They shift as PRDs are added, removed, or reordered across milestones.

---

## Now (ordered by dependency)

### 1. Container Group Nodes

**PRD:** `m5-prd0045-container-group-nodes` — written, ready for implementation.

Entities with `type: "container"` render as visual group nodes on the canvas using React Flow's sub-flow mechanism (`parentId` + `extent: "parent"`). Children assigned via drag-and-drop or double-click-inside-create. `parentId` is a first-class field on `Entity` — it directly models data hierarchy. `contains` edges may be added later as a parallel representation.

- Container group custom node (`"containerGroup"`) with header (title, no badge), padded child area, resize handles, inner background tint
- Double-click header → inline edit container title
- Layout engine: sub-Dagre pass positions children relative to parent. Respects saved `canvasData` (no overwrite). `expandParent: true` on all children.
- Pane double-click: option to create "New Group" or "New Node"
- Double-click container child area → create child node (`type: "segment"`), enters edit mode immediately
- Drag node over container → drop → `parentId` assigned
- Container drag moves all children (React Flow native)
- Cross-boundary edges supported natively

### 2. Threaded Container View

**PRD:** `m5-prd0046-threaded-container-view`

A vertical projection layer that renders containers as collapsible sections with threaded children stacked top-to-bottom. Children ordered by `sortOrder`. Collapse/expand handles "annotations-only" views. Operates separately from the free-form canvas layout — same data, different projection.

Depends on: Container group nodes (PRD0045).

### 3. Contextual Subgraph Loading

**PRD:** `m5-prd0044-contextual-subgraph`

New query engine function: `getContextualSubgraph(entityId, maxDepth)` — BFS outward from the focused entity up to N hops. Pure query over store state. Foundation for performance at scale. Built after grouping + threading + test data exist, so there's a real platform to test against.

Depends on: Container group nodes + threaded view + Hamlet test data.

### 4. Metadata-as-Edge Resolution

**PRD:** `m5-prd0043-metadata-edge-resolution`

Define which metadata keys resolve to edges at read time and create edges at write time. Registry-driven (`src/engine/edge-metadata.ts`). `author` key maps to `contains` relation. Metadata panel already exists from i1 — this adds edge-awareness to it.

Depends on: metadata panel (built in i1). Non-blocking for grouping/threading.

### 5. View Toggling

**PRD:** `m5-prd0048-view-toggling`

Focus modes: text-focus (full content + annotations aligned) vs annotations-focus (text collapsed, annotations threaded). Toggle control near viewport. Projection filter over contextual subgraph, not a data mutation.

Depends on: Container grouping + threaded view + subgraph loading.

---

### Test Data (interleaved)

Hamlet entities built incrementally as each feature ships — not a sequential PRD. Book → acts → scenes → paragraphs → annotations. Created through existing `addEntity`/`addRelation` store actions to validate real CRUD paths. Validates: metadata panel → grouping → threading → collapse → persistence (end-to-end).

---

## Next (m6)

- **Roadmap Projection** — Horizontal PRD chain view. PRDs as nodes connected left-to-right by dependency edges. Milestones and initiatives as group containers. Same `contains` + `sortOrder` infrastructure, projected horizontally instead of vertically. Initiative nodes provide labels without being visible as nodes in the roadmap view.

- **Annotations Inline Alignment** — When reading Hamlet text, annotations attach horizontally to their source paragraphs. The layout engine positions annotation nodes adjacent to their anchor paragraphs. Uses the existing `annotates` relation type for anchoring.

- **Undo/Redo** — Command-pattern history for entity/relation mutations. Cmd+Z / Cmd+Shift+Z. Debounced position changes excluded from history. UI buttons in the panel.

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
