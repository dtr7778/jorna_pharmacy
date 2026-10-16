import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

export function DashboardShellTitleSkeleton({
  className,
  ...props
}: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton className={cn("h-8 w-56 max-w-full", className)} {...props} />
  );
}

export function DashboardShellDescriptionSkeleton({
  className,
  ...props
}: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton className={cn("h-4 w-72 max-w-full", className)} {...props} />
  );
}
