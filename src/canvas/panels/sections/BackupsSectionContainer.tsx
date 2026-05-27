import { useState, useEffect, useCallback } from "react"
import { useGraphStore } from "@/store/useGraphStore"
import {
  createManualBackup,
  listManualBackups,
  deleteManualBackup,
  restoreManualBackup,
  listAutoSnapshots,
  restoreAutoSnapshot,
  clearAutoSnapshots,
} from "@/engine/backup"
import BackupsSection from "./BackupsSection"

type ManualBackupInfo = { id: string; timestamp: number }
type AutoSnapshotInfo = { filename: string; timestamp: number }

export default function BackupsSectionContainer() {
  const [manualBackups, setManualBackups] = useState<ManualBackupInfo[]>([])
  const [autoSnapshots, setAutoSnapshots] = useState<AutoSnapshotInfo[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<{ type: "manual"; id: string } | { type: "auto"; filename: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ManualBackupInfo | null>(null)
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const entityCount = useGraphStore((s) => s.entities.length)
  const undoStack = useGraphStore((s) => s.undoStack)
  const folderName = useGraphStore((s) => s.folderName)
  const hasFileSystem = folderName !== null

  const getHandle = useCallback(() => {
    return useGraphStore.getState().getAdapterHandle()
  }, [])

  const loadManualBackups = useCallback(async () => {
    const handle = getHandle()
    if (!handle) return
    try {
      const list = await listManualBackups(handle)
      setManualBackups(list)
    } catch {
      setManualBackups([])
    }
  }, [getHandle])

  const loadAutoSnapshots = useCallback(async () => {
    const handle = getHandle()
    if (!handle) return
    try {
      const list = await listAutoSnapshots(handle)
      setAutoSnapshots(list)
    } catch {
      setAutoSnapshots([])
    }
  }, [getHandle])

  useEffect(() => {
    loadAutoSnapshots()
    if (hasFileSystem) loadManualBackups()
  }, [hasFileSystem, loadAutoSnapshots, loadManualBackups])

  const handleCreateBackup = useCallback(async () => {
    const handle = getHandle()
    if (!handle) return

    setIsCreating(true)
    setCreateError(null)

    try {
      const store = useGraphStore.getState()
      const containerEntities = store.entities.filter((e) => e.type === "container")
      const contentMap: Record<string, Record<string, unknown>> = {}
      for (const entity of containerEntities) {
        const doc = store.getContent(entity.id)
        if (doc) contentMap[entity.id] = doc
      }

      await createManualBackup(handle, store.entities, store.relations, store.canvas, contentMap)
      await loadManualBackups()
    } catch (err) {
      console.error("Failed to create backup:", err)
      setCreateError("Failed to create backup. Check permissions.")
    } finally {
      setIsCreating(false)
    }
  }, [getHandle, loadManualBackups])

  const handleRestoreClick = useCallback((target: { type: "manual"; id: string } | { type: "auto"; filename: string }) => {
    setRestoreTarget(target)
    setConfirmRestoreOpen(true)
  }, [])

  const handleConfirmRestore = useCallback(async () => {
    if (!restoreTarget) return
    const handle = getHandle()
    if (!handle) return

    try {
      let entities, relations, canvas, documents

      if (restoreTarget.type === "manual") {
        const result = await restoreManualBackup(handle, restoreTarget.id)
        if (!result) return
        entities = result.entities
        relations = result.relations
        canvas = result.canvas
        documents = result.documents
      } else {
        const result = await restoreAutoSnapshot(handle, restoreTarget.filename)
        if (!result) return
        entities = result.entities
        relations = result.relations
        canvas = result.canvas
        documents = result.documents
      }

      const store = useGraphStore.getState()
      store.loadContentDirect(documents)
      useGraphStore.setState({ entities, relations, canvas })
    } catch (err) {
      console.error("Failed to restore backup:", err)
    } finally {
      setConfirmRestoreOpen(false)
      setRestoreTarget(null)
    }
  }, [restoreTarget, getHandle])

  const handleCancelRestore = useCallback(() => {
    setConfirmRestoreOpen(false)
    setRestoreTarget(null)
  }, [])

  const handleDeleteClick = useCallback((backup: ManualBackupInfo) => {
    setDeleteTarget(backup)
    setConfirmDeleteOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    const handle = getHandle()
    if (!handle) return

    try {
      await deleteManualBackup(handle, deleteTarget.id)
      setManualBackups((prev) => prev.filter((b) => b.id !== deleteTarget.id))
    } catch (err) {
      console.error("Failed to delete backup:", err)
    } finally {
      setConfirmDeleteOpen(false)
      setDeleteTarget(null)
    }
  }, [deleteTarget, getHandle])

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteOpen(false)
    setDeleteTarget(null)
  }, [])

  const handleDismissAutoSnapshots = useCallback(async () => {
    const handle = getHandle()
    if (!handle) return
    try {
      await clearAutoSnapshots(handle)
      setAutoSnapshots([])
    } catch { }
  }, [getHandle])

  const recentSnapshots = undoStack.slice(-10).reverse()
  const isWorkspaceEmpty = entityCount === 0
  const hasAnyBackupContent = hasFileSystem && (manualBackups.length > 0 || recentSnapshots.length > 0 || autoSnapshots.length > 0)

  return (
    <BackupsSection
      manualBackups={manualBackups}
      autoSnapshots={autoSnapshots}
      recentSnapshots={recentSnapshots}
      isCreating={isCreating}
      createError={createError}
      isWorkspaceEmpty={isWorkspaceEmpty}
      hasFileSystem={hasFileSystem}
      hasAnyContent={hasAnyBackupContent}
      onCreateBackup={handleCreateBackup}
      onRestoreClick={handleRestoreClick}
      onDeleteClick={handleDeleteClick}
      onDismissAutoSnapshots={handleDismissAutoSnapshots}
      confirmRestoreOpen={confirmRestoreOpen}
      confirmDeleteOpen={confirmDeleteOpen}
      restoreTarget={restoreTarget}
      deleteTarget={deleteTarget}
      onConfirmRestore={handleConfirmRestore}
      onCancelRestore={handleCancelRestore}
      onConfirmDelete={handleConfirmDelete}
      onCancelDelete={handleCancelDelete}
    />
  )
}
