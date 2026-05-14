import { useMemo } from "react";
import { useGraphStore } from "@/store/useGraphStore";
import {
  getEntity,
  getContainerChildren,
  getContainerBreadcrumb,
  resolveContainer,
} from "@/engine/queries";
import { Button } from "@/components/ui/button";
import { X } from "@phosphor-icons/react";
import type { Entity } from "@/types/graph";

function SegmentCard({ entity }: { entity: Entity }) {
  const isWork = entity.metadata?.type === "work";
  const isAct = entity.metadata?.type === "act";
  const isScene = entity.metadata?.type === "scene";
  const isTitlePage = entity.metadata?.type === "title-page";
  const isStageDirection = entity.metadata?.type === "stage-direction";
  const isFrontMatter = entity.metadata?.type === "front-matter";
  const isEndMatter = entity.metadata?.type === "end-matter";
  const isDramatis = entity.metadata?.type === "dramatis-personae";
  const hasCharacter = typeof entity.metadata?.character === "string";

  if (isWork) {
    return (
      <div className="pt-12 pb-2">
        <hr className="border-t mb-6" />
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {entity.title}
        </h2>
      </div>
    );
  }

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

  if (isTitlePage) {
    return (
      <div className="pt-16 pb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {entity.title}
        </h1>
        {entity.content && (
          <p className="mt-2 text-lg text-muted-foreground">
            {entity.content}
          </p>
        )}
        <hr className="mt-8 border-t" />
      </div>
    );
  }

  if (isFrontMatter) {
    return (
      <div className="py-4">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {entity.title}
        </p>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          {entity.content?.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    );
  }

  if (isEndMatter) {
    return (
      <div className="py-6">
        <hr className="border-t mb-6" />
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {entity.title}
        </p>
        <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
          {entity.content?.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    );
  }

  if (isDramatis) {
    return (
      <div className="py-6">
        <h3 className="text-lg font-medium text-center text-foreground mb-4">
          {entity.title}
        </h3>
        <div className="text-sm text-foreground leading-relaxed text-center max-w-md mx-auto">
          {entity.content?.split("\n").map((line, i) => <p key={i}>{line}</p>)}
        </div>
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
  const focusedId = useGraphStore((s) => s.view.focusedEntityId);
  const anchorId = useGraphStore((s) => s.view.anchorEntityId);
  const entities = useGraphStore((s) => s.entities);
  const relations = useGraphStore((s) => s.relations);
  const focusEntity = useGraphStore((s) => s.focusEntity);

  const state = { entities, relations };

  const { children, breadcrumb } = useMemo(() => {
    if (!focusedId) return { children: [], breadcrumb: [] };
    const kids = getContainerChildren(state, focusedId);
    const crumbs = getContainerBreadcrumb(state, anchorId ?? focusedId);
    return { children: kids, breadcrumb: crumbs };
  }, [focusedId, anchorId, entities, relations]);

  if (!focusedId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Entity not found.</p>
      </div>
    );
  }

  const rootEntity = getEntity(state, focusedId);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b shrink-0 px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => focusEntity(null)}>
            <X size={16} />
          </Button>
          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
              {breadcrumb.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1.5 truncate">
                  {i > 0 && <span className="shrink-0">/</span>}
                  <button
                    className="truncate hover:text-foreground transition-colors"
                    onClick={() => {
                      const root = resolveContainer(state, crumb.id);
                      focusEntity(root, crumb.id);
                    }}
                  >
                    {crumb.title}
                  </button>
                </span>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-[720px]">
          {rootEntity && <SegmentCard key={rootEntity.id} entity={rootEntity} />}
          {children.length > 0 ? (
            children.map((child) => (
              <SegmentCard key={child.id} entity={child} />
            ))
          ) : (
            rootEntity?.content && (
              <div className="whitespace-pre-wrap leading-relaxed text-foreground pt-4">
                {rootEntity.content}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default ReadingViewport;
