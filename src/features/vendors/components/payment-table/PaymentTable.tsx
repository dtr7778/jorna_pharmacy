import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { FiltersType } from "@/types/data-table";

import type { ListVendorPaymentsContractType } from "../../api/vendorPyament.contract";
import { paymentTableColumn } from "./paymentTableColumn";

interface PaymentTableProps {
  data: ListVendorPaymentsContractType["output"]["data"];
  filters: FiltersType;
  setFilters: (filters: Omit<FiltersType, "search">) => void;
}

export function PaymentTable({ data, filters, setFilters }: PaymentTableProps) {
  "use no memo";
  const table = useDataTable({
    data: data.data,
    columns: paymentTableColumn,
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
