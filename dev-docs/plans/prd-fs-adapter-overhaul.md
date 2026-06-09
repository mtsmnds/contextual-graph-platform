# PRD: FS Access Adapter Overhaul — Explicit Save/Load Model

## Overview

Replace the current `FSAccessAdapter` (which acts as a drop-in `PersistenceAdapter` backend with auto-save and silent reconnect) with a new standalone `FSAdapter` that treats file-on-disk as an explicit checkpoint. IndexedDB is always the runtime store. The FS adapter has three operations: Open (pick + read), Save (write), Close.

## Motivation

The current implementation has systemic silent-failure problems: permission revocation goes undetected, errors are swallowed, and the user has no visibility into whether data actually reached disk. Rather than patching the existing adapter, we build a simpler, correct one alongside it.

## Design

```
Before:
  Store ⇄ PersistenceAdapter (FS or IndexedDB) ⇄ storage

After:
  Store ⇄ IndexedDBAdapter (always) ⇄ IndexedDB
  [Open/Save/Close UI] ⇄ FSAdapter (standalone) ⇄ disk
```

IndexedDB is the runtime store. The FS adapter is invoked only by explicit user action. No auto-save to file, no background sync, no silent reconnect.

## Dependencies

- Raw File System Access API (`showDirectoryPicker`, `getFileHandle`, `createWritable`)
- No dependency on React, React Flow, or UI components from the adapter module

## FSError Class

Typed error with a machine-readable code and human-readable message:

```typescript
class FSError extends Error {
  readonly code: FSErrorCode;
  readonly detail: string;
  constructor(code: FSErrorCode, detail: string);
}

type FSErrorCode =
  | "PERMISSION_DENIED"      // handle expired or permission revoked
  | "NOT_FOUND"              // graph.json does not exist
  | "PARSE_FAILED"           // file exists but is not valid JSON
  | "VALIDATION_FAILED"      // JSON is valid but shape is wrong
  | "VERSION_TOO_NEW"        // file version > app supported version
  | "WRITE_FAILED"           // file write failed (disk full, permission, etc.)
  | "NO_FOLDER_OPEN"         // operation attempted without an open folder
  | "USER_CANCELLED"         // user dismissed the directory picker
```

## FSAdapter Interface

```typescript
interface FSAdapter {
  /** Open a folder picker, read and validate graph.json.
   *  Returns the validated snapshot or null if user cancelled.
   *  Throws FSError on permission/parse/version errors.
   */
  open(): Promise<GraphSnapshot | null>;

  /** Write the current snapshot to graph.json in the open folder.
   *  Throws FSError if no folder is open or write fails.
   */
  save(snapshot: GraphSnapshot): Promise<void>;

  /** Close the open folder and clear the handle. */
  close(): void;

  /** True if a folder is currently open (handle stored). */
  isOpen(): boolean;

  /** Name of the open folder, or null. */
  getFolderName(): string | null;

  /** Current status. */
  getStatus(): FSAdapterStatus;
}
```

## Store Actions

Added to `useGraphStore`:

| Action | Signature | Behaviour |
|--------|-----------|-----------|
| `openFromDisk` | `(snapshot: GraphSnapshot, folderName: string) => void` | Replaces entities/relations/canvas with snapshot data. Resets undo/redo. Sets folder name. Sets `_lastDiskSaveAt = Date.now()`. |
| `saveToDisk` | `() => Promise<void>` | Calls `FSAdapter.save()` with current snapshot. On success, sets `_lastDiskSaveAt = Date.now()`. On failure, throws FSError — caller catches and shows dialog. |
| `closeDisk` | `() => void` | Calls `FSAdapter.close()`. Clears folder name. Leaves entities/relations in place (IndexedDB still has them). |
| `isDirty` | `() => boolean` | `_lastMutationTime > _lastDiskSaveAt` |
| `_lastMutationTime` | timestamp | Already exists (`lastMutationTime`). |
| `_lastDiskSaveAt` | timestamp | New field. Set by `openFromDisk` and `saveToDisk`. |

The store holds a module-level `_fsAdapter` reference, set during `openFromDisk`, used by `saveToDisk`, cleared by `closeDisk`.

## Validation

`validateSnapshot(data: unknown): data is GraphSnapshot`

Checks:
- `data` is a non-null object
- `data.version` is a number ≤ the app's current version (5)
- `data.entities` is an array
- `data.relations` is an array
- Each entity has `id`, `type`, `content`, `metadata`, `canvasData`
- Each relation has `id`, `source`, `target`, `type`, `sortOrder`

Errors map to `FSErrorCode.VALIDATION_FAILED` with a specific detail string.

## Dialog / UI Surface

Dialogs are shown via the existing alert/confirm/prompt pattern. No new dialog framework. Specific dialogs per story:

| Story | Dialog |
|-------|--------|
| 1 (empty folder) | `confirm("This folder is empty. Create a new workspace in {name}?")` |
| 2 (valid folder) | `alert("Opening {name}...")` then `alert("Loaded — {N} entities, {M} relations.")` |
| 3 (invalid folder) | `alert("Cannot open — {reason} (code: {code})")` |
| 4 (permission failure) | `alert("Cannot access folder — {reason}")` |
| 6 (save) | `alert("Saving...")` then `alert("Saved successfully.")` |

## Operation Logging

Every adapter operation writes to a structured in-memory log accessible via `FSAdapter.getLog()`:

