import { useGraphStore } from "@/store/useGraphStore"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar"
import { ArrowUUpLeft, ArrowUUpRight, CaretDown } from "@phosphor-icons/react"

export default function WorkspaceInfoSection({ viewport }: { viewport?: { x: number; y: number; zoom: number } }) {
  const folderName = useGraphStore((s) => s.folderName)
  const entityCount = useGraphStore((s) => s.entities.length)
  const undoStack = useGraphStore((s) => s.undoStack)
  const redoStack = useGraphStore((s) => s.redoStack)
  const undo = useGraphStore((s) => s.undo)
  const redo = useGraphStore((s) => s.redo)

  const undoDescription = undoStack.length > 0 ? `Undo ${undoStack[undoStack.length - 1].description}` : undefined
  const redoDescription = redoStack.length > 0 ? `Redo ${redoStack[redoStack.length - 1].description}` : undefined

  return (
    <Collapsible>
      <SidebarGroup>
        <CollapsibleTrigger nativeButton={false} render={<SidebarGroupLabel />}>
          <CaretDown className="size-3 shrink-0" />
          <span>Workspace Info</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <div className="flex flex-col gap-2 px-1 pt-1">
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
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-muted-foreground">Undo/Redo</span>
              </div>
              <div className="flex items-center gap-2 px-2 pb-1">
                <ButtonGroup>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Undo"
                    title={undoDescription}
                    disabled={undoStack.length === 0}
                    onClick={undo}
                  >
                    <ArrowUUpLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Redo"
                    title={redoDescription}
                    disabled={redoStack.length === 0}
                    onClick={redo}
                  >
                    <ArrowUUpRight />
                  </Button>
                </ButtonGroup>
              </div>
              {viewport && (
                <div className="flex items-center gap-1.5 px-2 pb-1">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    x: {viewport.x.toFixed(1)} y: {viewport.y.toFixed(1)} z: {Math.round(viewport.zoom * 100)}%
                  </span>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
