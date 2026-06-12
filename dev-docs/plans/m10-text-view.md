# M10 — Text View

## Overview

Build a pure-React text view for reading and navigating the entity graph without React Flow. Containers render as collapsible blocks with sticky headers; segments render as content cards. The browser's layout engine handles all sizing — no custom positioning.

Reuses `SegmentCard`, `ContainerCard`, and `ContentEditor` from M7 in a vertical document-style layout. Shares the same Zustand store as the canvas — no duplication of data or state.

## Specification / Acceptance Criteria

1. TextView reads entities and relations from the Zustand store and renders containers hierarchically via `contains` edges + `sortOrder`.
2. **Container blocks** use `ContainerCard` with a sticky header (`position: sticky; top: 0`) and a collapse toggle. Collapse state reads/writes the same `collapsedContainers` store key as the canvas — collapsing in one view reflects in the other.
3. **Segment cards** use `SegmentCard` with `ContentEditor` inside. Double-click to edit, same as the canvas. Content changes are persisted to the same store.
4. **No custom positioning** — standard block flow layout (`flex flex-col` with gap). Browser handles scroll and overflow.
5. **Hierarchical nesting** — containers can be nested arbitrarily (book > act > scene > seg, matching the graph model). Each nesting level is indented (`pl-4` or similar).
6. **Sticky headers** — each container's `ContainerCard` header sticks to the top of the viewport as the user scrolls through its children. When scrolling into a nested container, the inner header replaces the outer one (standard CSS sticky behavior with nested sticky elements).
7. **ViewSwitcher integration** — mounts as a view option in the WorkspaceShell (M9). Switching from "Graph" to "Text" swaps the main content area without losing state.
8. **Sidebar works in text view** — `AppSidebar` shows `SelectionMetadataSection` when a segment or container is focused/selected in the text view. `BackupsSection`, `WorkspaceInfoSection`, `FeatureFlagsSection` remain available.
9. **Scrolling** — the text view scrolls independently of the sidebar. Standard `<div className="flex-1 min-h-0 overflow-y-auto">`.
10. **Root containers** — the text view initially shows all top-level containers (entities with no incoming `contains` edge). Book-like containers expand to show their hierarchy. Concept nodes and geography nodes are hidden by default (they aren't reading content) — future filter controls can expose them.

## Files changed (inferred)

- `src/views/TextView.tsx` — **New.** Main text view component. Reads store, builds container hierarchy, renders collapsible sections.
- `src/views/ContainerBlock.tsx` — **New.** Single container in the text view: sticky ContainerCard header + recursive children rendering.
- `src/views/SegmentBlock.tsx` — **New.** Single segment rendered as a SegmentCard with ContentEditor.
- `src/views/TextView.test.ts` — **New.** Unit tests for hierarchy building, collapse state, filtering.
- `src/store/useGraphStore.ts` — Minor: add `selectedTextEntityId` if needed for sidebar sync. Or reuse existing `selectedNodeId`.
- `src/components/WorkspaceShell.tsx` — Import and register TextView as a view option.
- `src/canvas/panels/sections/SelectionMetadataSectionContainer.tsx` — May need to read `selectedTextEntityId` instead of (or in addition to) `selectedNodeId` from the canvas.

## Phases

### Phase 1: Hierarchy builder and basic render
- Write a `buildContainerTree(entities, relations)` pure function that returns a tree of { container, children: Tree[] }.
- Filter to only container and segment entities (skip concept nodes).
- Render top-level containers in a scrollable div, each as a `ContainerBlock`.
- Each `ContainerBlock` renders its children recursively: containers nest further, segments render as `SegmentBlock`.

### Phase 2: Collapse and sticky headers
- Add collapse toggle to each `ContainerBlock` that reads/writes `collapsedContainers` in the store.
- Apply `position: sticky; top: 0; z-index: 1` to each `ContainerCard` header inside its container's scroll context.
- Test that nested sticky headers replace each other correctly on scroll.

### Phase 3: Content editing
- Inside `SegmentBlock`, use `SegmentCard` wrapping `ContentEditor`.
- Double-click to edit, blur to save — reuses `useNodeEdit` hook.
- Container titles also use `ContentEditor` for inline editing.

### Phase 4: Sidebar integration
- Clicking a segment or container in the text view selects it in the store.
- `SelectionMetadataSectionContainer` reads the selected entity and shows its properties in the sidebar.
- If `selectedNodeId` is used by both canvas and text view, ensure switching views doesn't clear selection unexpectedly.

### Phase 5: Polish and edge cases
- Empty state when no containers exist.
- Handle very deep nesting with reasonable indentation (cap at 6 levels or similar).
- Handle collapsed ancestors — descendants hidden (same logic as canvas).
- Smooth scroll-to-anchor if an entity is focused programmatically.

## Non-goals

- No rich text / markdown rendering (ContentEditor is plain text by design; rich text is a future concern).
- No annotation sidebar (the legacy `ReadingViewport`'s `RelationSidebar` is not ported — annotation display is deferred).
- No search or filtering (deferred to a future milestone).
- No pagination or virtual scrolling (content scale is book-sized, not social-feed-sized).

## Size advisory

Medium — three new components (~250 lines total), one pure function, minor store changes. All building on M7's portable card primitives.

## Dependencies

- M7 (SegmentCard, ContainerCard, ContentEditor) — done. Portable card components are the building blocks.
- M9 (WorkspaceShell, ViewSwitcher) — done. Provides the shared chrome to mount the text view in.
