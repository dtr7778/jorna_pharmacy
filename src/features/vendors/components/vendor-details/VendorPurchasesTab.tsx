import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { FormatDateCell } from "@/components/FormatDateCell";
import { MetaPagination } from "@/components/MetaPagination";
import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { ListVendorPurchasesContractType } from "@/features/purchase/api/purchase.contract";
import { orpcTQClient } from "@/server/orpc";
import { formatCurrency } from "@/utils/formatCurrency";

export function VendorPurchasesTab({ vendorId }: { vendorId: string }) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery(
    orpcTQClient.purchase.list.queryOptions({
      input: { vendorId, page, limit: DEFAULT_PAGE_SIZE },
      select: (result) => result.data,
    })
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchases</CardTitle>
        <CardDescription>All purchases made from this company</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <QueryStateBoundary
          isLoading={isLoading}
          isError={isError}
          error={error}
          data={data}
          isEmpty={() => false}
          loadingFallback={<HistorySkeleton />}
        >
          {({ data: purchases, meta }) => (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No purchases yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <PurchaseRow key={purchase.id} purchase={purchase} />
                    ))
                  )}
                </TableBody>
              </Table>
              <MetaPagination meta={meta} onPageChange={setPage} />
            </>
          )}
        </QueryStateBoundary>
      </CardContent>
    </Card>
  );
}

function PurchaseRow({
  purchase,
}: {
  purchase: ListVendorPurchasesContractType["output"]["data"]["data"][number];
}) {
  const due = purchase.totalAmount - purchase.paidAmount;

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">
        <FormatDateCell format="dd MMM, yyyy" value={purchase.createdAt} />
      </TableCell>
      <TableCell>
        {purchase.invoiceNo ? (
          <span className="font-medium">{purchase.invoiceNo}</span>
        ) : (
          <span className="text-muted-foreground">No invoice</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(purchase.totalAmount)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(purchase.paidAmount)}
      </TableCell>
      <TableCell
        className={
          due > 0
            ? "text-right font-medium text-destructive tabular-nums"
            : "text-right tabular-nums"
        }
      >
        {formatCurrency(Math.max(due, 0))}
      </TableCell>
      <TableCell>
        <PurchaseStatusBadge due={due} paidAmount={purchase.paidAmount} />
      </TableCell>
    </TableRow>
  );
}

function PurchaseStatusBadge({
  due,
  paidAmount,
}: {
  due: number;
  paidAmount: number;
}) {
  if (due <= 0) {
    return <Badge variant="default">Paid</Badge>;
  }
  if (paidAmount > 0) {
    return <Badge variant="secondary">Partially paid</Badge>;
  }
  return <Badge variant="destructive">Unpaid</Badge>;
}

function HistorySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}
