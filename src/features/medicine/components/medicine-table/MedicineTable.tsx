import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { FiltersType } from "@/types/data-table";

import type { ListMedicineContractType } from "../../api/medicine.contract";
import { medicineTableColumn } from "./medicineTableColumn";

interface MedicineTableProps {
  data: ListMedicineContractType["output"]["data"];
  filters: FiltersType;
  setFilters: (filters: Omit<FiltersType, "search">) => void;
}

export function MedicineTable({
  data,
  filters,
  setFilters,
}: MedicineTableProps) {
  "use no memo";
  const table = useDataTable({
    data: data.data,
    columns: medicineTableColumn,
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
