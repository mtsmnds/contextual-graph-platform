import { useRef, useEffect, useCallback, useMemo, useState } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  SelectionMode,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useGraphStore } from "../store/useGraphStore"
import { getFSAccessInstance, setAdapter } from "@/store/persistence"
import { getLayoutedElements } from "../engine/layout"
import type { GraphSnapshot } from "../types/graph"
import { ZoomIn, ZoomOut, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import EdgeDialog from "./EdgeDialog"
import GraphContextMenu from "./GraphContextMenu"
import EntityNode from "./nodes/EntityNode"

const nodeTypes = { entity: EntityNode }

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
  const storeInit = useGraphStore((s) => s.init)
  const refreshFolderName = useGraphStore((s) => s.refreshFolderName)

  const [edgeDialog, setEdgeDialog] = useState<{
    edgeId: string
    initialType?: string
    initialSortOrder?: string
  } | null>(null)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: "node" | "edge" | "pane"
    nodeId?: string
    edgeId?: string
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

  const createNodeAtCenter = useCallback(() => {
    const id = useGraphStore.getState().addEntity("concept")
    const viewport = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? { ...n, position: viewport, data: { ...n.data, editTrigger: 1 } }
          : n,
      ),
    )
  }, [reactFlowInstance, setNodes])

  const onEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const rel = relations.find((r) => r.id === edge.id)
      if (rel) {
        setEdgeDialog({
          edgeId: rel.id,
          initialType: rel.type,
          initialSortOrder: rel.sortOrder,
        })
      }
    },
    [relations],
  )

  const handleEdgeDialogConfirm = useCallback(
    (type: string, sortOrder: string) => {
      if (edgeDialog) {
        useGraphStore.getState().updateRelation(edgeDialog.edgeId, { type, sortOrder })
      }
      setEdgeDialog(null)
    },
    [edgeDialog],
  )

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
    (e: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY, type: "pane" })
    },
    [],
  )

  const contextMenuItems = useMemo(() => {
    if (!contextMenu) return []
    switch (contextMenu.type) {
      case "node":
        return [
          {
            label: "Edit",
            action: () => {
              if (contextMenu.nodeId) {
                setNodes((nds) =>
                  nds.map((n) =>
                    n.id === contextMenu.nodeId
                      ? { ...n, data: { ...n.data, editTrigger: ((n.data.editTrigger as number) ?? 0) + 1 } }
                      : n,
                  ),
                )
              }
            },
          },
          {
            label: "Delete",
            action: () => {
              if (contextMenu.nodeId) {
                useGraphStore.getState().deleteEntity(contextMenu.nodeId)
              }
            },
          },
        ]
      case "edge":
        return [
          {
            label: "Edit Relation",
            action: () => {
              const rel = relations.find((r) => r.id === contextMenu.edgeId)
              if (rel) {
                setEdgeDialog({
                  edgeId: rel.id,
                  initialType: rel.type,
                  initialSortOrder: rel.sortOrder,
                })
              }
            },
          },
          {
            label: "Delete Edge",
            action: () => {
              if (contextMenu.edgeId) {
                useGraphStore.getState().removeRelation(contextMenu.edgeId)
              }
            },
          },
        ]
      case "pane":
        return [
          {
            label: "New Node",
            action: () => createNodeAtCenter(),
          },
        ]
    }
  }, [contextMenu, entities, relations, setNodes])

  const onCreateNode = useCallback(() => {
    createNodeAtCenter()
  }, [createNodeAtCenter])

  const onOpenFolder = useCallback(async () => {
    const fsa = getFSAccessInstance()
    const picked = await fsa.initFromPicker()
    if (!picked) return

    const existing = await fsa.loadWorkspace()
    if (existing) {
      setAdapter(fsa)
      await storeInit(fsa)
    } else {
      const state = useGraphStore.getState()
      const snapshot: GraphSnapshot = { version: 3, entities: state.entities, relations: state.relations }
      await fsa.saveGraph(snapshot)
      for (const entity of state.entities) {
        if (entity.kind === "container") {
          const content = state.getContent(entity.id)
          if (content) await fsa.saveDocument(entity.id, content).catch(() => {})
        }
      }
      setAdapter(fsa)
      refreshFolderName()
    }
  }, [storeInit, refreshFolderName])

  const onZoomIn = useCallback(() => reactFlowInstance.zoomIn(), [reactFlowInstance])
  const onZoomOut = useCallback(() => reactFlowInstance.zoomOut(), [reactFlowInstance])
  const onFitView = useCallback(() => reactFlowInstance.fitView(), [reactFlowInstance])

  const onRelayout = useCallback(() => {
    const { entities, relations } = useGraphStore.getState()
    const { nodes: relayouted, edges: relayoutedEdges } = getLayoutedElements({ entities, relations })
    setNodes(relayouted)
    setEdges(relayoutedEdges)
  }, [setNodes, setEdges])

  return (
    <ReactFlow
      nodeTypes={nodeTypes}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onEdgesDelete={onEdgesDelete}
      onBeforeDelete={onBeforeDelete}
      onNodesDelete={onNodesDelete}
      onEdgeDoubleClick={onEdgeDoubleClick}
      onNodeContextMenu={onNodeContextMenu}
      onEdgeContextMenu={onEdgeContextMenu}
      onPaneContextMenu={onPaneContextMenu}
      panOnDrag={false}
      panOnScroll={true}
      selectionOnDrag={true}
      selectionMode={SelectionMode.Partial}
      fitView
      snapToGrid
      snapGrid={[15, 15]}
      deleteKeyCode={["Backspace", "Delete"]}
      multiSelectionKeyCode="Shift"
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} />
      <MiniMap pannable zoomable position="bottom-right" />
      <Panel position="bottom-right" style={{ marginBottom: 8 }}>
        <ButtonGroup>
          <Button variant="outline" size="icon" aria-label="Zoom In" onClick={onZoomIn}>
            <ZoomIn data-icon />
          </Button>
          <Button variant="outline" size="icon" aria-label="Zoom Out" onClick={onZoomOut}>
            <ZoomOut data-icon />
          </Button>
          <Button variant="outline" size="icon" aria-label="Fit View" onClick={onFitView}>
            <Maximize data-icon />
          </Button>
        </ButtonGroup>
      </Panel>
      <Panel position="top-right">
        <ButtonGroup>
          <Button variant="outline" size="sm" onClick={onCreateNode}>
            New Node
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenFolder}>
            Open Folder
          </Button>
          <Button variant="outline" size="sm" onClick={onRelayout}>
            Re-layout
          </Button>
        </ButtonGroup>
      </Panel>
      <EdgeDialog
        open={edgeDialog !== null}
        initialType={edgeDialog?.initialType}
        initialSortOrder={edgeDialog?.initialSortOrder}
        onConfirm={handleEdgeDialogConfirm}
        onCancel={() => setEdgeDialog(null)}
      />
      <GraphContextMenu
        open={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={contextMenuItems}
        onClose={() => setContextMenu(null)}
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
