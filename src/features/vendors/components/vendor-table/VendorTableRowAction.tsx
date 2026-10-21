import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Edit, Eye } from "lucide-react";

import DataTableRowMenu from "@/components/data-table/data-table-row-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { usePermissionCheck } from "@/hooks/use-permission-check";

import type { ListVendorContractType } from "../../api/vendor.contract";
import { VendorUpdateDialog } from "../VendorUpdateDialog";

export function VendorTableRowAction({
  vendorData,
}: {
  vendorData: ListVendorContractType["output"]["data"]["data"][number];
}) {
  const isAllowUpdate = usePermissionCheck([
    { level: "system", resource: "vendor", action: "update" },
  ]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);

  return (
    <>
      <DataTableRowMenu>
        <DropdownMenuItem
          nativeButton={false}
          render={
            <Link
              to="/dashboard/vendors/$vendorId"
              params={{ vendorId: vendorData.id }}
              search={{ tab: "details" }}
            />
          }
        >
          <Eye />
          <span>Details</span>
        </DropdownMenuItem>
        {isAllowUpdate && (
          <DropdownMenuItem onClick={() => setOpenUpdateDialog(true)}>
            <Edit />
            <span>Update</span>
          </DropdownMenuItem>
        )}
      </DataTableRowMenu>

      {openUpdateDialog && (
        <VendorUpdateDialog
          open={openUpdateDialog}
          setOpen={setOpenUpdateDialog}
          vendorId={vendorData.id}
          vendorData={vendorData}
        />
      )}
    </>
  );
}
