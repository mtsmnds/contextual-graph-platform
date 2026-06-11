import { type ComponentProps } from "react"
import { cn } from "@/lib/utils"

export type SegmentCardVariant = "bordered" | "none" | "hover"

export type SegmentCardProps = ComponentProps<"div"> & {
  width?: number | string
  variant?: SegmentCardVariant
}

const variantClass: Record<SegmentCardVariant, string> = {
  bordered: "segment-card-bordered",
  none: "segment-card-none",
  hover: "segment-card-hover",
}

/**
 * Fixed-width content block with height determined by content.
 * No React Flow knowledge — usable inside canvas nodes and in other views
 * (reading view, accordions, sidebar).
 */
export function SegmentCard({ width, variant, className, style, children, ...props }: SegmentCardProps) {
  return (
    <div
      className={cn(variantClass[variant ?? "bordered"], "flex flex-col gap-y-2 p-3", className)}
      style={{ ...style, width }}
      {...props}
    >
      {children}
    </div>
  )
}
