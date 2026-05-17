## Task: Edge Handles + Invisible Resize

### Purpose

Add edge connection handles and node resizing to the custom EntityNode. Both experiences live on the node border and must not conflict. Handles take precedence over resize zones. Resize is invisible — the only affordance is cursor change (double-headed arrow near edges, diagonal at corners). Handles are always visible as subtle dots.

### Aesthetic direction

Monochrome minimalism aligned with shadcn standards. No colors, no embellishments. Handle fill via `--xy-handle-background-color: var(--card)`, border via `--xy-handle-border-color: var(--border)`. 14px diameter, 2px border. Resize is purely cursor-driven — no visible resize dots, corner handles, or border lines. The existing BaseNode hover (`hover:ring-1`) and selected (`in-[.selected]:border-muted-foreground + shadow`) styles are preserved unchanged.

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

## Architecture Decision Record

### 2026-05-17: Handle theming — CSS variables + specificity over `!important`

**Context:** React Flow's built-in `.react-flow__handle` CSS (6px wide, 1px border) was overriding our Tailwind utility classes on the BaseHandle component. Initial approach used `!important` Tailwind prefixes (`!size-3.5` etc.), which is a band-aid — fragile, hard to override later, and fights React Flow's internals.

**Decision:** Two-pronged approach, zero `!important`:

1. **Colors via React Flow's CSS variables** (`--xy-handle-background-color`, `--xy-handle-border-color`) set on `.react-flow`. These are the official React Flow theming API — no specificity fight needed.

2. **Sizing via specificity override** (`.react-flow .react-flow__handle` = two classes > `.react-flow__handle` = one class). Sets `width: 14px`, `height: 14px`, `border-width: 2px`.

**Consequences:**
- `base-handle.tsx` stays thin: only `rounded-full transition-colors` — no theme tokens, no `!important`
- All theme overrides live in `index.css` next to other React Flow customizations
- Easy to tweak dimensions later without touching the component
- Hover state handled by `.react-flow .react-flow__handle:hover` changing the CSS variable

### 2026-05-17: Resize border activation area — `::before` expansion on lines + handles

**Context:** The NodeResizer renders 4 invisible edge lines (2px thick) and 4 invisible corner handles (5×5). The user had to hit the exact 5×5 corner pixel for the resize cursor to appear — no edge activation zone existed. The existing cursor rules used `[data-handlepos*="top"]` selectors but the elements don't carry that attribute, so no cursor changes were firing.

**Decision:** Apply the same `::before` hit-area expansion pattern used on BaseHandle to NodeResizer's lines and corner handles:

1. **Edge lines** get a `::before` expanding their 2px strip to 8px vertically/horizontally — the cursor changes when the mouse is within ~4px of the border.
2. **Corner handles** keep their 5×5 invisible size — the edge line strips already cover corners where they overlap.
3. **Cursor rules** fixed to use class-name selectors (`.react-flow__resize-control.line.top:hover`) instead of data attributes.
4. **`lineClassName`/`handleClassName` props removed** from NodeResizer — all styling moves to `index.css`.

**Consequences:**
- Full edge activation: hovering anywhere within ~4px of any border edge triggers the resize cursor
- Corner activation handled naturally by overlapping edge strips
- BaseHandle `::before` hit zone (z-index: 10) still wins at left/right midpoints, maintaining priority
- No changes to EntityNode.tsx or base-handle.tsx — pure CSS in index.css

### Edge Handle — BaseHandle

Installed from `https://ui.reactflow.dev/base-handle`. Rendered inside EntityNode content area:

```
<BaseHandle type="target" position={Position.Left} />
<BaseHandle type="source" position={Position.Right} />
```

No className override — all theming via CSS variables + specificity in `index.css`.

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
