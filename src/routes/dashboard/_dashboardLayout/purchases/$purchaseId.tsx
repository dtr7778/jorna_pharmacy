import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/LinkButton";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import {
  DashboardShellDescription,
  DashboardShellHeader,
  DashboardShellTitle,
} from "@/components/shared/dashboard-shell/DashboardShellHeader";
import {
  DashboardShellDescriptionSkeleton,
  DashboardShellTitleSkeleton,
} from "@/components/shared/dashboard-shell/DashboardShellHeaderSkeleton";
import { DashboardShellSkeleton } from "@/components/shared/dashboard-shell/DashboardShellSkeleton";
import { ButtonSkeleton } from "@/components/ui/button-skeleton";
import { requirePermissions } from "@/features/auth/auth.functions";
import {
  PurchaseDetailsSkeleton,
  PurchaseDetailsView,
} from "@/features/purchase/components/purchase-details/PurchaseDetailsView";
import { head } from "@/lib/head";
import { orpcTQClient } from "@/server/orpc";

export const Route = createFileRoute(
  "/dashboard/_dashboardLayout/purchases/$purchaseId"
)({
  beforeLoad: ({ context }) => {
    requirePermissions(
      context.permissions,
      [
        { level: "system", resource: "purchase", action: "manage" },
        { level: "system", resource: "purchase", action: "read" },
      ],
      context.user.id
    );
  },
  loader: ({ context: { queryClient }, params: { purchaseId } }) =>
    queryClient.query(
      orpcTQClient.purchase.details.queryOptions({
        input: { purchaseId },
      })
    ),
  head: ({ match, loaderData }) =>
    head({
      pathname: match.pathname,
      titleByTemplate: loaderData
        ? `Purchase ${loaderData.data.invoiceNo}`
        : "Purchase",
      description: "Purchase order details",
    }),
  pendingComponent: LoadingComponent,
  component: RouteComponent,
});

function RouteComponent() {
  const { purchaseId } = Route.useParams();

  return (
    <DashboardShell
      header={
        <DashboardShellHeader>
          <LinkButton to="/dashboard/purchases">
            <ArrowLeft />
            <span>Go Back</span>
          </LinkButton>
          <DashboardShellTitle>Purchase Details</DashboardShellTitle>
          <DashboardShellDescription>
            Review line items, payments, and settlement status
          </DashboardShellDescription>
        </DashboardShellHeader>
      }
    >
      <PurchaseDetailsView purchaseId={purchaseId} />
    </DashboardShell>
  );
}

function LoadingComponent() {
  return (
    <DashboardShellSkeleton
      header={
        <DashboardShellHeader>
          <ButtonSkeleton />
          <DashboardShellTitleSkeleton />
          <DashboardShellDescriptionSkeleton />
        </DashboardShellHeader>
      }
    >
      <PurchaseDetailsSkeleton />
    </DashboardShellSkeleton>
  );
}
