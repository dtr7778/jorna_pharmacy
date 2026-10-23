import { Link } from "@tanstack/react-router";

import { env } from "@/lib/env";

import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";

export function SidebarLogo() {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        render={
          <Link to="/dashboard">
            <span className="flex aspect-square size-8 items-center justify-center">
              <img src="/sitelogo.png" alt={`${env.VITE_APP_NAME} logo`} />
            </span>
            <span className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {env.VITE_APP_NAME}
              </span>
              <span className="truncate text-xs">Platfrom</span>
            </span>
          </Link>
        }
      />
    </SidebarMenuItem>
  );
}
