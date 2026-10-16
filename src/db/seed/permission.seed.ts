import type { DatabaseType } from "../clients/drizzle-client"
import type { PermissionDataModel } from "../schemas"
import { PermissionTable } from "../schemas"
import type {
  ActionTypeEnumType,
  PermissionLevelEnumType,
  ResourceTypeEnumType,
} from "../schemas/enums/zod-db-enums"
import { insertChunkedReturning } from "./seed-utils"

export type PermissionType = Pick<
  PermissionDataModel,
  "level" | "resource" | "action"
>

type CreatePermissionType = {
  level: PermissionLevelEnumType
  resource: ResourceTypeEnumType
  action: ActionTypeEnumType
  description?: string | null | undefined
}

const selfPermissions: CreatePermissionType[] = [
  // User
  {
    level: "self",
    resource: "user",
    action: "read",
    description: "View own profile information",
  },
  {
    level: "self",
    resource: "user",
    action: "update",
    description: "Edit own profile details",
  },

  // Invitation
  {
    level: "self",
    resource: "invitation",
    action: "read",
    description: "View own invitations",
  },
  {
    level: "self",
    resource: "invitation",
    action: "list",
    description: "List own invitations",
  },
  {
    level: "self",
    resource: "invitation",
    action: "update",
    description: "Accept or decline own invitations",
  },

  // Lead
  {
    level: "self",
    resource: "lead",
    action: "create",
    description: "Create new leads for own assignments",
  },
  {
    level: "self",
    resource: "lead",
    action: "read",
    description: "View details of own leads",
  },
  {
    level: "self",
    resource: "lead",
    action: "list",
    description: "List all own leads with filters",
  },
  {
    level: "self",
    resource: "lead",
    action: "update",
    description: "Update information on own leads",
  },
  {
    level: "self",
    resource: "lead",
    action: "delete",
    description: "Remove own leads permanently",
  },

  // Lead Mail
  {
    level: "self",
    resource: "lead_mail",
    action: "create",
    description: "Send new emails to own leads",
  },
  {
    level: "self",
    resource: "lead_mail",
    action: "read",
    description: "View email content of own lead mails",
  },
  {
    level: "self",
    resource: "lead_mail",
    action: "list",
    description: "List all emails for own leads",
  },

  // Task
  {
    level: "self",
    resource: "task",
    action: "create",
    description: "Create new tasks for own assignments",
  },
  {
    level: "self",
    resource: "task",
    action: "read",
    description: "View details of own tasks",
  },
  {
    level: "self",
    resource: "task",
    action: "list",
    description: "List all own tasks with filters",
  },
  {
    level: "self",
    resource: "task",
    action: "update",
    description: "Update information on own tasks",
  },
  {
    level: "self",
    resource: "task",
    action: "delete",
    description: "Remove own tasks permanently",
  },
]

