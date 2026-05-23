import type { Entity, Relation, CanvasState, AutoBackupEntry } from "../types/graph"
import { migrateSnapshot } from "../store/useGraphStore"

type ManualBackupInfo = {
  id: string
  timestamp: number
}

type AutoSnapshotInfo = {
  filename: string
  timestamp: number
}

const BACKUPS_DIR = "backups"

async function ensureDir(parent: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle> {
  return parent.getDirectoryHandle(name, { create: true })
}

async function getOrNull<T>(
  parent: FileSystemDirectoryHandle,
  name: string,
  resolve: (handle: FileSystemFileHandle) => Promise<T>,
): Promise<T | null> {
  try {
    const fileHandle = await parent.getFileHandle(name)
    return resolve(fileHandle)
  } catch {
    return null
  }
}

async function readJSON<T>(handle: FileSystemFileHandle): Promise<T> {
  const file = await handle.getFile()
  const text = await file.text()
  return JSON.parse(text) as T
}

async function writeJSON(handle: FileSystemFileHandle, data: unknown): Promise<void> {
  const writable = await handle.createWritable()
  try {
    await writable.write(JSON.stringify(data, null, 2))
    await writable.close()
  } catch (err) {
    await writable.abort().catch(() => {})
    throw err
  }
}

async function writeFile(
  parent: FileSystemDirectoryHandle,
  name: string,
  data: unknown,
): Promise<void> {
  const fileHandle = await parent.getFileHandle(name, { create: true })
  await writeJSON(fileHandle, data)
}

export async function createManualBackup(
  rootHandle: FileSystemDirectoryHandle,
  entities: Entity[],
  relations: Relation[],
  canvas: CanvasState,
  contentCache: Record<string, Record<string, unknown>>,
): Promise<string> {
  const timestamp = Date.now()
  const backupId = String(timestamp)

  const backupsDir = await ensureDir(rootHandle, BACKUPS_DIR)
  const manualDir = await ensureDir(backupsDir, "manual")
  const backupDir = await ensureDir(manualDir, backupId)
  const docsDir = await ensureDir(backupDir, "documents")

  await writeFile(backupDir, "graph.json", { version: 5, entities, relations, canvas })

  for (const [id, content] of Object.entries(contentCache)) {
    await writeFile(docsDir, `${id}.json`, content)
  }

  return backupId
}

export async function listManualBackups(
  rootHandle: FileSystemDirectoryHandle,
): Promise<ManualBackupInfo[]> {
  try {
    const backupsDir = await rootHandle.getDirectoryHandle(BACKUPS_DIR)
    const manualDir = await backupsDir.getDirectoryHandle("manual")
    const entries: ManualBackupInfo[] = []
    for await (const handle of manualDir.values()) {
      const name = handle.name
      const timestamp = Number(name)
      if (!Number.isNaN(timestamp)) {
        entries.push({ id: name, timestamp })
      }
    }
    entries.sort((a, b) => b.timestamp - a.timestamp)
    return entries
  } catch {
    return []
  }
}

export async function deleteManualBackup(
  rootHandle: FileSystemDirectoryHandle,
  backupId: string,
): Promise<void> {
  try {
    const backupsDir = await rootHandle.getDirectoryHandle(BACKUPS_DIR)
    const manualDir = await backupsDir.getDirectoryHandle("manual")
    await manualDir.removeEntry(backupId, { recursive: true })
  } catch {
    // Already deleted or doesn't exist
  }
}

export async function restoreManualBackup(
  rootHandle: FileSystemDirectoryHandle,
  backupId: string,
): Promise<{
  entities: Entity[]
  relations: Relation[]
  canvas: CanvasState
  documents: Record<string, Record<string, unknown>>
} | null> {
  try {
    const backupsDir = await rootHandle.getDirectoryHandle(BACKUPS_DIR)
    const manualDir = await backupsDir.getDirectoryHandle("manual")
    const backupDir = await manualDir.getDirectoryHandle(backupId)

    const graphFile = await backupDir.getFileHandle("graph.json")
    const raw = await readJSON<{
      version: number
      entities: Record<string, unknown>[]
      relations: Record<string, unknown>[]
      canvas: Record<string, unknown>
    }>(graphFile)
    const graph = migrateSnapshot(raw)

    const documents: Record<string, Record<string, unknown>> = {}

    try {
      const docsDir = await backupDir.getDirectoryHandle("documents")
      for await (const fileHandle of docsDir.values()) {
        if (fileHandle.kind !== "file") continue
        const name = fileHandle.name
        const docId = name.endsWith(".json") ? name.slice(0, -5) : name
        const content = await readJSON<Record<string, unknown>>(fileHandle)
        documents[docId] = content
      }
    } catch {
      // No documents directory — fine
    }

    return {
      entities: graph.entities,
      relations: graph.relations,
      canvas: graph.canvas,
      documents,
    }
  } catch {
    return null
  }
}

export async function persistAutoSnapshots(
  rootHandle: FileSystemDirectoryHandle,
  entries: AutoBackupEntry[],
): Promise<void> {
  if (entries.length === 0) return

  const backupsDir = await ensureDir(rootHandle, BACKUPS_DIR)
  const autoDir = await ensureDir(backupsDir, "auto")

  for (const entry of entries) {
    const filename = `snapshot_${entry.timestamp}.json`
    await writeFile(autoDir, filename, entry)
  }

  const allFiles: { name: string; timestamp: number }[] = []
  for await (const handle of autoDir.values()) {
    const name = handle.name
    if (name.startsWith("snapshot_") && name.endsWith(".json")) {
      const ts = Number(name.slice(9, -5))
      if (!Number.isNaN(ts)) {
        allFiles.push({ name, timestamp: ts })
      }
    }
  }

  allFiles.sort((a, b) => b.timestamp - a.timestamp)

  for (let i = 10; i < allFiles.length; i++) {
    try {
      await autoDir.removeEntry(allFiles[i].name)
    } catch {
      // Already gone
    }
  }
}

export async function listAutoSnapshots(
  rootHandle: FileSystemDirectoryHandle,
): Promise<AutoSnapshotInfo[]> {
  try {
    const backupsDir = await rootHandle.getDirectoryHandle(BACKUPS_DIR)
    const autoDir = await backupsDir.getDirectoryHandle("auto")
    const entries: AutoSnapshotInfo[] = []
    for await (const handle of autoDir.values()) {
      const name = handle.name
      if (name.startsWith("snapshot_") && name.endsWith(".json")) {
        const ts = Number(name.slice(9, -5))
        if (!Number.isNaN(ts)) {
          entries.push({ filename: name, timestamp: ts })
        }
      }
    }
    entries.sort((a, b) => b.timestamp - a.timestamp)
    return entries
  } catch {
    return []
  }
}

export async function restoreAutoSnapshot(
  rootHandle: FileSystemDirectoryHandle,
  filename: string,
): Promise<AutoBackupEntry | null> {
  try {
    const backupsDir = await rootHandle.getDirectoryHandle(BACKUPS_DIR)
    const autoDir = await backupsDir.getDirectoryHandle("auto")
    const raw = await getOrNull(autoDir, filename, readJSON<AutoBackupEntry>)
    if (!raw) return null
    const graph = migrateSnapshot(raw)
    return { ...raw, entities: graph.entities, relations: graph.relations, canvas: graph.canvas }
  } catch {
    return null
  }
}

export async function clearAutoSnapshots(
  rootHandle: FileSystemDirectoryHandle,
): Promise<void> {
  try {
    const backupsDir = await rootHandle.getDirectoryHandle(BACKUPS_DIR)
    const autoDir = await backupsDir.getDirectoryHandle("auto")
    const toDelete: string[] = []
    for await (const handle of autoDir.values()) {
      const name = handle.name
      if (name.startsWith("snapshot_") && name.endsWith(".json")) {
        toDelete.push(name)
      }
    }
    for (const name of toDelete) {
      try {
        await autoDir.removeEntry(name)
      } catch {
        // Already gone
      }
    }
  } catch {
    // No auto directory
  }
}
