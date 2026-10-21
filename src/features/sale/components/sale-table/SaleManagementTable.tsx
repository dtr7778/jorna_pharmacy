import { useQuery } from "@tanstack/react-query";

import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableGlobalSearch } from "@/components/data-table/data-table-global-search";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableToolbarSkeleton } from "@/components/data-table/data-table-toolbar-skeleton";
import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { TimeRangeFilter } from "@/components/time-range-filter";
import { Toggle } from "@/components/ui/toggle";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useQuerySearch } from "@/hooks/use-query-search";
import { orpcTQClient } from "@/server/orpc";
import { buildDateRangeFilter } from "@/utils/buildDateRangeFilter";

import { SaleTable } from "./SaleTable";

export function SaleManagementTable({
  searchFields,
}: {
  searchFields: string[];
}) {
  "use no memo";
  const { filters, setFilters, setSearchFilter } = useQuerySearch(
    "/dashboard/_dashboardLayout/sales"
  );

  const { data, isLoading, isError, error, refetch } = useQuery(
    orpcTQClient.sale.list.queryOptions({
      input: {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        searchFields,
        order: filters.order,
        orderField: filters.orderField,
        unpaidOnly: filters.unpaidOnly,
        filter: {
          createdAt: buildDateRangeFilter(filters.startTime, filters.endTime),
        },
      },
      select: (result) => result.data,
    })
  );

  const globalSearch = useDebouncedCallback(
    (searchValue: string | undefined) => setSearchFilter(searchValue),
    500
  );

  return (
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
      >
        <Toggle
          variant="outline"
          pressed={!!filters.unpaidOnly}
          onPressedChange={(pressed) =>
            setFilters({ unpaidOnly: pressed ? true : undefined, page: 1 })
          }
        >
          Unpaid/Due
        </Toggle>
      </DataTableGlobalSearch>
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
        {(salesData) => (
          <SaleTable
            data={salesData}
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
  );
}
