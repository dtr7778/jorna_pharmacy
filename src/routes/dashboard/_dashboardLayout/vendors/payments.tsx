import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { HandCoins, Plus, ReceiptText, Wallet } from "lucide-react";
import z from "zod";

import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableToolbarSkeleton } from "@/components/data-table/data-table-toolbar-skeleton";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import {
  DashboardShellDescription,
  DashboardShellHeader,
  DashboardShellTitle,
} from "@/components/shared/dashboard-shell/DashboardShellHeader";
import {
  DashboardShellDescriptionSkeleton,
  DashboardShellTitleSkeleton,
} from "@/components/shared/dashboard-shell/DashboardShellHeaderSkeleton";
import { DashboardShellSkeleton } from "@/components/shared/dashboard-shell/DashboardShellSkeleton";
import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { TimeRangeFilter } from "@/components/time-range-filter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Stat,
  StatIndicator,
  StatLabel,
  StatTrend,
  StatValue,
} from "@/components/ui/stat";
import { requirePermissions } from "@/features/auth/auth.functions";
import { VendorPaymentCreateDialog } from "@/features/vendors/components/VendorPaymentCreateDialog";
import { VendorSidebar } from "@/features/vendors/components/VendorSidebar";
import { PaymentTable } from "@/features/vendors/components/payment-table/PaymentTable";
import { usePermissionCheck } from "@/hooks/use-permission-check";
import { head } from "@/lib/head";
import { querySearchSchema, rangeFilterSchema } from "@/lib/querySearchSchema";
import { orpcTQClient } from "@/server/orpc";
import { buildDateRangeFilter } from "@/utils/buildDateRangeFilter";
import { formatCurrency } from "@/utils/formatCurrency";

const searchFields = ["invoiceNo"];

export const Route = createFileRoute(
  "/dashboard/_dashboardLayout/vendors/payments"
)({
  beforeLoad: ({ context }) => {
    requirePermissions(
      context.permissions,
      [
        { level: "system", resource: "vendor_payment", action: "manage" },
        { level: "system", resource: "vendor_payment", action: "list" },
      ],
      context.user.id
    );
  },
  validateSearch: querySearchSchema
    .extend(rangeFilterSchema.shape)
    .extend({ vendorId: z.uuid().optional() }),
  loaderDeps: ({ search }) => search,
  head: ({ match }) =>
    head({
      pathname: match.pathname,
      titleByTemplate: "Payments",
      description: "Manage your vendor payments",
    }),
  loader: async ({ context: { queryClient }, deps }) => {
    await queryClient.query(
      orpcTQClient.vendor.payment.list.queryOptions({
        input: {
          page: deps.page,
          limit: deps.limit,
          search: deps.search,
          searchFields,
          order: deps.order,
          orderField: deps.orderField,
          vendorId: deps.vendorId,
        },
      })
    );
    await queryClient.query(
      orpcTQClient.vendor.payment.stats.queryOptions({
        input: {
          vendorId: deps.vendorId,
          filter: {
            createdAt: buildDateRangeFilter(deps.startTime, deps.endTime),
          },
        },
      })
    );
  },
  pendingComponent: LoadingComponent,
  component: RouteComponent,
});

