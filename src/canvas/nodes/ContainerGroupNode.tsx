import { memo, useCallback } from "react"
import { type Node, type NodeProps, Position, NodeResizeControl, ResizeControlVariant, useNodeId } from "@xyflow/react"
import { BaseNodeHeader } from "@/components/base-node"
import { BaseHandle } from "@/components/base-handle"
import { useGraphStore } from "@/store/useGraphStore"
import { useResizePersistence } from "@/canvas/hooks/useResizePersistence"
import { useNodeEdit } from "@/canvas/hooks/useNodeEdit"
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
  const {
    isEditing,
    editValue,
    setEditValue,
    editRef,
    enterEdit,
    handleBlur,
    handleKeyDown,
  } = useNodeEdit(data, (value) => {
    useGraphStore.getState().updateEntity(data.id, { content: value })
  })

  const handleHeaderDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    enterEdit()
  }, [enterEdit])

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
          "bg-card text-card-foreground relative rounded-md border w-full overflow-hidden container-group-node",
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
        <BaseNodeHeader onDoubleClick={handleHeaderDoubleClick}>
          {isEditing ? (
            <input
              ref={editRef as React.Ref<HTMLInputElement>}
              className="nodrag nopan flex-1 border-none bg-transparent p-0 font-semibold text-sm focus:outline-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
            />
          ) : (
            <span className="flex-1 font-semibold text-sm truncate">
              {data.content || <span className="text-muted-foreground">Untitled</span>}
            </span>
          )}
        </BaseNodeHeader>
        <div className="container-child-area min-h-[60px]" />
      </div>
    </>
  )
}

export default memo(ContainerGroupNode)
