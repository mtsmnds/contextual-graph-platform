# PRD0009 — File System Persistence

## Status
Proposed

## Problem

The app currently stores all user data in localStorage under a single key. This has three fundamental problems:

1. **Opaque to the user.** Data is trapped in the browser's developer tools UI. The user cannot open their graph in an editor, diff it, version it, or share it without the export/import dance.

2. **Opaque to agents.** An OpenCode agent or any automated tool cannot read or write the user's graph state without running the app and extracting from localStorage.

3. **No permanence.** localStorage is per-origin, per-browser. Clearing browser data, switching browsers, or moving machines loses everything. The export/import workflow is manual and fragile.

These are not edge cases. They are direct contradictions of the product's purpose: a contextual graph platform where users (and agents) manipulate their own data. If the data is not a file the user can see, touch, and version, it is not truly theirs.

## Goal

The user's graph data lives as a plain JSON file in a folder they choose. The app reads and writes to that file directly using the File System Access API. The file is the source of truth — the app is a viewer/editor for it. No sync, no export/import, no hidden storage.

## Scope

**In scope:**
- On first run, the user picks a file (or folder) to store their graph data
- The app reads the JSON file into the store on load
- The app auto-saves (debounced) back to the same file on every change
- The file format is the existing `GraphSnapshot` schema (versioned, flat entities + relations arrays)
- Migration path: localStorage snapshot is automatically exported to the chosen file on first FS save
- The file is human-readable JSON — the user can open it in any editor, diff it with git, share it

**Out of scope:**
- Directory watching / multi-file support (single JSON file is sufficient for now)
- Database format (SQLite, etc.) — deferred until schema complexity demands it
- Cloud sync — deferred; the file can be placed in Dropbox/iCloud/Google Drive for free sync
- Conflict resolution — deferred; single-writer model for now
- Binary formats — JSON only
- Migration of existing localStorage data after the first FS save — the FS file is authoritative once picked
- Multi-project folder structure — one file per project is sufficient for now

## Design

### 1. First-run flow

When the app starts with no established file handle:

1. Show the reading viewport with bundled seed data (hamlet.json or seed data, same as today)
2. In the header, show a persistent indicator: "No file selected. Save graph to a file."
3. Clicking the indicator opens the browser's "Save File" dialog (`showSaveFilePicker`)
4. The user picks or creates a `.graph.json` file in their chosen folder
5. The app writes the current state to that file and stores the `FileSystemFileHandle` in an in-memory variable (not persisted — re-pick on next session)

On subsequent loads:
1. Show the same "No file selected" indicator
2. User can also pick an existing file via `showOpenFilePicker`

**Why not persist the handle?** `FileSystemFileHandle` can be stored in IndexedDB for auto-reconnection, but this introduces opaque storage again. For v1, the user explicitly picks their file each session. This reinforces the mental model: the file is the source, the app is a window into it. Auto-reconnection via IndexedDB is a future nicety.

### 2. Read/write cycle

```
User picks file → app reads JSON → populates store
Store changes (debounced 300ms) → serialize → write to file
```

The write is a fire-and-forget promise. On write failure (permission revoked, file deleted):
- Show a non-blocking toast: "Could not save to file. Pick a new location."
- State remains in memory — nothing is lost until the user navigates away

### 3. File format

The existing `GraphSnapshot` type:

```ts
type GraphSnapshot = {
  version: 1
  entities: Entity[]
  relations: Relation[]
}
```

No changes to the schema. The file extension is `.graph.json` for clarity and editor syntax highlighting.

### 4. Seed data coexistence

Bundled seed data (hamlet.json) is NOT written to the user's file. On first pick, the current in-memory state (which may include seed data) is written to the file — this bootstraps the user's file with demo content. After that, the app reads exclusively from the user's file.

The user can choose to start with an empty graph instead of seed data by creating a new file with `{ "version": 1, "entities": [], "relations": [] }`.

### 5. Removing localStorage

With FS persistence in place:
- `localStorage` auto-save is removed
- `loadInitialState()` no longer checks localStorage — it loads from the user's FS file or falls back to bundled seed data
- `exportGraph` and `importGraph` remain as utilities (save a copy, load a backup) but are no longer the primary persistence mechanism

