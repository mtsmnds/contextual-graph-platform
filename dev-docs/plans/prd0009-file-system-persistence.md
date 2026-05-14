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

The user's graph data lives as a `graph.json` file inside a folder they choose. The app reads and writes to that file directly using the File System Access API. The folder is the source of truth — the app is a viewer/editor for it. No seed data, no localStorage, no hidden state. The app requires a folder to function.

## Scope

**In scope:**
- On first run, the user picks a folder via `showDirectoryPicker`
- The app reads `graph.json` from that folder if it exists, or creates it
- The app auto-saves (debounced) to `graph.json` on every change
- The file format is the existing `GraphSnapshot` schema (versioned, flat entities + relations arrays)
- The file is human-readable JSON — the user can open it in any editor, diff it with git, share it
- The UI shows the folder name, not the filename — the user thinks in terms of projects
- Empty folder → app creates `graph.json` with an empty graph

**Out of scope:**
- Seed data / demo content — the app starts empty, the user populates it
- localStorage fallback removed everywhere
- Handle persistence / auto-reconnect — user picks folder each session (can be revisited)
- Directory watching / multi-file support (single `graph.json` is sufficient for now)
- Database format (SQLite, etc.) — deferred until schema complexity demands it
- Cloud sync — deferred; the folder can be placed in Dropbox/iCloud/Google Drive for free sync
- Conflict resolution — deferred; single-writer model for now
- Binary formats — JSON only
- Multi-project folder structure — one `graph.json` per folder is sufficient for now

## Design

### 1. First-run flow

The app does NOT start with seed data. On launch:

1. Show a folder picker prompt: "Open a project folder to begin."
2. User clicks the button → `showDirectoryPicker()` opens
3. User picks any folder (existing or newly created)
4. App checks for `graph.json` inside:
   - **Exists** → reads it, populates the store
   - **Does not exist** → creates `graph.json` with `{ "version": 1, "entities": [], "relations": [] }`
5. Store is populated (empty or from file), reading viewport opens

If the user refreshes the page, they pick the folder again (no handle persistence for v1).

### 2. Read/write cycle

```
User picks folder → app reads graph.json → populates store
Store changes (debounced 300ms) → serialize → write to graph.json
```

The write uses `FileSystemFileHandle.createWriter()` (writable stream). On write failure (permission revoked, folder deleted):
- Show a non-blocking toast: "Could not save. Pick the folder again."
- State remains in memory — nothing is lost until the user navigates away

### 3. File format

The existing `GraphSnapshot` type, serialized as `<folder>/graph.json`:

```ts
type GraphSnapshot = {
  version: 1
  entities: Entity[]
  relations: Relation[]
}
```

No changes to the schema. The filename is always `graph.json` — the user never needs to deal with it. They name their folder semantically (e.g., `hamlet-annotations/`, `roadmap-q2/`) and the app manages the file inside.

### 4. No seed data

Bundled seed data (`hamlet.json`, `seedEntities`/`seedRelations`) is NOT loaded at startup. The app has one mode: you pick a folder, you work with what's in it. This eliminates:
- The content-matching bug (PRD0007)
- The merge/detection logic (PRD0008)
- The distinction between "demo mode" and "real mode"
- The question of whether localStorage or FS is authoritative

The user starts with an empty graph and populates it through the app or by editing `graph.json` directly.

**Trade-off:** First run shows a folder picker instead of content. Acceptance hinges on the folder picker being frictionless — one click to pick/create a folder, then the app is ready.

### 5. Removing localStorage

With FS persistence in place:
- `localStorage` auto-save is removed entirely
- `loadInitialState()` is replaced — it reads from the FS file or shows the folder picker
- `exportGraph` and `importGraph` are removed (the file IS the export)
- The `PERSIST_KEY`, `DEBOUNCE_MS`, `saveTimer`, and `persistToDisk()` are removed from the store

### 6. UI changes

- **Folder name in header**: Shows the picked folder's name (e.g., "hamlet-project"), not the filename
- **Folder indicator**: A small folder icon next to the name. Clicking it opens the picker again (to switch projects)
- **Save status**: Subtle indicator — green dot (saved), yellow dot (unsaved changes), red dot (write error)
- **Empty state**: If `graph.json` is empty, show "Your graph is empty. Add entities from the canvas." instead of the reading viewport
- **No file extension**: The user never sees `graph.json` — the app manages it internally

### 7. Browser support

File System Access API (`showDirectoryPicker`) is supported in Chromium-based browsers (Chrome 86+, Edge 86+, Opera 72+). Safari and Firefox do not support it.

For unsupported browsers:
- On launch, detect support via `typeof window.showDirectoryPicker === 'function'`
- If unsupported: show a message "Your browser does not support the File System Access API. Please use Chrome or Edge to open a project folder."
- No fallback to localStorage — the feature requires FS API

