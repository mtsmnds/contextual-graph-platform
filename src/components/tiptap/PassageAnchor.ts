import { Mark, mergeAttributes } from "@tiptap/core"
import { Plugin } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { Fragment, Slice } from "@tiptap/pm/model"

function stripAnchors(fragment: Fragment): Fragment {
  const children: import("@tiptap/pm/model").Node[] = []
  fragment.forEach((child) => {
    if (child.marks.some((m) => m.type.name === "passageAnchor")) {
      children.push(child.mark(child.marks.filter((m) => m.type.name !== "passageAnchor")))
    } else if (child.content.size) {
      children.push(child.copy(stripAnchors(child.content)))
    } else {
      children.push(child)
    }
  })
  return Fragment.fromArray(children)
}

export const PassageAnchor = Mark.create({
  name: "passageAnchor",

  addAttributes() {
    return {
      segmentId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-passage-anchor"),
        renderHTML: (attrs) => {
          if (!attrs.segmentId) return {}
          return { "data-passage-anchor": attrs.segmentId }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: "span[data-passage-anchor]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "passage-anchor" }), 0]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          transformPasted: (slice: Slice) => {
            return new Slice(stripAnchors(slice.content), slice.openStart, slice.openEnd)
          },
        },
      }),
      new Plugin({
        props: {
          decorations(state) {
            const decos: Decoration[] = []
            const doc = state.doc
            const marks = state.schema.marks.passageAnchor
            if (!marks) return DecorationSet.empty

            doc.descendants((node, pos) => {
              if (node.isText && node.marks.some((m) => m.type.name === "passageAnchor")) {
                const mark = node.marks.find((m) => m.type.name === "passageAnchor")!
                const segmentId = mark.attrs.segmentId as string
                const blockEnd = pos + node.nodeSize

                decos.push(
                  Decoration.widget(
                    blockEnd,
                    () => {
                      const btn = document.createElement("button")
                      btn.className = "passage-gutter-btn"
                      btn.dataset.segmentId = segmentId
                      btn.setAttribute("aria-label", "Link passage")
                      btn.innerHTML =
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
                      btn.addEventListener("mousedown", (e) => {
                        e.preventDefault()
                        btn.dispatchEvent(
                          new CustomEvent("passage-link-click", {
                            bubbles: true,
                            detail: { segmentId },
                          }),
                        )
                      })
                      return btn
                    },
                    { side: 1 },
                  ),
                )
              }
            })

            return DecorationSet.create(doc, decos)
          },
        },
      }),
    ]
  },
})
