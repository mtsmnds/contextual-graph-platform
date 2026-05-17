## Task: Test and UI refinement

### Purpose

A lightweight PRD for a series of small, incremental adjustments discovered through real-world testing with the `~/Code/hello2` dataset. Instead of filing each tweak as its own PRD, this PRD collects them into a single batch — no more than a few lines of code each, fast to implement and verify.

Each request is small enough that the agent should implement it immediately after the user states it, without needing to pre-plan. This PRD exists to document the batch and provide an archive point.

### Scope

- UI polish: layout, spacing, label rendering, button placement
- Data insertion: injecting test entities/relations directly into the graph for debugging
- Interaction refinements: edge cases in CRUD, missing gestures, feedback improvements
- Any other sub-5-line change that doesn't warrant its own PRD

### Out of scope

- New features (thread view, query builder — those are II.10/II.11)
- Architecture changes
- Schema changes
