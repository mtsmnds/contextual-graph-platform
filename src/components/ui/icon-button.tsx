import { Button } from "@/components/ui/button"

export function IconButton({ variant = "outline", ...props }: Omit<React.ComponentProps<typeof Button>, 'size'>) {
  return <Button size="icon" variant={variant} {...props} />
}
