import { Mark, mergeAttributes } from "@tiptap/core"
import { Plugin } from "@tiptap/pm/state"
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
    ]
  },
})
