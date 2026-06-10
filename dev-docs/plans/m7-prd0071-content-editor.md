# PRD 0071: ContentEditor — Reusable Content Editing Component

## Overview

Extract the inline content editing experience from `EntityNode.tsx` into a standalone `ContentEditor` component. The textarea, edit state machine, auto-height measurement, and view-mode display currently live inline in a React Flow custom node — they need to be reusable across canvas, dialogs, threaded views, and any future surface.

## Scope

Extraction only — no behavior change. The component works identically in EntityNode after extraction. Markdown rendering (Phase 4a/4b) is a separate PRD.

## What Gets Extracted

From `src/canvas/nodes/EntityNode.tsx` (lines 28-157):

| Piece | Current location | New home |
|-------|-----------------|----------|
| Edit state machine (`useNodeEdit`) | `src/canvas/hooks/useNodeEdit.ts` | Move to `src/components/ContentEditor.tsx` (internal, not a hook) |
| Textarea JSX | EntityNode lines 128-141 | `ContentEditor` render |
| View-mode `<p>` | EntityNode lines 142-148 | `ContentEditor` render |
| Auto-height measurement effect | EntityNode lines 46-59 | `ContentEditor` internal |
| Textarea change handler | EntityNode lines 61-70 | `ContentEditor` internal |

## Interface

```tsx
type ContentEditorProps = {
  content: string
  onChange: (value: string) => void
  autoHeight?: boolean
  placeholder?: string
}

function ContentEditor({ content, onChange, autoHeight, placeholder }: ContentEditorProps): JSX.Element
```

The component owns:
- Edit mode state (viewing vs editing)
- Internal textarea ref and auto-focus
- Auto-height measurement and canvasData sync
- Escape to cancel, blur to commit
- View mode: renders content as text
- Edit mode: renders auto-expanding textarea

## Files Changed

| File | Change |
|------|--------|
| `src/components/ContentEditor.tsx` | **New** — standalone component |
| `src/components/ContentEditor.test.tsx` | **New** — tests for rendering, editing, auto-height guard |
| `src/canvas/nodes/EntityNode.tsx` | Remove inline textarea, auto-height effect, `useNodeEdit` import. Import and render `<ContentEditor>` instead. |
| `src/canvas/hooks/useNodeEdit.ts` | Remove (logic merged into ContentEditor) |

## What EntityNode Keeps

EntityNode stays as the React Flow boundary component. It keeps:
- `useNodeId`, `NodeResizeControl` (React Flow specific)
- `useResizePersistence` (canvas-specific resize)
- `BaseNode`, `BaseNodeContent`, `BaseHandle`, `SegmentCard` (layout shell)
- `onDoubleClick` → calls `ContentEditor`'s enterEdit (forwarded via ref or state)

## Acceptance Criteria

- AC1: ContentEditor renders view-mode `<p>` when not editing, textarea when editing — same as EntityNode behavior today.
- AC2: Double-click on view mode enters edit mode, auto-focuses textarea.
- AC3: Escape cancels edit, restores original content.
- AC4: Blur commits the current value via `onChange`.
- AC5: Auto-height mode measures DOM height and calls `onAutoHeight(height)` on content change.
- AC6: `autoHeight` prop controls whether auto-height measurement is active.
- AC7: EntityNode behavior is identical before and after — textarea, resize controls, auto-height, and commit/cancel all work the same.
- AC8: ContentEditor can be mounted outside ReactFlow (no `@xyflow/react` imports).
- AC9: Unit tests cover rendering (both modes), textarea change, auto-height guard (>1px threshold), escape cancel.

## Effort

Small — pure extraction of already-working code into its own file. No new behavior, no architectural changes.

## Risk

Low. The logic is well-understood and currently working. The only risk is a missed import or ref type during extraction. Mitigated by: existing EntityNode tests should pass unchanged after the refactor.
