import { useGraphStore } from "../../store/useGraphStore"
import EntityTreeNode from "./EntityTreeNode"

function TextView() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)

  const rootIds = entities
    .filter((e) => !relations.some((r) => r.type === "contains" && r.target === e.id))
    .map((e) => e.id)

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex h-full gap-4 p-4">
        {rootIds.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Text view — {entities.length} entities loaded
          </p>
        )}
        {rootIds.map((id) => (
          <div key={id} className="w-[512px] min-w-[512px] h-full overflow-y-auto">
            <EntityTreeNode entityId={id} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default TextView
