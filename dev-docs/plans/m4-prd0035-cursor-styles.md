# PRD0035 — Cursor Styles

## Overview

Set context-appropriate cursors across the graph canvas to communicate what each element does. The cursor is the first feedback the user gets — it should match the expected interaction without thinking.

## Cursor Map

| Element | Cursor | Rationale |
|---------|--------|-----------|
| Canvas pane (empty space) | `default` | No drag-pan (panOnDrag=false). Pane is for selection and context menu only. |
| Node body — non-text areas (header, border, padding) | `grab` | Nodes are draggable. `grab` signals "you can pick this up". |
| Node body — during drag | `grabbing` | Active drag state. |
| Node body — text content | `default` | Text is read-only unless double-clicked. No drag, no action. |
| Node body — text during editing | `text` | Already handled by the textarea element itself. |
| Edge labels | `default` | Read-only display (no inline editing yet — PRD0036). No need for `pointer`. |
| Handles (connection points) | `grab` | Draggable connection points. Same convention as node grab. |

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add `.react-flow__pane { cursor: default }`, `.react-flow__node { cursor: grab }`, `.react-flow__node.dragging { cursor: grabbing }`, `.react-flow__handle { cursor: grab }`. Change `.react-flow__edge-label` cursor from `pointer` to `default`. |
| `src/canvas/nodes/EntityNode.tsx` | Change `<p>` className from `cursor-grab` to `cursor-default` (text is not draggable). |
| `src/components/base-handle.tsx` | Add `cursor-grab` to className. |

## Verification

1. Open canvas → cursor on empty pane shows `default`
2. Hover node header/badge area → cursor shows `grab`
3. Hover node text → cursor shows `default`
4. Double-click node text → enters editing → cursor shows `text`
5. Click and drag a node → cursor shows `grabbing` during drag
6. Hover an edge label → cursor shows `default` (not `pointer`)
7. Hover a handle → cursor shows `grab`
