import { DEFAULT_AUTH_PATH } from "@/constants"
import type { PermissionType } from "@/db/seed/permission.seed"
import { getDB } from "@/lib/db"
import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "./auth.server"
import { getUserRolesAndPermission } from "./getUserPermission"
import { hasPermission } from "./permission"

export function requirePermissions(
  userPermissions: Array<PermissionType>,
  inputPermissions: Array<PermissionType>,
  userId?: string
) {
  const isAllowed = hasPermission(userPermissions, inputPermissions, {
    userId,
  })
  if (!isAllowed) {
    throw redirect({
      href: DEFAULT_AUTH_PATH,
      replace: true,
    })
  }
}

export const requireSessions = createServerFn({ method: "GET" }).handler(
  async () => {
    const requestHeaders = getRequestHeaders()

    const headers = new Headers()

    const cookie = requestHeaders.get("cookie")
    if (cookie) headers.set("cookie", cookie)
    const userAgent = requestHeaders.get("user-agent")
    if (userAgent) headers.set("user-agent", userAgent)

    const authSession = await auth.api.getSession({ headers })

    if (!authSession) {
      return null
    }

    const rolesPermissions = await getUserRolesAndPermission(
      authSession.user.id,
      getDB()
    )

    return {
      user: authSession.user,
      session: authSession.session,
      roles: rolesPermissions.roles,
      permissions: rolesPermissions.permissions,
    }
  }
)
