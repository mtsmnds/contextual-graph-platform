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
import type { EntityKind, GraphSnapshot } from "../types/graph"
import { ZoomIn, ZoomOut, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import GraphContextMenu from "./GraphContextMenu"
import EntityNode from "./nodes/EntityNode"
import EdgeLabel from "./edges/EdgeLabel"

const nodeTypes = { entity: EntityNode }
const edgeTypes = { edgelabel: EdgeLabel }

function GraphCanvasContent() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)
  const savedPositions = useGraphStore((s) => s.canvas.positions)

  const __experimentalNoDagre = true

  const layoutRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)
  if (layoutRef.current === null) {
    if (__experimentalNoDagre) {
      const nodes: Node[] = entities.map((entity, idx) => {
        const content = entity.content || entity.kind || entity.id
        const saved = savedPositions[entity.id]
        let position: { x: number; y: number }
        if (saved) {
          position = saved
        } else {
          console.warn(`[layout] No saved position for "${entity.id}" — applying fallback`)
          position = { x: (idx % 6) * 220 + 50, y: Math.floor(idx / 6) * 120 + 50 }
        }
        return {
          id: entity.id,
          type: "entity",
          position,
          data: { content, kind: entity.kind, id: entity.id },
          style: { width: 200 },
        }
      })
      const edges: Edge[] = relations.map((rel) => ({
        id: rel.id,
        source: rel.source,
        target: rel.target,
        sourceHandle: rel.metadata?.sourceHandle as string | undefined,
        targetHandle: rel.metadata?.targetHandle as string | undefined,
        label: rel.type,
        type: "edgelabel",
      }))
      layoutRef.current = { nodes, edges }
    } else {
      const { nodes: dagreNodes, edges } = getLayoutedElements({ entities, relations })
      const nodes = dagreNodes.map((n) => {
        const saved = savedPositions[n.id]
        return saved ? { ...n, position: saved } : n
      })
      layoutRef.current = { nodes, edges }
    }
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutRef.current.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutRef.current.edges)

  const reactFlowInstance = useReactFlow()
  const storeInit = useGraphStore((s) => s.init)
  const refreshFolderName = useGraphStore((s) => s.refreshFolderName)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: "node" | "edge" | "pane"
    nodeId?: string
    edgeId?: string
  } | null>(null)

  useEffect(() => {
    const positions = useGraphStore.getState().canvas.positions

    if (__experimentalNoDagre) {
      setNodes((prev) => {
        const prevById = new Map(prev.map((n) => [n.id, n]))
        const merged = [...prev]

        for (const entity of entities) {
          if (!prevById.has(entity.id)) {
            const content = entity.content || entity.kind || entity.id
            const saved = positions[entity.id]
            let position: { x: number; y: number }
            if (saved) {
              position = saved
            } else {
              console.warn(`[layout] No saved position for new entity "${entity.id}" — applying fallback`)
              position = { x: merged.length * 30, y: merged.length * 30 }
            }
            const newNode: Node = {
              id: entity.id,
              type: "entity",
              position,
              data: { content, kind: entity.kind, id: entity.id },
              style: { width: 200 },
            }

            const pending = pendingNodeRef.current
            if (pending && pending.id === entity.id) {
              pendingNodeRef.current = null
              newNode.data = { ...newNode.data, editTrigger: 1 }
            }

            merged.push(newNode)
          }
        }

        return merged
      })

      setEdges((prev) => {
        const prevById = new Map(prev.map((e) => [e.id, e]))
        const merged = [...prev]

        for (const rel of relations) {
          if (!prevById.has(rel.id)) {
            merged.push({
              id: rel.id,
              source: rel.source,
              target: rel.target,
              sourceHandle: rel.metadata?.sourceHandle as string | undefined,
              targetHandle: rel.metadata?.targetHandle as string | undefined,
              label: rel.type,
              type: "edgelabel",
            })
          }
        }

        return merged
      })

      return
    }

    const { nodes: dagreNodes, edges: dagreEdges } = getLayoutedElements({ entities, relations })

    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]))
      const merged: Node[] = []

      for (const dagreNode of dagreNodes) {
        const existing = prevById.get(dagreNode.id)
        const saved = positions[dagreNode.id]
        const position = saved ?? dagreNode.position

        const pending = pendingNodeRef.current
        if (pending && pending.id === dagreNode.id) {
          pendingNodeRef.current = null
          merged.push({ ...dagreNode, position, data: { ...dagreNode.data, editTrigger: 1 } })
        } else if (existing) {
          merged.push({ ...existing, position, data: { ...existing.data, ...dagreNode.data } })
        } else {
          merged.push({ ...dagreNode, position, data: dagreNode.data })
        }
      }

      return merged
    })

    setEdges((prev) => {
      const prevById = new Map(prev.map((e) => [e.id, e]))
      const merged: Edge[] = []

      for (const dagreEdge of dagreEdges) {
        const existing = prevById.get(dagreEdge.id)
        if (existing) {
          merged.push({ ...existing, label: dagreEdge.label, data: dagreEdge.data })
        } else {
          merged.push(dagreEdge)
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

  const setCanvasPositions = useGraphStore((s) => s.setCanvasPositions)

  const pendingNodeRef = useRef<{ id: string; position: { x: number; y: number } } | null>(null)

  const dragStateRef = useRef<{
    originals: Array<{
      id: string
      kind: EntityKind
      content: string
      metadata: Record<string, unknown>
      originalPosition: { x: number; y: number }
    }>
  } | null>(null)

  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!_.metaKey) {
        dragStateRef.current = null
        return
      }

      const allNodes = reactFlowInstance.getNodes()
      const selectedIds = new Set(allNodes.filter((n) => n.selected).map((n) => n.id))
      selectedIds.add(node.id)

      const originals = allNodes
        .filter((n) => selectedIds.has(n.id))
        .map((n) => ({
          id: n.id,
          kind: n.data.kind as EntityKind,
          content: n.data.content as string,
          metadata: (n.data.metadata as Record<string, unknown>) ?? {},
          originalPosition: { ...n.position },
        }))

      dragStateRef.current = { originals }

      setNodes((prev) => [
        ...prev,
        ...originals.map((o) => ({
          id: `__ghost_${o.id}`,
          type: "entity" as const,
          position: o.originalPosition,
          data: { content: o.content, kind: o.kind, id: `__ghost_${o.id}` },
          style: { width: 200 },
          className: "ghost-node",
          selectable: false,
        })),
      ])
    },
    [reactFlowInstance, setNodes],
  )

  const createNode = useCallback((position: { x: number; y: number }) => {
    const id = useGraphStore.getState().addEntity("concept")
    pendingNodeRef.current = { id, position }
    useGraphStore.getState().setNodePosition(id, position)
  }, [])

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent) => {
      const allNodes = reactFlowInstance.getNodes()

      const dragState = dragStateRef.current
      if (dragState) {
        dragStateRef.current = null

        const ghostIds = new Set(dragState.originals.map((o) => `__ghost_${o.id}`))

        const store = useGraphStore.getState()
        const positions = { ...store.canvas.positions }

        for (const orig of dragState.originals) {
          const droppedNode = allNodes.find((n) => n.id === orig.id)
          if (!droppedNode) continue

          const cloneId = store.addEntity(orig.kind, { content: orig.content, metadata: orig.metadata })
          store.setNodePosition(cloneId, droppedNode.position)
          positions[cloneId] = droppedNode.position

          store.setNodePosition(orig.id, orig.originalPosition)
          positions[orig.id] = orig.originalPosition
        }

        setNodes((nds) =>
          nds
            .filter((n) => !ghostIds.has(n.id))
            .map((n) => {
              const orig = dragState.originals.find((o) => o.id === n.id)
              return orig ? { ...n, position: orig.originalPosition } : n
            }),
        )

        setCanvasPositions(positions)
        return
      }

      const positions: Record<string, { x: number; y: number }> = {}
      for (const n of allNodes) {
        positions[n.id] = n.position
      }
      setCanvasPositions(positions)
    },
    [reactFlowInstance, setCanvasPositions, setNodes],
  )

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
      const el = e.target as HTMLElement
      if (el.closest(".react-flow__node")) return
      if (el.closest(".react-flow__edge-label")) return
      if (el.closest(".react-flow__edge")) return
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })
      createNode(position)
    }
    el.addEventListener("dblclick", handler, { capture: true })
    return () => el.removeEventListener("dblclick", handler, { capture: true })
  }, [reactFlowInstance, createNode])

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
      const snapshot: GraphSnapshot = { version: 4, entities: state.entities, relations: state.relations, canvas: state.canvas }
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

  const __experimentalReLayout = false

  const onRelayout = useCallback(() => {
    const { entities, relations } = useGraphStore.getState()
    const { nodes: relayouted, edges: relayoutedEdges } = getLayoutedElements({ entities, relations })
    const dagrePositions = Object.fromEntries(relayouted.map((n) => [n.id, n.position]))
    useGraphStore.getState().replaceCanvasPositions(dagrePositions)
    setNodes(relayouted)
    setEdges(relayoutedEdges)
  }, [setNodes, setEdges])

  const hydrated = useGraphStore((s) => s.hydrated)
  const savedViewport = useGraphStore((s) => s.canvas.viewport)
  const setViewport = useGraphStore((s) => s.setViewport)

  const transform = useStore((s: { transform: [number, number, number] }) => s.transform)
  const [x, y, zoom] = transform

  const viewportRestoredRef = useRef(false)
  useEffect(() => {
    if (!hydrated || viewportRestoredRef.current) return
    viewportRestoredRef.current = true

    if (savedViewport) {
      reactFlowInstance.setViewport(savedViewport)
    } else {
      reactFlowInstance.fitView({ maxZoom: 1 })
    }
  }, [hydrated, savedViewport, reactFlowInstance])

  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!viewportRestoredRef.current) return
    if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current)
    viewportTimerRef.current = setTimeout(() => {
      setViewport({ x, y, zoom })
    }, 500)
    return () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current)
    }
  }, [x, y, zoom, setViewport])

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
      onNodeDragStart={onNodeDragStart}
      onNodeDragStop={onNodeDragStop}
      edgeTypes={edgeTypes}
      onNodeContextMenu={onNodeContextMenu}
      onEdgeContextMenu={onEdgeContextMenu}
      onPaneContextMenu={onPaneContextMenu}
      ref={flowRef}
      zoomOnDoubleClick={false}
      panOnDrag={false}
      panOnScroll={true}
      selectionOnDrag={true}
      selectionMode={SelectionMode.Partial}
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
          {__experimentalReLayout && (
            <Button variant="outline" size="sm" onClick={onRelayout}>
              Re-layout
            </Button>
          )}
        </ButtonGroup>
      </Panel>
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
