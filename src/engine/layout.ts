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
  relations: Relation[],
  nodeWidth: number,
): Map<string, number> {
  const groups = new Map<string, Entity[]>()
  const containsRels = relations.filter((r) => r.type === "contains")
  for (const entity of entities) {
    if (entity.type === "segment") {
      const parentRel = containsRels.find((r) => r.target === entity.id)
      if (parentRel) {
        const g = groups.get(parentRel.source) ?? []
        g.push(entity)
        groups.set(parentRel.source, g)
      }
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
  relations: Relation[],
  nodeWidth: number,
): number {
  if (entity.type === "container") return Math.max(nodeWidth * 2, 400)
  if (entity.type === "segment") {
    const containsRel = relations.find(
      (r) => r.target === entity.id && r.type === "contains",
    )
    const parentId = containsRel?.source
    return parentId ? (parentGroupWidth.get(parentId) ?? nodeWidth) : nodeWidth
  }
  return nodeWidth
}

function computeNodeDims(
  entity: Entity,
  options: LayoutOptions,
  parentGroupWidth: Map<string, number>,
  relations: Relation[],
  ignoreSavedPositions: boolean,
): { w: number; h: number } {
  if (ignoreSavedPositions) {
    const w = computeNodeWidth(entity, parentGroupWidth, relations, options.nodeWidth)
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

  const parentGroupWidth = computeParentGroupWidth(entities, relations, options.nodeWidth)

  const nodes: Node[] = entities.map((entity) => {
    const content = entity.content || entity.type || entity.id
    const { w, h } = computeNodeDims(entity, options, parentGroupWidth, relations, ignoreSavedPositions)
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

    const containsParentRel = relations.find(
      (r) => r.target === entity.id && r.type === "contains",
    )
    if (containsParentRel) {
      node.parentId = containsParentRel.source
      node.extent = "parent"
      node.expandParent = true
    }

    return node
  })

  const edges: Edge[] = relations.filter((r) => r.type !== "contains").map((rel) => {
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
    const { w, h } = computeNodeDims(entity, options, parentGroupWidth, relations, ignoreSavedPositions)

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
