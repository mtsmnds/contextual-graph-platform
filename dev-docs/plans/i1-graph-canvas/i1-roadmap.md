# Initiative: Graph Canvas (i1)

objective: make graph canvas mvp up to good base interaction with nodes

## Architectural Direction

Entity Graph → Projection Layer → Reading Workspace.

Entities carry content. Relations carry typed links with sort order. Projections (thread queries) interpret the graph into ordered sequences. React Flow is one renderer among many — the graph is infrastructure, not interface.

## Anti-Overengineering Guardrail

- Don't implement Later items unless promoted to Now.
- Speculative ideas: one bullet, move on.

---

## ✅ Done

## ✅ Phase I — Isolate Product (Complete)

## ✅ Phase II — Graph Canvas

- **PRD0024** Installed react-router-dom, extracted legacy app to `/tiptap-editor-test`, created workspace shell at `/`. All three steps (I.1–I.3) done in one pass.
- **PRD0025** - Schema + `sortOrder` + `queryThread` (II.5 + II.6)
- **PRD0026** - React Flow starter kit — read-only graph with dagre layout, Background/Controls/MiniMap (II.7)
- **PRD0027** - React Flow interactivity — drag, connect, select, sync
- **PRD0028a** - Node CRUD — create/edit/delete with dialogs
- **PRD0028b** - Edge editing, always-visible labels, context menus
- **prd0030** - test and ui refinement
- **prd0031** - editing text within nodes
- add claude design skill https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md
- **prd0032** - resizing and edge handles
  - decide handle design and or node edge conection behavior and implement
  - fix node resizing - remove top and bottom resizing (node height governed by textarea)
- **prd0033** - four multidirectional edges
- **prd0034** - FS Access persistence test — verified load, create, edit, delete, reload roundtrip with `~/Code/hello2`

## ✅ Phase III - Interaction & Postion Persistence
everything structural depends on stable positions

- **prd0035** - cursor styles 
- **prd0036** - double-click pane to create node at click position + fix node positioning for button (ADR: archive/m4/m4-prd0036-pane-double-click-position-fix.md)
- **prd0037** - zoom improvements
  - viewport logger: show the viewport logger in the `control` button group, to the left of the buttons, after a separator (shadcn)
    - button group: https://ui.shadcn.com/docs/components/base/button-group
    - i want a separation between the logger's `x/y/zoom` live text and the buttons, do we achieve that by nestiong button groups as the text in ref link says, or the `x/y/zoom` lives in another component/div (since its not a button)?
    - follow shadcn/tailwind for a text that is not primary. describe which style will use
    - zoom is in percentage (%)

  - add a button that does `zoom=100%` to the button group
  - when the canvas is opened/refreshed, the viewport should never fit to more than 100% zoom, however this rule does not superseed persistence of the user's location and zoom if that is saved.

  - check if there is a feature that is storing the user's x/y/zoom and using saving so it loads on next reload/open. if it doesn't exist (i think it doesnt) then lets create it.
- **prd0038** - Save node positions — schema v4: add `canvas: { positions: Record<string, {x, y}>, viewport?: {x, y, zoom} }` to `GraphSnapshot`. On load, use saved positions when available (fall back to Dagre for new entities). "Re-layout" button re-runs Dagre and overwrites saved positions. This is the foundation for user-arranged layouts, sub-flows, and any positional work.
- **prd0039** - Cmd+drag to duplicate node — hold Cmd (Meta) while dragging a node → clone the node, position the copy at the drag endpoint. Creates a new entity in the store.

## Phase IV - Node & Edge Data Editing
Core editing capability — the biggest current pain point (user couldn't edit metadata, relation types, or entity kinds).

- **prd0040** - Edge inline editing: double-click edge label → inline text input with a dropdown of existing relation types (queried from `distinct type` values across all relations). User can pick an existing type or type a new one. Same commit pattern as node inline editing (Enter/blur to commit, Escape to cancel). **Replace EdgeDialog** (the modal) entirely — inline is faster and the dialog provides nothing extra.

- **PRD0042** - fixes to resize and text persistence




## Now (ordered by dependency)

#### Node & Edge Data Editing


- **Node inspector (NodeAppendix)**: when a node is selected, show a form card appended to the right side of the node using the NodeAppendix registry component. The form shows all Entity fields:
  - `content` — editable text (same as inline editing, but visible in the form too)
  - `kind` — dropdown of entity kinds (segment, container, annotation, concept, summary). Changing kind updates the entity and re-renders the node.
  - `metadata` — key-value editor (add/remove/edit metadata entries)
  - `id` — read-only display
- **Context menu "Edit"** currently triggers inline text editing; change it to open the NodeAppendix inspector. Inline editing stays available via double-click on the node body.



#### Structural Container Grouping

Making the `contains` relation visible by rendering containers as visual groups that enclose their children.

- **Container entities → React Flow `type: "group"` nodes**. Child entities linked by a `contains` relation get `parentId: containerId` and `extent: "parent"` (constrains movement within the parent). This is automatic — every container with `contains` children becomes a group node.
- **Group node custom component**: styled container with header (title + kind badge), padded child area, resize handles. Children render inside the parent bound by React Flow's group system.
- **Floating edges**: custom edge component (`Edge` type registered at module scope like `nodeTypes`). Instead of connecting to fixed handle positions, the edge routes to the nearest point on the target node's perimeter (top/right/bottom/left depending on relative position). Uses React Flow's `getBezierPath` or `getSmoothStepPath` utilities with computed source/target positions.
- Layout engine (`layout.ts`) updated to handle sub-flows: Dagre lays out children within their parent bounds, then positions are translated to relative coordinates.
- **Collective drag** of children is handled natively by React Flow's group system — dragging a parent moves all children.

Depends on: PRD0035 (positions + schema v4 for `canvas.positions`).

#### Undo/Redo

Cross-cutting history system for graph operations.

- Snapshot-based history: capture `{ entities, relations, canvas }` before each tracked mutation. Full state restore on undo/redo. Re-layout is undoable; drag position changes are excluded.
- Keyboard: Cmd+Z (undo), Cmd+Shift+Z (redo) via `document.addEventListener('keydown')` with focus guard
- UI: Undo/redo buttons in the top-right panel via nested ButtonGroup, left of existing buttons

Could be done at any point, but harder to retrofit once more store actions accumulate.

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
