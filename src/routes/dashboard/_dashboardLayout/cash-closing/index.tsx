import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

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
import { requirePermissions } from "@/features/auth/auth.functions";
import { CashClosingCreateDialog } from "@/features/cash-closing/components/CashClosingCreateDialog";
import { CashClosingTable } from "@/features/cash-closing/components/cash-closing-table/CashClosingTable";
import { head } from "@/lib/head";
import { querySearchSchema, rangeFilterSchema } from "@/lib/querySearchSchema";
import { orpcTQClient } from "@/server/orpc";
import { buildDateRangeFilter } from "@/utils/buildDateRangeFilter";

const searchFields = ["closedByName", "note"];

export const Route = createFileRoute(
  "/dashboard/_dashboardLayout/cash-closing/"
)({
  beforeLoad: ({ context }) => {
    requirePermissions(
      context.permissions,
      [
        { level: "system", resource: "report", action: "manage" },
        { level: "system", resource: "report", action: "list" },
      ],
      context.user.id
    );
  },
  validateSearch: querySearchSchema.extend(rangeFilterSchema.shape),
  loaderDeps: ({ search }) => search,
  head: ({ match }) =>
    head({
      pathname: match.pathname,
      titleByTemplate: "Cash Closings",
      description: "Review cash closings and drawer differences",
    }),
  loader: async ({ context: { queryClient }, deps }) => {
    await queryClient.query(
      orpcTQClient.cashClosing.list.queryOptions({
        input: {
          page: deps.page,
          limit: deps.limit,
          search: deps.search,
          searchFields,
          order: deps.order,
          orderField: deps.orderField,
          filter: {
            periodStart: buildDateRangeFilter(deps.startTime, deps.endTime),
          },
        },
      })
    );
  },
  pendingComponent: LoadingComponent,
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const { data, isLoading, isError, error } = useQuery(
    orpcTQClient.cashClosing.list.queryOptions({
      input: {
        page: search.page,
        limit: search.limit,
        search: search.search,
        searchFields,
        order: search.order,
        orderField: search.orderField,
        filter: {
          periodStart: buildDateRangeFilter(search.startTime, search.endTime),
        },
      },
      select: (result) => result.data,
    })
  );

  return (
    <DashboardShell
      header={
        <DashboardShellHeader>
          <DashboardShellTitle>Cash Closings</DashboardShellTitle>
          <DashboardShellDescription>
            Review cash closings and drawer differences
          </DashboardShellDescription>
        </DashboardShellHeader>
      }
    >
      <div className="space-y-3">
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
          <CashClosingCreateDialog />
        </div>
        <QueryStateBoundary
          isLoading={isLoading}
          isError={isError}
          error={error}
          data={data}
          isEmpty={() => false}
          loadingFallback={
            <DataTableSkeleton>
              <DataTableToolbarSkeleton />
            </DataTableSkeleton>
          }
          emptyFallback={<DataTableEmpty />}
        >
          {(cashClosingsData) => (
            <CashClosingTable
              data={cashClosingsData}
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
      <DataTableSkeleton>
        <DataTableToolbarSkeleton />
      </DataTableSkeleton>
    </DashboardShellSkeleton>
  );
}
