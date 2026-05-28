import { CollapsibleSection } from "./CollapsibleSection"

export default function WorkspaceInfoSection({
  folderName,
  entityCount,
}: {
  folderName: string | null
  entityCount: number
}) {
  return (
    <CollapsibleSection title="Workspace Info">
      <div className="flex flex-col gap-2 pt-1">
        {folderName && (
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">Folder</span>
            <span className="text-xs font-medium truncate max-w-[140px]">{folderName}</span>
          </div>
        )}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">Entities</span>
          <span className="text-xs font-medium tabular-nums">{entityCount}</span>
        </div>
      </div>
    </CollapsibleSection>
  )
}
