# Roadmap

## Purpose
Forward-looking work: milestones, current priorities, backlog.
Completed work goes in `changelog.md`.

## Usage Rules
- `roadmap.md` = planned work (Now/Next/Later).
- `changelog.md` = completed work.
- Rolling "Recently Completed" section (max 7 days), then promote to `changelog.md`.

---

## Architectural Direction (Established 2026-05-13)

The current codebase tightly couples domain entities to React Flow nodes. Per the architecture review, this is being corrected:

```
Entity Graph → Projection Layer → Renderer
```

React Flow becomes one renderer among many, not the core runtime. The domain model (Entity/Relation) is decoupled from view state. Content is native to entities, not a separate `docId` pointer. Behaviors belong to the interaction layer, not the graph store.

This shift reorders the roadmap significantly: **validate contextual reading first, graph visualization last.**

---

## Milestones

### M1 — Domain Engine (Entity/Relation schema ✅, Query engine ✅, Seed content ✅)
- ~~Entity/Relation schema (decoupled from React Flow)~~ ✅
- Persistence layer (localStorage → SQLite)
- ~~Query engine (getEntity, getRelations, getSequentialContext, getLinkedContext)~~ ✅
- ~~Seed content for validation~~ ✅

### M2 — Reading Workspace
- Focused entity viewport with sequential traversal (PRD0004)
- Full text import at scale (PRD0005)
- Side-panel contextual expansion
- Annotation creation (highlight + note)

### M3 — Projection Layer
- Multiple graph interpretations: reading, outline, thematic, notes
- Renderer abstraction

### M4 — Graph Visualization
- React Flow re-introduced as optional spatial renderer
- Only after domain model, projections, and reading UX are stable

---

## Recently Completed (Rolling)
- 2026-05-13 — Typed data layer + Zustand store + React Flow canvas (tightly-coupled; refactored in PRD0002)
- 2026-05-13 — Domain engine refactor (PRD0002): Entity/Relation schema, query engine, fresh seed data. See `archive/2026-05-13-domain-engine-refactor.md`
- 2026-05-13 — Persistence layer (PRD0003): localStorage auto-save, hydration, export/import
- 2026-05-13 — Reading viewport (PRD0004): focused entity display, prev/next navigation, mode-switch rendering, shadcn/ui + Tailwind foundation

## Now (Current Sprint)
- **Full text import (PRD0005)** — Hamlet from Gutenberg HTML parsed into ~775 entities + ~800 relations via build-time script. Validates the reading experience at scale.

## Next (Near-Term)
- Side-panel contextual expansion

## Later (Backlog)
- Side-panel contextual expansion
- Annotation creation (highlight + note)
- Multi-column reading workspace
- Projection layer abstractions
- React Flow graph visualization (Phase 4+)
- Tauri packaging
- Undo/redo
- Keyboard shortcuts and accessibility
- File System Access API (showSaveFilePicker) for export/import to user-chosen folder

## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
- React Flow stays dormant until Phase 4 — resist the urge to build graph UI early.
