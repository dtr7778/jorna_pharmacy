import { useState } from "react";

import { DollarSign } from "lucide-react";

import { FormatDateCell } from "@/components/FormatDateCell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VendorPurchaseDetailsContractType } from "@/features/purchase/api/purchase.contract";
import { VendorPaymentCreateDialog } from "@/features/vendors/components/VendorPaymentCreateDialog";
import { usePermissionCheck } from "@/hooks/use-permission-check";
import { formatCurrency } from "@/utils/formatCurrency";

type PurchaseDetails = VendorPurchaseDetailsContractType["output"]["data"];
type PurchasePayment = PurchaseDetails["payments"][number];

export function PurchasePaymentsCard({
  vendorId,
  purchaseId,
  payments,
  paidAmount,
  dueAmount,
}: {
  vendorId: string;
  purchaseId: string;
  payments: PurchasePayment[];
  paidAmount: number;
  dueAmount: number;
}) {
  const [openPaymentDialog, setOpenPaymentDialog] = useState<boolean>(false);

  const isAllowCreatePayment = usePermissionCheck([
    { level: "system", resource: "vendor_payment", action: "create" },
  ]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            {payments.length === 0
              ? "No payments recorded"
              : `${payments.length} payment${payments.length === 1 ? "" : "s"} against this purchase`}
          </CardDescription>
          {isAllowCreatePayment && dueAmount > 0 && (
            <CardAction>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon"
                      onClick={() => setOpenPaymentDialog(true)}
                    />
                  }
                >
                  <DollarSign />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add new payment report</p>
                </TooltipContent>
              </Tooltip>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing has been paid against this purchase yet.
            </div>
          ) : (
            <ol className="relative space-y-4 border-l pl-4">
              {payments.map((payment) => (
                <li key={payment.id} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium tabular-nums">
                      {formatCurrency(payment.amount)}
                    </span>
                    <FormatDateCell
                      format="dd MMM, yyyy"
                      value={payment.createdAt}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {payment.createdByUser?.name ?? "Uknown user"}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </div>
                </li>
              ))}
            </ol>
          )}

          <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Paid</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(paidAmount)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Due</dt>
              <dd
                className={
                  dueAmount > 0
                    ? "font-medium text-destructive tabular-nums"
                    : "font-medium tabular-nums"
                }
              >
                {formatCurrency(dueAmount)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {openPaymentDialog && (
        <VendorPaymentCreateDialog
          open={openPaymentDialog}
          setOpen={setOpenPaymentDialog}
          vendorId={vendorId}
          purchaseId={purchaseId}
        />
      )}
    </>
  );
}
