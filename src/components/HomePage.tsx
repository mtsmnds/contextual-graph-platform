import { useMemo } from "react"
import { useGraphStore } from "@/store/useGraphStore"
import { getRootContainers } from "@/engine/queries"
import { BookOpen, MapIcon, StickyNote, Plus } from "lucide-react"

export function HomePage() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)
  const focusEntity = useGraphStore((s) => s.focusEntity)
  const addEntity = useGraphStore((s) => s.addEntity)

  const rootContainers = useMemo(
    () => getRootContainers({ entities, relations }),
    [entities, relations],
  )

  const handleNewPage = () => {
    const id = addEntity("container", { content: "Untitled" })
    focusEntity(id)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">
            My Workspace
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Select a page to open it
          </p>

          {rootContainers.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-6">
              No pages yet. Create your first page to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {rootContainers.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => focusEntity(entity.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:bg-accent transition-colors text-left"
                >
                  {entity.metadata?.type === "work" ? (
                    <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                  ) : entity.metadata?.type === "roadmap" ? (
                    <MapIcon className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <StickyNote className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="font-medium truncate">
                    {entity.content || entity.id}
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleNewPage}
            className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-xl border border-dashed text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left"
          >
            <Plus className="size-4 shrink-0" />
            <span className="font-medium">New page</span>
          </button>
        </div>
      </div>

      <div className="flex items-center px-6 py-3 text-xs text-muted-foreground border-t">
        <span className="ml-auto">Auto-saved</span>
      </div>
    </div>
  )
}
