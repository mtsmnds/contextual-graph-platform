# Roadmap

## Purpose
Forward-looking work: what we're doing now, next, and later.
Completed work goes in `changelog.md`.

## Usage Rules
- `roadmap.md` = planned work (Now/Next/Later).
- `changelog.md` = completed work — the source of truth for what's done.
- When a task is finished, move it from roadmap to changelog. Don't keep completed items in roadmap.

---

## Architectural Direction

Entity Graph → Projection Layer → Reading Workspace.

The domain model (Entity/Relation) is decoupled from view
state. Content is native to entities. The app is a
single-surface reading workspace with a permanent sidebar
— different projections (queries) of the same graph render
as navigable threads. Graph visualization (React Flow) is
deferred to a later milestone; validate reading, editing,
and relational linking on the thread view first.

---

## Now

- m4 - prd0024 - isolate current product. 



## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
