## Task: Edge editing, always-visible labels, context menus

### Context

PRD0028a delivered node CRUD. This PRD finishes the graph manipulation surface with three independent changes: edge editing (relation type + sortOrder), always-visible edge labels (CSS), and context menus (right-click on nodes/edges/pane).

### Design decisions

- **Edge editing** via double-click on edge label. Opens a dialog for relation type and sortOrder. Requires a new `updateRelation` store action.
- **Always-visible edge labels** via CSS override. Default React Flow edges hide labels unless hovered/selected — we remove that behavior so relation types are permanently readable. The layout function already sets `label: relation.type` on every edge (from PRD0026).
- **Context menus use manual positioning**, not shadcn/Radix ContextMenu. Radix requires a `<ContextMenuTrigger>` wrapper around the target element, which conflicts with React Flow's pointer event handling (drag, pan, selection). Instead, we use React Flow's `onNodeContextMenu`, `onEdgeContextMenu`, and `onPaneContextMenu` events, prevent default, and render a controlled `<div>` at the mouse coordinates. This is the same pattern used by the React Flow pro examples and avoids event conflicts entirely.

### Steps

#### 1. Add `updateRelation` to store

In `src/store/useGraphStore.ts`:

```ts
updateRelation: (id: string, patch: Partial<Relation>) => {
  set((state: GraphStore) => ({
    relations: state.relations.map((r) =>
      r.id === id
        ? { ...r, ...patch, metadata: { ...r.metadata, ...(patch.metadata ?? {}) } }
        : r,
    ),
  }));
},
```

Add to the `GraphStore` interface. Signature matches `updateEntity`.

#### 2. Create `src/canvas/EdgeDialog.tsx`

A dialog for editing edge relation type and sortOrder:

```tsx
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface EdgeDialogProps {
  open: boolean
  initialType?: string
  initialSortOrder?: string
  onConfirm: (type: string, sortOrder: string) => void
  onCancel: () => void
}

function EdgeDialog({ open, initialType = "related_to", initialSortOrder = "", onConfirm, onCancel }: EdgeDialogProps) {
  const [type, setType] = useState(initialType)
  const [sortOrder, setSortOrder] = useState(initialSortOrder)

  const handleConfirm = () => {
    onConfirm(type.trim(), sortOrder.trim())
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Relation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Relation Type</label>
            <Input value={type} onChange={(e) => setType(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Sort Order</label>
            <Input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="fractional-indexing key" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EdgeDialog
```

#### 3. Create `src/canvas/GraphContextMenu.tsx`

A manually-positioned context menu. No Radix, no shadcn — a controlled div at mouse coordinates:

```tsx
import { useEffect, useRef } from "react"

interface MenuItem {
  label: string
  action: () => void
  separator?: boolean
}

interface ContextMenuProps {
  open: boolean
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

function GraphContextMenu({ open, x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    // Small delay to avoid the right-click event itself closing the menu
    setTimeout(() => document.addEventListener("click", handleClick), 0)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("click", handleClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-32 bg-popover text-popover-foreground border rounded-md shadow-xl py-1"
      style={{ left: x, right: undefined, top: y }}
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.separator && <div className="border-t my-1" />}
          <button
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => { item.action(); onClose() }}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}

export default GraphContextMenu
```

#### 4. Update `GraphCanvas.tsx` — wire edge editing and context menus

Add state and handlers:

```tsx
// Edge dialog state
const [edgeDialog, setEdgeDialog] = useState<{
  edgeId: string
  initialType?: string
  initialSortOrder?: string
} | null>(null)

// Context menu state
const [contextMenu, setContextMenu] = useState<{
  x: number; y: number
  type: "node" | "edge" | "pane"
  nodeId?: string; edgeId?: string
} | null>(null)

// Double-click edge → edit
const onEdgeDoubleClick = useCallback(
  (_: React.MouseEvent, edge: Edge) => {
    const rel = useGraphStore.getState().relations.find((r) => r.id === edge.id)
    if (rel) {
      setEdgeDialog({
        edgeId: rel.id,
        initialType: rel.type,
        initialSortOrder: rel.sortOrder,
      })
    }
  },
  [],
)

// Context menu handlers
const onNodeContextMenu = useCallback(
  (e: React.MouseEvent, node: Node) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, type: "node", nodeId: node.id })
  },
  [],
)

const onEdgeContextMenu = useCallback(
  (e: React.MouseEvent, edge: Edge) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, type: "edge", edgeId: edge.id })
  },
  [],
)

const onPaneContextMenu = useCallback(
  (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, type: "pane" })
  },
  [],
)
```

Context menu item builders:

```tsx
const contextMenuItems = useMemo(() => {
  if (!contextMenu) return []
  switch (contextMenu.type) {
    case "node":
      return [
        { label: "Edit", action: () => { /* open node dialog */ } },
        { label: "Delete", action: () => {
          useGraphStore.getState().deleteEntity(contextMenu.nodeId!)
        }},
      ]
    case "edge":
      return [
        { label: "Edit Relation", action: () => { /* open edge dialog */ } },
        { label: "Delete Edge", action: () => {
          useGraphStore.getState().removeRelation(contextMenu.edgeId!)
        }},
      ]
    case "pane":
      return [
        { label: "New Node", action: () => { /* open create node dialog */ } },
      ]
  }
}, [contextMenu])
```

Wire into `<ReactFlow>`:

```tsx
<ReactFlow
  ...
  onEdgeDoubleClick={onEdgeDoubleClick}
  onNodeContextMenu={onNodeContextMenu}
  onEdgeContextMenu={onEdgeContextMenu}
  onPaneContextMenu={onPaneContextMenu}
>
  ...
  <EdgeDialog ... />
  <GraphContextMenu
    open={contextMenu !== null}
    x={contextMenu?.x ?? 0}
    y={contextMenu?.y ?? 0}
    items={contextMenuItems}
    onClose={() => setContextMenu(null)}
  />
</ReactFlow>
```

#### 5. Always-visible edge labels — CSS

```css
/* Edge labels always visible — exposes relation types without hover */
.react-flow__edge-label {
  font-size: 10px;
  opacity: 1 !important;
  pointer-events: auto;
  cursor: pointer;
}
```

This overrides the default edge label behavior (hidden unless hovered/selected). Labels now render for every edge that has a `label` prop (the layout function sets `label: relation.type` on all edges). The `pointer-events: auto` and `cursor: pointer` enable clicking the label for editing.

### Files changed

| File | Change |
|------|--------|
| `src/store/useGraphStore.ts` | Add `updateRelation` action |
| `src/canvas/EdgeDialog.tsx` | New — edit relation type + sortOrder dialog |
| `src/canvas/GraphContextMenu.tsx` | New — manually-positioned right-click menu |
| `src/canvas/GraphCanvas.tsx` | Wire `onEdgeDoubleClick`, context menu events, dialogs |
| `src/index.css` | Edge label CSS override for always-visible |

### Out of scope

- Custom node/edge components (deferred)
- Inline editing (deferred — dialogs are temporary UX)
- Undo/redo
