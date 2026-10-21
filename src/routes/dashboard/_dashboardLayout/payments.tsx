import { createFileRoute } from "@tanstack/react-router";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableToolbarSkeleton } from "@/components/data-table/data-table-toolbar-skeleton";
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
import { requirePermissions } from "@/features/auth/auth.functions";
import { PaymentManagementTable } from "@/features/vendors/components/payment-table/PaymentManagementTable";
import { head } from "@/lib/head";
import { querySearchSchema, rangeFilterSchema } from "@/lib/querySearchSchema";
import { orpcTQClient } from "@/server/orpc";

const searchFields = ["invoiceNo"];

export const Route = createFileRoute("/dashboard/_dashboardLayout/payments")({
  beforeLoad: ({ context }) => {
    requirePermissions(
      context.permissions,
      [
        { level: "system", resource: "vendor_payment", action: "manage" },
        { level: "system", resource: "vendor_payment", action: "list" },
      ],
      context.user.id
    );
  },
  validateSearch: querySearchSchema.extend(rangeFilterSchema.shape),
  loaderDeps: ({ search }) => search,
  head: ({ match }) =>
    head({
      pathname: match.pathname,
      titleByTemplate: "Payments",
      description: "Manage your vendor payments",
    }),
  loader: async ({ context: { queryClient }, deps }) => {
    await queryClient.query(
      orpcTQClient.vendor.payment.list.queryOptions({
        input: {
          page: deps.page,
          limit: deps.limit,
          search: deps.search,
          searchFields,
          order: deps.order,
          orderField: deps.orderField,
        },
      })
    );
  },
  pendingComponent: LoadingComponent,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardShell
      header={
        <DashboardShellHeader>
          <DashboardShellTitle>Payment Management</DashboardShellTitle>
          <DashboardShellDescription>
            Manage your vendor payments
          </DashboardShellDescription>
        </DashboardShellHeader>
      }
    >
      <PaymentManagementTable searchFields={searchFields} />
    </DashboardShell>
  );
}

function LoadingComponent() {
  return (
    <DashboardShellSkeleton
      header={
        <DashboardShellHeader>
          <DashboardShellTitleSkeleton />
          <DashboardShellDescriptionSkeleton />
        </DashboardShellHeader>
      }
    >
      <DataTableSkeleton>
        <DataTableToolbarSkeleton />
      </DataTableSkeleton>
    </DashboardShellSkeleton>
  );
}
