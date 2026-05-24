> **Completion note (2026-05-18):**
> - **What was built:** Replaced 2-handle setup (target left, source right) with 4 handles at every edge (top/right/bottom/left), all `type="source"` — direction is source→target in the Connection object. `onConnect` stores `sourceHandle`/`targetHandle` in relation metadata. `isValidConnection` prevents self-connections. Layout engine passes handle IDs from metadata to React Flow `Edge`, so edges reconnect at correct handle positions on reload.
> - **Key decisions:** All 4 handles use `type="source"` — direction is captured by source→target in Connection, not by handle type. Handle IDs stored in `Relation.metadata` as an interim solution — future evolution may extract to dedicated `canvasView` field.
> - **Deviations from plan:** None — implementation matches the PRD exactly.
> - **Postponed:** View data namespacing (prefix `canvas.sourceHandle`) and first-class `canvasView` field — deferred as noted in "Future evolution" section.

## Task: 4-Way Handles

### Purpose

Replace the current 2-handle setup (target left, source right) with 4 handles at every edge (top, right, bottom, left). Users can drag from any handle to any handle on any other node. Connection direction is captured by source→target — the handle that was dragged from is the source handle, the one that was dropped on is the target handle. Self-connections are blocked.

### Current behavior

EntityNode has 2 handles: target (left edge) and source (right edge). The `onConnect` handler stores only `source` and `target` node IDs — handle IDs are dropped. The layout engine creates edges without `sourceHandle`/`targetHandle` on reload, so edges always connect at default handle positions regardless of which handles the user originally used.

### Implementation

#### EntityNode.tsx

Replace two BaseHandle calls with four, each with a unique `id`:

```tsx
<BaseHandle type="source" position={Position.Top} id="top" />
<BaseHandle type="source" position={Position.Right} id="right" />
<BaseHandle type="source" position={Position.Bottom} id="bottom" />
<BaseHandle type="source" position={Position.Left} id="left" />
```

All handles use `type="source"` — direction is captured by source→target in the Connection, not by handle type.

#### GraphCanvas.tsx

Store `sourceHandle`/`targetHandle` from the Connection in relation metadata:

```tsx
const onConnect = useCallback(
  (connection: Connection) => {
    useGraphStore.getState().addRelation(
      connection.source,
      connection.target,
      "related_to",
      {
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      },
    )
  },
  [],
)
```

Add `isValidConnection` to prevent self-connections:

```tsx
const isValidConnection = useCallback(
  (connection: Connection) => connection.source !== connection.target,
  [],
)
```

Pass to `<ReactFlow isValidConnection={isValidConnection}>`.

#### layout.ts

Pass handle IDs from `Relation.metadata` to the React Flow `Edge`:

```tsx
const edges: Edge[] = relations.map((rel) => {
  g.setEdge(rel.source, rel.target)
  return {
    id: rel.id,
    source: rel.source,
    target: rel.target,
    sourceHandle: rel.metadata?.sourceHandle as string | undefined,
    targetHandle: rel.metadata?.targetHandle as string | undefined,
    label: rel.type,
    type: "default",
  }
})
```

#### Self-connection UX

When the user drags a connection from a node to itself, `isValidConnection` returns false. React Flow shows the connection line as invalid (red by default) and doesn't create an edge on drop.

### JSON example

User drags from `node-b`'s left handle to `node-a`'s top handle:

```json
{
  "relations": [
    {
      "id": "r_1715702400000",
      "source": "node-b",
      "target": "node-a",
      "type": "related_to",
      "sortOrder": "a0b1c2",
      "metadata": {
        "sourceHandle": "left",
        "targetHandle": "top"
      }
    }
  ]
}
```

On load, the layout engine reads `metadata.sourceHandle` and `metadata.targetHandle` and passes them to the React Flow `Edge`, so the edge reconnects at the correct handle positions.

### Future evolution (not now)

1. **View data namespacing** — prefix metadata keys like `canvas.sourceHandle` to distinguish view data from domain data.
2. **First-class `canvasView` field** — extract handle IDs from metadata into a dedicated `GraphSnapshot.canvasView` field with a schema migration.

### Out of scope

- Arrow decorations / edge markers
- Edge type selection
- Multi-handle per side
- Connection validation beyond self-connect prevention

### Files to change

| File | Change |
|---|---|
| `src/canvas/nodes/EntityNode.tsx` | Replace 2 handles with 4, each with unique `id` |
| `src/canvas/GraphCanvas.tsx` | Store handle IDs in `onConnect`, add `isValidConnection` |
| `src/engine/layout.ts` | Pass `sourceHandle`/`targetHandle` from relation metadata to edge |
