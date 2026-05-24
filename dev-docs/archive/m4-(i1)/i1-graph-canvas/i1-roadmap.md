# Initiative: Graph Canvas (i1)

objective: make graph canvas mvp up to good base interaction with nodes
status: complete!

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

## ✅ Phase IV - Node & Edge Data Editing
Core editing capability — the biggest current pain point (user couldn't edit metadata, relation types, or entity kinds).

- **prd0040** - Edge inline editing: double-click edge label → inline text input with a dropdown of existing relation types (queried from `distinct type` values across all relations). User can pick an existing type or type a new one. Same commit pattern as node inline editing (Enter/blur to commit, Escape to cancel). **Replace EdgeDialog** (the modal) entirely — inline is faster and the dialog provides nothing extra.

- **prd0041** node metadata panel - key-value editor: show metadata panel in the same visual language as a node, let users edit entity fields

- **PRD0042** - fixes to resize and text persistence
- **PRD0043** - Undo/redo + backups: snapshot-based undo/redo system with batch grouping, Cmd+Z/Cmd+Shift+Z shortcuts, workspace backups (auto + manual) via Notion-style three-dot menu
- **PRD0044** - Schema v5: positions and dimensions moved onto Entity as `canvasData`, removing the `canvas.positions` reconciliation layer. All position mutations (drag-end, resize-end, keyboard move) tracked by undo.


## Now (ordered by dependency)

Initiative 1 complete! 

