export const ROLES = ["USER", "EMPLOYEE", "ADMIN", "SUPER_ADMIN"] as const;

export const PERMISSION_LEVEL = ["system", "self"] as const;
export const RESOURCE_TYPE = [
  "user",
  "role_permission",
  "report",
  "purchase",
  "purchase_return",
  "vendor",
  "vendor_payment",
  "customer",
  "customer_payment",
  "sale",
  "sale_return",
  "salary",
] as const;
export const ACTION_TYPE = [
  "create",
  "read",
  "list",
  "update",
  "delete",
  "manage",
  "export",
] as const;

export const ADDRESS_TYPE = [
  "billing",
  "shipping",
  "office",
  "home",
  "work",
  "other",
] as const;

export const USER_EVENT_TYPE = [
  "auth.login",
  "auth.logout",
  "auth.login_failed",
  "auth.password_changed",
  "auth.password_reset",
  "device.new_detected",
  "admin.impersonation",
] as const;

export const MEDICINE_TYPE = [
  "tablet",
  "capsule",
  "liquid_bottle",
  "liquid_drop",
  "injection",
  "cream",
  "other",
] as const;

export const STOCK_MOVEMENT_TYPE = [
  "purchase",
  "sale",
  "purchase_return",
  "adjustment",
  "expired",
  "damaged",
] as const;
