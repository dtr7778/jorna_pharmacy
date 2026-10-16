export const ROLES = ["USER", "SUPPORT_AGENT", "ADMIN", "SUPER_ADMIN"] as const

export const PERMISSION_LEVEL = ["system", "self"] as const
export const RESOURCE_TYPE = [
  "user",
  "role_permission",
  "invitation",
  "lead",
  "lead_mail",
  "task",
  "contact",
  "lead_company",
  "lead_company_employee",
  "site_audit",
] as const
export const ACTION_TYPE = [
  "create",
  "read",
  "list",
  "update",
  "delete",
  "manage",
  "export",
] as const

export const ADDRESS_TYPE = [
  "billing",
  "shipping",
  "office",
  "home",
  "work",
  "other",
] as const

export const USER_EVENT_TYPE = [
  "auth.login",
  "auth.logout",
  "auth.login_failed",
  "auth.password_changed",
  "auth.password_reset",
  "device.new_detected",
  "admin.impersonation",
] as const
