# Users — Test Implementation

Scope: `src/features/user/**` — the user API (list/search/details/stats, role
assignment, profile update), the user Zod schemas, and the user table, dialog and
form components.

## Source map

| File                                                               | Responsibility                                                                                                                                                                       | Cases                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `src/features/user/api/user.contract.ts`                           | Defines `user.list`, `user.listUserForSearch`, `user.stats`, `user.updateRole`, `user.updateProfile`, `user.details`; list/search/order whitelists; output envelopes and `NOT_FOUND` | USR-001 – USR-011                                       |
| `src/features/user/api/user.procedure.ts`                          | Handlers, auth/permission middleware, stats aggregation, role replacement, profile update through better-auth                                                                        | USR-001 – USR-011                                       |
| `src/features/user/api/user.router.ts`                             | Wires the six procedures into `userRouter`                                                                                                                                           | USR-001 – USR-011 (indirect)                            |
| `src/features/user/api/user.api.hook.ts`                           | `useRoleUpdate` toast + list invalidation; `useProfileUpdate` auth-store sync, toast and field-error mapping                                                                         | USR-018, USR-019                                        |
| `src/features/user/user.schema.ts`                                 | `userUpdateSchema` (currently unused), `roleUpdateSchema`, `profileUpdateSchema`                                                                                                     | USR-012, USR-013                                        |
| `src/features/user/user.api-schema.ts`                             | `roleColumnSql`, `userProfileColumns`, `roleSqlSchema`, `userProfileSchema`                                                                                                          | USR-001, USR-011                                        |
| `src/features/user/components/UserStats.tsx`                       | Stats card grid and growth-label formatting                                                                                                                                          | USR-021                                                 |
| `src/features/user/components/ProfileUpdateForm.tsx`               | Self-service name form with disabled email                                                                                                                                           | USR-019                                                 |
| `src/features/user/components/UserSelectorField.tsx`               | Async single/multiple user selector with chip removal                                                                                                                                | No dedicated case — see [Coverage gaps](#coverage-gaps) |
| `src/features/user/components/UserUpdateDialog.tsx`                | Edit dialog; hides ban form for the signed-in user                                                                                                                                   | USR-015                                                 |
| `src/features/user/components/user-details/DetailsStep.tsx`        | User details card (name, email verification, dates)                                                                                                                                  | USR-020                                                 |
| `src/features/user/components/forms/UserRoleUpdateForm.tsx`        | Role select, dirty-state submit gate, validation errors                                                                                                                              | USR-018                                                 |
| `src/features/user/components/forms/UserBannedForm.tsx`            | Ban/unban switch, reason and expiry, better-auth admin client calls                                                                                                                  | USR-016, USR-017                                        |
| `src/features/user/components/user-table/UserTableRowAction.tsx`   | Permission-gated edit dialog plus view-details link                                                                                                                                  | USR-014                                                 |
| `src/features/user/components/user-table/userTableColumn.tsx`      | Name, roles, banned, verified, last-login and action columns                                                                                                                         | USR-014                                                 |
| `src/features/user/components/user-table/UsersTable.tsx`           | Binds list data and filters to `useDataTable`                                                                                                                                        | USR-014, USR-022                                        |
| `src/features/user/components/user-table/UserManagementTable.tsx`  | List query, 500 ms debounced global search, filter propagation                                                                                                                       | USR-022                                                 |
| `src/features/user/components/user-table/cells/UserBannedCell.tsx` | Banned badge and hover-card reason/expiry                                                                                                                                            | USR-014                                                 |

Existing test files in this scope: **none**. No Storybook stories exist, so no case
can be sourced from a play function.

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 22     |
| **Total**   | **22** |

## Test environment

- **Runner:** `pnpm test` (Vitest, jsdom project from `vitest.config.ts`,
  `test/setup.ts` provides Testing Library cleanup).
- **Schema cases:** pure `safeParse` assertions; no database, Query client or React.
- **Component cases:** Testing Library. Required wrappers:
  - `QueryClientProvider` with retries disabled and a fresh cache per test;
  - `AuthStoreProvider` seeded with `user`, `session`, `roles`, `permissions`,
    `isAdminUser` (components call `useAuthStore`, which throws outside the provider);
  - mock `@/server/orpc` (`orpcTQClient.user.*.queryOptions`, `mutationOptions`,
    `queryKey`) or `@/hooks/use-query-search`, so no real RPC or router tree is needed;
  - mock `@/features/auth/auth.client` for `admin.banUser` / `admin.unbanUser`;
  - mock `react-hot-toast` and assert toast calls where the case says so;
  - fixed `Date` (fake timers) and `TZ`, because table/detail/stats formatting is
    timezone-sensitive.
- **API integration cases:** no harness exists yet. They require:
  - a D1-compatible SQLite database with the repo migrations applied and the role
    seed (`roles`, `role_permissions`) loaded;
  - invocation through `createRouterClient(userRouter, { context: () => ctx })`
    (the same helper the server client uses in `src/server/orpc.ts`);
  - an injected `ORPCContext` with `db`, `reqHeaders`, `user`, `session`, `roles`
    and `permissions`. Supplying non-null `user` and `session` bypasses
    `auth.api.getSession`; supplying **both** `roles` and `permissions` non-empty
    bypasses the DB permission lookup in `getRolePermissionData`.
  - `user_sessions` rows require a matching `sessions` row because of the foreign
    key; `lastLogin` assertions must insert those fixtures.
  - For the 401 case, set `user`/`session` to `null` and stub `auth.api.getSession`
    to return `null`.
- Use fixed UUIDs and a frozen clock. Never depend on real "now" for the 5-minute,
  7-day, 30-day and 24-hour stats windows.

## API

### USR-001 · List returns a page of users with roles and last login

- **Covers:** `listUserProcedure`, `user.list`, `roleColumnSql` —
  `src/features/user/api/user.procedure.ts`, `src/features/user/api/user.contract.ts`,
  `src/features/user/user.api-schema.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** two users, each with a `user_roles` row (Alice `ADMIN`, Bob `EMPLOYEE`),
  and Alice has two `user_sessions` rows with different `loginAt` values; the caller
  holds `system:user:list`
- **When** `user.list` is called with `{}`
- **Then** the response is `success: true` with message `"Users loaded successfully."`,
  `data` has both users, Alice's `roles` contains an entry with `roleName: "ADMIN"`,
  Alice's `lastLogin` equals the later session time, Bob's `lastLogin` is `null`, and
  `meta` reports `currentPage: 1`, `queryCount: 2`, `totalCount: 2`, `pageCount: 1`,
  `isFirstPage: true`, `isLastPage: true`
- **Notes:** assert by user id, not array order (`orderBy` falls back to `sql\`1\``).
Contract output validates `lastLogin`as`Date | null`; a raw string from `max()`
  would fail output validation.

