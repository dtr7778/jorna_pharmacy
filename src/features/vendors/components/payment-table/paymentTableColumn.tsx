import { Link } from "@tanstack/react-router";

import { FormatDateCell } from "@/components/FormatDateCell";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ColumnType } from "@/types/data-table";
import { formatCurrency } from "@/utils/formatCurrency";

import type { ListVendorPaymentsContractType } from "../../api/vendorPyament.contract";
import { PaymentTableRowAction } from "./PaymentTableRowAction";

type PaymentTableRowDataType =
  ListVendorPaymentsContractType["output"]["data"]["data"][number];

export const paymentTableColumn: ColumnType<PaymentTableRowDataType> = [
  {
    id: "invoiceNo",
    accessorKey: "invoiceNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Invoice" />
    ),
    cell: ({ row, getValue }) => {
      const invoiceNo = getValue<PaymentTableRowDataType["invoiceNo"]>();

      if (invoiceNo) {
        return <span className="font-medium">{invoiceNo}</span>;
      }

      return (
        <span className="text-muted-foreground">
          {row.original.purchaseId
            ? "Purchase without invoice"
            : "General payment"}
        </span>
      );
    },
    meta: { label: "Invoice" },
    enableSorting: false,
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
        search={{ tab: "payment" }}
        className="link font-medium"
      >
        {getValue<PaymentTableRowDataType["vendorName"]>()}
      </Link>
    ),
    meta: { label: "Vendor" },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Amount" />
    ),
    cell: ({ getValue }) => (
      <span className="font-medium tabular-nums">
        {formatCurrency(getValue<PaymentTableRowDataType["amount"]>())}
      </span>
    ),
    meta: { label: "Amount" },
    enableSorting: false,
  },
  {
    id: "note",
    accessorKey: "note",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Note" />
    ),
    cell: ({ getValue }) => {
      const note = getValue<PaymentTableRowDataType["note"]>();
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
        value={getValue<PaymentTableRowDataType["createdAt"]>()}
        className="text-muted-foreground"
      />
    ),
    meta: { label: "Date" },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <PaymentTableRowAction paymentData={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
