import { useState, useEffect, useCallback } from "react"
import { Plus, ArrowCounterClockwise, Trash, Hourglass, WarningCircle, CaretDown } from "@phosphor-icons/react"
import { useGraphStore } from "@/store/useGraphStore"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import {
  createManualBackup,
  listManualBackups,
  deleteManualBackup,
  restoreManualBackup,
  listAutoSnapshots,
  restoreAutoSnapshot,
  clearAutoSnapshots,
} from "@/engine/backup"


type ManualBackupInfo = { id: string; timestamp: number }
type AutoSnapshotInfo = { filename: string; timestamp: number }

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

export default function BackupsSection() {
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
    <>
      <Collapsible defaultOpen>
        <SidebarGroup>
          <CollapsibleTrigger nativeButton={false} render={<SidebarGroupLabel />}>
            <CaretDown className="size-3 shrink-0" />
            <span>Backups</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <div className="flex flex-col gap-2 px-1 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleCreateBackup}
                  disabled={isCreating || isWorkspaceEmpty || !hasFileSystem}
                >
                  {isCreating ? (
                    <Hourglass className="size-4 animate-spin" />
                  ) : (
                    <Plus />
                  )}
                  {isCreating ? "Saving..." : isWorkspaceEmpty ? "Nothing to back up yet" : "Save checkpoint now"}
                </Button>

                {createError && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <WarningCircle className="size-3.5" />
                    {createError}
                  </div>
                )}

                {autoSnapshots.length > 0 && (
                  <div className="rounded-md bg-muted/50 p-2 text-xs">
                    <p className="text-muted-foreground mb-1.5">You have unsaved snapshots from your last session.</p>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        className="h-6 text-[11px]"
                        onClick={() => {
                          const latest = autoSnapshots[0]
                          if (latest) handleRestoreClick({ type: "auto", filename: latest.filename })
                        }}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="h-6 text-[11px]"
                        onClick={handleDismissAutoSnapshots}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                {manualBackups.length > 0 && (
                  <>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-0.5">Manual Saves</span>
                    <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
                      {manualBackups.map((backup) => (
                        <div key={backup.id} className="flex items-center justify-between gap-1 rounded-md px-1.5 py-0.5 hover:bg-sidebar-accent">
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {formatTimestamp(backup.timestamp)}
                          </span>
                          <div className="flex shrink-0">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Restore this backup"
                              onClick={() => handleRestoreClick({ type: "manual", id: backup.id })}
                            >
                              <ArrowCounterClockwise className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Delete backup"
                              onClick={() => handleDeleteClick(backup)}
                            >
                              <Trash className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {recentSnapshots.length > 0 && (
                  <>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-0.5">Recent Snapshots</span>
                    <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
                      {recentSnapshots.map((entry, idx) => (
                        <div key={`${entry.timestamp}-${idx}`} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-sidebar-accent">
                          <span className="text-xs truncate flex-1">
                            <span className="text-muted-foreground">{formatRelativeTime(entry.timestamp)}</span>
                            <span className="text-muted-foreground/70">&nbsp;&mdash;&nbsp;</span>
                            {entry.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {!hasAnyBackupContent && !isCreating && autoSnapshots.length === 0 && (
                  <div className="text-xs text-muted-foreground py-2 text-center">
                    No backups yet. Create one with the + button above.
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <Dialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Restore backup?</DialogTitle>
            <DialogDescription>
              Your current workspace will be replaced with the state from{" "}
              {restoreTarget?.type === "manual"
                ? formatTimestamp(Number(restoreTarget.id))
                : restoreTarget
                  ? formatTimestamp(restoreTarget.filename.startsWith("snapshot_")
                    ? Number(restoreTarget.filename.slice(9, -5))
                    : 0)
                  : "unknown time"}
              . This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleConfirmRestore}>Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete backup?</DialogTitle>
            <DialogDescription>
              The backup from{" "}
              {deleteTarget ? formatTimestamp(deleteTarget.timestamp) : "unknown time"} will be permanently deleted.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
