import type { AdapterType, PersistenceAdapter } from "./types"
import { IndexedDBAdapter } from "./indexeddb-adapter"
/** @deprecated Only kept for legacy TiptapSidebar. */
import { FSAccessAdapter } from "./fs-access-adapter"

const VALID_ADAPTERS: AdapterType[] = ["indexeddb", "fs-access"]
let _adapter: PersistenceAdapter | null = null
let _fsAccess: FSAccessAdapter | null = null

function isValidAdapter(value: string): value is AdapterType {
  return (VALID_ADAPTERS as string[]).includes(value)
}

/** @deprecated Only kept for legacy TiptapSidebar at /tiptap-editor-test. */
export function getFSAccessInstance(): FSAccessAdapter {
  if (!_fsAccess) {
    _fsAccess = new FSAccessAdapter()
  }
  return _fsAccess
}

export async function resolveAdapter(): Promise<PersistenceAdapter> {
  if (_adapter) return _adapter

  // URL override for testing only
  const urlOverride = new URLSearchParams(location.search).get("adapter")
  if (urlOverride && isValidAdapter(urlOverride)) {
    _adapter = new IndexedDBAdapter()
  } else {
    _adapter = new IndexedDBAdapter()
  }

  return _adapter
}

export function setAdapter(adapter: PersistenceAdapter): void {
  _adapter = adapter
}

export function getActiveAdapter(): PersistenceAdapter | null {
  return _adapter
}
