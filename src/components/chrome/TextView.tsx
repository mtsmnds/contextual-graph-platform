import { useGraphStore } from "../../store/useGraphStore"
import EntityTreeNode from "./EntityTreeNode"

function TextView() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)

  const rootIds = entities
    .filter((e) => !relations.some((r) => r.type === "contains" && r.target === e.id))
    .map((e) => e.id)

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-2xl py-8 flex flex-col gap-6">
        {rootIds.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Text view — {entities.length} entities loaded
          </p>
        )}
        {rootIds.map((id) => (
          <EntityTreeNode key={id} entityId={id} />
        ))}
      </div>
    </div>
  )
}

export default TextView
