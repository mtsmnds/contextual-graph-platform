import { memo, useState, useRef, useEffect, useCallback } from "react"
import { type Node, type NodeProps, Position, NodeResizeControl, ResizeControlVariant, useNodeId } from "@xyflow/react"
import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
} from "@/components/base-node"
import { BaseHandle } from "@/components/base-handle"
import { useGraphStore } from "@/store/useGraphStore"

type ContainerGroupNodeData = {
  content: string
  id: string
  editTrigger?: number
}

type ContainerGroupNodeType = Node<ContainerGroupNodeData, "containerGroup">

function ContainerGroupNode({ data }: NodeProps<ContainerGroupNodeType>) {
  const nodeId = useNodeId()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(data.content)
  const inputRef = useRef<HTMLInputElement>(null)
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
    if (!isEditing) commitRef.current = false
  }, [isEditing])

  useEffect(() => {
    if (data.editTrigger && data.editTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = data.editTrigger
      enterEdit()
    }
  }, [data.editTrigger, enterEdit])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleHeaderDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    enterEdit()
  }, [enterEdit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setEditValue(data.content)
      e.currentTarget.blur()
    }
  }, [data.content])

  const handleBlur = useCallback(() => {
    commitEdit()
  }, [commitEdit])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
  }, [])

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
      />
      <BaseNode className="w-full overflow-hidden container-group-node">
        <BaseNodeHeader onDoubleClick={handleHeaderDoubleClick}>
          {isEditing ? (
            <input
              ref={inputRef}
              className="nodrag nopan flex-1 border-none bg-transparent p-0 font-semibold text-sm focus:outline-none"
              value={editValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
            />
          ) : (
            <span className="flex-1 font-semibold text-sm truncate">
              {data.content || <span className="text-muted-foreground">Untitled</span>}
            </span>
          )}
        </BaseNodeHeader>
        <BaseNodeContent className="container-child-area min-h-[60px]">
          <BaseHandle type="source" position={Position.Top} id="top" />
          <BaseHandle type="source" position={Position.Right} id="right" />
          <BaseHandle type="source" position={Position.Bottom} id="bottom" />
          <BaseHandle type="source" position={Position.Left} id="left" />
        </BaseNodeContent>
      </BaseNode>
    </>
  )
}

export default memo(ContainerGroupNode)
