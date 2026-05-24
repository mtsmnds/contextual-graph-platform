# 2026-05-23: prd0043 — Undo/Redo + Backups

## Context

Two features — undo/redo (intra-session recovery) and backups (cross-session safety) — shared a common foundation: both needed to capture the full domain state before mutations. The original plan had them as separate PRDs (0043 and 0044), but during planning the overlap became clear. A single snapshot-based mechanism could power both, with the undo stack running in memory for Cmd+Z and recent snapshots persisted to disk for crash recovery.

The command-pattern approach (per-mutation undo/redo logic) was rejected because it requires maintenance for every new store action. Snapshots capture everything automatically — every future feature is undoable without additional code.

## Decision

**Unified snapshot system:** `beginBatch(description)` / `endBatch()` with depth-counter wrapping on all tracked store mutations. Each batch captures a `HistoryEntry { entities, relations, canvas, description, timestamp }` before mutation. The undo stack holds up to 50 entries in memory; the redo stack is cleared on every new snapshot.

**Auto-backup persistence:** The existing auto-save subscriber (300ms debounce) was extended with a 2s idle guard (`Date.now() - lastMutationTime >= 2000`). When idle, the 10 most recent undo entries are persisted to `backups/auto/snapshot_<timestamp>.json` with document content included. On workspace load, if auto-backup files exist on disk, a banner appears inside the workspace menu.

**Manual backups (FS Access only):** Full `GraphSnapshot` + document content saved to `backups/manual/<timestamp>/`. Engine functions in `src/engine/backup.ts` handle create/list/delete/restore.

**UI (final form):** Merged into a Notion-style three-dot menu (`WorkspaceMenu.tsx`) with undo/redo buttons, Open Folder, and backup sections (manual saves + recent snapshots). Replaced the original multi-button top-right panel.

**Schema v5 integration:** PRD0044 was implemented immediately after on the same branch — positions moved onto entities as `canvasData`, making undo/redo automatically capture position changes. Drag-end and resize-end became undoable.

## Alternatives Considered

**Separate PRDs:** Would have duplicated snapshot logic. Rejected in favor of unified approach.

**Command pattern:** Per-mutation undo/redo that must be updated for each new feature. Rejected because snapshots are zero-maintenance.

**Auto-save on every snapshot:** Writing to disk on every `endBatch` would thrash the disk. Rejected in favor of 2s idle guard piggybacking on existing auto-save.

## Consequences

**Positive:** Every user action is undoable — snapshots require zero per-mutation logic. Backup panel shows both manual saves and recent history. Crash recovery via auto-persisted snapshots. Three-dot menu consolidates workspace actions.

**Trade-offs:** In-memory undo is lost on page reload (design trade-off for simplicity). Auto-snapshot persistence only fires after 2s idle — rapid editing sessions lose crash recovery for recent work.

**Risks:** None introduced. The snapshot mechanism captures state via shallow reference copies — Zustand creates new arrays/objects on every mutation, so old snapshots are immutable.

## Follow-ups

- None required. The snapshot engine is extensible — any new store mutation wrapped in `beginBatch`/`endBatch` is automatically undoable.
