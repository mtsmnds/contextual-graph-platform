import { useState, useMemo, useRef, useEffect } from "react"
import { useGraphStore } from "@/store/useGraphStore"
import { getRootContainers } from "@/engine/queries"
import { FileTextIcon, QuotesIcon, MagnifyingGlassIcon, XIcon, LinkBreakIcon, TrashIcon } from "@phosphor-icons/react"

interface PassageLinkPopoverProps {
  segmentId: string
  anchorRect: { bottom: number; right: number; left: number } | null
  onClose: () => void
  onDeletePassage?: (segmentId: string) => void
}

export function PassageLinkPopover({ segmentId, anchorRect, onClose, onDeletePassage }: PassageLinkPopoverProps) {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)
  const addRelation = useGraphStore((s) => s.addRelation)

  const [step, setStep] = useState<"links" | "pick-doc" | "pick-passage">("links")
  const [docSearch, setDocSearch] = useState("")
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const popoverRef = useRef<HTMLDivElement>(null)

  const posY = anchorRect ? anchorRect.bottom + 24 : 24
  const popoverWidth = 320
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024
  const posX = anchorRect
    ? anchorRect.right + 24 + popoverWidth > viewportWidth
      ? Math.max(24, anchorRect.left - popoverWidth)
      : anchorRect.right + 24
    : 24

  // Existing links for this passage
  const existingLinks = useMemo(
    () =>
      relations
        .filter((r) => r.source === segmentId && r.type === "quote")
        .map((r) => {
          const target = entities.find((e) => e.id === r.target)
          return { relation: r, target }
        }),
    [relations, entities, segmentId],
  )

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  // Root containers
  const rootContainers = useMemo(
    () => getRootContainers({ entities, relations }),
    [entities, relations],
  )

  const filteredDocs = useMemo(
    () =>
      docSearch
        ? rootContainers.filter((e) => e.title?.toLowerCase().includes(docSearch.toLowerCase()))
        : rootContainers,
    [rootContainers, docSearch],
  )

  // Passages in selected document (exclude self and already-linked)
  const linkedTargetIds = useMemo(
    () => new Set(existingLinks.map((l) => l.relation.target)),
    [existingLinks],
  )

  const containerPassages = useMemo(
    () =>
      selectedDocId
        ? entities.filter(
            (e) =>
              e.kind === "annotation" &&
              !e.metadata?.stale &&
              e.metadata?.sourceContainer === selectedDocId &&
              e.id !== segmentId &&
              !linkedTargetIds.has(e.id),
          )
        : [],
    [entities, selectedDocId, segmentId, linkedTargetIds],
  )

  const handleLink = (targetId: string) => {
    const meta = comment.trim() ? { comment: comment.trim() } : undefined
    addRelation(segmentId, targetId, "quote", meta)
    setComment("")
    setStep("links")
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-80 rounded-lg border bg-popover text-popover-foreground shadow-md"
      style={{ top: posY, left: posX }}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {step === "links" && "Passage links"}
          {step === "pick-doc" && "Select document"}
          {step === "pick-passage" && "Select passage"}
        </span>
        <button onClick={onClose} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
          <XIcon size={14} />
        </button>
      </div>

      {step === "links" && (
        <div className="p-2">
          {existingLinks.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No links yet</p>
          ) : (
            <div className="mb-2 space-y-1">
              {existingLinks.map((link) => (
                <div
                  key={link.relation.id}
                  className="group flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5"
                >
                  <QuotesIcon size={14} className="shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs">
                    {String(link.target?.metadata?.label ?? link.target?.id ?? link.relation.target)}
                  </span>
                  {link.relation.metadata?.comment ? (
                    <span className="text-[10px] text-muted-foreground italic truncate max-w-[100px]">
                      {String(link.relation.metadata.comment)}
                    </span>
                  ) : null}
                  <button
                    onClick={() => useGraphStore.getState().removeRelation(link.relation.id)}
                    className="ml-auto shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    title="Remove link"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mb-2">
            <textarea
              placeholder="Comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-md border bg-background p-2 text-xs outline-hidden focus:border-ring"
            />
          </div>

          <button
            onClick={() => {
              setDocSearch("")
              setStep("pick-doc")
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
          >
            <LinkBreakIcon size={14} />
            <span>Link to another passage…</span>
          </button>

          <div className="mt-3 border-t pt-3">
            <button
              onClick={() => {
                onDeletePassage?.(segmentId)
                onClose()
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <TrashIcon size={14} />
              <span>Delete passage</span>
            </button>
          </div>
        </div>
      )}

      {step === "pick-doc" && (
        <div className="p-2">
          <div className="relative mb-2">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              className="w-full rounded-md border bg-background py-1.5 pl-7 pr-2 text-xs outline-hidden focus:border-ring"
              placeholder="Search documents…"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-[200px] space-y-0.5 overflow-y-auto">
            {filteredDocs.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No documents found</p>
            ) : (
              filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocId(doc.id)
                    setStep("pick-passage")
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  <FileTextIcon size={14} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{doc.title ?? doc.id}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {step === "pick-passage" && (
        <div className="p-2">
          <button
            onClick={() => {
              setSelectedDocId(null)
              setStep("pick-doc")
            }}
            className="mb-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <div className="max-h-[200px] space-y-0.5 overflow-y-auto">
            {containerPassages.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No passages to link</p>
            ) : (
              containerPassages.map((psg) => (
                <button
                  key={psg.id}
                  onClick={() => handleLink(psg.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  <QuotesIcon size={14} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">
                    {String(psg.metadata?.label ?? psg.id)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