### 8. Migration from localStorage

For existing users who have data in localStorage:
- The folder picker is the entry point — no automatic migration
- A one-time helper: when the user opens a folder for the first time with existing localStorage data, offer "Import existing data from this browser?" which reads the localStorage snapshot and writes it to `graph.json`
- This is a convenience, not a requirement — the user can also copy-paste from DevTools

## File Changes

| File | Action |
|------|--------|
| `src/store/useGraphStore.ts` | Replace entire persistence layer: remove localStorage auto-save, add file handle state, add `openFolder()`, `readFromFile()`, `writeToFile()`; remove seed data; remove `loadInitialState()`; add `useFileSystem` hook or integrate into store |
| `src/App.tsx` | Add folder picker gate — if no folder is open, show the picker UI instead of the canvas/viewport |
| `src/renderers/ReadingViewport.tsx` | Show folder name in header; add folder picker button; add save status indicator |
| `src/data/hamlet.json` | Remove from bundle (no longer loaded automatically) |
| `src/types/graph.ts` | No changes needed |
| `dev-docs/requirements.md` | Update persistence requirements |
| `dev-docs/roadmap.md` | Move FS API from Later to Now; update persistence milestone |

## Implementation Steps

### Step 1 — Add FS API primitives to the store

- Remove localStorage persistence (`PERSIST_KEY`, `persistToDisk`, auto-save subscription)
- Add `directoryHandle: FileSystemDirectoryHandle | null` to store state
- Add `folderName: string | null` for UI display
- Add `openFolder()`: calls `showDirectoryPicker()`, checks for `graph.json`, reads or creates it
- Add `writeToFile()`: acquires writer on the directory handle's `graph.json`, writes serialized state
- Wire the auto-save subscription to call `writeToFile()` instead of `persistToDisk`

### Step 2 — Add folder picker gate in App.tsx

- If no folder is open, render a "Open a project folder" screen (full-screen, centered, one button)
- Once folder is picked and data is loaded, render the normal canvas/viewport UI

### Step 3 — Add folder UI to the header

- Show folder name (extracted from the directory handle's name property)
- Folder icon button to switch projects
- Save status indicator (saved / saving / error)

### Step 4 — Remove seed data

- Remove `hamlet.json` import from the store
- Remove `seedEntities` and `seedRelations`
- `loadInitialState()` is no longer needed — state comes from the FS file or is empty

### Step 5 — Migration helper

- When opening a folder with existing localStorage data, show a one-time banner: "Import data from this browser session?"
- On confirm, read localStorage snapshot and write it to `graph.json`
- Delete the localStorage key afterward

### Step 6 — Verify

- Open app → see folder picker → pick an empty folder → empty graph opens
- Add a few entities (manually or via future UI) → `graph.json` appears in the folder
- Open `graph.json` in an editor → valid JSON
- Modify `graph.json` externally, refresh, re-pick the folder → changes appear
- Open app in Safari/Firefox → see unsupported browser message
- `npx tsc --noEmit` passes
- `npm run build` succeeds

## Acceptance Criteria

1. App does not start without a user-picked folder — the folder picker is the gate
2. Picking an empty folder creates `graph.json` with an empty graph
3. Picking a folder with an existing `graph.json` loads its data
4. Every change to entities or relations auto-saves to `graph.json` (debounced)
5. The file is valid JSON matching the `GraphSnapshot` schema — editable in any text editor
6. UI shows the folder name, not the filename
7. No seed data is bundled or loaded — the app is a pure viewer/editor for the user's file
8. Unsupported browsers show a clear message with no fallback
9. `npx tsc --noEmit` passes
10. `npm run build` succeeds

## Future Considerations

- **Handle persistence** (IndexedDB): So the user doesn't re-pick their folder every session. Deferred because it reintroduces opaque storage. V1 reinforces the mental model by requiring the explicit pick.
- **Auto-reconnect** on page load: If the handle was persisted, try reconnecting silently. If it fails (file moved/deleted), fall back to the picker.
- **Directory watching**: Future: watch the folder for external changes to `graph.json` and auto-reload. Deferred — for now, the user refreshes to pick up external edits.
- **Multiple files** inside the folder: Separate entities from relations, or support multiple graph files in one folder. Deferred until single-file proves insufficient.
- **SQLite**: If the graph grows beyond ~100K entities, JSON parse/write will become slow. SQLite via `sql.js` or OPFS is the natural upgrade path.
- **Git integration**: The folder can be a git repo. Future: surface git status, show diffs between commits. The plain JSON format already enables this.

## Verification

```sh
npx tsc --noEmit
npm run build
npm run dev   # manual: pick folder → empty graph → add data → check file → refresh → re-pick → verify
```
