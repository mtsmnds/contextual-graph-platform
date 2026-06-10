import { forwardRef, memo, useImperativeHandle, useCallback } from "react"
import { useNodeEdit } from "@/canvas/hooks/useNodeEdit"
import { cn } from "@/lib/utils"

export type ContentEditorHandle = {
  enterEdit: () => void
}

type ContentEditorProps = {
  content: string
  onChange: (value: string) => void
  editTrigger?: number
  placeholder?: string
}

function ContentEditor(
  { content, onChange, editTrigger, placeholder = "Type here..." }: ContentEditorProps,
  ref: React.Ref<ContentEditorHandle>,
) {
  const {
    isEditing,
    editValue,
    setEditValue,
    editRef,
    enterEdit,
    handleBlur,
    handleKeyDown,
  } = useNodeEdit({ content, editTrigger }, onChange)

  useImperativeHandle(ref, () => ({ enterEdit }), [enterEdit])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditValue(e.target.value)
      const ta = e.target
      ta.style.height = "auto"
      ta.style.height = `${ta.scrollHeight}px`
    },
    [setEditValue],
  )

  if (isEditing) {
    return (
      <textarea
        ref={editRef as React.Ref<HTMLTextAreaElement>}
        className={cn(
          "nodrag nowheel nopan resize-none border-none bg-transparent p-0 font-inherit text-sm focus:outline-none",
          "block w-full",
        )}
        value={editValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={1}
      />
    )
  }

  return (
    <div onDoubleClick={enterEdit}>
      <p className="m-0 cursor-default text-sm text-foreground">
        {content || <span className="text-muted-foreground">{placeholder}</span>}
      </p>
    </div>
  )
}

export default memo(forwardRef(ContentEditor))
