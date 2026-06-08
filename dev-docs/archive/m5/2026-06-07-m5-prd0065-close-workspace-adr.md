# 2026-06-07: m5-prd0065 — Close/Quit Workspace

## Context
- No way to close a workspace and reload fresh data from graph.json without clearing IndexedDB manually
- IndexedDB cache could become stale relative to the file after manual edits
- A "reload from file" feature was scoped down to a simpler close/open flow

## Decision
- Single `closeWorkspace()` store action that resets all state to blank
- Resets module-level `_adapter` and `_hydrated` to disable auto-save subscriber
- "Close Workspace" button in sidebar footer, gated by `folderName != null`
- No confirmation dialog — same mental model as closing a tab

## Alternatives Considered
- Tactical "Reload from File" with dirty detection and `_skipNextSave` flag — scoped down as too complex for the immediate need
- Confirmation dialog — unnecessary; closing a tab doesn't ask either

## Consequences
- Cleanest path to refresh: Close → Open Folder reads fresh graph.json
- Auto-save subscriber is naturally inert after close (guards on `_hydrated`)
- Content cache is cleared — next Open Folder loads fresh Tiptap documents
- Folder picker state is lost — user must re-select the folder (could be improved later by persisting the last folder handle)
