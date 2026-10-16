import { hasPermission } from "@/features/auth/permission"
import { useAuthStore } from "@/stores/zustand/auth/AuthStoreContext"
import type { PermissionType } from "@/types"

export function usePermissionCheck(permissions: Array<PermissionType>) {
  const userPermissions = useAuthStore((state) => state.permissions)
  const authUser = useAuthStore((state) => state.user)

  const isAllowd = hasPermission(userPermissions, permissions, {
    userId: authUser.id,
  })

  return isAllowd
}
