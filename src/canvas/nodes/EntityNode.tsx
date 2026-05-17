import { memo, useState, useRef, useEffect, useCallback } from "react"
import { type Node, type NodeProps, Position, NodeResizer, useUpdateNodeInternals } from "@xyflow/react"
import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
} from "@/components/base-node"
import { Badge } from "@/components/ui/badge"
import { BaseHandle } from "@/components/base-handle"
import { useGraphStore } from "@/store/useGraphStore"
import type { EntityKind } from "@/types/graph"

type EntityNodeData = {
  content: string
  kind: EntityKind
  id: string
  editTrigger?: number
}

type EntityNodeType = Node<EntityNodeData, "entity">

function EntityNode({ data }: NodeProps<EntityNodeType>) {
  const [isEditing, setIsEditing] = useState(data.editTrigger ? true : false)
  const [editValue, setEditValue] = useState(data.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const commitRef = useRef(false)
  const lastTriggerRef = useRef(data.editTrigger ?? 0)
  const lastHeightRef = useRef(0)
  const updateNodeInternals = useUpdateNodeInternals()

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

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const ta = textareaRef.current
      ta.style.height = "auto"
      const newHeight = Math.min(ta.scrollHeight, 300)
      ta.style.height = newHeight + "px"
      if (Math.abs(newHeight - lastHeightRef.current) > 1) {
        lastHeightRef.current = newHeight
        updateNodeInternals(data.id)
      }
    }
  }, [editValue, isEditing, data.id, updateNodeInternals])

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
      <NodeResizer
        minWidth={60}
        minHeight={45}
      />
      <BaseNode className="w-[200px]" onDoubleClick={handleDoubleClick}>
        <BaseNodeHeader>
          <Badge variant="secondary" className="text-xs">{data.kind}</Badge>
        </BaseNodeHeader>
        <BaseNodeContent>
          <BaseHandle
            type="target"
            position={Position.Left}
          />
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="nodrag nowheel nopan w-full resize-none border-none bg-transparent p-0 font-inherit text-sm focus:outline-none"
              value={editValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder="Type here..."
              rows={1}
            />
          ) : (
            <p className="m-0 cursor-grab text-sm text-foreground">
              {data.content || <span className="text-muted-foreground">Type here...</span>}
            </p>
          )}
          <BaseHandle
            type="source"
            position={Position.Right}
          />
        </BaseNodeContent>
      </BaseNode>
    </>
  )
}

export default memo(EntityNode)
