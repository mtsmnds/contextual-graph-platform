#### Structural Container Grouping

Making the `contains` relation visible by rendering containers as visual groups that enclose their children.

- **Container entities → React Flow `type: "group"` nodes**. Child entities linked by a `contains` relation get `parentId: containerId` and `extent: "parent"` (constrains movement within the parent). This is automatic — every container with `contains` children becomes a group node.
- **Group node custom component**: styled container with header (title + kind badge), padded child area, resize handles. Children render inside the parent bound by React Flow's group system.
- **Floating edges**: custom edge component (`Edge` type registered at module scope like `nodeTypes`). Instead of connecting to fixed handle positions, the edge routes to the nearest point on the target node's perimeter (top/right/bottom/left depending on relative position). Uses React Flow's `getBezierPath` or `getSmoothStepPath` utilities with computed source/target positions.
- Layout engine (`layout.ts`) updated to handle sub-flows: Dagre lays out children within their parent bounds, then positions are translated to relative coordinates.
- **Collective drag** of children is handled natively by React Flow's group system — dragging a parent moves all children.

Depends on: PRD0038 (positions + schema v4 for `canvas.positions`), PRD0044 (schema v5).

#### Cleanup polish

Former "now" items, deferred:

- Fine-tune text size, handle size, and border activation area after zoom buttons and 100% view
- Handle border thickness change with interaction — different shades (borders go very dark)
- Prepare approach for nodes having different appearances depending on entity kind

### Next (m5)

- **II.10** Thread view component — vertical list of query results with metadata strip and inline inspector
- **II.11** Query builder UI — target dropdown + relation type dropdown + Show Thread button

### Later (m6+)

- **II.12** Highlight active thread in the graph canvas

- **I.4** MongoDB / DexieJS migration → **Moved to Later**
- **I.4** MongoDB persistence adapter (or alternative embedded DB)

- Namespace view data in metadata (e.g. `canvas.sourceHandle`) to distinguish from domain data
- Extract first-class `canvasView` field in `GraphSnapshot` and migrate handle IDs out of metadata
- Book metadata, annotations, and content — import/management UI within the graph
- Container-labeled group node refinement (SubFlows pattern for complex hierarchies)
- Selection-based grouping: select multiple nodes → group them in a new container (creates `contains` relations)

## Mega later

- sort of input interface that easily transforms a lot of info into graph data (like gym training,)

### Deferred (not in scope until promoted)

- easy connect - shows a floating handle when dragging from a node, making edge creation intuitive
  - lines draw differently
  - might compete with dragging nodes
  - 


- Old "Now" items from earlier roadmap (zoom tuning, handle borders, node kind appearances) — moved to Cleanup polish above

---

## Notes

- `sortOrder` on relations is the key schema change: removes `"next"` relation type, uses fractional-indexing instead
- Thread view starts as plain text blocks — Tiptap integration comes after m3 converges
- Data API wraps Zustand store initially; can be extracted into standalone query layer later
