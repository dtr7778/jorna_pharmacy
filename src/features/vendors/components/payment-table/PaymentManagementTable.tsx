import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableGlobalSearch } from "@/components/data-table/data-table-global-search";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableToolbarSkeleton } from "@/components/data-table/data-table-toolbar-skeleton";
import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { TimeRangeFilter } from "@/components/time-range-filter";
import { Button } from "@/components/ui/button";
import { VendorPaymentCreateDialog } from "@/features/vendors/components/VendorPaymentCreateDialog";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { usePermissionCheck } from "@/hooks/use-permission-check";
import { useQuerySearch } from "@/hooks/use-query-search";
import { orpcTQClient } from "@/server/orpc";
import { buildDateRangeFilter } from "@/utils/buildDateRangeFilter";

import { PaymentStats } from "./PaymentStats";
import { PaymentTable } from "./PaymentTable";

export function PaymentManagementTable({
  searchFields,
}: {
  searchFields: string[];
}) {
  "use no memo";
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const { filters, setFilters, setSearchFilter } = useQuerySearch(
    "/dashboard/_dashboardLayout/payments"
  );

  const { data, isLoading, isError, error, refetch } = useQuery(
    orpcTQClient.vendor.payment.list.queryOptions({
      input: {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        searchFields,
        order: filters.order,
        orderField: filters.orderField,
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

  const isAllowCreate = usePermissionCheck([
    {
      level: "system",
      resource: "vendor_payment",
      action: "create",
    },
  ]);

  return (
    <>
      <div className="space-y-3">
        <TimeRangeFilter
          rangeSearch={filters}
          setRangeSearch={({ range, startTime, endTime }) =>
            setFilters({
              range,
              startTime,
              endTime,
            })
          }
        />
        <PaymentStats startTime={filters.startTime} endTime={filters.endTime} />
        <DataTableGlobalSearch
          searchValue={filters.search}
          setSearchValue={globalSearch}
          refresh={refetch}
        >
          {isAllowCreate && (
            <Button onClick={() => setOpenCreateDialog(true)}>
              <Plus />
              <span>Record payment</span>
            </Button>
          )}
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
          {(paymentsData) => (
            <PaymentTable
              data={paymentsData}
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

      {isAllowCreate && (
        <VendorPaymentCreateDialog
          open={openCreateDialog}
          setOpen={setOpenCreateDialog}
        />
      )}
    </>
  );
}