### USR-002 · List applies search, ordering and input validation

- **Covers:** `listUserProcedure`, `paginateInputSchema` usage, list contract input
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** users `"Napa Extra"`, `"alice@example.com"` and `"Zed"`, all with roles
- **When** `user.list` is called with `search: "  NAP  "` and
  `searchFields: ["name", "email"]`
- **Then** only `"Napa Extra"` is returned (input is trimmed and lowercased, `LIKE` is
  ASCII case-insensitive)
- **And when** called with `orderField: "name", order: "desc"`
- **Then** rows are returned in descending name order
- **And when** called with `search: "nap"` but no `searchFields`
- **Then** every user is returned, because no searchable columns are resolved
- **And when** called with `searchFields: ["password"]`, `page: 0`, `limit: 0`, or
  `orderField: "role"`
- **Then** the call rejects with `INPUT_VALIDATION_FAILED` (status 422) and the
  offending path in `data.fieldErrors`
- **Notes:** the handler requires `searchFields` to be passed; this is a contract
  footgun for new callers. `%` and `_` in `search` are not escaped (see
  [DBU-044](./db-utils.md)). Validation message is the prettified Zod message, not
  `API_MESSAGES.GENERAL.INPUT_VALIDATION_FAILED`.

### USR-003 · List pagination counts users that the query excludes

