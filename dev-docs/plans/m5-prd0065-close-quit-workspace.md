# PRD 0065: Close/Quit Workspace

## Overview

A single-button action that resets the store to a blank state, allowing the user to close the current workspace and open a fresh one. This is a simpler alternative to "reload from file" — close the workspace, then reopen it with "Open Folder" to get a fresh read of `graph.json`.

## Solution

### Store action (`useGraphStore.ts`)

```ts
closeWorkspace: () => {
  const keys = Object.keys(contentCache)
  for (const key of keys) delete contentCache[key]
  _adapter = null
  _hydrated = false
  set({
    entities: [],
    relations: [],
    canvas: {},
    view: { focusedEntityId: null, anchorEntityId: null, visibleEntityIds: [], expandedPanels: [] },
    contentLoaded: {},
    adapterId: null,
    folderName: null,
    hydrated: false,
    selectedNodeId: null,
    undoStack: [],
    redoStack: [],
    batchDepth: 0,
    _pendingSnapshot: null,
    lastMutationTime: 0,
  })
}
```

Resets module-level `_adapter` and `_hydrated` so the auto-save subscriber becomes inert (it guards on `!_hydrated`). Clears all state including undo/redo stacks. No confirmation dialog — same mental model as closing a tab.

### UI (`AppSidebar.tsx`)

A "Close Workspace" button in the sidebar footer, below "Open Folder". Only visible when a workspace is open (`folderName != null`). Icon: `SignOut` from `@phosphor-icons/react`.

### Flow

1. User clicks "Close Workspace" → store resets, sidebar shows blank slate
2. User clicks "Open Folder" → normal init flow reads fresh `graph.json`

## Acceptance Criteria

- AC1: Clicking "Close Workspace" clears all entities and relations from the store.
- AC2: The button is only visible when `folderName` is set (a workspace is open).
- AC3: After closing, clicking "Open Folder" loads a fresh workspace from the filesystem.
- AC4: The auto-save subscriber does not fire after close (no errors, no writes to stale adapter).
- AC5: Undo/redo stacks are cleared — no stale history from the closed workspace.

## Files Changed

|File                        |Change                                                                        |
|----------------------------|------------------------------------------------------------------------------|
|`src/store/useGraphStore.ts`|Add `closeWorkspace()` action; resets module vars and store state              |
|`src/canvas/panels/AppSidebar.tsx`|Add "Close Workspace" button gated by `folderName != null`              |

## Tests

|Test                                             |What it verifies                                              |
|-------------------------------------------------|--------------------------------------------------------------|
|`closeWorkspace clears entities and relations`   |After close, store has empty arrays                           |
|`closeWorkspace resets folderName and adapterId` |Store reflects blank state, UI hides the close button         |
|`closeWorkspace suppresses auto-save`            |Auto-save subscriber skips after close (`_hydrated` is false) |
