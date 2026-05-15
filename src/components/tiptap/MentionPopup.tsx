import { useEffect, useState, useCallback, useRef } from "react"
import { FileText } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export interface MentionItem {
  id: string
  label: string
}

interface MentionPopupProps {
  items: MentionItem[]
  command: (item: MentionItem) => void
  onKeyDownRef: React.MutableRefObject<((event: KeyboardEvent) => boolean) | null>
}

export function MentionPopup({ items, command, onKeyDownRef }: MentionPopupProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, items.length - 1))
        return true
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return true
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault()
        if (items[selectedIndex]) {
          command(items[selectedIndex])
        }
        return true
      }
      if (event.key === "Escape") {
        event.preventDefault()
        return true
      }
      return false
    },
    [items, selectedIndex, command],
  )

  useEffect(() => {
    onKeyDownRef.current = handleKeyDown
    return () => {
      onKeyDownRef.current = null
    }
  }, [handleKeyDown, onKeyDownRef])

  return (
    <div className="overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
      <div ref={listRef} className="max-h-[200px] overflow-y-auto p-1">
        {items.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No matching containers
          </div>
        ) : (
          items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                command(item)
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden",
                "cursor-pointer select-none",
                i === selectedIndex
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <FileText className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
