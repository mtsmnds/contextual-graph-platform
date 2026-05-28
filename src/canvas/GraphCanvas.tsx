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
  type NodeChange,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useGraphStore } from "../store/useGraphStore"
import { getFSAccessInstance, setAdapter } from "@/store/persistence"
import { getLayoutedElements } from "../engine/layout"
import type { EntityType, GraphSnapshot, CanvasData } from "../types/graph"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import ZoomControls from "./panels/ZoomControls"
import ViewLogger from "./panels/ViewLogger"
import GraphContextMenu from "./GraphContextMenu"
import AppSidebar from "./panels/AppSidebar"
import EntityNode from "./nodes/EntityNode"
import MetadataNode from "./nodes/MetadataNode"
import ContainerGroupNode from "./nodes/ContainerGroupNode"
import EdgeLabel from "./edges/EdgeLabel"

const nodeTypes = { entity: EntityNode, metadata: MetadataNode, containerGroup: ContainerGroupNode }
const edgeTypes = { edgelabel: EdgeLabel }

function nodeStyle(
  cd: { width?: number; height?: number },
  isContainer: boolean,
  fallbackWidth?: number,
) {
  return {
    width: fallbackWidth ?? cd.width ?? (isContainer ? 400 : 208),
    ...(cd.height != null ? { height: cd.height } : {}),
    ...(!isContainer && cd.height == null ? { minHeight: 32 } : {}),
  }
}

