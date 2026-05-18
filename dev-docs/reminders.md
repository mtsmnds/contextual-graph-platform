<!--
  Quick-reference notes, checklists, URLs — informal content that doesn't
  belong in requirements/architecture/roadmap/changelog.

- @xyflow/react v12: CSS import is @xyflow/react/dist/style.css
- Zustand v5: type is inferred from create<T>(), no middleware pattern needed yet

  Post-completion process:
  1. Update changelog with what/why/files/impact
  2. Move plan from plans/ → archive/YYYY-MM-DD-short-title.md
  3. Prepend only a short completion note (not a full ADR unless architecture-changing)
  4. Link archive from changelog entry (Archive: field)
  5. Update roadmap — move item to Recently Completed, promote next item to Now
-->

- React Flow: `useReactFlow()` must be used inside `<ReactFlowProvider>`. Pattern: outer `GraphCanvas` wraps in `ReactFlowProvider`, inner `GraphCanvasContent` uses hooks.
- React Flow: `onDoubleClick` is a native DOM event that fires after `onNodeDoubleClick`. Don't use both for conflicting state changes — use only `onNodeDoubleClick` for node interactions.
- React Flow: Context menus via Radix/shadcn trigger-wrapper conflict with canvas pointer events. Use manual `<div>` positioning instead.
- React Flow: `onBeforeDelete` returns a `Promise<boolean>` and fires before deletion. Use this for confirmation without the node vanishing prematurely.
- Edge inline editing: EdgeLabel component uses `getBezierPath` + `EdgeLabelRenderer` from @xyflow/react. Dropdown is a simple positioned `div` list (not Popover+Command) for label positioning simplicity. Double-click label → text input + combobox; Enter/blur commits, Escape cancels.
- FS Access handle persists in IndexedDB `react-roadmap-fs` database. Clear this to reset folder selection.
- `showDirectoryPicker` requires a real user gesture (not programmatic click).
- Edge labels CSS: `.react-flow__edge-label { opacity: 1 !important; pointer-events: auto; }` for always-visible labels.
- Version 1→2 migration in `useGraphStore.init()` pads missing `createdAt`/`updatedAt`/`sortOrder`. Runs automatically on workspace load.


- create a skill specializing in frontend react engineering

- if needed improve skills with https://github.com/mattpocock/skills/tree/main/skills/productivity/write-a-skill
  - ask to get the skill docs from the link, save and use to improve existing skills

- use link for to share documentation with agent
  - add documentation link to dev-docs where appropriate 

- use graphite if necessary https://graphite.com/docs/get-started
