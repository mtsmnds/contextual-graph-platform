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

Entity Graph → Projection Layer → Reading Workspace. The domain model (Entity/Relation) is decoupled from view state. Content is native to entities. App is a single-mode reading workspace with a permanent sidebar. Graph visualization (React Flow) is deferred — validate reading + editing + relational linking first.

---

## Now

* m3 - p3 - multi-column view
  * reading viewport becomes multi-column layout
  * "+ Column" button to add a document (or create new)
  * each column is an independent editor. Only one focused at a time.

## Next

* m3 - p4 - drag-to-link between columns
  * passage blocks get border elevation on hover. Drag arrow from one passage to another across columns. Relation type picker on drop. Creates anchors + entity + relations atomically.
* m3 - p5 - metadata display
  * outgoing/incoming link indicators ("quoted in [book]", "quoted by [book]"). Blockquote rendering for linked passages.

## Later

- Dev tools panel — button showing focused node's full JSON data
- Mode switcher — page / tree / graph, each URL-addressable
- Editor performance — isolate TipTap instance; use `useEditorState` for toolbar active states
- Slash commands / toolbar overhaul — replace persistent toolbar with `/` command menu and floating menubar (PRD0017 draft)
- Sidebar child hierarchy — expandable tree via `contains` relations
- Delete / rename pages from sidebar
- Multi-column workspace polish (column reordering, horizontal sync)
- Image upload — server endpoint or local file storage?
- Sample data re-import (Gutenberg parser with new ID scheme)
- "Talmud mode" — show all annotations at once
- Graph visualization (React Flow) — layout algorithms, filtering, node grouping, search
- Self-hosting roadmap — the roadmap as entities and relations in the graph
- Projection layer abstractions
- Tauri packaging
- Undo/redo
- Keyboard shortcuts and accessibility

## Known Issues

- **Duplicate relations** — `addRelation` doesn't deduplicate. If the user clicks "Link" twice, two identical relations are created between the same source and target. Fix: check for existing relation before creating, or dedup on save.

## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
- React Flow stays dormant until promoted to Now — resist the urge to build graph UI early.
