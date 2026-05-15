# Architecture Review — Contextual Graph Platform

## Executive Summary

The current direction is strong conceptually.

The project already has:
- a coherent product thesis,
- unusually clear UX principles,
- a meaningful distinction between contextual navigation and destructive navigation,
- and a promising relational reading model.

However, the implementation plan is currently over-coupled to:
- React Flow,
- canvas metaphors,
- and node-editor assumptions.

This coupling is creating architectural pressure that will likely produce:
- excessive UI complexity,
- difficult editor integration,
- brittle state management,
- and AI-agent implementation instability.

The most important recommendation is:

> React Flow should become an optional visualization layer — not the core runtime abstraction.

Right now the architecture is still implicitly treating:

```txt
React Flow Node = Domain Entity
```

This is the primary structural problem.

The domain model should instead become:

```txt
Entity Graph
  ↓
Projection Layer
  ↓
Renderer
```

Where:
- React Flow is only one renderer,
- not the system itself.

---

# What Is Working Well

## 1. The UX principles are unusually coherent

The strongest parts of the spec are:

- Context Preservation
- Progressive Context Expansion
- Edge Type Drives Behavior
- Dual Workspace

These already define a differentiated product identity.

The emphasis on:
- lateral expansion,
- contextual continuity,
- and non-destructive navigation

is genuinely strong.

This should remain the foundation.

---

## 2. The system correctly identifies relationships as first-class

This is the right direction:

```txt
content + typed relations + behavior
```

instead of:

```txt
documents + hyperlinks
```

This distinction matters enormously.

---

## 3. The roadmap already avoids premature AI complexity

Good exclusions:

- embeddings
- collaboration
- cloud sync
- EPUB pipelines

This is correct.

The core interaction must be validated first.

---

# Main Architectural Problems

# 1. React Flow Is Currently Too Central

This is the biggest issue.

The current architecture implies:

```txt
Domain = Canvas
```

instead of:

```txt
Canvas = One possible projection
```

This causes several downstream problems.

---

## Symptoms of over-coupling

### Domain state mixed with viewport state

Current structure:

```ts
nodes: AppNode[]
```

where AppNode inherits:
- x/y coordinates,
- dragging state,
- width,
- selection,
- handles,
- resize state.

This pollutes the semantic model.

The graph should not care about:
- canvas positions,
- drag interactions,
- viewport dimensions.

---

### TipTap becomes trapped inside node renderers

This is likely the implementation wall you are hitting.

Because:

```txt
ReactFlowNode
  contains
TipTap editor
```

creates:
- nested interaction systems,
- focus conflicts,
- drag conflicts,
- selection conflicts,
- resize instability,
- virtualization problems,
- excessive rerenders.

This is especially problematic for AI coding agents.

The agents start fighting:
- React Flow internals,
- contenteditable behavior,
- DOM synchronization,
- node measurement.

Instead of building the product logic.

---

### The graph canvas is becoming the primary interface

This is dangerous.

The actual innovation is:

```txt
contextual reading workspaces
```

not:

```txt
visual node graph editing
```

The graph should support the reading experience.

Not dominate it.

---

# 2. The Data Model Is Still Too Document-Oriented

The current architecture still contains:

```ts
node -> docId -> documents store
```

This is the wrong abstraction for the reader product.

It treats nodes as:
- containers,
- references,
- wrappers.

But the system is actually:

```txt
content-native
```

Meaning:

> the entity itself IS the content.

---

# 3. Node Types Are Too Product-Specific

Current:

```ts
"phase" | "task" | "work" | "segment" | "annotation"
```

This is too tied to:
- roadmap semantics,
- current UI assumptions.

The architecture should instead separate:

## Structural role
from
## Semantic interpretation

---

# Recommended Architectural Shift

# Move from:

```txt
React Flow Graph App
```

# To:

```txt
Relation-Native Content Engine
```

with:

```txt
multiple projections/renderers
```

---

# Recommended Core Model

# Entity

The atomic semantic object.

```ts
export type Entity = {
  id: string

  kind: EntityKind

  title?: string

  content?: RichText

  metadata?: Record<string, unknown>
}
```

---

# Relation

```ts
export type Relation = {
  id: string

  source: string
  target: string

  type: RelationType

  metadata?: Record<string, unknown>
}
```

---

# View State

Separate entirely from domain graph.

```ts
export type ViewState = {
  focusedEntityId?: string

  visibleEntityIds: string[]

  expandedPanels: PanelState[]

  layout?: LayoutState
}
```

---

# Renderer Layer

Now:

```txt
same graph
  ↓
multiple renderers
```

Examples:

- Reading renderer
- Outline renderer
- Graph renderer
- Timeline renderer
- Workspace renderer

React Flow becomes:

```txt
GraphRenderer
```

only.

This is a major simplification.

---

# Strong Recommendation About React Flow

## Keep React Flow

but:

# demote it architecturally.

Use it for:
- roadmap visualization,
- graph exploration,
- spatial organization,
- optional semantic browsing.

Do NOT make it:
- the universal runtime substrate,
- the content editing surface,
- the primary reading environment.

---

# Recommended Reading Architecture

Instead of:

