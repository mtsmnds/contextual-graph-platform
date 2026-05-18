> **Completion note (2026-05-18):**

# PRD0035b — Pane Double-Click + Node Position Fix

## Overview

Add the ability to double-click on the empty graph canvas pane to create a new node at the click position. Also fix the existing "New Node" button to create at viewport center (it currently creates at a Dagre-computed position, which is unpredictable for the user). Both paths should auto-open the inline editor.

Belongs to the Interaction & Position Persistence batch under PRD0035.

## Initial Assumptions

### Assumption 1: React `onDoubleClick` prop

React Flow passes standard HTML div props through to its container. The plan was:

```tsx
<ReactFlow onDoubleClick={handleDoubleClick} zoomOnDoubleClick={false}>
```

Where `handleDoubleClick` would:
1. Call `useGraphStore.getState().addEntity("concept")`
2. Convert `event.clientX/clientY` to flow coordinates via `reactFlowInstance.screenToFlowPosition()`
3. Call `setNodes()` to position the new node at the click coordinates and set `editTrigger: 1`

**Reality:** React Flow's internal zoom handler adds a native `dblclick` listener on the pane element that calls `stopImmediatePropagation()`. The React synthetic `onDoubleClick` prop on the wrapper div never fires. This was the first blocking bug.

### Assumption 2: `setNodes` immediately after `addEntity`

The plan was to create the entity and immediately position the React Flow node:

```tsx
const id = useGraphStore.getState().addEntity("concept")
setNodes((nds) => nds.map(n => n.id === id ? { ...n, position } : n))
```

**Reality:** `setNodes`' functional updater runs with the CURRENT React Flow nodes state. The new node doesn't exist in `nds` because `addEntity` triggers a Zustand subscription → React re-render, but the re-render hasn't happened yet within the same synchronous event handler. The position update is silently lost — the node is never found by `nds.map()`.

### Assumption 3: Inline `editTrigger` survives the layout effect

The layout effect runs on every `entities` change. It calls `getLayoutedElements()` (Dagre) and merges the result into React Flow state. The merge logic preserves positions of existing nodes (`if (existing)`) but uses Dagre positions for new nodes (`else`). Additionally, it was doing `{ ...existing, data: layoutedNode.data }` which wiped any transient `data` fields like `editTrigger`.

### Assumption 4: Override position in a second pass after the merge loop

The first fix attempt added a second `.map()` pass after the merge loop to override the position:

```ts
const pending = pendingNodeRef.current
if (pending) {
    pendingNodeRef.current = null
    return merged.map((n) => n.id === pending.id ? { ...n, position: pending.position } : n)
}
```

**Reality:** React Strict Mode fires each `useEffect` twice (mount → unmount → remount). The first invocation read the ref, overrode the position, and cleared the ref. The second invocation saw `null` and fell back to Dagre. The node ended up at Dagre's position.

## Out of scope

- Easy connect (`easyconnect` prop on ReactFlow) — separate roadmap item
- Viewport logger — separate roadmap item
- Save node positions / schema v4 — separate roadmap item
- Cmd+drag to duplicate node — separate roadmap item

> **Completion note (2026-05-18):**
> - **What was built:** Pane double-click creates node at cursor position; "New Node" button creates at viewport center. Both auto-open the inline editor.
> - **Actual solution (after three failed attempts):** `createNode` calls `addEntity` then writes `{ id, position }` to a `useRef` — no `setNodes` call. The layout effect's merge loop catches new nodes in the `else` branch (not in React Flow state yet) and checks the ref there: if the id matches, the node enters directly at cursor position instead of Dagre's computed position. The ref is **never cleared** — it survives React Strict Mode's mount→unmount→remount double-invocation, and is harmless for existing nodes (they hit the `if (existing)` branch which ignores the ref). Next `createNode` call overwrites it.
> - **Key decisions:**
>   ① Position override lives entirely inside the layout effect's existing `setNodes` merge — no separate `setNodes` call from the event handler (that call couldn't find the new node because React hadn't re-rendered from `addEntity` yet).
>   ② Ref is never consumed/cleared — avoids Strict Mode double-fire issue where the second invocation sees null and falls back to Dagre.
>   ③ Native DOM `dblclick` listener with `{ capture: true }` — React Flow's synthetic `onDoubleClick` never fires because its internal zoom handler calls `stopImmediatePropagation()` on the dblclick event.
> - **Deviations from plan:** Three attempted approaches failed before the final solution: ① React's `onDoubleClick` prop (never fires — React Flow stops propagation), ② `setNodes` immediately after `addEntity` (silently lost — node not in React Flow state yet), ③ position override in a second `.map()` pass after the merge loop (Strict Mode double-fire consumed ref between invocations). The final approach (ref in `else` branch, never cleared) was suggested by the user after three rounds of debugging.
> - **Postponed:** None.