```typescript
type FSLogEntry = {
  operation: "open" | "save" | "close" | "validate";
  timestamp: number;
  success: boolean;
  error?: { code: FSErrorCode; detail: string };
  meta?: Record<string, unknown>;  // e.g. { entityCount: 42, fileName: "graph.json" }
};
```

The log is cleared on `close()`. Maximum 100 entries (ring buffer).

## Files Changed

### Phase 1 — Core Adapter (Open + Save + Close)

| File | Change |
|------|--------|
| `src/store/persistence/FSAdapter.ts` | **New.** Standalone adapter: `FSAdapter` class + `FSError` + `validateSnapshot`. Uses raw File System Access API (`showDirectoryPicker`, `getFileHandle`, `createWritable`). MDN-linked comments on every public method. |
| `src/store/persistence/index.ts` | Re-export new `FSAdapter`, `FSError`, `FSErrorCode`. Keep existing re-exports untouched (old adapter stays). |
| `src/store/persistence/resolver.ts` | Simplify to always return `IndexedDBAdapter`. Keep `?adapter=` URL override for testing but remove "auto" mode. |
| `src/store/useGraphStore.ts` | Add `_lastDiskSaveAt` field, `openFromDisk`, `saveToDisk`, `closeDisk`, `isDirty` actions. Wire `_lastMutationTime` already exists. |
| `src/canvas/GraphCanvas.tsx` | Replace old `onOpenFolder` (which used `FSAccessAdapter`) with new `FSAdapter` calls. Add Save button (disabled when no folder open). |
| `src/canvas/panels/AppSidebar.tsx` | Update Open Folder / Save buttons to use new store actions. |
| `src/store/persistence/FSAdapter.test.ts` | **New.** Unit tests for: every FSErrorCode path, validation of valid/invalid/malformed data, version-too-new, parse failure, permission denied simulation, operation log, isOpen/open/close lifecycle. |

### Phase 2 — Dirty Tracking + Leave Warning

| File | Change |
|------|--------|
| `src/store/useGraphStore.ts` | `_lastDiskSaveAt` already added in Phase 1. No changes needed. |
| `src/App.tsx` or `WorkspaceRoot.tsx` | Add `beforeunload` listener that calls `event.preventDefault()` when `isDirty()` is true. |

### Phase 3 — Cold Start Behavior

| File | Change |
|------|--------|
| `src/routes/WorkspaceRoot.tsx` | Remove FS reconnect attempt from mount path. Always goes through IndexedDB. |
| `src/store/persistence/resolver.ts` | Already simplified in Phase 1. Verify cleanup is complete. |
| `src/canvas/panels/AppSidebar.tsx` | Show "No folder open — working from local storage only" status when folder is null. |

## Acceptance Criteria by Phase

### Phase 1

- **AC1:** User picks an empty folder → sees "Create workspace?" confirm → Yes writes seed `graph.json` + loads it.
- **AC2:** User picks a folder with valid `graph.json` → sees "Opening…" → "Loaded — N entities, M relations."
- **AC3:** User picks a folder with invalid/malformed `graph.json` → sees "Cannot open — {reason} (code: {code})". Store state unchanged.
- **AC4:** User picks a folder with `graph.json` version > 5 → sees "Cannot open — file version X is newer than supported version Y."
- **AC5:** User cancels the directory picker → nothing happens, no dialog, store state unchanged.
- **AC6:** User picks a folder, permission is denied/expired → sees "Cannot access folder — {reason}."
- **AC7:** User clicks Save with an open folder → "Saving…" → "Saved successfully." File written to disk.
- **AC8:** User clicks Save with no open folder → nothing happens (Save is disabled).
- **AC9:** Resolver always returns IndexedDBAdapter on app start. No FS reconnect attempt.
- **AC10:** Every `FSErrorCode` path has a unit test.
- **AC11:** Validation accepts version 5, rejects versions > 5.
- **AC12:** Validation rejects null, undefined, non-objects, missing `entities`, missing `relations`, missing `version`.
- **AC13:** Operation log records every open/save/close/validate attempt with timestamp and success/failure.

### Phase 2

- **AC14:** After opening a file from disk, `isDirty()` returns false.
- **AC15:** After any store mutation, `isDirty()` returns true.
- **AC16:** After saving to disk, `isDirty()` returns false.
- **AC17:** Window `beforeunload` fires when `isDirty()` is true (with unsaved changes message).
- **AC18:** Window `beforeunload` does not fire when `isDirty()` is false.

### Phase 3

- **AC19:** App starts with IndexedDB data. No folder handle is restored. UI shows "No folder open — working from local storage only."
- **AC20:** The old `tryReconnect` path is confirmed dead (no caller).
- **AC21:** The old `FSAccessAdapter` is preserved as-is but not imported by any production code path.

## Out of Scope

- Auto-reconnect on page load (future PRD)
- Save As (prompt on every save)
- `documents/` subdirectory pattern (loadDocument/saveDocument/deleteDocument)
- Refactoring the auto-save subscriber
- UI polish for the dirty indicator (Phase 2 only wires the data + beforeunload)
- Visual undo/close button effects (just functional close)

## Verification

- `npx tsc --noEmit` — type check
- `npx vitest run src/store/persistence/FSAdapter.test.ts` — adapter unit tests
- `npm run build` — production build
- Manual UAT per phase's stories before advancing to next phase