### 6. Migration

On first FS save, if the store was populated from localStorage or seed data, that state is written to the file. This is a one-way migration — subsequent loads read from the file only.

### 7. UI changes

- A "File" indicator in the header bar showing the current filename (e.g., `my-graph.graph.json`)
- A file picker button (folder icon) that opens `showOpenFilePicker` or `showSaveFilePicker`
- If the file is unwritable, show a subtle warning (yellow dot next to filename)
- The current "Export" and "Import" buttons remain as secondary actions (save copy / load backup)

### 8. Browser support

File System Access API is supported in Chromium-based browsers (Chrome, Edge, Opera). Safari and Firefox do not support it yet. For unsupported browsers:
- Degrade gracefully: show a message "File system access is not supported in your browser. Use Chrome/Edge for full persistence."
- Fall back to localStorage + manual export/import (current behavior)

## File Changes

| File | Action |
|------|--------|
| `src/store/useGraphStore.ts` | Replace localStorage persistence with FS API read/write; remove `loadInitialState()` localStorage check; add file handle state; add `pickFile()`, `saveToFile()`, `loadFromFile()` actions |
| `src/renderers/ReadingViewport.tsx` or `src/App.tsx` | Add file indicator UI (filename, picker button, save status) |
| `src/types/graph.ts` | No changes needed (GraphSnapshot already exists) |
| `dev-docs/requirements.md` | Update persistence requirements |
| `dev-docs/roadmap.md` | Move FS API from Later to Now; update persistence milestone |

## Implementation Steps

### Step 1 — Add FS API actions to the store

- Add `fileHandle: FileSystemFileHandle | null` to the store state
- Add `pickFile()`: opens `showOpenFilePicker` or `showSaveFilePicker`, stores the handle, reads the file, replaces store state
- Add `saveToFile()`: serializes current entities + relations, writes to the stored handle
- Modify the auto-save subscription: write to FS file instead of localStorage
- Keep `loadInitialState()` as the fallback for when no file is picked

### Step 2 — Add file UI to the header

- Show filename when a file is active
- Show "No file" state with a picker button
- Show save status (saved, saving, error)

### Step 3 — Migration path

- On first FS pick, write current in-memory state to the file
- No automatic localStorage → FS migration; user-initiated via the picker

### Step 4 — Verify

- Open app → see seed data → pick a file → data is written
- Modify data (click annotation) → file auto-saves
- Refresh → pick the same file → data is restored
- Open the file in an editor → it's valid JSON with entities and relations
- Modify the file externally → refresh and re-pick → changes appear
- `npx tsc --noEmit` passes
- `npm run build` succeeds

## Acceptance Criteria

1. User can pick a `.graph.json` file on their filesystem on first run
2. App reads the file and populates the store
3. Every change to entities or relations auto-saves to the file (debounced)
4. Refreshing the page and re-picking the same file restores state
5. The file is valid JSON matching the `GraphSnapshot` schema — editable in any text editor
6. Export/Import buttons remain as secondary utilities
7. Unsupported browsers fall back to localStorage + manual export/import with a clear message
8. `npx tsc --noEmit` passes
9. `npm run build` succeeds

## Future Considerations

- **Persisted file handles** (IndexedDB): So the user doesn't have to re-pick every session. Deferred because it reintroduces opaque storage for the handle — the explicit pick reinforces the mental model.
- **Auto-reconnect** on page load: If the handle was persisted, try reconnecting silently. If it fails (file moved/deleted), fall back to the picker.
- **Multiple files** per project: A directory with separate files for works, annotations, etc. Deferred until single-file proves insufficient.
- **Git-friendly format**: The file is already plain JSON and git-diffable. Future: pretty-print with sorted keys for stable diffs.
- **SQLite**: If the graph grows beyond ~100K entities, the single JSON file will become slow to parse. SQLite via `sql.js` or OPFS is the natural upgrade path.

## Verification

```sh
npx tsc --noEmit
npm run build
npm run dev   # manual: pick file → annotate → refresh → re-pick → verify
```
