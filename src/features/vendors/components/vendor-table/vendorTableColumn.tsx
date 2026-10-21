import { Link } from "@tanstack/react-router";

import { FormatDateCell } from "@/components/FormatDateCell";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { ColumnType } from "@/types/data-table";

import type { ListVendorContractType } from "../../api/vendor.contract";
import { VendorTableRowAction } from "./VendorTableRowAction";

type VendorTableRowDataType =
  ListVendorContractType["output"]["data"]["data"][number];

export const vendorTableColumn: ColumnType<VendorTableRowDataType> = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Name" />
    ),
    cell: ({ row, getValue }) => (
      <div className="flex flex-col">
        <Link
          to="/dashboard/vendors/$vendorId"
          params={{ vendorId: row.original.id }}
          search={{ tab: "details" }}
          className="link font-medium"
        >
          {getValue<VendorTableRowDataType["name"]>()}
        </Link>
        {row.original.phone && (
          <span className="text-muted-foreground tabular-nums">
            {row.original.phone}
          </span>
        )}
      </div>
    ),
    meta: { label: "Name" },
    enableHiding: false,
  },
  {
    id: "address",
    accessorKey: "address",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Address" />
    ),
    cell: ({ getValue }) => {
      const address = getValue<VendorTableRowDataType["address"]>();
      return address ? (
        <span className="line-clamp-1 max-w-xs" title={address}>
          {address}
        </span>
      ) : (
        <span className="text-muted-foreground">Not provided</span>
      );
    },
    meta: { label: "Address" },
    enableSorting: false,
  },
  {
    id: "isActive",
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Status" />
    ),
    cell: ({ getValue }) => {
      const isActive = getValue<VendorTableRowDataType["isActive"]>();
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
    meta: { label: "Status" },
    enableSorting: false,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Created" />
    ),
    cell: ({ getValue }) => (
      <FormatDateCell
        format="dd MMM, yyyy"
        value={getValue<VendorTableRowDataType["createdAt"]>()}
        className="text-muted-foreground"
      />
    ),
    meta: { label: "Created" },
  },
  {
    id: "actions",
    cell: ({ row }) => <VendorTableRowAction vendorData={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
