import { useRef, useEffect, useCallback, useState } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useGraphStore } from "../store/useGraphStore"
import { getLayoutedElements } from "../engine/layout"
import NodeDialog from "./NodeDialog"
import type { EntityKind } from "../types/graph"

function GraphCanvasContent() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)

  const layoutRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)
  if (layoutRef.current === null) {
    layoutRef.current = getLayoutedElements({ entities, relations })
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutRef.current.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutRef.current.edges)

  const reactFlowInstance = useReactFlow()

  const [nodeDialog, setNodeDialog] = useState<{
    mode: "create" | "edit"
    entityId?: string
    initialTitle?: string
    initialKind?: EntityKind
  } | null>(null)

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

  const onBeforeDelete = useCallback(
    async () => true,
    [],
  )

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      for (const node of deletedNodes) {
        useGraphStore.getState().deleteEntity(node.id)
      }
    },
    [],
  )

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const entity = entities.find((e) => e.id === node.id)
      if (entity) {
        setNodeDialog({
          mode: "edit",
          entityId: entity.id,
          initialTitle: entity.title ?? "",
          initialKind: entity.kind,
        })
      }
    },
    [entities],
  )

  const handleNodeDialogConfirm = useCallback(
    (title: string, kind: EntityKind) => {
      if (nodeDialog?.mode === "create") {
        const id = useGraphStore.getState().addEntity(kind, { title: title || undefined })
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

  const onCreateNode = useCallback(() => {
    setNodeDialog({ mode: "create" })
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
      onBeforeDelete={onBeforeDelete}
      onNodesDelete={onNodesDelete}
      onNodeDoubleClick={onNodeDoubleClick}
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
        <div className="flex gap-1">
          <button
            onClick={onCreateNode}
            className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded border shadow-sm hover:bg-accent/80"
          >
            New Node
          </button>
          <button
            onClick={onRelayout}
            className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded border shadow-sm hover:bg-accent/80"
          >
            Re-layout
          </button>
        </div>
      </Panel>
      <NodeDialog
        open={nodeDialog !== null}
        mode={nodeDialog?.mode ?? "create"}
        initialTitle={nodeDialog?.initialTitle}
        initialKind={nodeDialog?.initialKind}
        onConfirm={handleNodeDialogConfirm}
        onCancel={() => setNodeDialog(null)}
      />
    </ReactFlow>
  )
}

function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasContent />
    </ReactFlowProvider>
  )
}

export default GraphCanvas
