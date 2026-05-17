# Initiative: Graph Canvas (i1)

Running in parallel with m3 (Tiptap editor).

## Architectural Direction

Entity Graph → Projection Layer → Reading Workspace.

Entities carry content. Relations carry typed links with sort order. Projections (thread queries) interpret the graph into ordered sequences. React Flow is one renderer among many — the graph is infrastructure, not interface.

## Anti-Overengineering Guardrail

- Don't implement Later items unless promoted to Now.
- Speculative ideas: one bullet, move on.

---

## ✅ Phase I — Isolate Product (Complete)

PRD0024: Installed react-router-dom, extracted legacy app to `/tiptap-editor-test`, created workspace shell at `/`. All three steps (I.1–I.3) done in one pass.

- **I.4** MongoDB / DexieJS migration → **Moved to Later**

---

## Phase II — Graph Canvas

### Now

- Transition to Phase II (next PRD)
- **II.5** Schema alignment — add `sortOrder` to `Relation` type, adopt fractional-indexing for edge ordering
- **II.6** Data API — extend `useGraphStore` with `getEdgesForNode`, `queryThread`
- **II.7** Install React Flow — render static graph with Dagre layout

### Next (m6)

- **II.8** Node/edge CRUD — double-click, drag, context menu, always-visible edge labels
- **II.9** Implement `queryThread` — the ordered projection that makes "documents" possible

### Later (m7+)

- **II.10** Thread view component — vertical list of query results with metadata strip and inline inspector
- **II.11** Query builder UI — target dropdown + relation type dropdown + Show Thread button
- **II.12** Highlight active thread in the graph canvas
- **I.4** MongoDB persistence adapter (or alternative embedded DB)

---

## Notes

- `sortOrder` on relations is the key schema gap between current `Entity`/`Relation` and proposed `Node`/`Edge`
- Thread view starts as plain text blocks — Tiptap integration comes after m3 converges
- Data API wraps Zustand store initially; can be extracted into standalone query layer later
