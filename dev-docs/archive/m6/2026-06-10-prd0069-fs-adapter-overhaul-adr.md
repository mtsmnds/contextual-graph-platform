# 2026-06-10: prd0069 — FS Access Adapter Overhaul

## Context

The existing `FSAccessAdapter` implemented the `PersistenceAdapter` interface and acted as a drop-in backend alongside `IndexedDBAdapter`. On app start, the resolver attempted to reconnect to the previously-opened FS folder via `tryReconnect()`. If successful, the FS adapter became the active persistence backend with auto-save on every mutation. This design had systemic problems:

- Permission revocation went undetected — writes would fail silently (errors caught by `.catch(() => {})`)
- Auto-save on every mutation meant the user had no visibility into whether data reached disk
- The `tryReconnect` path restored FS handles from IndexedDB, but after a page reload there was no way to verify the handle was still valid without attempting a write
- The resolver's "auto" mode mixed FS and IndexedDB concerns, making the startup path hard to reason about

## Decision

Replace the drop-in PersistenceAdapter model with a layered architecture:

```
Before:
  Store ⇄ PersistenceAdapter (FS or IndexedDB) ⇄ storage

After:
  Store ⇄ IndexedDBAdapter (always) ⇄ IndexedDB
  [Open/Save/Close UI] ⇄ FSAdapter (standalone) ⇄ disk
```

### What was built

1. **`FSAdapter`** — a standalone class (not implementing `PersistenceAdapter`) with three operations: `open()` (shows directory picker, reads and validates `graph.json`), `save()` (writes `graph.json`), `close()` (clears handle). Includes typed `FSError` with machine-readable codes, `validateSnapshot()` for schema validation, and a 100-entry ring-buffer operation log. Uses raw File System Access API.

2. **Store actions** — `openFromDisk(snapshot, folderName)`, `saveToDisk()`, `closeDisk()`, `isDirty()`. The store holds a module-level `_fsAdapter` reference set by the UI layer after `open()` succeeds.

3. **Resolver simplified** — always returns `IndexedDBAdapter`. The old `tryReconnect` path and "auto" mode are removed.

4. **UI wiring** — Open Folder button creates an `FSAdapter`, calls `open()`, and on success calls `store.openFromDisk()`. Empty folder shows confirm dialog. Save button (disabled without folder) calls `store.saveToDisk()`. Close Workspace resets to seed data.

5. **Dirty tracking** — `isDirty()` compares `lastMutationTime > lastDiskSaveAt`. A `beforeunload` listener in `WorkspaceRoot` shows the browser's unsaved-changes prompt when dirty.

6. **Stale folder session detection** — `localStorage` flag `react-roadmap:folder-open` is set on `openFromDisk`, cleared on `closeDisk`/`closeWorkspace`. On cold start, if the flag is set (reload after folder session without explicit close), `init` forces seed data instead of restoring stale IndexedDB data.

### Out of scope

- Auto-reconnect on page load (user must explicitly Open Folder)
- Save As (prompt on every save)
- `documents/` subdirectory pattern for individual document files
- UI polish for the dirty indicator (badge/icon)
- Visual close button effects

## Alternatives Considered

### Option A: Patch the existing FSAccessAdapter
Add error handling, user-visible dialogs, and explicit save/load to the existing adapter.
- **Pros:** Less code change, smaller diff.
- **Cons:** The dual-backend architecture (IndexedDB vs FS as runtime store) remains complex. The resolver's auto-mode logic and tryReconnect path would still need changes. The old adapter is tightly coupled to the PersistenceAdapter interface which it doesn't need.

### Option B: Build FSAdapter as a thin wrapper around PersistenceAdapter
Keep FSAdapter implementing PersistenceAdapter but simplify the resolver.
- **Cons:** The PersistenceAdapter interface includes `loadDocument`/`saveDocument`/`deleteDocument` which the new FSAdapter doesn't need (documents are out of scope). Implementing an interface with unused methods is misleading.

### Option C (chosen): Standalone FSAdapter with explicit operations
FSAdapter has its own interface focused solely on open/save/close. The PersistenceAdapter interface is retained for IndexedDB only.
- **Pros:** Clean separation of concerns. Each adapter does exactly one thing. No unused methods. The resolver becomes trivial. Auto-save to IndexedDB continues to work for crash recovery within a session.
- **Cons:** More files changed. The UI layer needs to coordinate between FSAdapter (for disk) and store actions (for state).

## Consequences

### Positive
- Clear user feedback — errors are surfaced via dialogs, saves are confirmed
- No silent failures — permission denial is caught and shown
- Simple startup — no tryReconnect, no auto mode, always IndexedDB
- Stale folder session data is safely discarded on reload
- The old `FSAccessAdapter` is preserved as-is for the legacy `/tiptap-editor-test` route

### Trade-offs
- User must explicitly Open Folder on each session (no auto-reconnect)
- Backup system (`BackupsSectionContainer`) only works when a folder is open (getAdapterHandle reads from FSAdapter). This is acceptable — backups to FS need an FS handle.
- The auto-save subscriber still writes to IndexedDB on every mutation. This is fine for crash recovery but means IndexedDB accumulates folder session data that won't be restored on reload.

### Risks
- Users may not realize a reload loses the FS handle and they need to re-open the folder. Mitigated by the UI status message ("No folder open — working from local storage only").
- The `localStorage` flag for stale session detection can be cleared by the user independently. If cleared and reloaded, stale IndexedDB data would be restored. This is an edge case we accept.

## Follow-ups
- None for this PRD. Potential future work: auto-reconnect, Save As, document subdirectory pattern, UI dirty indicator.
