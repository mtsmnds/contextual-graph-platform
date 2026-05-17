## Task: Edge Handles + Invisible Resize

### Purpose

Add edge connection handles and node resizing to the custom EntityNode. Both experiences live on the node border and must not conflict. Handles take precedence over resize zones. Resize is invisible — the only affordance is cursor change (double-headed arrow near edges, diagonal at corners). Handles are always visible as subtle dots.

### Aesthetic direction

Monochrome minimalism aligned with shadcn standards. No colors, no embellishments. Handle dots use `bg-muted-foreground/40` (hover `bg-muted-foreground/70`). Resize is purely cursor-driven — no visible resize dots, corner handles, or border lines. The existing BaseNode hover (`hover:ring-1`) and selected (`in-[.selected]:border-muted-foreground + shadow`) styles are preserved unchanged.

### Scope

- Install BaseHandle from reactflow.dev shadcn registry (`npx shadcn@latest add https://ui.reactflow.dev/base-handle`)
- Add target handle (left) and source handle (right) to EntityNode
- Add NodeResizer for resize behavior (handles/lines invisible via `opacity-0`)
- Cursor CSS: `ns-resize` / `ew-resize` on edge handles, `nwse-resize` / `nesw-resize` on corner handles
- Handle hit area expansion via `::before` pseudo-element (~18px diameter) so handles are easy to grab
- Priority: handle hit area overlaps resize edge zone at left/right midpoints — handles win
- Min size: `minWidth={60}`, `minHeight={45}` (4x / 3x grid blocks of the 15x15 snap grid)
- Handle styling: small muted dots, always visible but unobtrusive
- During inline editing (textarea active), handles and resize are inactive (`nodrag nowheel nopan` on textarea already prevents interference)

### Out of scope

- Visible resize dots or corner handles (resize is cursor-only)
- Border lines on resize hover (may add in v2)
- Rich text / Tiptap in nodes
- Multiple node types with different layouts

### Edge Handle — BaseHandle

Installed from `https://ui.reactflow.dev/base-handle`. Rendered inside EntityNode content area:

```
<BaseHandle type="target" position={Position.Left}
  className="!bg-muted-foreground/40 hover:!bg-muted-foreground/70" />
<BaseHandle type="source" position={Position.Right}
  className="!bg-muted-foreground/40 hover:!bg-muted-foreground/70" />
```

Hit area expanded via CSS on `.react-flow__handle::before` — creates a ~20px grab zone.

### Resize — NodeResizer (invisible)

```
<NodeResizer
  minWidth={60}
  minHeight={45}
  handleClassName="opacity-0"
  lineClassName="opacity-0"
/>
```

Rendered before BaseNode in the fragment. Both corner/edge handle dots and border lines are invisible. Mouse events still fire on transparent elements (opacity doesn't disable pointer events).

### Cursor CSS

```css
.react-flow__handle { z-index: 10; }
.react-flow__handle::before {
  content: '';
  position: absolute;
  width: calc(100% + 12px);
  height: calc(100% + 12px);
  top: -6px;
  left: -6px;
}

.react-flow__resize-control.handle[data-handlepos*="top"]:hover,
.react-flow__resize-control.handle[data-handlepos*="bottom"]:hover { cursor: ns-resize !important; }
.react-flow__resize-control.handle[data-handlepos*="left"]:hover,
.react-flow__resize-control.handle[data-handlepos*="right"]:hover { cursor: ew-resize !important; }
.react-flow__resize-control.handle[data-handlepos="top-left"]:hover,
.react-flow__resize-control.handle[data-handlepos="bottom-right"]:hover { cursor: nwse-resize !important; }
.react-flow__resize-control.handle[data-handlepos="top-right"]:hover,
.react-flow__resize-control.handle[data-handlepos="bottom-left"]:hover { cursor: nesw-resize !important; }
```

`!important` required to override React Flow's inline cursor on resize controls.

### Priority model

On node left/right edges, the BaseHandle sits at the vertical midpoint. The resize handle zone covers the full edge but the handle's `::before` expansion (~18px diameter) overlaps the border at the midpoint, giving the handle precedence. At corners (where no handle exists), the resize cursor appears. In practice:

```
Edge handle zone (~18px at midpoint) → handle cursor (grab edge)
Between midpoint and corners → resize cursor
Corners → diagonal resize cursor
```

### Files to change

| File | Change |
|---|---|
| `src/components/base-handle.tsx` | **New** — installed via shadcn CLI |
| `src/canvas/nodes/EntityNode.tsx` | Add BaseHandle + NodeResizer imports and render |
| `src/index.css` | Add handle hit-area expansion + resize cursor rules |
