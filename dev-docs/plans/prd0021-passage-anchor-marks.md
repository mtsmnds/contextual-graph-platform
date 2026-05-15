# PRD0021: Passage Anchor Marks (Phase 1 — The Bridge)

**Status:** Draft

---

## 1. The Problem

The graph stores entities and relations, and TipTap documents hold rich text content. But there is no bridge between them. A user can write "comme dans Lolita de Nabokov" inside a TipTap document, but that text is just text — it has no identity in the graph. It cannot receive relations, cannot be linked to other passages, and cannot be referenced by other documents.

Currently, the only way to make text "graph-addressable" is to create a separate `segment` entity with its own content, duplicating what's already in the TipTap document. This is what the Hamlet import does (1,349 segment entities), but it's not a viable workflow for user-created content — the user shouldn't have to manage entity creation for every quote they write.

## 2. What We're Building

A custom TipTap mark extension (`PassageAnchor`) that assigns a stable `segmentId` to any selected text range. The mark is invisible in normal reading but makes the text addressable by the graph. When a passage is created, a lightweight `annotation` entity is created in the graph that records (`sourceContainer`, `segmentId`). The text itself stays in the TipTap document — it is never duplicated in the entity.

### Data model

**Inside the TipTap document** (a custom mark on the text):

```json
{
  "type": "text",
  "marks": [
    {
      "type": "passageAnchor",
      "attrs": {
        "segmentId": "psg_a1b2c3d4"
      }
    }
  ],
  "text": "comme dans Lolita de Nabokov"
}
```

**In the graph** (an annotation entity — `kind` already exists):

```ts
Entity {
  id: "psg_a1b2c3d4",
  kind: "annotation",
  content: undefined,                          // text stays in the TipTap doc
  metadata: {
    sourceContainer: "doc_triste-tigre-notes", // the container holding this passage
  }
}
```

No title, no position offsets. The passage label is derived at render time by extracting the anchored text from the source document and truncating to ~60 chars. The `segmentId` on the mark is the sole source of truth for identity — positions are found by scanning the document tree for the matching mark.

## 3. Architecture

```
TiptapEditor.tsx
├── PassageAnchor extension                — custom mark, copied from Highlight
│   ├── addAttributes() → segmentId        — UUID generated on creation
│   ├── parseHTML()                        — reads data-passage-anchor
│   ├── renderHTML()                       — renders <span data-passage-anchor>
│   └── clipboardTextSerializer            — strips segmentId on paste

├── BubbleMenu                             — existing, extended
│   └── "Create passage" button            — appears when text is selected
│       ├── generates UUID
│       └── applies PassageAnchor mark via editor.commands.setMark()
│       → entity created later, on saveContent() reconciliation

ReadingViewport.tsx / RichTextContent.tsx  — read-only rendering
└── PassageAnchor extension (no UI)        — marks render invisibly
    └── extractAnchoredText(containerId, segmentId) — utility to pull text for display

useGraphStore.ts
└── saveContent()                          — extended with reconciliation step
    ├── walk document marks for all segmentIds
    ├── diff against existing annotation entities
    ├── create missing annotation entities
    └── mark entities stale if segmentId no longer exists in document
```

### 3.1 PassageAnchor mark extension

Copied from `@tiptap/extension-highlight` with `color` attribute replaced by `segmentId`:

```ts
const PassageAnchor = Mark.create({
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
})
```

The mark renders with a subtle visual indicator — thin underline or bracket color, invisible by default, visible on hover (CSS controlled by `.passage-anchor` class). This is identical to how Highlight works structurally.

### 3.1a Transform paste — strip segmentId on copy-paste

Copy-paste is the one case where duplicate `segmentId` values are dangerous — two passages in two documents would reference the same graph entity. Unlike Highlight (where duplicate colors are harmless), duplicate entity references break the data model.

Add a ProseMirror plugin that strips `passageAnchor` marks from pasted content:

```ts
import { Plugin } from "@tiptap/pm/state"
import { mapSlice } from "@tiptap/pm/transform"

addProseMirrorPlugins() {
  return [
    new Plugin({
      props: {
        transformPasted: (slice) => {
          return mapSlice(slice, (node) => {
            if (node.isText && node.marks.some(m => m.type.name === "passageAnchor")) {
              return node.copy(node.marks.filter(m => m.type.name !== "passageAnchor"))
            }
            return node
          })
        }
      }
    })
  ]
}
```

Pasted text that originated from a passage anchor becomes plain text. If the user wants the pasted text to be a passage too, they select it and click "Create passage" again — this generates a fresh `segmentId`. Regenerating automatically on paste would silently create a new graph entity without the user's intent, which is worse than losing the mark.

### 3.2 "Create passage" BubbleMenu button

The existing BubbleMenu already shows when text is selected. Add a new button:

```tsx
<BubbleMenu editor={editor} ...>
  {/* existing buttons: bold, italic, link, highlight */}
  <Button onClick={createPassage} title="Create passage">
    <LinkSimple />  {/* or Scissors, or a new icon */}
  </Button>
</BubbleMenu>
```

The `createPassage` handler applies the mark only — entity creation is deferred to save-time reconciliation:

```ts
function createPassage() {
  const { from, to } = editor.state.selection
  const selectedText = editor.state.doc.textBetween(from, to)
  if (!selectedText.trim()) return

  const segmentId = generateUniqueId()   // reuse existing ID generator

  // Apply the mark — TipTap's undo stack tracks this
  editor.chain().focus().setPassageAnchor({ segmentId }).run()

  // Entity is NOT created here. It's created on the next saveContent()
  // via reconciliation (see section 3.3).
  // This means Cmd+Z cleanly undoes the mark without leaving orphan entities.
}
```

### 3.3 Graph entity creation — save-time reconciliation

