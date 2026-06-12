import { useGraphStore } from "../../store/useGraphStore"

function TextView() {
  const entities = useGraphStore((s) => s.entities)

  return (
    <div className="flex-1 p-8 overflow-auto">
      <p className="text-muted-foreground text-sm">
        Text view — {entities.length} entities loaded
      </p>
    </div>
  )
}

export default TextView
