import { useId } from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

/**
 * A labeled toggle with optional description.
 * Label on the left, switch on the right.
 * Use for settings, feature flags, and preferences.
 */
function Switch({
  className,
  label,
  description,
  invalid,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  label: string
  description?: string
  invalid?: boolean
  size?: "sm" | "default"
}) {
  const id = useId()

  return (
    <label
      htmlFor={id}
      className={cn("flex items-start justify-between gap-3", className)}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className={cn(
            "text-xs text-muted-foreground",
            invalid && "text-destructive"
          )}>
            {description}
          </span>
        )}
      </div>
      <SwitchPrimitive.Root
        id={id}
        data-slot="switch"
        data-size={size}
        aria-invalid={invalid || undefined}
        className={cn(
          "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50"
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          style={{ width: size === "default" ? 16 : 12, height: size === "default" ? 16 : 12 }}
          className={cn(
            "pointer-events-none block rounded-full bg-background ring-0 transition-transform",
            "group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
          )}
        />
      </SwitchPrimitive.Root>
    </label>
  )
}

export { Switch }
