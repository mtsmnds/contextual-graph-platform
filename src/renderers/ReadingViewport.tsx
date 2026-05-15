import { useMemo } from "react";
import { useGraphStore } from "@/store/useGraphStore";
import {
  getEntity,
  getContainerChildren,
  getLinkedContext,
} from "@/engine/queries";
import { X, ChatCircleText, Link as LinkIcon } from "@phosphor-icons/react";
import type { Entity } from "@/types/graph";
import RichTextContent from "./RichTextContent";
import TiptapEditor from "./TiptapEditor";

function AnnotationCard({
  sourceTitle,
  context,
  onClose,
}: {
  sourceTitle: string;
  context: ReturnType<typeof getLinkedContext>[number];
  onClose: () => void;
}) {
  const isAnnotates = context.relation.type === "annotates";
  return (
    <div className="border-b pb-4 mb-4 last:border-b-0 last:mb-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isAnnotates ? "Annotation" : context.relation.type}
          </span>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            on <span className="font-medium text-foreground">{sourceTitle}</span>
          </p>
        </div>
        <button
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClose}
        >
          <X size={12} />
        </button>
      </div>
      <p className="text-sm font-medium text-foreground mt-2">
        {context.entity.title}
      </p>
      <RichTextContent className="text-xs text-muted-foreground leading-relaxed mt-1" content={context.entity.content ?? ""} />
    </div>
  );
}

function RelationSidebar() {
  const entities = useGraphStore((s) => s.entities);
  const relations = useGraphStore((s) => s.relations);
  const expandedPanels = useGraphStore((s) => s.view.expandedPanels);
  const closePanel = useGraphStore((s) => s.closePanel);

  const state = { entities, relations };

  const cards = useMemo(() => {
    return expandedPanels
      .map((id) => {
        const source = getEntity(state, id);
        if (!source) return null;
        const linked = getLinkedContext(state, id).filter(
          (c) => c.relation.type === "annotates" || c.relation.type === "references",
        );
        if (linked.length === 0) return null;
        return { sourceId: id, sourceTitle: source.title ?? id, linked };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [expandedPanels, entities, relations]);

  if (cards.length === 0) return null;

  return (
    <aside className="w-[360px] shrink-0 border-l overflow-y-auto px-5 py-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Annotations &amp; References
      </p>
      {cards.map((card) =>
        card.linked.map((ctx, i) => (
          <AnnotationCard
            key={card.sourceId + i}
            sourceTitle={card.sourceTitle}
            context={ctx}
            onClose={() => closePanel(card.sourceId)}
          />
        )),
      )}
    </aside>
  );
}

function SegmentCard({ entity }: { entity: Entity }) {
  const entities = useGraphStore((s) => s.entities);
  const relations = useGraphStore((s) => s.relations);
  const expandedPanels = useGraphStore((s) => s.view.expandedPanels);
  const expandPanel = useGraphStore((s) => s.expandPanel);
  const closePanel = useGraphStore((s) => s.closePanel);

  const state = { entities, relations };

  const linkedContext = getLinkedContext(state, entity.id).filter(
    (c) => c.relation.type === "annotates" || c.relation.type === "references",
  );
  const isExpanded = expandedPanels.includes(entity.id);
  const hasRelations = linkedContext.length > 0;

  const isWork = entity.metadata?.type === "work";
  const isAct = entity.metadata?.type === "act";
  const isScene = entity.metadata?.type === "scene";
  const isStageDirection = entity.metadata?.type === "stage-direction";
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
        <h3 className="text-lg font-medium text-foreground">{entity.title}</h3>
        {entity.content && (
          <RichTextContent className="text-sm text-muted-foreground mt-1" content={entity.content} />
        )}
      </div>
    );
  }

  if (isStageDirection) {
    return (
      <div className="py-2">
        <RichTextContent className="italic text-muted-foreground text-sm leading-relaxed" content={entity.content ?? ""} />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 group">
      <div className="flex-1 min-w-0">
        {hasCharacter ? (
          <div className="py-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {entity.metadata.character as string}
            </span>
            <RichTextContent className="mt-0.5 leading-relaxed text-foreground" content={entity.content ?? ""} />
          </div>
        ) : (
          <div className="py-2">
            {entity.title && (
              <p className="font-medium text-sm text-foreground">{entity.title}</p>
            )}
            {entity.content && (
              <RichTextContent className="leading-relaxed text-foreground" content={entity.content} />
            )}
          </div>
        )}
      </div>
      {hasRelations && (
        <button
          className="shrink-0 mt-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          onClick={() => (isExpanded ? closePanel(entity.id) : expandPanel(entity.id))}
          title={isExpanded ? "Hide relations" : "Show relations"}
        >
          {linkedContext.some((c) => c.relation.type === "references") ? (
            <LinkIcon size={16} />
          ) : (
            <ChatCircleText size={16} />
          )}
        </button>
      )}
    </div>
  );
}

function ReadingViewport() {
  const focusedId = useGraphStore((s) => s.view.focusedEntityId);
  const entities = useGraphStore((s) => s.entities);
  const relations = useGraphStore((s) => s.relations);

  const state = { entities, relations };

  const children = useMemo(() => {
    if (!focusedId) return [];
    return getContainerChildren(state, focusedId);
  }, [focusedId, entities, relations]);

  if (!focusedId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Entity not found.</p>
      </div>
    );
  }

  const rootEntity = getEntity(state, focusedId);

  const isContainer = rootEntity?.kind === "container";

  // Empty containers (Playground, Roadmap): full-width editor, no sidebar, no duplicate content
  if (isContainer && children.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <TiptapEditor
          key={rootEntity?.id ?? "new"}
          content={rootEntity?.content ?? ""}
          title={rootEntity?.title}
          onSave={(json) => {
            if (rootEntity) {
              useGraphStore.getState().updateEntity(rootEntity.id, { content: json })
            }
          }}
          onTitleChange={(val) => {
            if (rootEntity) {
              useGraphStore.getState().updateEntity(rootEntity.id, { title: val })
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <main className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-[720px]">
          {rootEntity && <SegmentCard key={rootEntity.id} entity={rootEntity} />}
          {children.map((child) => (
            <SegmentCard key={child.id} entity={child} />
          ))}
        </div>
      </main>
      <RelationSidebar />
    </div>
  );
}

export default ReadingViewport;
