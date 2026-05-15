import type { AdapterType, PersistenceAdapter } from "./types"
import { IndexedDBAdapter } from "./indexeddb-adapter"
import { FSAccessAdapter } from "./fs-access-adapter"

const VALID_ADAPTERS: AdapterType[] = ["indexeddb", "fs-access"]
let _adapter: PersistenceAdapter | null = null
let _fsAccess: FSAccessAdapter | null = null

function isValidAdapter(value: string): value is AdapterType {
  return (VALID_ADAPTERS as string[]).includes(value)
}

function getConfig(): { adapter: AdapterType | "auto" } {
  const urlOverride = new URLSearchParams(location.search).get("adapter")
  if (urlOverride && isValidAdapter(urlOverride)) {
    return { adapter: urlOverride }
  }

  const envOverride = import.meta.env.VITE_PERSISTENCE_ADAPTER as string | undefined
  if (envOverride && isValidAdapter(envOverride)) {
    return { adapter: envOverride }
  }

  return { adapter: "auto" }
}

export function getFSAccessInstance(): FSAccessAdapter {
  if (!_fsAccess) {
    _fsAccess = new FSAccessAdapter()
  }
  return _fsAccess
}

export async function resolveAdapter(): Promise<PersistenceAdapter> {
  if (_adapter) return _adapter

  const config = getConfig()

  if (config.adapter === "auto") {
    if ("showDirectoryPicker" in window) {
      const fsa = getFSAccessInstance()
      const reconnected = await fsa.tryReconnect()
      if (reconnected) {
        _adapter = fsa
        return _adapter
      }
    }
    _adapter = new IndexedDBAdapter()
  } else if (config.adapter === "fs-access") {
    const fsa = getFSAccessInstance()
    const reconnected = await fsa.tryReconnect()
    if (!reconnected) {
      console.warn("FS Access adapter requested but permission not granted — falling back to IndexedDB")
    }
    _adapter = reconnected ? fsa : new IndexedDBAdapter()
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
