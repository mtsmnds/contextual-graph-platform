import { type ComponentProps } from "react"
import { cn } from "@/lib/utils"

export type SegmentCardProps = ComponentProps<"div"> & {
  width?: number | string
}

/**
 * Fixed-width content block with height determined by content.
 * No React Flow knowledge — usable inside canvas nodes and in other views
 * (reading view, accordions, sidebar).
 */
export function SegmentCard({ width, className, style, children, ...props }: SegmentCardProps) {
  return (
    <div
      className={cn("segment-card flex flex-col gap-y-2 p-3", className)}
      style={{ ...style, width }}
      {...props}
    >
      {children}
    </div>
  )
}
