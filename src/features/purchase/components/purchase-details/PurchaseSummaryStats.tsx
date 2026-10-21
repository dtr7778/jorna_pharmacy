import { BadgePercent, HandCoins, Receipt, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Stat,
  StatIndicator,
  StatLabel,
  StatTrend,
  StatValue,
} from "@/components/ui/stat";
import type { VendorPurchaseDetailsContractType } from "@/features/purchase/api/purchase.contract";
import { formatCurrency } from "@/utils/formatCurrency";

type PurchaseDetails = VendorPurchaseDetailsContractType["output"]["data"];

export function PurchaseSummaryStats({
  purchase,
}: {
  purchase: PurchaseDetails;
}) {
  const { summary } = purchase;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryStat
        label="Total amount"
        value={formatCurrency(purchase.totalAmount)}
        icon={Receipt}
        color="info"
        trend={`${summary.itemCount} ${summary.itemCount === 1 ? "line item" : "line items"}`}
      />
      <SummaryStat
        label="Paid amount"
        value={formatCurrency(purchase.paidAmount)}
        icon={HandCoins}
        color="success"
        trend={`${summary.paymentCount} ${summary.paymentCount === 1 ? "payment" : "payments"}`}
      />
      <SummaryStat
        label="Due amount"
        value={formatCurrency(summary.dueAmount)}
        icon={Wallet}
        color={summary.dueAmount > 0 ? "error" : "success"}
        trend={
          summary.dueAmount > 0 ? "Outstanding to vendor" : "Fully settled"
        }
      />
      <SummaryStat
        label="Discount"
        value={formatCurrency(purchase.discount)}
        icon={BadgePercent}
        color="warning"
        trend={`Subtotal ${formatCurrency(purchase.subtotal)}`}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: "info" | "success" | "warning" | "error";
  trend: string;
}) {
  return (
    <Stat>
      <StatLabel>{label}</StatLabel>
      <StatIndicator variant="icon" color={color}>
        <Icon aria-hidden />
      </StatIndicator>
      <StatValue className="tabular-nums">{value}</StatValue>
      <StatTrend trend="neutral">{trend}</StatTrend>
    </Stat>
  );
}
