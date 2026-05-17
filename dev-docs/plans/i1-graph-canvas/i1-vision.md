
# Contextual Graph Platform — Vision

## What this is

A reading and writing workspace where text is not stored in documents — it's stored in a graph. Every paragraph is an entity with a stable identity. Every connection between ideas is a typed, directed relation. What we call a "document" is a projection: a query that assembles entities into a readable sequence.

## Three primitives

- **Entities.** Atomic content units — a paragraph, a book, a person, a concept — each with a permanent UUID that survives edits, moves, and restructuring.
- **Relations.** Typed edges between entities. `[paragraph] → [book]` as `content`. `[note] → [paragraph]` as `quotes`. `[book] → [person]` as `author`. Relations carry sort order, making sequential reading possible.
- **Projections.** Saved queries that produce ordered threads. "All entities related to this book as `content`" is the book. "All entities related to this book as `note`" is your marginalia. Same graph, different lens.

## Core principle: transclusion over copying

Quoting a passage doesn't duplicate text — it creates a `quotes` relation to the original entity. The passage appears in your article because the projection includes it. The original stays the source of truth. Every reference is a live connection, not a snapshot.

## The workspace

Single surface, permanent sidebar. The sidebar holds saved projections — not files. Switching from "book content" to "my notes on this book" changes the query, not the window. Entities in a thread that have relations beyond the current projection show indicators: click to expand the connected entity inline without leaving the reading flow.

## Design stance: expose the graph

The graph is not hidden infrastructure — it's the interface. Entity types, relation labels, and edge counts are visible by default. Reading mode dims the metadata for clean prose; inspector mode expands it. The structure is never more than one interaction away. Users who can see the model can reason about it.

## Direction

Entity Graph → Projection Layer → Reading Workspace. The domain model is decoupled from view state. Content is native to entities. The app is a single-surface reading workspace with a permanent sidebar — different projections of the same graph render as navigable threads. Graph visualization (React Flow) is deferred to a later milestone; validate reading, editing, and relational linking on the thread view first.