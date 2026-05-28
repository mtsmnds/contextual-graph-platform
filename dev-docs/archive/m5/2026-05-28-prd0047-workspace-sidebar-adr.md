# 2026-05-28: prd0047 — no architectural changes

This PRD replaced the WorkspaceMenu popover with a persistent sidebar using existing shadcn sidebar primitives. No data schema, build pipeline, or state persistence changes beyond adding feature flag localStorage persistence (which follows the existing pattern). All components are UI-only, depending on the existing Zustand store interface.
