import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableGlobalSearch } from "@/components/data-table/data-table-global-search";
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
import { CashClosingTable } from "@/features/cash-closing/components/cash-closing-table/CashClosingTable";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useQuerySearch } from "@/hooks/use-query-search";
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
  const { filters, setFilters, setSearchFilter } = useQuerySearch(
    "/dashboard/_dashboardLayout/cash-closing/"
  );

  const globalSearch = useDebouncedCallback(
    (searchValue: string | undefined) => setSearchFilter(searchValue),
    500
  );

  const { data, isLoading, isError, error, refetch } = useQuery(
    orpcTQClient.cashClosing.list.queryOptions({
      input: {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        searchFields,
        order: filters.order,
        orderField: filters.orderField,
        filter: {
          periodStart: buildDateRangeFilter(filters.startTime, filters.endTime),
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
        <TimeRangeFilter
          rangeSearch={filters}
          setRangeSearch={({ range, startTime, endTime }) =>
            setFilters({
              range,
              startTime,
              endTime,
              page: 1,
            })
          }
        />
        <DataTableGlobalSearch
          searchValue={filters.search}
          setSearchValue={globalSearch}
          refresh={refetch}
        />
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
                page: filters.page,
                limit: filters.limit,
                search: filters.search,
                order: filters.order,
                orderField: filters.orderField,
              }}
              setFilters={(updatedFilters) => {
                setFilters({
                  page: updatedFilters.page,
                  limit: updatedFilters.limit,
                  order: updatedFilters.order,
                  orderField: updatedFilters.orderField,
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
