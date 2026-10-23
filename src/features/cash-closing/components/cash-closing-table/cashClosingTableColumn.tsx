import { cn } from "cn";

import { FormatDateCell } from "@/components/FormatDateCell";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ColumnType } from "@/types/data-table";
import { formatCurrency } from "@/utils/formatCurrency";

import type { ListCashClosingContractType } from "../../api/cashClosing.contract";

type CashClosingTableRowDataType =
  ListCashClosingContractType["output"]["data"]["data"][number];

function CurrencyCell({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  if (value == null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className={cn("tabular-nums", className)}>
      {formatCurrency(value)}
    </span>
  );
}

export const cashClosingTableColumn: ColumnType<CashClosingTableRowDataType> = [
  {
    id: "periodEnd",
    accessorKey: "periodEnd",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Time" />
    ),
    cell: ({ getValue }) => (
      <div className="flex flex-col">
        <FormatDateCell
          format="dd MMM, yyyy"
          value={getValue<CashClosingTableRowDataType["periodEnd"]>()}
          className="font-medium"
        />
      </div>
    ),
    meta: { label: "Time" },
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "totalSales",
    accessorKey: "totalSales",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Sales" />
    ),
    cell: ({ getValue }) => (
      <CurrencyCell
        value={getValue<CashClosingTableRowDataType["totalSales"]>()}
        className="font-medium"
      />
    ),
    meta: { label: "Sales" },
    enableSorting: false,
  },
  {
    id: "totalSalary",
    accessorKey: "totalSalary",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Salary" />
    ),
    cell: ({ getValue }) => (
      <CurrencyCell
        value={getValue<CashClosingTableRowDataType["totalSalary"]>()}
      />
    ),
    meta: { label: "Salary" },
    enableSorting: false,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Closed at" />
    ),
    cell: ({ getValue }) => (
      <FormatDateCell
        format="dd MMM, yyyy"
        value={getValue<CashClosingTableRowDataType["createdAt"]>()}
        className="text-muted-foreground"
      />
    ),
    meta: { label: "Closed at" },
    enableSorting: false,
  },
];
