# 2026-05-15: Pluggable Persistence Adapter Layer (PRD0020)

## Context
- The 2026-05-15 localStorage decision (ADR: `localstorage-persistence.md`) replaced FS Access with localStorage to fix cross-browser and static-SPA deployment issues. This was correct for the immediate goal of testing core features, but localStorage is synchronous, size-limited (~5-10MB), blocks the main thread, and cannot handle binary assets or transactional safety.
- Users could not see or share their data — it was locked in the browser profile with no portability.
- The File System Access API's real value (user-visible files, cross-machine portability via cloud storage folders, git versioning) was lost in the revert but remains a product requirement for power users.
- The app now had three persistence formats in its history: localStorage, FS Access graph.json, and per-document content keys. Each was coupled to a single implementation — switching back meant rewriting the store again.

## Decision
Introduce a pluggable `PersistenceAdapter` interface with two implementations (`IndexedDBAdapter`, `FSAccessAdapter`) and an auto-resolver. The store consumes the adapter through a uniform interface — it never touches persistence directly.

**In scope:**
- `PersistenceAdapter` interface: `loadWorkspace()`, `saveGraph()`, `loadDocument()`, `saveDocument()`, `deleteDocument()`, `getFolderName()`
- `IndexedDBAdapter` — default adapter, uses Dexie.js for IndexedDB access. Replaces localStorage.
- `FSAccessAdapter` — optional adapter for Chromium browsers, reads/writes `graph.json` + per-document files in a user-picked folder. Handle persisted via IndexedDB.
- `resolveAdapter()` — auto-detection: tries FS Access reconnection first, falls back to IndexedDB. Overridable via `VITE_PERSISTENCE_ADAPTER` env var or `?adapter=` URL param.
- Store `init(adapter)` replaces `loadInitialState()` — the adapter is injected at startup, not hardcoded.
- Sidebar "Open Folder&hellip;" button appears when adapter is IndexedDB and `showDirectoryPicker` is available.
- Folder name breadcrumb in sidebar header when FS Access is active.
- Seed data fallback: if adapter returns no workspace, seed data is written to the adapter.

**Out of scope:**
- TauriFSAdapter (Phase 4 of PRD0020 — deferred until Tauri packaging)
- RemoteAPIAdapter (future cloud sync)
- Conflict detection between tabs sharing the same IndexedDB
- Per-file write queue for FS Access

## Alternatives Considered
- **localStorage + manual export (status quo):** Simple, works everywhere, but synchronous I/O blocks the main thread. 5-10MB limit. No portability. Cannot store binary assets. Rejected for scalability reasons — the app needs to handle larger document collections.
- **IndexedDB only (no FS Access):** Cross-browser compatible, async, larger quota. But users still can't access their files on disk. No path to desktop app integration. Rejected — FS Access is a product differentiator for power users.
- **Pure FS Access (2026-05-14 approach):** Gated the whole app on a Chromium-only API. Broke on static deployment, Firefox, Safari, mobile. Rejected — but the new adapter approach avoids this by making FS Access opt-in with IndexedDB fallback.
- **localStorage for graph + IndexedDB for documents:** Mixed storage backends with no unified interface. Would require store to know about both. Rejected — the adapter abstraction keeps the store clean.

## Consequences
- **Positive:** Persistence is now a resolved architectural concern — adding new adapters (Tauri, remote) requires zero store changes. IndexedDB is async and has larger quotas than localStorage. FS Access is opt-in and fails gracefully. The adapter resolver enables URL/env-based adapter switching for testing without rebuilding. Folder name breadcrumb gives users a persistent location indicator.
- **Trade-offs:** New dependency (Dexie.js ~15KB gzipped). More code than localStorage-only (~250 lines of adapter code vs ~50 for localStorage). The adapter pattern adds indirection — debugging persistence issues requires understanding which adapter is active.
- **Risks:** IndexedDB reliability varies across browsers (Safari private browsing may clear data). FS Access permission prompts can be annoying if they fire too frequently — mitigated by never calling `requestPermission()` without a user gesture (the "Reconnect" pattern). The `hello3/` directory is a test artifact — clean up before release.

## Follow-ups
- Remove `hello2/` and `hello3/` test data directories.
- Add TauriFSAdapter for desktop packaging (roadmap Later).
- Add Export/Import JSON buttons for data portability from IndexedDB.
- Validate IndexedDB behavior in Safari private browsing mode.
- Consider adding a visual adapter indicator in the sidebar (which adapter is active).
