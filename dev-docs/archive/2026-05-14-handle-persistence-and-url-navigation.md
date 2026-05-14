# 2026-05-14: Handle Persistence and URL-Based Navigation

## Context

The app relied on the File System Access API with no handle persistence — every page load required the user to manually re-pick their project folder. Editing `graph.json` externally triggered page reloads (Vite HMR detecting file changes in the project root), which lost all view state: the user was dumped at the canvas with no memory of which entity they were viewing.

Two distinct problems needed solving:
1. **Folder handle persistence** — the user shouldn't re-pick their folder every session
2. **View state survival** — on reload, the app should restore the user's exact view (focused entity, anchor entity)

## Decision

### 1. Handle persistence behind a feature flag
- Store the `FileSystemDirectoryHandle` in IndexedDB (it supports structured cloning natively)
- Flag: `FEATURES.PERSIST_HANDLE`, controlled by `VITE_PERSIST_HANDLE` env var (default `false`)
- On startup: if flag is on, load handle from IndexedDB, verify readwrite permission, and if valid, skip the folder picker
- On folder pick: persist the handle to IndexedDB automatically
- **Why feature-flagged**: The user explicitly asked for a toggle. Default `false` preserves the existing behavior for users who prefer the explicit pick. The flag is a compile-time/env toggle, not a runtime UI toggle — keeping the code path simple.

### 2. URL-based view state (always on)
- Encode `focusedEntityId` and `anchorEntityId` in URL search params: `?focused=id&anchor=id`
- Sync: Zustand subscription → debounced 200ms → `history.replaceState()`
- Restore: after folder is resolved on startup, read URL params → validate entity exists → `focusEntity()`
- **Why always on**: URL sync is purely additive and has no downside (stale IDs gracefully fall back to canvas). It's a passive side-channel that costs nothing.
- **No React Router**: Two conditional renders (canvas vs reading viewport) don't justify a routing dependency. URL search params + native History API are sufficient.

## Alternatives Considered

### Handle persistence
- **IndexedDB (chosen)**: Native structured clone support for `FileSystemDirectoryHandle`. Simple, no serialization needed.
- **localStorage**: Cannot store `FileSystemDirectoryHandle` — requires manual serialization that breaks the handle's live reference.
- **Session-only**: Require re-pick every tab session (original PRD0009 design). Rejected because the user wants the convenience.

### URL approach
- **Search params + replaceState (chosen)**: Zero-dependency, no history pollution, bookmarkable.
- **React Router**: Overkill for two view states. Would add ~20KB to bundle.
- **Hash routing**: `#/viewport/focusedId` — would work but mix of hash and search params is less clean. Search params are the standard for query-like state.
- **No URL at all**: Lost state on every reload. Rejected as the core problem.

## Consequences

- Positive: Handle persistence is opt-in and off by default — no surprise behavior for existing users.
- Positive: URL state is fully transparent — the user can see it, bookmark it, share it, or clear it.
- Positive: No new npm dependencies.
- Positive: The reading viewport URL is bookmarkable — collaborating or returning to a specific entity is a link.
- Trade-off: IndexedDB persistence re-introduces opaque storage (the goal of PRD0009 was to avoid it). Mitigated by the feature flag — users who prefer full transparency leave it off.
- Trade-off: Stale entity IDs in bookmarks will silently fall back to canvas instead of showing an error. Acceptable — the user sees a clean state rather than a broken view.
- Risk: Permission prompts on startup (when `requestPermission` returns `"prompt"`). Mitigated: the browser prompt is a one-time permission dialog, not an error.

## Follow-ups

- [x] Create `src/config.ts` with `PERSIST_HANDLE` feature flag
- [x] Create `src/persistence.ts` with IndexedDB helpers (saveHandle, loadHandle, clearHandle)
- [x] Add `restoreFolder()` action to store
- [x] Persist handle after `openFolder()` when flag is on
- [x] Sync view state to URL search params
- [x] Restore view state from URL after folder is resolved
- [x] TypeScript type augmentation for `FileSystemHandle.requestPermission`
- [ ] Update dev-docs (requirements, architecture, changelog, roadmap)
- [ ] Archive the PRD
