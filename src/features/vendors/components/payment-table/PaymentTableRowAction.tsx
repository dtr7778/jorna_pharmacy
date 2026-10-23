import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";

import DataTableRowMenu from "@/components/data-table/data-table-row-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import type { ListVendorPaymentsContractType } from "../../api/vendorPayment.contract";

export function PaymentTableRowAction({
  paymentData,
}: {
  paymentData: ListVendorPaymentsContractType["output"]["data"]["data"][number];
}) {
  return (
    <DataTableRowMenu>
      <DropdownMenuItem
        nativeButton={false}
        render={
          <Link
            to="/dashboard/vendors/$vendorId"
            params={{ vendorId: paymentData.vendorId }}
            search={{ tab: "payment" }}
          />
        }
      >
        <Eye />
        <span>View vendor</span>
      </DropdownMenuItem>
    </DataTableRowMenu>
  );
}
