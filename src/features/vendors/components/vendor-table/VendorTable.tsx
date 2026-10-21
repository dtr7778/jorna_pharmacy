import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { FiltersType } from "@/types/data-table";

import type { ListVendorContractType } from "../../api/vendor.contract";
import { vendorTableColumn } from "./vendorTableColumn";

interface VendorTableProps {
  data: ListVendorContractType["output"]["data"];
  filters: FiltersType;
  setFilters: (filters: Omit<FiltersType, "search">) => void;
}

export function VendorTable({ data, filters, setFilters }: VendorTableProps) {
  "use no memo";
  const table = useDataTable({
    data: data.data,
    columns: vendorTableColumn,
    pageCount: data.meta.pageCount,
    filters,
    setFilters,
    meta: {
      queryKeys: {
        searchText: filters.search ?? undefined,
      },
    },
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
