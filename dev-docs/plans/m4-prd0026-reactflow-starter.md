## Task: React Flow starter kit — render the graph

### Context

Phase II of the Graph Canvas continues. React Flow is already installed (`@xyflow/react ^12.10.2` in `package.json`) but has been stripped from the app since PRD0015. This PRD re-introduces it as a read-only graph visualization in the workspace shell. No custom components, no node/edge CRUD yet — just the built-in plugin components with a dotgrid background.

Our store has entities and relations with `sortOrder`. This PRD converts them into React Flow nodes and edges, lays them out with Dagre, and renders them in the `/` workspace route.

### Steps

#### 1. Create `src/canvas/GraphCanvas.tsx`

A new component that reads from `useGraphStore` and renders a controlled React Flow:

```tsx
import { useMemo, useCallback } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useGraphStore } from "../store/useGraphStore"
import { getLayoutedElements } from "../engine/layout"

function GraphCanvas() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements({ entities, relations }),
    [entities, relations],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // Sync when store changes (new entities/relations)
  useEffect(() => {
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      snapToGrid
      snapGrid={[15, 15]}
      deleteKeyCode={null}        // no deletion yet (PRD0027+)
      multiSelectionKeyCode="Shift"
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable />
    </ReactFlow>
  )
}

export default GraphCanvas
```

Set parent container to fill available space (height: 100%, width: 100%).

#### 2. Create `src/engine/layout.ts`

A pure function that converts entities + relations to React Flow nodes/edges and applies Dagre layout:

```ts
import dagre from "dagre"
import type { Entity, Relation } from "../types/graph"
import type { Node, Edge } from "@xyflow/react"

interface LayoutInput {
  entities: Entity[]
  relations: Relation[]
}

const NODE_WIDTH = 200
const NODE_HEIGHT = 80

export function getLayoutedElements({ entities, relations }: LayoutInput) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "LR", nodesep: 80, ranksep: 150 })
  g.setDefaultEdgeLabel(() => ({}))

  // Determine node label and dimensions
  const nodes: Node[] = entities.map((entity) => {
    const label = entity.title || entity.kind || entity.id
    g.setNode(entity.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
    return {
      id: entity.id,
      position: { x: 0, y: 0 }, // dagre fills this in
      data: { label, kind: entity.kind, id: entity.id },
      type: "default",
    }
  })

  const edges: Edge[] = relations.map((rel) => {
    g.setEdge(rel.source, rel.target)
    return {
      id: rel.id,
      source: rel.source,
      target: rel.target,
      label: rel.type,
      type: "default",
    }
  })

  dagre.layout(g)

  const positionedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: positionedNodes, edges }
}
```

#### 3. Update `src/routes/WorkspaceRoot.tsx`

Replace the centered `<h1>Workspace</h1>` placeholder with `<GraphCanvas />`. The flex container already has `flex-1 min-h-0`, so the canvas fills the remaining space.

```tsx
// Before:
<div className="flex-1 min-h-0 flex items-center justify-center">
  <h1 className="text-2xl text-muted-foreground">Workspace</h1>
</div>

// After:
<div className="flex-1 min-h-0">
  <GraphCanvas />
</div>
```

#### 4. CSS for the canvas wrapper

In `src/index.css`, add:

```css
.react-flow__container {
  width: 100%;
  height: 100%;
}
```

The parent `.flex-1.min-h-0 > div` will fill the remaining viewport height. The `@xyflow/react/dist/style.css` import handles the rest.

### Rationale for PRD boundaries

| PRD | Scope | Why separate |
|-----|-------|-------------|
| **PRD0026** (this) | Read-only graph, dagre layout, Background/Controls/MiniMap | Gets the graph visible and verifiable before adding complexity |
| **PRD0027** | Interactivity: drag nodes, connect edges, select | Adds controlled state sync between store and React Flow |
| **PRD0028** | Node/edge CRUD: double-click create/edit, select+backspace delete, context menus | Full graph manipulation — builds on interactivity |

This gives a working graph to look at after PRD0026, then layers interaction on top without destabilizing the render.

### Files changed

| File | Change |
|------|--------|
| `src/canvas/GraphCanvas.tsx` | New — React Flow component with Background/Controls/MiniMap |
| `src/engine/layout.ts` | New — Dagre layout engine for entities+relations |
| `src/routes/WorkspaceRoot.tsx` | Replace placeholder h1 with GraphCanvas |
| `src/index.css` | Add canvas container styles |
