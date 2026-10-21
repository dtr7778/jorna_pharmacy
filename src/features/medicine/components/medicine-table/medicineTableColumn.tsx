import { Link } from "@tanstack/react-router";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { ColumnType } from "@/types/data-table";
import { formatCurrency } from "@/utils/formatCurrency";

import type { ListMedicineContractType } from "../../api/medicine.contract";
import { getMedicineTypeLabel } from "../../medicine.constants";
import { MedicineTableRowAction } from "./MedicineTableRowAction";

type MedicineTableRowDataType =
  ListMedicineContractType["output"]["data"]["data"][number];

export const medicineTableColumn: ColumnType<MedicineTableRowDataType> = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Name" />
    ),
    cell: ({ row, getValue }) => (
      <div className="flex flex-col">
        <div className="flex gap-2">
          <span className="font-medium">
            {getValue<MedicineTableRowDataType["name"]>()}
          </span>
          <Badge variant="outline">
            {getMedicineTypeLabel(row.original.type)}
          </Badge>
          {!row.original.isActive && (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        {(row.original.genericName || row.original.strength) && (
          <span className="text-muted-foreground">
            {[row.original.genericName, row.original.strength]
              .filter(Boolean)
              .join(" - ")}
          </span>
        )}
      </div>
    ),
    meta: { label: "Name" },
    enableHiding: false,
  },
  {
    id: "vendor",
    accessorKey: "vendor",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Vendor" />
    ),
    cell: ({ getValue }) => {
      const vendor = getValue<MedicineTableRowDataType["vendor"]>();

      return vendor ? (
        <Link
          to="/dashboard/vendors/$vendorId"
          params={{ vendorId: vendor.id }}
          search={{ tab: "details" }}
          className="link line-clamp-1 max-w-40 truncate font-medium"
        >
          {vendor.name}
        </Link>
      ) : (
        <span className="text-muted-foreground">Not provided</span>
      );
    },
    meta: { label: "Vendor" },
    enableSorting: false,
  },
  {
    id: "stockRemaining",
    accessorKey: "stockRemaining",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Stock" />
    ),
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {row.original.stockRemaining}
        <span className="font-normal text-muted-foreground">
          {" "}
          {row.original.baseUnit}
        </span>
      </span>
    ),
    meta: { label: "Stock" },
    enableSorting: false,
  },
  {
    id: "costPrice",
    accessorKey: "costPrice",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Cost price" />
    ),
    cell: ({ getValue }) => {
      const costPrice = getValue<MedicineTableRowDataType["costPrice"]>();
      return costPrice === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="tabular-nums">{formatCurrency(costPrice)}</span>
      );
    },
    meta: { label: "Cost price" },
    enableSorting: false,
  },
  {
    id: "sellPrice",
    accessorKey: "sellPrice",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Sell price" />
    ),
    cell: ({ getValue }) => {
      const sellPrice = getValue<MedicineTableRowDataType["sellPrice"]>();
      return sellPrice === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="tabular-nums">{formatCurrency(sellPrice)}</span>
      );
    },
    meta: { label: "Sell price" },
    enableSorting: false,
  },
  {
    id: "restockAlert",
    accessorFn: (row) => row.stockRemaining <= row.minimumStock,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Restock" />
    ),
    cell: ({ getValue }) => {
      const needsRestock = getValue<boolean>();
      return needsRestock ? (
        <Badge variant="destructive">Restock</Badge>
      ) : (
        <Badge variant="secondary">In stock</Badge>
      );
    },
    meta: { label: "Restock" },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <MedicineTableRowAction medicineData={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
