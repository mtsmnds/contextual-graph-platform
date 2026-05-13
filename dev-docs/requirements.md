# Requirements

## Purpose
This document defines why this project exists, who it serves, and what capabilities are required.

## Scope
- In scope: A unified node-and-edge graph system that powers a visual project roadmap and a relational reading workspace. Core includes typed graph schema, Zustand state management, and React Flow canvas rendering.
- Out of scope: Authentication, real-time collaboration, server-side storage, mobile native builds.

## Product Goals
- Provide a single typed data layer flexible enough to express both project phases/tasks and reading segments/annotations.
- Enable visual manipulation (drag, connect, select) of graph elements via React Flow.
- Keep state management lightweight and predictable via Zustand.

## Target Audience
- Primary: The developer building both products from this codebase.
- Secondary: OpenCode agents contributing to the codebase.
- Contributors/agents: Implementers using the dev-docs workflow.

## Functional Requirements

### Graph Data Layer
- As a developer, I can define typed nodes (phase, task, work, segment, annotation) with structured metadata so that the graph carries semantic meaning.
- As a developer, I can define typed edges (dependency, contains, references, etc.) with a UI behavior hint so that interactions are predictable.
- As a developer, I can store, retrieve, and mutate documents keyed by docId so that rich text content lives alongside the graph.

### State Management
- As a developer, I can add, delete, and update nodes/edges through primitive store actions so that UI components have a clear contract.
- As a developer, I can wire React Flow's onNodesChange/onEdgesChange directly to the store so that drag, select, and delete work out of the box.

### Canvas Rendering
- As a user, I can see a React Flow canvas with nodes and edges rendered so that the graph is visually inspectable.

### Non-Functional Requirements
- TypeScript strict mode enabled — no `any` in graph types.
- No test framework required (not yet configured).

## Traceability
- Update this file when adding/changing features or non-functional targets.
- Cross-reference: `architecture.md`, `roadmap.md`, `changelog.md`.
