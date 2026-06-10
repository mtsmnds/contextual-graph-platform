# m7 — Card & Content UI

## Goal

The card is the universal atomic unit for displaying and editing graph entities — reusable across canvas, threaded view, side panels, and dialogs, with a content editor that works anywhere.

## Tasks

| # | What | Effort | Depends on |
|---|------|--------|------------|
| 1 | ✅ **Reusable ContentEditor** — `dev-docs/plans/m7-prd0071-content-editor.md`. Extracted textarea + edit state machine from `EntityNode.tsx` into standalone component. | Done | SegmentCard already clean |
| 2 | **SegmentCard visual variants** — `dev-docs/plans/m7-prd0072-segment-card-variants.md`. Add `bordered` / `none` / `hover` variants to SegmentCard with real CSS. | Small | #1 |
| 3 | **Dialog for long-form editing** — portal component that opens a segment's content in a larger textarea. Cancel → discard, click-outside → save. Uses ContentEditor + SegmentCard internally. | Small | #2 |
| 4 | **Collapse/accordion for containers** — container component that reads children via `contains` edges + `sortOrder`, renders each as a collapsible section. Works inside or outside ReactFlow. Connects to store directly (container/presenter split). | Medium | #2 |
| 5a | **Syntax-aware rendering (always-editable)** — markdown tokens render inline in the textarea (VS Code / iA Writer style). `**bold**` renders bold, `_italic_` renders italic, markers stay visible and editable. No view/edit mode switch — same textarea, richer display. | Medium | #2 |
| 5b | **User toggle (raw ↔ syntax)** — add a toggle so the user can switch between raw textarea and syntax-rendered mode. | Small | 5a |

## Acceptance

- ContentEditor can be mounted in any component without a ReactFlow provider
- Dialog opens from canvas context menu or sidebar, saves on close
- Accordion collapses a container's children; parent container still shows relation edges when collapsed
- Phase 4a: `**bold**` and `_italic_` render inline while markers stay visible and editable
- Phase 4b: user toggle switches between raw and syntax-rendered modes

## Risk

Low — all UI work. Seed data is sufficient for development and Storybook. No routing, adapter, or store architecture changes.
