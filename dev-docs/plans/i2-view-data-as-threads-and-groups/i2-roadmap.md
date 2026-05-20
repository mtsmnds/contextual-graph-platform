# i2 Roadmap — View Data as Threads and Groups

**Objective:** Move from a flat node-and-edge canvas to structured, contextual views — threaded sequences inside nested container groups, metadata that projects from edges, and multi-projection layouts.

**Architectural Direction:** Entity Graph → Projection Layer → Renderer. The canvas is one renderer among many. Containers are structural labels; threading is universal across all `contains` children. Metadata shows edge-derived values without exposing the full edge graph by default. Context loads by hop distance, not all at once.

**Anti-Overengineering Guardrail:** Don't implement Next or Later items unless promoted to Now. Speculative ideas get one bullet, then move on.

**PRD numbering:** PRD numbers in this document are non-final. They shift as PRDs are added, removed, or reordered across milestones.

---

## Now (ordered by dependency)

### 1. Node Metadata Panel — Key-Value Editor

**PRD:** `m5-prd0042-node-metadata-panel`

When a node is selected on the canvas, a form card appears showing editable entity fields:
- `content` — textarea
- `kind` — select dropdown (segment, container, annotation, concept, summary)
- `metadata` — two-column key-value table (add/remove/edit rows)
- `id` — read-only display

Context menu "Edit" opens this panel. Inline text editing via double-click on the node body is preserved. Panel uses NodeAppendix registry pattern or positioned overlay relative to the selected node.

Pure `metadata: Record<string, unknown>` CRUD. No edge resolution yet. Ships on the existing canvas with zero schema changes.

**Testable by:** Manual local dev — select a node, edit metadata in panel, verify persistence on reload. Change kind, verify node re-renders.

---

### 2. Metadata-as-Edge Resolution

**PRD:** `m5-prd0043-metadata-edge-resolution`

Define which metadata keys resolve to edges at read time and create edges at write time.

**Read path:** When the metadata panel displays an entity, certain keys are resolved from the graph:
- `author` → find `contains` edge from author entity to this entity, return author entity's `content` as the display value
- Resolution logic: `resolveEdgeMetadata(entityId)` returns a map of edge-derived key-value pairs merged with stored metadata

**Write path:** Setting an edge-derived key both stores it in `metadata` and creates/updates a relation:
- Setting `author: "William Shakespeare"` on "Hamlet" → finds or creates author entity, creates/updates `contains` edge from author to book, stores `metadata.author = "William Shakespeare"` (the display string)
- The metadata value is the entity's `content`, not the entity ID — the user sees names, not UUIDs

**Edge-derived key registry:** A small config (`src/engine/edge-metadata.ts`) declares which keys are edge-backed and what relation type + direction to use for resolution. Extensible; new keys added by updating the registry.

**Testable by:** Manual local dev — create a book entity, add author entity, set `author` key on book, verify edge is created. Read book metadata, verify author name resolved from edge. Delete edge, verify metadata falls back gracefully.

---

### 3. Contextual Subgraph Loading

**PRD:** `m5-prd0044-contextual-subgraph`

New query engine function: `getContextualSubgraph(entityId, maxDepth)` — BFS outward from the focused entity up to N hops, returning the subgraph of entities and relations within that radius.

```
getContextualSubgraph("book-hamlet", 1) →
  entities: [Hamlet, Shakespeare, Act I, Act II, ..., Annotations]
  relations: [Shakespeare→Hamlet(contains), Hamlet→Act I(contains), ...]
```

This is the foundation for all subsequent work:
- Grouping: knows which children to render inside a container
- View toggling: knows what's "immediate context" vs. further out
- Performance: avoids loading 1400+ entities when the user is looking at one book

The function is a pure query over store state — no hooks, no components.

**Testable by:** Unit-testable — pure function over mock state. Verify correct hop count, inclusion of bidirectional edges, handling of cycles.

---

### 4. Container Grouping — React Flow Group Nodes

**PRD:** `m5-prd0045-container-grouping`

`contains` relations become visual group nodes on the canvas. Child entities get `parentId: containerId` and `extent: "parent"` — React Flow handles containment and collective drag natively.

