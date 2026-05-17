import dagre from "@dagrejs/dagre"
import type { Entity, Relation } from "../types/graph"
import type { Node, Edge } from "@xyflow/react"

interface LayoutInput {
  entities: Entity[]
  relations: Relation[]
}

const NODE_WIDTH = 200
const NODE_HEIGHT = 80

export function getLayoutedElements({ entities, relations }: LayoutInput) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "LR", nodesep: 80, ranksep: 150 })
  g.setDefaultEdgeLabel(() => ({}))

  const nodes: Node[] = entities.map((entity) => {
    const content = entity.content || entity.kind || entity.id
    g.setNode(entity.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
    return {
      id: entity.id,
      position: { x: 0, y: 0 },
      data: { content, kind: entity.kind, id: entity.id },
      type: "entity",
      style: { width: NODE_WIDTH },
    }
  })

  const edges: Edge[] = relations.map((rel) => {
    g.setEdge(rel.source, rel.target)
    return {
      id: rel.id,
      source: rel.source,
      target: rel.target,
      label: rel.type,
      type: "default",
    }
  })

  dagre.layout(g)

  const positionedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: positionedNodes, edges }
}