function GraphCanvasContent() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)

  const __experimentalNoDagre = true

  const layoutRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)
  if (layoutRef.current === null) {
    if (__experimentalNoDagre) {
      const nodes: Node[] = []

      for (const entity of entities) {
        const content = entity.content || entity.type || entity.id
        const saved = entity.canvasData
        const isContainer = entity.type === "container"
        const position: { x: number; y: number } = saved.x !== undefined && saved.y !== undefined
          ? { x: saved.x, y: saved.y }
          : { x: (nodes.length % 6) * 220 + 50, y: Math.floor(nodes.length / 6) * 120 + 50 }

        const node: Node = {
          id: entity.id,
          type: isContainer ? "containerGroup" : "entity",
          position,
          data: { content, type: entity.type, id: entity.id },
          style: nodeStyle(saved, isContainer),
        }

        if (entity.parentId) {
          node.parentId = entity.parentId
          node.extent = "parent"
          node.expandParent = true
        }

        nodes.push(node)
      }

      // Depth-first ordering: parents before children (handles multi-level nesting)
      {
        const depthCache = new Map<string, number>()
        function depthOf(id: string): number {
          const cached = depthCache.get(id)
          if (cached !== undefined) return cached
          const n = nodes.find((m) => m.id === id)
          if (!n?.parentId) { depthCache.set(id, 0); return 0 }
          const d = 1 + depthOf(n.parentId)
          depthCache.set(id, d)
          return d
        }
        nodes.sort((a, b) => depthOf(a.id) - depthOf(b.id))
      }
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
        const saved = entities.find((e) => e.id === n.id)?.canvasData
        if (saved && saved.x !== undefined) return { ...n, position: { x: saved.x, y: saved.y } }
        return n
      })
      layoutRef.current = { nodes, edges }
    }
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutRef.current.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutRef.current.edges)

  const keyboardMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keyboardMoveIdsRef = useRef<Set<string>>(new Set())

  const reactFlowInstance = useReactFlow()

  const featureFlags = useGraphStore((s) => s.featureFlags)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: "node" | "edge" | "pane"
    nodeId?: string
    edgeId?: string
  } | null>(null)

  const [visibleMetadataNodeIds, setVisibleMetadataNodeIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (__experimentalNoDagre) {
      setNodes((prev) => {
        const prevById = new Map(prev.map((n) => [n.id, n]))
        const merged = [...prev]
        const entityIdSet = new Set(entities.map((e) => e.id))

        for (const entity of entities) {
          const newContent = entity.content || entity.type || entity.id
          const existing = prevById.get(entity.id)
          if (existing) {
            const idx = merged.findIndex((n) => n.id === entity.id)
            if (idx === -1) continue

            const posChanged = existing.position.x !== entity.canvasData.x || existing.position.y !== entity.canvasData.y
            const contentChanged = existing.data.content !== newContent || existing.data.type !== entity.type
            const parentChanged = (existing.parentId ?? undefined) !== (entity.parentId ?? undefined)
            const typeChanged = existing.type !== (entity.type === "container" ? "containerGroup" : "entity")
            const w = entity.canvasData.width

            if (posChanged || contentChanged || parentChanged || typeChanged || w != null) {
              merged[idx] = {
                ...merged[idx],
                type: entity.type === "container" ? "containerGroup" : "entity",
                position: { x: entity.canvasData.x, y: entity.canvasData.y },
                data: { ...merged[idx].data, content: newContent, type: entity.type },
                parentId: entity.parentId ?? undefined,
                extent: entity.parentId ? "parent" : undefined,
                expandParent: entity.parentId ? true : undefined,
                style: { ...merged[idx].style, ...nodeStyle(entity.canvasData, entity.type === "container", (merged[idx].style as Record<string, unknown>)?.width as number | undefined) },
              }
            }
          } else {
            const position = { x: entity.canvasData.x, y: entity.canvasData.y }
            const isContainer = entity.type === "container"
            const newNode: Node = {
              id: entity.id,
              type: isContainer ? "containerGroup" : "entity",
              position,
              data: { content: newContent, type: entity.type, id: entity.id },
              style: nodeStyle(entity.canvasData, isContainer),
            }

            if (entity.parentId) {
              newNode.parentId = entity.parentId
              newNode.extent = "parent"
              newNode.expandParent = true
              // Insert after the parent node for correct ordering
              const parentIdx = merged.findIndex((n) => n.id === entity.parentId)
              if (parentIdx !== -1) {
                merged.splice(parentIdx + 1, 0, newNode)
              } else {
                merged.push(newNode)
              }
            } else {
              merged.push(newNode)
            }

            const pending = pendingNodeRef.current
            if (pending === entity.id) {
              pendingNodeRef.current = null
              newNode.data = { ...newNode.data, editTrigger: 1 }
            }

            continue
          }
        }

        for (let i = merged.length - 1; i >= 0; i--) {
          const n = merged[i]
          if ((n.type === "entity" || n.type === "containerGroup") && !entityIdSet.has(n.id) && !n.id.startsWith("__ghost_")) {
            merged.splice(i, 1)
          }
        }

        const metaNodeWidth = 260
        const metaEntityIds = new Set(visibleMetadataNodeIds)

        for (let i = merged.length - 1; i >= 0; i--) {
          const n = merged[i]
          if (n.type === "metadata" && n.data.entityId
            && (!metaEntityIds.has(n.data.entityId as string) || !entityIdSet.has(n.data.entityId as string))) {
            merged.splice(i, 1)
          }
        }

        for (const metaEntityId of metaEntityIds) {
          const metaId = `meta:${metaEntityId}`
          const metaExisting = prevById.get(metaId)
          const entityNode = prevById.get(metaEntityId) ?? merged.find((n) => n.id === metaEntityId)
          if (!entityNode) continue

          let metaPos: { x: number; y: number }
          if (metaExisting) {
            metaPos = metaExisting.position
          } else {
            metaPos = {
              x: entityNode.position.x - metaNodeWidth - 40,
              y: entityNode.position.y,
            }
          }

          if (metaExisting) {
            const idx = merged.findIndex((n) => n.id === metaId)
            if (idx !== -1) {
              merged[idx] = { ...merged[idx], position: metaPos }
            }
          } else {
            merged.push({
              id: metaId,
              type: "metadata",
              position: metaPos,
              data: { entityId: metaEntityId },
              style: { width: metaNodeWidth },
              selectable: false,
              draggable: true,
            })
          }
        }

        // Depth-first ordering: parents before children (handles multi-level nesting)
        const nodeDepthCache = new Map<string, number>()
        function getNodeDepth(id: string): number {
          const cached = nodeDepthCache.get(id)
          if (cached !== undefined) return cached
          const n = merged.find((m) => m.id === id)
          if (!n?.parentId) { nodeDepthCache.set(id, 0); return 0 }
          const depth = 1 + getNodeDepth(n.parentId)
          nodeDepthCache.set(id, depth)
          return depth
        }
        merged.sort((a, b) => getNodeDepth(a.id) - getNodeDepth(b.id))

        return merged
      })

      setEdges((prev) => {
        const prevById = new Map(prev.map((e) => [e.id, e]))
        const merged = [...prev]
        const relationIdSet = new Set(relations.map((r) => r.id))

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

        for (let i = merged.length - 1; i >= 0; i--) {
          const e = merged[i]
          if (!e.id?.startsWith("meta-edge:") && !relationIdSet.has(e.id)) {
            merged.splice(i, 1)
          }
        }

        const metaEdgeIds = new Set(visibleMetadataNodeIds)

        for (let i = merged.length - 1; i >= 0; i--) {
          const e = merged[i]
          if (e.id?.startsWith("meta-edge:")) {
            const entityId = e.id.slice("meta-edge:".length)
            if (!metaEdgeIds.has(entityId)) {
              merged.splice(i, 1)
            }
          }
        }

        for (const metaEntityId of metaEdgeIds) {
          const edgeId = `meta-edge:${metaEntityId}`
          if (!prevById.has(edgeId)) {
            merged.push({
              id: edgeId,
              source: metaEntityId,
              target: `meta:${metaEntityId}`,
              type: "smoothstep",
              selectable: false,
              interactionWidth: 0,
              className: "metadata-edge",
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
        const saved = entities.find((e) => e.id === dagreNode.id)?.canvasData
        const position = (saved && saved.x !== undefined) ? { x: saved.x, y: saved.y } : dagreNode.position

        const pending = pendingNodeRef.current
        if (pending && pending === dagreNode.id) {
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
  }, [entities, relations, setNodes, setEdges, visibleMetadataNodeIds])

  useEffect(() => {
    const dims: Record<string, CanvasData> = {}
    const currentStore = useGraphStore.getState()
    for (const node of nodes) {
      const entity = currentStore.entities.find((e) => e.id === node.id)
      if (!entity) continue
      if (entity.canvasData.width != null && entity.canvasData.height != null) continue
      const w = node.measured?.width ?? node.width
      const h = node.measured?.height ?? node.height
      if (w != null && h != null) {
        dims[node.id] = { x: entity.canvasData.x, y: entity.canvasData.y, width: w, height: h }
      }
    }
    if (Object.keys(dims).length > 0) {
      currentStore.applyMeasuredDimensions(dims)
    }
  }, [nodes])

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
      const s = useGraphStore.getState()
      s.beginBatch(`Delete ${edgesToDelete.length} edges`)
      for (const edge of edgesToDelete) {
        s.removeRelation(edge.id)
      }
      s.endBatch()
    },
    [],
  )

  const onBeforeDelete = useCallback(
    async () => true,
    [],
  )

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      const s = useGraphStore.getState()
      const count = deletedNodes.filter((n) => n.type === "entity" || n.type === "containerGroup").length
      s.beginBatch(`Delete ${count} nodes`)
      for (const node of deletedNodes) {
        s.deleteEntity(node.id)
      }
      setVisibleMetadataNodeIds((prev) => {
        const next = new Set(prev)
        for (const node of deletedNodes) {
          next.delete(node.id)
        }
        if (next.size === prev.size) return prev
        return next
      })
      s.endBatch()
    },
    [],
  )

  const pendingNodeRef = useRef<string | null>(null)

  const dragStateRef = useRef<{
    originals: Array<{
      id: string
      type: EntityType
      content: string
      metadata: Record<string, unknown>
      canvasData: CanvasData
      originalPosition: { x: number; y: number }
    }>
  } | null>(null)

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes)

    if (dragStateRef.current) return

    for (const change of changes) {
      if (change.type === "position" && !change.dragging) {
        keyboardMoveIdsRef.current.add(change.id)
      }
    }

    if (keyboardMoveIdsRef.current.size > 0) {
      if (keyboardMoveTimerRef.current) clearTimeout(keyboardMoveTimerRef.current)
      keyboardMoveTimerRef.current = setTimeout(() => {
        const s = useGraphStore.getState()
        const ids = new Set(keyboardMoveIdsRef.current)
        keyboardMoveIdsRef.current = new Set()

        if (ids.size > 0) {
          const allNodes = reactFlowInstance.getNodes()
          s.beginBatch(`Move ${ids.size} nodes`)
          for (const id of ids) {
            const node = allNodes.find((n) => n.id === id)
            if (!node) continue
            s.updateEntity(id, {
              canvasData: {
                x: node.position.x,
                y: node.position.y,
                width: node.measured?.width ?? node.width ?? undefined,
                height: node.measured?.height ?? node.height ?? undefined,
              },
            })
          }
          s.endBatch()
        }
      }, 300)
    }
  }, [onNodesChange, reactFlowInstance])

  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!_.metaKey) {
        dragStateRef.current = null
        return
      }

      const allNodes = reactFlowInstance.getNodes()
      const selectedIds = new Set(allNodes.filter((n) => n.selected).map((n) => n.id))
      selectedIds.add(node.id)

      const s = useGraphStore.getState()
      const originals = allNodes
        .filter((n) => selectedIds.has(n.id))
        .map((n) => {
          const entity = s.entities.find((e) => e.id === n.id)
          return {
            id: n.id,
            type: n.data.type as EntityType,
            content: n.data.content as string,
            metadata: (n.data.metadata as Record<string, unknown>) ?? {},
            canvasData: entity?.canvasData ?? { x: n.position.x, y: n.position.y },
            originalPosition: { ...n.position },
          }
        })

      dragStateRef.current = { originals }

      setNodes((prev) => [
        ...prev,
        ...originals.map((o) => ({
          id: `__ghost_${o.id}`,
          type: "entity" as const,
          position: o.originalPosition,
          data: { content: o.content, type: o.type, id: `__ghost_${o.id}` },
          style: { width: o.canvasData.width ?? 200 },
          className: "ghost-node",
          selectable: false,
        })),
      ])
    },
    [reactFlowInstance, setNodes],
  )

  const createNode = useCallback((position: { x: number; y: number }) => {
    const id = useGraphStore.getState().addEntity("concept", {
      canvasData: { x: position.x, y: position.y, height: 64 },
    })
    pendingNodeRef.current = id
  }, [])

  const createContainerNode = useCallback((position: { x: number; y: number }) => {
    const id = useGraphStore.getState().addEntity("container", {
      canvasData: { x: position.x, y: position.y, width: 400, height: 304 },
    })
    pendingNodeRef.current = id
  }, [])

  const createChildNode = useCallback((parentId: string, position: { x: number; y: number }) => {
    const id = useGraphStore.getState().addEntity("segment", {
      canvasData: { x: position.x, y: position.y, height: 64 },
    }, parentId)
    pendingNodeRef.current = id
  }, [])

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent) => {
      if (keyboardMoveTimerRef.current) {
        clearTimeout(keyboardMoveTimerRef.current)
        keyboardMoveTimerRef.current = null
      }
      keyboardMoveIdsRef.current = new Set()

      const allNodes = reactFlowInstance.getNodes()

      const dragState = dragStateRef.current
      if (dragState) {
        dragStateRef.current = null

        const ghostIds = new Set(dragState.originals.map((o) => `__ghost_${o.id}`))

        const s = useGraphStore.getState()
        s.beginBatch(`Duplicate ${dragState.originals.length} nodes`)

        for (const orig of dragState.originals) {
          const droppedNode = allNodes.find((n) => n.id === orig.id)
          if (!droppedNode) continue

          s.addEntity(orig.type, {
            content: orig.content,
            metadata: orig.metadata,
            canvasData: {
              x: droppedNode.position.x,
              y: droppedNode.position.y,
              width: orig.canvasData.width,
              height: orig.canvasData.height,
            },
          })

          s.updateEntity(orig.id, {
            canvasData: {
              x: orig.originalPosition.x,
              y: orig.originalPosition.y,
            },
          })
        }

        s.endBatch()

        setNodes((nds) =>
          nds
            .filter((n) => !ghostIds.has(n.id))
            .map((n) => {
              const orig = dragState.originals.find((o) => o.id === n.id)
              return orig ? { ...n, position: orig.originalPosition } : n
            }),
        )

        return
      }

      const s = useGraphStore.getState()
      const movedIds = allNodes
        .filter((n) => {
          const entity = s.entities.find((e) => e.id === n.id)
          if (!entity) return false
          return entity.canvasData.x !== n.position.x || entity.canvasData.y !== n.position.y
        })
        .map((n) => n.id)

      if (movedIds.length > 0) {
        s.beginBatch(`Move ${movedIds.length} nodes`)
        for (const id of movedIds) {
          const node = allNodes.find((n) => n.id === id)
          if (!node) continue
          s.updateEntity(id, {
            canvasData: {
              x: node.position.x,
              y: node.position.y,
              width: node.measured?.width ?? node.width ?? undefined,
              height: node.measured?.height ?? node.height ?? undefined,
            },
          })
        }
        s.endBatch()
      }

      // Drag-to-assign: check if any moved node landed in a container
      if (!featureFlags.dragToNest) return
      for (const node of allNodes) {
        if (node.type !== "entity" && node.type !== "containerGroup") continue
        const containerNodes = allNodes.filter((n) => n.type === "containerGroup")
        for (const container of containerNodes) {
          const cw = (container.measured?.width ?? container.width ?? 400) as number
          const ch = (container.measured?.height ?? container.height ?? 300) as number
          if (
            node.position.x >= container.position.x &&
            node.position.x <= container.position.x + cw &&
            node.position.y >= container.position.y &&
            node.position.y <= container.position.y + ch &&
            node.id !== container.id
          ) {
            const entity = s.entities.find((e) => e.id === node.id)
            // Only assign if not already a child of this container
            if (entity && entity.parentId !== container.id) {
              const relativeX = node.position.x - container.position.x
              const relativeY = node.position.y - container.position.y
              s.updateEntity(node.id, {
                parentId: container.id,
                canvasData: {
                  x: relativeX,
                  y: relativeY,
                  width: entity.canvasData.width,
                  height: entity.canvasData.height,
                },
              })
            }
            break
          }
        }
      }
    },
    [reactFlowInstance, setNodes],
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
      if (el.closest(".react-flow__edge-label")) return
      if (el.closest(".react-flow__edge")) return

      // Container child area: create child node (header stops its own propagation)
      const containerEl = el.closest<HTMLElement>(".react-flow__node-containerGroup")
      if (containerEl) {
        if (el.closest("header")) return
        const containerId = containerEl.getAttribute("data-id")
        if (!containerId) return
        const containerNode = reactFlowInstance.getNode(containerId)
        if (!containerNode) return
        const position = reactFlowInstance.screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        })
        const relativePos = {
          x: position.x - containerNode.position.x,
          y: position.y - containerNode.position.y,
        }
        createChildNode(containerId, relativePos)
        return
      }

      // Any other node: skip (handles its own double-click)
      if (el.closest(".react-flow__node")) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })
      createNode(position)
    }
    el.addEventListener("dblclick", handler, { capture: true })
    return () => el.removeEventListener("dblclick", handler, { capture: true })
  }, [reactFlowInstance, createNode])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) return

      const mod = e.metaKey || e.ctrlKey
      if (!mod || e.key.toLowerCase() !== "z") return

      e.preventDefault()
      if (e.shiftKey) {
        useGraphStore.getState().redo()
      } else {
        useGraphStore.getState().undo()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

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
    const toggleMetadata = (entityId: string) => {
      setVisibleMetadataNodeIds((prev) => {
        const next = new Set(prev)
        if (next.has(entityId)) {
          next.delete(entityId)
        } else {
          next.add(entityId)
        }
        return next
      })
    }
    switch (contextMenu.type) {
      case "node": {
        const node = contextMenu.nodeId
          ? nodes.find((n) => n.id === contextMenu.nodeId)
          : undefined
        const isContainer = node?.type === "containerGroup"
        const isChild = !!node?.parentId
        const items = []

        items.push({
          label: visibleMetadataNodeIds.has(contextMenu.nodeId!) ? "Metadata: Visible" : "Metadata: Hidden",
          action: () => {
            if (contextMenu.nodeId) toggleMetadata(contextMenu.nodeId)
          },
        })

        if (isContainer) {
          items.push({
            label: "Add Child Node",
            action: () => {
              if (contextMenu.nodeId) {
                const id = useGraphStore.getState().addEntity("segment", {
                  canvasData: { x: 16, y: 64, height: 64 },
                }, contextMenu.nodeId)
                pendingNodeRef.current = id
              }
            },
          })
          items.push({
            label: "Add Child Container",
            action: () => {
              if (contextMenu.nodeId) {
                const id = useGraphStore.getState().addEntity("container", {
                  canvasData: { x: 16, y: 128, width: 400, height: 304 },
                }, contextMenu.nodeId)
                pendingNodeRef.current = id
              }
            },
          })
        }

        if (isChild) {
          items.push({
            label: "Detach from Group",
            action: () => {
              if (contextMenu.nodeId) {
                const s = useGraphStore.getState()
                const entity = s.entities.find((e) => e.id === contextMenu.nodeId)
                const parentNode = entity?.parentId ? nodes.find((n) => n.id === entity.parentId) : undefined
                const absoluteX = (entity?.canvasData.x ?? 0) + (parentNode?.position.x ?? 0)
                const absoluteY = (entity?.canvasData.y ?? 0) + (parentNode?.position.y ?? 0)
                s.updateEntity(contextMenu.nodeId, {
                  parentId: undefined,
                  canvasData: {
                    x: absoluteX,
                    y: absoluteY,
                    width: entity?.canvasData.width,
                    height: entity?.canvasData.height,
                  },
                })
              }
            },
          })
        }

        items.push({
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
        })

        items.push({
          label: "Delete",
          action: () => {
            if (contextMenu.nodeId) {
              setVisibleMetadataNodeIds((prev) => {
                const next = new Set(prev)
                next.delete(contextMenu.nodeId!)
                return next
              })
              useGraphStore.getState().deleteEntity(contextMenu.nodeId)
            }
          },
        })

        return items
      }
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
          {
            label: "New Group",
            action: () => {
              const viewport = reactFlowInstance.screenToFlowPosition({
                x: contextMenu.x,
                y: contextMenu.y,
              })
              createContainerNode(viewport)
            },
          },
        ]
    }
  }, [contextMenu, setNodes, visibleMetadataNodeIds, nodes])

  const onZoomIn = useCallback(() => reactFlowInstance.zoomIn(), [reactFlowInstance])
  const onZoomOut = useCallback(() => reactFlowInstance.zoomOut(), [reactFlowInstance])
  const onFitView = useCallback(() => reactFlowInstance.fitView(), [reactFlowInstance])

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
      onNodesChange={handleNodesChange}
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
      snapGrid={[16, 16]}
      deleteKeyCode={["Backspace", "Delete"]}
      multiSelectionKeyCode="Shift"
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} />
      {featureFlags.minimap && (
        <MiniMap pannable zoomable position="bottom-right" style={{ margin: "0 8px 16px 0" }} />
      )}
      <Panel position="top-right" style={{ margin: "16px 8px" }}>
        <div className="flex items-center gap-2">
          {featureFlags.viewLogger && <ViewLogger />}
          <ZoomControls
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onFitView={onFitView}
            onZoom100={onZoom100}
          />
          <SidebarTrigger aria-label="Workspace menu" />
        </div>
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
  const storeInit = useGraphStore((s) => s.init)
  const refreshFolderName = useGraphStore((s) => s.refreshFolderName)

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
      const snapshot: GraphSnapshot = { version: 5, entities: state.entities, relations: state.relations, canvas: state.canvas }
      await fsa.saveGraph(snapshot)
      for (const entity of state.entities) {
        if (entity.type === "container") {
          const content = state.getContent(entity.id)
          if (content) await fsa.saveDocument(entity.id, content).catch(() => {})
        }
      }
      setAdapter(fsa)
      refreshFolderName()
    }
  }, [storeInit, refreshFolderName])

  return (
    <SidebarProvider>
      <div className="flex-1 min-w-0 min-h-0">
        <ReactFlowProvider>
          <GraphCanvasContent />
        </ReactFlowProvider>
      </div>
      <AppSidebar onOpenFolder={onOpenFolder} />
    </SidebarProvider>
  )
}

export default GraphCanvas
