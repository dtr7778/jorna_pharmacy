import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import type { ListVendorPurchasesContractType } from "@/features/purchase/api/purchase.contract";
import { useDataTable } from "@/hooks/use-data-table";
import type { FiltersType } from "@/types/data-table";

import { purchaseTableColumn } from "./purchaseTableColumn";

interface PurchaseTableProps {
  data: ListVendorPurchasesContractType["output"]["data"];
  filters: FiltersType;
  setFilters: (filters: Omit<FiltersType, "search">) => void;
}

export function PurchaseTable({
  data,
  filters,
  setFilters,
}: PurchaseTableProps) {
  "use no memo";
  const table = useDataTable({
    data: data.data,
    columns: purchaseTableColumn,
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
