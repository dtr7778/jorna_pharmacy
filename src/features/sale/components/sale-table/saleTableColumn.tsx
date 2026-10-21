import { FormatDateCell } from "@/components/FormatDateCell";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ColumnType } from "@/types/data-table";
import { formatCurrency } from "@/utils/formatCurrency";

import type { ListSaleContractType } from "../../api/sale.contract";
import { SaleStatusBadge } from "../SaleStatusBadge";

type SaleTableRowDataType =
  ListSaleContractType["output"]["data"]["data"][number];

export const saleTableColumn: ColumnType<SaleTableRowDataType> = [
  {
    id: "invoiceNo",
    accessorKey: "invoiceNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Invoice" />
    ),
    cell: ({ row, getValue }) => {
      const itemCount = row.original.itemCount;

      return (
        <div className="flex flex-col">
          <span className="font-medium tabular-nums">
            {getValue<SaleTableRowDataType["invoiceNo"]>()}
          </span>
          <span className="text-xs text-muted-foreground">
            {itemCount === 1 ? "1 item" : `${itemCount} items`}
          </span>
        </div>
      );
    },
    meta: { label: "Invoice" },
    enableHiding: false,
  },
  {
    id: "customerName",
    accessorKey: "customerName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Customer" />
    ),
    cell: ({ getValue }) => {
      const customerName = getValue<SaleTableRowDataType["customerName"]>();

      return customerName ? (
        <span className="font-medium">{customerName}</span>
      ) : (
        <span className="text-muted-foreground">Walk-in</span>
      );
    },
    meta: { label: "Customer" },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "totalAmount",
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Total" />
    ),
    cell: ({ getValue }) => (
      <span className="font-medium tabular-nums">
        {formatCurrency(getValue<SaleTableRowDataType["totalAmount"]>())}
      </span>
    ),
    meta: { label: "Total", variant: "number" },
  },
  {
    id: "paidAmount",
    accessorKey: "paidAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Paid" />
    ),
    cell: ({ getValue }) => (
      <span className="tabular-nums">
        {formatCurrency(getValue<SaleTableRowDataType["paidAmount"]>())}
      </span>
    ),
    meta: { label: "Paid", variant: "number" },
    enableSorting: false,
  },
  {
    id: "due",
    accessorFn: (row) => Math.max(row.totalAmount - row.paidAmount, 0),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Due" />
    ),
    cell: ({ getValue }) => {
      const due = getValue<number>();

      return (
        <span
          className={
            due > 0
              ? "font-medium text-destructive tabular-nums"
              : "text-muted-foreground tabular-nums"
          }
        >
          {formatCurrency(due)}
        </span>
      );
    },
    meta: { label: "Due", variant: "number" },
    enableSorting: false,
  },
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Status" />
    ),
    cell: ({ row }) => (
      <SaleStatusBadge
        due={row.original.totalAmount - row.original.paidAmount}
        paidAmount={row.original.paidAmount}
      />
    ),
    meta: { label: "Status" },
    enableSorting: false,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Date" />
    ),
    cell: ({ getValue }) => (
      <FormatDateCell
        format="dd MMM, yyyy"
        value={getValue<SaleTableRowDataType["createdAt"]>()}
        className="text-muted-foreground"
      />
    ),
    meta: { label: "Date" },
  },
];
