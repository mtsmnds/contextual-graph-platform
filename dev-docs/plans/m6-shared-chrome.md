# m6 — Shared Chrome

## Goal

All routes (canvas, viz-test-1, future views) share the same init flow, file access, and status UI — no more route-specific boot logic or silent FS failures.

## Tasks

| # | What | Effort | Depends on |
|---|------|--------|------------|
| 1 | **FS slice in Zustand** — add `diskStatus: "idle" \| "open" \| "saving" \| "error"`, `diskError: string \| null`, `diskLog: FSLogEntry[]`, `lastSavedAt: number` to store. Wire `openFromDisk`/`saveToDisk` to update them. FSAdapter already has typed errors and log — surface them in the store. | Small | FSAdapter done |
| 2 | **WorkspaceShell** — new component in `App.tsx` wrapping all routes. Calls `resolveAdapter()` → `init()` once. Moves `useEffect(init)` out of `WorkspaceRoot`. VizTest1 gets data automatically. | Small | None (can precede #1) |
| 3 | **Status indicator** — `DiskStatusBadge` component reading `diskStatus` from store. Shows "Saved" / "Unsaved" / "No folder". Mount in sidebar header. | Trivial | #1 |
| 4 | **Open Folder / Reload buttons** — move Open Folder button from WorkspaceRoot's sidebar into shared location (shell header). Add "Reload from File" button that re-reads graph.json. | Small | #2 |
| 5 | **Verbose console** — collapsible log viewer showing FSAdapter's `getLog()` with timestamps, success/failure, error codes. Toggle from experimental section. | Small | #1 |

## Acceptance

- Opening a folder from any route loads data into the same store
- Status badge reflects current disk state accurately
- Verbose console shows every FS operation with error codes on failure
- Reload from File re-reads graph.json without reopening the picker

## Risk

Moderate — WorkspaceShell changes routing init flow. If `init()` timing shifts (e.g. component mounts before adapter resolves), seed data flashes before workspace data loads. Mitigation: keep `hydrated` flag, don't render children until true.
