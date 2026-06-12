import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export type ContainerCardVariant = "bordered" | "none" | "hover"

export type ContainerCardProps = ComponentProps<"div"> & {
  width?: number | string
  variant?: ContainerCardVariant
  header?: React.ReactNode
}

const variantClass: Record<ContainerCardVariant, string> = {
  bordered: "border rounded-md bg-card text-card-foreground",
  none: "border-none bg-transparent",
  hover: "border border-transparent rounded-md bg-transparent transition-colors duration-150 ease-in-out hover:border-border hover:bg-card",
}

export function ContainerCard({
  width,
  variant = "bordered",
  header,
  className,
  style,
  children,
  ...props
}: ContainerCardProps) {
  return (
    <div
      className={cn(variantClass[variant], "flex flex-col overflow-hidden", className)}
      style={{ ...style, width }}
      {...props}
    >
      {header && (
        <div className="px-3 py-2" data-container-header>{header}</div>
      )}
      {children}
    </div>
  )
}
