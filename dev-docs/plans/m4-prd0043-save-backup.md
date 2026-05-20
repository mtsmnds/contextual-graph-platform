# m4-prd0043 — Save / Backup

## Overview

A button in the top-right panel opens a floating menu (popover) listing saved graph backups. The user can create a new backup (snapshot of the full graph state), see them listed newest-to-oldest with timestamp and size, and delete individual backups with a confirmation modal.

This is a safety net — useful during testing, before large refactors, and as a manual checkpoint. Backups are independent from auto-save: auto-save continues to write the live workspace; backups are explicit user snapshots that don't interfere.

## Specification / Acceptance Criteria

### 1. Backup Storage

Backups are stored in the existing IndexedDB database (`react-roadmap`) in a new `backups` table:

```ts
// IndexedDB table: backups
// Key: backup id (string)
// Value: { id, timestamp, snapshot: GraphSnapshot }

type BackupEntry = {
  id: string         // uuid or timestamp-based
  timestamp: number   // Date.now() at time of create
  snapshot: GraphSnapshot  // { version, entities, relations, canvas }
}
```

- The `backups` table is versioned in the Dexie schema alongside existing `graph` and `documents` tables.
- Backups **do not** include container content documents (TipTap JSON). Those are large and the graph structure (entities + relations + positions) is sufficient for recovery. Title bar shows a note: "Backups save graph structure only (not container contents)."
- The live workspace (auto-save) is never affected by backup operations.

### 2. Create Backup

- Trigger: clicking the **"+"** button (first item in the backup list).
- Action: snapshots the current store state (`entities`, `relations`, `canvas`) into a `GraphSnapshot`, assigns a timestamp-based ID, stores in IndexedDB.
- Feedback: new entry appears at the top of the list with a brief highlight/flash.

### 3. List Backups

- Visible in a floating popover/dropdown menu, anchored to the backup button.
- List ordered **newest to oldest** (most recent backup at top).
- Each entry shows:
  - **Timestamp**: formatted as locale date + time (e.g., "May 19, 2026, 14:32:05")
  - **Size**: JSON byte length of the snapshot, formatted as KB (e.g., "12.4 KB")
  - **Delete button** (trash can icon) on the right

### 4. Delete Backup

- Clicking the trash icon opens a **confirmation modal** (dialog).
- Modal content:
  - Title: "Delete backup?"
  - Body: "This action cannot be undone. The backup from {timestamp} will be permanently deleted."
  - Buttons: "Cancel" (outline) / "Delete" (destructive/red)
- On confirm: deletes the backup from IndexedDB. Entry disappears from the list.
- Modal uses a shadcn `AlertDialog` or simple window.confirm-style dialog.

### 5. UI Layout

**Backup button** in the top-right panel button group (same group as "New Node", "Open Folder"):

```
[Undo] [Redo] | [Backup] [New Node] [Open Folder]
```

Using a **FloppyDisk / Save / Archive** icon from `lucide-react`. Button variant: `outline`, `size="sm"`.

**Popover:** Opens below the button. Uses shadcn `Popover` or a manual positioned `<div>` with `position: fixed` (similar to the existing context menu pattern). Contains:

```
┌─────────────────────────────────────┐
│  Backups                            │
├─────────────────────────────────────┤
│  +  Create backup                   │  ← first item, always present
├─────────────────────────────────────┤
│  May 19, 2026, 14:32:05   12.4 KB 🗑│
│  May 19, 2026, 11:15:22    8.1 KB 🗑│
│  May 18, 2026, 23:01:10   10.2 KB 🗑│
│  ...                                │
└─────────────────────────────────────┘
```

- Popover closes on click-outside or Escape.
- Scrollable if many backups exist (max height ~300px with overflow-y).
- Empty state (no backups yet): show "No backups yet. Create one with the + button above."

### 6. Future-Only Scope

**NOT included in v1:**
- Restore backup (load a backup into the active workspace). This is a natural next step but adds complexity (confirmation, overwrite risk). The user can manually inspect backup data via DevTools if needed.
- Export/download backup as JSON file.
- Backup auto-rotation / max count limit.
- Container content inclusion.

These are noted for future PRDs.

## Files Changed (inferred)

- `src/engine/backup.ts` (new) — `createBackup(snapshot)`, `listBackups()`, `deleteBackup(id)`, `getBackupSize(snapshot)` functions. Uses Dexie directly via the existing `react-roadmap` database (add `backups` table).
- `src/store/persistence/indexeddb-adapter.ts` — Add `backups` table to Dexie schema (version bump: v1 → v2 with new table).
- `src/canvas/GraphCanvas.tsx` — Add backup button + popover component to top-right Panel; wire create/list/delete actions.
- `src/canvas/panels/BackupMenu.tsx` (new) — Backup popover component with list rendering, create button, delete trash icons, confirmation dialog.
- `src/index.css` — Minimal styles for backup popover (positioning, list item hover, scrollable container).

## Phases

Single pass — one new engine module, one new UI component, wiring in GraphCanvas.

## Size Advisory

~4 files modified/created. The engine module uses existing Dexie infrastructure. The UI reuses shadcn Popover/AlertDialog patterns. Straightforward.
