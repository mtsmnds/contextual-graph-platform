> **Completion note (2026-05-16):**
> - **What was built:** Refactored `GraphCanvas.tsx` with ref-capture layout (no re-render thrash), diff-based store sync with data merge (preserves positions, refreshes labels), store-only `onConnect` (no double-write race), `onEdgesDelete` → `removeRelation`, `onNodesDelete` no-op, re-layout button in `<Panel position="top-right">`, `deleteKeyCode` enabled for edges only.
> - **Key decisions:** Store-only connect path avoids race condition. Diff sync merges data but preserves user-dragged positions. Node deletion explicitly deferred to PRD0028.
> - **Deviations from plan:** None.

## Task: React Flow interactivity — drag, connect, select, sync

### Context

PRD0026 delivered a read-only graph. This PRD makes it interactive: users can drag nodes, create edges by connecting handles, select elements, and delete edges via keyboard. The core challenge is managing the two sources of truth — React Flow's local state (positions, selection) and the Zustand store (entities, relations).

### Design decisions

- **Positions live in React Flow state**, never in the store. Dagre layout is computed once on mount via a ref-capture pattern (no `useEffect` guard, no remount thrash). After mount, the user owns positions until they explicitly click "Re-layout".
- **Store → React Flow sync** uses diff-by-ID with a data merge step — kept nodes get their `data` updated from the latest entity, preserving position but reflecting label/kind changes.
- **Edge creation (`onConnect`)** is store-only. No optimistic local add — the store diff sync picks up the new edge within the same render cycle. This avoids the double-write race condition.
- **Edge deletion** is wired via `onEdgesDelete` — calls `removeRelation` in the store. **Node deletion is deferred** to PRD0028 (needs confirmation/context menu).
- **New node placement** (for future PRD0028) will use viewport center or offset from last selected node. No re-run of Dagre for individual new nodes.
- **Re-layout button** in a `<Panel position="top-right">` — user-initiated, resets all positions to Dagre output.

### Steps

#### 1. Initial layout — ref-capture, no useEffect guard

Compute layout synchronously on first render, stored in refs. Never recalculates unless explicitly triggered:

```tsx
const layoutRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)

if (layoutRef.current === null) {
  layoutRef.current = getLayoutedElements({ entities, relations })
}

const [nodes, setNodes, onNodesChange] = useNodesState(layoutRef.current.nodes)
const [edges, setEdges, onEdgesChange] = useEdgesState(layoutRef.current.edges)
```

No `useEffect` initializer needed. The ref guard survives React strict mode double-mount (ref is preserved across mount/unmount).

#### 2. Store → React Flow sync — diff by ID with data merge

When the store's entities/relations array identity changes, sync by ID. Kept nodes preserve their position but get their `data` refreshed from the latest entity:

```tsx
useEffect(() => {
  const layouted = getLayoutedElements({ entities, relations })

  setNodes((prev) => {
    const prevById = new Map(prev.map((n) => [n.id, n]))
    const layoutedById = new Map(layouted.nodes.map((n) => [n.id, n]))
    const merged: Node[] = []

    for (const [id, layoutedNode] of layoutedById) {
      const existing = prevById.get(id)
      if (existing) {
        // Preserve position, refresh data from latest entity
        merged.push({ ...existing, data: layoutedNode.data })
      } else {
        // New node — use layout position
        merged.push(layoutedNode)
      }
    }

    return merged
  })

  setEdges((prev) => {
    const prevById = new Map(prev.map((e) => [e.id, e]))
    const layoutedById = new Map(layouted.edges.map((e) => [e.id, e]))
    const merged: Edge[] = []

    for (const [id, layoutedEdge] of layoutedById) {
      const existing = prevById.get(id)
      if (existing) {
        // Preserve whatever state (selection etc.), refresh label
        merged.push({ ...existing, label: layoutedEdge.label, data: layoutedEdge.data })
      } else {
        merged.push(layoutedEdge)
      }
    }

    return merged
  })
}, [entities, relations, setNodes, setEdges])
```

This preserves user-dragged positions, reflects label changes, and adds/removes nodes/edges to match the store.

#### 3. Wire `onConnect` — store-only path

No optimistic local add. The store diff sync (step 2) picks up the new edge:

```tsx
const onConnect = useCallback(
  (connection: Connection) => {
    useGraphStore.getState().addRelation(
      connection.source,
      connection.target,
      "related_to",
    )
  },
  [],
)
```

`addRelation` accepts `type: string` (from PRD0025), so `"related_to"` works directly. The small delay between connection and edge appearance is acceptable for v1.

#### 4. Wire `onEdgesDelete` — edge deletion removes from store

Edge deletion via keyboard (Backspace/Delete) or context menu removes the relation from the store:

```tsx
const onEdgesDelete = useCallback(
  (edgesToDelete: Edge[]) => {
    for (const edge of edgesToDelete) {
      useGraphStore.getState().removeRelation(edge.id)
    }
  },
  [],
)
```

Node deletion is deferred to PRD0028. To prevent accidental node deletion, nodes will not respond to Backspace/Delete in this PRD. The built-in `deleteKeyCode` prop works on both nodes and edges, so node deletions need to be intercepted. Use `onNodesDelete` to prevent it:

```tsx
const onNodesDelete = useCallback(() => {
  // Nodes cannot be deleted yet — PRD0028
}, [])
```

Or keep `deleteKeyCode={["Backspace", "Delete"]}` and let `onEdgesDelete` handle edges while `onNodesDelete` is a no-op. React Flow only deletes elements that have a handler.

Actually, the simplest: set `deleteKeyCode={["Backspace", "Delete"]}` and use `onEdgesDelete` + `onNodesDelete` (no-op). React Flow calls the specific handler per element type, so edges get deleted and nodes don't.

#### 5. Add re-layout button

```tsx
import { Panel } from "@xyflow/react"

const onRelayout = useCallback(() => {
  const { entities, relations } = useGraphStore.getState()
  const { nodes: relayouted, edges: relayoutedEdges } = getLayoutedElements({ entities, relations })
  setNodes(relayouted)
  setEdges(relayoutedEdges)
}, [setNodes, setEdges])

// Inside <ReactFlow>:
<Panel position="top-right">
  <button
    onClick={onRelayout}
    className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded border shadow-sm hover:bg-accent/80"
  >
    Re-layout
  </button>
</Panel>
```

### Summary of sync architecture

```
User drags node  →  React Flow state  →  render
User connects   →  store.addRelation  →  useEffect sync picks it up → React Flow state → render
Store entity added  →  useEffect sync → adds node with Dagre position → React Flow state → render
Entity renamed  →  useEffect sync → merges data.label onto kept node → React Flow state → render
Re-layout click →  getLayoutedElements → setNodes/setEdges → React Flow state → render
```

### Files changed

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | Refactor to ref-capture layout, diff-based sync with data merge, `onConnect` (store-only), `onEdgesDelete`, `onNodesDelete` (no-op), re-layout Panel button, enable `deleteKeyCode` |

### Out of scope (PRD0028)

- Node creation (placement: viewport center or offset from selected)
- Node editing via double-click
- Context menus
- Edge label editing
- Node deletion via keyboard
