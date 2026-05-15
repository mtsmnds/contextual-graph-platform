import { createRoot, type Root } from "react-dom/client"
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion"
import { MentionPopup, type MentionItem } from "./MentionPopup"

export function mentionSuggestionRenderer() {
  let root: Root | null = null
  let dom: HTMLDivElement | null = null
  const keyDownRef: { current: ((event: KeyboardEvent) => boolean) | null } = {
    current: null,
  }

  function position(clientRect: DOMRect) {
    if (!dom) return
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - clientRect.bottom
    const left = Math.max(8, Math.min(clientRect.left, window.innerWidth - dom.offsetWidth - 8))
    const top =
      spaceBelow >= 200
        ? clientRect.bottom + 4
        : Math.max(4, clientRect.top - dom.offsetHeight - 4)
    dom.style.left = `${left}px`
    dom.style.top = `${top}px`
  }

  return {
    onStart(props: SuggestionProps<MentionItem, MentionItem>) {
      dom = document.createElement("div")
      dom.style.position = "fixed"
      dom.style.zIndex = "9999"
      dom.style.minWidth = "180px"
      document.body.appendChild(dom)

      root = createRoot(dom)
      root.render(
        <MentionPopup
          items={props.items}
          command={props.command}
          onKeyDownRef={keyDownRef}
        />,
      )

      const rect = props.clientRect?.()
      if (rect) position(rect)
    },

    onUpdate(props: SuggestionProps<MentionItem, MentionItem>) {
      if (!root) return
      root.render(
        <MentionPopup
          items={props.items}
          command={props.command}
          onKeyDownRef={keyDownRef}
        />,
      )

      const rect = props.clientRect?.()
      if (rect) position(rect)
    },

    onKeyDown(props: SuggestionKeyDownProps) {
      return keyDownRef.current?.(props.event) ?? false
    },

    onExit() {
      if (root) {
        root.unmount()
        root = null
      }
      if (dom) {
        dom.remove()
        dom = null
      }
    },
  }
}
