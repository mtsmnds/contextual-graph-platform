# 2026-05-15: Content Separation — Graph vs Document Store

## Context

The graph data model stored document bodies inside entity records as `content?: string`. For new TipTap documents this meant stringified TipTap JSON embedded in `graph.json`. This violated graph best practices: entities carried heavyweight payloads, the graph couldn't be queried without parsing every document, and `graph.json` became unreadable. New container entities also received brittle slug-based IDs derived from the title field.

## Decision

Separate graph metadata from document content. The graph (`entities` + `relations`) lives in one localStorage key. Each container's TipTap document body lives in its own localStorage key (`react-roadmap:content:{id}`).

**In scope:**
- Remove `content` from the entity mutation path for containers (containers never get inline content)
- Add `getContent(id)`, `saveContent(id, data)`, `clearContent(id)` to the store
- ReadingViewport loads container content from the content store, not from `entity.content`
- Container IDs use `generateDocId()` — timestamp-based (`doc_{Date.now()}`), not slug-based
- Segment entities retain their `content` field (hamlet legacy, migrated later)

**Out of scope:**
- Hamlet content migration to TipTap JSON (separate PRD)
- File System Access API (app uses localStorage)
- Database/store abstraction (IndexedDB, SQLite — deferred)

## Alternatives Considered

- **Option A: Keep content in entity.** Simplest, but graph stays bloated. Rejected for violating separation of concerns.
- **Option B: Separate files via FS API.** Cleanest model, but FS API was recently removed. Reintroducing it now adds unnecessary complexity. LocalStorage content keys achieve the same separation with less code.
- **Option C: IndexedDB for content.** Proper for large docs, but adds IndexedDB setup/teardown. Deferred until document sizes warrant it.

## Consequences

**Positive:**
- `graph.json` (localStorage) stays lightweight — only entity metadata and relations
- Content loads on demand when a document is opened, not on every store read
- ID generation is stable (timestamp-based, independent of title)
- Multiple documents can have the same title (e.g., "Untitled") without ID collisions
- Content files can be independently edited/deleted without corrupting the graph

**Trade-offs:**
- Two localStorage reads instead of one (graph + content) when opening a document
- Content cached in-memory via `contentLoaded` Set — stale cache if localStorage is edited externally
- Segment entities still carry `content` inline (hamlet legacy) — dual model until migration

**Risks:**
- LocalStorage 5MB limit per key — if documents grow large, switch to IndexedDB
- No migration path for existing container content in localStorage (user creates new docs)

## Follow-ups
- Content storage in PRD0018 implemented and verified
- Update `dev-docs/architecture.md` to reflect separated content model
- Update `dev-docs/roadmap.md` — move to Recently Completed
- Create changelog entry
- Promote plan from `plans/` to `archive/`