```txt
TipTap inside graph nodes
```

use:

```txt
Focused viewport
  +
Contextual side panels
  +
Projection-based rendering
```

Meaning:

```txt
+----------------------+----------------------+
| Hamlet               | Don Quixote          |
| paragraph context    | referenced passage   |
| highlighted segment  | note                 |
+----------------------+----------------------+
```

NOT:

```txt
infinite draggable node canvas
```

for reading.

---

# Recommended Revised MVP

The current roadmap is still too UI-heavy too early.

The MVP should validate:

```txt
focused contextual reading
```

NOT:

```txt
advanced graph manipulation
```

---

# Recommended MVP Scope

## MUST HAVE

### 1. Entity storage :check:

SQLite or JSON persistence.

---

### 2. Relation storage :check:

Typed edges.

---

### 3. Sequential reading :check:

```txt
next / previous
```

relations.

---

### 4. Contextual expansion

Open linked context side-by-side.

---

### 5. Focus switching

Promote secondary context into primary.

---

### 6. Minimal annotation support

Highlight + note.

---

# SHOULD NOT EXIST YET

- drag-heavy canvas UX
- node resizing
- graph layout engines
- minimap
- edge handles
- nested React Flow editors
- auto-layout
- visual graph editing

These are all:

```txt
secondary interaction layers
```

not core product validation.

---

# Recommended New Roadmap

# Phase 1 — Domain Engine

Goal:
- stable graph model,
- persistence,
- projections.

## Deliverables

### 1.1 — Entity schema

Implement:
- Entity
- Relation
- Projection
- ViewState

No React Flow.

---

### 1.2 — SQLite persistence

Tables:

```sql
entities
relations
```

Only.

No UI layout tables yet.

---

### 1.3 — Seed content

Hardcode:
- Hamlet excerpts,
- linked annotations,
- references.

No import system.

---

### 1.4 — Query engine

Functions:

```ts
getEntity()
getRelations()
getSequentialContext()
getLinkedContext()
```

---

# Phase 2 — Reading Workspace

Goal:
- validate contextual reading.

## Deliverables

### 2.1 — Reading viewport

Focused entity + contextual radius.

---

### 2.2 — Sequential traversal

Previous/next navigation.

---

### 2.3 — Side expansion

Open referenced context.

---

### 2.4 — Promote context

Secondary panel becomes primary.

---

### 2.5 — Annotation creation

Highlight → annotation relation.

---

# Phase 3 — Projection Layer

Goal:
- support multiple graph interpretations.

## Deliverables

### 3.1 — Reading projection

### 3.2 — Outline projection

### 3.3 — Thematic projection

### 3.4 — Notes projection

---

# Phase 4 — Graph Visualization

ONLY NOW introduce React Flow.

Because:

now there is already:
- a stable domain model,
- stable projections,
- stable reading UX,
- stable query semantics.

React Flow becomes:

```txt
optional spatial renderer
```

instead of:

```txt
the operating system
```

---

# Revised Type Recommendations

# Remove

```ts
EdgeBehavior
```

from domain state.

Why?

Because behavior belongs to:

```txt
interaction layer
```

not graph storage.

---

# Instead:

```ts
Relation.type = "references"
```

and the renderer decides:

```txt
references → expand lateral
```

This separation is cleaner.

---

# Remove

```ts
docId
```

Content belongs directly to entities.

---

# Remove

```ts
status
```

from universal entities.

That is roadmap-product-specific.

---

# Introduce

```ts
metadata
```

instead.

---

# Recommended Initial Entity Kinds

Keep the ontology small.

```ts
"segment"
"container"
"annotation"
"concept"
"summary"
```

That's enough initially.

---

# Recommended Initial Relation Types

```ts
"contains"
"next"
"references"
"annotates"
"summarizes"
"related_to"
```

Avoid ontology explosion.

---

# Critical Recommendation About AI Agents

Your architecture docs should explicitly tell agents:

## DO NOT:

- tightly couple domain entities to React Flow nodes,
- store UI state in domain state,
- place TipTap editors inside graph nodes,
- assume hierarchy is tree-based,
- implement graph rendering as the primary reading UI.

---

# The Most Important Insight

You are not building:

```txt
a node editor
```

You are building:

```txt
a contextual navigation engine
```

That distinction changes:
- the architecture,
- the renderer model,
- the persistence model,
- the UI composition strategy,
- and the implementation order.

---

# Final Recommendation

The current spec is directionally excellent.

But the implementation should become:

# more conservative,
# more projection-oriented,
# less canvas-centric,
# and more focused on validating contextual reading itself.

The most dangerous thing right now is:

```txt
solving graph UX before proving reading UX
```

The reading interaction is the innovation.
The graph visualization is only one possible expression of it.

---

# Suggested New Guiding Principle

Add this to ARCHITECTURE.md:

> The graph is infrastructure.
> The viewport is the product.
> Renderers are interchangeable.
> Contextual reading is the core interaction.



References from uploaded spec reviewed throughout this document: fileciteturn1file0L1-L35 fileciteturn1file3L1-L41 fileciteturn1file1L1-L33 fileciteturn1file4L1-L42

