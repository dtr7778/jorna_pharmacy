import type { DatabaseType } from "../clients/drizzle-client";
import type {
  PermissionDataModel,
  RoleDataModel,
  RolePermissionDataModel,
} from "../schemas";
import { RolePermissionTable } from "../schemas";
import type { RoleEnumType } from "../schemas/enums/zod-db-enums";
import type { PermissionType } from "./permission.seed";
import { insertChunkedReturning } from "./seed-utils";

export const rolesAndPermissionData: Array<{
  roleName: RoleEnumType;
  permissions: Array<PermissionType>;
}> = [
  // ==================== SYSTEM ROLES ====================
  {
    roleName: "USER",
    permissions: [
      // Can manage their own profile and create/join organizations
      { level: "self", resource: "user", action: "read" },
      { level: "self", resource: "user", action: "update" },
      { level: "self", resource: "invitation", action: "list" },
      { level: "self", resource: "invitation", action: "update" }, // Accept/decline invites
      { level: "system", resource: "task", action: "manage" },
    ],
  },
  {
    roleName: "SUPPORT_AGENT",
    permissions: [
      // Self permissions
      { level: "self", resource: "user", action: "read" },
      { level: "self", resource: "user", action: "update" },

      // Cross-org read-only user/org support
      { level: "system", resource: "user", action: "read" },
      { level: "system", resource: "user", action: "list" },
      { level: "system", resource: "task", action: "manage" },

      // Contact permissions
      { level: "system", resource: "contact", action: "read" },
      { level: "system", resource: "contact", action: "list" },

      // Lead Company permissions
      { level: "system", resource: "lead_company", action: "read" },
      { level: "system", resource: "lead_company", action: "list" },

      // Lead Employee permissions
      { level: "system", resource: "lead_company_employee", action: "read" },
      { level: "system", resource: "lead_company_employee", action: "list" },

      // Site audit permissions
      { level: "system", resource: "site_audit", action: "read" },
      { level: "system", resource: "site_audit", action: "list" },
    ],
  },
  {
    roleName: "ADMIN",
    permissions: [
      // Self permissions
      { level: "self", resource: "user", action: "read" },
      { level: "self", resource: "user", action: "update" },

      { level: "system", resource: "role_permission", action: "list" },
      { level: "system", resource: "role_permission", action: "read" },

      // System user management
      { level: "system", resource: "user", action: "read" },
      { level: "system", resource: "user", action: "list" },
      { level: "system", resource: "user", action: "update" },
      { level: "system", resource: "task", action: "manage" },

      // Contact permissions
      { level: "system", resource: "contact", action: "read" },
      { level: "system", resource: "contact", action: "list" },
      { level: "system", resource: "contact", action: "create" },
      { level: "system", resource: "contact", action: "update" },
      { level: "system", resource: "contact", action: "delete" },

      // Lead Company permissions
      { level: "system", resource: "lead_company", action: "read" },
      { level: "system", resource: "lead_company", action: "list" },
      { level: "system", resource: "lead_company", action: "create" },
      { level: "system", resource: "lead_company", action: "update" },
      { level: "system", resource: "lead_company", action: "delete" },

      // Lead Employee permissions
      { level: "system", resource: "lead_company_employee", action: "read" },
      { level: "system", resource: "lead_company_employee", action: "list" },
      { level: "system", resource: "lead_company_employee", action: "create" },
      { level: "system", resource: "lead_company_employee", action: "update" },
      { level: "system", resource: "lead_company_employee", action: "delete" },

      // Site audit permissions
      { level: "system", resource: "site_audit", action: "read" },
      { level: "system", resource: "site_audit", action: "list" },
      { level: "system", resource: "site_audit", action: "create" },
      { level: "system", resource: "site_audit", action: "update" },
      { level: "system", resource: "site_audit", action: "delete" },
    ],
  },
  {
    roleName: "SUPER_ADMIN",
    permissions: [
      { level: "self", resource: "user", action: "read" },
      { level: "self", resource: "user", action: "update" },

      { level: "system", resource: "role_permission", action: "list" },
      { level: "system", resource: "role_permission", action: "read" },

      { level: "system", resource: "user", action: "manage" },
      { level: "system", resource: "task", action: "manage" },

      // Contact permissions
      { level: "system", resource: "contact", action: "manage" },
      { level: "system", resource: "contact", action: "export" },

      // Lead Company permissions
      { level: "system", resource: "lead_company", action: "manage" },
      { level: "system", resource: "lead_company", action: "export" },

      // Lead Employee permissions
      { level: "system", resource: "lead_company_employee", action: "manage" },
      { level: "system", resource: "lead_company_employee", action: "export" },

      // Site audit permissions
      { level: "system", resource: "site_audit", action: "manage" },
    ],
  },
];

export async function seedRolePermission(
  db: DatabaseType,
  roles: Array<RoleDataModel>,
  permissions: Array<PermissionDataModel>
): Promise<Array<RolePermissionDataModel>> {
  console.log("🌱 Seeding role permissions...");

  const rolePermissionRows = rolesAndPermissionData.flatMap((r) => {
    const role = roles.find(({ roleName }) => roleName === r.roleName);

    if (!role) return [];

    const permissionsForRole = permissions
      .filter((permission) =>
        r.permissions.some(
          (rp) =>
            rp.level === permission.level &&
            rp.resource === permission.resource &&
            rp.action === permission.action
        )
      )
      .map(({ id }) => ({
        roleId: role.id,
        permissionId: id,
      }));

    console.log(
      `📝 Assigning ${permissionsForRole.length} permissions to ${r.roleName}`
    );

    return permissionsForRole;
  });

  const rolesAndPermissions = await insertChunkedReturning(
    rolePermissionRows,
    (chunk) => db.insert(RolePermissionTable).values(chunk).returning()
  );

  console.log(`✅ ${rolesAndPermissions.length} Role permissions seeded`);
  return rolesAndPermissions;
}
