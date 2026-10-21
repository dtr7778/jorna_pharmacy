import { Link } from "@tanstack/react-router";

import { FormatDateCell } from "@/components/FormatDateCell";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ListVendorPurchasesContractType } from "@/features/purchase/api/purchase.contract";
import { PurchaseStatusBadge } from "@/features/purchase/components/PurchaseStatusBadge";
import type { ColumnType } from "@/types/data-table";
import { formatCurrency } from "@/utils/formatCurrency";

import { PurchaseTableRowAction } from "./PurchaseTableRowAction";

type PurchaseTableRowDataType =
  ListVendorPurchasesContractType["output"]["data"]["data"][number];

export const purchaseTableColumn: ColumnType<PurchaseTableRowDataType> = [
  {
    id: "invoiceNo",
    accessorKey: "invoiceNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Invoice" />
    ),
    cell: ({ row, getValue }) => (
      <div className="flex flex-col">
        <Link
          to="/dashboard/purchases/$purchaseId"
          params={{ purchaseId: row.original.id }}
          className="link font-medium"
        >
          {getValue<PurchaseTableRowDataType["invoiceNo"]>()}
        </Link>
        {row.original.vendorInvoiceNo && (
          <span className="text-xs text-muted-foreground">
            {`Ref: ${row.original.vendorInvoiceNo}`}
          </span>
        )}
      </div>
    ),
    meta: { label: "Invoice" },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "vendorName",
    accessorKey: "vendorName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Vendor" />
    ),
    cell: ({ row, getValue }) => (
      <Link
        to="/dashboard/vendors/$vendorId"
        params={{ vendorId: row.original.vendorId }}
        search={{ tab: "purchase" }}
        className="link font-medium"
      >
        {getValue<PurchaseTableRowDataType["vendorName"]>()}
      </Link>
    ),
    meta: { label: "Vendor" },
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
        {formatCurrency(getValue<PurchaseTableRowDataType["totalAmount"]>())}
      </span>
    ),
    meta: { label: "Total", variant: "number" },
    enableSorting: false,
  },
  {
    id: "paidAmount",
    accessorKey: "paidAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Paid" />
    ),
    cell: ({ getValue }) => (
      <span className="tabular-nums">
        {formatCurrency(getValue<PurchaseTableRowDataType["paidAmount"]>())}
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
      <PurchaseStatusBadge
        due={row.original.totalAmount - row.original.paidAmount}
        paidAmount={row.original.paidAmount}
      />
    ),
    meta: { label: "Status" },
    enableSorting: false,
  },
  {
    id: "note",
    accessorKey: "note",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Note" />
    ),
    cell: ({ getValue }) => {
      const note = getValue<PurchaseTableRowDataType["note"]>();
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
      <DataTableColumnHeader column={column} label="Date" />
    ),
    cell: ({ getValue }) => (
      <FormatDateCell
        format="dd MMM, yyyy"
        value={getValue<PurchaseTableRowDataType["createdAt"]>()}
        className="text-muted-foreground"
      />
    ),
    meta: { label: "Date" },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <PurchaseTableRowAction purchaseData={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
