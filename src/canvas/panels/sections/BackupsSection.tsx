import { Plus, ArrowCounterClockwise, Trash, Hourglass, WarningCircle, CaretDown } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"

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

type ManualBackupInfo = { id: string; timestamp: number }
type AutoSnapshotInfo = { filename: string; timestamp: number }
type RestoreTarget = { type: "manual"; id: string } | { type: "auto"; filename: string }

export default function BackupsSection({
  manualBackups,
  autoSnapshots,
  recentSnapshots,
  isCreating,
  createError,
  isWorkspaceEmpty,
  hasFileSystem,
  hasAnyContent,
  onCreateBackup,
  onRestoreClick,
  onDeleteClick,
  onDismissAutoSnapshots,
  confirmRestoreOpen,
  confirmDeleteOpen,
  restoreTarget,
  deleteTarget,
  onConfirmRestore,
  onCancelRestore,
  onConfirmDelete,
  onCancelDelete,
}: {
  manualBackups: ManualBackupInfo[]
  autoSnapshots: AutoSnapshotInfo[]
  recentSnapshots: Array<{ description: string; timestamp: number }>
  isCreating: boolean
  createError: string | null
  isWorkspaceEmpty: boolean
  hasFileSystem: boolean
  hasAnyContent: boolean
  onCreateBackup: () => void
  onRestoreClick: (target: RestoreTarget) => void
  onDeleteClick: (backup: ManualBackupInfo) => void
  onDismissAutoSnapshots: () => void
  confirmRestoreOpen: boolean
  confirmDeleteOpen: boolean
  restoreTarget: RestoreTarget | null
  deleteTarget: ManualBackupInfo | null
  onConfirmRestore: () => void
  onCancelRestore: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}) {
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
                  onClick={onCreateBackup}
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
                          if (latest) onRestoreClick({ type: "auto", filename: latest.filename })
                        }}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="h-6 text-[11px]"
                        onClick={onDismissAutoSnapshots}
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
                              onClick={() => onRestoreClick({ type: "manual", id: backup.id })}
                            >
                              <ArrowCounterClockwise className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Delete backup"
                              onClick={() => onDeleteClick(backup)}
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

                {!hasAnyContent && !isCreating && autoSnapshots.length === 0 && (
                  <div className="text-xs text-muted-foreground py-2 text-center">
                    No backups yet. Create one with the + button above.
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <Dialog open={confirmRestoreOpen} onOpenChange={(open) => { if (!open) onCancelRestore() }}>
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
            <Button onClick={onConfirmRestore}>Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={(open) => { if (!open) onCancelDelete() }}>
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
            <Button variant="destructive" onClick={onConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
