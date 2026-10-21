import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Eye, HandCoins, ReceiptText } from "lucide-react";

import DataTableRowMenu from "@/components/data-table/data-table-row-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { ListVendorPurchasesContractType } from "@/features/purchase/api/purchase.contract";
import { VendorPaymentCreateDialog } from "@/features/vendors/components/VendorPaymentCreateDialog";
import { usePermissionCheck } from "@/hooks/use-permission-check";

export function PurchaseTableRowAction({
  purchaseData,
}: {
  purchaseData: ListVendorPurchasesContractType["output"]["data"]["data"][number];
}) {
  const isAllowCreatePayment = usePermissionCheck([
    { level: "system", resource: "vendor_payment", action: "create" },
  ]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState<boolean>(false);

  const isDue = purchaseData.totalAmount > purchaseData.paidAmount;

  return (
    <>
      <DataTableRowMenu>
        <DropdownMenuItem
          nativeButton={false}
          render={
            <Link
              to="/dashboard/purchases/$purchaseId"
              params={{ purchaseId: purchaseData.id }}
            />
          }
        >
          <ReceiptText />
          <span>View purchase</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          nativeButton={false}
          render={
            <Link
              to="/dashboard/vendors/$vendorId"
              params={{ vendorId: purchaseData.vendorId }}
              search={{ tab: "purchase" }}
            />
          }
        >
          <Eye />
          <span>View vendor</span>
        </DropdownMenuItem>
        {isAllowCreatePayment && isDue && (
          <DropdownMenuItem onClick={() => setOpenPaymentDialog(true)}>
            <HandCoins />
            <span>Record payment</span>
          </DropdownMenuItem>
        )}
      </DataTableRowMenu>

      {openPaymentDialog && (
        <VendorPaymentCreateDialog
          open={openPaymentDialog}
          setOpen={setOpenPaymentDialog}
          vendorId={purchaseData.vendorId}
          purchaseId={purchaseData.id}
        />
      )}
    </>
  );
}
