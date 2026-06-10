export type { AdapterType, PersistenceAdapter, WorkspaceSnapshot } from "./types"
export { IndexedDBAdapter } from "./indexeddb-adapter"
/** @deprecated Replaced by FSAdapter. Keep for legacy /tiptap-editor-test. */
export { FSAccessAdapter } from "./fs-access-adapter"
export { FSAdapter, FSError, validateSnapshot } from "./FSAdapter"
export type { FSErrorCode, FSLogEntry, FSAdapterStatus } from "./FSAdapter"
export { resolveAdapter, setAdapter, getFSAccessInstance, getActiveAdapter } from "./resolver"
