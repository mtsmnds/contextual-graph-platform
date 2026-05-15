import type { Entity, Relation } from "../../types/graph"

export type AdapterType = "indexeddb" | "fs-access"

export type WorkspaceSnapshot = {
  version: number
  entities: Entity[]
  relations: Relation[]
}

export interface PersistenceAdapter {
  readonly id: AdapterType
  loadWorkspace(): Promise<WorkspaceSnapshot | null>
  saveGraph(snapshot: WorkspaceSnapshot): Promise<void>
  loadDocument(id: string): Promise<Record<string, unknown> | null>
  saveDocument(id: string, data: Record<string, unknown>): Promise<void>
  deleteDocument(id: string): Promise<void>
  getFolderName(): string | null
}
