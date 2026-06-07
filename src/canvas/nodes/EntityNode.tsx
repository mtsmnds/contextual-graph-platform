import { memo, useEffect, useRef, useCallback } from "react"
import {
  type Node,
  type NodeProps,
  Position,
  NodeResizeControl,
  ResizeControlVariant,
  useNodeId,
} from "@xyflow/react"
import { BaseNode, BaseNodeContent } from "@/components/base-node"
import { BaseHandle } from "@/components/base-handle"
import { SegmentCard } from "@/components/SegmentCard"
import { useGraphStore } from "@/store/useGraphStore"
import { useResizePersistence } from "@/canvas/hooks/useResizePersistence"
import { useNodeEdit } from "@/canvas/hooks/useNodeEdit"
import { cn } from "@/lib/utils"
import type { EntityType } from "@/types/graph"

type EntityNodeData = {
  content: string
  type: EntityType
  id: string
  editTrigger?: number
}

type EntityNodeType = Node<EntityNodeData, "entity">

function EntityNode({ data }: NodeProps<EntityNodeType>) {
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

  const autoHeight = useGraphStore((s) => s.featureFlags.autoHeight)
  const measureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoHeight) return
    const el = measureRef.current
    if (!el) return
    const newHeight = Math.round(el.offsetHeight)
    const entity = useGraphStore.getState().entities.find((e) => e.id === data.id)
    if (!entity) return
    const currentHeight = entity.canvasData.height ?? 0
    if (Math.abs(newHeight - currentHeight) > 1) {
      useGraphStore.getState().updateEntity(data.id, {
        canvasData: { ...entity.canvasData, height: newHeight },
      })
    }
  })

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditValue(e.target.value)
      if (autoHeight) {
        const ta = e.target
        ta.style.height = "auto"
        ta.style.height = `${ta.scrollHeight}px`
      }
    },
    [setEditValue, autoHeight],
  )

  return (
    <>
      <NodeResizeControl
        nodeId={nodeId ?? undefined}
        variant={ResizeControlVariant.Line}
        position={Position.Left}
        minWidth={64}
      />
      <NodeResizeControl
        nodeId={nodeId ?? undefined}
        variant={ResizeControlVariant.Line}
        position={Position.Right}
        minWidth={64}
        onResizeEnd={onResizeEnd}
      />
      {!autoHeight && (
        <>
          <NodeResizeControl
            nodeId={nodeId ?? undefined}
            variant={ResizeControlVariant.Line}
            position={Position.Top}
            minHeight={32}
          />
          <NodeResizeControl
            nodeId={nodeId ?? undefined}
            variant={ResizeControlVariant.Line}
            position={Position.Bottom}
            minHeight={32}
            onResizeEnd={onResizeEnd}
          />
        </>
      )}
      <BaseNode
        ref={measureRef}
        className={cn(
          "entity-card w-full",
          autoHeight ? "" : "flex flex-col h-full overflow-hidden",
        )}
        data-auto-height={autoHeight ? "" : undefined}
        onDoubleClick={(e) => {
          e.stopPropagation()
          enterEdit()
        }}
      >
        <SegmentCard width="100%">
          <BaseNodeContent
            className={cn(
              "entity-card-content px-3",
              autoHeight ? "" : "flex flex-col flex-1",
            )}
          >
            <BaseHandle type="source" position={Position.Top} id="top" />
            <BaseHandle type="source" position={Position.Right} id="right" />
            <BaseHandle type="source" position={Position.Bottom} id="bottom" />
            <BaseHandle type="source" position={Position.Left} id="left" />
            {isEditing ? (
              <textarea
                ref={editRef as React.Ref<HTMLTextAreaElement>}
                className={cn(
                  "nodrag nowheel nopan resize-none border-none bg-transparent p-0 font-inherit text-sm focus:outline-none",
                  autoHeight ? "block w-full" : "flex-1",
                )}
                value={editValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder="Type here..."
                rows={1}
              />
            ) : (
              <p className={cn(
                "m-0 cursor-default text-sm text-foreground",
                autoHeight ? "" : "flex-1 overflow-hidden",
              )}>
                {data.content || <span className="text-muted-foreground">Type here...</span>}
              </p>
            )}
          </BaseNodeContent>
        </SegmentCard>
      </BaseNode>
    </>
  )
}

export default memo(EntityNode)
