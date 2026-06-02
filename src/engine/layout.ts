import dagre from "@dagrejs/dagre"
import type { Entity, Relation } from "../types/graph"
import type { Node, Edge } from "@xyflow/react"

interface LayoutInput {
  entities: Entity[]
  relations: Relation[]
}

function dims(entity: Entity) {
  const isContainer = entity.type === "container"
  return {
    w: entity.canvasData?.width ?? (isContainer ? 400 : 200),
    h: entity.canvasData?.height ?? (isContainer ? 304 : 80),
  }
}

export function getLayoutedElements({ entities, relations }: LayoutInput) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "LR", nodesep: 80, ranksep: 150 })
  g.setDefaultEdgeLabel(() => ({}))

  const nodes: Node[] = entities.map((entity) => {
    const content = entity.content || entity.type || entity.id
    const { w, h } = dims(entity)
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
    const { w, h } = dims(entities.find((e) => e.id === node.id)!)
    return {
      ...node,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2,
      },
    }
  })

  return { nodes: positionedNodes, edges }
}
