# PRD0011 — Handle Persistence & URL-Based Navigation

> **Completion note:** Implemented 2026-05-14. Feature-flagged (`FEATURES.PERSIST_HANDLE`, default `false`) IndexedDB handle persistence via `src/persistence.ts`, plus always-on URL view state sync. See `archive/2026-05-14-handle-persistence-and-url-navigation.md` for ADR and `dev-docs/changelog.md` for full entry.

## Status
Completed

## Problem

Two distinct but related UX problems when editing `graph.json` externally:

### Problem A — Lost folder handle on reload

The app uses the File System Access API. On every page load, the user sees a "Open a project folder" button and must re-pick their folder, even if they're working in the same folder for days. This friction breaks flow when:

- Editing `graph.json` externally in a text editor, then refreshing to see changes
- Browser crashes or accidentally closes the tab
- Opening the app from a bookmark or recent tabs
- Sharing the app URL with a collaborator who needs to open the same folder

The current design (PRD0009) intentionally deferred handle persistence: *"Handle persistence (IndexedDB): So the user doesn't re-pick their folder every session. Deferred because it reintroduces opaque storage. V1 reinforces the mental model by requiring the explicit pick."*

The user now wants this as an optional convenience — a feature flag they can turn on/off.

### Problem B — Lost view state on reload

When the app reloads (for any reason — external graph.json edit triggering Vite HMR, browser refresh, etc.), the Zustand view state resets. The user is dumped back at the canvas view with no memory of:

- Whether they were in the reading viewport or canvas
- Which node/entity they were looking at
- Which panel was expanded
- Their scroll position

The user needs a way to **stay in the file they were in**, even after a reload. The ideal: a URL they can bookmark or re-open that restores the exact view state (folder context, focused entity, anchor entity).

Note on reload cause: Vite's dev server watches the project root for file changes. While `graph.json` may or may not live inside the project root, file watchers can be broad enough to detect changes, and `@vitejs/plugin-react` may trigger full page reloads under certain file-watching conditions. The root cause is less relevant than the fix: the app should survive any reload gracefully.

## Goals

1. **Handle persistence (feature-flagged)**: On app load, silently reconnect to the last-used folder handle via IndexedDB. Skip the folder picker when possible. Toggleable via a compile-time feature flag.
2. **URL-based view state**: Encode the current view (focusedEntityId, anchorEntityId) in the URL. On load, after the folder is restored, read the URL to restore the view state. This makes bookmarks and reloads survivable.

## Scope

### In scope

- Store the `FileSystemDirectoryHandle` in IndexedDB (the browser API supports structured cloning of these handles)
- On app startup: attempt to restore the handle from IndexedDB, verify permissions (`handle.requestPermission({ mode: "readwrite" })`), and if valid, skip the folder picker
- Feature flag: `PERSIST_HANDLE` — when `false` (default for now), always show the folder picker; when `true`, restore from IndexedDB
- Sync `view.focusedEntityId` and `view.anchorEntityId` to URL search params (`?focused=entity_id&anchor=entity_id`)
- On app load, after folder is resolved, read URL params to restore view state
- Handle the boot sequence: folder resolution (from handle or picker) → URL param restoration → render
- Update URL via `history.replaceState` (no extra browser history entries on every focus change)

### Out of scope

- Scroll position restoration (requires scroll tracking; deferred to a future PRD)
- Expanded panels restoration (transient UI state; re-expanding is cheap for the user)
- `visibleEntityIds` in URL (derived state, not primary)
- Full React Router dependency (URL search params + native History API is sufficient)
- Multi-folder / recent-folders list (single persisted handle only)
- Handle synchronization (if the user changes the folder externally — permissions revoked — fall back to picker)
- Git integration, cloud sync, conflict resolution

## Design

### 1. Handle Persistence via IndexedDB

#### Storage

Use IndexedDB with a single object store. The `FileSystemDirectoryHandle` is `StructuredClone`-compatible and can be stored directly:

```
DB name: "react-roadmap-persistence"
Object store: "directoryHandles"
Key: "lastFolder"
Value: FileSystemDirectoryHandle (cloned)
```

#### Boot sequence

```
App mounts
  ├─ PERSIST_HANDLE feature flag off? → Show folder picker (current behavior)
  └─ PERSIST_HANDLE feature flag on?
       ├─ IndexedDB has a stored handle?
       │    ├─ Yes → requestPermission("readwrite")
       │    │    ├─ Granted → read graph.json from handle → populate store → skip picker
       │    │    └─ Denied  → fall back to folder picker
       │    └─ No → show folder picker (as today)
       └─ No handle in IndexedDB → show folder picker
```

When the user successfully picks a folder (via the normal `openFolder` flow), also persist the handle to IndexedDB.

#### Permission notes

`requestPermission` returns `"granted"`, `"denied"`, or `"prompt"`. The call does NOT show a UI prompt when called from a user gesture context. On fresh page load, it may show a prompt — this is acceptable and still better than re-picking the entire folder.

Response to permission states:
- `"granted"` → proceed, read the file
- `"prompt"` → call `requestPermission` which shows a brief browser prompt → if granted, proceed; if denied, fall back to picker
- `"denied"` → fall back to picker (user must re-pick, then re-persist)

