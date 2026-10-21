import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/LinkButton";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import {
  DashboardShellDescription,
  DashboardShellHeader,
  DashboardShellTitle,
} from "@/components/shared/dashboard-shell/DashboardShellHeader";
import { requirePermissions } from "@/features/auth/auth.functions";
import { PurchaseCreateForm } from "@/features/purchase/components/purchase-create/PurchaseCreateForm";
import { head } from "@/lib/head";

export const Route = createFileRoute(
  "/dashboard/_dashboardLayout/purchases/new"
)({
  beforeLoad: ({ context }) => {
    requirePermissions(
      context.permissions,
      [
        { level: "system", resource: "purchase", action: "manage" },
        { level: "system", resource: "purchase", action: "create" },
      ],
      context.user.id
    );
  },
  head: ({ match }) =>
    head({
      pathname: match.pathname,
      titleByTemplate: "New Purchase",
      description: "Record a new purchase from a vendor",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardShell
      header={
        <DashboardShellHeader>
          <LinkButton to="/dashboard/purchases">
            <ArrowLeft />
            <span>Back to purchases</span>
          </LinkButton>
          <DashboardShellTitle>New purchase</DashboardShellTitle>
          <DashboardShellDescription>
            Record stock received from a vendor and add the batches to inventory
          </DashboardShellDescription>
        </DashboardShellHeader>
      }
    >
      <PurchaseCreateForm />
    </DashboardShell>
  );
}