- **Covers:** `listUserProcedure` total count and role joins
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** two users with role rows and one user with no `user_roles` row, and a
  search that matches one of the role-assigned users
- **When** `user.list` is called with that search
- **Then** `data` excludes the role-less user (the handler uses `innerJoin` on
  `user_roles`) while `meta.totalCount` still includes them, because
  `$count(UserTable)` has no `where` clause
- **Notes:** asks for a decision: should `totalCount` be the filtered count, and
  should role-less users appear with `roles: []`? Today `user.stats.totalUsers`
  counts role-less users too, so the two screens disagree. `buildPaginationMeta`
  uses `queryCount` for `pageCount` unless `queryCount === limit`, which can hide or
  inflate the mismatch for full pages. Type this case as the contract-level decision
  once answered.

### USR-004 · Protected user procedures reject unauthenticated and unauthorized callers

- **Covers:** `authMiddleware`, `userPermissionMiddleware` on list, details,
  updateRole and listUserForSearch
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a context with `user: null` and `session: null`
- **When** each of `user.list`, `user.details`, `user.updateRole` and
  `user.listUserForSearch` is called
- **Then** each rejects with `UNAUTHORIZED` (401, `"Please login to continue."`)
- **Given** an authenticated caller whose only permission is `self:user:update`
- **When** the same four procedures are called
- **Then** each rejects with `FORBIDDEN` (403,
  `"You don't have permission to perform this action."`)
- **Given** a caller with `system:user:read` but no `list`/`manage`
- **When** `user.details` is called
- **Then** it succeeds, while `user.list` still rejects with 403
- **Notes:** auth middleware runs before permission middleware. The stats role gate
  is covered by USR-010. Inject both `roles` and `permissions` to avoid DB lookups.

### USR-005 · Details returns the user and last login, or 404

- **Covers:** `userDetailsProcedure`, `user.details`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** Alice exists and has two sessions; the caller holds `system:user:read`
- **When** `user.details` is called with Alice's id
- **Then** the response message is `"User details loaded successfully."`, all
  `selectUserSchema` fields are returned, and `lastLogin` is the latest `loginAt`
- **Given** Bob has no sessions
- **When** details is requested for Bob
- **Then** `lastLogin` is `null`
- **Given** an unknown UUID
- **When** details is requested
- **Then** it rejects with `NOT_FOUND` (404, `"User not found."`)
- **Given** a malformed UUID
- **Then** the call rejects with `INPUT_VALIDATION_FAILED` before the handler runs
- **Notes:** details intentionally returns no `roles` array; do not assert one.

### USR-006 · Role update replaces all assignments and reports missing records

- **Covers:** `updateUserRoleProcedure`, `user.updateRole`, `RoleTable`,
  `UserRoleTable`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** the target user currently has `ADMIN` and `EMPLOYEE` assignments, the
  caller holds `system:user:update`, and roles `USER`, `ADMIN`, `EMPLOYEE` exist
- **When** `user.updateRole` is called with `{ userId, roleName: "USER" }`
- **Then** all prior `user_roles` rows for the target are deleted, exactly one `USER`
  row remains, the response is `{ success: true, message: "User updated successfully.",
data: null }`, and a follow-up list/details call reflects only `USER`
- **Given** an unknown user id
- **Then** the call rejects with 404 `"User not found."`
- **Given** a valid role enum value with no matching `roles` row
- **Then** the call rejects with 404 `"Role not found."` and the existing assignments
  are untouched (the role lookup happens before the delete)
- **Notes:** delete-then-insert is not wrapped in a transaction, so a failed insert
  leaves the user with no role. Multi-role assignments cannot be preserved by this
  endpoint or its UI, which edits only `roles[0]`. Consider a dedicated case if
  multi-role support is intended.

### USR-007 · Role assignment is allowed for `update`, not only `manage`

- **Covers:** `updateUserRoleProcedure` permission requirements
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a caller with the seeded `USER` permissions (`self:user:read`,
  `self:user:update`, no system user permission)
