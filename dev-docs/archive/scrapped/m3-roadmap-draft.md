> **STATUS: SCRAPPED — Not implemented. Retained for reference only.**

## Architectural Direction

Entity Graph → Projection Layer → Reading Workspace. The domain model (Entity/Relation) is decoupled from view state. Content is native to entities. App is a single-mode reading workspace with a permanent sidebar. Graph visualization (React Flow) is deferred — validate reading + editing + relational linking first.


## Now

* m3 - p3a - toolbar overhaul (PRD0017 Pass 1)
  * strip persistent toolbar, replace with floating menubar on editor focus
  * removes Radix dependencies (@radix-ui/react-popover, @radix-ui/react-dropdown-menu)
  * cleans up orphaned tiptap-ui components
  * prerequisite for multi-column: each column gets a menubar only when focused

## Next

* m3 - p3b - multi-column view (PRD0023)
  * reading viewport becomes multi-column layout
  * "+ Column" icon (icon-only, after last column, no bar), opens document picker popover
  * columns 420px min width + 12px gutters (432px slots)
  * editor padding / drag handle responsive at narrow widths
  * each column is an independent editor. Only one focused at a time.

* m3 - p4 - drag-to-link between columns
  * passage blocks get border elevation on hover. Drag arrow from one passage to another across columns. Relation type picker on drop. Creates anchors + entity + relations atomically.

* m3 - p5 - metadata display
  * outgoing/incoming link indicators ("quoted in [book]", "quoted by [book]"). Blockquote rendering for linked passages.

## Later

- Dev tools panel — button showing focused node's full JSON data
- Mode switcher — page / tree / graph, each URL-addressable
- Editor performance — isolate TipTap instance; use `useEditorState` for toolbar active states
- Slash commands (PRD0017 Pass 2) — `/` command menu for block insertion, `+` button on drag handle
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