function RouteComponent() {
  "use no memo";
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const isAllowCreate = usePermissionCheck([
    {
      level: "system",
      resource: "vendor_payment",
      action: "create",
    },
  ]);

  const paymentQuery = useQuery(
    orpcTQClient.vendor.payment.list.queryOptions({
      input: {
        page: search.page,
        limit: search.limit,
        search: search.search,
        searchFields,
        order: search.order,
        orderField: search.orderField,
        vendorId: search.vendorId,
        filter: {
          createdAt: buildDateRangeFilter(search.startTime, search.endTime),
        },
      },
      select: (result) => result.data,
    })
  );
  const paymentStatsQuery = useQuery(
    orpcTQClient.vendor.payment.stats.queryOptions({
      input: {
        vendorId: search.vendorId,
        filter: {
          createdAt: buildDateRangeFilter(search.startTime, search.endTime),
        },
      },
      select: (result) => result.data,
    })
  );

  return (
    <DashboardShell
      header={
        <DashboardShellHeader>
          <DashboardShellTitle>Company Payment Management</DashboardShellTitle>
          <DashboardShellDescription>
            Manage your company payments
          </DashboardShellDescription>
        </DashboardShellHeader>
      }
    >
      <div className="grid gap-3 lg:grid-cols-3">
        <VendorSidebar
          value={search.vendorId}
          onSelect={(selectedVendorId) =>
            navigate({ search: { vendorId: selectedVendorId } })
          }
        />
        <div className="overflow-auto rounded-xl bg-popover p-4 text-popover-foreground lg:col-span-2">
          {search.vendorId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <TimeRangeFilter
                  rangeSearch={{
                    range: search.range,
                    startTime: search.startTime,
                    endTime: search.endTime,
                  }}
                  setRangeSearch={(updatedValue) =>
                    navigate({
                      search: {
                        ...(updatedValue.range && {
                          range: updatedValue.range,
                        }),
                        ...(updatedValue.startTime && {
                          startTime: updatedValue.startTime,
                        }),
                        ...(updatedValue.endTime && {
                          endTime: updatedValue.endTime,
                        }),
                      },
                    })
                  }
                />
                <div className="flex items-center gap-2">
                  {isAllowCreate && (
                    <>
                      <Button onClick={() => setOpenCreateDialog(true)}>
                        <Plus />
                        <span>Add Payment</span>
                      </Button>
                      <VendorPaymentCreateDialog
                        vendorId={search.vendorId}
                        open={openCreateDialog}
                        setOpen={setOpenCreateDialog}
                      />
                    </>
                  )}
                </div>
              </div>
              <QueryStateBoundary
                isLoading={paymentStatsQuery.isLoading}
                isError={paymentStatsQuery.isError}
                error={paymentStatsQuery.error}
                data={paymentStatsQuery.data}
                isEmpty={() => false}
                loadingFallback={
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-28 w-full" />
                    ))}
                  </div>
                }
              >
                {(stats) => (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                    <Stat>
                      <StatLabel>Total Paid</StatLabel>
                      <StatIndicator variant="icon" color="success">
                        <Wallet aria-hidden />
                      </StatIndicator>
                      <StatValue>{formatCurrency(stats.totalPaid)}</StatValue>
                      <StatTrend trend="neutral">in selected range</StatTrend>
                    </Stat>
                    <Stat>
                      <StatLabel>Due Payment</StatLabel>
                      <StatIndicator variant="icon" color="error">
                        <HandCoins aria-hidden />
                      </StatIndicator>
                      <StatValue>{formatCurrency(stats.dueAmount)}</StatValue>
                      <StatTrend trend="neutral">
                        across all purchases
                      </StatTrend>
                    </Stat>
                    <Stat>
                      <StatLabel>Payments</StatLabel>
                      <StatIndicator variant="icon" color="info">
                        <ReceiptText aria-hidden />
                      </StatIndicator>
                      <StatValue>{stats.paymentCount}</StatValue>
                      <StatTrend trend="neutral">in selected range</StatTrend>
                    </Stat>
                  </div>
                )}
              </QueryStateBoundary>
              <QueryStateBoundary
                isLoading={paymentQuery.isLoading}
                isError={paymentQuery.isError}
                error={paymentQuery.error}
                data={paymentQuery.data}
                isEmpty={() => false}
                loadingFallback={
                  <DataTableSkeleton>
                    <DataTableToolbarSkeleton />
                  </DataTableSkeleton>
                }
                emptyFallback={<DataTableEmpty />}
              >
                {(paymentsData) => (
                  <PaymentTable
                    data={paymentsData}
                    filters={{
                      page: search.page,
                      limit: search.limit,
                      search: search.search,
                      order: search.order,
                      orderField: search.orderField,
                    }}
                    setFilters={(updatedFilters) => {
                      navigate({
                        search: {
                          page: updatedFilters.page,
                          limit: updatedFilters.limit,
                          ...(updatedFilters.order && {
                            order: updatedFilters.order,
                          }),
                          ...(updatedFilters.orderField && {
                            orderField: updatedFilters.orderField,
                          }),
                        },
                      });
                    }}
                  />
                )}
              </QueryStateBoundary>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              First select a conmpany
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function LoadingComponent() {
  return (
    <DashboardShellSkeleton
      header={
        <DashboardShellHeader>
          <DashboardShellTitleSkeleton />
          <DashboardShellDescriptionSkeleton />
        </DashboardShellHeader>
      }
    >
      <div className="flex items-center justify-center p-2">
        <Spinner />
      </div>
    </DashboardShellSkeleton>
  );
}
