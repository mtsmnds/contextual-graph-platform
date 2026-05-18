# Workflow Log

Record of every command executed by the `dev-workflow` skill.
Append-only, newest on top within same-day groupings.

---

## 2026-05-18

### prd merge — m4-prd0040-edge-inline-editing
- **Branch at time:** main (clean)
- **User decision:** merge single branch (m4-prd0040-edge-inline-editing)
- **Merge order:** m4-prd0040-edge-inline-editing (0040)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** no changes

### prd end — m4-prd0040-edge-inline-editing
- **Source:** roadmap: "Edge inline editing"
- **Branch at time:** m4-prd0040-edge-inline-editing (clean)
- **User decision:** classification: Feature change
- **Change classification:** Feature change
- **ADR type:** no architectural changes
- **Commit hash:** a9f12e7
- **Pre-commit guard:** auto-proceeded (uncommitted changes from prd start)

### prd start — m4-prd0040-edge-inline-editing
- **Source:** roadmap: "Edge inline editing"
- **Branch at time:** main (clean)
- **User decision:** branch from main
- **Branch name:** m4-prd0040-edge-inline-editing
- **Scope:** full (single phase)
- **Pre-commit guard:** no changes

### prd write — m4-prd0041-node-metadata-panel
- **Source:** roadmap: "Node metadata panel (NodeAppendix)"
- **Branch at time:** main (dirty — prd0040 files)
- **User decision:** panel on node selection, simple two-column key-value table for metadata, context menu "Edit" opens panel
- **PRD file:** `dev-docs/plans/m4-prd0041-node-metadata-panel.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** skipped (uncommitted prd0040 files)

### prd write — m4-prd0040-edge-inline-editing
- **Source:** roadmap: "Edge inline editing"
- **Branch at time:** main (clean)
- **User decision:** freeform input + combobox dropdown of existing relation types
- **PRD file:** `dev-docs/plans/m4-prd0040-edge-inline-editing.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** no changes

### prd merge — m4-prd0039-cmd-drag-duplicate-node
- **Branch at time:** main (clean)
- **User decision:** merge single branch
- **Merge order:** m4-prd0039-cmd-drag-duplicate-node (0039)
- **Conflicts:** none
- **Final status:** merged into main cleanly
- **Pre-commit guard:** committed wip ("docs")

### prd end — m4-prd0039-cmd-drag-duplicate-node
- **Source:** roadmap: "Cmd+drag to duplicate node"
- **Branch at time:** m4-prd0039-cmd-drag-duplicate-node (clean)
- **User decision:** classification: Feature change + Architecture change
- **Change classification:** Feature change + Architecture change
- **ADR type:** full (`setCanvasPositions` merge → `replaceCanvasPositions` split, store contract changed)
- **Commit hash:** 5564d09 (archive)
- **Pre-commit guard:** no changes (already committed)

### prd start — m4-prd0039-cmd-drag-duplicate-node
- **Source:** roadmap: "Cmd+drag to duplicate node"
- **Branch at time:** main (clean)
- **User decision:** branch from main
- **Branch name:** m4-prd0039-cmd-drag-duplicate-node
- **Scope:** full (single phase)
- **Pre-commit guard:** no changes

### prd write — m4-prd0039-cmd-drag-duplicate-node
- **Source:** roadmap: "Cmd+drag to duplicate node"
- **Branch at time:** main (clean)
- **User decision:** full clone (kind+content+metadata), preserve relative positions on multi-select, no auto-edit mode
- **PRD file:** `dev-docs/plans/m4-prd0039-cmd-drag-duplicate-node.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** no changes



### prd merge — cursor-styles → create-node-on-double-click → prd0037-zoom-improvements → m4-prd0038-save-node-positions
- **Branch at time:** m4-prd0038-save-node-positions (clean)
- **User decision:** follow suggested order; archived prd0037 before merge
- **Merge order:** cursor-styles (0035) → create-node-on-double-click (0036) → prd0037-zoom-improvements (0037) → m4-prd0038-save-node-positions (0038)
- **Conflicts:** none
- **Final status:** all 4 branches merged into main cleanly
- **Pre-commit guard:** committed ("m4: prd0038 - save node positions (archive, changelog, ADR)")

### prd end — m4-prd0038-save-node-positions
- **Source:** user text: "Save node positions — schema v4..."
- **Branch at time:** m4-prd0038-save-node-positions (clean)
- **User decision:** classification: both architecture + feature change
- **Change classification:** Architecture change + Feature change
- **ADR type:** full (schema v4, data flow change)
- **Commit hash:** 8f61254 (implementation) + 55eed96 (fix)
- **Pre-commit guard:** no changes (already committed)

### prd start — m4-prd0038-save-node-positions
- **Source:** user text: "Save node positions — schema v4..."
- **Branch at time:** prd0037-zoom-improvements (clean)
- **User decision:** stacked on prd0037-zoom-improvements
- **Branch name:** m4-prd0038-save-node-positions
- **Scope:** full (single phase)
- **Pre-commit guard:** committed ("docs")

### prd write — m4-prd0038-save-node-positions
- **Source:** user text: "Save node positions — schema v4..."
- **Branch at time:** prd0037-zoom-improvements (clean)
- **User decision:** N/A
- **PRD file:** `dev-docs/plans/m4-prd0038-save-node-positions.md`
- **Phases:** none (single phase)
- **Pre-commit guard:** committed wip ("skill improvement")

