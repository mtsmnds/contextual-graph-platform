# Requirements

## Purpose
This document defines why this project exists, who it serves, and what capabilities are required.

## Scope
- In scope: A relation-native content engine with typed entities and relations, multiple projection layers, and interchangeable renderers. Core includes Entity/Relation schema, Zustand state management with separate domain/view state, query engine, and renderers (continuous-scroll reading viewport, graph canvas, future: side panels, outline).
- Out of scope: Authentication, real-time collaboration, server-side storage, mobile native builds.

## Product Goals
- Provide a single typed data layer (Entity/Relation) flexible enough to express both reading workspaces and project roadmaps.
- Separate domain state from view state so renderers are interchangeable.
- Containers are structural labels (title only). Segments carry all body content. Work entities are real entities that can receive relations.

## Target Audience
- Primary: The developer building both products from this codebase.
- Secondary: OpenCode agents contributing to the codebase.
- Contributors/agents: Implementers using the dev-docs workflow.

## Functional Requirements

### Domain Data Layer
- As a developer, I can define typed entities (segment, container, annotation, concept, summary). Containers provide hierarchical structure (work, act, scene). Segments carry body text.
- As a developer, I can define typed relations (contains, next, references, annotates, summarizes, related_to) between entities.
- As a developer, I can query entities and relations through a query engine (getEntity, getRelations, getSequentialContext, getLinkedContext, getContainerChildren, resolveContainer).

### Reading Viewport
- As a user, clicking any entity on the canvas opens a continuous-scroll reading viewport showing the root container (work) with all descendants flattened recursively.
- As a user, I can scroll freely through the entire work — from title page through all sections to end matter.
- As a user, the breadcrumb shows my position in the hierarchy. Clicking any crumb refocuses the root context with that section as anchor.
- As a user, clicking a relation (references, annotates) opens a new column to the right with linked content, preserving the reading position in the previous column.
- As a user, I can navigate horizontally through related context: work → author → author's other works → reference → annotation, each in its own column.
- As a user, I can reorder columns. Content scrolls in sync horizontally across columns.
- As a user, I can collapse containers (acts, scenes) like accordions within the reading viewport.

### Node Component
- As a developer, I have a single Node component that can render both segments and containers with appropriate action icons in the border area.
- As a developer, segments show actions: comment/note/reference/mention/link, create next segment, view metadata.
- As a developer, containers show the same actions plus collapsible accordion behavior and table of contents referencing.
- As a user, I can toggle a dev tools panel that shows the focused node's full JSON data (kind, title, content, metadata, relations).

### Canvas
- As a user, I can see all entities rendered as nodes with edges. Work, act, scene, and segment nodes are all visible.
- As a user, clicking any node opens the reading viewport showing the full work in context.
- As a user, I can filter the canvas by entity kind, relation type, or container membership.
- As a user, I can view the roadmap itself as a graph (future: self-hosting roadmap).

### State Management
- As a developer, I can add, update, and delete entities and relations through primitive store actions.
- As a developer, I can control view state (focused entity, anchor entity, expanded panels) separately from domain state.

### Persistence
- As a user, my graph state is automatically saved to `localStorage` on every change, so it survives page reloads.
- As a user, on first visit (no stored data) I see pre-loaded sample data ("About This Workspace" and "Editor Playground" pages).
- As a user, my view state (focused entity, anchor entity) is encoded in the URL, so page reloads restore my position without re-navigating.

### Non-Functional Requirements
- TypeScript strict mode enabled — no `any` in graph types.
- Domain types import nothing from rendering libraries (React Flow agnostic).
- Large texts (1,400+ entities) render without performance issues. No virtualization/lazy loading needed at current scale.
- No test framework required (not yet configured).

## Traceability
- Update this file when adding/changing features or non-functional targets.
- Cross-reference: `architecture.md`, `roadmap.md`, `changelog.md`.
