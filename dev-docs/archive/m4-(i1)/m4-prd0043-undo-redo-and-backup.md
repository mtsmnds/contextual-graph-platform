# m4-prd0043 — Undo/Redo + Backups

> **Completion note (2026-05-23):**
> - **What was built:** Unified snapshot-based undo/redo (50 entries, depth-counter batching) + auto-backup persistence (2s idle guard, 10 recent entries) + manual backups (FS Access). UI merged into `WorkspaceMenu.tsx` three-dot menu with undo/redo buttons, Open Folder, and backup sections. Cmd+Z/Cmd+Shift+Z with focus guard. Batch wrapping on all tracked mutations, onNodesDelete, onEdgesDelete, and Cmd+drag. PRD0044 (schema v5) implemented immediately after on same branch.
> - **Key decisions:** Used snapshots over command pattern for zero-maintenance undo. Auto-backup piggybacks on existing auto-save with 2s idle guard. Backup storage split into `auto/` (rotated) and `manual/` (persist forever). UI consolidated into three-dot menu per user request (replaced multi-button panel).
> - **Deviations from plan:** Backup panel changed from separate `BackupMenu.tsx` popover to merged `WorkspaceMenu.tsx`. Undo/redo buttons moved inside the three-dot menu instead of standalone in the panel. "New Node" button removed (double-click handles creation). The original PRD called `ArrowURightDown` for redo; switched to `ArrowUUpRight` (proper mirror of `ArrowUUpLeft`).
> - **Postponed:** Nothing.

## Overview

A unified snapshot-based system powering both undo/redo and workspace backups. The same mechanism — capturing the full domain state (`entities`, `relations`, `canvas`) before each tracked mutation — serves two purposes: intra-session recovery via Cmd+Z and cross-session safety via disk-persisted snapshots.

The backup panel shows manual saves at the top and auto-persisted undo snapshots (up to 10) with relative timestamps below, giving users a crash-recovery net that's always up to date without extra effort.

**Why snapshots (not commands):** The product will grow — more store actions, more mutation types. A command-pattern approach requires per-mutation undo/redo logic that must be kept in sync with each new feature. Snapshots require zero per-mutation logic: every new feature is automatically undoable. The graph is small enough that memory is not a constraint (50 snapshots of the full domain state is negligible). Persisting recent snapshots to disk adds the crash-recovery benefit at no additional complexity.

## Specification / Acceptance Criteria

### 1. Snapshot-Based History (Undo/Redo)

Before each tracked mutation, the current domain state is pushed onto an undo stack. Undo restores a previous snapshot; redo restores a later one.

```
undo stack: [S₀, S₁, S₂, ...]  ← most recent at end
redo stack: [Sₐ, S_b, ...]     ← cleared on every new snapshot
```

**Snapshot entry** (internal, not persisted — lives in memory only, lost on page reload):

```ts
type HistoryEntry = {
  entities: Entity[];
  relations: Relation[];
  canvas: CanvasState;     // includes positions, dimensions, viewport
  description: string;     // human-readable label (e.g., "Create node", "Delete 3 nodes")
  timestamp: number;       // Date.now() — used for relative-time display in backup panel
}
```

Max history: **50 entries**. Oldest dropped when exceeded. Redo stack is cleared whenever a new snapshot is pushed (standard undo/redo behavior). After restoring a snapshot via `setState`, React Flow's existing `useEffect` in `GraphCanvas.tsx` automatically reconciles nodes and edges from the restored domain state.

### 2. Tracked Operations

Same as original m4-prd0043 — `addEntity`, `updateEntity`, `deleteEntity`, `addRelation`, `removeRelation`, `updateRelation`, `replaceCanvasPositions` — each wrapped internally with `beginBatch(desc)` / `endBatch()`.

See original spec for full details (unchanged from m4-prd0043 sections 2-5).

### 3. Excluded from History

Same as original m4-prd0043 — position drags, viewport, canvas resize, focus/panel state, Tiptap content saves.

### 4. Batch Grouping

Same as original m4-prd0043 — depth-counter pattern, canvas-level batches for multi-select delete, Cmd+drag duplicate, re-layout.

### 5. Keyboard Shortcuts

Same as original m4-prd0043 — Cmd+Z / Cmd+Shift+Z with focus guard.

### 6. UI: Undo/Redo Buttons

Same placement as original m4-prd0043 — nested ButtonGroup left of the main buttons:

```
[Nested ButtonGroup: [Undo] [Redo]]  ──gap──  [Backup] [New Node] [Open Folder]
```

- **Undo** — `ArrowUUpLeft` icon, disabled when undo stack is empty
- **Redo** — `ArrowURightDown` icon, disabled when redo stack is empty
- Both show tooltip with description (e.g., "Undo Delete 3 nodes")

### 7. Auto-Backup Persistence (New)

