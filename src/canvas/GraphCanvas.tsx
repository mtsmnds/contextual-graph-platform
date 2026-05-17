import { useRef, useEffect, useCallback } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useGraphStore } from "../store/useGraphStore"
import { getLayoutedElements } from "../engine/layout"

function GraphCanvas() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)

  const layoutRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)
  if (layoutRef.current === null) {
    layoutRef.current = getLayoutedElements({ entities, relations })
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutRef.current.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutRef.current.edges)

  useEffect(() => {
    const layouted = getLayoutedElements({ entities, relations })

    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]))
      const layoutedById = new Map(layouted.nodes.map((n) => [n.id, n]))
      const merged: Node[] = []

      for (const [id, layoutedNode] of layoutedById) {
        const existing = prevById.get(id)
        if (existing) {
          merged.push({ ...existing, data: layoutedNode.data })
        } else {
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
          merged.push({ ...existing, label: layoutedEdge.label, data: layoutedEdge.data })
        } else {
          merged.push(layoutedEdge)
        }
      }

      return merged
    })
  }, [entities, relations, setNodes, setEdges])

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

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      for (const edge of edgesToDelete) {
        useGraphStore.getState().removeRelation(edge.id)
      }
    },
    [],
  )

  const onNodesDelete = useCallback(() => {
    // Node deletion deferred to PRD0028
  }, [])

  const onRelayout = useCallback(() => {
    const { entities, relations } = useGraphStore.getState()
    const { nodes: relayouted, edges: relayoutedEdges } = getLayoutedElements({ entities, relations })
    setNodes(relayouted)
    setEdges(relayoutedEdges)
  }, [setNodes, setEdges])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onEdgesDelete={onEdgesDelete}
      onNodesDelete={onNodesDelete}
      fitView
      snapToGrid
      snapGrid={[15, 15]}
      deleteKeyCode={["Backspace", "Delete"]}
      multiSelectionKeyCode="Shift"
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable />
      <Panel position="top-right">
        <button
          onClick={onRelayout}
          className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded border shadow-sm hover:bg-accent/80"
        >
          Re-layout
        </button>
      </Panel>
    </ReactFlow>
  )
}

export default GraphCanvas
