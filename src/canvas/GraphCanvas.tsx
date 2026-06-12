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
  useStoreApi,
  useOnSelectionChange,
  BackgroundVariant,
  ConnectionMode,
  SelectionMode,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { generateKeyBetween } from "fractional-indexing-jittered"
import { useGraphStore } from "../store/useGraphStore"
import { FSAdapter, FSError } from "@/store/persistence"
import { getParentId, compareSortOrder, getCollapsedDescendants } from "../engine/queries"
import { getLayoutedElements, runFullLayout, DEFAULT_LAYOUT_OPTIONS, DEFAULT_NODE_WIDTH, stackChildren } from "../engine/layout"
import type { LayoutOptions, StackInput } from "../engine/layout"
import type { EntityType, GraphSnapshot, CanvasData } from "../types/graph"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { IconButton } from "@/components/ui/icon-button"
import { ButtonGroup } from "@/components/ui/button-group"
import ZoomControls from "./panels/ZoomControls"
import ViewLogger from "./panels/ViewLogger"
import { ArrowUUpLeft, ArrowUUpRight } from "@phosphor-icons/react"
import GraphContextMenu from "./GraphContextMenu"
import { EntityFormDialog } from "@/components/entity-form/EntityFormDialog"
import AppSidebar from "./panels/AppSidebar"
import EntityNode from "./nodes/EntityNode"
import MetadataNode from "./nodes/MetadataNode"
import ContainerGroupNode from "./nodes/ContainerGroupNode"
import EdgeLabel from "./edges/EdgeLabel"

const nodeTypes = { entity: EntityNode, metadata: MetadataNode, containerGroup: ContainerGroupNode }
const edgeTypes = { edgelabel: EdgeLabel }

const COLLAPSED_HEADER_HEIGHT = 48

function nodeStyle(
  cd: { width?: number; height?: number },
  isContainer: boolean,
) {
  return {
    width: cd.width ?? (isContainer ? 400 : DEFAULT_NODE_WIDTH.segment),
    ...(cd.height != null ? { height: cd.height } : {}),
    ...(!isContainer && cd.height == null ? { minHeight: 32 } : {}),
  }
}

// Direct DOM dimension sync for programmatic node resizes.
// React Flow v12's NodeWrapper memo prevents re-renders when node.width/style
// change via setNodes. Direct DOM manipulation triggers the native ResizeObserver
// → updateNodeInternals pipeline, the same mechanism NodeResizeControl uses.
//
// INVARIANT: Any code that programmatically changes a node's width or height
// MUST call this after the store update. The store handles persistence; this
// handles visual rendering. Do NOT try to set dimensions via setNodes alone
// (node.width, node.height, node.style) — those paths are blocked by the
// NodeWrapper memo and will not reach the DOM.
function syncNodeDimensions(nodeId: string, width: number, height: number) {
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement | null
    if (el) {
      el.style.width = `${width}px`
      el.style.height = `${height}px`
    }
  })
}

