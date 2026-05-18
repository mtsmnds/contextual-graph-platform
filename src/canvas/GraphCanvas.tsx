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
  useStore,
  BackgroundVariant,
  ConnectionMode,
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
          merged.push({ ...existing, data: { ...existing.data, ...layoutedNode.data } })
        } else {
          const pending = pendingNodeRef.current
          if (pending && pending.id === id) {
            merged.push({ ...layoutedNode, position: pending.position, data: { ...layoutedNode.data, editTrigger: 1 } })
          } else {
            merged.push(layoutedNode)
          }
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
        {
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
        },
      )
    },
    [],
  )

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => connection.source !== connection.target,
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

  const pendingNodeRef = useRef<{ id: string; position: { x: number; y: number } } | null>(null)

  const createNode = useCallback((position: { x: number; y: number }) => {
    const id = useGraphStore.getState().addEntity("concept")
    pendingNodeRef.current = { id, position }
  }, [])

  const createNodeAtCenter = useCallback(() => {
    const viewport = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })
    createNode(viewport)
  }, [reactFlowInstance, createNode])

  const flowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = flowRef.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".react-flow__node")) return
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })
      createNode(position)
    }
    el.addEventListener("dblclick", handler, { capture: true })
    return () => el.removeEventListener("dblclick", handler, { capture: true })
  }, [reactFlowInstance, createNode])

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

  const VIEWPORT_KEY = "react-roadmap:viewport"

  const transform = useStore((s: { transform: [number, number, number] }) => s.transform)
  const [x, y, zoom] = transform

  const restoredViewportRef = useRef(false)
  useEffect(() => {
    if (restoredViewportRef.current) return
    restoredViewportRef.current = true
    const stored = localStorage.getItem(VIEWPORT_KEY)
    if (stored) {
      try {
        const vp = JSON.parse(stored) as { x: number; y: number; zoom: number }
        reactFlowInstance.setViewport(vp)
      } catch (e) {
        console.error("Failed to restore viewport:", e)
      }
    }
  }, [reactFlowInstance])

  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!restoredViewportRef.current) return
    if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current)
    viewportTimerRef.current = setTimeout(() => {
      localStorage.setItem(VIEWPORT_KEY, JSON.stringify({ x, y, zoom }))
    }, 500)
    return () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current)
    }
  }, [x, y, zoom])

  const onZoom100 = useCallback(() => {
    reactFlowInstance.zoomTo(1)
  }, [reactFlowInstance])

  return (
    <ReactFlow
      nodeTypes={nodeTypes}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={isValidConnection}
      onEdgesDelete={onEdgesDelete}
      onBeforeDelete={onBeforeDelete}
      onNodesDelete={onNodesDelete}
      onEdgeDoubleClick={onEdgeDoubleClick}
      onNodeContextMenu={onNodeContextMenu}
      onEdgeContextMenu={onEdgeContextMenu}
      onPaneContextMenu={onPaneContextMenu}
      ref={flowRef}
      zoomOnDoubleClick={false}
      panOnDrag={false}
      panOnScroll={true}
      selectionOnDrag={true}
      selectionMode={SelectionMode.Partial}
      fitView
      fitViewOptions={{ maxZoom: 1 }}
      connectionMode={ConnectionMode.Loose}
      snapToGrid
      snapGrid={[15, 15]}
      deleteKeyCode={["Backspace", "Delete"]}
      multiSelectionKeyCode="Shift"
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} />
      <MiniMap pannable zoomable position="bottom-right" />
      <Panel position="bottom-right" style={{ marginBottom: 8 }}>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground/60">
            x: {x.toFixed(1)} y: {y.toFixed(1)} z: {Math.round(zoom * 100)}%
          </span>
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
            <Button variant="outline" size="icon" aria-label="Zoom to 100%" onClick={onZoom100}>
              <span className="text-xs font-semibold tabular-nums">1:1</span>
            </Button>
          </ButtonGroup>
        </div>
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
