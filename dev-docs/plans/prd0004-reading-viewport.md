# PRD0004 — Reading Viewport

## Status
Completed — ReadingViewport component, canvas click-to-open, prev/next navigation, mode-switch rendering

## Problem

The app currently renders a graph canvas (React Flow) for all content. This is useful for spatial overview but terrible for actual reading. Users need a focused, linear reading experience where they can see one entity's content at a time and navigate forward/backward through a sequence.

The canvas adapter bridge was always temporary — it exists so the app wasn't empty during the domain refactor. Now we need the first real renderer.

## Goal

Build a focused reading viewport that displays a single entity's title and content, with sequential next/previous navigation via "next" relations. When no entity is focused, fall back to the canvas overview.

## Scope

**In scope:**
- `ReadingViewport` component — renders entity title + content in a clean reading layout
- Entity focus: clicking a canvas node calls `focusEntity(id)` to open it in the viewport
- Sequential navigation: prev/next buttons driven by `getSequentialContext`
- Focus state management: `view.focusedEntityId` controls what's shown
- Unfocus action: return to canvas view

**Out of scope:**
- Side-panel contextual expansion (PRD0006)
- Annotation creation (PRD0007)
- Rich text formatting / TipTap (future)
- Loading real text at scale (PRD0005)
- Projection layer abstractions (M3)

## Design

### 1. State flow

```
canvas view ──click entity──→ reading viewport
reading viewport ──close/back──→ canvas view
reading viewport ──prev/next──→ different entity in reading viewport
```

All navigation updates `view.focusedEntityId` in the store. The query engine's `getSequentialContext` and `getEntity` provide the data.

### 2. Component: ReadingViewport

```tsx
// src/renderers/ReadingViewport.tsx

function ReadingViewport() {
  const entityId = useGraphStore((s) => s.view.focusedEntityId)
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)
  const focusEntity = useGraphStore((s) => s.focusEntity)

  if (!entityId) return null

  const entity = getEntity({ entities, relations }, entityId)
  const context = getSequentialContext({ entities, relations }, entityId)

  return (
    <div className="reading-viewport">
      <header>
        <button onClick={() => focusEntity(null)}>← Back</button>
        <h1>{entity?.title}</h1>
        <nav>
          <button
            disabled={!context?.prev}
            onClick={() => context?.prev && focusEntity(context.prev.id)}
          >
            ← Prev
          </button>
          <button
            disabled={!context?.next}
            onClick={() => context?.next && focusEntity(context.next.id)}
          >
            Next →
          </button>
        </nav>
      </header>
      <main>
        <p className="entity-kind">{entity?.kind}</p>
        <div className="entity-content">{entity?.content}</div>
      </main>
    </div>
  )
}
```

### 3. Canvas wiring

In `App.tsx`, clicking a node calls `focusEntity`:

```tsx
// Add to ReactFlow in App.tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodeClick={(_, node) => focusEntity(node.id)}
  fitView
/>
```

### 4. View switching in App.tsx

```tsx
function App() {
  const focusedEntityId = useGraphStore((s) => s.view.focusedEntityId)

  if (focusedEntityId) {
    return <ReadingViewport />
  }

  return <CanvasView />  // existing canvas rendering
}
```

The `CanvasView` can be extracted into its own component for cleanliness, or kept inline. Either is acceptable.

### 5. Styling

Add styles to `src/index.css` — the viewport should be:

- Full height, responsive width
- Comfortable reading column (max ~720px centered)
- Clear visual hierarchy: title > metadata > content
- Prev/next buttons prominent enough for rapid navigation
- Dark mode compatible (vars already exist)

## File Changes

| File | Action |
|------|--------|
| `src/renderers/ReadingViewport.tsx` | Create — reading viewport component |
| `src/App.tsx` | Update — conditional render (canvas vs viewport), wire node click |
| `src/index.css` | Update — add reading viewport styles |
| `src/engine/queries.ts` | No change (getSequentialContext already exists) |

## Implementation Steps

### Step 1 — Create `src/renderers/ReadingViewport.tsx`

Build the component with:
- Entity title display
- Entity content display
- Entity kind badge/tag
- Previous/Next buttons using `getSequentialContext`
- Close/Back button to unfocus
- Graceful empty state if entity not found

### Step 2 — Update `App.tsx`

- Extract current canvas into a `CanvasView` component or conditional section
- Wire `onNodeClick` → `focusEntity(node.id)`
- Conditionally render `ReadingViewport` when `focusedEntityId` is set

### Step 3 — Style the reading viewport

Add CSS to `src/index.css` for:
- `.reading-viewport` — full-height layout with nav header + content area
- `.reading-viewport h1` — entity title
- `.reading-viewport .entity-content` — readable column, preserves whitespace
- `.reading-viewport nav` — prev/next button row
- Dark mode overrides (should work via existing CSS vars)

### Step 4 — Verify

- Click a node on the canvas → reading viewport opens with that entity
- Prev/Next traverse the "next" chain correctly
- Back button returns to canvas
- Entity with no "next" relation: Next button is disabled
- Seed data: navigating from hamlet_1 → hamlet_2 → hamlet_3 works
- `npx tsc --noEmit` passes
- `npm run build` succeeds

## Acceptance Criteria

1. Clicking a canvas node opens the reading viewport with that entity's title and content
2. Prev button navigates to the entity linked by `next` → current entity
3. Next button navigates to the entity linked by current → `next`
4. Buttons are disabled when no prev/next relation exists
5. Back button returns to the canvas (focusedEntityId = null)
6. Missing entity renders gracefully (no crash, show message)
7. Content preserves whitespace/newlines (white-space: pre-wrap or similar)
8. Reading column is readable (max-width, comfortable font size)
9. Dark mode applies correctly via existing CSS vars
10. `npx tsc --noEmit` passes
11. `npm run build` succeeds

## Verification

```sh
npx tsc --noEmit
npm run build
npm run dev   # manual: click entity → read → prev/next → back to canvas
```
