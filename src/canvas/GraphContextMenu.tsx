import { useEffect, useRef } from "react"

interface MenuItem {
  label: string
  action: () => void
  separator?: boolean
  disabled?: boolean
}

interface GraphContextMenuProps {
  open: boolean
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

function GraphContextMenu({ open, x, y, items, onClose }: GraphContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    setTimeout(() => document.addEventListener("click", handleClick), 0)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("click", handleClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-32 bg-popover text-popover-foreground border rounded-md shadow-xl py-1"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.separator && <div className="border-t my-1" />}
          <button
            disabled={item.disabled}
            className={`w-full text-left px-3 py-1.5 text-sm ${
              item.disabled
                ? "text-muted-foreground cursor-not-allowed"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
            onClick={() => { if (!item.disabled) { item.action(); onClose() } }}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}

export default GraphContextMenu
