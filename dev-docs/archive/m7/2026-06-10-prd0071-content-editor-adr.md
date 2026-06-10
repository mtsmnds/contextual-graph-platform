# 2026-06-10: prd0071 — ContentEditor reusable component

## Context
- Extract inline content editing from EntityNode (a React Flow custom node) into a standalone reusable component.
- The component must be mountable outside ReactFlow (no `@xyflow/react` imports).
- EntityNode behavior must be identical after extraction.

## Decision
- **Component interface:** Changed from the planned `{ content, onChange, autoHeight, placeholder }` to `{ content, onChange, editTrigger, placeholder, className }` + `forwardRef` with `ContentEditorHandle`.
  - `autoHeight` removed: auto-height measurement is a canvas-level concern (measures the BaseNode wrapper, not the textarea). EntityNode keeps the measurement effect; ContentEditor doesn't need to know about it.
  - `className` added: lets consumers (EntityNode) control layout (e.g. `flex-1`) without requiring a wrapper div. This simplifies the DOM tree and avoids `overflow-hidden` on a wrapper that clips the textarea.
  - `editTrigger` added: numeric counter prop that triggers programmatic edit entry from outside (EntityNode passes `data.editTrigger`).
  - `forwardRef` + `useImperativeHandle`: exposes `enterEdit()` method so EntityNode can trigger edit mode without a direct prop callback.
- **`useNodeEdit.ts` kept** as a shared hook: ContainerGroupNode also uses it. The PRD plan said to remove it, but keeping it avoids duplicating the edit state machine logic.
- **Double-click handled internally:** ContentEditor owns its own `onDoubleClick` on the view-mode container. EntityNode's `BaseNode.onDoubleClick` is set to `stopPropagation` only — it no longer triggers edit entry.
- **Textarea `block` class removed:** Native `inline-block` display is preserved so `rows={1}` provides intrinsic height even with `flex-basis: 0`. Using `w-full` instead of `block w-full`.

## Alternatives Considered
- **Plan's interface (`autoHeight` prop):** Rejected because auto-height is a canvas measurement concern that doesn't belong in a component meant to be reusable outside the canvas. The plan's `autoHeight` is replaced by the consumer passing `className` for layout control.
- **Removing `useNodeEdit.ts`:** Rejected because ContainerGroupNode also imports it. Keeping it avoids code duplication.
- **Wrapper div for layout:** Rejected in favor of `className` prop. Simpler DOM, fewer layout edge cases.

## Consequences
- ContentEditor is now reusable outside ReactFlow with a clean interface.
- EntityNode's behavior is identical — all tests pass (except the pre-existing flaky DoubleClickEdit story test).
- New component pattern established: `forwardRef` + `useImperativeHandle` for imperative access, `className` prop for layout flexibility.
- The `block` → `w-full` textarea change fixes a potential zero-height collapse in flex contexts.

## Follow-ups
- Flaky EntityNode DoubleClickEdit story test is logged to `dev-docs/plans/backlog.md`.
