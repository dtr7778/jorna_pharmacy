import { useState } from "react";

import { Edit } from "lucide-react";

import DataTableRowMenu from "@/components/data-table/data-table-row-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { usePermissionCheck } from "@/hooks/use-permission-check";

import type { ListMedicineContractType } from "../../api/medicine.contract";
import { MedicineUpdateDialog } from "../MedicineUpdateDialog";

export function MedicineTableRowAction({
  medicineData,
}: {
  medicineData: ListMedicineContractType["output"]["data"]["data"][number];
}) {
  const isAllowUpdate = usePermissionCheck([
    { level: "system", resource: "medicine", action: "update" },
  ]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);

  if (!isAllowUpdate) return null;

  return (
    <>
      <DataTableRowMenu>
        <DropdownMenuItem onClick={() => setOpenUpdateDialog(true)}>
          <Edit />
          <span>Update</span>
        </DropdownMenuItem>
      </DataTableRowMenu>

      {openUpdateDialog && (
        <MedicineUpdateDialog
          open={openUpdateDialog}
          setOpen={setOpenUpdateDialog}
          medicineId={medicineData.id}
          medicineData={medicineData}
        />
      )}
    </>
  );
}
