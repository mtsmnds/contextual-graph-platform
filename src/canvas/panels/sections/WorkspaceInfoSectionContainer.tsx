import { useGraphStore } from "@/store/useGraphStore"
import WorkspaceInfoSection from "./WorkspaceInfoSection"

export default function WorkspaceInfoSectionContainer() {
  const folderName = useGraphStore((s) => s.folderName)
  const entityCount = useGraphStore((s) => s.entities.length)

  return (
    <WorkspaceInfoSection
      folderName={folderName}
      entityCount={entityCount}
    />)
}
