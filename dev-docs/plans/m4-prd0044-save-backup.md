# m4-prd0044 — Backups

## Overview

A button in the top-right panel opens a popover listing saved workspace backups. Backups are full copies of the current workspace — entities, relations, canvas positions, and all container content documents — stored in `<workspace>/backups/<id>/` sub-directories. The user can create, restore, and delete backups.

This is a safety net: checkpoint before large refactors, experiment safely, recover from mistakes. Backups are independent from auto-save and never overwrite the live workspace unless the user explicitly restores one.

Backups require the FS Access adapter (the workspace lives on disk in a user-chosen folder). In IndexedDB mode, the backup button is hidden.

## Specification / Acceptance Criteria

### 1. Backup Storage

Each backup is a sub-directory inside the workspace folder's `backups/` directory, mirroring the workspace structure:

```
~/my-workspace/
  graph.json                          ← live workspace
  documents/
    doc_1720000000000.json
  backups/
    1716220920123/                    ← backup id = timestamp
      graph.json                      ← full GraphSnapshot at backup time
      documents/                      ← all container content at backup time
        doc_1720000000000.json
    1716221000000/
      graph.json
      documents/
        doc_1720000000000.json
```

**What gets copied into a backup:**

- `graph.json` — full `GraphSnapshot`: `{ version, entities, relations, canvas }`
- `documents/` — every container entity's Tiptap JSON content from `contentCache` at the time of backup

**What does NOT get backed up:**

- In-memory-only state (undo/redo history, view state, `hydrated` flag)
- The `backups/` directory itself (no recursive backups of backups)

### 2. Adapter Integration

- **FS Access mode:** Backup button is visible and functional. The engine uses the root `FileSystemDirectoryHandle` to manage the `backups/` sub-directory.
- **IndexedDB mode:** Backup button is hidden. IndexedDB is a single-file store with no directory structure — sub-folder backups don't apply.
- To give the backup engine access to the root handle, `FSAccessAdapter` exposes a `getRootHandle(): FileSystemDirectoryHandle | null` method. `useGraphStore` delegates to it via a `getAdapterHandle()` method. `IndexedDBAdapter.getRootHandle()` returns `null`.

### 3. Create Backup

- **Trigger:** "+" button (first item at the top of the backup list in the popover).
- **Guard:** The button is disabled when the workspace has no entities (empty canvas — nothing to back up).
- **Action:**
  1. Gather current state: `useGraphStore.getState().entities`, `.relations`, `.canvas`
  2. Gather all container content from `contentCache`: `useGraphStore.getState().getContent(id)` for each container entity
  3. Create `backups/<timestamp>/` directory via `FileSystemDirectoryHandle`
  4. Write `graph.json` + `documents/{id}.json` into the backup directory
- **Loading state:** On click, the "+" button's icon swaps to `Hourglass` and the button becomes `disabled`. It stays in this state until the backup write completes and the list refreshes. This prevents double-clicks (the ID is timestamp-based, but the UX guard is cleaner).
- **Feedback:** After completion, the new backup appears at the top of the list. The button re-enables.

### 4. List Backups

- Visible inside a shadcn `Popover` anchored to the backup button in the top-right Panel.
- List ordered **newest to oldest** (sorted by timestamp, descending).
- Each entry shows:
  - **Timestamp** — locale-formatted date + time (e.g., "May 19, 2026, 14:32:05")
  - **Size** — approximate size of the backup directory (sum of `graph.json` + all document files), formatted as KB (e.g., "12.4 KB"). If exact size is hard to get from the File System Access API, estimate from JSON byte length of the snapshot.
  - **Restore button** — Phosphor `ArrowCounterClockwise` icon (or `ClockCounterClockwise`), tooltip "Restore this backup"
  - **Delete button** — Phosphor `Trash` icon, tooltip "Delete backup"
- Scrollable if many backups exist (max height ~320px with `overflow-y: auto`).
- Empty state: "No backups yet. Create one with the + button above."
- Popover closes on click-outside or Escape.

### 5. Restore Backup

- Clicking the restore icon (or the backup entry row itself) opens a confirmation dialog.
- Dialog content:
  - Title: "Restore backup?"
  - Body: "Your current workspace will be replaced with the state from {timestamp}. This cannot be undone."
  - Buttons: "Cancel" (outline) / "Restore" (primary/default)
- On confirm:
  1. Read `graph.json` from the backup directory
  2. Read all `documents/{id}.json` files
  3. Call `useGraphStore.setState({ entities, relations, canvas })` with the backup's snapshot
  4. Load all document content into `contentCache` — either via `saveContent` or direct cache writes
  5. Auto-save fires normally (300ms debounce), persisting the restored state to the live workspace
