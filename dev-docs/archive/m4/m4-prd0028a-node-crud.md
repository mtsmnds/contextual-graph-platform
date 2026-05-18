> **Completion note (2026-05-16):**
> - **What was built:** Created `NodeDialog.tsx` (Base UI Dialog for create/edit with title + EntityKind selector). Updated `GraphCanvas.tsx`: `onNodeDoubleClick` opens edit dialog, "New Node" button in Panel opens create dialog, `onBeforeDelete` + `onNodesDelete` handles select+Backspace delete, `ReactFlowProvider` wrapper for `useReactFlow` context. Placement uses `screenToFlowPosition` at viewport center.
> - **Key decisions:** Removed `onDoubleClick` pane handler (conflicted with `onNodeDoubleClick` event ordering). Create dialog triggered via Panel button instead. No delete confirmation — `onBeforeDelete` returns `true` immediately (undo as future safety net).
> - **Deviations from plan:** Create triggered by Panel button instead of pane double-click (due to React Flow event conflict). No `onBeforeDelete` confirmation dialog (UX debt flagged).

## Task: Node CRUD — create, edit, delete

### Context

PRD0027 delivered drag-to-connect and edge deletion. This PRD adds the remaining graph manipulation primitives for nodes: create via double-click on empty canvas, edit via double-click on existing node, and delete via select + Backspace with a confirmation dialog.

No store changes needed — `addEntity`, `updateEntity`, `deleteEntity` already exist. No custom React Flow components — all built-in `"default"` node types. This is pure event wiring + a lightweight dialog component.

### Design decisions

- **Node creation:** Double-click empty canvas → dialog for title + entity kind. Node placed at viewport center using `screenToFlowPosition`. The diff sync (from PRD0027) initially positions it via Dagre, but we override that position immediately after creation.
- **Node editing:** Double-click existing node → pre-filled dialog with current title and kind. Calls `updateEntity`.
- **Node deletion:** Select node + Backspace → `onBeforeDelete` returns a promise — dialog opens **before** the node is removed from React Flow state. If user confirms, `onNodesDelete` fires and calls `deleteEntity`. If cancelled, the node stays visible. No premature vanishing.
- **No delete confirmation UX debt skipped.** The `onBeforeDelete` pattern keeps the node visible during the dialog. This is clean — no UX debt on deletion timing.
- **Dialog:** Uses existing `@/components/ui/dialog` (Base UI `@base-ui/react/dialog`). No new UI library dependencies.

### Steps

#### 1. Create `src/canvas/NodeDialog.tsx`

A reusable dialog for both create and edit modes, wrapping the existing Base UI Dialog. Props: `mode: "create" | "edit"`, `entity?`, `position?`, `onClose`.

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
import type { EntityKind } from "../types/graph"

interface NodeDialogProps {
  open: boolean
  mode: "create" | "edit"
  initialTitle?: string
  initialKind?: EntityKind
  onConfirm: (title: string, kind: EntityKind) => void
  onCancel: () => void
}

const KINDS: { value: EntityKind; label: string }[] = [
  { value: "container", label: "Container" },
  { value: "concept", label: "Concept" },
  { value: "annotation", label: "Annotation" },
  { value: "summary", label: "Summary" },
]

function NodeDialog({ open, mode, initialTitle = "", initialKind = "container", onConfirm, onCancel }: NodeDialogProps) {
  const [title, setTitle] = useState(initialTitle)
  const [kind, setKind] = useState<EntityKind>(initialKind)

  const handleConfirm = () => {
    onConfirm(title.trim(), kind)
    setTitle("")
    setKind("container")
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Node" : "Edit Node"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <select
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as EntityKind)}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>{mode === "create" ? "Create" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NodeDialog
```

#### 2. Update `GraphCanvas.tsx` — add CRUD handlers

Add new callbacks and dialog state:

```tsx
// Dialog state
const [nodeDialog, setNodeDialog] = useState<{
  mode: "create" | "edit"
  entityId?: string
  initialTitle?: string
  initialKind?: EntityKind
} | null>(null)

// Used for positioning new nodes
const reactFlowInstance = useReactFlow()

// Double-click pane → create node at viewport center
const onDoubleClick = useCallback(() => {
  setNodeDialog({ mode: "create" })
}, [])

// Double-click node → edit
const onNodeDoubleClick = useCallback(
  (_: React.MouseEvent, node: Node) => {
    const entity = useGraphStore.getState().entities.find((e) => e.id === node.id)
    if (entity) {
      setNodeDialog({
        mode: "edit",
        entityId: entity.id,
        initialTitle: entity.title ?? "",
        initialKind: entity.kind,
      })
    }
  },
  [],
)

// Delete confirmation via onBeforeDelete (promise-based, runs before removal)
const onBeforeDelete = useCallback(
  async ({ nodes }: { nodes: Node[] }) => {
    if (nodes.length === 0) return true
    // Skip confirmation for now — user accepted via Backspace gesture
    // (Confirmation via dialog on every delete is friction; undo is better UX long-term)
    return true
  },
  [],
)

// After deletion is confirmed and applied to React Flow state
const onNodesDelete = useCallback(
  (deletedNodes: Node[]) => {
    for (const node of deletedNodes) {
      useGraphStore.getState().deleteEntity(node.id)
    }
  },
  [],
)

// Dialog confirm handler
const handleNodeDialogConfirm = useCallback(
  (title: string, kind: EntityKind) => {
    if (nodeDialog?.mode === "create") {
      const id = useGraphStore.getState().addEntity(kind, { title: title || undefined })
      // Override Dagre position with viewport center
      const viewport = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, position: viewport } : n)),
      )
    } else if (nodeDialog?.mode === "edit" && nodeDialog.entityId) {
      useGraphStore.getState().updateEntity(nodeDialog.entityId, { title, kind })
    }
    setNodeDialog(null)
  },
  [nodeDialog, reactFlowInstance, setNodes],
)
```

Wire them into `<ReactFlow>`:

```tsx
<ReactFlow
  ...
  onDoubleClick={onDoubleClick}
  onNodeDoubleClick={onNodeDoubleClick}
  onBeforeDelete={onBeforeDelete}
  onNodesDelete={onNodesDelete}
  deleteKeyCode={["Backspace", "Delete"]}
>
  ...
  <NodeDialog
    open={nodeDialog !== null}
    mode={nodeDialog?.mode ?? "create"}
    initialTitle={nodeDialog?.initialTitle}
    initialKind={nodeDialog?.initialKind}
    onConfirm={handleNodeDialogConfirm}
    onCancel={() => setNodeDialog(null)}
  />
</ReactFlow>
```

#### 3. Install shadcn AlertDialog

```sh
npx shadcn@latest add alert-dialog
```

### Files changed

| File | Change |
|------|--------|
| `src/canvas/NodeDialog.tsx` | New — reusable create/edit dialog with title + kind |
| `src/canvas/GraphCanvas.tsx` | Add dialog state, `onDoubleClick`, `onNodeDoubleClick`, `onBeforeDelete`, `onNodesDelete`, `handleNodeDialogConfirm` |

### Out of scope (PRD0028b)

- Edge editing (relation type, sortOrder)
- Always-visible edge labels
- Context menus
- `updateRelation` store action
