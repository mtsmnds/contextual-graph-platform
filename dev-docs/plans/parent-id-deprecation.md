Here’s how I see the layers:

```
┌─────────────────────────────────────┐
│  Graph JSON (source of truth)       │
│  • entities: no parentId            │
│  • relations: contains edges        │
│    with sortOrder                   │
└──────────────┬──────────────────────┘
               │ load
               ▼
┌─────────────────────────────────────┐
│  Zustand Store (indexed layer)      │
│  • entities[]: as-is from JSON      │
│  • relations[]: as-is from JSON     │
│  • derived selector:                │
│    getParentId(entityId) →          │
│      find contains edge where       │
│      target === entityId,           │
│      return edge.source             │
└──────────┬──────────┬───────────────┘
           │ read     │ write
           ▼          │
┌──────────────────┐  │
│  React Flow      │  │
│  Canvas          │  │
│  • node.parentId │  │
│    = derived     │  │
│    from selector │  │
│  • node.extent   │  │
│    = "parent"    │  │
└──────────────────┘  │
           │          │
           │ drag-to-nest, create child
           ▼          │
┌──────────────────┐  │
│  Store Actions   │──┘
│  • appendChild() │
│  • insertChild() │
│  • moveChild()   │
│  (create/update  │
│   contains edge, │
│   NOT parentId)  │
└──────────────────┘
               │ persist
               ▼
┌─────────────────────────────────────┐
│  Graph JSON (clean, no parentId)    │
└─────────────────────────────────────┘

```

The key insight: parentId never lives in the store or JSON. It’s derived at the React Flow boundary — a selector that looks up ‎`contains` edges. The store actions you already built (from PRD 0057) write ‎`contains` edges, not ‎`parentId`. So the write path is already correct.

What needs to change:

1. GraphCanvas node builder — replace ‎`entity.parentId` reads with the derived selector

2. ‎`getLayoutedElements` in layout.ts — same: derive parentId from contains edges

3. ‎`onNodeDragStop` / drag-to-nest — if it currently writes ‎`entity.parentId`, change it to create a ‎`contains` edge via ‎`appendChild()` instead

What does NOT need to change:

- Store shape (entities + relations stay as-is)

- Graph JSON format (already has contains edges)

- Store actions (appendChild, insertChild, moveChild already work with contains edges)

- Persistence layer (reads/writes entities and relations, no parentId involved)

The Zustand question: the derived ‎`getParentId(entityId)` selector can live in the query engine (‎`queries.ts`) alongside ‎`getContainerChildren`. It’s a one-liner:

```
function getParentId(state, entityId) {
  return state.relations.find(
    r => r.target === entityId && r.type === "contains"
  )?.source
}

```

No new Zustand infrastructure needed — it’s just a query function that reads existing state. No overlap with FS improvement.

Does this architecture match what you had in mind?