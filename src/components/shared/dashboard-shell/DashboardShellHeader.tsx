import { cn } from "@workspace/ui/lib/utils";

export function DashboardShellHeader({
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <div className={cn("leading-normal space-y-1", className)} {...props} />
  );
}

export function DashboardShellTitle({
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1 className={cn("text-lg md:text-3xl font-bold", className)} {...props} />
  );
}

export function DashboardShellDescription({
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
}
