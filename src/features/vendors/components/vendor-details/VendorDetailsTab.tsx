import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Edit,
  HandCoins,
  MapPin,
  NotepadText,
  Phone,
  Receipt,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { FormatDateCell } from "@/components/FormatDateCell";
import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Stat,
  StatIndicator,
  StatLabel,
  StatTrend,
  StatValue,
} from "@/components/ui/stat";
import { usePermissionCheck } from "@/hooks/use-permission-check";
import { orpcTQClient } from "@/server/orpc";
import { formatCurrency } from "@/utils/formatCurrency";

import type { VendorDetailsContractType } from "../../api/vendor.contract";
import { VendorUpdateDialog } from "../VendorUpdateDialog";

export function VendorDetailsTab({ vendorId }: { vendorId: string }) {
  const isAllowUpdate = usePermissionCheck([
    { level: "system", resource: "vendor", action: "update" },
  ]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);

  const { data, isLoading, isError, error } = useQuery(
    orpcTQClient.vendor.details.queryOptions({
      input: { vendorId },
      select: (result) => result.data,
    })
  );

  return (
    <QueryStateBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={() => false}
      data={data}
      loadingFallback={<VendorDetailsSkeleton />}
    >
      {(vendor) => (
        <div className="space-y-4">
          <VendorSummaryStats summary={vendor.summary} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Contact & location</CardTitle>
                <CardDescription>Vendor contact info</CardDescription>
                <CardAction>
                  {isAllowUpdate && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setOpenUpdateDialog(true)}
                    >
                      <Edit />
                    </Button>
                  )}
                </CardAction>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-6 sm:grid-cols-2">
                  <DetailsItem icon={Phone} title="Phone">
                    {vendor.phone ? (
                      <span className="tabular-nums">{vendor.phone}</span>
                    ) : (
                      <EmptyValue />
                    )}
                  </DetailsItem>
                  <DetailsItem icon={MapPin} title="Address">
                    {vendor.address ? vendor.address : <EmptyValue />}
                  </DetailsItem>
                  <DetailsItem icon={NotepadText} title="Note">
                    {vendor.note ? vendor.note : <EmptyValue />}
                  </DetailsItem>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Record</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-6">
                  <DetailsItem icon={CalendarDays} title="Created at">
                    <FormatDateCell
                      format="dd MMM, yyyy hh:mm aa"
                      value={vendor.createdAt}
                    />
                  </DetailsItem>
                  <DetailsItem icon={CalendarDays} title="Last updated">
                    <FormatDateCell
                      format="dd MMM, yyyy hh:mm aa"
                      value={vendor.updatedAt}
                    />
                  </DetailsItem>
                </dl>
              </CardContent>
            </Card>
          </div>

          {isAllowUpdate && (
            <VendorUpdateDialog
              open={openUpdateDialog}
              setOpen={setOpenUpdateDialog}
              vendorId={vendorId}
              vendorData={{
                name: vendor.name,
                isActive: vendor.isActive,
                address: vendor.address,
                note: vendor.note,
                phone: vendor.phone,
              }}
            />
          )}
        </div>
      )}
    </QueryStateBoundary>
  );
}

function VendorSummaryStats({
  summary,
}: {
  summary: VendorDetailsContractType["output"]["data"]["summary"];
}) {
  const hasBalance = summary.balance > 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SummaryStat
        label="Total purchased"
        value={formatCurrency(summary.totalPurchased)}
        icon={Receipt}
        color="info"
        trend={`${summary.purchaseCount} purchase${summary.purchaseCount === 1 ? "" : "s"}`}
        trendDirection="neutral"
      />
      <SummaryStat
        label="Total paid"
        value={formatCurrency(summary.totalPaid)}
        icon={HandCoins}
        color="success"
        trend={`${summary.paymentCount} payment${summary.paymentCount === 1 ? "" : "s"}`}
        trendDirection="neutral"
      />
      <SummaryStat
        label="Balance due"
        value={formatCurrency(Math.max(summary.balance, 0))}
        icon={Wallet}
        color={hasBalance ? "error" : "success"}
        trend={hasBalance ? "Outstanding to vendor" : "Fully settled"}
        trendDirection={hasBalance ? "down" : "neutral"}
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
  trendDirection,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: "info" | "success" | "error";
  trend: string;
  trendDirection: "up" | "down" | "neutral";
}) {
  return (
    <Stat>
      <StatLabel>{label}</StatLabel>
      <StatIndicator variant="icon" color={color}>
        <Icon aria-hidden />
      </StatIndicator>
      <StatValue>{value}</StatValue>
      <StatTrend trend={trendDirection}>{trend}</StatTrend>
    </Stat>
  );
}

function DetailsItem({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon aria-hidden className="size-4" />
        <span>{title}</span>
      </dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

function EmptyValue() {
  return <span className="text-muted-foreground">Not provided</span>;
}

export function VendorDetailsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-40 w-full lg:col-span-2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-28 w-full lg:col-span-3" />
      </div>
    </div>
  );
}
