import {
  Banknote,
  BuildingComplex,
  Contact,
  CreditCard,
  House,
  Settings,
  ShieldUser,
  User,
  UsersRound,
} from "lucide-react";

import type {
  PermissionType,
  RoutePathType,
  SidebarGroupMenuLinkType,
  SidebarMenuLinkType,
} from "@/types";

function manageOrList(
  resource: PermissionType["resource"]
): Array<PermissionType> {
  return [
    { level: "system", resource, action: "manage" },
    { level: "system", resource, action: "list" },
  ];
}

export const sidebarMenuLinks: Array<SidebarGroupMenuLinkType> = [
  {
    groupName: "Overview",
    items: [
      {
        title: "Dashboard",
        path: "/dashboard",
        pathRegex: /^\/dashboard\/?$/,
        icon: <House />,
      },
    ],
  },
  {
    groupName: "Sales",
    items: [
      // {
      //   title: "Sales",
      //   path: "/dashboard/sales",
      //   pathRegex: /^\/dashboard\/sales\/?$/,
      //   permissions: manageOrList("sale"),
      //   icon: <ReceiptText />,
      // },
      {
        title: "Customers",
        path: "/dashboard/customers",
        pathRegex: /^\/dashboard\/customers(?:\/.*)$/,
        permissions: manageOrList("customer"),
        icon: <Contact />,
      },
      {
        title: "Customer Payments",
        path: "/dashboard/customers/payments",
        pathRegex: /^\/dashboard\/customers\/payments$/,
        permissions: manageOrList("customer_payment"),
        icon: <Banknote />,
      },
      {
        title: "Daily sales",
        path: "/dashboard/cash-closing",
        pathRegex: /^\/dashboard\/cash-closing(?:\/.*)?$/,
        permissions: manageOrList("cash_closing"),
        icon: <CreditCard />,
      },
    ],
  },
  // {
  //   groupName: "Inventory",
  //   items: [
  //     {
  //       title: "Medicines",
  //       path: "/dashboard/medicines",
  //       pathRegex: /^\/dashboard\/medicines\/?$/,
  //       permissions: manageOrList("medicine"),
  //       icon: <Pill />,
  //     },
  //     {
  //       title: "Purchases",
  //       path: "/dashboard/purchases",
  //       pathRegex: /^\/dashboard\/purchases(?:\/.*)?$/,
  //       permissions: manageOrList("purchase"),
  //       icon: <ShoppingCart />,
  //     },
  //   ],
  // },
  {
    groupName: "Suppliers",
    items: [
      {
        title: "Company",
        path: "/dashboard/vendors",
        pathRegex: /^\/dashboard\/vendors$/,
        permissions: manageOrList("vendor"),
        icon: <BuildingComplex />,
      },
      {
        title: "Company Payments",
        path: "/dashboard/vendors/payments",
        pathRegex: /^\/dashboard\/vendors\/payments$/,
        permissions: manageOrList("vendor_payment"),
        icon: <Banknote />,
      },
    ],
  },
  {
    groupName: "Administration",
    items: [
      {
        title: "All Users",
        path: "/dashboard/users",
        pathRegex: /^\/dashboard\/users(?:\/.*)?$/,
        permissions: manageOrList("user"),
        icon: <UsersRound />,
      },
      {
        title: "Roles & Permissions",
        path: "/dashboard/roles",
        pathRegex: /^\/dashboard\/roles\/?$/,
        permissions: manageOrList("role_permission"),
        icon: <ShieldUser />,
      },
    ],
  },
];

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
];

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
  ];
