import { useState, useRef, useEffect, useCallback } from "react"

export function useNodeEdit(data: { content: string; editTrigger?: number }, onCommit: (value: string) => void) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(data.content)
  const editRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const commitRef = useRef(false)
  const lastTriggerRef = useRef(0)

  const enterEdit = useCallback(() => {
    setIsEditing(true)
    setEditValue(data.content)
  }, [data.content])

  const commitEdit = useCallback(() => {
    if (commitRef.current) return
    commitRef.current = true
    setIsEditing(false)
    onCommit(editValue)
  }, [editValue, onCommit])

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
    if (isEditing && editRef.current) {
      editRef.current.focus()
    }
  }, [isEditing])

  const handleBlur = useCallback(() => {
    commitEdit()
  }, [commitEdit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditValue(data.content)
        setIsEditing(false)
      }
    },
    [data.content],
  )

  return {
    isEditing,
    editValue,
    setEditValue,
    editRef,
    enterEdit,
    commitEdit,
    handleBlur,
    handleKeyDown,
  }
}
