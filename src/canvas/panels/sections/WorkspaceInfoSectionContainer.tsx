import { useGraphStore } from "@/store/useGraphStore"
import WorkspaceInfoSection from "./WorkspaceInfoSection"

export default function WorkspaceInfoSectionContainer({ viewport }: { viewport?: { x: number; y: number; zoom: number } }) {
  const folderName = useGraphStore((s) => s.folderName)
  const entityCount = useGraphStore((s) => s.entities.length)
  const undoStack = useGraphStore((s) => s.undoStack)
  const redoStack = useGraphStore((s) => s.redoStack)
  const onUndo = useGraphStore((s) => s.undo)
  const onRedo = useGraphStore((s) => s.redo)

  return (
    <WorkspaceInfoSection
      folderName={folderName}
      entityCount={entityCount}
      undoStack={undoStack}
      redoStack={redoStack}
      onUndo={onUndo}
      onRedo={onRedo}
      viewport={viewport}
    />
  )
}
