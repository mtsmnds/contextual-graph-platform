# Roadmap

## Purpose
Forward-looking work: milestones, current priorities, backlog.
Completed work goes in `changelog.md`.

## Usage Rules
- `roadmap.md` = planned work (Now/Next/Later).
- `changelog.md` = completed work.
- Rolling "Recently Completed" section (max 7 days), then promote to `changelog.md`.

---

## Milestones

### M1 - Core Graph MVP (in progress)
- Typed graph schema (NodeKind, EdgeKind, EdgeBehavior)
- Zustand store with mutation actions
- Basic React Flow canvas with default node rendering

## Now (Current Sprint)
- None — scaffolding complete, planning next work.

## Next (Near-Term)
- Custom node components per NodeKind (phase, task, work, segment, annotation)
- Edge labels and interaction behaviors (draw-arrow, expand-lateral, etc.)
- Document panel tied to node selection

## Later (Backlog)
- Tauri packaging
- Rich text editing (TipTap) for documents
- Reading workspace (segments, annotations, commentary)
- Persistent/local storage
- Undo/redo support
- Keyboard shortcuts and accessibility

## Recently Completed (Rolling)
- 2026-05-13 — Typed data layer + Zustand store + React Flow canvas

## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
