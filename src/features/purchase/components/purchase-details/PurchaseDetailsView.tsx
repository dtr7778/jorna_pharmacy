import { useQuery } from "@tanstack/react-query";

import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { orpcTQClient } from "@/server/orpc";

import { PurchaseDetailHeader } from "./PurchaseDetailHeader";
import { PurchaseInfoCard } from "./PurchaseInfoCard";
import { PurchaseItemsCard } from "./PurchaseItemsCard";
import { PurchasePaymentsCard } from "./PurchasePaymentsCard";
import { PurchaseSummaryStats } from "./PurchaseSummaryStats";

export function PurchaseDetailsView({ purchaseId }: { purchaseId: string }) {
  const { data, isLoading, isError, error } = useQuery(
    orpcTQClient.purchase.details.queryOptions({
      input: { purchaseId },
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
      loadingFallback={<PurchaseDetailsSkeleton />}
    >
      {(purchase) => (
        <div className="space-y-4 md:space-y-6">
          <PurchaseDetailHeader purchase={purchase} />
          <PurchaseSummaryStats purchase={purchase} />
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <PurchaseItemsCard purchase={purchase} />
            <div className="grid gap-4">
              <PurchasePaymentsCard
                vendorId={purchase.vendorId}
                purchaseId={purchase.id}
                payments={purchase.payments}
                paidAmount={purchase.paidAmount}
                dueAmount={purchase.summary.dueAmount}
              />
              <PurchaseInfoCard purchase={purchase} />
            </div>
          </div>
        </div>
      )}
    </QueryStateBoundary>
  );
}

export function PurchaseDetailsSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
