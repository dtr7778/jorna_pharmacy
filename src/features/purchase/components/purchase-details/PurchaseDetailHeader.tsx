import { Link } from "@tanstack/react-router";
import { BuildingComplex, Phone, ReceiptText } from "lucide-react";

import { FormatDateCell } from "@/components/FormatDateCell";
import { Badge } from "@/components/ui/badge";
import type { VendorPurchaseDetailsContractType } from "@/features/purchase/api/purchase.contract";
import { PurchaseStatusBadge } from "@/features/purchase/components/PurchaseStatusBadge";

type PurchaseDetails = VendorPurchaseDetailsContractType["output"]["data"];

export function PurchaseDetailHeader({
  purchase,
}: {
  purchase: PurchaseDetails;
}) {
  const due = purchase.summary.dueAmount;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight break-words md:text-2xl">
            {purchase.invoiceNo}
          </h2>
          <PurchaseStatusBadge due={due} paidAmount={purchase.paidAmount} />
          {purchase.vendor.isActive ? null : (
            <Badge variant="outline">Vendor inactive</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BuildingComplex aria-hidden className="size-4" />
            <Link
              to="/dashboard/vendors/$vendorId"
              params={{ vendorId: purchase.vendorId }}
              search={{ tab: "purchase" }}
              className="link font-medium"
            >
              {purchase.vendor.name}
            </Link>
          </span>
          {purchase.vendor.phone && (
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Phone aria-hidden className="size-4" />
              {purchase.vendor.phone}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <ReceiptText aria-hidden className="size-4" />
            <FormatDateCell
              format="dd MMM, yyyy hh:mm aa"
              value={purchase.createdAt}
            />
          </span>
        </div>
      </div>

      {purchase.vendorInvoiceNo && (
        <div className="shrink-0 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <div className="text-xs font-medium text-muted-foreground">
            Vendor invoice
          </div>
          <div className="font-medium tabular-nums">
            {purchase.vendorInvoiceNo}
          </div>
        </div>
      )}
    </div>
  );
}
