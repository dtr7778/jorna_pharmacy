import { useQuery } from "@tanstack/react-query";

import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { orpcTQClient } from "@/server/orpc";

export function VendorHeader({ vendorId }: { vendorId: string }) {
  const { data, isLoading, isError, error } = useQuery(
    orpcTQClient.vendor.details.queryOptions({
      input: { vendorId },
      select: (result) => result.data,
    })
  );

  return (
    <QueryStateBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={() => false}
      data={data}
      loadingFallback={<Skeleton className="h-8 w-64" />}
    >
      {(vendor) => (
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            {vendor.name}
          </h2>
          <Badge variant={vendor.isActive ? "default" : "secondary"}>
            {vendor.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      )}
    </QueryStateBoundary>
  );
}
