import { useQuery } from "@tanstack/react-query";
import { HandCoins, ReceiptText, ShoppingCart } from "lucide-react";

import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Stat,
  StatIndicator,
  StatLabel,
  StatTrend,
  StatValue,
} from "@/components/ui/stat";
import { orpcTQClient } from "@/server/orpc";
import { buildDateRangeFilter } from "@/utils/buildDateRangeFilter";
import { formatCurrency } from "@/utils/formatCurrency";

interface PurchaseStatsProps {
  startTime?: string | null;
  endTime?: string | null;
}

export function PurchaseStats({ startTime, endTime }: PurchaseStatsProps) {
  const { data, isLoading, isError, error } = useQuery(
    orpcTQClient.purchase.stats.queryOptions({
      input: {
        filter: {
          createdAt: buildDateRangeFilter(startTime, endTime),
        },
      },
      select: (result) => result.data,
    })
  );

  return (
    <QueryStateBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      isEmpty={() => false}
      loadingFallback={
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      }
    >
      {(stats) => (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
          <Stat>
            <StatLabel>Total Purchased</StatLabel>
            <StatIndicator variant="icon" color="success">
              <ShoppingCart aria-hidden />
            </StatIndicator>
            <StatValue>{formatCurrency(stats.totalPurchased)}</StatValue>
            <StatTrend trend="neutral">in selected range</StatTrend>
          </Stat>
          <Stat>
            <StatLabel>Due Payment</StatLabel>
            <StatIndicator variant="icon" color="error">
              <HandCoins aria-hidden />
            </StatIndicator>
            <StatValue>{formatCurrency(stats.dueAmount)}</StatValue>
            <StatTrend trend="neutral">across all purchases</StatTrend>
          </Stat>
          <Stat>
            <StatLabel>Purchases</StatLabel>
            <StatIndicator variant="icon" color="info">
              <ReceiptText aria-hidden />
            </StatIndicator>
            <StatValue>{stats.purchaseCount}</StatValue>
            <StatTrend trend="neutral">in selected range</StatTrend>
          </Stat>
        </div>
      )}
    </QueryStateBoundary>
  );
}
