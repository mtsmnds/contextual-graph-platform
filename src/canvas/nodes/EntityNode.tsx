import { memo, useEffect, useRef } from "react"
import {
  type Node,
  type NodeProps,
  Position,
  NodeResizeControl,
  ResizeControlVariant,
  useNodeId,
} from "@xyflow/react"
import { BaseHandle } from "@/components/base-handle"
import { SegmentCard } from "@/components/SegmentCard"
import ContentEditor from "@/components/ContentEditor"
import { useGraphStore } from "@/store/useGraphStore"
import { useResizePersistence } from "@/canvas/hooks/useResizePersistence"
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
      <div
        ref={measureRef}
        className={cn(
          "relative entity-card w-full",
          "hover:ring-1",
          "in-[.selected]:border-muted-foreground",
          "in-[.selected]:shadow-lg",
          autoHeight ? "" : "flex flex-col h-full overflow-hidden",
        )}
        tabIndex={0}
        data-auto-height={autoHeight ? "" : undefined}
        onDoubleClick={(e) => {
          e.stopPropagation()
        }}
      >
        <BaseHandle type="source" position={Position.Top} id="top" />
        <BaseHandle type="source" position={Position.Right} id="right" />
        <BaseHandle type="source" position={Position.Bottom} id="bottom" />
        <BaseHandle type="source" position={Position.Left} id="left" />
        <SegmentCard
          width="100%"
          className={autoHeight ? undefined : "flex-1"}
        >
          <ContentEditor
            content={data.content}
            className={autoHeight ? "" : "flex-1"}
            onChange={(value) => useGraphStore.getState().updateEntity(data.id, { content: value })}
            editTrigger={data.editTrigger}
            placeholder="Type here..."
          />
        </SegmentCard>
      </div>
    </>
  )
}

export default memo(EntityNode)