- **When** `user.updateRole` targets another user
- **Then** the call rejects with 403
- **Given** a caller with the seeded `ADMIN` permissions
  (`system:user:read`, `system:user:list`, `system:user:update`, no `manage`)
- **When** the same call runs
- **Then** it succeeds
- **Given** a caller with `system:user:manage`
- **Then** it also succeeds (`manage` satisfies the `update` requirement)
- **Notes:** the role seed comments say role assignment is reserved for super
  admins, but the middleware accepts `system:user:update`. Flag this as a decision:
  require `system:user:manage` for role changes or update the documentation.
  `hasPermission` is called with only `{ userId }`, no `resourceId`, so `self`
  ownership is not evaluated for these system-level requirements.

### USR-008 · Profile update changes the name through better-auth and ignores email

- **Covers:** `profileUpdateProcedure`, `user.updateProfile`, `profileUpdateSchema`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** the signed-in user's stored name is `"Old Name"` and email is
  `"user@example.com"`; the caller holds `self:user:update`; `auth.api.updateUser`
  is stubbed to persist the submitted name
- **When** `user.updateProfile` is called with
  `{ name: "New Name", email: "user@example.com" }`
- **Then** `auth.api.updateUser` receives `body: { name: "New Name" }` (no email) and
  `headers: context.reqHeaders`, the response message is
  `"Profile updated successfully."`, and `data` is the re-read row with the new name
- **Given** the input email differs from the stored email
- **Then** the stored email is unchanged (email changes are disabled in the auth
  config)
- **Notes:** the handler re-reads the user from `context.db` after the auth call, so
  the stub must persist the update or the response is stale. An end-to-end variant
  would use a real better-auth session and request headers.

### USR-009 · Profile update requires `self` permission, not a system user permission

- **Covers:** `profileUpdateProcedure` permission list
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** the caller has the seeded `ADMIN`/`SUPER_ADMIN` permissions, including
  `self:user:update`
- **When** `user.updateProfile` is called for themselves
- **Then** the call succeeds
- **Given** a custom principal with only `system:user:manage` (no `self:user:update`
  or `self:user:manage`)
- **When** the same call runs
- **Then** it rejects with 403
- **Notes:** asks for a decision: should a system-level user manager be able to edit
  their own profile without an explicit `self` grant? All four seeded roles happen
  to include `self:user:update`, so this only affects custom permission sets. The
  middleware does not pass `resourceId`, so a `self` grant is not owner-checked here.

### USR-010 · Stats respects the admin role gate and computes windowed metrics

- **Covers:** `userStatsProcedure`, `user.stats`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a frozen clock, users created now and 40 days ago, sessions that are
  active (seen 1 minute ago, not logged out), stale (seen 10 minutes ago), logged out,
  and expired, logins inside the last 7 days, 8–14 days ago, and 30–60 days ago,
  devices first seen inside and outside 7 days, and failed `auth.login_failed` events
  inside and outside 24 hours
- **When** `user.stats` is called by a caller with role `ADMIN` (and separately
  `SUPER_ADMIN`)
- **Then** `totalUsers` counts all users, `totalUsersGrowth` is the percentage change
  from the count created on/before 30 days ago rounded to one decimal, all growth
  fields are `null` when the prior period is `0`, `activeNow` counts users with
  `lastSeenAt` in the last 5 minutes and `logoutAt IS NULL`, `activeSessions`
  additionally excludes expired sessions, `wau`/`mau` are distinct users over 7/30
  days, `totalDevices`/`newDevices` use `firstSeenAt`, and `failedLogins` counts only
  the last 24 hours
- **Given** a caller with role `USER`
- **Then** the call rejects with 403; with no session it rejects with 401
- **Notes:** `activeNow` does **not** check `expiresAt`, unlike `activeSessions` — a
  risk if expired sessions still have a recent `lastSeenAt`. `failedLogins` is global,
  not per user. Add a case for the 0-denominator rule if it is not folded into this
  one.

### USR-011 · User search excludes the caller and ignores pagination

- **Covers:** `listUserForSearchProcedure`, `user.listUserForSearch`,
  `userProfileColumns`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** the caller plus three other users, all with role rows, and a search that
  matches two of the others
