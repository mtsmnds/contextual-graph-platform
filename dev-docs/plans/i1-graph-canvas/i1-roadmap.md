# Initiative: Graph Canvas (i1)

make graph canvas mvp up to good base interaction with nodes

## Architectural Direction

Entity Graph → Projection Layer → Reading Workspace.

Entities carry content. Relations carry typed links with sort order. Projections (thread queries) interpret the graph into ordered sequences. React Flow is one renderer among many — the graph is infrastructure, not interface.

## Anti-Overengineering Guardrail

- Don't implement Later items unless promoted to Now.
- Speculative ideas: one bullet, move on.

---

## ✅ Done

## ✅ Phase I — Isolate Product (Complete)

### Phase II — Graph Canvas

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


### now


- after adding the percent view and zoom to 100% buttons, fine tune the size of text and the size of the handle and border activation area.
- handle border thickness change with interaction, same as borders, but with different shades cause the borders go very dark
   
- prepare to approach certain nodes having different appearances depending on what they are. 

### Next (m5)

- **II.10** Thread view component — vertical list of query results with metadata strip and inline inspector
- **II.11** Query builder UI — target dropdown + relation type dropdown + Show Thread button

### Later (m6+)

- **II.12** Highlight active thread in the graph canvas

- **I.4** MongoDB / DexieJS migration → **Moved to Later**
- **I.4** MongoDB persistence adapter (or alternative embedded DB)

- Namespace view data in metadata (e.g. `canvas.sourceHandle`) to distinguish from domain data
- Extract first-class `canvasView` field in `GraphSnapshot` and migrate handle IDs out of metadata

---

## Notes

- `sortOrder` on relations is the key schema change: removes `"next"` relation type, uses fractional-indexing instead
- Thread view starts as plain text blocks — Tiptap integration comes after m3 converges
- Data API wraps Zustand store initially; can be extracted into standalone query layer later
