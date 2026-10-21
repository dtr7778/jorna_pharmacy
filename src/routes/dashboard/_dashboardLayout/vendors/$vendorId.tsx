import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import z from "zod";

import { LinkButton } from "@/components/LinkButton";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { DashboardShellHeader } from "@/components/shared/dashboard-shell/DashboardShellHeader";
import { DashboardShellSkeleton } from "@/components/shared/dashboard-shell/DashboardShellSkeleton";
import {
  TabNavigation,
  TabNavigationContent,
  TabNavigationList,
  TabNavigationTrigger,
} from "@/components/tab-navigation";
import { ButtonSkeleton } from "@/components/ui/button-skeleton";
import { requirePermissions } from "@/features/auth/auth.functions";
import { VendorHeader } from "@/features/vendors/components/VendorHeader";
import {
  VendorDetailsTab,
  VendorDetailsSkeleton,
} from "@/features/vendors/components/vendor-details/VendorDetailsTab";
import { VendorPaymentsTab } from "@/features/vendors/components/vendor-details/VendorPaymentsTab";
import { VendorPurchasesTab } from "@/features/vendors/components/vendor-details/VendorPurchasesTab";
import { head } from "@/lib/head";
import { orpcTQClient } from "@/server/orpc";

export const Route = createFileRoute(
  "/dashboard/_dashboardLayout/vendors/$vendorId"
)({
  beforeLoad: ({ context }) => {
    requirePermissions(
      context.permissions,
      [
        { level: "system", resource: "vendor", action: "manage" },
        { level: "system", resource: "vendor", action: "read" },
      ],
      context.user.id
    );
  },
  validateSearch: z.object({
    tab: z
      .enum(["details", "purchase", "payment"] as const)
      .optional()
      .default("details"),
  }),
  loader: async ({ context: { queryClient }, params: { vendorId } }) => {
    return queryClient.query(
      orpcTQClient.vendor.details.queryOptions({
        input: { vendorId },
      })
    );
  },
  head: ({ match, loaderData }) =>
    head({
      pathname: match.pathname,
      titleByTemplate: loaderData
        ? `"${loaderData.data.name}" vendor`
        : "Vendor",
    }),
  pendingComponent: LoadingComponent,
  component: RouteComponent,
});

function RouteComponent() {
  const { vendorId } = Route.useParams();

  return (
    <DashboardShell
      header={
        <DashboardShellHeader>
          <LinkButton to="/dashboard/vendors">
            <ArrowLeft />
            <span>Go Back</span>
          </LinkButton>
        </DashboardShellHeader>
      }
    >
      <VendorHeader vendorId={vendorId} />
      <TabNavigation
        defaultTab="details"
        routeId="/dashboard/_dashboardLayout/vendors/$vendorId"
      >
        <TabNavigationList variant="line">
          <TabNavigationTrigger value="details">Details</TabNavigationTrigger>
          <TabNavigationTrigger value="purchase">
            Purchases
          </TabNavigationTrigger>
          <TabNavigationTrigger value="payment">Payments</TabNavigationTrigger>
        </TabNavigationList>
        <TabNavigationContent value="details">
          <VendorDetailsTab vendorId={vendorId} />
        </TabNavigationContent>
        <TabNavigationContent value="purchase">
          <VendorPurchasesTab vendorId={vendorId} />
        </TabNavigationContent>
        <TabNavigationContent value="payment">
          <VendorPaymentsTab vendorId={vendorId} />
        </TabNavigationContent>
      </TabNavigation>
    </DashboardShell>
  );
}

function LoadingComponent() {
  return (
    <DashboardShellSkeleton
      header={
        <DashboardShellHeader>
          <ButtonSkeleton />
        </DashboardShellHeader>
      }
    >
      <VendorDetailsSkeleton />
    </DashboardShellSkeleton>
  );
}