- **When** `user.listUserForSearch` is called with
  `{ search, searchFields: ["name", "email"], page: 1, limit: 5 }`
- **Then** the caller is absent from the result, each item has
  `{ id, name, email, image, roles }`, and only matching users are returned
- **Notes:** the handler builds only `where`; `limit` and `page` are validated but
  ignored, so all matches are returned. `UserSelectorField` requests `limit: 5`
  expecting a page — decide whether to apply the limit or change the client. The
  `innerJoin` also excludes role-less users. Contract output is an array, not
  paginated metadata.

## Schemas

### USR-012 · `roleUpdateSchema` accepts only a UUID and a known role

- **Covers:** `roleUpdateSchema` — `src/features/user/user.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{ userId: "7f1c…uuid", roleName: "ADMIN" }`
- **When** the schema parses it
- **Then** parsing succeeds
- **When** `userId` is `"not-a-uuid"`, `roleName` is `"OWNER"`, or either field is
  missing
- **Then** parsing fails with an issue on the corresponding path
- **Notes:** `z.uuid()` is strict about UUID format; use a fixed valid UUID.
  `RoleEnumSchema` options are `USER`, `EMPLOYEE`, `ADMIN`, `SUPER_ADMIN`. The same
  schema is the form resolver and the procedure input, so this guards both layers.

### USR-013 · `profileUpdateSchema` validates email, and currently accepts a blank name

- **Covers:** `profileUpdateSchema` — `src/features/user/user.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{ name: "Alice", email: "alice@example.com" }`
- **When** the schema parses it
- **Then** parsing succeeds
- **When** `email` is `"not-an-email"` or missing
- **Then** parsing fails with an issue on `email` (the helper's message is
  `"email is required"`)
- **When** `name` is `""` or whitespace
- **Then** parsing succeeds today because `z.string()` has no min/trim
- **Notes:** asks for a decision: reject blank/whitespace names, or rely on
  better-auth. Email is required even though the profile form disables the field and
  the procedure ignores it; consider removing `email` from this input schema.
  `userUpdateSchema` is exported but has no callers — it has no behaviour to test
  until it is wired up.

## Components and UI

### USR-014 · User table renders row state and gates the edit action

- **Covers:** `userTableColumn`, `UserBannedCell`, `UserTableRowAction`,
  `UsersTable`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a row with roles `[ADMIN, EMPLOYEE]`, `emailVerified: false`, a
  `lastLogin` date, `banned: true`, a ban reason and a ban expiry; the current user
  has `system:user:update`
- **When** the table/columns render
- **Then** the name cell shows the avatar, name and email; roles render as `"Admin"`
  and `"Employee"` badges; `"Not verified"` renders as a secondary badge; last login
  renders with `dd MMM, yyyy hh:mm aa`; a `"Banned"` badge is present and its hover
  card shows the reason and the expiry formatted `dd MMM yy, hh:mm a`; the edit
  button and the view link to `/dashboard/users/<id>?tab=details` are present
- **Given** `banned: false`
- **Then** the banned badge is not rendered
- **Given** the current user lacks `self`/`system` user `update`/`manage`
- **Then** the edit button is absent but the view link remains
- **Notes:** `formatEnumValue` produces `"Admin"`, `"Super Admin"` etc. Hover-card
  content may mount only on hover, so use `userEvent.hover`. Fix `TZ` for the date
  assertions. Split into table-rendering and row-action cases if this becomes hard
  to diagnose.

### USR-015 · Update dialog hides banning for yourself and always shows role editing

- **Covers:** `UserUpdateDialog`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the signed-in user is the target user
- **When** the dialog opens
- **Then** the title reads `Update "<name>"`, the role form is present, and the
  `"Banned Settings"` form is absent
- **Given** the target is another user
- **Then** both the ban and role forms are present
- **When** either form reports success
- **Then** `onSuccess` closes the dialog
- **Notes:** the self check is UI-only; the better-auth ban endpoint still rejects
  callers without the admin permission. A user can change their own role here if
  they have update permission — decide whether self role changes should be blocked
  to prevent lockout. The role form defaults to `roles[0]?.roleName ?? "USER"`.

