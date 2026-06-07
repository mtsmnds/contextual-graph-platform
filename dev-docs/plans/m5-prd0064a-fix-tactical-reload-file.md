Reload from File — Tactical Fix ￼

What: A “Reload from File” button next to “Open Folder” in the sidebar. Reads ‎`graph.json` from the FS Access directory and replaces the in-memory store. Shows a confirmation dialog if there are unsaved changes.

Button behavior:

- Only visible when FS Access is active (folder is open). Hidden when using IndexedDB-only.

- On click:

 a. Check if the store has unsaved changes (dirty flag — store state differs from last save)

 b. If dirty → show confirmation dialog: “You have unsaved changes. Reload from file?” with Cancel / Reload

 c. If clean (or user confirms) → call ‎`adapter.loadWorkspace()`, replace store entities + relations, suppress auto-save for that cycle

Store changes (‎`useGraphStore.ts`):

```ts
reloadFromFile: async () => {
  const adapter = get().adapter
  if (!adapter || adapter.id !== 'fs-access') return

  const snapshot = await adapter.loadWorkspace()
  if (!snapshot) return

  set((state) => ({
    entities: snapshot.entities,
    relations: snapshot.relations,
    _skipNextSave: true,  // suppress auto-save subscriber
  }))
}

```

The ‎`_skipNextSave` flag is checked in the auto-save subscriber (‎`subscribe` at ~line 766). When ‎`true`, the subscriber skips that save and resets the flag. This prevents the freshly-loaded data from immediately triggering a write-back to the file.

Dirty detection: Compare current ‎`entities`/‎`relations` against the last-saved snapshot. You already track snapshots for undo — the simplest approach is to compare the current state hash against the last auto-save hash. Or simpler: set a ‎`_lastSavedAt` timestamp on every auto-save, and set a ‎`_lastModifiedAt` timestamp on every store mutation. Dirty = ‎`_lastModifiedAt > _lastSavedAt`.

UI placement (‎`AppSidebar.tsx` or wherever the “Open Folder” button lives):

- An icon button (e.g., ‎`RotateCcw` from lucide) next to the “Open Folder” button

- Tooltip: “Reload from file”

- Disabled/hidden when no FS folder is connected

Confirmation dialog: Reuse the existing ‎`Dialog` component (you already have it in ‎`src/stories/Dialog.stories.tsx`). Two buttons: Cancel and Reload.

Files changed:



|File                                                                               |Change                                                                                                 |

|-----------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|

|`src/store/useGraphStore.ts`                                                       |Add `reloadFromFile()` action, `_skipNextSave` flag, dirty detection (`_lastSavedAt`/`_lastModifiedAt`)|

|`src/store/useGraphStore.ts`                                                       |Guard the auto-save subscriber to check `_skipNextSave`                                                |

|`src/components/sidebar/WorkspaceInfoSection.tsx` (or wherever “Open Folder” lives)|Add “Reload from File” icon button next to “Open Folder”, with confirmation dialog                     |

Tests:



|Test                                            |What it verifies                                              |

|------------------------------------------------|--------------------------------------------------------------|

|`reloadFromFile replaces entities and relations`|Mock adapter, call reload, assert store state matches snapshot|

|`reloadFromFile suppresses auto-save`           |After reload, verify auto-save subscriber skips one cycle     |

|`reloadFromFile is no-op without FS Access`     |When adapter is IndexedDB, calling reload does nothing        |

|`dirty detection`                               |Mutate store after save → dirty. Save → clean. Reload → clean.|

