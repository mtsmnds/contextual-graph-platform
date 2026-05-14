# Requirements

## Purpose
This document defines why this project exists, who it serves, and what capabilities are required.

## Scope
- In scope: A relation-native content engine with typed entities and relations, multiple projection layers, and interchangeable renderers. Core includes Entity/Relation schema, Zustand state management with separate domain/view state, query engine, and pluggable renderers (reading viewport, outline, graph visualization).
- Out of scope: Authentication, real-time collaboration, server-side storage, mobile native builds.

## Product Goals
- Provide a single typed data layer (Entity/Relation) flexible enough to express both reading workspaces and project roadmaps.
- Separate domain state from view state so renderers are interchangeable.
- Keep state management lightweight and predictable via Zustand.

## Target Audience
- Primary: The developer building both products from this codebase.
- Secondary: OpenCode agents contributing to the codebase.
- Contributors/agents: Implementers using the dev-docs workflow.

## Functional Requirements

### Domain Data Layer
- As a developer, I can define typed entities (segment, container, annotation, concept, summary) with native content and extensible metadata.
- As a developer, I can define typed relations (contains, next, references, annotates, summarizes, related_to) between entities.
- As a developer, I can query entities and relations through a query engine (getEntity, getRelations, getSequentialContext, getLinkedContext).

### State Management
- As a developer, I can add, update, and delete entities and relations through primitive store actions.
- As a developer, I can control view state (focused entity, expanded panels) separately from domain state.

### Rendering
- As a user, I can see entities and relations rendered on a React Flow canvas as a transitional visualization.
- Future: As a user, I can read content in a focused reading viewport with contextual side panels.

### Non-Functional Requirements
- TypeScript strict mode enabled — no `any` in graph types.
- Domain types import nothing from rendering libraries (React Flow agnostic).
- No test framework required (not yet configured).

## Traceability
- Update this file when adding/changing features or non-functional targets.
- Cross-reference: `architecture.md`, `roadmap.md`, `changelog.md`.