### USR-016 · Ban form sends the expiry in seconds and defaults to ten days

- **Covers:** `UserBannedForm` ban branch, `userBannedSchema`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** the form starts with `{ banned: false, banReason: "", banExpires:
undefined }` and the current time is fixed
- **When** the switch is turned on
- **Then** the reason and expiry fields appear and the submit button becomes enabled
  only after the form is dirty
- **When** the form is submitted without an expiry
- **Then** `authClient.admin.banUser` receives a payload of
  `{ userId, banExpiresIn: 864000, banReason }` (10 days in seconds), alongside
  `fetchOptions`
- **When** an expiry date is chosen and submitted
- **Then** `banExpiresIn` equals the number of **seconds** between now and that date
- **When** the mock invokes `fetchOptions.onSuccess`
- **Then** the loading state clears, the toast
  `"User has been banned successfully."` is shown, and `onSuccess` runs
- **When** it invokes `fetchOptions.onError`
- **Then** the error message is toasted and `onSuccess` does not run
- **Notes:** current code passes `banExpires.getTime() - Date.now()` — milliseconds —
  to better-auth, which expects seconds, so a chosen expiry is roughly 1000× too
  long. The date picker hides time selection but preserves the current time of day
  when a day is picked, so a "today" choice can produce a near-zero or slightly
  negative delta. Assert the intended seconds; this case should fail until the
  conversion is fixed. `defaultBanExpiresIn` is also configured server-side but the
  client always sends a value.

### USR-017 · Unban form submits only the user id and clears ban fields

- **Covers:** `UserBannedForm` unban branch
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** the form starts with `{ banned: true, banReason: "spam", banExpires:
<date> }`
- **When** the switch is turned off
- **Then** the reason and expiry fields are hidden and their values are cleared
- **When** the form is submitted
- **Then** `authClient.admin.unbanUser` receives a payload of `{ userId }` only (no
  `banExpiresIn`/`banReason`, plus `fetchOptions`), and on success the
  `"User has been unbanned successfully."` toast is shown and `onSuccess` runs
- **When** the switch is turned back on
- **Then** the reason and expiry are empty, not the previous values
- **Notes:** clearing uses `setValue(..., undefined)`; the initial reason from the
  dialog is `""` for `null`. The submit gate is `isDirty`, so merely opening the form
  must not call the API.

### USR-018 · Role form exposes all roles, gates on dirty state and maps server errors

- **Covers:** `UserRoleUpdateForm`, `useRoleUpdate`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `userId` and `roleName: "ADMIN"`, and the four role enum options
- **When** the form renders
- **Then** the select shows `"Admin"` and offers `"User"`, `"Employee"`, `"Admin"`,
  `"Super Admin"`; the submit button is disabled while the form is pristine
- **When** the role changes to `"USER"` and the form is submitted
- **Then** the mutation receives `{ userId, roleName: "USER" }`, the success toast is
  shown, list queries are invalidated with
  `orpcTQClient.user.list.queryKey({ input: {} })` and `exact: false`, and
  `onSuccess` runs
- **When** the server returns `INPUT_VALIDATION_FAILED` with a `roleName` field error
- **Then** the message is attached to the `roleName` field
- **While pending**
- **Then** the select and submit are disabled and the spinner replaces the label
- **Notes:** the resolver is `roleUpdateSchema`; the backend replaces all role
  assignments (USR-006), so this form cannot preserve multiple roles. Mock the oRPC
  mutation layer or use the real hook with a mocked `orpcTQClient`.

### USR-019 · Profile form prefills name, locks email and syncs the auth store

- **Covers:** `ProfileUpdateForm`, `useProfileUpdate`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the auth store user is `{ name: "Alice", email: "alice@example.com" }`
- **When** the form renders
- **Then** name and email are prefilled; email is disabled and shows
  `"you can't update your email address."`
- **When** the name is changed and the form is submitted
- **Then** the mutation receives both `name` and the unchanged `email`; on success
  the auth store user's name/image are updated, the success toast is shown, and the
  pending state disables the name input and shows the button spinner