const systemPermissions: CreatePermissionType[] = [
  // User
  {
    level: "system",
    resource: "user",
    action: "create",
    description: "Create new user accounts",
  },
  {
    level: "system",
    resource: "user",
    action: "read",
    description: "View any user's profile information",
  },
  {
    level: "system",
    resource: "user",
    action: "list",
    description: "List all users with filters and pagination",
  },
  {
    level: "system",
    resource: "user",
    action: "update",
    description: "Edit any user's profile details",
  },
  {
    level: "system",
    resource: "user",
    action: "delete",
    description: "Deactivate or remove any user account",
  },
  {
    level: "system",
    resource: "user",
    action: "manage",
    description: "Full user administration including role assignments",
  },

  // Role Permission
  {
    level: "system",
    resource: "role_permission",
    action: "create",
    description: "Create new roles and permissions",
  },
  {
    level: "system",
    resource: "role_permission",
    action: "read",
    description: "View role and permission configurations",
  },
  {
    level: "system",
    resource: "role_permission",
    action: "list",
    description: "List all roles and their assigned permissions",
  },
  {
    level: "system",
    resource: "role_permission",
    action: "update",
    description: "Modify role details and permission assignments",
  },
  {
    level: "system",
    resource: "role_permission",
    action: "delete",
    description: "Remove roles from the system",
  },
  {
    level: "system",
    resource: "role_permission",
    action: "manage",
    description: "Full access to configure roles and permissions",
  },

  // Invitation
  {
    level: "system",
    resource: "invitation",
    action: "create",
    description: "Send new user invitations via email",
  },
  {
    level: "system",
    resource: "invitation",
    action: "read",
    description: "View invitation details and status",
  },
  {
    level: "system",
    resource: "invitation",
    action: "list",
    description: "List all invitations with filters",
  },
  {
    level: "system",
    resource: "invitation",
    action: "update",
    description: "Resend or modify pending invitations",
  },
  {
    level: "system",
    resource: "invitation",
    action: "delete",
    description: "Revoke or cancel pending invitations",
  },
  {
    level: "system",
    resource: "invitation",
    action: "manage",
    description: "Full invitation management including bulk operations",
  },

  // Lead
  {
    level: "system",
    resource: "lead",
    action: "create",
    description: "Create new leads in the system",
  },
  {
    level: "system",
    resource: "lead",
    action: "read",
    description: "View any lead's details regardless of assignment",
  },
  {
    level: "system",
    resource: "lead",
    action: "list",
    description: "List all leads",
  },
  {
    level: "system",
    resource: "lead",
    action: "update",
    description: "Edit any lead's information and assignments",
  },
  {
    level: "system",
    resource: "lead",
    action: "delete",
    description: "Remove leads from the system permanently",
  },
  {
    level: "system",
    resource: "lead",
    action: "manage",
    description: "Full lead administration including reassignment",
  },
  {
    level: "system",
    resource: "lead",
    action: "export",
    description: "Export lead data to CSV or other formats",
  },

  // Lead Mail
  {
    level: "system",
    resource: "lead_mail",
    action: "create",
    description: "Send emails to any lead in the system",
  },
  {
    level: "system",
    resource: "lead_mail",
    action: "read",
    description: "View email content for any lead",
  },
  {
    level: "system",
    resource: "lead_mail",
    action: "list",
    description: "List all lead emails",
  },
  {
    level: "system",
    resource: "lead_mail",
    action: "update",
    description: "Edit email records for any lead",
  },
  {
    level: "system",
    resource: "lead_mail",
    action: "delete",
    description: "Remove email records from the system",
  },
  {
    level: "system",
    resource: "lead_mail",
    action: "manage",
    description: "Full email management for all leads",
  },
  {
    level: "system",
    resource: "lead_mail",
    action: "export",
    description: "Export lead email data to CSV or other formats",
  },

  // Task
  {
    level: "system",
    resource: "task",
    action: "create",
    description: "Create new tasks in the system",
  },
  {
    level: "system",
    resource: "task",
    action: "read",
    description: "View any task's details regardless of assignment",
  },
  {
    level: "system",
    resource: "task",
    action: "list",
    description: "List all tasks",
  },
  {
    level: "system",
    resource: "task",
    action: "update",
    description: "Edit any task's information and assignments",
  },
  {
    level: "system",
    resource: "task",
    action: "delete",
    description: "Remove tasks from the system permanently",
  },
  {
    level: "system",
    resource: "task",
    action: "manage",
    description: "Full task administration including reassignment",
  },
  {
    level: "system",
    resource: "task",
    action: "export",
    description: "Export task data to CSV or other formats",
  },

  // Contact
  {
    level: "system",
    resource: "contact",
    action: "create",
    description: "Create new contacts in the system",
  },
  {
    level: "system",
    resource: "contact",
    action: "read",
    description: "View any contact's details regardless of assignment",
  },
  {
    level: "system",
    resource: "contact",
    action: "list",
    description: "List all contacts",
  },
  {
    level: "system",
    resource: "contact",
    action: "update",
    description: "Edit any contact's information and assignments",
  },
  {
    level: "system",
    resource: "contact",
    action: "delete",
    description: "Remove contacts from the system permanently",
  },
  {
    level: "system",
    resource: "contact",
    action: "manage",
    description: "Full contact administration including reassignment",
  },
  {
    level: "system",
    resource: "contact",
    action: "export",
    description: "Export contact data to CSV or other formats",
  },

  // Lead Company
  {
    level: "system",
    resource: "lead_company",
    action: "create",
    description: "Create new lead companies in the system",
  },
  {
    level: "system",
    resource: "lead_company",
    action: "read",
    description: "View any lead company's details",
  },
  {
    level: "system",
    resource: "lead_company",
    action: "list",
    description: "List all lead companies with filters and pagination",
  },
  {
    level: "system",
    resource: "lead_company",
    action: "update",
    description: "Edit any lead company's information",
  },
  {
    level: "system",
    resource: "lead_company",
    action: "delete",
    description: "Remove lead companies from the system permanently",
  },
  {
    level: "system",
    resource: "lead_company",
    action: "manage",
    description: "Full lead company administration",
  },
  {
    level: "system",
    resource: "lead_company",
    action: "export",
    description: "Export lead company data to CSV or other formats",
  },

  // Lead User
  {
    level: "system",
    resource: "lead_company_employee",
    action: "create",
    description: "Create new lead user in the system",
  },
  {
    level: "system",
    resource: "lead_company_employee",
    action: "read",
    description: "View any lead user's details",
  },
  {
    level: "system",
    resource: "lead_company_employee",
    action: "list",
    description: "List all lead user with filters and pagination",
  },
  {
    level: "system",
    resource: "lead_company_employee",
    action: "update",
    description: "Edit any lead user's information",
  },
  {
    level: "system",
    resource: "lead_company_employee",
    action: "delete",
    description: "Remove lead user from the system permanently",
  },
  {
    level: "system",
    resource: "lead_company_employee",
    action: "manage",
    description: "Full lead user administration",
  },
  {
    level: "system",
    resource: "lead_company_employee",
    action: "export",
    description: "Export lead user data to CSV or other formats",
  },

  // Site Audit
  {
    level: "system",
    resource: "site_audit",
    action: "create",
    description: "Create new site audits in the system",
  },
  {
    level: "system",
    resource: "site_audit",
    action: "read",
    description: "View any site audit's details and results",
  },
  {
    level: "system",
    resource: "site_audit",
    action: "list",
    description: "List all site audits with filters and pagination",
  },
  {
    level: "system",
    resource: "site_audit",
    action: "update",
    description: "Edit any site audit's information",
  },
  {
    level: "system",
    resource: "site_audit",
    action: "delete",
    description: "Remove site audits from the system permanently",
  },
  {
    level: "system",
    resource: "site_audit",
    action: "manage",
    description: "Full site audit administration",
  },
]

export const permissionsData: CreatePermissionType[] = [
  ...selfPermissions,
  ...systemPermissions,
]

export async function seedPermission(
  db: DatabaseType
): Promise<Array<PermissionDataModel>> {
  console.log("🌱 Seeding permissions...")

  const permissions = await insertChunkedReturning(
    permissionsData.map((p) => ({
      ...p,
      level: p.level,
      resource: p.resource,
      action: p.action,
    })),
    (chunk) => db.insert(PermissionTable).values(chunk).returning()
  )

  console.log(`✅ ${permissions.length} Permissions seeded`)
  return permissions
}
