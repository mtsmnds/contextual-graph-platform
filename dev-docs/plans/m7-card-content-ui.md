# m7 — Card & Content UI

## Goal

The card is the universal atomic unit for displaying and editing graph entities — reusable across canvas, threaded view, side panels, and dialogs, with a content editor that works anywhere.

## Tasks

| # | What | Effort | Depends on |
|---|------|--------|------------|
| 1 | **Reusable ContentEditor** — the textarea + auto-expand + inline-edit state machine currently lives in `EntityNode.tsx` (lines 40-90). Extract into `src/components/ContentEditor.tsx`. EntityNode imports it. Always-editable textarea — pure extraction, no behavior change. | Small | SegmentCard already clean |
| 2 | **Dialog for long-form editing** — portal component that opens a segment's content in a larger textarea. Cancel → discard, click-outside → save. Uses ContentEditor + SegmentCard internally. | Small | #1 |
| 3 | **Collapse/accordion for containers** — container component that reads children via `contains` edges + `sortOrder`, renders each as a collapsible section. Works inside or outside ReactFlow. Connects to store directly (container/presenter split). | Medium | #1 |
| 4a | **Syntax-aware rendering (always-editable)** — markdown tokens render inline in the textarea (VS Code / iA Writer style). `**bold**` renders bold, `_italic_` renders italic, markers stay visible and editable. No view/edit mode switch — same textarea, richer display. | Medium | #1 |
| 4b | **User toggle (raw ↔ syntax)** — add a toggle so the user can switch between raw textarea and syntax-rendered mode. | Small | 4a |

## Acceptance

- ContentEditor can be mounted in any component without a ReactFlow provider
- Dialog opens from canvas context menu or sidebar, saves on close
- Accordion collapses a container's children; parent container still shows relation edges when collapsed
- Phase 4a: `**bold**` and `_italic_` render inline while markers stay visible and editable
- Phase 4b: user toggle switches between raw and syntax-rendered modes

## Risk

Low — all UI work. Seed data is sufficient for development and Storybook. No routing, adapter, or store architecture changes.
