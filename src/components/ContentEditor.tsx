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
  className?: string
}

/** Reusable content editor with view/edit modes, auto-expanding textarea, and programmatic edit entry. Mountable inside or outside ReactFlow. */
function ContentEditor(
  { content, onChange, editTrigger, placeholder = "Type here...", className }: ContentEditorProps,
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
    },
    [setEditValue],
  )

  if (isEditing) {
    return (
      <textarea
        ref={editRef as React.Ref<HTMLTextAreaElement>}
        style={{ fieldSizing: "content" }}
        className={cn(
          "nodrag nowheel nopan resize-none border-none bg-transparent p-0 font-inherit text-sm focus:outline-none",
          "w-full",
          className,
        )}
        value={editValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
    )
  }

  return (
    <div className={className} onDoubleClick={enterEdit}>
      <p className="m-0 cursor-default text-sm text-foreground whitespace-pre-wrap">
        {content || <span className="text-muted-foreground">{placeholder}</span>}
      </p>
    </div>
  )
}

export default memo(forwardRef(ContentEditor))
