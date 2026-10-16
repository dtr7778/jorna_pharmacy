import { UsersRound } from "lucide-react"

import type { ListRoleContractType } from "../../api/role.contract"
import { PermissionsCell } from "./PermissionsCell"
import type { ColumnType } from "@/types/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { formatEnumValue } from "@/utils/formatEnum"
import { Badge } from "@/components/ui/badge"

type RoleTableRowDataType = ListRoleContractType["output"]["data"][number]

export const roleTableColumn: ColumnType<RoleTableRowDataType> = [
  {
    id: "roleName",
    accessorKey: "roleName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Role" />
    ),
    cell: ({ getValue }) => (
      <div className="text-sm font-semibold">
        {formatEnumValue(getValue<RoleTableRowDataType["roleName"]>())}
      </div>
    ),
    enableHiding: false,
    enableColumnFilter: false,
    enableSorting: false,
  },
  {
    id: "description",
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Description" />
    ),
    cell: ({ getValue }) => (
      <div>{getValue<RoleTableRowDataType["description"]>()}</div>
    ),
    enableSorting: false,
  },
  {
    id: "totalUsers",
    accessorKey: "totalUsers",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Total Users" />
    ),
    cell: ({ getValue }) => (
      <Badge variant="outline">
        <UsersRound />
        <span>{`${getValue<RoleTableRowDataType["totalUsers"]>()} users`}</span>
      </Badge>
    ),
    enableSorting: false,
  },
  {
    id: "permissions",
    accessorKey: "permissions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Permissions" />
    ),
    cell: ({ getValue }) => (
      <PermissionsCell
        permissions={getValue<RoleTableRowDataType["permissions"]>()}
      />
    ),
    meta: {
      label: "Permissions",
    },
    enableHiding: false,
    enableColumnFilter: false,
    enableSorting: false,
  },
]
