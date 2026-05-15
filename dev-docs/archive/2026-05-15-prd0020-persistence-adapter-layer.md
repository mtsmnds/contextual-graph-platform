> **Completion note (2026-05-15):** PRD0020 fully implemented. See ADR at `archive/2026-05-15-persistence-adapter-layer.md` for architecture rationale, and `changelog.md` for the complete change log. The adapter layer (IndexedDB default + FS Access opt-in) replaces the localStorage-only approach from 2026-05-15.

# PRD: User Data Management & Persistence Layer

## Problem

The app currently uses localStorage as its persistence layer, which conflates three concerns: the canonical data model, storage/runtime abstraction, and distribution mode (desktop vs. web vs. hosted). localStorage is synchronous, size-limited, permission-sensitive, blocks the main thread, and cannot handle binary assets or transactional safety. The project has outgrown it.

## Vision

Treat the app as a **local-first workspace platform** with pluggable persistence — not a React app with saved state. The architecture should support a web playground, a Tauri-wrapped desktop app (Obsidian-style folder access), and an optional hosted version, all sharing the same application logic.

## Architecture

### Layered Design

```
UI (React / Tiptap / Graph)
        ↓
  Application Store (Zustand)
        ↓
  Persistence Adapter (selected by flag)
        ↓
  Filesystem / IndexedDB / Remote API
```

Components never touch persistence directly. They call `workspaceStore.saveNode(id)` — the adapter decides how to persist.

### Persistence Adapter Interface

```ts
interface PersistenceAdapter {
  id: AdapterType
  loadWorkspace(): Promise<WorkspaceData>
  saveDocument(doc: DocumentNode): Promise<void>
  saveGraph(graph: GraphData): Promise<void>
  readAsset(path: string): Promise<ArrayBuffer>
  writeAsset(path: string, data: ArrayBuffer): Promise<void>
  isAvailable(): Promise<boolean>
}
```

Implementations:
- **FSAccessAdapter** — File System Access API, for dev and online tool (Chromium browsers)
- **IndexedDBAdapter** (via Dexie) — fallback for browsers without FS Access support
- **TauriFSAdapter** — desktop app with native filesystem access
- **RemoteAPIAdapter** — future hosted/cloud version

### Adapter Selection Flag

A configuration flag controls which adapter is active. The flag can be set via environment variable, runtime config, or URL parameter for testing.

```ts
type AdapterType = "fs-access" | "indexeddb" | "tauri" | "remote"

interface PersistenceConfig {
  adapter: AdapterType | "auto"
  // When "auto", resolved by detection order below.
  // When explicit, forces that adapter (fails if unavailable).
}
```

**Resolution order for `"auto":`**

```ts
function resolveAdapter(config: PersistenceConfig): PersistenceAdapter {
  // Explicit override — useful for testing, toggling in dev
  if (config.adapter !== "auto") {
    return createAdapter(config.adapter)
  }

  // Auto-detect by environment
  if ("__TAURI__" in window)           return new TauriFSAdapter()
  if ("showDirectoryPicker" in window) return new FSAccessAdapter()
  return new IndexedDBAdapter()
}
```

**How the flag is set per distribution mode:**

| Package | Default flag | Why |
|---|---|---|
| npm package / GitHub template | `"auto"` → resolves to `fs-access` | Devs run in Chrome, want visible files |
| Online tool | `"auto"` → resolves to `fs-access` or `indexeddb` | FS Access if Chromium, IndexedDB fallback |
| Tauri wrap | `"auto"` → resolves to `tauri` | `__TAURI__` global detected |
| Testing / CI | `"indexeddb"` (explicit) | No FS permissions in headless browsers |

**Override via env or URL (dev convenience):**

```ts
function getConfig(): PersistenceConfig {
  // URL param: ?adapter=indexeddb (for testing)
  const urlOverride = new URLSearchParams(location.search).get("adapter")
  if (urlOverride && isValidAdapter(urlOverride)) {
    return { adapter: urlOverride as AdapterType }
  }

  // Env var set at build time
  const envOverride = import.meta.env.VITE_PERSISTENCE_ADAPTER
  if (envOverride && isValidAdapter(envOverride)) {
    return { adapter: envOverride as AdapterType }
  }

  return { adapter: "auto" }
}
```

This means you can:
- Force IndexedDB during tests: `VITE_PERSISTENCE_ADAPTER=indexeddb npm run test`
- Test FS Access behavior: `http://localhost:5173?adapter=fs-access`
- Disable filesystem entirely: `?adapter=indexeddb`

### Persistence Tiers

| Mode | Adapter | Save behavior |
| --- | --- | --- |
| Playground | IndexedDBAdapter | Temporary, clearable |
| Local mode (browser) | FSAccessAdapter | Persistent, user-visible folder |
| Desktop | TauriFSAdapter | Persistent, native filesystem |
| Cloud | RemoteAPIAdapter | Remote sync |

The app remains identical across modes. Only the adapter, onboarding flow, and save guarantees change.

## Data Model

### Separation of Concerns

Tiptap owns **document content only**. Graph topology, workspace structure, navigation, and metadata live in the graph layer above Tiptap.
It's already implemented.

## Seed System

Seeds are workspace templates — folders containing graph data, documents, and assets.
We already have it

### Seed as Fallback

When no workspace data exists (first launch, empty IndexedDB, no folder selected), the app loads a seed as the initial workspace state. This prevents a blank screen and doubles as onboarding.

