import { useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

interface RichTextContentProps {
  content: string
  className?: string
  editable?: boolean
  onUpdate?: (html: string) => void
}

function toHtml(content: string): string {
  if (content.includes("<")) return content
  return `<p>${content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
}

function RichTextContent({ content, className, editable = false, onUpdate }: RichTextContentProps) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const editor = useEditor({
    extensions: [StarterKit],
    content: toHtml(content),
    editable,
    onUpdate: ({ editor }) => onUpdateRef.current?.(editor.getHTML()),
  })

  if (!editor) return null

  return <EditorContent editor={editor} className={className} />
}

export default RichTextContent