function GraphCanvasContent({ onFitViewRef: fitViewRefProp }: { onFitViewRef: React.MutableRefObject<() => void> }) {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)

  const autoLayout = useGraphStore((s) => s.featureFlags.autoLayout)
  const collapsedContainers = useGraphStore((s) => s.canvas.collapsedContainers)

  const prevAutoLayoutRef = useRef(autoLayout)
  const layoutRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)
  if (prevAutoLayoutRef.current !== autoLayout) {
    prevAutoLayoutRef.current = autoLayout
    layoutRef.current = null
  }
  if (layoutRef.current === null) {
    const hiddenNodeIds = getCollapsedDescendants(collapsedContainers, relations)
    if (autoLayout) {
      const { nodes, edges } = getLayoutedElements({ entities, relations, options: DEFAULT_LAYOUT_OPTIONS })
      for (const node of nodes) {
        if (hiddenNodeIds.has(node.id)) {
          node.hidden = true
        }
        if (collapsedContainers.includes(node.id) && node.type === "containerGroup") {
          node.style = { ...node.style as Record<string, unknown>, height: COLLAPSED_HEADER_HEIGHT }
        }
        if (node.parentId && collapsedContainers.includes(node.parentId)) {
          node.expandParent = undefined
        }
      }
      for (const edge of edges) {
        if (hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target)) {
          edge.hidden = true
        }
      }
      layoutRef.current = { nodes, edges }
    } else {
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
          hidden: hiddenNodeIds.has(entity.id),
          position,
          data: { content, type: entity.type, id: entity.id },
          style: nodeStyle(saved, isContainer),
        }

        if (collapsedContainers.includes(entity.id) && isContainer) {
          node.style = { ...node.style, height: COLLAPSED_HEADER_HEIGHT }
        }

        const containsParentId = getParentId({ relations }, entity.id)
        if (containsParentId) {
          node.parentId = containsParentId
          node.extent = "parent"
          node.expandParent = collapsedContainers.includes(containsParentId) ? undefined : true
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
      const edges: Edge[] = relations.filter((r) => r.type !== "contains").map((rel) => ({
        id: rel.id,
        source: rel.source,
        target: rel.target,
        hidden: hiddenNodeIds.has(rel.source) || hiddenNodeIds.has(rel.target),
        sourceHandle: rel.metadata?.sourceHandle as string | undefined,
        targetHandle: rel.metadata?.targetHandle as string | undefined,
        label: rel.type,
        type: "edgelabel",
      }))
      layoutRef.current = { nodes, edges }
    }
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutRef.current.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutRef.current.edges)

  const keyboardMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keyboardMoveIdsRef = useRef<Set<string>>(new Set())

  const reactFlowInstance = useReactFlow()
  const storeApi = useStoreApi()

  const featureFlags = useGraphStore((s) => s.featureFlags)

  useEffect(() => {
    fitViewRefProp.current = () => reactFlowInstance.fitView({ duration: 200 })
  }, [reactFlowInstance, fitViewRefProp])

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: "node" | "edge" | "pane"
    nodeId?: string
    edgeId?: string
  } | null>(null)

  const [visibleMetadataNodeIds, setVisibleMetadataNodeIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Capture current container dims from RF node state BEFORE any setNodes
    // calls. RF's NodeWrapper memo blocks dimension changes through setNodes
    // (style/width/height don't reach the DOM). We compare these stale dims
    // against the entity canvasData after both branches below, and force a
    // DOM sync via syncNodeDimensions when they differ.
    // This covers undo/redo in both autoLayout and non-autoLayout modes.
    const prevDims = new Map<string, { w: number; h: number | undefined }>()
    for (const n of nodes) {
      if (n.type === "containerGroup") {
        prevDims.set(n.id, {
          w: Number(n.style?.width ?? 400),
          h: n.style?.height != null ? Number(n.style.height) : undefined,
        })
      }
    }

    const hiddenNodeIds = getCollapsedDescendants(collapsedContainers, relations)

    if (!autoLayout) {
      const pendingId = pendingNodeRef.current
      pendingNodeRef.current = null

      setNodes((prev) => {
        const prevById = new Map(prev.map((n) => [n.id, n]))
        const merged = [...prev]
        const entityIdSet = new Set(entities.map((e) => e.id))

        for (const entity of entities) {
          const newContent = entity.content || entity.type || entity.id
          const existing = prevById.get(entity.id)
          const derivedParentId = getParentId({ relations }, entity.id)
          if (existing) {
            const idx = merged.findIndex((n) => n.id === entity.id)
            if (idx === -1) continue

            const posChanged = existing.position.x !== entity.canvasData.x || existing.position.y !== entity.canvasData.y
            const contentChanged = existing.data.content !== newContent || existing.data.type !== entity.type
            const parentChanged = (existing.parentId ?? undefined) !== (derivedParentId ?? undefined)
            const typeChanged = existing.type !== (entity.type === "container" ? "containerGroup" : "entity")
            const w = entity.canvasData.width

            if (posChanged || contentChanged || parentChanged || typeChanged || w != null) {
              const isContainer = entity.type === "container"
              merged[idx] = {
                ...merged[idx],
                type: isContainer ? "containerGroup" : "entity",
                hidden: hiddenNodeIds.has(entity.id),
                position: { x: entity.canvasData.x, y: entity.canvasData.y },
                data: { ...merged[idx].data, content: newContent, type: entity.type },
                parentId: derivedParentId ?? undefined,
                extent: derivedParentId ? "parent" : undefined,
                expandParent: derivedParentId && !collapsedContainers.includes(derivedParentId) ? true : undefined,
                style: { ...merged[idx].style, ...nodeStyle(entity.canvasData, isContainer) },
              }
              if (collapsedContainers.includes(entity.id) && isContainer) {
                merged[idx].style = { ...merged[idx].style as Record<string, unknown>, height: COLLAPSED_HEADER_HEIGHT }
              }
            }
          } else {
            const position = { x: entity.canvasData.x, y: entity.canvasData.y }
            const isContainer = entity.type === "container"
            const newNode: Node = {
              id: entity.id,
              type: isContainer ? "containerGroup" : "entity",
              hidden: hiddenNodeIds.has(entity.id),
              position,
              data: { content: newContent, type: entity.type, id: entity.id },
              style: nodeStyle(entity.canvasData, isContainer),
            }

            if (collapsedContainers.includes(entity.id) && isContainer) {
              newNode.style = { ...newNode.style, height: COLLAPSED_HEADER_HEIGHT }
            }

            if (derivedParentId) {
              newNode.parentId = derivedParentId
              newNode.extent = "parent"
              newNode.expandParent = collapsedContainers.includes(derivedParentId) ? undefined : true
              const parentIdx = merged.findIndex((n) => n.id === derivedParentId)
              if (parentIdx !== -1) {
                merged.splice(parentIdx + 1, 0, newNode)
              } else {
                merged.push(newNode)
              }
            } else {
              merged.push(newNode)
            }

            if (pendingId === entity.id) {
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
          if (rel.type === "contains") continue
          if (!prevById.has(rel.id)) {
            merged.push({
              id: rel.id,
              source: rel.source,
              target: rel.target,
              hidden: hiddenNodeIds.has(rel.source) || hiddenNodeIds.has(rel.target),
              sourceHandle: rel.metadata?.sourceHandle as string | undefined,
              targetHandle: rel.metadata?.targetHandle as string | undefined,
              label: rel.type,
              type: "edgelabel",
            })
          }
        }

        // Sync hidden state on existing edges from collapse changes
        for (let i = 0; i < merged.length; i++) {
          const e = merged[i]
          if (e.id?.startsWith("meta-edge:")) continue
          const shouldHide = hiddenNodeIds.has(e.source) || hiddenNodeIds.has(e.target)
          if (e.hidden !== shouldHide) {
            merged[i] = { ...e, hidden: shouldHide }
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

      if (pendingId) {
        setTimeout(() => storeApi.getState().addSelectedNodes([pendingId]), 0)
      }
    } else {
      const { nodes: dagreNodes, edges: dagreEdges } = getLayoutedElements({ entities, relations, options: DEFAULT_LAYOUT_OPTIONS })

      const dagrePendingId = pendingNodeRef.current
      setNodes((prev) => {
        const prevById = new Map(prev.map((n) => [n.id, n]))
        const merged: Node[] = []

        for (const dagreNode of dagreNodes) {
          const existing = prevById.get(dagreNode.id)
          const saved = entities.find((e) => e.id === dagreNode.id)?.canvasData
          const position = (saved && saved.x !== undefined) ? { x: saved.x, y: saved.y } : dagreNode.position
          const isContainer = dagreNode.type === "containerGroup"
          const dagreHidden = hiddenNodeIds.has(dagreNode.id)
          const collapsedHeight = collapsedContainers.includes(dagreNode.id) && isContainer ? COLLAPSED_HEADER_HEIGHT : undefined

          let n: Node
          const pending = pendingNodeRef.current
          if (pending && pending === dagreNode.id) {
            pendingNodeRef.current = null
            n = { ...dagreNode, position, hidden: dagreHidden, data: { ...dagreNode.data, editTrigger: 1 } }
          } else if (existing) {
            n = { ...existing, position, hidden: dagreHidden, data: { ...existing.data, ...dagreNode.data } }
          } else {
            n = { ...dagreNode, position, hidden: dagreHidden, data: dagreNode.data }
          }

          if (collapsedHeight != null) {
            n.style = { ...(n.style as Record<string, unknown> ?? {}), height: collapsedHeight }
          }
          if (dagreNode.parentId && collapsedContainers.includes(dagreNode.parentId)) {
            n.expandParent = undefined
          }
          merged.push(n)
        }

        return merged
      })

      setEdges((prev) => {
        const prevById = new Map(prev.map((e) => [e.id, e]))
        const merged: Edge[] = []

        for (const dagreEdge of dagreEdges) {
          const existing = prevById.get(dagreEdge.id)
          const dagreHidden = hiddenNodeIds.has(dagreEdge.source) || hiddenNodeIds.has(dagreEdge.target)
          if (existing) {
            merged.push({ ...existing, label: dagreEdge.label, data: dagreEdge.data, hidden: dagreHidden })
          } else {
            merged.push({ ...dagreEdge, hidden: dagreHidden })
          }
        }

        return merged
      })

      if (dagrePendingId) {
        storeApi.getState().addSelectedNodes([dagrePendingId])
      }
    }

    // Post-loop: sync DOM dimensions for containers whose entity dimensions
    // differ from the RF node state captured above. This covers undo, redo,
    // and any other entity restore in both autoLayout and non-autoLayout modes.
    for (const entity of entities) {
      if (entity.type !== "container") continue
      const prev = prevDims.get(entity.id)
      if (!prev) continue
      const targetHeight = collapsedContainers.includes(entity.id)
        ? COLLAPSED_HEADER_HEIGHT
        : entity.canvasData.height
      if (prev.w !== entity.canvasData.width || prev.h !== targetHeight) {
        const w = entity.canvasData.width
        requestAnimationFrame(() => syncNodeDimensions(entity.id, w, targetHeight))
      }
    }
  }, [entities, relations, setNodes, setEdges, visibleMetadataNodeIds, autoLayout, collapsedContainers])

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
                width: node.measured?.width ?? node.width ?? 368,
                height: node.measured?.height ?? node.height ?? 64,
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
            canvasData: entity?.canvasData ?? { x: n.position.x, y: n.position.y, width: 368, height: 64 },
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
          style: { width: o.canvasData.width },
          className: "ghost-node",
          selectable: false,
        })),
      ])
    },
    [reactFlowInstance, setNodes],
  )

  const createNode = useCallback((position: { x: number; y: number }) => {
    const id = useGraphStore.getState().addEntity("concept", {
      canvasData: { x: position.x, y: position.y, width: DEFAULT_NODE_WIDTH.concept, height: 64 },
    })
    pendingNodeRef.current = id
    useGraphStore.getState().setSelectedNode(id)
  }, [])

  const createContainerNode = useCallback((position: { x: number; y: number }) => {
    const id = useGraphStore.getState().addEntity("container", {
      canvasData: { x: position.x, y: position.y, width: 400, height: 304 },
    })
    pendingNodeRef.current = id
    useGraphStore.getState().setSelectedNode(id)
  }, [])

  const createChildNode = useCallback((parentId: string, position: { x: number; y: number }) => {
    const id = useGraphStore.getState().addEntity("segment", {
      canvasData: { x: position.x, y: position.y, width: DEFAULT_NODE_WIDTH.segment, height: 64 },
    }, parentId)
    pendingNodeRef.current = id
    useGraphStore.getState().setSelectedNode(id)
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
              width: orig.canvasData.width,
              height: orig.canvasData.height,
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
              width: node.measured?.width ?? node.width ?? 368,
              height: node.measured?.height ?? node.height ?? 64,
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
            const currentParentId = getParentId({ relations: s.relations }, node.id)
            // Only assign if not already a child of this container
            if (entity && currentParentId !== container.id) {
              // Remove old contains edge if moving from another parent
              const oldParentRel = s.relations.find(
                (r) => r.target === node.id && r.type === "contains",
              )
              if (oldParentRel) s.removeRelation(oldParentRel.id)

              const relativeX = node.position.x - container.position.x
              const relativeY = node.position.y - container.position.y
              s.addRelation(container.id, node.id, "contains", {
                sortOrder: generateKeyBetween(null, null),
              })
              s.updateEntity(node.id, {
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
                const flowPos = reactFlowInstance.screenToFlowPosition({ x: contextMenu.x, y: contextMenu.y })
                const parentNode = nodes.find((n) => n.id === contextMenu.nodeId)
                if (!parentNode) return
                const grid = 16
                const relativePos = {
                  x: Math.round((flowPos.x - parentNode.position.x) / grid) * grid,
                  y: Math.round((flowPos.y - parentNode.position.y) / grid) * grid,
                }
                const id = useGraphStore.getState().addEntity("segment", {
                  canvasData: { x: relativePos.x, y: relativePos.y, width: DEFAULT_NODE_WIDTH.segment, height: 64 },
                }, contextMenu.nodeId)
                pendingNodeRef.current = id
                useGraphStore.getState().setSelectedNode(id)
              }
            },
          })
          items.push({
            label: "Add Child Container",
            action: () => {
              if (contextMenu.nodeId) {
                const flowPos = reactFlowInstance.screenToFlowPosition({ x: contextMenu.x, y: contextMenu.y })
                const parentNode = nodes.find((n) => n.id === contextMenu.nodeId)
                if (!parentNode) return
                const grid = 16
                const relativePos = {
                  x: Math.round((flowPos.x - parentNode.position.x) / grid) * grid,
                  y: Math.round((flowPos.y - parentNode.position.y) / grid) * grid,
                }
                const id = useGraphStore.getState().addEntity("container", {
                  canvasData: { x: relativePos.x, y: relativePos.y, width: 400, height: 304 },
                }, contextMenu.nodeId)
                pendingNodeRef.current = id
                useGraphStore.getState().setSelectedNode(id)
              }
            },
          })
          items.push({
            label: "Stack Children",
            disabled: !featureFlags.autoLayout,
            action: () => {
              if (contextMenu.nodeId) {
                const s = useGraphStore.getState()
                const childRelations = s.relations
                  .filter((r) => r.source === contextMenu.nodeId && r.type === "contains")
                  .sort((a, b) => compareSortOrder(a.sortOrder, b.sortOrder))
                if (childRelations.length === 0) return

                const children: StackInput[] = []
                const childMap = new Map<string, { width: number; height: number }>()
                for (const rel of childRelations) {
                  const entity = s.entities.find((e) => e.id === rel.target)
                  if (!entity) continue
                  childMap.set(rel.target, { width: entity.canvasData.width, height: entity.canvasData.height })
                  children.push({
                    id: rel.target,
                    width: entity.canvasData.width,
                    height: entity.canvasData.height,
                    sortOrder: rel.sortOrder,
                  })
                }

                const containerEntity = s.entities.find((e) => e.id === contextMenu.nodeId)
                if (!containerEntity) return

                const containerEl = document.querySelector(`[data-id="${contextMenu.nodeId}"]`)
                const headerEl = containerEl?.querySelector<HTMLElement>('[data-container-header]')
                const headerHeight = headerEl?.offsetHeight ?? 48
                const gap = 16
                const result = stackChildren(children, gap, { top: headerHeight + gap, right: 16, bottom: 16, left: 16 })

                s.beginBatch("Stack Children")
                for (const child of result.children) {
                  const dims = childMap.get(child.id)
                  if (!dims) continue
                  s.updateEntity(child.id, {
                    canvasData: { x: child.x, y: child.y, width: dims.width, height: dims.height },
                  })
                }
                s.updateEntity(contextMenu.nodeId, {
                  canvasData: { x: containerEntity.canvasData.x, y: containerEntity.canvasData.y, width: result.containerWidth, height: result.containerHeight },
                })
                s.endBatch()
                syncNodeDimensions(contextMenu.nodeId, result.containerWidth, result.containerHeight)
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
                const parentRel = s.relations.find(
                  (r) => r.target === contextMenu.nodeId && r.type === "contains",
                )
                const parentNode = parentRel ? nodes.find((n) => n.id === parentRel.source) : undefined
                const absoluteX = (entity?.canvasData.x ?? 0) + (parentNode?.position.x ?? 0)
                const absoluteY = (entity?.canvasData.y ?? 0) + (parentNode?.position.y ?? 0)
                if (parentRel) s.removeRelation(parentRel.id)
                s.updateEntity(contextMenu.nodeId, {
                  canvasData: {
                    x: absoluteX,
                    y: absoluteY,
                    width: entity!.canvasData.width,
                    height: entity!.canvasData.height,
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
  const undoStack = useGraphStore((s) => s.undoStack)
  const redoStack = useGraphStore((s) => s.redoStack)
  const onUndo = useGraphStore((s) => s.undo)
  const onRedo = useGraphStore((s) => s.redo)

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

  const setSelectedNode = useGraphStore((s) => s.setSelectedNode)
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      const last = nodes[nodes.length - 1]
      setSelectedNode(last?.id ?? null)
    },
  })

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
          <EntityFormDialog />
          <ButtonGroup>
              <IconButton
                variant="outline"
                aria-label="Undo"
                title={undoStack.length > 0 ? `Undo ${undoStack[undoStack.length - 1].description}` : undefined}
                disabled={undoStack.length === 0}
                onClick={onUndo}
              >
                <ArrowUUpLeft />
              </IconButton>
              <IconButton
                variant="outline"
                aria-label="Redo"
                title={redoStack.length > 0 ? `Redo ${redoStack[redoStack.length - 1].description}` : undefined}
                disabled={redoStack.length === 0}
                onClick={onRedo}
              >
                <ArrowUUpRight />
              </IconButton>
            </ButtonGroup>
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
  const fitViewRef = useRef<() => void>(() => {})

  const onOpenFolder = useCallback(async () => {
    const fsAdapter = new FSAdapter()
    try {
      const snapshot = await fsAdapter.open()
      if (snapshot) {
        const store = useGraphStore.getState()
        store.setFsAdapter(fsAdapter)
        store.openFromDisk(snapshot, fsAdapter.getFolderName()!)
      } else if (fsAdapter.isOpen()) {
        const name = fsAdapter.getFolderName()!
        const confirmed = window.confirm(`This folder is empty. Create a new workspace in ${name}?`)
        if (confirmed) {
          const store = useGraphStore.getState()
          const emptySnapshot: GraphSnapshot = {
            version: 5,
            entities: store.entities,
            relations: store.relations,
            canvas: store.canvas,
          }
          await fsAdapter.save(emptySnapshot)
          store.setFsAdapter(fsAdapter)
          store.openFromDisk(emptySnapshot, name)
        } else {
          fsAdapter.close()
        }
      }
    } catch (err) {
      if (err instanceof FSError) {
        if (err.code === "PERMISSION_DENIED") {
          window.alert(`Cannot access folder — ${err.detail}`)
        } else {
          window.alert(`Cannot open — ${err.detail} (code: ${err.code})`)
        }
      } else {
        console.error("Unexpected error opening folder:", err)
      }
    }
  }, [])

  const onRunLayout = useCallback((options: LayoutOptions) => {
    runFullLayout(options, () => fitViewRef.current?.())
    requestAnimationFrame(() => {
      const s = useGraphStore.getState()
      for (const entity of s.entities) {
        if (entity.type === "container") {
          const targetHeight = s.canvas.collapsedContainers.includes(entity.id)
            ? COLLAPSED_HEADER_HEIGHT
            : entity.canvasData.height
          syncNodeDimensions(entity.id, entity.canvasData.width, targetHeight)
        }
      }
    })
  }, [])

  return (
    <SidebarProvider>
      <div className="flex-1 min-w-0 min-h-0">
        <ReactFlowProvider>
          <GraphCanvasContent onFitViewRef={fitViewRef} />
        </ReactFlowProvider>
      </div>
      <AppSidebar onOpenFolder={onOpenFolder} onRunLayout={onRunLayout} />
    </SidebarProvider>
  )
}

export default GraphCanvas