```ts
async function loadWorkspaceOrSeed(
  adapter: PersistenceAdapter
): Promise<WorkspaceData> {
  const workspace = await adapter.loadWorkspace()
  if (workspace) return workspace

  // No saved data — load seed
  const seed = await loadSeed("default-workspace")

  // If using a filesystem adapter, offer to write seed to the folder
  if (adapter.id === "fs-access" || adapter.id === "tauri") {
    await writeSeedToAdapter(adapter, seed)
  }

  return seed
}
```

For this project, we already ship `SEED_DATA` (two containers: "About This Workspace" and "Editor Playground"). `loadWorkspaceOrSeed` is the integration point — the adapter reports empty, we load the seed into it. No separate seed templates, no `tutorial` vs `default-workspace` distinction.

**Seed resolution by context:**

| Situation | Seed used | Behavior |
|---|---|---|
| First launch, any adapter | `SEED_DATA` | Loaded into memory, saved to adapter |
| User picks empty folder | `SEED_DATA` | Written to folder, visible in Finder |
| User picks folder with existing data | None | Existing data loaded |

### UX for Folder Selection

The folder picker lives in the sidebar menu. On first launch:
1. Seed content is loaded and displayed
2. An **"Open Folder…"** action appears in the sidebar menu
3. User picks a folder via the native directory picker
4. If the folder is empty, seed content is written into it and FS Access adapter takes over
5. If the folder already has workspace data (`graph.json`), it's loaded directly — seed is not written

After a folder is opened, the folder name (basename) is shown in a breadcrumb at the top of the sidebar (via `@shadcn/breadcrumb`). No path, just the folder name — acts as a persistent location indicator.

Subsequent launches with FS Access: the app re-opens the previously picked folder (permission permitting). If permission was revoked, show a reconnect button — never call `requestPermission()` without a user gesture.

Later we can iterate on changing folders mid-session or opening multiple folders, but not in Phase 1.

### User Story: First Launch

**Actor:** A new user opening the app for the first time.

1. App loads in the browser. No prior data exists in any adapter.
2. `loadWorkspaceOrSeed` detects empty → imports `SEED_DATA` → writes it into IndexedDB (the default adapter when no FS folder is picked).
3. User sees "About This Workspace" and "Editor Playground" in the graph. Everything works normally.
4. In the sidebar menu, user sees **"Open Folder…"** — an optional action. They ignore it. App continues on IndexedDB. Data persists across reloads.
5. Next session, user clicks **"Open Folder…"** → native directory picker opens → user picks `/Documents/my-workspace/`.
6. Folder is empty → app writes seed graph + documents into it, switches adapter from IndexedDB to FS Access. Folder name appears in a sidebar breadcrumb. IndexedDB data is preserved as a cache/fallback.
7. User reloads the page. `queryPermission` on the stored handle returns `"granted"` → FS Access reconnects silently. User sees their data.
8. User reloads again later. This time `queryPermission` returns `"prompt"` (permission was revoked). The sidebar shows a **"Reconnect"** button. App silently falls back to IndexedDB for reads/writes.
9. User clicks **"Reconnect"** → browser prompts → user grants → FS Access resumes. If user dismisses the prompt (`AbortError`), stays on IndexedDB — no dead end.

**Edge case — User cancels folder picker:** `showDirectoryPicker` throws `AbortError`. Catch it, show a toast "No folder selected — working from IndexedDB", continue on IndexedDB.

**Edge case — Folder has data but is incompatible version:** Prompt user: "This workspace was created by a different version. Open anyway?" If yes, attempt migration. If no, stay on IndexedDB.

**Edge case — IndexedDB write fails:** Catch, show error toast with "Retry" or "Export data" fallback. App remains usable in-memory (Zustand state survives until reload).

## Write Strategy

- In-memory state (Zustand) updates instantly on every change.
- Persistence is **debounced** — flushed after ~500ms of inactivity.
- No synchronous saves on keystroke. Critical for Tiptap editor performance.
- Per-file write queue prevents lock contention on the File System Access API.

```
editor change → Zustand update → autosave queue → flush after 500ms
```

## Key Constraints

- Never couple application code to a specific adapter's API. Components call the store, the store calls the adapter.
- Never call `requestPermission()` without a user gesture. Show a reconnect button if permission is needed on reload.
- Always `abort()` file writables on error to release locks.
- Feature-detect `showDirectoryPicker` before offering FS Access. Fall back to IndexedDB silently.
- The adapter flag must be overridable at runtime for testing without rebuilding.

## Tech Stack

| Layer | Tool |
| --- | --- |
| UI framework | React |
| Bundler | Vite |
| Rich text editor | Tiptap |
| State management | Zustand |
| Web persistence | Dexie.js |
| Desktop wrapper | Tauri |
| Graph rendering | React Flow |

## Phasing

**Phase 1 — Adapter interface + FSAccessAdapter + IndexedDBAdapter.**
Replace localStorage. Implement the `PersistenceAdapter` interface, the flag-based resolver, and two working adapters. Zustand store consumes the adapter. Seed fallback loads `SEED_DATA` when no data exists. Folder picker in sidebar.

**Phase 2 — Persistence UX polish.**
Reconnection flows, error states (permission denied, storage full), workspace reset/clear, visual indicator of active adapter in the sidebar.

**Phase 3 — Write strategy hardening.**
Configurable debounce delay, conflict detection between tabs (IndexedDB), per-file write queue (FS Access), abort-on-error cleanup.

**Phase 4 — Tauri filesystem.**
Implement `TauriFSAdapter`. Since the interface already exists, this is just filling in the implementation with Tauri's FS APIs.

**Phase 5 — Sync layer.**
Only when the above is stable. Most projects overbuild sync too early.
