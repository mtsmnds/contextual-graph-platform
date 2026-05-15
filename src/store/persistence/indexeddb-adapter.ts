import Dexie, { type Table } from "dexie"
import type { PersistenceAdapter, WorkspaceSnapshot, AdapterType } from "./types"

type GraphRow = { key: string } & WorkspaceSnapshot
type DocumentRow = { key: string } & Record<string, unknown>

class WorkspaceDB extends Dexie {
  graph!: Table<GraphRow, string>
  documents!: Table<DocumentRow, string>

  constructor() {
    super("react-roadmap")
    this.version(1).stores({
      graph: "key",
      documents: "key",
    })
  }
}

const db = new WorkspaceDB()

export class IndexedDBAdapter implements PersistenceAdapter {
  readonly id: AdapterType = "indexeddb"

  async loadWorkspace(): Promise<WorkspaceSnapshot | null> {
    const row = await db.graph.get("workspace")
    if (!row) return null
    const { key: _, ...snapshot } = row
    return snapshot
  }

  async saveGraph(snapshot: WorkspaceSnapshot): Promise<void> {
    await db.graph.put({ key: "workspace", ...snapshot })
  }

  async loadDocument(id: string): Promise<Record<string, unknown> | null> {
    const row = await db.documents.get(id)
    if (!row) return null
    const { key: _, ...data } = row
    return data as Record<string, unknown>
  }

  async saveDocument(id: string, data: Record<string, unknown>): Promise<void> {
    await db.documents.put({ key: id, ...data })
  }

  async deleteDocument(id: string): Promise<void> {
    await db.documents.delete(id)
  }

  getFolderName(): string | null {
    return null
  }
}
