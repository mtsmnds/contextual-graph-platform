# i2 — View Data as Threads and Groups

## What this is

A refinement of the Contextual Graph Platform vision from i1 — moving from a flat node-and-edge canvas toward structured views where data is organized as threaded sequences inside nested containers. The same Entity/Relation graph produces different visual layouts depending on what the user is looking at. Some metadata fields are really edges in disguise. The graph is not fully loaded at once — only the contextually relevant subgraph around the focused entity.

This is not a pivot. It builds directly on the i1 graph canvas infrastructure: schema v4 (with `sortOrder` and `canvas.positions`), the query engine (`getContainerChildren`, `queryThread`), React Flow custom nodes/edges, and the persistence layer.

## Core Concepts

### 1. Metadata as Edges

Some metadata displayed on an entity isn't stored as `metadata.key` — it's projected from a relation.

Example: a book entity shows **Author: William Shakespeare** in its metadata panel. This value comes from a `contains` edge between an author entity ("William Shakespeare") and the book entity ("Hamlet"). The edge exists in the graph, but the user sees it collapsed into the metadata display as a simple key-value pair — the author's name, not the edge itself.

Other metadata is pure data: year published, page count, original language, reading start/finish dates. Some of this will become visualizations later, but it's not edge-derived at this point.

The metadata panel starts as a key-value editor. Edge-derived metadata is resolved at read time and written through both the relation store and the metadata field. From the beginning, certain keys (like `author`) equate to edges.

### 2. Contextual Loading

The graph canvas loads everything at once, which works at the current scale (~100 entities). But for a book with hundreds of paragraphs, annotations, and cross-references, loading the entire graph isn't practical.

The model: load by **hop distance** from the focused entity.

- **1 edge away** = immediate metadata + direct children. For a book, this means the author, the acts, any top-level annotations.
- **2+ edges away** = annotations on paragraphs, author's other works, concepts referenced by annotations.
- The user can **expand context** to load more: click an entity to add its 1-edge neighborhood to the visible set.

This replaces the canvas's "load everything" approach with a contextual projection that only assembles what's relevant.

### 3. Threading

Every container's children are **threaded** — ordered by `sortOrder` using fractional indexing. This already exists in the query engine (`getContainerChildren` sorts by `sortOrder`), but the vision applies it universally:

- **Paragraphs** in a scene are threaded (paragraph 2 comes after paragraph 1)
- **Scenes** in an act are threaded (Scene II after Scene I)
- **Acts** in a book are threaded (Act II after Act I)
- **Annotations** on a book are threaded (the user's notes in the order they were written)

Threading is not semantic. We don't name containers "act" or "scene" in the data model. We state: _if a node has `contains` relations to other nodes, those children are ordered._ The vertical display follows the order.

### 4. Container Grouping

`contains` relations become visual groupings. A container entity renders as a section header that encloses its threaded children — like FigJam sections or nested folder views.

```
Book: Hamlet
├── Title Page
├── Dramatis Personae
├── Act I (container)
│   ├── Scene I (container)
│   │   ├── Paragraph 1
│   │   ├── Paragraph 2
│   │   └── ...
│   └── Scene II
│       └── ...
├── Act II
│   └── ...
├── Annotations (container)
│   ├── Note on Act I Scene I
│   ├── Note on character development
│   └── ...
└── ...
```

**Key principle:** nesting is visual, not graph-structural. It's all flat edges (`contains` from parent to child). The hierarchy is a projection — the rendering layer follows the `contains` chain recursively and lays out children inside parents.

React Flow supports this natively via `parentId` on nodes and `extent: "parent"` for containment. Group nodes get a custom component with a header, padded child area, and resize handles. Collective drag works out of the box.

### 5. Multi-Projection Views

The same Entity/Relation graph supports different layouts depending on the **projection context**:

| Context | Layout | Example |
|---------|--------|---------|
| Book reading | Vertical nested containers | Hamlet text threaded top-to-bottom, annotations in a parallel column |
| Annotations focus | Vertical list (collapsed text) | Only annotation containers, no empty space from missing text paragraphs |
| Roadmap | Horizontal chain | PRDs connected left-to-right, grouped by milestone/initiative |

The layout direction is a property of the projection, not the data. A book is read vertically; a timeline is read horizontally. Both use the same `contains` relations, `sortOrder`, and container nesting — just projected differently.

### 6. View Toggling

When the user's **focus** changes, the view adapts:

- **Focus: reading Hamlet** → see full text + annotations aligned horizontally next to their anchored paragraphs. The view is driven by the text; annotations appear where they attach.
- **Focus: annotations on Hamlet** → see only the annotation containers, threaded linearly. The full Hamlet text is collapsed/hidden — no empty space between annotations that are spaced far apart in the source text.

The UX for this is a toggle (checkbox, tab, or mode switch). The user selects whether the full source text is visible or whether they're in "annotations-only" mode. This is a projection-level concern — it filters which entities are included in the visible set, not how the data is stored.

## Concrete Example: Hamlet Book View

When the user opens the Hamlet book:

1. **Metadata panel** shows author (edge-derived), year, language, pages, reading dates
2. **Container groups** render the structure: Title Page → Dramatis Personae → Act I → Act II → ...
3. **Threaded paragraphs** inside each scene, ordered by `sortOrder`
4. **Annotations** appear in a parallel column, aligned next to their source paragraphs
5. **Only immediate context loads** — the author's other works and the full annotation network are not loaded until the user expands

## Concrete Example: Roadmap View

When the user views the project roadmap:

1. **PRDs as nodes** connected horizontally by dependency edges (unblocks / requires)
2. **Milestones as group containers** that enclose related PRDs
3. **Initiative nodes** provide a title/label for a group without rendering as a visible node — they exist as metadata on the grouping
4. **Metadata panel** on a PRD shows status, assignee, links to implementation
5. **Clicking an initiative node** opens it in a different projection: a non-linear exploration of vision docs, PRDs, and ADRs grouped under that initiative

## Design Stance

The graph is the interface, but the interface is contextual. Metadata hides the edge graph by default. Structure is always one interaction away: click an edge-derived field to expand the full edge context. The user can see the model or stay in the comfortable view — the choice is theirs, not the system's.

## Relationship to Existing Work

| Concept | Status in codebase |
|---------|-------------------|
| `sortOrder` (fractional indexing) | Implemented (schema v3+) |
| `getContainerChildren` (recursive, sorted) | Implemented |
| `queryThread` (filter by target+type) | Implemented |
| `resolveContainer` (walk to root) | Implemented |
| `getContainerBreadcrumb` | Implemented |
| `metadata: Record<string, unknown>` on Entity+Relation | Implemented, unused in UI |
| Custom nodes/edges (EntityNode, EdgeLabel) | Implemented |
| Canvas positions persistence (schema v4) | Implemented |
| Context menu system | Implemented |
| Metadata panel UI | **Not built** (target: prd0042) |
| Edge-derived metadata resolution | **Not built** (target: prd0043) |
| Contextual subgraph loading | **Not built** (target: prd0044) |
| React Flow group nodes | **Not built** (target: prd0045) |
| Threaded container view | **Not built** (target: prd0046) |
| View toggling | **Not built** (target: prd0048) |
| Roadmap projection | **Not built** (target: prd0049) |

