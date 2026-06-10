
PersistenceCluster ￼

A self-contained component for the sidebar footer that groups all file persistence controls and status in one place.


Layout

┌─ PersistenceCluster ─────────────────────┐
│                                           │
│  [📂 Open Folder]  [💾 Save]  [✕ Close]  │
│                                     [●]   │
│                                           │
│  ▸ FS Activity                            │
│  ┌───────────────────────────────────────┐│
│  │ 12:03:01  open   ✓  hello2            ││
│  │ 12:05:14  save   ✓  945 entities      ││
│  │ 12:08:22  save   ✗  WRITE_FAILED      ││
│  └───────────────────────────────────────┘│
│                                           │
└───────────────────────────────────────────┘


Components

PersistenceCluster
├── PersistenceActions       ← button row
│   ├── Open Folder button
│   ├── Save button          (disabled when no folder open)
│   └── Close button         (disabled when no folder open)
├── StatusDot                ← connection + dirty indicator
│   ├── gray   = no folder open
│   ├── green  = folder open, saved, clean
│   ├── yellow = folder open, unsaved changes
│   └── red    = last operation failed
└── FSActivityLog            ← collapsible operation history
    ├── collapsed by default (just "FS Activity ▸")
    ├── expanded shows log entries from FSAdapter.getLog()
    └── each entry: timestamp, operation, success/fail, detail


Props

interface PersistenceClusterProps {
  folderName: string | null
  isDirty: boolean
  status: "idle" | "connected" | "error"
  log: FSLogEntry[]
  onOpenFolder: () => void
  onSave: () => void
  onClose: () => void
}


Behavior

- No folder open: Save and Close are disabled. StatusDot is gray. Log is empty or shows last session’s close entry.

- Folder open, clean: Save is enabled. StatusDot is green. Log shows open entry.

- Folder open, dirty: Save is enabled. StatusDot is yellow. Tooltip: “Unsaved changes.”

- After error: StatusDot turns red. Log shows the error entry with code and detail. Tooltip shows the error message.

- After save: StatusDot returns to green. Log appends save success entry.


Isolation

- Pure presentational — no store imports, no FSAdapter imports

- All data and callbacks come via props

- Parent (AppSidebar or WorkspaceShell) reads from the store and passes props down

- Can be mounted in Storybook with mock data

- Can be reused in future layouts (bottom bar, floating panel, etc.)


Data source ￼

The parent reads:

- ‎`folderName` from ‎`useGraphStore(s => s.folderName)`

- ‎`isDirty` from ‎`useGraphStore(s => s.isDirty())`

- ‎`status` from the FSAdapter instance via a store getter

- ‎`log` from the FSAdapter instance via ‎`getLog()`

- Callbacks from store actions: ‎`openFromDisk`, ‎`saveToDisk`, ‎`closeDisk`


Future

• StatusDot tooltip could show “Last saved 3m ago” with relative time

- Log entries could be filterable (show only errors)

- The log could move to a Zustand slice so it persists across adapter replacements

- The whole cluster could move from sidebar footer to a WorkspaceShell footer bar when unified chrome ships



# Prefer this layout 

Sidebar footer layout:
┌──────────────────────────┐
│ [Open Folder] [Save] [●] │  ← buttons + status dot
├──────────────────────────┤
│ ▸ FS Activity            │  ← collapsed by default
│   12:03 open ✓ hello2    │
│   12:05 save ✓           │  ← expanded shows log
│   12:08 save ✗ write err │
└──────────────────────────┘
