import type { PersistenceAdapter, WorkspaceSnapshot, AdapterType } from "./types"

const HANDLE_KEY = "react-roadmap:fs-handle"
const DB_NAME = "react-roadmap-fs"

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore("handles")
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDb()
  const tx = db.transaction("handles", "readwrite")
  tx.objectStore("handles").put(handle, HANDLE_KEY)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openHandleDb()
  const tx = db.transaction("handles", "readonly")
  const req = tx.objectStore("handles").get(HANDLE_KEY)
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      resolve(req.result ?? null)
      db.close()
    }
    req.onerror = () => {
      reject(req.error)
      db.close()
    }
  })
}

export class FSAccessAdapter implements PersistenceAdapter {
  readonly id: AdapterType = "fs-access"
  private dir: FileSystemDirectoryHandle | null = null
  private dirName: string | null = null

  private ensureDir(): FileSystemDirectoryHandle | null {
    return this.dir
  }

  async initFromPicker(): Promise<boolean> {
    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" })
      this.dir = handle
      this.dirName = handle.name
      await storeHandle(handle)
      return true
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return false
      }
      throw err
    }
  }

  async tryReconnect(): Promise<boolean> {
    const handle = await loadHandle()
    if (!handle) return false

    const result = await handle.queryPermission({ mode: "readwrite" })
    if (result === "granted") {
      this.dir = handle
      this.dirName = handle.name
      return true
    }
    return false
  }

  needsReconnect(): boolean {
    return this.dir === null
  }

  getFolderName(): string | null {
    return this.dirName
  }

  getRootHandle(): FileSystemDirectoryHandle | null {
    return this.dir
  }

  private async getFile(name: string, subdir?: string): Promise<FileSystemFileHandle | null> {
    const dir = this.ensureDir()
    if (!dir) return null
    try {
      const parent = subdir ? await dir.getDirectoryHandle(subdir) : dir
      return await parent.getFileHandle(name)
    } catch {
      return null
    }
  }

  private async ensureFile(name: string, subdir?: string): Promise<FileSystemFileHandle | null> {
    const dir = this.ensureDir()
    if (!dir) return null
    const parent = subdir ? await dir.getDirectoryHandle(subdir, { create: true }) : dir
    return await parent.getFileHandle(name, { create: true })
  }

  private async readJSON<T>(name: string, subdir?: string): Promise<T | null> {
    const fileHandle = await this.getFile(name, subdir)
    if (!fileHandle) return null
    const file = await fileHandle.getFile()
    const text = await file.text()
    return JSON.parse(text) as T
  }

  private async writeJSON(name: string, data: unknown, subdir?: string): Promise<void> {
    const fileHandle = await this.ensureFile(name, subdir)
    if (!fileHandle) return
    const writable = await fileHandle.createWritable()
    try {
      await writable.write(JSON.stringify(data, null, 2))
      await writable.close()
    } catch (err) {
      await writable.abort().catch(() => {})
      throw err
    }
  }

  async loadWorkspace(): Promise<WorkspaceSnapshot | null> {
    return this.readJSON<WorkspaceSnapshot>("graph.json")
  }

  async saveGraph(snapshot: WorkspaceSnapshot): Promise<void> {
    await this.writeJSON("graph.json", snapshot)
  }

  async loadDocument(id: string): Promise<Record<string, unknown> | null> {
    return this.readJSON<Record<string, unknown>>(`${id}.json`, "documents")
  }

  async saveDocument(id: string, data: Record<string, unknown>): Promise<void> {
    await this.writeJSON(`${id}.json`, data, "documents")
  }

  async deleteDocument(id: string): Promise<void> {
    const dir = this.ensureDir()
    if (!dir) return
    try {
      const docsDir = await dir.getDirectoryHandle("documents")
      await docsDir.removeEntry(`${id}.json`)
    } catch {
      // File may not exist — ignore
    }
  }
}