- **When** the server returns a validation error for `name`
- **Then** the message appears on the name field
- **Notes:** the disabled email input is still part of the submitted values, but the
  procedure ignores email (USR-008); this mismatch is the reason for USR-013.
  `useProfileUpdate` requires its callbacks argument.

### USR-020 · Details step shows verification state, dates and a missing last login

- **Covers:** `DetailsStep`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a details response for a user with `emailVerified: false`,
  `lastLogin: null` and a fixed `createdAt`
- **When** the card renders
- **Then** the name and email are shown, the badge reads `"Unverified"`, the
  registration date uses `dd, MMM yyyy`, and the last-login value is `"N/A"`
- **Given** `emailVerified: true` and a `lastLogin`
- **Then** the badge reads `"Verified"` and the login date uses
  `dd/MM/yy - hh:mm:ss a`
- **Notes:** `useQuery` must be wrapped in `QueryClientProvider`; fix `TZ` because
  `FormatDateCell` formats local time. Error/loading fallbacks come from
  `QueryStateBoundary`; assert them only if the boundary contract is stable.

### USR-021 · Stats cards render every metric and format growth labels

- **Covers:** `UserStats`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a mocked stats response containing all stats fields, with growth values
  `null`, `0`, `12.5` and `-5`
- **When** the component renders inside a Suspense/Query boundary
- **Then** eight cards render with labels `"Total Users"`, `"Active Now"`,
  `"Active Sessions"`, `"Known Devices"`, `"New Devices"`,
  `"Weekly Active Users"`, `"Monthly Active Users"` and `"Failed Logins"`
- **And** the growth labels read `"No prior data"`, `"+0% vs last period"`,
  `"+12.5% vs last period"` and `"-5% vs last period"` respectively
- **And** `activeNow` shows `"last 5 minutes"`; `failedLogins === 0` uses the success
  tone, while a positive value switches the indicator to the error tone and the trend
  to down
- **Notes:** `formatGrowth` is private, so assert the rendered strings. Values are
  printed raw (no locale separators). `useSuspenseQuery` needs a Suspense boundary;
  its own loading fallback is effectively unreachable in normal suspense mode.

### USR-022 · Management table debounces search and forwards only table filters

- **Covers:** `UserManagementTable`, `UsersTable`, `useQuerySearch` integration
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `useQuerySearch` is mocked with `page: 1, limit: 20, search: undefined`
  and `user.list` is mocked
- **When** the component renders
- **Then** `user.list` is called with `{ page: 1, limit: 20, search: undefined,
searchFields: <prop>, order: undefined, orderField: undefined }`
- **When** the user types in the global search box
- **Then** `setSearchFilter` is not called before 500 ms, and is called once with the
  typed value after the debounce; `setSearchFilter` clears the page in
  `useQuerySearch`
- **When** pagination/sorting reports new filters
- **Then** the wrapper calls `setFilters` with `page`, `limit`, `order` and
  `orderField`, and omits `search`
- **When** the query returns an empty array
- **Then** the table renders empty (the `emptyFallback` is unreachable because
  `isEmpty` is hard-coded to `false`)
- **Notes:** mock `useQuerySearch` rather than building the route tree for
  `/dashboard/_dashboardLayout/users/`. Use fake timers with Testing Library and
  advance by 500 ms; TanStack Query also needs its timers flushed. The refresh
  callback passed to the search bar calls `refetch`.

## Coverage gaps

- `UserSelectorField` has no dedicated case. Follow-up (next free id **USR-023**):
  single mode shows the selected user's name, multiple mode renders removable chips,
  `fetchApi: false` disables the query, search passes `search`/`searchFields`/
  `limit: 5`, and a selected id that is not in `knownUsers` renders no name.
- `UsersTable` pagination/toolbar behaviour is only asserted through USR-014 and
  USR-022; add a case if table-state regressions appear.
- `user.api-schema.ts` output shapes are asserted indirectly by USR-001, USR-010 and
  USR-011; no standalone schema case exists.
