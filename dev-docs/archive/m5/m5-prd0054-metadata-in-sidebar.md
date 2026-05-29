> **Completion note (2026-05-28):**
> - **What was built:** Node Properties sidebar section with ghost-input property grid, editable id/type/canvas fields, metadata key-value editor, selection tracking via Zustand store + `useOnSelectionChange`.
> - **Key decisions:** Uses Zustand store for `selectedNodeId` instead of React Flow context (since sidebar is outside ReactFlowProvider). Ghost inputs (borderless, border on focus) for Obsidian-style inline editing.
> - **Deviations from plan:** Type field uses Select instead of Badge (user requested editable). Section title is static "Node Properties" instead of dynamic entity info.
> - **Postponed:** Multi-line header height measurement for container padding (moved to separate PRD).

# PRD 0054: Metadata in Sidebar

## Overview

Add a new collapsible section to the right sidebar that displays all properties of the currently selected node (excluding `content`). Properties are shown in a two-column grid layout (`96px label | value`) with ghost inputs for editable fields — borderless until hovered/focused, matching Obsidian-style inline editing. The entity `id` field is editable and paired with a "Refresh Edges" button to update any edges referencing the old ID.

## Specification / Acceptance Criteria

### US1: Section visibility

- When **no node is selected**, the section shows nothing (it is either hidden or shows an empty collapsed state).
- When **one node is selected**, the section displays all properties of that entity.
- When **multiple nodes are selected**, the section shows properties of the most recently selected node (React Flow's built-in selection order — the last node in the selection set).
- The section uses the existing `CollapsibleSection` layout wrapper for consistency with Backups, Workspace Info, and Experimental sections.

### US2: Property rows

All properties of the entity except `content` are displayed as rows in a `grid-cols-[96px_1fr]` layout:

| Group | Field | Widget | Editable |
|---|---|---|---|
| Identity | `id` | Input (borderless, focus:border-ring) | Yes |
| | `type` | Badge (colored by entity type) | No |
| | `parentId` | Badge or text (show "—" if none) | No |
| Timestamps | `createdAt` | Formatted date + time | No |
| | `updatedAt` | Formatted date + time | No |
| Canvas | `x` | Input (number, grid-snapped on blur) | Yes |
| | `y` | Input (number, grid-snapped on blur) | Yes |
| | `width` | Input (number, grid-snapped on blur) | Yes |
| | `height` | Input (number, grid-snapped on blur) | Yes |
| Metadata | Key/value pairs | Dynamic rows: `[key Input] [value Input]` | Yes |
| | Add entry | Button "+" at bottom of metadata list | — |

Implementation notes:
- All Input widgets use ghost styling: `border-transparent hover:border-muted focus:border-ring focus:ring-0`.
- Each field row: `grid grid-cols-[96px_1fr] gap-2 items-center px-2`.
- Editable fields commit on blur by calling the store's `updateEntity`.
- Numeric fields (`x`, `y`, `width`, `height`) snap to the 16px grid on blur via `Math.ceil(val / 16) * 16`.
- Timestamps are formatted with `Intl.DateTimeFormat` (e.g., "May 28, 2026, 2:38 PM").
- Metadata keys are `string`, values are displayed as `string` (values that are not strings are `JSON.stringify`-d).

### US3: Editable ID with "Refresh Edges" button

- The `id` field is rendered as an Input, not read-only text.
- Next to the `id` input, a small "Refresh Edges" button (IconButton with `ArrowsClockwise` icon, variant="ghost") allows the user to update all edges that reference the old ID.
- When the user edits the `id` and clicks "Refresh Edges":
  1. The entity's `id` is updated in the store (this changes the primary key).
  2. All relations where `source === oldId` or `target === oldId` are updated to reference the new `id`.
  3. The store's `entities` and `relations` arrays are updated atomically.
  4. A single undo batch entry wraps the entire operation.
- The button should be disabled (muted) if the ID hasn't changed from its original value.
- The button shows a brief success indicator (e.g., the icon spins once) after the update.

### US4: Collapsible section with rotating caret

- The metadata section uses `CollapsibleSection` (same as other sections).
- Default state: expanded.
- When no node is selected, the collapsible trigger label reads "Selection" and the content area shows a muted placeholder: "Click a node to inspect its properties".
- When a node is selected, the trigger label shows `{entity.type}: {entity.content || entity.id}` (e.g. "segment: About This Workspace").

### US5: Container/presenter pattern

- `SelectionMetadataSection.tsx` — presenter, accepts explicit entity and update callbacks as props.
- `SelectionMetadataSectionContainer.tsx` — container, reads selected entity from React Flow's `useStore` and Zustand store, defines update handlers.
- The container:
  1. Uses React Flow's `useStore` to get the selected node IDs.
  2. Finds the matching entity from Zustand store's `entities`.
  3. Passes the entity (or `null` if no selection) to the presenter.
- `AppSidebar.tsx` imports the container and slots it into `SidebarContent` (after Experimental, i.e. last section).

### US6: "Refresh Edges" store action

- Add a new action `updateEntityId(oldId: string, newId: string)` to the Zustand store.
- This action:
  1. Updates `entities` — re-key the entity with `newId`.
  2. Updates `relations` — replace any `source === oldId` or `target === oldId` with `newId`.
  3. Creates a single undo batch entry (snapshot before + after the change).
  4. Updates `contentCache` key if the entity is a container.
  5. Sets `pendingNodeRef.current` to the new ID so the sync layer picks it up.

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| No node selected | Section shows placeholder text |
| Node selected, then deselected | Section clears back to placeholder |
| Editing `id` to a value that already exists | Show error state on the input, reject the update |
| Editing a numeric field to a non-numeric value | Revert to last valid value on blur |
| Very long entity type badges | `truncate` class with max-width |
| Metadata value is an object/array | Display as `JSON.stringify` truncated to 80 chars |
| Entity deleted while selected | Section clears to placeholder on next render |
| Rapid ID edits with Refresh Edges | Each click processes the current value of the input |

## Files Changed

| File | Change |
|------|--------|
| `src/canvas/panels/sections/SelectionMetadataSection.tsx` | **NEW** — presenter with property rows, ghost inputs, metadata editor |
| `src/canvas/panels/sections/SelectionMetadataSectionContainer.tsx` | **NEW** — container, reads selected entity from React Flow store |
| `src/canvas/panels/AppSidebar.tsx` | Import and render `SelectionMetadataSectionContainer` |
| `src/store/useGraphStore.ts` | Add `updateEntityId(oldId, newId)` action |
| `src/types/graph.ts` | No changes unless adding a type for the action |

## Implementation Strategy

### Step 1: Store action `updateEntityId`

Add to `useGraphStore.ts`:
- Snapshots the current state.
- Creates new entities array with the re-keyed entity.
- Creates new relations array with updated source/target references.
- Updates `contentCache` if applicable.
- Wraps in `beginBatch`/`endBatch`.

### Step 2: Container with selection detection

Uses `useStore` from `@xyflow/react`:
```tsx
const selectedNodeIds = useStore((s) => s.getNodes().filter((n) => n.selected).map((n) => n.id))
```
Then finds the matching entity from Zustand's `entities`.

### Step 3: Presenter with property grid

A single component rendering all property groups inside a `CollapsibleSection`. Each group is separated by a thin `Separator`. Editable fields commit via `onChange` callbacks passed from the container.

## Size Advisory

Small-medium — ~3 new files, ~1 store modification. The refresh-edges logic in the store is the most complex part.
