import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableGlobalSearch } from "@/components/data-table/data-table-global-search";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableToolbarSkeleton } from "@/components/data-table/data-table-toolbar-skeleton";
import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { usePermissionCheck } from "@/hooks/use-permission-check";
import { useQuerySearch } from "@/hooks/use-query-search";
import { orpcTQClient } from "@/server/orpc";

import { VendorCreateDialog } from "../VendorCreateDialog";
import { VendorTable } from "./VendorTable";

export function VendorManagementTable({
  searchFields,
}: {
  searchFields: string[];
}) {
  "use no memo";
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const { filters, setFilters, setSearchFilter } = useQuerySearch(
    "/dashboard/_dashboardLayout/vendors/"
  );

  const { data, isLoading, isError, error, refetch } = useQuery(
    orpcTQClient.vendor.list.queryOptions({
      input: {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        searchFields,
        order: filters.order,
        orderField: filters.orderField,
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
      resource: "vendor",
      action: "create",
    },
  ]);

  return (
    <>
      <div className="space-y-3">
        <DataTableGlobalSearch
          searchValue={filters.search}
          setSearchValue={globalSearch}
          refresh={refetch}
        >
          {isAllowCreate && (
            <Button onClick={() => setOpenCreateDialog(true)}>
              <Plus />
              <span>Create company</span>
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
          {(vendorsData) => (
            <VendorTable
              data={vendorsData}
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
        <VendorCreateDialog
          open={openCreateDialog}
          setOpen={setOpenCreateDialog}
        />
      )}
    </>
  );
}
