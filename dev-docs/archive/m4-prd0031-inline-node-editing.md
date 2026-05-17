> **Completion note (2026-05-17):**
> - **What was built:** Schema migration (dropped `title`, made `content: string` required, v2→v3 snapshot) and inline text editing inside EntityNode via `<textarea>` with Figma-pattern idle/editing states. Context menu triggers inline edit. New nodes open in edit mode immediately. Auto-sizing height with hidden-div mirror, commit on Escape/blur, Enter = newline.
> - **Key decisions:** `content` becomes the single display text field. Old titles preserved in `metadata.title` during migration. `editTrigger` counter on node data for external edit triggers (avoids stale boolean flag issues). Textarea over contentEditable (avoids React DOM ownership fights). NodeDialog removed entirely — kind changes deferred.
> - **Deviations from plan:** Connection handles deferred to PRD0032. Node resize deferred to PRD0032.
> - **Postponed:** Connection handles (PRD0032), node resize (PRD0032).

## Task: Inline Node Editing

### Purpose

Enable inline text editing directly inside graph nodes, matching the Figma/Figjam pattern: single-click selects the node, double-click enters text edit mode. This is two coordinated moves that ship together but are documented distinctly: (1) schema cleanup — drop `title`, consolidate on `content`, (2) inline `<textarea>` inside the custom `EntityNode` component.

### Scope

- Schema migration: remove `title` from Entity type, make `content: string` required (default `""`), bump snapshot version 2→3, add load-time migration
- EntityNode inline editing: idle/editing states, `nodrag nowheel nopan` on the textarea, auto-sizing height with hidden-div mirror
- EntityNode handles its own `onDoubleClick` internally — GraphCanvas's `onNodeDoubleClick` handler is removed entirely
- Context menu "Edit" action triggers inline edit mode on the node (sets `isEditing = true`) instead of opening NodeDialog
- New node creation immediately enters edit mode on the new node (cursor placed in textarea)
- Commit: Enter = newline (native textarea behavior). Escape or blur = commit to store. Click-away while editing commits automatically via blur.
- Ripple effects: `layout.ts`, `GraphCanvas.tsx`, `NodeDialog.tsx`, store `addEntity`, FSAccess persistence
- Height grows with content (fixed 200px width, max-height 300px), `useUpdateNodeInternals` on resize
- Local state while editing, `updateEntity` on commit only (no per-keystroke store writes)
- Empty node shows placeholder text

### Out of scope

- Rich text / Tiptap in nodes (separate milestone)
- Multiple node types with different layouts
- `title` field semantics — add it back only when needed for multi-type nodes
- Markdown rendering in idle mode — plain text for now
- Node resize handles

### Schema Change

#### Rename `title` → `content`

Current `Entity` type has both as optional. Cleanest path: drop `title`, make `content: string` required.

| Before | After |
|---|---|
| `title?: string` / `content?: string` | `content: string` (required, default `""`) |

Migration (v2 → v3): entities with `title` but no `content` get `content = title`. Bump `GraphSnapshot.version` from 2 to 3.

#### Ripple effects

- `layout.ts`: `entity.title || entity.id` → `entity.content || entity.id`
- `GraphCanvas.tsx`: `onNodeDoubleClick` handler removed entirely — EntityNode owns double-click internally. `handleNodeDialogConfirm` drops `title` references. Context menu "Edit" action triggers inline edit on the node instead of opening NodeDialog.
- `NodeDialog.tsx`: no longer needed for content editing; may be kept for `kind` selection via context menu
- `EntityNode.tsx`: accepts optional `initialEditing` prop — set to `true` when creating a new node so it opens in edit mode immediately
- Store `addEntity`: parameter `{ title?: string }` → `{ content?: string }`
- FSAccess persistence: `saveGraph` serialization drops `title` automatically; old files need migration

### Inline Editing — The Figma Pattern

Three states, one element:

| State | Renders | CSS | Behavior |
|---|---|---|---|
| Idle / selected | `<p>` with content text | No border, transparent bg, `cursor: grab` | Click = select node. Drag = move node. |
| Editing | `<textarea>` with content | `nodrag nowheel nopan`. Subtle outline. `cursor: text`. | Type freely. Click outside or Escape = commit and exit. |

Critical UX: single-click selects the node (for drag/delete), double-click enters text editing mode. EntityNode owns its own `onDoubleClick` handler — GraphCanvas's `onNodeDoubleClick` is removed entirely to avoid conflict.

### Implementation Notes

#### Height auto-sizing

- Hidden `<div>` mirror with same font/padding/width — read `scrollHeight`, apply to textarea
- Fixed width 200px, max-height 300px before overflow
- Call `useUpdateNodeInternals` after height changes so edges re-route correctly

#### Commit strategy

- Keep local `value` state while editing
- Enter = newline (native `<textarea>` behavior — do not intercept)
- Escape or blur (click outside, click another node, context menu action) = commit to store via `updateEntity(id, { content: value })`
- Click-away while editing: blur fires naturally → commit happens automatically. No special handling needed.
- No per-keystroke store writes

#### Visual continuity

- Same Tailwind text classes on both `<p>` and `<textarea>`
- Textarea: `resize: none`, `border: none`, `outline: none`, `background: transparent`, `font: inherit`
- Match padding exactly between idle and editing states

#### Empty state

- When `content` is empty, show placeholder "Type here..." in `text-muted-foreground`
- On double-click, placeholder disappears, cursor appears

#### `<textarea>` over `contentEditable`

Textarea chosen for v1 despite needing the height-mirror hack. `contentEditable` + React is a minefield (cursor jumping, resetting selection). Tiptap swap can come later.

### Files to change

- `src/types/graph.ts` — drop `title`, make `content: string` required, bump snapshot version
- `src/store/useGraphStore.ts` — v2→3 migration in `init`, update `addEntity` signature
- `src/canvas/nodes/EntityNode.tsx` — add idle/editing states, textarea, height mirror, commit logic
- `src/engine/layout.ts` — `entity.title` → `entity.content`
- `src/canvas/GraphCanvas.tsx` — remove `title` references from double-click and dialog handlers
- `src/canvas/NodeDialog.tsx` — remove title field (or repurpose for kind-only edit)