#### Feature flag

```ts
// src/features.ts — single source of truth for feature flags
const FEATURES = {
  PERSIST_HANDLE: import.meta.env.VITE_PERSIST_HANDLE === "true",
} as const;
```

Or a simpler constant-based approach for compile-time toggle:

```ts
// src/config.ts
export const PERSIST_HANDLE = false; // toggle manually, or wire to env var
```

Using `import.meta.env.VITE_*` allows users who run `npm run dev` to set env vars externally without editing code.

### 2. URL-Based View State

#### URL format

```
http://localhost:5173/?focused=hamlet--william-shakespeare&anchor=seg_18
```

Params:
- `focused` — `view.focusedEntityId` (the root container in the reading viewport)
- `anchor` — `view.anchorEntityId` (the entity that was clicked, for breadcrumb origin)

Both are optional. When absent, app defaults to canvas view (current behavior).

#### Sync strategy

Use a Zustand subscription (like the auto-save) to sync view state to URL:

```
Store's view state changes
  → push/replace URL search params (replaceState, debounced at ~100ms)
  → but ONLY when a folder is open (don't set URL params before the user picks a folder)
```

On app load:

```
Store is populated (from handle or picker)
  → Check URL search params
  → If "focused" param exists and entity exists in store
       → call store.focusEntity(focused, anchor)
  → If no params or entity doesn't exist
       → show canvas (default)
```

#### Debouncing

View state changes (node clicks, breadcrumb clicks) are frequent but cheap. Debounce URL updates at 200ms to avoid spamming the history API during rapid clicks.

### 3. Combined Boot Sequence

```
1. App mounts
2. If PERSIST_HANDLE is on, try IndexedDB restore
3. If no handle (or flag off) → show FolderPicker gate
4. Folder is resolved → openFolder() reads graph.json → store populated
5. After store populated → check URL search params
6. If params valid → restore view state
7. If no params → default canvas view
8. Every subsequent view state change → update URL (debounced, replaceState)
```

#### Shared-state sequencing

The URL param restoration cannot happen until after the store is populated. The current `App.tsx` conditionally renders based on `directoryHandle`. Sequence:

```tsx
function App() {
  const directoryHandle = useGraphStore((s) => s.directoryHandle);
  const focusedEntityId = useGraphStore((s) => s.view.focusedEntityId);

  // After mount: try handle restore, then URL restore
  useEffect(() => {
    if (directoryHandle && !hasRestoredFromUrl.current) {
      hasRestoredFromUrl.current = true;
      restoreViewFromUrl();
    }
  }, [directoryHandle]);

  if (!directoryHandle) return <FolderPicker ... />;
  // ... rest
}
```

### 4. What Happens When a Stale Entity ID Is in the URL

If the user bookmarks a URL with an entity that no longer exists in `graph.json`:

- `store.focusEntity("nonexistent_id")` is called
- The reading viewport resolves the container and finds nothing
- The viewport shows an empty state: "Entity not found. [Return to canvas]"
- The URL is NOT cleared — the user can see the stale ID and remove it manually
- A better approach: before calling `focusEntity`, check `getEntity(store.getState(), id)` — if it doesn't exist, ignore the param and show canvas

### 5. Why Not Use React Router

The app has exactly two "routes" (canvas and reading viewport), and they're already handled by conditional rendering on `focusedEntityId`. Adding a routing library for two states that differ by a single nullable string is over-engineering. URL search params + `history.replaceState` handle this with zero dependencies.

## Feature Flag Configuration

| Flag | Env var | Default | Purpose |
|------|---------|---------|---------|
| `PERSIST_HANDLE` | `VITE_PERSIST_HANDLE` | `false` | Persist folder handle to IndexedDB |

Set via:
```sh
VITE_PERSIST_HANDLE=true npm run dev   # enable persistence for this session
```

Or persistently in `.env`:
```
VITE_PERSIST_HANDLE=true
```

The URL sync (Problem B) is NOT feature-flagged — it's always on. It has no downside and the URL is a passive side-channel. The user can always clear the URL manually or bookmark a clean URL. Handle persistence (Problem A) is flagged because it changes the startup UX flow and the user explicitly asked for a toggle.

## File Changes

| File | Action |
|------|--------|
| `src/config.ts` | **Create** — feature flags (`PERSIST_HANDLE` from env var) |
| `src/store/useGraphStore.ts` | Add `restoreFolder()` action (reads IndexedDB handle, verifies permission, loads graph.json); add `persistHandle()` (writes handle to IndexedDB, called after successful `openFolder`); add IndexedDB read/write helpers |
| `src/App.tsx` | Add `useEffect` for IndexedDB handle restore on mount; add `useEffect` for URL param restoration after store populated; add `useEffect` for URL sync (view state → URL) |
| `src/index.css` | No changes needed |
| `src/types/graph.ts` | No changes needed |
| `dev-docs/requirements.md` | Update persistence requirements |
| `dev-docs/architecture.md` | Update store actions, add feature flag section |
| `dev-docs/roadmap.md` | Add handle persistence & URL nav to Now / Recently Completed |

