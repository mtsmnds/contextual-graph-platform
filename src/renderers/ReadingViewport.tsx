import { useMemo } from "react";
import { useGraphStore } from "@/store/useGraphStore";
import {
  getEntity,
  getContainerChildren,
  getContainerBreadcrumb,
  resolveContainer,
} from "@/engine/queries";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import type { Entity } from "@/types/graph";

function SegmentCard({ entity }: { entity: Entity }) {
  const isAct = entity.metadata?.type === "act";
  const isScene = entity.metadata?.type === "scene";
  const isStageDirection = entity.metadata?.type === "stage-direction";
  const hasCharacter = typeof entity.metadata?.character === "string";

  if (isAct) {
    return (
      <div className="pt-12 pb-6">
        <hr className="border-t mb-6" />
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {entity.title}
        </h2>
      </div>
    );
  }

  if (isScene) {
    return (
      <div className="pt-8 pb-4">
        <h3 className="text-lg font-medium text-foreground">
          {entity.title}
        </h3>
        {entity.content && (
          <p className="text-sm text-muted-foreground mt-1">{entity.content}</p>
        )}
      </div>
    );
  }

  if (isStageDirection) {
    return (
      <div className="py-2">
        <p className="italic text-muted-foreground text-sm leading-relaxed">
          {entity.content}
        </p>
      </div>
    );
  }

  if (hasCharacter) {
    return (
      <div className="py-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {entity.metadata.character as string}
        </span>
        <p className="mt-0.5 leading-relaxed text-foreground">
          {entity.content}
        </p>
      </div>
    );
  }

  if (entity.kind === "annotation") {
    return (
      <div className="py-2 pl-4 border-l-2 border-muted my-2">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          {entity.title}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {entity.content}
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {entity.title && (
        <p className="font-medium text-sm text-foreground">{entity.title}</p>
      )}
      {entity.content && (
        <p className="leading-relaxed text-foreground">{entity.content}</p>
      )}
    </div>
  );
}

function ReadingViewport() {
  const entityId = useGraphStore((s) => s.view.focusedEntityId);
  const entities = useGraphStore((s) => s.entities);
  const relations = useGraphStore((s) => s.relations);
  const focusEntity = useGraphStore((s) => s.focusEntity);

  const state = { entities, relations };

  const { children, breadcrumb, currentIndex, entity } =
    useMemo(() => {
      if (!entityId) {
        return {
          children: [],
          breadcrumb: [],
          currentIndex: -1,
          entity: null,
        };
      }
      const resolvedId = resolveContainer(state, entityId);
      const ent = getEntity(state, entityId);
      const kids = getContainerChildren(state, resolvedId);
      const crumbs = getContainerBreadcrumb(state, resolvedId);
      const idx = kids.findIndex((c) => c.id === entityId);
      return {
        children: kids,
        breadcrumb: crumbs,
        currentIndex: idx,
        entity: ent,
      };
    }, [entityId, entities, relations]);

  if (!entityId || !entity) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Entity not found.</p>
      </div>
    );
  }

  const prevSegment =
    currentIndex > 0 ? children[currentIndex - 1] : undefined;
  const nextSegment =
    currentIndex < children.length - 1 ? children[currentIndex + 1] : undefined;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b shrink-0 px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => focusEntity(null)}
          >
            <X size={16} />
          </Button>
          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
              {breadcrumb.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1.5 truncate">
                  {i > 0 && <span className="shrink-0">/</span>}
                  <button
                    className="truncate hover:text-foreground transition-colors"
                    onClick={() => focusEntity(crumb.id)}
                  >
                    {crumb.title}
                  </button>
                </span>
              ))}
            </nav>
          )}
        </div>
        {children.length > 1 && (
          <nav className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevSegment}
              onClick={() => prevSegment && focusEntity(prevSegment.id)}
            >
              <ArrowLeft size={14} /> Prev
            </Button>
            <span className="text-xs text-muted-foreground px-1 tabular-nums">
              {currentIndex + 1}/{children.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!nextSegment}
              onClick={() => nextSegment && focusEntity(nextSegment.id)}
            >
              Next <ArrowRight size={14} />
            </Button>
          </nav>
        )}
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-[720px]">
          {children.length > 0
            ? children.map((child) => (
                <SegmentCard key={child.id} entity={child} />
              ))
            : entity.content && (
                <div className="whitespace-pre-wrap leading-relaxed text-foreground pt-4">
                  {entity.content}
                </div>
              )}
        </div>
      </main>
    </div>
  );
}

export default ReadingViewport;
