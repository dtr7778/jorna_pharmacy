import { FormatDateCell } from "@/components/FormatDateCell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { VendorPurchaseDetailsContractType } from "@/features/purchase/api/purchase.contract";

type PurchaseDetails = VendorPurchaseDetailsContractType["output"]["data"];

export function PurchaseInfoCard({ purchase }: { purchase: PurchaseDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase information</CardTitle>
        <CardDescription>Record and vendor details</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3 text-sm">
          <InfoRow label="Recorded by">
            {purchase.createdByUser?.name ?? "Unknown user"}
          </InfoRow>
          <InfoRow label="Created">
            <FormatDateCell
              format="dd MMM, yyyy hh:mm aa"
              value={purchase.createdAt}
            />
          </InfoRow>
          <InfoRow label="Last updated">
            <FormatDateCell
              format="dd MMM, yyyy hh:mm aa"
              value={purchase.updatedAt}
            />
          </InfoRow>
          <InfoRow label="Vendor address">
            {purchase.vendor.address ?? "Not provided"}
          </InfoRow>
          <InfoRow label="Vendor phone">
            {purchase.vendor.phone ?? "Not provided"}
          </InfoRow>
          {purchase.note && (
            <InfoRow label="Note">
              <span className="whitespace-pre-line">{purchase.note}</span>
            </InfoRow>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}
