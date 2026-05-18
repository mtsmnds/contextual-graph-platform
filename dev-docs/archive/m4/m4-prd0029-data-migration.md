> **Completion note (2026-05-16):**
> - **What was built:** `migrateSnapshot()` in store pads `createdAt`/`updatedAt`/`sortOrder` when loading version < 2 data. `handleOpenFolder` version hardcode fixed (1→2). Ran one-time migration script on `~/Code/hello2/graph.json`.
> - **Deviations:** Scope crept beyond the PRD — also removed sidebar/topbar from WorkspaceRoot, moved Open Folder button into GraphCanvas Panel, updated architecture.md/AGENTS.md/reminders.md with full Graph Canvas docs. These were in-flight changes that should have been a separate PRD but were swept into the same commit.

## Task: Version 1 → 2 data migration

### Context

PRD0025 bumped `GraphSnapshot.version` to `2` and added `sortOrder`, `createdAt`, `updatedAt` as required fields. Existing persisted data (both IndexedDB and FS Access `graph.json`) is version 1 and lacks these fields. Loading old data without defaults causes runtime errors (e.g. `sortOrder.localeCompare()` on `undefined`).

This PRD adds a one-time migration in the store's `init()` that pads defaults, and fixes the `handleOpenFolder` path that hardcodes version 1.

### Steps

#### 1. Migration function in store

In `src/store/useGraphStore.ts`, add a migration before loading workspace data into state:

```ts
function migrateSnapshot(snapshot: GraphSnapshot): GraphSnapshot {
  if (snapshot.version >= 2) return snapshot
  const now = Date.now()
  return {
    version: 2,
    entities: snapshot.entities.map((e) => ({
      ...e,
      createdAt: e.createdAt ?? now,
      updatedAt: e.updatedAt ?? now,
    })),
    relations: snapshot.relations.map((r) => ({
      ...r,
      sortOrder: r.sortOrder ?? generateKeyBetween(null, null),
    })),
  }
}
```

Call this on the workspace loaded from the adapter, and on seed data (already version 2, but belt-and-suspenders).

#### 2. Fix `handleOpenFolder` version hardcode

In `src/components/AppSidebar.tsx`, line 57:

```ts
const snapshot = { version: 1 as const, ... }
```

Should be:

```ts
const snapshot = { version: 2 as const, ... }
```

This only runs when opening a folder with no existing `graph.json` — it's the "migrate current in-memory state to FS" path.

#### 3. Verify loaded data renders

Open the app, click "Open Folder…" → pick `~/Code/hello2`. Verify the graph renders all 15 entities and 1 quote edge with no console errors. Double-click a node to edit, verify the dialog opens.

### Files changed

| File | Change |
|------|--------|
| `src/store/useGraphStore.ts` | Add `migrateSnapshot()`, call it on loaded workspace and seed data |
| `src/components/AppSidebar.tsx` | Fix `version: 1` → `version: 2` |
