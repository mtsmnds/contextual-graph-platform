import { useEffect, useRef, useState } from "react"
import { X } from "@phosphor-icons/react"
import { useGraphStore } from "../../store/useGraphStore"
import { useChromeStore } from "../../store/useChromeStore"
import type { Relation } from "../../types/graph"
import EntityTreeNode from "./EntityTreeNode"
import WorkspaceTree from "./WorkspaceTree"

function findBookRoot(
  entityId: string,
  relations: Relation[],
  bookIds: Set<string>,
): string | null {
  let current: string | undefined = entityId
  for (let i = 0; i < 20; i++) {
    if (bookIds.has(current)) return current
    const parentRel = relations.find(
      (r) => r.target === current && r.type === "contains",
    )
    if (!parentRel) break
    current = parentRel.source
  }
  return null
}

function isDescendantOf(
  entityId: string,
  ancestorId: string,
  relations: Relation[],
): boolean {
  let current: string | undefined = entityId
  for (let i = 0; i < 20; i++) {
    if (current === ancestorId) return true
    const parentRel = relations.find(
      (r) => r.target === current && r.type === "contains",
    )
    if (!parentRel) break
    current = parentRel.source
  }
  return false
}

function getDomDepth(el: Element, attr: string): number {
  let depth = 0
  let parent = el.parentElement
  while (parent) {
    if (parent.hasAttribute(attr)) depth++
    parent = parent.parentElement
  }
  return depth
}

function ColumnView({ entityId }: { entityId: string }) {
  const columnRef = useRef<HTMLDivElement>(null)
  const [visibleContainerId, setVisibleContainerId] = useState<string | null>(null)
  const entities = useGraphStore((s) => s.entities)
  const entity = entities.find((e) => e.id === entityId)
  const visibleEntity = visibleContainerId
    ? entities.find((e) => e.id === visibleContainerId)
    : entity

  useEffect(() => {
    const columnEl = columnRef.current
    if (!columnEl) return

    const visibilityMap = new Map<Element, boolean>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibilityMap.set(entry.target, entry.isIntersecting)
        }
        let bestId: string | null = null
        let bestDepth = -1
        for (const [el, isVisible] of visibilityMap) {
          if (!isVisible) continue
          const depth = getDomDepth(el, "data-entity-container-id")
          if (depth > bestDepth) {
            bestDepth = depth
            bestId = el.getAttribute("data-entity-container-id")
          }
        }
        if (bestId) setVisibleContainerId(bestId)
      },
      { root: columnEl, threshold: 0 },
    )

    columnEl.querySelectorAll("[data-entity-container-id]").forEach((el) => observer.observe(el))

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            if (node.hasAttribute("data-entity-container-id")) {
              observer.observe(node)
            }
            node.querySelectorAll("[data-entity-container-id]").forEach((el) => observer.observe(el))
          }
        }
      }
    })

    mo.observe(columnEl, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mo.disconnect()
    }
  }, [])

  const handleClose = async () => {
    const store = useGraphStore.getState()
    const chrome = useChromeStore.getState()
    const currentRelations = store.relations
    const currentManifest = store.manifest

    let bookRoot: string | null = null
    if (currentManifest) {
      const bookIds = new Set(Object.keys(currentManifest.collections))
      bookRoot = findBookRoot(entityId, currentRelations, bookIds)
    }

    if (bookRoot && currentManifest) {
      const otherContainers = chrome.openContainers.filter(
        (id) => id !== entityId,
      )
      const isLastForBook = !otherContainers.some((id) =>
        isDescendantOf(id, bookRoot!, currentRelations),
      )

      if (isLastForBook) {
        if (store.isDirty()) {
          const shouldSave = window.confirm(
            "You have unsaved changes. Save before closing?",
          )
          if (!shouldSave) return
          await store.saveToDisk()
        }
        store.unloadBookContent(bookRoot)
      }
    }

    chrome.removeContainer(entityId)
  }

  return (
    <div
      ref={columnRef}
      className="w-[512px] min-w-[512px] h-full overflow-y-auto relative"
    >
      <div className="sticky top-0 z-10 bg-background border-b px-3 py-2 flex items-center gap-2 group">
        <span className="text-sm font-medium truncate flex-1">
          {visibleEntity?.content || entity?.content || entityId}
        </span>
        <button
          onClick={handleClose}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent text-muted-foreground"
          aria-label="Close column"
        >
          <X size={14} />
        </button>
      </div>
      <EntityTreeNode entityId={entityId} />
    </div>
  )
}

function TextView() {
  const openContainers = useChromeStore((s) => s.openContainers)

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex h-full gap-4 p-4">
        {openContainers.map((id) => (
          <ColumnView key={id} entityId={id} />
        ))}
        {openContainers.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No containers open — click a container in the tree
          </p>
        )}
        <div className="w-[512px] min-w-[512px] h-full overflow-y-auto">
          <WorkspaceTree />
        </div>
      </div>
    </div>
  )
}

export default TextView
