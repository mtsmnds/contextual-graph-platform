import { useGraphStore } from "@/store/useGraphStore"
import SelectionMetadataSection from "./SelectionMetadataSection"

export default function SelectionMetadataSectionContainer() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const entities = useGraphStore((s) => s.entities)
  const updateEntity = useGraphStore((s) => s.updateEntity)

  const entity = selectedNodeId ? entities.find((e) => e.id === selectedNodeId) ?? null : null

  return (
    <SelectionMetadataSection
      entity={entity}
      onUpdateEntity={updateEntity}
    />
  )
}