No new npm dependencies.

## Implementation Steps

### Step 1 — Create feature flag config

- Create `src/config.ts` with `FEATURES.PERSIST_HANDLE` reading from `import.meta.env.VITE_PERSIST_HANDLE`
- Boolean coercion: `import.meta.env.VITE_PERSIST_HANDLE === "true"` → `true`

### Step 2 — Add IndexedDB helpers

- `dbPromise()` — opens `react-roadmap-persistence` DB with `directoryHandles` object store
- `saveHandle(handle)` — stores handle under key `"lastFolder"`
- `loadHandle()` — retrieves handle from IndexedDB; returns `null` if missing
- `clearHandle()` — removes stored handle (for clean state)

Handles are stored via IndexedDB's structured clone support — no manual serialization needed.

### Step 3 — Add `restoreFolder()` store action

- `restoreFolder()`: checks `FEATURES.PERSIST_HANDLE` → if false, returns null → if true, loads handle from IndexedDB → calls `handle.requestPermission()` → if granted, reads graph.json → populates store → returns success/failure

### Step 4 — Wire startup in App.tsx

- On mount: if `PERSIST_HANDLE` is true, call `restoreFolder()` — if it succeeds, the store is already populated and `directoryHandle` is set, so `FolderPicker` is skipped
- After folder is confirmed (either via restore or picker), call `restoreViewFromUrl()`
- `restoreViewFromUrl()`: reads `new URLSearchParams(window.location.search)`, gets `focused` and `anchor`, validates entities exist in store, calls `focusEntity` if valid

### Step 5 — Wire URL sync

- A `useEffect` in `App.tsx` subscribes to `view` state changes
- On change: debounce 200ms, then `history.replaceState(null, "", updateSearchParams(window.location.search, { focused, anchor }))`
- Use `replaceState` not `pushState` — view changes shouldn't create browser history entries; the URL is just a bookmarkable snapshot of current state

### Step 6 — Persist handle on folder open

- In `openFolder()`, after a successful folder pick + graph.json load, call `saveHandle(handle)` if `FEATURES.PERSIST_HANDLE` is true
- This means: first time the user opens a folder with the flag enabled, it gets persisted. Subsequent page loads skip the picker.

### Step 7 — Unsupported browser path

- When `PERSIST_HANDLE` is on but the browser doesn't support `showDirectoryPicker` (Safari/Firefox), the `restoreFolder()` will fail (no handle to restore, or handle exists but permission denied). The folder picker gate already handles this — it shows the unsupported message. No change needed here.

### Step 8 — Verify

- `VITE_PERSIST_HANDLE=true npm run dev`
- Open app → pick a folder → data loads
- Refresh → folder reconnects silently (no picker)
- Click a node → reading viewport opens → URL shows `?focused=...&anchor=...`
- Copy URL, open new tab → app restores folder, restores view state
- Edit `graph.json` externally, refresh → app restores folder, restores view state (with updated data)
- `VITE_PERSIST_HANDLE=false npm run dev` → folder picker on every refresh (old behavior)
- `npx tsc --noEmit` passes
- `npm run build` succeeds

## Acceptance Criteria

1. `PERSIST_HANDLE=true`: app startup skips folder picker when a folder was previously picked (handle restored from IndexedDB)
2. `PERSIST_HANDLE=false`: app shows folder picker on every startup (current behavior unchanged)
3. Reading viewport state is reflected in URL search params (`?focused=...&anchor=...`)
4. Opening a URL with valid params restores the reading viewport to the correct entity (after folder is loaded)
5. Opening a URL with stale/invalid params defaults to canvas (no crash, no error state)
6. URL only contains params when a folder is open — no stray `?focused=` before picker
7. `history.replaceState` is used — no extra history entries pollute the back button
8. URL updates are debounced (no rapid URL writes on every pixel of scroll or click)
9. No new npm dependencies
10. `npx tsc --noEmit` passes
11. `npm run build` succeeds

## Future Considerations

- **Scroll position restoration**: Store the scroll offset or the first visible entity ID in the URL. Requires `IntersectionObserver` in the reading viewport to track which entity is at the top of the viewport.
- **Recent folders list**: Store multiple handles in IndexedDB (most recent 5), show a quick-switcher UI.
- **Expanded panels**: Could be encoded as `?expanded=note_1,note_2` — low priority since re-expanding is one click.
- **Full React Router**: If the app grows more routes (settings, multi-column layouts, etc.), switch to React Router with the URL params as query params. Not needed now.
- **`watchFile` via File System Watcher API**: Future: use the File System Watcher API to detect external changes to `graph.json` without requiring a page reload. This PRD addresses the *consequence* (lost state on reload), not the cause (reload itself). Directory watching is out of scope here.

## Verification

```sh
VITE_PERSIST_HANDLE=true npm run dev
# Manual: pick folder → refresh → no picker → click node → URL updates → copy URL → new tab → restores
VITE_PERSIST_HANDLE=false npm run dev
# Manual: picker on every refresh
npx tsc --noEmit
npm run build
```
