# Backlog

Deferred items, ideas, and planned-but-unstarted work organized by domain.
Active work lives in `roadmap.md`. Completed work lives in `changelog.md`.

Items with dedicated docs are linked — those docs stay in place until picked up.

---

## Data & Infrastructure

- **Multi-file graph architecture** (`../new-graph-plan.md`) — manifest-based sub-file loading, derived relations (`metadata.derived`), language-first ID convention (`--EN-c1` instead of `--c1`). Splits monolithic `graph.json` into per-book sub-files with lazy loading. Depends on FS Access overhaul.
- **FS Access overhaul** (✅ done — `m6/prd0069`) — replaced old FSAccessAdapter with FSAdapter standalone. Mark old files as deprecated.
- **Deprecate/delete old fs-access-adapter** — remove `FSAccessAdapter`, `getFSAccessInstance`, and legacy `TiptapSidebar` import once the legacy `/tiptap-editor-test` route is migrated or removed.
- **Auto snapshots: decide fate** — `persistAutoSnapshots()` in the store subscriber writes undo history to `backups/auto/` on disk. Currently dead (no FS handle in subscriber). Either incorporate into the new FSAdapter's save/load lifecycle or delete the feature entirely.
- **Manual backups: decide fate** — `backups/manual/` read/write via the BackupsSection UI. Currently works when folder is open (FSAdapter provides the handle). Either keep as-is for folder sessions, incorporate into FSAdapter's save/load, or delete if the explicit Save button supersedes checkpoint backups.
- **ID system rework** — `slugify` strips hyphens (spaces→hyphens then removed), producing continuous slugs. `SEG_PREFIX_RE` runs after child slug append so `_seg-N` suffixes on parents are never stripped. Rework to use fractional-indexing or UUIDs for reliable, collision-resistant IDs.
- **`public-data/` snapshot** — create `react-roadmap/public-data/graph.json` with stable data from `hello2/graph.json` per data-tier plan.
- **Entity form edit mode** — existing create-only form extended to update existing entities (pre-populate fields, save to store).

## Layout Engine (PRD 0067 — Dagre Phase 3)

From `dev-docs/plans/m5-prd0067-dagre-phase-3-complete.md`. PRD 0064 (Stack Children) is done; these extend it.

- **Phase 1 — Bottom-up sub-dagre** — `layoutAllContainers()` walks nesting tree bottom-up, sizes inner containers before parents, runs top-level dagre pass for root entities. Cross-container edges routed in top-level pass.
- **Phase 2 — sortOrder constraints** — feed dagre `constraints` from sibling `sortOrder` so children appear in correct sequence.
- **Phase 3 — Mixed direction** — per-container `rankdir` determined by nesting depth heuristic (root LR, depth 1 TB, depth 2 LR, 3+ TB). Later: `metadata.layoutDirection` override.
- **Phase 4 — Debounced auto-layout** — 300ms debounce on layout option changes when `autoLayout` is ON. Cancelled if toggled OFF.

## Viewer / UI

- **Unified chrome** — merge VizTest1 node inspector + GraphCanvas sidebar metadata section into one component shell shared across routes. The entity form is the first piece; this extends to sidebar, inspector, JSON view.
- **Route unification** — WorkspaceRoot becomes a layout shell where canvas, viz, threaded view, etc. open as panels instead of full-page routes. Significant architecture shift — prerequisite is unified chrome.
- **Contextual Subgraph Loading** — `getContextualSubgraph(entityId, maxDepth)` — BFS outward from focused entity up to N hops. Pure query. Foundation for performance at scale and view toggling.
- **Metadata-as-Edge Resolution** — Registry-driven bridge between metadata panel and `edge-metadata.ts` so fields like `author` create edges automatically at write time and resolve at read time.
- **View Toggling** — Focus modes: text-focus (full content + annotations aligned) vs annotations-focus (text collapsed, annotations threaded). Depends on: unified chrome, SegmentCard extraction.
- **CRUD Tier 2** — Contextual buttons on nodes (hover/select): reorder, edit, add before/after/between.
- **CRUD Tier 3** — Fully contextual canvas cards with no sidebar — all node data shown next to/in the card. Furthest out.
- **Remark / rich text** — content written in markdown, rendered via remark. Lower priority.

## Query / Filter / Collapse

- **Filter by selection** — select a node → show only what's related to it (1 hop). Entry point for query features.
- **Multi-select query** — select 2+ nodes → show their combined subgraph. For side-by-side research across two documents/collections.
- **Collapse with propagation** — collapse a container → its external relations bubble up to the container node so connections aren't lost. Graph traversal problem — needs design on what "propagate" means per relation type.
- **Workspace panels** — architectural shift after unified chrome. Panels for threads, queries, search alongside the canvas.

## Canvas / Graph Polish

- **Floating edges** — custom edge component routing to nearest perimeter point instead of fixed handles. Uses `getBezierPath`/`getSmoothStepPath` with computed source/target positions.
- **Cleanup polish** — fine-tune text size, handle size, border activation area. Handle border thickness changes with interaction.
- **Smart drag-out-to-detach** — dragging child out of container auto-detaches (removes `parentId`, absolute position). Currently uses context menu "Detach from Group".
- **Easy connect** — floating handle when dragging from a node for intuitive edge creation. May compete with node dragging.
- **Node appearance by entity kind** — different visual treatment per entity type (container vs segment vs concept).

## Future Ideas

- **Roadmap Projection** — horizontal PRD chain view. PRDs as nodes connected left-to-right by dependency edges. Milestones/initiatives as group containers. Same `contains` + `sortOrder` infrastructure projected horizontally.
- **Annotations Inline Alignment** — annotation nodes positioned adjacent to their anchor paragraphs. Uses existing `annotates` relation type.
- **Query Builder UI** — target dropdown + relation type dropdown + "Show" button. Generates thread views from arbitrary `queryThread` calls.
- **Thread View Component** — vertical list of query results with metadata strip and inline inspector. Separate from canvas; mounts as a panel.
- **Highlight Active Thread** — when a thread is shown in thread view, highlight corresponding nodes/edges in the canvas.
- **Cross-Document Passage Linking** — expand `annotates` relation to link passages between different works.
- **Selection-Based Grouping** — select multiple nodes → group them in a new container (creates `contains` relations automatically).
- **Bulk input interface** — transforms structured info (CSV, JSON) into graph entities and relations.
- **Book metadata import/management UI** — import and manage book metadata, annotations, and content within the graph.
