import { Info } from "lucide-react";
import type { Control } from "react-hook-form";

import { CheckboxField } from "@/components/form-fields/CheckboxField";
import { InputAddonField } from "@/components/form-fields/InputAddonField";
import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import type { PurchaseCreateFormInputType } from "@/features/purchase/purchase.schema";
import { formatCurrency } from "@/utils/formatCurrency";

interface PurchaseSummaryCardProps {
  control: Control<PurchaseCreateFormInputType>;
  formId: string;
  subtotal: number;
  totalRevenue: number;
  totalProfit: number;
  totalMargin: number;
  paidAmount: number;
  paidInFull: boolean;
  onPaidInFullChange: (checked: boolean) => void;
  total: number;
  due: number;
  isPending: boolean;
  onCancel: () => void;
}

export function PurchaseSummaryCard({
  control,
  formId,
  subtotal,
  totalRevenue,
  totalProfit,
  totalMargin,
  paidAmount,
  paidInFull,
  onPaidInFullChange,
  total,
  due,
  isPending,
  onCancel,
}: PurchaseSummaryCardProps) {
  return (
    <Card className="xl:sticky xl:top-4">
      <CardHeader>
        <CardTitle>Purchase summary</CardTitle>
        <CardDescription>Review totals before saving</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <FieldGroup>
          <InputAddonField
            control={control}
            name="paidAmount"
            label="Paid now"
            type="number"
            inputMode="numeric"
            min={0}
            step="0.01"
            placeholder="0"
            firstAddon={<span aria-hidden>৳</span>}
            description="Recorded as a vendor payment."
            disabled={isPending || paidInFull}
          />
          <CheckboxField
            control={control}
            name="paidInFull"
            label="Paid in full"
            description="Sets paid now to the purchase total."
            disabled={isPending}
            onValueChange={onPaidInFullChange}
          />
        </FieldGroup>

        <Separator />

        <dl className="space-y-2 text-sm" aria-live="polite">
          <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
          <SummaryRow label="Total" value={formatCurrency(total)} emphasis />
          <SummaryRow
            label="Total revenue"
            value={formatCurrency(totalRevenue)}
          />
          <SummaryRow
            label="Total profit"
            value={formatCurrency(totalProfit)}
          />
          <SummaryRow label="Total margin" value={`${totalMargin}%`} />
          <SummaryRow label="Paid now" value={formatCurrency(paidAmount)} />
          <SummaryRow
            label="Balance due"
            value={formatCurrency(due)}
            tone={due > 0 ? "destructive" : "muted"}
          />
        </dl>

        <p className="flex items-start gap-1.5 rounded-md bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
          <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          Stock and batch quantities are added as soon as the purchase is saved.
        </p>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <ButtonSpinner
          form={formId}
          type="submit"
          isLoading={isPending}
          className="w-full"
        >
          Create purchase
        </ButtonSpinner>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  emphasis = false,
  tone = "default",
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "default" | "muted" | "destructive";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={tone === "muted" ? "text-muted-foreground" : undefined}>
        {label}
      </dt>
      <dd
        className={[
          "tabular-nums",
          emphasis ? "text-base font-semibold" : "font-medium",
          tone === "destructive"
            ? "text-destructive"
            : tone === "muted"
              ? "text-muted-foreground"
              : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
