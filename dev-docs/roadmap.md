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

Entity Graph → Projection Layer → Reading Workspace. The domain model (Entity/Relation) is decoupled from view state. Content is native to entities. App is a single-mode reading workspace with a permanent sidebar. Graph visualization (React Flow) is deferred — validate reading + editing first.

---

## Now

- **Slash commands / toolbar overhaul** — replace persistent toolbar with `/` command menu and floating menubar (PRD0017 draft). Slash commands still TBD.
- **Sidebar child hierarchy** — expandable tree via `contains` relations
- **Delete / rename pages from sidebar**

## Next

- **Context columns v1** — horizontal navigation through related context (work → author → reference), 3 columns
- **Dev tools panel** — button showing focused node's full JSON data
- **Annotation creation** — selection → annotation entity + `annotates` relation
- **Mode switcher** — page / tree / graph, each URL-addressable
- **Editor performance** — isolate TipTap instance in its own component to prevent unrelated renders from rebuilding ProseMirror document; use `useEditorState` for toolbar active states
- **Page reordering in sidebar**

## Later

- Multi-column workspace (column reordering, horizontal sync)
- Image upload — server endpoint or local file storage? (tiptap-ui plan open decision #2)
- Sample data re-import (Gutenberg parser with new ID scheme)
- "Talmud mode" — show all annotations at once
- Graph visualization (React Flow) — layout algorithms, filtering, node grouping, search
- Self-hosting roadmap — the roadmap as entities and relations in the graph
- Projection layer abstractions
- Tauri packaging
- Undo/redo
- Keyboard shortcuts and accessibility

## Anti-Overengineering Guardrail
- Don't implement `Later` items unless promoted to `Now`.
- Speculative ideas: one bullet, move on.
- React Flow stays dormant until promoted to Now — resist the urge to build graph UI early.
