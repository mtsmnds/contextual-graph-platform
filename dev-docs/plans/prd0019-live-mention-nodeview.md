# PRD0019: Live Mention NodeView (Resolve Title from Graph Store)

**Status:** Draft

---

## 1. The Problem

The mention node stores `attrs.label` as a static snapshot of the entity title at insertion time:

```json
{
  "type": "mention",
  "attrs": {
    "id": "about-workspace",
    "label": "About This Workspace",
    "mentionSuggestionChar": "@"
  }
}
```

When the entity is renamed (via `updateEntity(id, { title })`), the graph store has the new title, but every mention node in every document still shows the old `attrs.label`. There is no mechanism to reconcile them.

Additionally, `RichTextContent` (the read-only renderer used for SegmentCards in the reading viewport) does not include the Mention extension at all — it only uses `StarterKit`. Documents containing mention nodes will have those nodes stripped by ProseMirror on load, meaning mentions are invisible in read-only mode.

## 2. What We're Building

A custom React NodeView for the Mention node that:

1. Reads `attrs.id` from the mention node
2. Queries the graph store for the entity's live title
3. Falls back to `attrs.label` if the entity is not found (deleted/missing)
4. Re-renders reactively when the entity's title changes in the store
5. Supports click-to-navigate (clicking a mention opens the referenced entity) — this was deferred from PRD0018 (Open Decision #5)

This replaces TipTap's default mention rendering, which draws `attrs.label` as static text. The storage schema (`attrs.id` + `attrs.label`) remains unchanged — the label is still written at insert time, it's just no longer used as the display source of truth.

### 2.1 Why a NodeView (not `renderLabel`)

TipTap's Mention extension offers a `renderLabel` option (`({ node }) => string`), but it is a pure function called once at render time — it does not reactively update when the store changes. A React NodeView (`ReactNodeViewRenderer`) mounts a real React component that subscribes to the Zustand store and re-renders whenever the entity title changes, even while the editor stays open.

## 3. Architecture

```
TiptapEditor.tsx                    — CustomMention extension with addNodeView()
├── ReactNodeViewRenderer(MentionNodeView)

RichTextContent.tsx                 — Same CustomMention extension (no suggestion)

MentionNodeView.tsx                 — React NodeView component
├── useGraphStore(s => s.entities.find(e => e.id === entityId)?.title)
├── node.attrs.id                   — Stable entity reference
├── entity?.title ?? node.attrs.label  — Live title with fallback
└── onClick → navigate (only when !editor.isEditable)
```

### 3.1 Component: `MentionNodeView`

File: `src/components/tiptap/MentionNodeView.tsx`

```tsx
import { NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useGraphStore } from "@/store/useGraphStore"

export function MentionNodeView({ node, editor }: NodeViewProps) {
  const entityId = node.attrs.id as string

  const label = useGraphStore(
    (s) => s.entities.find((e) => e.id === entityId)?.title
  ) ?? (node.attrs.label as string)

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
```

Key decisions in this component:
- **No `NodeViewContent`** — the mention node's `content` is set to `""` (no text content slot). The display comes entirely from the NodeView, avoiding double rendering. ProseMirror copy/paste still works because `attrs.id` and `attrs.label` survive JSON round-trip.
- **Targeted store selector** — `useGraphStore((s) => s.entities.find(...)?.title)` subscribes only to the specific entity's title, not the entire entities array.
- **Editable guard** — `handleClick` returns early when `editor.isEditable` and no modifier key (`metaKey`/`ctrlKey`) is pressed. A plain click in edit mode places the cursor normally; Cmd/Ctrl-click navigates, opening the entity in a new tab.
- **Fallback** — if the entity is not found in the store (deleted), `node.attrs.label` is displayed.

### 3.2 Extension Wiring

A custom NodeView is attached via `Mention.extend({ addNodeView() })`, not via `configure()`:

```ts
import Mention from "@tiptap/extension-mention"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { MentionNodeView } from "./MentionNodeView"

const CustomMention = Mention.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView)
  },
})
```

`ReactNodeViewRenderer` is inlined in `addNodeView()` — no separate factory file needed.

### 3.3 Wiring in `TiptapEditor.tsx`

Replace `Mention` with `CustomMention` in the extensions array:

```tsx
const editor = useEditor({
  extensions: [
    // ... other extensions
    CustomMention.configure({
      HTMLAttributes: { class: "text-primary font-medium" },
      suggestion: {
        items: ({ query }) => { /* existing query */ },
        render: mentionSuggestionRenderer,
      },
    }),
  ],
})
```

### 3.4 Wiring in `RichTextContent.tsx`

Add `CustomMention` (no suggestion config) so mention nodes render in read-only mode instead of being stripped:

```tsx
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import CustomMention from "./CustomMention" // or re-define inline

const editor = useEditor({
  extensions: [
    StarterKit,
    CustomMention,
  ],
  content: parseContent(content),
  editable,
})
```

## 4. Interaction Design

| Action | Behavior |
|--------|----------|
| Open document with mentions | Each mention resolves `attrs.id` against the graph store and displays the current entity title |
| Rename entity | If the document is open, mentions re-render reactively within the same React lifecycle |
| Click mention (in read-only) | Navigate to the referenced entity (opens in new tab) |
| Click mention (in editable) | Single click places cursor as normal. Modifier-click (Cmd/Ctrl) navigates, opens in new tab |
| Entity deleted | Mention shows `attrs.label` as fallback — the entity ID is in the data but user sees the original label |
| Copy/paste mention | Standard ProseMirror serialization — `attrs.id` and `attrs.label` are preserved in JSON; HTML uses `data-id` and `data-label` attributes |
| Undo/redo mention edit | Standard ProseMirror undo/redo — NodeView re-renders with stored attrs |

## 5. Visual Design

Mentions render inline as styled spans, identical to the current default:

- `class="mention text-primary font-medium"`
- Background: subtle highlight (TBD — may add `bg-primary/10` or similar for visual distinction)
- Cursor: pointer (clickable)
- Color: uses existing `text-primary font-medium` from `HTMLAttributes`
- No border, no padding change from current behavior

**Changes from current rendering:**
- The span content reads from the graph store instead of static `attrs.label`
- On hover, show a subtle tooltip or underline indicating clickability (future enhancement)
- On click, navigate to entity (read-only mode)

## 6. Files Changed

| File | Change |
|------|--------|
| `src/components/tiptap/MentionNodeView.tsx` | **New** — React NodeView component subscribing to graph store |
| `src/renderers/TiptapEditor.tsx` | Add `nodeView: MentionNodeViewRenderer` to Mention extension config |
| `src/renderers/RichTextContent.tsx` | Add Mention extension with NodeViewRenderer (read-only support) |
| `dev-docs/roadmap.md` | Mark Phase 3.x as complete, update Recently Completed |
| `dev-docs/changelog.md` | Add entry |
| `dev-docs/plans/tiptap-ui.md` | Update Phase 3.3 with nodeview completion |

## 7. Dependencies

No new NPM packages. Existing dependencies:

- `@tiptap/react` — provides `NodeViewWrapper`, `NodeViewContent`, `ReactNodeViewRenderer`
- `@tiptap/extension-mention` — the node type we're extending
- `zustand` — `useGraphStore` selector for reactive entity title resolution

## 8. Acceptance Criteria

1. Mention in editable editor shows the **current** entity title, not the stale `attrs.label`
2. Renaming the entity in the sidebar causes the mention to update reactively in the open editor
3. Read-only mode (RichTextContent) renders mention nodes with live title — no longer strips them
4. Deleting an entity causes the mention to fall back to `attrs.label`
5. Clicking a mention in read-only navigates to the entity (`?focused=<id>`)
6. Copy/paste preserves `attrs.id` and `attrs.label` in JSON round-trip
7. `npx tsc --noEmit` passes
8. `npm run build` succeeds

## 9. Testing & Verification

### 9.1 Manual test procedure

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Mention shows live title | Open Editor Playground, insert @About This Workspace mention. Rename "About This Workspace" to "Welcome" in sidebar. Re-open Playground. | Mention displays "@Welcome" |
| 2 | Reactive update | Open Playground (has mention). Rename entity in sidebar. Switch back to Playground tab. | Mention updates without page reload |
| 3 | Read-only rendering | Navigate to a non-Playground container whose content has a mention (or inject one). | Mention renders as styled span with live title, not stripped |
| 4 | Click navigation | Click a mention in read-only content (SegmentCard in reading viewport). | Browser navigates to the referenced entity |
| 5 | Deleted entity fallback | Delete the entity, load a document that mentions it. | Mention renders with original `attrs.label`, styled normally |
| 6 | JSON round-trip | `editor.getJSON()` → `editor.setContent(json)` | Mention node preserves `attrs.id` and `attrs.label` |

### 9.2 Type checking

```bash
npx tsc --noEmit
```

### 9.3 Build

```bash
npm run build
```

## 10. Out of Scope

- **Hover tooltip showing entity metadata** — future enhancement
- **Context menu on right-click** — covered in TipTap paid plan (drag context menu)
- **Bulk updating existing stored mentions** — `attrs.label` is still written correctly at insert time; stale labels from before this PRD are a data migration concern, not a code concern
- **Mention in non-root containers** — search scope remains root containers only (Open Decision #4)
- **Slash commands popup** — separate PRD

## 11. Open Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Click behavior in editable mode | Single-click places cursor (normal editing). Navigation only in read-only mode. In edit mode, use modifier-click to navigate (opens in new tab). |
| 2 | NodeViewContent vs pure render | Pure render — `content: ""` on the mention schema, display comes entirely from NodeView. Requires testing that JSON round-trip preserves `attrs.id` and `attrs.label`. |
| 3 | Mention styling for clickability | Start with `cursor: pointer` in read-only, `cursor: default` in editable. Add visual hint (underline/bg) only if users miss clickability. |


# prd critique

The core idea is solid — a React NodeView subscribing to the Zustand store for live title resolution is the right approach. But there are a few issues in the implementation details:

## 1
TipTap API error. ‎`Mention.configure({ nodeView: MentionNodeViewRenderer })` isn’t how TipTap works. ‎`configure()` only accepts the extension’s declared options. To attach a custom NodeView, you need ‎`Mention.extend()`:

```ts
const CustomMention = Mention.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView)
  },
})
// then: CustomMention.configure({ suggestion: { ... } })

```

This is the main thing that would break if someone tried to implement from this PRD as-is.

## 2
Double rendering in the sample code. The component renders both ‎`<NodeViewContent as="span" />` (ProseMirror’s node content) AND ‎`<span>@{label}</span>`. That would show the label twice. The PRD flags this as a decision point, but the code example should reflect one approach, not both simultaneously.


## 3
Store selector is too broad. ‎`useGraphStore((s) => s.entities)` subscribes to the entire entities array — any entity change re-renders every mention on screen. A targeted selector would be better:

```ts
const title = useGraphStore(
  (s) => s.entities.find((e) => e.id === entityId)?.title
)

```

## 4
Click handler fires in edit mode. The ‎`onClick` navigates unconditionally, but in editable mode a click should place the cursor. The PRD calls this out as Open Decision #1, but the code doesn’t guard for it — worth adding a ‎`if (!editor.isEditable)` check in the example so the implementer doesn’t copy-paste the wrong behavior.

## 5
Minor: The separate ‎`MentionNodeViewRenderer.ts` factory file is a one-liner. Could just inline ‎`ReactNodeViewRenderer(MentionNodeView)` in ‎`addNodeView()` and skip the extra file.

Everything else — the fallback to ‎`attrs.label`, keeping the storage schema unchanged, adding Mention to RichTextContent, the acceptance criteria — looks right.