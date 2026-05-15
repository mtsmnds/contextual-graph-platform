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

* m3 - p2 - cross-document passage linking
  * extend mention popup to handle passage linking. Select text → create passage → "Link to passage…" → pick target document → browse/search its passages → create Relation
  * works in single-document view (no columns yet)
  * a new kind of relation or a new command?

## Next

* m3 - p3 - multi-column view
  * reading viewport becomes multi-column layout
  * "+ Column" button to add a document (or create new)
  * each column is an independent editor. Only one focused at a time.
* mX - dev tools panel — button showing focused node's full JSON data
* mX - mode switcher — page / tree / graph, each URL-addressable
* mX - editor performance — isolate TipTap instance in its own component; use `useEditorState` for toolbar active states

## Later

- **Phase 4 — Drag-to-link between columns** — passage blocks get border elevation on hover. Drag arrow from one passage to another across columns. Relation type picker on drop. Creates anchors + entity + relations atomically.
- **Phase 5 — Metadata display** — outgoing/incoming link indicators ("quoted in [book]", "quoted by [book]"). Blockquote rendering for linked passages.
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

- **Duplicate relations** — `addRelation` doesn't deduplicate. If the user clicks "Link" twice (or the dialog fires twice), two identical relations are created between the same source and target. Fix: check for existing relation before creating, or add a dedup step.
- **Annotation entities have no titles** — Labels are derived at render time via `getPassageLabel()`, which extracts anchored text from the source document. This means labels can't be searched or displayed in entity lists without loading the source document. Fix: store a derived label on `metadata.label` at creation time (truncated anchored text).

## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
- React Flow stays dormant until promoted to Now — resist the urge to build graph UI early.