**Group node component:** Custom `"containerGroup"` node type with:
- Header bar: container title + kind badge + collapse toggle
- Padded child area (children render inside the group bounds)
- Resize handles (all edges)
- Inner background tint (subtle, matching container depth)

**Layout engine update:** `layout.ts` processes the subgraph: for each container, Dagre lays out children within the parent's bounds, then translates positions to relative coordinates. Root-level entities (no `contains` parent) use Dagre as before.

**Connection behavior:** Edge connections to/from a container connect to the container, not its children. Handles on the group node itself.

**Testable by:** Manual local dev — create container entities + children linked by `contains`, run layout, verify children render inside parent bounds. Drag parent, verify children move with it. Resize parent, verify children stay contained. Connect edge from outside to container group.

---

### 5. Threaded Container View

**PRD:** `m5-prd0046-threaded-container-view`

A vertical projection layer on the canvas that renders containers as collapsible sections with threaded children stacked top-to-bottom.

**Nested sections:** Each container renders as a section:
- Header: container title + kind badge + collapse chevron
- Body: children rendered sequentially, ordered by `sortOrder`
- Container children render their own sections recursively

**Threading display:** Children are placed one below another with consistent vertical spacing. Visual indentation indicates depth level. An optional connector line or bracket on the left edge shows the containment chain.

**Collapse/expand:** Clicking the chevron collapses the container body, hiding all descendants. This handles the "annotations-only" use case — collapsing the Hamlet text containers leaves just the annotations visible.

**Layout:** The layout engine is projection-aware. For the threaded view, nodes are stacked vertically within their parent, not positioned freely on the canvas. This operates separately from the free-form canvas layout; the same data supports both.

**Testable by:** Manual local dev — create a nested container hierarchy (Book > Act > Scene > Paragraphs), run threaded layout, verify vertical stacking, verify collapse/expand, verify sortOrder determines display order.

---

### 6. Hamlet Test Data

**PRD:** `m5-prd0047-hamlet-test-data`

Incremental build-out of Hamlet entities to validate the full pipeline: metadata → edges → grouping → threading.

Added incrementally as each feature ships:
- Book entity: "Hamlet" with metadata (author=Shakespeare, year=1603, language=English)
- Author entity: "William Shakespeare" with `contains` edge to Hamlet
- Container entities: Act I-III, 2-3 scenes per act, 2-3 paragraphs per scene
- Annotation entities: 3-4 notes on specific paragraphs
- All children ordered by `sortOrder`

Not a bulk import — entities added through the existing `addEntity`/`addRelation` store actions. This validates that the features work with data created through the same CRUD paths the user would use.

**Testable by:** Manual local dev — verify metadata panel shows author resolved from edge, verify container groups render nested structure, verify threaded view orders paragraphs correctly, verify annotations appear alongside their source paragraphs. End-to-end: create data → view in canvas → metadata panel → collapse → verify persistence.

---

### 7. View Toggling

**PRD:** `m5-prd0048-view-toggling`

When the user's focus changes, the visible set of entities adapts.

**Focus modes:**
- **Source text in focus** (reading Hamlet): full text visible, annotations aligned horizontally next to their anchored paragraphs. The view is driven by the text.
- **Annotations in focus:** source text containers are collapsed. Only annotation containers are visible, threaded linearly in their natural order. No empty space between annotations that are far apart in the source.

**UX:** A toggle control (or mode selector) near the viewport. Changing focus mode re-filters the visible set — entities without annotations (in annotation mode) are hidden; their parent containers may collapse too.

Implemented as a projection filter over the contextual subgraph, not a data mutation.

**Testable by:** Manual local dev — with Hamlet data loaded, toggle between text-focus and annotation-focus. Verify text containers collapse in annotation mode, verify no gaps between annotations.

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
- `getContainerChildren` already handles recursive flattening sorted by `sortOrder`. Grouping and threaded view build on this.
- The `ContainerGroup` node type is a new React Flow node type, registered alongside `entity` and `edgelabel`.
- Hamlet is chosen because it's public domain and provides a real-world hierarchy to test against (book → act → scene → paragraph).
- The metadata panel starts simple (key-value) and grows edge resolution in a subsequent PRD, not as one monolithic feature.
