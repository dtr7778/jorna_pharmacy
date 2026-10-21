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
    id: "periodStart",
    accessorKey: "periodStart",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Period" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <FormatDateCell
          format="dd MMM, yyyy"
          value={row.original.periodStart}
          className="font-medium"
        />
        <span className="text-xs text-muted-foreground">
          to{" "}
          <FormatDateCell
            format="dd MMM, yyyy"
            value={row.original.periodEnd}
          />
        </span>
      </div>
    ),
    meta: { label: "Period", variant: "dateRange" },
    enableHiding: false,
  },
  {
    id: "closedByName",
    accessorKey: "closedByName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Closed by" />
    ),
    cell: ({ getValue }) => {
      const closedByName =
        getValue<CashClosingTableRowDataType["closedByName"]>();

      return closedByName ? (
        <span className="font-medium">{closedByName}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    meta: { label: "Closed by" },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "openingCash",
    accessorKey: "openingCash",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Opening" />
    ),
    cell: ({ getValue }) => (
      <CurrencyCell
        value={getValue<CashClosingTableRowDataType["openingCash"]>()}
      />
    ),
    meta: { label: "Opening", variant: "number" },
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
    meta: { label: "Sales", variant: "number" },
  },
  {
    id: "totalReturns",
    accessorKey: "totalReturns",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Returns" />
    ),
    cell: ({ getValue }) => (
      <CurrencyCell
        value={getValue<CashClosingTableRowDataType["totalReturns"]>()}
      />
    ),
    meta: { label: "Returns", variant: "number" },
  },
  {
    id: "cashReceived",
    accessorKey: "cashReceived",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Cash received" />
    ),
    cell: ({ getValue }) => (
      <CurrencyCell
        value={getValue<CashClosingTableRowDataType["cashReceived"]>()}
      />
    ),
    meta: { label: "Cash received", variant: "number" },
  },
  {
    id: "vendorPaid",
    accessorKey: "vendorPaid",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Vendor paid" />
    ),
    cell: ({ getValue }) => (
      <CurrencyCell
        value={getValue<CashClosingTableRowDataType["vendorPaid"]>()}
      />
    ),
    meta: { label: "Vendor paid", variant: "number" },
  },
  {
    id: "totalExpenses",
    accessorKey: "totalExpenses",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Expenses" />
    ),
    cell: ({ getValue }) => (
      <CurrencyCell
        value={getValue<CashClosingTableRowDataType["totalExpenses"]>()}
      />
    ),
    meta: { label: "Expenses", variant: "number" },
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
    meta: { label: "Salary", variant: "number" },
  },
  {
    id: "expectedCash",
    accessorKey: "expectedCash",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Expected" />
    ),
    cell: ({ getValue }) => (
      <CurrencyCell
        value={getValue<CashClosingTableRowDataType["expectedCash"]>()}
      />
    ),
    meta: { label: "Expected", variant: "number" },
  },
  {
    id: "countedCash",
    accessorKey: "countedCash",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Counted" />
    ),
    cell: ({ getValue }) => (
      <CurrencyCell
        value={getValue<CashClosingTableRowDataType["countedCash"]>()}
      />
    ),
    meta: { label: "Counted", variant: "number" },
  },
  {
    id: "difference",
    accessorKey: "difference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Difference" />
    ),
    cell: ({ getValue }) => {
      const difference = getValue<CashClosingTableRowDataType["difference"]>();

      return (
        <CurrencyCell
          value={difference}
          className={cn(
            "font-medium",
            difference != null && difference < 0 && "text-destructive"
          )}
        />
      );
    },
    meta: { label: "Difference", variant: "number" },
  },
  {
    id: "note",
    accessorKey: "note",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Note" />
    ),
    cell: ({ getValue }) => {
      const note = getValue<CashClosingTableRowDataType["note"]>();

      return note ? (
        <span className="line-clamp-1 max-w-xs" title={note}>
          {note}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    meta: { label: "Note" },
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
    meta: { label: "Closed at", variant: "date" },
  },
];