- After restore: popover closes, canvas re-renders with restored data.
- The backup itself is NOT deleted on restore (it remains available for future use).

### 6. Delete Backup

- Clicking the trash icon opens a confirmation dialog.
- Dialog content:
  - Title: "Delete backup?"
  - Body: "The backup from {timestamp} will be permanently deleted. This cannot be undone."
  - Buttons: "Cancel" (outline) / "Delete" (destructive variant)
- On confirm: `rootHandle.removeEntry("backups/{id}", { recursive: true })` deletes the entire backup sub-directory. Entry disappears from the list.
- Dialog uses the existing `@/components/ui/dialog` component (built on `@base-ui/react/dialog`).

### 7. UI Layout

**Backup button** in the top-right panel, inside the main `ButtonGroup`:

```
[Undo] [Redo] | [Backup] [New Node] [Open Folder]
```

- Icon: Phosphor `FloppyDisk`
- Button: shadcn `Button` variant `outline`, `size="sm"`
- Tooltip on hover: "Backups"
- Hidden entirely (not just disabled) when `getAdapterHandle()` returns `null` (IndexedDB mode)

**Popover:** Uses the existing shadcn `Popover` component (`@/components/ui/popover.tsx`, built on `@base-ui/react/popover`). Anchored to the backup button, opens below.

**Confirmation dialogs (restore + delete):** Use the existing shadcn `Dialog` component (`@/components/ui/dialog.tsx`).

### 8. Edge Cases

- **Workspace folder has no `backups/` directory yet:** First backup creates it. List returns empty until then.
- **User switches folders:** `init()` resets the store — the backup list reflects the new folder's `backups/` directory on next open.
- **Permission error:** If the File System Access handle loses permission (e.g., user revokes it), show the list as stale and disable create. The backup button can show a Phosphor `WarningCircle` overlay. This is a rare edge case — the FS Access adapter already handles reconnection.
- **Backup directory is huge:** List still scrollable. No size limit enforced in v1.
- **Empty workspace:** "+" button disabled, show "Nothing to back up yet — the workspace is empty."

## Future-Only Scope

**NOT included in v1:**
- Export/download a backup as a ZIP file.
- Backup auto-rotation / max count limit.
- Differential backups (only store changes since last backup).
- Backup name/label (user-customized description beyond timestamp).

## Files Changed

| File | Change |
|------|--------|
| `src/engine/backup.ts` (new) | Engine functions: `createBackup(handle, snapshot, contentCache)`, `listBackups(handle)`, `deleteBackup(handle, id)`, `restoreBackup(handle, id)`. All take `FileSystemDirectoryHandle` as first parameter. Uses File System Access API directly — no Dexie/IndexedDB. |
| `src/store/persistence/types.ts` | Add `getRootHandle?(): FileSystemDirectoryHandle \| null` to `PersistenceAdapter` interface |
| `src/store/persistence/fs-access-adapter.ts` | Implement `getRootHandle()` — returns the stored `rootHandle` |
| `src/store/persistence/indexeddb-adapter.ts` | Implement `getRootHandle()` — returns `null` |
| `src/store/useGraphStore.ts` | Add `getAdapterHandle(): FileSystemDirectoryHandle \| null` to store interface, delegating to `_adapter?.getRootHandle?.()` |
| `src/canvas/GraphCanvas.tsx` | Add backup button + popover to top-right Panel; wrap in conditional check for `getAdapterHandle()` |
| `src/canvas/panels/BackupMenu.tsx` (new) | Popover with create/list/restore/delete UI. Manages local state for backup list, open/close, confirmation dialogs. Calls engine functions. Uses shadcn `Popover`, `Button`, `Dialog`. |
| `src/canvas/GraphContextMenu.tsx` | No changes |
| `src/canvas/edges/EdgeLabel.tsx` | No changes |

## Phases

Single pass — one engine module, one UI component, adapter interface additions, wiring in GraphCanvas.

## Size Advisory

`src/engine/backup.ts` (~80 lines), `src/canvas/panels/BackupMenu.tsx` (~150 lines), adapter additions (~10 lines each), GraphCanvas wiring (~20 lines). The engine module uses only the File System Access API (no new dependencies). The UI reuses existing shadcn Popover, Dialog, Button, and ButtonGroup components.

## Icon Map (all Phosphor)

| Usage | Icon |
|-------|------|
| Backup button | `FloppyDisk` |
| Create backup (list "+") | `Plus` |
| Restore backup | `ArrowCounterClockwise` |
| Delete backup | `Trash` |
| Button during save | `Hourglass` (temporary, swapped back after completion) |
| Permission error | `WarningCircle` |
