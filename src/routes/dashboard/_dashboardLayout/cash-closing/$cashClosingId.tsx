import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/_dashboardLayout/cash-closing/$cashClosingId"
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>Hello "/dashboard/_dashboardLayout/cash-closing/$cashClosingId"!</div>
  );
}
