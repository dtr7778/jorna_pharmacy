import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { FiltersType } from "@/types/data-table";

import type { ListCashClosingContractType } from "../../api/cashClosing.contract";
import { cashClosingTableColumn } from "./cashClosingTableColumn";

interface CashClosingTableProps {
  data: ListCashClosingContractType["output"]["data"];
  filters: FiltersType;
  setFilters: (filters: Omit<FiltersType, "search">) => void;
}

export function CashClosingTable({
  data,
  filters,
  setFilters,
}: CashClosingTableProps) {
  "use no memo";
  const table = useDataTable({
    data: data.data,
    columns: cashClosingTableColumn,
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