**What gets persisted:** The 10 most recent undo snapshots are written to disk alongside every auto-save cycle. Each entry is the full `HistoryEntry` — including document content (gathered from `contentCache`).

**Storage layout:**

```
~/my-workspace/
  graph.json                          ← live workspace
  documents/                          ← live document content
  backups/
    auto/                             ← auto-persisted undo snapshots (capped at 10)
      snapshot_1716220920123.json     ← full HistoryEntry + documents
      snapshot_1716220850000.json
    manual/                           ← explicit user saves (kept forever)
      1716220920123/
        graph.json
        documents/
          doc_1720000000000.json
```

**When does the disk write happen?** Piggyback on the existing auto-save mechanism:

1. A snapshot is pushed to the undo stack (already happens on every `endBatch`)
2. The existing auto-save subscriber (300ms debounce) fires after each mutation
3. Inside the subscriber, after persisting `graph.json`, check: **has it been at least 2 seconds since the last mutation?** (`Date.now() - lastMutationTime >= 2000`)
4. If yes: persist recent undo snapshots that haven't been persisted yet (up to 10), including document content
5. If no: skip — the snapshot exists in memory for undo, we'll write on the next idle pause

This means:
- No disk writes during rapid editing (typing, dragging, chained deletes)
- Catches natural pauses — exactly the moments a user would want crash recovery
- Reuses existing auto-save infrastructure — no new timers or subscriptions
- If the user never pauses for 2s? The snapshot stays in the undo stack (in memory). On page reload it's lost, but that's an acceptable tradeoff vs. thrashing disk writes.

**On workspace load:** scan `backups/auto/` for entries. If any exist, show a subtle banner: "You have unsaved snapshots from your last session — [Restore] [Dismiss]". Dismiss clears the auto-backup directory. Restore opens the most recent one.

**Capping:** After writing new auto-backups, if count > 10, delete the oldest entries (by filename timestamp).

**Rotation:** Auto-backup entries are never deleted by the user — they rotate automatically. Manual saves are separate.

### 8. Manual Backups (FS Access only)

The user can create explicit checkpoints via the backup panel. These are full copies stored in `backups/manual/<timestamp>/` and kept forever.

**Storage:** Full `GraphSnapshot` + all document content from `contentCache`.

**Guard:** The "+" button is disabled when the workspace has no entities. Hidden entirely (not just disabled) when `getAdapterHandle()` returns `null` (IndexedDB mode).

**Loading state:** On click, button icon swaps to `Hourglass` and becomes `disabled` until the write completes.

### 9. Backup Panel UI

Opens via a popover anchored to the backup button (`FloppyDisk` icon) in the top-right ButtonGroup.

```
┌──────────────────────────────────────┐
│ Backups / Snapshots                 │
│                                      │
│ [+ Save checkpoint now]              │
│ ───────────────────────────────      │
│ MANUAL SAVES                         │
│  May 19, 2026, 14:32:05     ⏪ 🗑    │
│  May 18, 2026, 09:15:22     ⏪ 🗑    │
│ ───────────────────────────────      │
│ RECENT SNAPSHOTS (last 10)           │
│  2m ago   — Edit node             ⏪  │
│  15m ago  — Delete 3 nodes        ⏪  │
│  1h ago   — Create node           ⏪  │
│  ...                                 │
└──────────────────────────────────────┘
```

**Manual saves section:**
- Date/time format (locale-formatted)
- Restore button (`ArrowCounterClockwise`) — opens confirmation dialog
- Delete button (`Trash`) — opens confirmation dialog
- Restore = read snapshot + documents, call `setState`, load contentCache
- Delete = remove directory via `rootHandle.removeEntry`

**Recent snapshots section:**
- Relative timestamps: `Xm ago`, `Xh ago`, `Xd ago`, formatted from `entry.timestamp`
- Description text from the HistoryEntry
- Restore button only (no delete — auto-rotation handles cleanup)
- Max 10 entries, newest first
- Clicking restore works the same as manual restore but writes to `backups/auto/` files

**Empty state:** "No backups yet. Create one with the + button above." (manual section hidden if empty; recent snapshots section hidden if empty)

**Scrollable:** max height ~320px with `overflow-y: auto`.

### 10. Restore Flow (both manual + auto)

1. Click restore → confirmation dialog: "Restore backup?" / "Your current workspace will be replaced with the state from {timestamp}." / [Cancel] [Restore]
2. On confirm: read the snapshot file, read companion document files, call `useGraphStore.setState({ entities, relations, canvas })`, load documents into `contentCache`
3. Auto-save fires normally (300ms debounce), persisting restored state to live workspace
4. Popover closes, canvas re-renders
5. The backup is NOT deleted on restore

### 11. Delete Flow (manual only)

1. Click trash → confirmation dialog: "Delete backup?" / "The backup from {timestamp} will be permanently deleted." / [Cancel] [Delete]
2. On confirm: `rootHandle.removeEntry("backups/manual/{id}", { recursive: true })`
3. Entry disappears from list

