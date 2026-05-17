## Task: Node and edge CRUD — create, edit, delete with context menus

### Context

PRD0027 delivered drag-to-connect and edge deletion. This PRD closes the gap on graph manipulation: users can create, edit, and delete nodes through gestures (double-click, select+backspace) and context menus. Edge editing (relation type, sort order) and always-visible edge labels are also in scope.

### Design decisions

- **Node creation** via double-click on empty canvas space. Opens a simple dialog (shadcn AlertDialog or similar) for title + entity kind. Node placed at viewport center using `screenToFlowPosition`.
- **Node editing** via double-click on an existing node. Opens the same dialog pre-filled with the node's current data. Editing is title and kind only — content editing is Tiptap territory (m3).
- **Node deletion** via select + Backspace. Shows a confirmation dialog (shadcn AlertDialog) before calling `deleteEntity`. Cascade deletes relations automatically (store already handles this).
- **Context menus** using shadcn `ContextMenu` component for right-click on nodes and empty canvas. Node context menu: Edit, Delete. Canvas context menu: New Node. Edge context menu: Edit Relation, Delete Edge.
- **Edge labels always visible** via CSS override on `.react-flow__edge-label` — remove the opacity/hide-on-default behavior so relation types are always readable.
- **Edge editing** via double-click on edge label. Opens a simple dialog to edit relation type and sort order. Uses `updateEntity`... wait, edges are Relations, not Entities. Need to add an `updateRelation` action to the store, or use `removeRelation` + `addRelation`. A dedicated `updateRelation` is cleaner.

#### Store addition needed

Add `updateRelation` to `useGraphStore`:

```ts
updateRelation: (id: string, patch: Partial<Relation>) => void
```

This patches the relation in-state similarly to `updateEntity`. It's a small addition but necessary for edge editing.

### Steps

#### 1. Add `updateRelation` to store

In `src/store/useGraphStore.ts`:

```ts
updateRelation: (id: string, patch: Partial<Relation>) => {
  set((state: GraphStore) => ({
    relations: state.relations.map((r) =>
      r.id === id ? { ...r, ...patch, metadata: { ...r.metadata, ...(patch.metadata ?? {}) } } : r,
    ),
  }));
},
```

Add to the `GraphStore` interface too.

#### 2. Install shadcn ContextMenu

```sh
npx shadcn@latest add context-menu
```

This gives us the `ContextMenu` primitives (trigger, content, item, separator).

#### 3. Create `src/canvas/GraphContextMenu.tsx`

A component that wraps React Flow and provides context menus for nodes and the canvas pane. It reads the right-click target from React Flow's context menu event and renders the appropriate shadcn ContextMenu:

```tsx
import { useCallback, useState, useRef } from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { Node, Edge } from "@xyflow/react"

interface MenuState {
  type: "node" | "edge" | "pane"
  node?: Node
  edge?: Edge
  x: number
  y: number
}

function GraphContextMenu({ children, onEditNode, onDeleteNode, onNewNode, onEditEdge, onDeleteEdge }) {
  const [menu, setMenu] = useState<MenuState | null>(null)

  // These handlers are passed from GraphCanvas which gets them from React Flow events
  // ...
}
```

Design note: React Flow fires `onNodeContextMenu`, `onEdgeContextMenu`, `onPaneContextMenu` with the native event. We prevent default, capture the position and target, and show the context menu.

#### 4. Update `GraphCanvas.tsx` — add all CRUD handlers

Wire these new callbacks into `GraphCanvas.tsx`:

| Gesture | Handler | Action |
|---------|---------|--------|
| Double-click pane | `onDoubleClick` with `screenToFlowPosition` | Open create-node dialog, place at viewport center |
| Double-click node | Node's `onDoubleClick` or use `onNodeDoubleClick` | Open edit-node dialog with current data |
| Select + Backspace (node) | `onNodesDelete` (replace no-op) | `confirmDelete ? deleteEntity(id) : no-op` |
| Right-click node | `onNodeContextMenu` | Show context menu |
| Right-click pane | `onPaneContextMenu` | Show context menu |
| Double-click edge | `onEdgeDoubleClick` | Open edit-edge dialog |
| Select + Backspace (edge) | Already wired (PRD0027) | Already works |

##### Node creation dialog

A simple component rendered conditionally:

```tsx
function CreateNodeDialog({ open, onClose, position }) {
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState<EntityKind>("container")

  const handleCreate = () => {
    const id = useGraphStore.getState().addEntity(kind, { title: title || undefined })
    // Position the new node at the viewport center
    // (the diff sync will add it with Dagre position initially,
    //  but we override that position here)
    onClose()
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>New Node</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={...} />
          <select value={kind} onChange={...}>
            <option value="container">Container</option>
            <option value="concept">Concept</option>
            <option value="annotation">Annotation</option>
          </select>
        </div>
        <AlertDialogFooter>
          <Button onClick={handleCreate}>Create</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

##### Node placement

After calling `addEntity`, manually set the new node's position in React Flow state (override the Dagre-positioned version from the diff sync):

```tsx
const handleCreateNode = useCallback((title: string, kind: EntityKind) => {
  const id = useGraphStore.getState().addEntity(kind, { title })
  const center = reactFlowInstance.screenToFlowPosition({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  })
  setNodes((nds) =>
    nds.map((n) => (n.id === id ? { ...n, position: center } : n)),
  )
}, [setNodes])
```

#### 5. Always-visible edge labels

Add CSS in `src/index.css`:

```css
.react-flow__edge-textwrapper {
  /* remove default hiding behavior */
}
.react-flow__edge-label {
  font-size: 10px;
  opacity: 1 !important;
  pointer-events: auto;
  cursor: pointer;
}
```

This overrides the default edge label behavior (which hides labels unless hovered/selected) and makes relation types permanently readable. The `pointer-events: auto` enables double-click on the label for editing.

#### 6. Edge editing dialog

Similar to the node editing dialog, but for relation type and sort order:

```tsx
function EditEdgeDialog({ open, onClose, edge }) {
  const [type, setType] = useState(edge?.label ?? "related_to")
  const [sortOrder, setSortOrder] = useState("")

  const handleSave = () => {
    useGraphStore.getState().updateRelation(edge.id, {
      type,
      sortOrder: sortOrder || undefined,
    })
    onClose()
  }
  // ...
}
```

### Files changed

| File | Change |
|------|--------|
| `src/store/useGraphStore.ts` | Add `updateRelation` action to interface and implementation |
| `src/canvas/GraphCanvas.tsx` | Add CRUD dialogs, context menu wiring, double-click handlers, node placement |
| `src/canvas/GraphContextMenu.tsx` | New — context menu component using shadcn ContextMenu |
| `src/canvas/CreateNodeDialog.tsx` | New — dialog for creating/editing nodes |
| `src/canvas/EditEdgeDialog.tsx` | New — dialog for editing edge relation type and sort order |
| `src/index.css` | Edge label CSS overrides for always-visible labels |
| `package.json` | Adds `@radix-ui/react-alert-dialog` (via shadcn) + context-menu dependencies |

### Out of scope

- Content editing (Tiptap integration — m3 territory)
- Custom node/edge components (deferred; all built-in types)
- Thread view (II.10 — later milestone)
