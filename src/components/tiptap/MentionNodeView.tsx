import { NodeViewWrapper } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import Mention from "@tiptap/extension-mention"
import { useGraphStore } from "@/store/useGraphStore"

export function MentionNodeView({ node, editor }: NodeViewProps) {
  const entityId = node.attrs.id as string
  const state = useGraphStore.getState()
  const entity = state.entities.find((e) => e.id === entityId)
  const label = entity?.title ?? (node.attrs.label as string)

  const handleClick = (e: React.MouseEvent) => {
    if (editor.isEditable && !e.metaKey && !e.ctrlKey) return
    const url = new URL(window.location.href)
    url.searchParams.set("focused", entityId)
    url.searchParams.set("anchor", entityId)
    window.open(url.toString(), "_blank")
  }

  return (
    <NodeViewWrapper
      as="span"
      className="mention text-primary font-medium"
      data-id={entityId}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      @{label}
    </NodeViewWrapper>
  )
}

export const CustomMention = Mention.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView)
  },
})
