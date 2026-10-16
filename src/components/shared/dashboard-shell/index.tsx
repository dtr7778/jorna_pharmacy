import { cn } from "@workspace/ui/lib/utils";

interface DashboardShellProps extends React.ComponentProps<"div"> {
  header?: React.ReactNode;
}

export function DashboardShell({
  children,
  className,
  header,
  ...props
}: DashboardShellProps) {
  return (
    <div
      className={cn("px-2 pt-2 pb-2 sm:px-4 sm:pt-3 sm:pb-4 w-full", className)}
      {...props}
    >
      <div className="space-y-4 md:space-y-6 max-w-7xl w-full mx-auto">
        {header && header}
        <div className="space-y-4 md:space-y-6">{children}</div>
      </div>
    </div>
  );
}
