import { memo, useState, useRef, useEffect, useCallback } from "react"
import { type Node, type NodeProps, Position, NodeResizeControl, ResizeControlVariant, useNodeId } from "@xyflow/react"
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node"
import { BaseHandle } from "@/components/base-handle"
import { useGraphStore } from "@/store/useGraphStore"
import type { EntityType } from "@/types/graph"

const GRID = 16

type EntityNodeData = {
  content: string
  type: EntityType
  id: string
  editTrigger?: number
}

type EntityNodeType = Node<EntityNodeData, "entity">

function EntityNode({ data }: NodeProps<EntityNodeType>) {
  const nodeId = useNodeId()
  const [isEditing, setIsEditing] = useState(data.editTrigger ? true : false)
  const [editValue, setEditValue] = useState(data.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const commitRef = useRef(false)
  const lastTriggerRef = useRef(data.editTrigger ?? 0)

  const enterEdit = useCallback(() => {
    setIsEditing(true)
    setEditValue(data.content)
  }, [data.content])

  const commitEdit = useCallback(() => {
    if (commitRef.current) return
    commitRef.current = true
    setIsEditing(false)
    useGraphStore.getState().updateEntity(data.id, { content: editValue })
  }, [data.id, editValue])

  useEffect(() => {
    if (!isEditing) {
      commitRef.current = false
    }
  }, [isEditing])

  useEffect(() => {
    if (data.editTrigger && data.editTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = data.editTrigger
      enterEdit()
    }
  }, [data.editTrigger, enterEdit])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    enterEdit()
  }, [enterEdit])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      const len = editValue.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isEditing, editValue.length])

  const handleResizeEnd = useCallback((_: unknown, params: { x: number; y: number; width: number; height: number }) => {
    const store = useGraphStore.getState()
    store.beginBatch("Resize node")
    store.updateEntity(data.id, {
      canvasData: {
        x: Math.ceil(params.x / GRID) * GRID,
        y: Math.ceil(params.y / GRID) * GRID,
        width: Math.ceil(params.width / GRID) * GRID,
        height: Math.ceil(params.height / GRID) * GRID,
      },
    })
    store.endBatch()
  }, [data.id])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.currentTarget.blur()
    }
  }, [])

  const handleBlur = useCallback(() => {
    commitEdit()
  }, [commitEdit])

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value)
  }, [])

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
        onResizeEnd={handleResizeEnd}
      />
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
        onResizeEnd={handleResizeEnd}
      />
      <BaseNode className="w-full h-full overflow-hidden flex flex-col" onDoubleClick={handleDoubleClick}>
        <BaseNodeContent className="flex-1">
          <BaseHandle type="source" position={Position.Top} id="top" />
          <BaseHandle type="source" position={Position.Right} id="right" />
          <BaseHandle type="source" position={Position.Bottom} id="bottom" />
          <BaseHandle type="source" position={Position.Left} id="left" />
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="nodrag nowheel nopan flex-1 resize-none border-none bg-transparent p-0 font-inherit text-sm focus:outline-none"
              value={editValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder="Type here..."
              rows={1}
            />
          ) : (
            <p className="flex-1 m-0 cursor-default text-sm text-foreground overflow-hidden">
              {data.content || <span className="text-muted-foreground">Type here...</span>}
            </p>
          )}

        </BaseNodeContent>
      </BaseNode>
    </>
  )
}

export default memo(EntityNode)
