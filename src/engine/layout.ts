import dagre from "@dagrejs/dagre"
import type { Entity, Relation } from "../types/graph"
import type { Node, Edge } from "@xyflow/react"
import { useGraphStore } from "../store/useGraphStore"

export interface LayoutOptions {
  rankdir: "TB" | "BT" | "LR" | "RL"
  nodesep: number
  ranksep: number
  nodeWidth: number
}

interface LayoutInput {
  entities: Entity[]
  relations: Relation[]
  options: LayoutOptions
  ignoreSavedPositions?: boolean
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  rankdir: "LR",
  nodesep: 80,
  ranksep: 150,
  nodeWidth: 208,
}

// Stopgap — replace with DOM-measured height when node auto-sizing is implemented.
export function estimateNodeHeight(content: string, width: number): number {
  if (!content) return 64
  const avgCharWidth = 8
  const charsPerLine = Math.max(1, Math.floor((width - 32) / avgCharWidth))
  const lines = Math.ceil(content.length / charsPerLine)
  const lineHeight = 20
  const padding = 24
  return Math.max(64, Math.min(lines * lineHeight + padding, 600))
}

function computeParentGroupWidth(
  entities: Entity[],
  nodeWidth: number,
): Map<string, number> {
  const groups = new Map<string, Entity[]>()
  for (const entity of entities) {
    if (entity.type === "segment" && entity.parentId) {
      const g = groups.get(entity.parentId) ?? []
      g.push(entity)
      groups.set(entity.parentId, g)
    }
  }

  const result = new Map<string, number>()
  for (const [parentId] of groups) {
    result.set(parentId, nodeWidth)
  }
  return result
}

function computeNodeWidth(
  entity: Entity,
  parentGroupWidth: Map<string, number>,
  nodeWidth: number,
): number {
  if (entity.type === "container") return Math.max(nodeWidth * 2, 400)
  if (entity.type === "segment" && entity.parentId) {
    return parentGroupWidth.get(entity.parentId) ?? nodeWidth
  }
  return nodeWidth
}

function computeNodeDims(
  entity: Entity,
  options: LayoutOptions,
  parentGroupWidth: Map<string, number>,
  ignoreSavedPositions: boolean,
): { w: number; h: number } {
  if (ignoreSavedPositions) {
    const w = computeNodeWidth(entity, parentGroupWidth, options.nodeWidth)
    const h = estimateNodeHeight(entity.content, w)
    return { w, h }
  }

  const isContainer = entity.type === "container"
  return {
    w: entity.canvasData?.width ?? (isContainer ? 400 : options.nodeWidth),
    h: entity.canvasData?.height ?? (isContainer ? 304 : 80),
  }
}

export function getLayoutedElements({
  entities,
  relations,
  options,
  ignoreSavedPositions = false,
}: LayoutInput) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: options.rankdir, nodesep: options.nodesep, ranksep: options.ranksep })
  g.setDefaultEdgeLabel(() => ({}))

  const parentGroupWidth = computeParentGroupWidth(entities, options.nodeWidth)

  const nodes: Node[] = entities.map((entity) => {
    const content = entity.content || entity.type || entity.id
    const { w, h } = computeNodeDims(entity, options, parentGroupWidth, ignoreSavedPositions)
    const isContainer = entity.type === "container"

    g.setNode(entity.id, { width: w, height: h })

    const node: Node = {
      id: entity.id,
      position: { x: 0, y: 0 },
      data: { content, type: entity.type, id: entity.id },
      type: isContainer ? "containerGroup" : "entity",
      style: {
        width: w,
        ...(h != null ? { height: h } : {}),
        ...(!isContainer && h == null ? { minHeight: 32 } : {}),
      },
    }

    if (entity.parentId) {
      node.parentId = entity.parentId
      node.extent = "parent"
      node.expandParent = true
    }

    return node
  })

  const edges: Edge[] = relations.map((rel) => {
    g.setEdge(rel.source, rel.target)
    return {
      id: rel.id,
      source: rel.source,
      target: rel.target,
      sourceHandle: rel.metadata?.sourceHandle as string | undefined,
      targetHandle: rel.metadata?.targetHandle as string | undefined,
      label: rel.type,
      type: "edgelabel",
    }
  })

  dagre.layout(g)

  const positionedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    const entity = entities.find((e) => e.id === node.id)!
    const { w, h } = computeNodeDims(entity, options, parentGroupWidth, ignoreSavedPositions)

    const position = {
      x: pos.x - w / 2,
      y: pos.y - h / 2,
    }

    if (!ignoreSavedPositions) {
      const saved = entity.canvasData
      if (saved && saved.x !== undefined) {
        return { ...node, position: { x: saved.x, y: saved.y } }
      }
    }

    return { ...node, position }
  })

  return { nodes: positionedNodes, edges }
}

export function runFullLayout(options: LayoutOptions, fitView: () => void): void {
  const state = useGraphStore.getState()
  const { entities, relations } = state
  const { nodes } = getLayoutedElements({ entities, relations, options, ignoreSavedPositions: true })

  state.beginBatch("Run Layout")
  for (const node of nodes) {
    const sd: { width?: number; height?: number } = {}
    const s = node.style as Record<string, unknown> | undefined
    if (s?.width != null) sd.width = Number(s.width)
    if (s?.height != null) sd.height = Number(s.height)

    state.updateEntity(node.id, {
      canvasData: {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
        ...sd,
      },
    })
  }
  state.endBatch()

  fitView()
}
