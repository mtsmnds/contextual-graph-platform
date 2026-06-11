import { memo } from "react"
import { type Node, type NodeProps, Position, NodeResizeControl, ResizeControlVariant, useNodeId } from "@xyflow/react"
import { BaseHandle } from "@/components/base-handle"
import ContentEditor from "@/components/ContentEditor"
import { ContainerCard } from "@/components/ContainerCard"
import { useGraphStore } from "@/store/useGraphStore"
import { useResizePersistence } from "@/canvas/hooks/useResizePersistence"
import { cn } from "@/lib/utils"

type ContainerGroupNodeData = {
  content: string
  id: string
  editTrigger?: number
}

type ContainerGroupNodeType = Node<ContainerGroupNodeData, "containerGroup">

function ContainerGroupNode({ data }: NodeProps<ContainerGroupNodeType>) {
  const nodeId = useNodeId()
  const onResizeEnd = useResizePersistence(data.id)

  return (
    <>
      <NodeResizeControl
        nodeId={nodeId ?? undefined}
        variant={ResizeControlVariant.Line}
        position={Position.Left}
        minWidth={272}
        minHeight={128}
      />
      <NodeResizeControl
        nodeId={nodeId ?? undefined}
        variant={ResizeControlVariant.Line}
        position={Position.Right}
        minWidth={272}
        minHeight={128}
        onResizeEnd={onResizeEnd}
      />
      <NodeResizeControl
        nodeId={nodeId ?? undefined}
        variant={ResizeControlVariant.Line}
        position={Position.Top}
        minWidth={272}
        minHeight={128}
      />
      <NodeResizeControl
        nodeId={nodeId ?? undefined}
        variant={ResizeControlVariant.Line}
        position={Position.Bottom}
        minWidth={272}
        minHeight={128}
        onResizeEnd={onResizeEnd}
      />
      <div
        className={cn(
          "relative rounded-md w-full container-group-node",
          "hover:ring-1",
          "in-[.selected]:border-muted-foreground",
          "in-[.selected]:shadow-lg",
        )}
        tabIndex={0}
      >
        <BaseHandle type="source" position={Position.Top} id="top" />
        <BaseHandle type="source" position={Position.Right} id="right" />
        <BaseHandle type="source" position={Position.Bottom} id="bottom" />
        <BaseHandle type="source" position={Position.Left} id="left" />
        <ContainerCard width="100%" className="h-full">
          <ContentEditor
            content={data.content}
            className="font-semibold text-sm px-3 py-2"
            onChange={(value) => useGraphStore.getState().updateEntity(data.id, { content: value })}
            editTrigger={data.editTrigger}
            placeholder="Untitled"
          />
          <div className="container-child-area min-h-[60px]" />
        </ContainerCard>
      </div>
    </>
  )
}

export default memo(ContainerGroupNode)
