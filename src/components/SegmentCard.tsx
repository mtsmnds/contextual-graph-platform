import { type ComponentProps } from "react"
import { cn } from "@/lib/utils"

export type SegmentCardVariant = "bordered" | "none" | "hover"

export type SegmentCardProps = ComponentProps<"div"> & {
  width?: number | string
  variant?: SegmentCardVariant
}

const variantClass: Record<SegmentCardVariant, string> = {
  bordered: "border rounded-md bg-card text-card-foreground",
  none: "border-none bg-transparent",
  hover: "border border-transparent rounded-md bg-transparent transition-colors duration-150 ease-in-out hover:border-border hover:bg-card",
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
