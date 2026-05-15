import { useState, useMemo } from "react"
import { useGraphStore } from "@/store/useGraphStore"
import { getRootContainers } from "@/engine/queries"
import { FileText, Quotes, MagnifyingGlass, X } from "@phosphor-icons/react"

interface PassageLinkDialogProps {
  open: boolean
  sourceSegmentId: string
  onClose: () => void
}

export function PassageLinkDialog({ open, sourceSegmentId, onClose }: PassageLinkDialogProps) {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)
  const addRelation = useGraphStore((s) => s.addRelation)

  const [docSearch, setDocSearch] = useState("")
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [comment, setComment] = useState("")

  const rootContainers = useMemo(
    () => getRootContainers({ entities, relations }).filter((e) => e.id !== sourceSegmentId),
    [entities, relations, sourceSegmentId],
  )

  const filteredDocs = useMemo(
    () =>
      docSearch
        ? rootContainers.filter((e) => e.title?.toLowerCase().includes(docSearch.toLowerCase()))
        : rootContainers,
    [rootContainers, docSearch],
  )

  const containerPassages = useMemo(
    () =>
      selectedDocId
        ? entities.filter(
            (e) =>
              e.kind === "annotation" &&
              e.metadata?.sourceContainer === selectedDocId &&
              e.id !== sourceSegmentId,
          )
        : [],
    [entities, selectedDocId, sourceSegmentId],
  )

  const handleLink = (targetId: string) => {
    const meta = comment.trim() ? { comment: comment.trim() } : undefined
    addRelation(sourceSegmentId, targetId, "quote", meta)
    onClose()
  }

  const handleClose = () => {
    setSelectedDocId(null)
    setDocSearch("")
    setComment("")
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl border bg-background p-0 shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Link passage to…</h2>
          <button onClick={handleClose} className="rounded p-1 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {!selectedDocId ? (
          <div className="p-3">
            <div className="relative mb-2">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                className="w-full rounded-md border bg-background py-1.5 pl-8 pr-3 text-sm outline-hidden focus:border-ring"
                placeholder="Search documents…"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-[240px] space-y-0.5 overflow-y-auto">
              {filteredDocs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No documents found</p>
              ) : (
                filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                  >
                    <FileText size={16} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{doc.title ?? doc.id}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-3">
            <button
              onClick={() => {
                setSelectedDocId(null)
                setComment("")
              }}
              className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to documents
            </button>

            <div className="max-h-[200px] space-y-0.5 overflow-y-auto mb-3">
              {containerPassages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No passages in this document
                </p>
              ) : (
                containerPassages.map((psg) => {
                  const label = (psg.metadata?.label as string) ?? psg.id
                  return (
                    <button
                      key={psg.id}
                      onClick={() => handleLink(psg.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                    >
                      <Quotes size={16} className="shrink-0 text-muted-foreground" />
                      <span className="truncate">{label}</span>
                    </button>
                  )
                })
              )}
            </div>

            <div className="border-t pt-3">
              <textarea
                placeholder="Comment (optional)…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-md border bg-background p-2 text-xs outline-hidden focus:border-ring"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
