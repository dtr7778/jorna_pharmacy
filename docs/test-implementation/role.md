# Roles and Permissions — Test Implementation

Scope: `src/features/role/**` — the role oRPC contract and `listRole` procedure, plus the
role table and permission-cell UI. Role and permission **tables**, **seeds**, and the
shared permission evaluator live outside this document and are cross-linked in
[Adjacent ownership](#adjacent-ownership).

ID prefix: `ROLE-`. IDs are stable; never renumber.

## Source map

| File                                                              | Responsibility                                                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/features/role/api/role.contract.ts`                          | `listRole` contract: GET `/roles/list`, no input, `apiOutputSchema` of role rows with counts and permission enums |
| `src/features/role/api/role.procedure.ts`                         | `listRole` handler: auth middleware, `system:role_permission:list` permission, SQL join/aggregate                 |
| `src/features/role/api/role.router.ts`                            | Mounts `listRole` on the root router as `role.listRole`                                                           |
| `src/features/role/components/role-table/RoleManagementTable.tsx` | Client container: `useQuerySearch`, `role.listRole` query, loading/empty/error boundary, forwards filters         |
| `src/features/role/components/role-table/RoleTable.tsx`           | TanStack Table wiring (`pageCount: 1`, pagination hidden)                                                         |
| `src/features/role/components/role-table/roleTableColumn.tsx`     | Column definitions: role label, description, total users badge, permissions cell                                  |
| `src/features/role/components/role-table/PermissionsCell.tsx`     | Permission badges, "Empty" state, tooltip descriptions, `+N more` popover                                         |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 18     |
| **Total**   | **18** |

Existing test files in scope: **none**.

`src/features/role/**` contains no `*.test.*`, `*.spec.*`, or `*.stories.*` file, and no
test elsewhere asserts role-listing behavior. The `role` columns used in
`src/db/utils/paginate-query/buildPaginateOptions.test.ts` are fixture columns unrelated
to this feature.

## Test environment and mocks

- **Contract cases** are pure `zod` parsing. Import the contract's output schema (or
  `zocker`-free object literals) and assert accept/reject. No DB.
- **Procedure cases** need a real SQLite engine: the handler uses a four-table left join
  with `COUNT(DISTINCT ...)` and `json_group_array(... ) FILTER (WHERE ...)`, which the
  repo's `@variablesoftware/mock-d1` dev dependency does not implement. Build an
  in-memory database with `@libsql/client` (`url: ":memory:"`) +
  `drizzle-orm/libsql`, apply `migrations/` via `drizzle-orm/libsql/migrator`
  (`migrate(db, { migrationsFolder: "./migrations" })`), then cast the instance to
  `DatabaseType` for `ORPCContext`. Record the cast reason in the helper; if this becomes
  painful, extract the aggregate query instead of weakening the test.
- Invoke the procedure through `createRouterClient(roleRouter, { context })` from
  `@orpc/server` (or call `listRoleProcedure` directly). Assert `ORPCError`
  `code`/`status`, not message text alone.
- **Auth context:** when `context.session` and `context.user` are both set,
  `getAuthData` never calls better-auth. Seed `context.roles` and `context.permissions`
  as well, because `getRolePermissionData` only reuses the context when **both** arrays
  are non-empty. For the unauthenticated case, set both to `null` and mock
  `@/features/auth/auth.server` so `auth.api.getSession` resolves `null`; never hit the
  network.
- Use fixed UUID strings for every inserted row. `db_id` defaults come from
  `crypto.randomUUID()` on the client side, so pass IDs explicitly. Do not assert
  `createdAt`/`assignedAt` (not exposed by the contract) and do not depend on the clock.
- **Permission order is unspecified.** The query has no `ORDER BY` inside
  `json_group_array`, so compare permissions as a set keyed by `id`, not by array order.
- **Component cases** use jsdom + Testing Library at `test/setup.ts`. `PermissionsCell`
  needs no router. `RoleManagementTable` needs a `QueryClientProvider`, plus mocks for
  `@/server/orpc` (`orpcTQClient.role.listRole.queryOptions`) and
  `@/hooks/use-query-search` (it calls `getRouteApi(...)` and requires router context).
  Base UI popovers/tooltips render through portals into `document.body`, so query with
  `screen`/`document.body` and `await` the open state.
- Do not assert Tailwind classes (`capitalize`, colors). Assert rendered text and
  accessible roles.

## Adjacent ownership

- `src/features/auth/permission.ts` (`hasPermission`, `manage` expansion) → `auth.md`.
  Role gating cases below assert only the outcome of using it.
- `src/db/seed/permission.seed.ts`, `src/db/seed/rolePermission.seed.ts` → `db-seed.md`.
- `src/db/schemas/table/role-permission/**` → out of scope by project decision; the
  unique indexes are referenced in cases as intended constraints, not tested here.
- `/dashboard/roles` route gating (`requirePermissions`) → `routes.md`; the procedure-level
  gate is tested here, the redirect is tested there.

## Contract

### ROLE-001 · `listRole` output requires the API envelope and numeric counts

- **Covers:** `listRoleContract` — `src/features/role/api/role.contract.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a payload `{ message: "Roles loaded successfully.", success: true, data: [{ id, roleName: "ADMIN", description: "…", totalUsers: 2, permissions: [] }] }`
- **When** the `listRole` output schema parses it
- **Then** parsing succeeds and the parsed row keeps exactly `id`, `roleName`,
  `description`, `totalUsers`, `permissions`
- **Notes:** also assert rejection when `totalUsers` is the string `"2"` (the contract
  declares `z.number()`), and that `data: []` is valid. The message is
  `API_MESSAGES.USER.ROLE.GET_ALL`; assert it against the constant, not a literal copy.

### ROLE-002 · Permission entries are restricted to the permission catalog

- **Covers:** `listRoleContract` permission schema — `src/features/role/api/role.contract.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a permission entry `{ id, description: null, level: "system", action: "list", resource: "role_permission" }`
- **When** the output schema parses it
- **Then** it is accepted, and entries with `level: "global"`, `action: "approve"`, or
  `resource: "invoice"` are rejected
- **Notes:** the three enums come from `PERMISSION_LEVEL`, `ACTION_TYPE`, and
  `RESOURCE_TYPE` in `src/db/schemas/enums/enum-values.ts`; assert acceptance for every
  value in each list rather than a hand-picked sample. `description` is nullable. Also
  assert `roleName: "OWNER"` is rejected, since `selectRoleSchema` derives
  `z.enum(ROLES)` from the column enum.

## List procedure

### ROLE-010 · An empty roles table returns an empty data array

- **Covers:** `listRoleProcedure` — `src/features/role/api/role.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an authorized caller and no rows in `roles`
- **When** `role.listRole` is called
- **Then** the response is `{ success: true, message: "Roles loaded successfully.", data: [] }`

### ROLE-011 · A populated role reports distinct user count and its permissions

- **Covers:** `listRoleProcedure`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** role `ADMIN` linked to two users and three permissions
- **When** `role.listRole` is called
- **Then** exactly one row is returned with `totalUsers: 2` and three permission entries
  carrying the seeded `id`, `level`, `action`, `resource`, and `description`
- **Notes:** compare permissions as a set keyed by `id`; the query does not order them.
  Verify `totalUsers` is a number, not the string SQLite can return for aggregates.
  Seeded permissions must satisfy the unique `(level, resource, action)` index.

### ROLE-012 · Roles without users or permissions still appear

- **Covers:** `listRoleProcedure`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a role with no `user_roles` and no `role_permissions` rows, alongside one populated role
- **When** `role.listRole` is called
- **Then** the empty role is present with `totalUsers: 0` and `permissions: []`
- **Notes:** proves the left joins are not inner joins, that `COALESCE(COUNT(DISTINCT …), 0)`
  is used, and that the `FILTER (WHERE permission.id IS NOT NULL)` aggregate is parsed
  from `"[]"` to `[]`.

### ROLE-013 · Grouping keeps each role's permissions separate

- **Covers:** `listRoleProcedure`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** roles `USER` and `ADMIN` with disjoint permission sets and different user counts
- **When** `role.listRole` is called
- **Then** exactly two rows are returned and each row's permissions contain only that
  role's links; neither `totalUsers` includes the other role's users
- **Notes:** guards against a missing/incorrect `groupBy` and against join fan-out leaking
  across roles.

### ROLE-014 · A permission appears once even when a role has several users

- **Covers:** `listRoleProcedure` — `jsonGroupArray` usage
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** one role with two users and two permissions
- **When** `role.listRole` is called
- **Then** the row has `totalUsers: 2` and exactly two permission entries with unique `id`s
- **Notes:** **Known defect risk.** The query calls `jsonGroupArray(...)` without the
  `distinct` option over the `user_roles × role_permissions` cartesian product, so today
  the array most likely contains four entries (each permission repeated per user).
  `totalUsers` is already `COUNT(DISTINCT …)`. Either fix the aggregate
  (`json_group_array(DISTINCT json_object(...))` or a correlated subquery) or change this
  case to assert the duplicated shape with a written rationale. Do not leave the intended
  contract undocumented.

## Auth and permission gating

### ROLE-020 · Unauthenticated callers get 401

- **Covers:** `roleImpl` + `authMiddleware` — `src/features/role/api/role.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a context with `session: null`, `user: null` and `auth.api.getSession` resolving `null`
- **When** `role.listRole` is called
- **Then** it rejects with `ORPCError` code `UNAUTHORIZED` and status `401`
- **Notes:** assert the handler/DB is never reached (spy on the query or the DB client).

### ROLE-021 · A user without `role_permission:list` gets 403

- **Covers:** `userPermissionMiddleware` on `listRole`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** an authenticated `USER` context with only `{ level: "self", resource: "user", action: "read" }`
- **When** `role.listRole` is called
- **Then** it rejects with `ORPCError` `FORBIDDEN` / `403`
- **Notes:** also cover a caller holding `system:role_permission:read` or `update` but not
  `list`; neither should grant this endpoint.

### ROLE-022 · `system:role_permission:list` grants access

- **Covers:** `listRoleProcedure`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** an authenticated context whose permissions include `{ level: "system", resource: "role_permission", action: "list" }`
- **When** `role.listRole` is called
- **Then** the request succeeds and returns the roles payload
- **Notes:** use a `SUPER_ADMIN`-shaped context so `roles` is non-empty; the middleware
  requires a role to resolve permissions when context is incomplete.

### ROLE-023 · `manage` acts as a wildcard over `list`

- **Covers:** `listRoleProcedure` + `hasPermission` `manage` expansion
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an authenticated `SUPER_ADMIN` context with only `{ level: "system", resource: "role_permission", action: "manage" }`
- **When** `role.listRole` is called
- **Then** it succeeds without an explicit `list` row
- **Notes:** documents the dependency on `buildPermissionMap` expanding `manage` to every
  `ActionTypeEnumSchema` option. If `self:role_permission:manage` is supplied instead, the
  call must still fail, because the map key includes the level.

### ROLE-024 · A session with no assigned role produces 401 — decide the contract

- **Covers:** `authMiddleware` → `getRolePermissionData` → `getUserRolesAndPermission`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an authenticated user whose `user_roles` query returns no rows (and an empty context permission cache)
- **When** `role.listRole` is called
- **Then** the request currently rejects with `UNAUTHORIZED` / `401`, because
  `getUserRolesAndPermission` throws `Error("User has no system role")` and
  `getRolePermissionData` swallows it into `null`
- **Notes:** **Decision required.** The caller is authenticated, so `403 FORBIDDEN` is the
  usual answer; `401` tells the client to re-authenticate. Write the test against the
  agreed behavior and, if the behavior changes, keep the reason in this case. Also note
  that any real error inside the role lookup is currently indistinguishable from "no
  session".

## Role management gaps

### ROLE-030 · Role create/update/delete is not implemented — confirm that is intended

- **Covers:** `roleContract` / `roleRouter` — `src/features/role/api/role.contract.ts`, `role.router.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** the role feature exposes only `listRole`
- **When** an actor with `role_permission:manage` needs to add, rename, or delete a role
- **Then** no contract, procedure, or client hook exists, and the UI offers no action
- **Notes:** **Decision required.** If role management is read-only for this release, record
  that here as the accepted scope and delete this case in a dedicated cleanup. If CRUD is
  planned, replace it with cases covering: unique `roleName` (duplicate → 409/conflict),
  role name restricted to `ROLES`, description optional, delete blocked while
  `user_roles` rows reference the role (the FK cascades, so a silent mass unassignment is
  the risk to guard), and the permission gate (`create`/`update`/`delete`).

### ROLE-031 · Duplicate or unknown permission assignment is not rejected anywhere

- **Covers:** role API write path (absent) — `src/features/role/api/`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a role already linked to permission `P`, and a second permission id that does
  not exist
- **When** an assignment request is attempted
- **Then** no request can be made today; the only protections are the
  `role_permission_unique` and `role_permission_permission_fkey` constraints
- **Notes:** **Decision required.** When an assign/remove procedure is added, assert that
  duplicates are rejected idempotently (not doubled), unknown permission ids produce a
  client error, and a partially invalid batch writes nothing (wrap in a transaction).
  `baseContract` defines no `CONFLICT` or `NOT_FOUND` error, so a raw constraint violation
  would surface as `500` through `errorMiddleware`; the expected error code must be
  specified before the test can assert it. This is the write-path counterpart of ROLE-014.

## Components

### ROLE-040 · `PermissionsCell` shows "Empty" and formats badge labels

- **Covers:** `PermissionsCell` — `src/features/role/components/role-table/PermissionsCell.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** `permissions: []` in one render, and a single `{ resource: "role_permission", action: "list", description: "List all roles" }` in another
- **When** the cell renders
- **Then** the empty render shows the text `Empty`, and the populated render shows
  `Role Permission - list`
- **Notes:** the label is `formatEnumValue(resource)` plus the **raw** action, so casing is
  `Role Permission - list`, not `… - List`; do not rely on the `capitalize` class. With a
  non-null description the badge is a tooltip trigger — assert the description appears
  only after hover/focus, and that a null description renders no tooltip. Base UI renders
  tooltip content in a portal, so await it.

### ROLE-041 · More than four permissions collapse into a popover

- **Covers:** `PermissionsCell`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** six permissions with unique ids
- **When** the cell renders
- **Then** four badges are visible, a `+2 more` button is present, and activating it
  reveals the remaining two labels
- **Notes:** `MAX_VISIBLE` is 4, so exactly five permissions already collapses. Assert
  that hidden labels are absent before activation and that the popover contains only the
  hidden two. The cell keys badges by `perm.id`; duplicate ids (see ROLE-014) will collapse
  or warn, so use unique ids in fixtures.

### ROLE-042 · The role table renders each row with formatted values

- **Covers:** `RoleTable`, `roleTableColumn` — `.../RoleTable.tsx`, `.../roleTableColumn.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** rows for `SUPER_ADMIN` with 3 users and `USER` with 1 user
- **When** `RoleTable` renders with page/limit filters
- **Then** headers `Role`, `Description`, `Total Users`, `Permissions` are present; each
  role name is formatted (`Super Admin`, `User`); the user counts read `3 users` and
  `1 user`; and no pagination controls are rendered
- **Notes:** **Known defect risk.** The cell renders `` `${totalUsers} users` ``
  unconditionally, so singular currently reads `1 users`. Write the case for `1 user` and
  accept that the implementation must change (or document pluralization as out of scope
  and assert `1 users`). `showPagination={false}` is passed explicitly, so assert the
  absence of next/previous controls rather than their disabled state. Header cells for
  `Description` and `Total Users` are dropdown triggers because those columns can be
  hidden; query by text, not by a sort button.

### ROLE-043 · The management table maps query states to the right fallback

- **Covers:** `RoleManagementTable` — `.../RoleManagementTable.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a mocked `role.listRole` query
- **When** the query is pending, resolves to `data: []`, and rejects, respectively
- **Then** pending shows the table skeleton (no role table), empty shows `No data`, and
  error shows `Something Went Wrong` together with the error message
- **Notes:** loading is rendered by `QueryStateBoundary` before the empty check, so also
  cover `data: undefined` with `isLoading: false`, which falls into the empty branch.
  Success is covered by ROLE-042. `useQuerySearch` must be mocked with filters including
  `page`, `limit`, `search`, `order`, `orderField`; assert the table receives them. The
  container's `setFilters` wrapper only forwards `page`, `limit`, `order`, `orderField` —
  `search` survives because `useQuerySearch` merges previous params, but any future
  `filter` value would be dropped; do not assert column-filter propagation that the
  current code does not implement.