### 12. State Reset

- On `init()` (workspace load, switch folder): undo stack and redo stack are cleared. Auto-backup directory is scanned for persisted snapshots (show banner if found).
- On page reload: undo/redo history is lost (in-memory only). Auto-backup snapshots survive on disk — the "unsaved snapshots" banner on next open provides crash recovery.
- Manual backups survive everything (they're on disk).

### 13. Edge Cases

- **Workspace folder has no `backups/` directory yet:** First auto-backup or manual backup creates it.
- **User switches folders:** `init()` resets the store. The backup panel reflects the new folder's `backups/` on next open.
- **Permission error (FS Access):** If the handle loses permission, show the list as stale and disable create. Backup button can show a `WarningCircle` overlay.
- **Empty workspace:** "+" button disabled, show "Nothing to back up yet — the workspace is empty."
- **Rapid editing with no 2s pause:** Snapshots accumulate in the undo stack (memory) but don't persist to disk. On page reload, the auto-backup banner shows whatever was last persisted (possibly stale, possibly empty). Acceptable — und/redo is for intra-session, not crash recovery.

### 14. Adapter Integration

- **FS Access mode:** Full backup functionality — manual + auto. `FSAccessAdapter` exposes `getRootHandle()`.
- **IndexedDB mode:** Backup button and auto-backup are hidden. IndexedDB has no directory structure.
- `IndexedDBAdapter.getRootHandle()` returns `null`.
- Store exposes `getAdapterHandle(): FileSystemDirectoryHandle | null`.

## Files Changed

| File | Change |
|------|--------|
| `src/store/useGraphStore.ts` | Add `undoStack`, `redoStack`, `batchDepth`, `batchDescription`, `_takeSnapshot`, `undo`, `redo`; wrap 7 mutators; add `lastMutationTime` tracking; extend auto-save subscriber to persist recent undo snapshots (2s idle guard + include documents); clear history on `init()`; add `getAdapterHandle()` |
| `src/engine/backup.ts` (new) | Engine functions: `createManualBackup(handle, snapshot, contentCache)`, `listBackups(handle)`, `listAutoSnapshots(handle)`, `deleteManualBackup(handle, id)`, `restoreBackup(handle, id)`, `restoreAutoSnapshot(handle, filename)`, `clearAutoSnapshots(handle)`, `persistRecentSnapshots(handle, entries, contentCache)` |
| `src/store/persistence/types.ts` | Add `getRootHandle?(): FileSystemDirectoryHandle \| null` to `PersistenceAdapter` |
| `src/store/persistence/fs-access-adapter.ts` | Implement `getRootHandle()` |
| `src/store/persistence/indexeddb-adapter.ts` | Implement `getRootHandle()` — returns `null` |
| `src/canvas/GraphCanvas.tsx` | Add undo/redo buttons + backup button + popover to top-right Panel; keyboard listener for Cmd+Z/Cmd+Shift+Z; wrap `onNodesDelete` + Cmd+drag in batch |
| `src/canvas/panels/BackupMenu.tsx` (new) | Popover with manual saves list, recent snapshots list, restore/delete dialogs, "+" create button. Uses relative time formatting. Calls engine functions. |

## Phases

Single pass — snapshot engine, persist layer, undo/redo wiring, backup UI.

## Size Advisory

~4 files modified, ~2 new files. The store changes are mechanical wrappers (same scale as original m4-prd0043) plus the auto-backup persistence branch in the auto-save subscriber. The backup engine is ~100 lines (file I/O). BackupMenu.tsx is ~200 lines (popover + list + dialogs). The adapter interface additions are ~5 lines each.

## Design Notes

- **Why 2s idle guard instead of requestIdleCallback:** Simpler, no fallback needed, reuses existing auto-save subscription. `requestIdleCallback` is available only in Chromium and has unpredictable timing. A 2s threshold aligns with "user pauses to think" behavior.
- **Why separate `auto/` and `manual/` directories:** Clear lifecycle boundary. Auto snapshots are disposable (rotated, no delete UI, no confirmation on restore). Manual saves are user-treasured (persist forever, delete UI, confirmation dialogs). The directory split makes it impossible to accidentally delete a manual save through auto-rotation logic.
- **Why auto snapshots include document content:** Crash recovery must restore the full workspace — not just the graph but every document's Tiptap JSON. Without documents, restoring an auto-snapshot would leave container content in the state it had at page load, not at the time of the snapshot.
- **Snapshot capture is cheap:** `get().entities`, `get().relations`, `get().canvas` — shallow reference copies. Zustand creates new references on every mutation, so captured arrays remain frozen at snapshot time. Adding `contentCache` lookups (for document content in auto-backup persist) adds cost only at persist time, not at snapshot time.
- **Undo/redo is always synchronous** — snapshots go to memory instantly. The disk write for auto-backup is async and non-blocking. Undo/redo never waits for disk.