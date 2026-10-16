import type {
  RoutePathType,
  SidebarGroupMenuLinkType,
  SidebarMenuLinkType,
} from "@/types"
import { House, Settings, ShieldUser, User, UsersRound } from "lucide-react"

export const sidebarMenuLinks: Array<SidebarGroupMenuLinkType> = [
  {
    groupName: "Overview",
    items: [
      {
        title: "Dashboard",
        icon: <House />,
        path: "/dashboard",
        pathRegex: /\/dashboard/,
      },
    ],
  },
  {
    groupName: "Administration",
    items: [
      {
        title: "All Users",
        icon: <UsersRound />,
        permissions: [
          { level: "system", resource: "user", action: "manage" },
          { level: "system", resource: "user", action: "list" },
        ],
        path: "/dashboard/users",
        pathRegex: /^\/dashboard\/users(\/.*)?$/,
      },
      {
        title: "Roles & Permissions",
        icon: <ShieldUser />,
        permissions: [
          { level: "system", resource: "role_permission", action: "manage" },
          { level: "system", resource: "role_permission", action: "list" },
        ],
        path: "/dashboard/roles",
        pathRegex: /^\/dashboard\/roles$/,
      },
    ],
  },
]

export const footerMenuLinks: Array<SidebarMenuLinkType> = [
  {
    title: "My Profile",
    icon: <User />,
    path: "/dashboard/profile",
    pathRegex: /^\/dashboard\/profile$/,
  },
  {
    title: "Settings",
    icon: <Settings />,
    path: "/dashboard/settings",
    pathRegex: /^\/dashboard\/settings$/,
  },
]

export const settingsMenuLinks: Array<{ title: string; path: RoutePathType }> =
  [
    {
      title: "Profile",
      path: "/dashboard/settings/profile",
    },
    {
      title: "Update Password",
      path: "/dashboard/settings/update-password",
    },
    {
      title: "Sessions",
      path: "/dashboard/settings/sessions",
    },
    {
      title: "Connected Apps",
      path: "/dashboard/settings/connected-apps",
    },
  ]
