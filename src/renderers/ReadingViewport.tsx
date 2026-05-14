import { useGraphStore } from "@/store/useGraphStore";
import { getEntity, getSequentialContext } from "@/engine/queries";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";

function ReadingViewport() {
  const entityId = useGraphStore((s) => s.view.focusedEntityId);
  const entities = useGraphStore((s) => s.entities);
  const relations = useGraphStore((s) => s.relations);
  const focusEntity = useGraphStore((s) => s.focusEntity);

  if (!entityId) return null;

  const state = { entities, relations };
  const entity = getEntity(state, entityId);
  const context = getSequentialContext(state, entityId);

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Entity not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b shrink-0 px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => focusEntity(null)}>
            <X size={16} />
          </Button>
          <span className="shrink-0 text-xs text-muted-foreground uppercase tracking-wider">
            {entity.kind}
          </span>
          <h1 className="truncate text-lg font-semibold text-foreground">
            {entity.title}
          </h1>
        </div>
        <nav className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={!context?.prev}
            onClick={() => context?.prev && focusEntity(context.prev.id)}
          >
            <ArrowLeft size={14} /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!context?.next}
            onClick={() => context?.next && focusEntity(context.next.id)}
          >
            Next <ArrowRight size={14} />
          </Button>
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-[720px] whitespace-pre-wrap leading-relaxed text-foreground">
          {entity.content}
        </div>
      </main>
    </div>
  );
}

export default ReadingViewport;