Entity creation is **not** eager. The BubbleMenu only applies the mark. The annotation entity is created during the next `saveContent()` call via a reconciliation step.

This solves the undo problem: if the user hits Cmd+Z after creating a passage, the mark is removed by TipTap's undo stack. Since the entity was never created, there are no orphan entities to clean up.

**Reconciliation step** (added to `saveContent()` in the store):

```
saveContent(containerId, data):
  1. Persist content to adapter (existing behavior)
  2. Walk the ProseMirror JSON tree for all passageAnchor marks
  3. Collect all segmentIds found in the document
  4. For each segmentId found in step 3:
     if NO annotation entity exists with id === segmentId (any container):
       → createEntity("annotation", { id: segmentId, metadata: { sourceContainer: containerId } })
  5. For each annotation entity where metadata.sourceContainer === containerId:
     if its segmentId is NOT in the set from step 3:
       → set metadata.stale = true
```

The container scope filter in step 5 is critical. Without it, saving document B would check B's marks against document A's annotation entities and falsely mark A's passages as stale.

The entity model:

- `id = segmentId` (shared ID between mark and entity — no separate mapping table)
- `content: undefined` (text lives in the TipTap document, never duplicated)
- `metadata.sourceContainer` pointing to the container entity that holds the TipTap doc
- `metadata.stale: true` if the mark no longer exists in the document (deleted)

No title field. Passage labels are derived at render time via `getPassageText()` (section 3.4).

### 3.4 Passage rendering utility

For displaying a passage's text in context (annotation card, relation indicator, passage label):

```ts
function getPassageText(containerId: string, segmentId: string): string | null {
  const content = useGraphStore.getState().getContent(containerId)
  if (!content) return null
  // content is TipTap JSON — walk the document tree
  // find the first text node with a passageAnchor mark matching segmentId
  // return the text content
}

function getPassageLabel(containerId: string, segmentId: string): string {
  const text = getPassageText(containerId, segmentId)
  if (!text) return "deleted passage"
  return text.length > 60 ? text.slice(0, 60) + "..." : text
}
```

`getPassageLabel()` derives the display label from the anchored text (truncated to ~60 chars). No title field needed on the entity. If the entity is stale (mark deleted), it renders as "deleted passage" — muted, not crashing.

Tree traversal for a document with a few dozen passages is fast enough at current scale. No indexing needed.

### 3.5 Gutter indicator

In `ReadingViewport.tsx`, when rendering container content, check each passage for outgoing relations. If a passage has relations, show the existing gutter indicator (the `ChatCircleText` / `Link` pattern from PRD0007). The query is: "does entity `segmentId` have any outgoing relations?" — answered by `getRelations(state, segmentId)`.

Stale passages (entity has `metadata.stale: true`) show a muted indicator — "passage removed" — where they're referenced in other documents. The entity and its relations are preserved so user comments on cross-doc links aren't silently destroyed.

### 3.6 No changes to `RichTextContent`

The `PassageAnchor` mark renders invisibly (no visual change in read-only mode). The mark is simply included in the extensions array so it isn't stripped by ProseMirror:

```ts
// RichTextContent.tsx
extensions: [
  StarterKit,
  PassageAnchor,          // added — without this, marks are stripped on load
  CustomMention,
  // ...
]
```

Without this, existing documents with `passageAnchor` marks would have them silently stripped on load.

## 4. Files Changed

| File | Change |
|------|--------|
| `src/components/tiptap/PassageAnchor.ts` | **New** — `PassageAnchor` mark extension (copied from Highlight, `color` → `segmentId`) |
| `src/renderers/TiptapEditor.tsx` | Import `PassageAnchor`, add to extensions array, add "Create passage" button to BubbleMenu |
| `src/renderers/RichTextContent.tsx` | Import `PassageAnchor`, add to extensions array (read-only survival) |
| `src/engine/ids.ts` | Ensure `generateDocId()` produces short unique IDs suitable for `segmentId` (it already does — `doc_{timestamp}`) |
| `src/store/useGraphStore.ts` | Add reconciliation step in `saveContent()` — walk document marks, diff against existing annotation entities, create missing ones, mark stale ones |

No schema changes. No new dependencies.

## 5. Out of Scope (Phase 2+)

- Cross-document linking (Phase 2 — target picker dialog)
- Relation type selection on passage creation (always creates `annotation` + no relation in Phase 1)
- Multi-column layout (Phase 3)
- Drag-to-link (Phase 4)
- Metadata display / blockquote rendering (Phase 5)
- Stale entity garbage collection (manual or scheduled cleanup of entities with `metadata.stale: true` — deferred)

## 6. Risks

- **Undo creates no orphan** — Entity creation is deferred to save-time reconciliation, so Cmd+Z after creating a passage removes the mark cleanly. No orphan entities. Risks: if the user closes the tab before any save, the mark is lost entirely (but the user expects this — unsaved work is unsaved).
- **Stale passage references** — If the user deletes all text under an anchor mark, the reconciliation step marks `metadata.stale: true` on the entity. The entity and its relations are preserved so cross-doc comments are not destroyed. The UI renders stale passages as muted "deleted passage" labels.
- **Reconciliation on every save is O(n)** — Walking the document tree for marks is linear in document size. At current scale (tens to hundreds of passages, not thousands) this is negligible. If it becomes a bottleneck, cache the mark positions on save.
- **Mark ID collision on paste** — Mitigated by the `transformPasted` plugin which strips `passageAnchor` marks from pasted content. The user must explicitly re-create passages after paste.
- **Concurrent saves** — If two saves race, the reconciliation could temporarily miss a mark. Mitigation: saves are sequential (debounced 300ms), and reconciliation is idempotent — running it twice produces the same result.
