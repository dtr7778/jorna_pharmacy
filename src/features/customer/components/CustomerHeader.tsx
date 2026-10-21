import { useQuery } from "@tanstack/react-query";

import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { orpcTQClient } from "@/server/orpc";

export function CustomerHeader({ customerId }: { customerId: string }) {
  const { data, isLoading, isError, error } = useQuery(
    orpcTQClient.customer.details.queryOptions({
      input: { customerId },
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
      {(customer) => (
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            {customer.name}
          </h2>
          <Badge variant={customer.isActive ? "default" : "secondary"}>
            {customer.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      )}
    </QueryStateBoundary>
  );
}
