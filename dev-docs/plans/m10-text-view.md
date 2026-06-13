# M10 — Text View (Retrospective)

## Overview

Built a pure-React text view for reading and navigating the entity graph without React Flow. The implementation diverged significantly from the original plan — see Deviations below.

**Status:** Completed 2026-06-13.

## What was built

- **EntityTreeNode** (`src/components/chrome/EntityTreeNode.tsx`) — recursive component: containers render as `Collapsible` + `ContainerCard` with editable title header (ContentEditor) and `CaretDown` toggle; segments render as `SegmentCard width="100%"` + `ContentEditor`. Matches `ContainerCard` Storybook patterns exactly.
- **Horizontal column layout** — side-by-side 512px columns, one per open container. Independent vertical scrolling. Horizontal scroll when columns exceed viewport.
- **ContainerCard `footer` prop** — optional slot rendered below children. EntityTreeNode uses it for a `+` button that creates a new segment child.
- **`openContainers` in useChromeStore** — explicit ordered list replacing the implicit "show all roots" fallback. `addContainer`, `removeContainer`, `setOpenContainers`. Empty by default — text view shows only the workspace tree when no containers are open.
- **WorkspaceTree** (`src/components/chrome/WorkspaceTree.tsx`) — monospace ASCII tree (`├──`/`└──`/`│`) of root containers and nested container hierarchy. Clicking a container either opens all its container children as columns (if it has any) or opens the container itself. Wrapped in `ContainerCard` with "Workspace" header.

## Deviations from original plan

### Not built (deferred or reconsidered)

| Planned feature | Status | Reason |
|----------------|--------|--------|
| `buildContainerTree` pure function | Not built | Hierarchy built inline in recursive EntityTreeNode — no separate data transform needed |
| Separate ContainerBlock / SegmentBlock components | Not built | Single EntityTreeNode handles both roles via `entity.type` branching |
| Sticky container headers | Not built | `position: sticky` conflicts with horizontal column layout; deferred |
| Sidebar selection sync (click entity → show metadata) | Not built | Requires selection state coordination between canvas and text view; deferred |
| Collapse state shared with canvas (`collapsedContainers`) | Not built | Text view uses its own `textCollapsed` set — canvas and text collapse independently by design |
| Non-container filtering (skip concept/annotation nodes) | Not built | Tree shows all containers; no filtering implemented |
| Vertical document flow layout | Not built | Replaced with horizontal column layout (better for multi-container reading) |

### Built differently

| What the plan said | What was built |
|-------------------|----------------|
| Single vertical scroll with sticky headers | Horizontal columns, independent scrolling per container |
| Container blocks with `pl-4` nesting indentation | Collapsible accordion panels inside cards (tinted background for child area) |
| Implicit "show all roots" | Explicit `openContainers` list + WorkspaceTree column for navigation |
| Collapse synchronized with canvas | Separate collapse state (`textCollapsed` in useChromeStore) |

### New features not in plan

- WorkspaceTree (navigable monospace tree column, always rightmost)
- ContainerCard `footer` prop + "Add segment" button
- Horizontal column layout
- `openContainers` chrome store concept

## Files changed (final)

- `src/components/chrome/EntityTreeNode.tsx` — **New.** Recursive tree node for text view
- `src/components/chrome/WorkspaceTree.tsx` — **New.** Monospace ASCII tree for container navigation
- `src/components/chrome/TextView.tsx` — **Rewritten.** Horizontal column layout with WorkspaceTree, `openContainers`-driven
- `src/store/useChromeStore.ts` — Added `openContainers`, `textCollapsed`, and their actions
- `src/components/ContainerCard.tsx` — Added `footer` prop

## Deferred items (moved to backlog.md)

- Sticky container headers in text view
- Sidebar metadata selection sync (click in text view → show entity properties)
- Non-container entity filtering in workspace tree
- Collapse state shared between canvas and text view

## Verify

- `npx tsc --noEmit` — passes
- `npm run build` — passes
- Seed data: both root containers appear side by side
- Click container in tree → opens as a column
- Add segment button creates editable segment inside container
- Collapse/expand works with animated caret rotation
