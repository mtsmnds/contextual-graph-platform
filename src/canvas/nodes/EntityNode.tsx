import { memo } from "react"
import { type Node, type NodeProps } from "@xyflow/react"
import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
} from "@/components/base-node"
import { Badge } from "@/components/ui/badge"
import type { EntityKind } from "@/types/graph"

type EntityNodeData = {
  label: string
  kind: EntityKind
  id: string
}

type EntityNodeType = Node<EntityNodeData, "entity">

function EntityNode({ data }: NodeProps<EntityNodeType>) {
  return (
    <BaseNode className="w-[200px]">
      <BaseNodeHeader>
        <BaseNodeHeaderTitle>{data.label}</BaseNodeHeaderTitle>
      </BaseNodeHeader>
      <BaseNodeContent>
        <Badge variant="secondary">{data.kind}</Badge>
      </BaseNodeContent>
    </BaseNode>
  )
}

export default memo(EntityNode)
