# 2026-05-22: seed ID collision fix — no architectural changes

This change did not affect architecture. The entity model, GraphSnapshot schema, persistence adapter interface, and React Flow integration are unchanged. The fix is purely within `init()`'s logic for entity ID generation on seed and ID remapping on load. See changelog entry for scope.