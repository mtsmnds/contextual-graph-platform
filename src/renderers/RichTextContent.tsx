import { useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { CustomMention } from "@/components/tiptap/MentionNodeView"
import { PassageAnchor } from "@/components/tiptap/PassageAnchor"

interface RichTextContentProps {
  content: string
  className?: string
  editable?: boolean
  onUpdate?: (json: string) => void
}

function parseContent(input: string): string | Record<string, unknown> {
  if (!input) return ""
  try {
    return JSON.parse(input) as Record<string, unknown>
  } catch {
    if (input.includes("<")) return input
    return `<p>${input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
  }
}

function RichTextContent({ content, className, editable = false, onUpdate }: RichTextContentProps) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const editor = useEditor({
    extensions: [StarterKit, CustomMention, PassageAnchor],
    content: parseContent(content),
    editable,
    onUpdate: ({ editor }) => onUpdateRef.current?.(JSON.stringify(editor.getJSON())),
  })

  if (!editor) return null

  return <EditorContent editor={editor} className={className} />
}

export default RichTextContent
