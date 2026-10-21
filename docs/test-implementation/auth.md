# Auth Feature — Test Implementation

Scope: `src/features/auth/**` — better-auth configuration, server hooks, permission
helpers, validation schemas, device fingerprinting, and the auth forms/components.
`src/routes/(auth)` is owned by [routes.md](./routes.md) and is not covered here.

## Source map

| File                                                        | Responsibility                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/features/auth/auth.schema.ts`                          | Zod schemas for sign-up, sign-in, magic link, forgot/reset/update password, and admin ban payloads |
| `src/features/auth/permission.ts`                           | `hasPermission`: exact matching, `manage` wildcard, and `self`-level context checks                |
| `src/features/auth/access-control.ts`                       | `systemAc` and `systemRoles` definitions consumed by the better-auth admin plugin                  |
| `src/features/auth/getUserPermission.ts`                    | Resolve a user's roles and permissions from `user_roles` / `role_permission` joins                 |
| `src/features/auth/auth.functions.ts`                       | `requirePermissions` route guard and `requireSessions` server function                             |
| `src/features/auth/auth.server.ts`                          | better-auth instance, plugins, hooks, session/device telemetry, and transactional emails           |
| `src/features/auth/auth.client.ts`                          | Browser auth client (`adminClient`, `oneTapClient`, `inferAdditionalFields`)                       |
| `src/features/auth/authErrors.ts`                           | OAuth callback error code → title/message copy                                                     |
| `src/features/auth/device-fingerprint.ts`                   | User-agent → stable fingerprint plus browser/OS/device details                                     |
| `src/features/auth/device-fingerprint.test.ts`              | Existing unit tests for fingerprint parsing                                                        |
| `src/features/auth/components/forms/SignInForm.tsx`         | Email/password sign-in, remember-me, and resend-verification branch                                |
| `src/features/auth/components/forms/SignUpForm.tsx`         | Registration form with optional pre-filled email                                                   |
| `src/features/auth/components/forms/ForgetPasswordForm.tsx` | Request a password-reset email                                                                     |
| `src/features/auth/components/forms/ResetPasswordForm.tsx`  | Set a new password from an emailed token                                                           |
| `src/features/auth/components/forms/UpdatePasswordForm.tsx` | Change password while signed in, optional session revocation                                       |
| `src/features/auth/components/LinkingApps.tsx`              | List linked OAuth accounts, link/unlink Google                                                     |
| `src/features/auth/components/RememberMe.tsx`               | React Hook Form-bound "Remember Me" checkbox                                                       |
| `src/features/auth/components/SessionManagement.tsx`        | Current/other session cards with single and bulk revoke                                            |
| `src/features/auth/components/SetPasswordButton.tsx`        | Request a reset email for the signed-in user                                                       |
| `src/features/auth/components/SocialAuth.tsx`               | Google One Tap on mount and Google sign-in button                                                  |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 2      |
| Partial     | 0      |
| Missing     | 26     |
| **Total**   | **28** |

Existing test files:

- `src/features/auth/device-fingerprint.test.ts` (3 `it` blocks)

`auth.client.ts` and `authErrors.ts` are thin configuration/message maps and have no
dedicated case; their behavior is exercised indirectly through the component cases
(AUTH-070 to AUTH-075) and the auth-error route, respectively.

## Test environment

- Unit and component tests run in the jsdom Vitest project (`vitest.config.ts`), with
  `test/setup.ts` cleaning up React trees after each test.
- **Schema environment is frozen at import.** `auth.schema.ts` computes
  `restrict = env.VITE_ENVIRONMENT === "production"` once, at module evaluation. To
  exercise both branches, use `vi.resetModules()` plus `vi.stubEnv("VITE_ENVIRONMENT", …)`
  and a dynamic import. Alternatively expose a schema factory (recommended) so the
  environment does not need to be mutated.
- Component tests should `vi.mock("@/features/auth/auth.client")` and assert against a
  typed mock of `signIn.email`, `signUp.email`, `requestPasswordReset`,
  `resetPassword`, `changePassword`, `sendVerificationEmail`, `signIn.social`,
  `oneTap`, `updateUser`, `linkSocial`, `unlinkAccount`, and the session methods.
  Mock `react-hot-toast` as well; the forms assert on toasts as user-visible outcomes.
- Router-dependent components (`SignInForm`, `ResetPasswordForm`) need either a
  memory-history router or a mock of `@tanstack/react-router` that renders `Link` as an
  anchor and returns `{ navigate: vi.fn() }` from `useRouter`.
- `SessionManagement` and `SetPasswordButton` require `AuthStoreProvider`
  (`src/stores/zustand/auth/AuthStoreContext.tsx`) because they read `state.user`
  (timezone/email). Stub `window.location.reload` before testing
  `UpdatePasswordForm`; jsdom throws "Not implemented" otherwise.
- `createClientOnlyFn` is a TanStack Start helper. In jsdom it is expected to run the
  callback; if the boundary no-ops in the test environment, invoke the submit handler
  through the form and assert the mocked client call instead of the helper.
- **`auth.server.ts` is not currently unit-testable without work.** It imports
  `cloudflare:workers` transitively through `getDB()` and instantiates `auth` at module
  load with the real mail service. Server-hook cases need either a workerd /
  `@vitest/cloudflare`-style project using the `@variablesoftware/mock-d1` package
  already in dev dependencies, or a refactor that exports `createAuth(db, mail)` and
  accepts injected headers. The same applies to `requireSessions`, which calls
  `getRequestHeaders()` and `getDB()` internally.
- `haveIBeenPwned` is enabled whenever `ENVIRONMENT !== "development"`, so a test run
  with `ENVIRONMENT=test` would make real network calls on password operations. Stub
  the plugin or run server-hook tests with `ENVIRONMENT=development` and test the
  pwned path separately.
- Freeze time (`vi.useFakeTimers`) for `createdAt` / `lastSeenAt` / mail timestamp
  assertions, and sort DB result arrays before comparing; the queries have no explicit
  ordering.

## Validation schemas

### AUTH-001 · Password complexity is enforced only in production

- **Covers:** `passwordField` — `src/lib/zod-schemas/baseZodSchema.ts`; `signUpSchema`, `signInSchema` — `src/features/auth/auth.schema.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `VITE_ENVIRONMENT=production` and a sign-up payload with name, valid email, password `"abcdef"`, and the same confirmation
- **When** `signUpSchema.safeParse` runs
- **Then** parsing fails with `"password must contain at least one uppercase letter"` and `"password must contain at least one number"`, while `"Abc123"` passes
- **Given** the same payload in `development` or `test`
- **When** the schema is imported and run
- **Then** `"abcdef"` passes because only the 6–20 character bounds apply
- **Notes:** `"abcde"` fails with `"password must be at least 6 characters long"`; a 21-character value fails with `"password must not exceed 20 characters"`. Messages use the lowercase `fieldName` (`password`, `confirm password`). The production regexes are applied to confirm-password too.

### AUTH-002 · Sign-up validates name, email, and password confirmation

- **Covers:** `signUpSchema` — `src/features/auth/auth.schema.ts`; `emailField`, `passwordField` — `src/lib/zod-schemas/baseZodSchema.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a valid sign-up payload
- **When** `signUpSchema.safeParse` runs
- **Then** it succeeds and returns `name`, `email`, `password`, and `confirmPassword`
- **Given** an empty name, an 81-character name, a malformed email, or a confirmation that differs from the password
- **When** parsing runs
- **Then** the messages are `"Full name is required"`, `"Full name is too long"`, `"email is required"`, and `"Password and confirmPassword not matched"` respectively
- **Notes:** `z.email` uses the same `"{fieldName} is required"` message for malformed input, so callers cannot distinguish "missing" from "invalid". The mismatch is produced by `.refine()` without a `path`, so the issue is form-level (root). `InputField`/`PasswordInputField` render only `fieldState.error`, so the mismatch message is currently not displayed by `SignUpForm`/`UpdatePasswordForm`; decide whether to add `path: ["confirmPassword"]` or render root errors.

### AUTH-003 · Reset and update-password schemas compare the correct fields

- **Covers:** `resetPasswordSchema`, `updatePasswordSchema` — `src/features/auth/auth.schema.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a reset payload whose `password` and `confirmPassword` match
- **When** `resetPasswordSchema.safeParse` runs
- **Then** it succeeds; when they differ it fails with `"Password and confirmPassword not matched"`
- **Given** an update payload with a valid `currentPassword`, matching `newPassword`/`confirmPassword`, and no `revokeOtherSessions`
- **When** `updatePasswordSchema.safeParse` runs
- **Then** it succeeds and `revokeOtherSessions` is `undefined`
- **Given** `newPassword` and `confirmPassword` differ
- **When** parsing runs
- **Then** it fails with the same mismatch message, regardless of whether `currentPassword` equals `newPassword`
- **Notes:** The update refinement intentionally compares `newPassword` with `confirmPassword`, not `currentPassword`. There is no schema rule preventing new == current; better-auth only verifies that the current password is correct. Individual errors use `"Current Password …"` / `"New Password …"` messages because those `fieldName` values are capitalized.

### AUTH-004 · Ban payload requires a UUID and real dates

- **Covers:** `userBannedSchema` — `src/features/auth/auth.schema.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `{ userId: "not-a-uuid" }`
- **When** `userBannedSchema.safeParse` runs
- **Then** it fails
- **Given** `{ userId: "<valid-uuid>" }`
- **When** parsing runs
- **Then** it succeeds with `banned`, `banReason`, and `banExpires` omitted
- **Given** `banExpires` as an ISO string instead of a `Date`
- **When** parsing runs
- **Then** it fails, because `z.date()` does not coerce strings
- **Notes:** The admin ban procedure is outside this feature folder; this case only fixes the wire contract so a future form cannot send an unparseable date.

## Permission helper

### AUTH-010 · Empty permission sets

- **Covers:** `hasPermission` — `src/features/auth/permission.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** an empty `requiredPermissions` array and any user permissions
- **When** `hasPermission` runs
- **Then** it returns `true`
- **Given** an empty `userPermissions` array and a non-empty requirement
- **When** it runs
- **Then** it returns `false`
- **Notes:** The empty-requirement short-circuit happens before the empty-user check, so an unauthenticated user passes a check that requires nothing. Callers should never rely on this as an authentication check.

### AUTH-011 · Exact level, resource, and action must match

- **Covers:** `hasPermission` — `src/features/auth/permission.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** the user permission `{ level: "system", resource: "medicine", action: "read" }`
- **When** `hasPermission` is asked for the same triple
- **Then** it returns `true`
- **When** asked for `update` on the same resource, for `self:medicine:read`, or for `system:vendor:read`
- **Then** each returns `false`
- **Notes:** Keys are `${level}:${resource}`. Multiple required permissions are **OR**-ed: the loop returns `true` on the first match, so passing `[medicine.read, vendor.read]` succeeds with only medicine read. Any caller that needs all permissions must loop itself. The sidebar and `userPermissionMiddleware` rely on the current OR behavior for menu visibility.

### AUTH-012 · `manage` is a wildcard within one resource and level

- **Covers:** `hasPermission`, `buildPermissionMap` — `src/features/auth/permission.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the user permission `{ level: "system", resource: "medicine", action: "manage" }`
- **When** the required permissions are `create`, `list`, `update`, `delete`, or `export` on `system:medicine`
- **Then** all are allowed
- **When** the requirement targets `system:vendor:export` or `self:medicine:export`
- **Then** both are denied
- **Notes:** The wildcard expands over every value of `ActionTypeEnumSchema.options`, including `manage` itself. It does not cross resources or permission levels.

### AUTH-013 · `self` permissions depend on resource ownership context

- **Covers:** `hasPermission` — `src/features/auth/permission.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** the user permission `{ level: "self", resource: "user", action: "update" }` and the same requirement
- **When** context is `{ userId: "u1", resourceId: "u2" }`
- **Then** it returns `false`
- **When** context is `{ userId: "u1", resourceId: "u1" }`
- **Then** it returns `true`
- **When** context omits `resourceId` (`{ userId: "u1" }`) or is empty
- **Then** it currently returns `true`
- **Notes:** The guard only rejects when **both** IDs are present and differ. `userPermissionMiddleware` (`src/server/middleware/auth.middleware.ts`) passes only `userId`, so a self-level permission effectively behaves like a system-wide permission there. This is a security decision to make: deny when `resourceId` is absent, or require every caller to pass it.

## Access control

### AUTH-020 · Role capability matrix

- **Covers:** `systemAc`, `systemRoles` — `src/features/auth/access-control.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** the `USER` role
- **When** `systemRoles.USER.authorize({ user: ["get"] })` and `{ session: ["list"] }` run
- **Then** both succeed; `{ user: ["create"] }` fails
- **Given** the `EMPLOYEE` role
- **When** authorizing user `create`, `list`, `set-role`, `ban`, `set-password`, and `get`
- **Then** all succeed; `update` and `delete` on `user`, and `delete` on `session`, fail
- **Given** the `ADMIN` role
- **When** authorizing user `update`
- **Then** it succeeds; user `delete` and session `delete` fail
- **Given** the `SUPER_ADMIN` role
- **When** authorizing user `delete` and session `delete`
- **Then** both succeed
- **Notes:** `authorize` uses the AND connector by default. Role keys come from `RoleEnumSchema` (`USER`, `EMPLOYEE`, `ADMIN`, `SUPER_ADMIN`). These statements are separate from the DB permission seed (`src/db/seed/permission.seed.ts`) used by `hasPermission`, so the two can drift; e.g. access-control `ADMIN` intentionally has no `user:delete` while a DB permission row could grant it. Keep both in sync when role behavior changes.

## Role and permission lookup

### AUTH-030 · Roles and permissions are resolved through the join tables

- **Covers:** `getUserRolesAndPermission` — `src/features/auth/getUserPermission.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a user linked to `USER` and `ADMIN` in `user_roles`, with permissions attached through `role_permission`
- **When** `getUserRolesAndPermission(userId, db)` runs
- **Then** `roles` contains exactly one `{ roleName: "USER" }` and one `{ roleName: "ADMIN" }`, and `permissions` contains the permission rows for both roles
- **Notes:** `roleMap` dedupes roles by name, but permissions are **not** deduped: a permission shared by two roles appears twice. Assert with `arrayContaining` and an explicit count, or decide to dedupe with a `Set` before returning. The query has no ordering; sort before comparing. A user with duplicate `user_roles` rows still yields one role but duplicate permission rows.

### AUTH-031 · A user without a role is a hard failure

- **Covers:** `getUserRolesAndPermission` — `src/features/auth/getUserPermission.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a user with no `user_roles` row
- **When** `getUserRolesAndPermission` runs
- **Then** the promise rejects with `Error("User has no system role")`
- **Notes:** This is reached by `requireSessions` and the oRPC auth middleware, so an authenticated user whose role was never assigned (e.g. the `USER` role row was absent when the sign-up hook ran) turns every authenticated request into a server error rather than a redirect or 403. Decide whether this should be a typed `FORBIDDEN`, a redirect, or a self-healing default-role assignment. Cover the corresponding sign-up hook path in AUTH-050.

## Route guards and session loading

### AUTH-040 · `requirePermissions` redirects or allows

- **Covers:** `requirePermissions` — `src/features/auth/auth.functions.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a user whose permissions do not satisfy the required list
- **When** `requirePermissions(userPermissions, required, userId)` runs
- **Then** it throws a TanStack Router redirect with `href: "/dashboard"` (`DEFAULT_AUTH_PATH`) and `replace: true`
- **Given** the user has the required permission
- **When** the guard runs
- **Then** it returns without throwing
- **Given** an empty required list
- **When** the guard runs with any user
- **Then** it returns without throwing
- **Notes:** The redirect target is the authenticated dashboard, not `/sign-in` or a 403 page. If a dashboard route is ever guarded by a permission the user lacks, this can loop. Also verify that TanStack expects `href` (external-style) rather than `to` for this internal target. The guard passes only `userId` into `hasPermission`, which makes `self` checks ownership-blind (see AUTH-013).

### AUTH-041 · `requireSessions` maps a session and forwards request headers

- **Covers:** `requireSessions` — `src/features/auth/auth.functions.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a request with no valid session cookie
- **When** `requireSessions` runs
- **Then** it resolves to `null`
- **Given** a request with a session cookie and user-agent
- **When** it runs
- **Then** it forwards only `cookie` and `user-agent` to `auth.api.getSession`, loads roles/permissions with `getUserRolesAndPermission`, and returns `{ user, session, roles, permissions }`
- **Notes:** The handler reads `getRequestHeaders()` and `getDB()` directly, so cover it by mocking those modules or by extracting an injectable handler. Other headers (including `x-forwarded-for`) are dropped, which is fine for `getSession` but means IP-dependent telemetry cannot be derived here. A session whose user has no role rejects through AUTH-031.

## Auth server hooks and configuration

### AUTH-050 · User create/delete hooks maintain role assignments

- **Covers:** `createAuth` database hooks — `src/features/auth/auth.server.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** the `RoleTable` contains a role named `USER`
- **When** better-auth creates a user
- **Then** a `user_roles` row linking that user to the default role is inserted
- **Given** no `USER` role row exists
- **When** a user is created
- **Then** the user is still created and no `user_roles` row is inserted (the hook returns silently)
- **Given** an existing user
- **When** the user is deleted through better-auth
- **Then** the user's `user_roles` rows are deleted
- **Notes:** The role lookup uses the string literal `"USER"` rather than `RoleEnumSchema.enum.USER`; seed data must keep that exact value. There is no transaction around user creation plus role assignment. The hooks are private to `createAuth`, so test through `auth.api.signUpEmail`/delete with a mock D1, or export a factory. A missing default role produces the AUTH-031 failure mode for every subsequent request.

### AUTH-051 · Login and logout write session telemetry

- **Covers:** `createAuth` `hooks.after` and `session.delete.before` — `src/features/auth/auth.server.ts`; `parseUserAgent` — `src/features/auth/device-fingerprint.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a successful sign-in that produces a new session and a user-agent
- **When** the after-hook finishes
- **Then** `user_devices` is upserted on `(userId, fingerprint)`, `user_sessions` is inserted with the session id, device id, and expiry, and an `auth.login` event is recorded with IP and user-agent
- **Given** the same browser signs in again on an existing device
- **When** the hook runs
- **Then** the device row's `lastSeenAt` is updated but `firstSeenAt` is unchanged, and no `device.new_detected` event is written
- **Given** a `user_sessions` row already exists for the session id
- **When** the hook runs
- **Then** `onConflictDoNothing` returns no rows and no login/new-device events are written
- **Given** a session is deleted (sign-out)
- **When** the before-hook runs
- **Then** the matching `user_sessions` row gets `logoutAt` and `lastSeenAt`, and an `auth.logout` event is recorded with the device id
- **Notes:** Without a user-agent the entire login telemetry block is skipped, so the device/session/event tables have no record of that sign-in. The logout hook catches its own errors and only logs them, so a failed audit write cannot block sign-out. Background work uses `runInBackgroundOrAwait`; tests must await it before asserting. There is a check-then-upsert race: two concurrent first logins on a new device can both emit `device.new_detected`.

### AUTH-052 · New-device notification gating

- **Covers:** `createAuth` `hooks.after` — `src/features/auth/auth.server.ts`; `getIp`, `upsertUserDevice`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a first-time device, a non-development environment, and request headers with an IP
- **When** sign-in telemetry completes
- **Then** `device.new_detected` is recorded and `sendNewDeviceLoginMail` is called with the user's email/name, `deviceType` (or `"unknown"`), `"<browser> <os>"`, the resolved IP, `"not available"` location, and the secure-account URL
- **Given** the device already exists
- **When** the user signs in
- **Then** no new-device event and no email are sent
- **Given** `ENVIRONMENT=development`
- **When** a new device signs in
- **Then** the event is still recorded but the email is skipped
- **Notes:** The event is written before the environment/IP gate, so dev environments still accumulate `device.new_detected` rows. `getIp` falls back to `"127.0.0.1"`, so the `!ip` mail guard is effectively unreachable for normal requests. The secure-account URL points at the authenticated settings reset page, not a dedicated security page. A rejection from the mail service happens inside the background task; confirm whether it is swallowed or becomes an unhandled rejection, since the comment claims telemetry can never break auth.

### AUTH-053 · Failed sign-ins are audited with the resolved IP

- **Covers:** `createAuth` `hooks.after`, `getIp` — `src/features/auth/auth.server.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a request to `/sign-in/email` that returns an `APIError`, with `body.email` and a user-agent
- **When** the after-hook runs
- **Then** an `auth.login_failed` event is written with `email`, `ipAddress`, and `userAgent`
- **Given** `x-forwarded-for: "203.0.113.5, 10.0.0.1"`
- **When** the event is written
- **Then** the recorded IP is `203.0.113.5`; if only `x-real-ip` is present it is used; with neither, `127.0.0.1`
- **Given** a non-`APIError` result, no user-agent, or a path outside `/sign-in*`
- **When** the hook runs
- **Then** no `auth.login_failed` event is written
- **Notes:** `startsWith("/sign-in")` also matches social sign-in initiation paths; `email` is null when the body has no string email. Passwords are never logged, but the email address is PII, so retention/redaction should be a conscious decision. Logging is fire-and-forget through `runInBackgroundOrAwait`.

### AUTH-054 · Credential sign-up requires verification and sends welcome mail

- **Covers:** `createAuth` `hooks.after`, `emailAndPassword`, `emailVerification` — `src/features/auth/auth.server.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** `requireEmailVerification: true`, `autoSignIn: false`, and `sendOnSignUp: true`
- **When** a user signs up with email and password
- **Then** the response creates no session, a verification email is sent with a one-hour expiry, and `autoSignInAfterVerification` signs the user in after verification
- **Given** the sign-up request has no `newSession`
- **When** the after-hook builds the welcome mail recipient
- **Then** it uses `ctx.body.name` and `ctx.body.email` and sends the welcome mail with the dashboard URL
- **Notes:** Because the sign-up path has no session, the welcome mail depends on the request body being present and shaped as expected. OAuth sign-ups go through the provider callback, not `/sign-up*`, so they do not receive this welcome mail. Password bounds are 6–20 in `emailAndPassword`, but the client schema only enforces complexity in production (AUTH-001), so dev/test passwords can be weaker than the server allows. Also assert that `changeEmail` is disabled and the session cookie cache is enabled (5 minutes) while updating this case.

### AUTH-055 · Password reset/change emails and events

- **Covers:** `emailAndPassword.sendResetPassword`, `/change-password` after-hook — `src/features/auth/auth.server.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a password-reset request for an existing user
- **When** better-auth calls `sendResetPassword`
- **Then** an `auth.password_reset` event is written and `sendPasswordResetMail` is called with the reset URL and user name
- **Given** a signed-in user changes their password with a session, user-agent, and headers
- **When** the `/change-password` after-hook runs
- **Then** an `auth.password_changed` event is written and `sendPasswordChangedMail` is called with the user, device type, IP, and timestamp
- **Given** the change request has no session or no user-agent
- **When** the hook runs
- **Then** no password-changed event or email is written
- **Notes:** Completing a reset from the emailed token hits `/reset-password`, not `/change-password`, so it is **not** recorded as `auth.password_changed` and does not send the "password changed" notice. Confirm whether that reset completion should be audited. The reset event has no session/device/IP context. The event is written before the mail; a mail failure leaves an event without a delivered email.

## Device fingerprinting

### AUTH-060 · Parsed user-agent exposes browser, OS, and a stable fingerprint

- **Covers:** `parseUserAgent`, `deviceFingerprint` — `src/features/auth/device-fingerprint.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** the Chrome 120 / Windows 10 desktop user-agent string
- **When** `parseUserAgent` runs
- **Then** `browser` is `"Chrome"`, `os` is `"Windows"`, and `fingerprint` is `"Chrome|Windows|unknown"`
- **When** `deviceFingerprint` runs on the same input
- **Then** it returns the same `"Chrome|Windows|unknown"` string
- **Notes:** Covered by `src/features/auth/device-fingerprint.test.ts` ("extracts browser, os and device type"). The test does not assert that `deviceType` is `null` for a desktop UA; that gap is captured in AUTH-062.

### AUTH-061 · Fingerprints ignore versions and separate platforms

- **Covers:** `parseUserAgent`, `deviceFingerprint` — `src/features/auth/device-fingerprint.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** Chrome 120 and Chrome 121 user-agents on Windows
- **When** both fingerprints are computed
- **Then** they are equal, so a routine browser update is not a new device
- **Given** the Safari/macOS user-agent
- **When** its fingerprint is compared with the Chrome/Windows one
- **Then** the fingerprints differ
- **Notes:** Covered by the "ignores user agent versions" and "distinguishes different browsers or platforms" tests. Only browser name, OS name, and device type participate; the browser major version, OS version, and full UA are intentionally discarded.

### AUTH-062 · Unknown, desktop, mobile, and colliding fingerprints

- **Covers:** `parseUserAgent`, `deviceFingerprint` — `src/features/auth/device-fingerprint.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** an empty or unparseable user-agent string
- **When** `parseUserAgent` runs
- **Then** `browser`, `os`, and `deviceType` are `null` and the fingerprint is `"unknown|unknown|unknown"`
- **Given** a desktop UA
- **When** parsing runs
- **Then** `deviceType` is `null` and the fingerprint ends in `"|unknown"`
- **Given** a mobile UA (e.g. iPhone Safari)
- **When** parsing runs
- **Then** `deviceType` is `"mobile"` and the fingerprint contains `|mobile`
- **Given** two different physical devices reporting the same browser, OS, and device type
- **When** both sign in
- **Then** they share one `user_devices` row and only the first triggers `device.new_detected`
- **Notes:** The last scenario is the security trade-off of a name-based fingerprint: it cannot distinguish identical browser/OS/type combinations, and all unparseable clients collapse into one device row. Decide whether to include a client-generated identifier or retain more UA detail for new-device alerts. This case also covers the missing `deviceType` assertions in the existing test.

## Forms and components

### AUTH-070 · Sign-in validates, submits, and handles unverified email

- **Covers:** `SignInForm` — `src/features/auth/components/forms/SignInForm.tsx`; `RememberMe` — `src/features/auth/components/RememberMe.tsx`; `signInSchema` — `src/features/auth/auth.schema.ts`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** the form is rendered with empty email and password
- **When** the user submits
- **Then** `"email is required"` and `"password must be at least 6 characters long"` are shown and `authClient.signIn.email` is not called
- **Given** a valid email, password, and unchecked remember-me
- **When** the user submits
- **Then** `signIn.email` is called once with `{ email, password, callbackURL: redirect, rememberMe: false }`, a loading toast/disabled state appears, and success shows `"Login Successfully"` and resets the form
- **Given** an `invitationId`
- **When** the user submits
- **Then** `callbackURL` is `/accept-invitation?invitationId=<id>` instead of `redirect`
- **Given** an error with code `EMAIL_NOT_VERIFIED`
- **When** the sign-in fails
- **Then** a toast titled `"Your email is not verified"` offers a Resend button
- **When** Resend is clicked
- **Then** `sendVerificationEmail` is called with the form email and `callbackURL: redirect` (not the invitation-aware URL), with loading/success/error toasts and form reset
- **Given** any other error
- **When** sign-in fails
- **Then** `toast.error(error.message)` is shown and the form resets
- **Notes:** `rememberMe` always has a boolean default, so it is sent even when untouched. Checking the box must update the submitted value; assert that explicitly. The resend path drops the invitation redirect, which may strand invited users. The `Login` button uses `ButtonSpinner`, so assert its disabled/loading state via the spinner or `aria-busy` if exposed.

### AUTH-071 · Sign-up hides a pre-filled email and submits timezone

- **Covers:** `SignUpForm` — `src/features/auth/components/forms/SignUpForm.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the `email` prop is provided
- **When** the form renders
- **Then** no email input is rendered and the email is still part of the submitted values
- **Given** no `email` prop
- **When** the form renders
- **Then** the email input is present and required
- **Given** a valid name, email, password, and confirmation
- **When** the user submits
- **Then** `authClient.signUp.email` is called with `{ email, name, password, callbackURL, timezone }`, where `timezone` is `Intl.DateTimeFormat().resolvedOptions().timeZone`; `confirmPassword` is not sent
- **Given** an `invitationId`
- **When** submitting
- **Then** `callbackURL` is the accept-invitation URL
- **Given** mismatched passwords
- **When** submitting
- **Then** no client call is made and the root refinement error is not rendered next to either password field
- **Given** a success or error response
- **When** the request settles
- **Then** the matching toast is shown, loading clears, and the form resets to its default values (including the pre-filled email)
- **Notes:** The invitation URL is duplicated across the sign-in, sign-up, and social components; keep the helper behavior identical when refactoring. The email placeholder for the visible input contains the typo `"Email Password"`; do not assert copy unless it is fixed.

### AUTH-072 · Password-reset entry points and completion

- **Covers:** `ForgetPasswordForm` — `src/features/auth/components/forms/ForgetPasswordForm.tsx`; `ResetPasswordForm` — `src/features/auth/components/forms/ResetPasswordForm.tsx`; `SetPasswordButton` — `src/features/auth/components/SetPasswordButton.tsx`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** the forgot-password form with a valid email
- **When** the user submits
- **Then** `requestPasswordReset` is called with `{ email, redirectTo: "/reset-password" }`, success shows `"Reset password email is sent"`, and the form resets; failure shows the server message and resets
- **Given** a signed-in store user and the Set Password button
- **When** the user clicks it
- **Then** `requestPasswordReset` is called with the store user's email and `redirectTo: "/reset-password"`, with loading and success/error toasts
- **Given** the reset form with a `token` prop and two matching passwords
- **When** the user submits
- **Then** `resetPassword` is called with `{ newPassword, token }`, success shows `"Password is changed"`, the form resets, and the router navigates to `/sign-in` with `replace: true`
- **Given** the reset request fails (expired/invalid token)
- **When** the request settles
- **Then** an error toast is shown, the form resets, and no navigation occurs
- **Notes:** The reset form has no token validation before submit, so an invalid token is only discovered server-side. `SetPasswordButton` reuses the toast id `"revoke_other_sessions_toast_message"`, which collides with `SessionManagement`; give it a distinct id when fixing. `ForgetPasswordForm` omits the `requiredField` marker on its email input even though the schema requires the field; it still renders `fieldState.error` because `InputField` always does.

### AUTH-073 · Update-password submits the revoke choice and reloads

- **Covers:** `UpdatePasswordForm` — `src/features/auth/components/forms/UpdatePasswordForm.tsx`; `updatePasswordSchema` — `src/features/auth/auth.schema.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** valid current/new/confirmation values and the revoke checkbox unchecked
- **When** the user submits
- **Then** `authClient.changePassword` is called with `{ currentPassword, newPassword, revokeOtherSessions: false }`
- **Given** the checkbox is checked
- **When** submitting
- **Then** `revokeOtherSessions` is `true`
- **Given** a successful response
- **When** the request settles
- **Then** `"Password updated"` is shown, the form resets, and `window.location.reload()` is called once
- **Given** an error
- **When** the request settles
- **Then** the error message is toasted, loading clears, the form resets, and no reload happens
- **Given** `newPassword` and `confirmPassword` differ
- **When** submitting
- **Then** no client call is made
- **Notes:** Stub `window.location.reload`; jsdom's default throws. The checkbox label has the typo `"Lot out other sessions"`. The root mismatch error is not attached to the confirmation field (AUTH-002). The component has no way to show that reloading will invalidate other sessions until after the call.

### AUTH-074 · Social sign-in and account linking

- **Covers:** `SocialAuth` — `src/features/auth/components/SocialAuth.tsx`; `LinkingApps` — `src/features/auth/components/LinkingApps.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `SocialAuth` mounts with a `redirect` and optional `invitationId`
- **When** the effect runs
- **Then** `authClient.oneTap` is called with the invitation-aware `callbackURL`; success calls `authClient.updateUser({ timezone })` and clears loading; failure shows an error toast and clears loading
- **Given** the Google button is clicked
- **When** the handler runs
- **Then** `signIn.social` is called with `provider: "google"`, the invitation-aware `callbackURL`, the same `newUserCallbackURL`, and `errorCallbackURL: "/auth-error"`; success updates the timezone; while pending the button is disabled and a portal spinner is shown
- **Given** `LinkingApps` receives one Google account
- **When** it renders
- **Then** the linked card shows "Google", the linked date, and an Unlink button, and Google is absent from the "Link Other Accounts" list
- **Given** no accounts
- **When** it renders
- **Then** `"No linked accounts found"` is shown and Google appears as a Link card
- **When** Link is clicked
- **Then** `linkSocial` is called with `{ provider: "google", callbackURL: "/" }`; when Unlink is clicked, `unlinkAccount` is called with `{ accountId }`; both show loading and success/error toasts
- **Notes:** One Tap fires on every mount and its promise is not awaited by the effect; ensure the mock rejects cleanly so the error path is asserted. After link/unlink, the component only toasts and does not refresh `currentAccounts`, so the list stays stale until the parent refetches. The "Account not found" guard in the unlink handler is unreachable from the UI because the Unlink button only renders when an account exists; test it only if the hook is exported. Unknown providers fall back to the `Shield` icon and the raw provider id.

### AUTH-075 · Session management separates current and other sessions

- **Covers:** `SessionManagement` — `src/features/auth/components/SessionManagement.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** one session matching `currentSessionToken` and one other session
- **When** the component renders
- **Then** the current card shows the "Current Session" badge and no revoke button, and the other card shows a revoke button
- **When** "Revoke Other Sessions" is clicked
- **Then** `authClient.revokeOtherSessions(undefined, …)` is called once and `"Other sessions revoked"` is shown
- **When** a single card's revoke button is clicked
- **Then** `revokeSession({ token })` is called with that session's token and `"Session revoked"` is shown
- **Given** only the current session
- **When** the component renders
- **Then** `"No other active sessions"` is shown and no bulk-revoke button is rendered
- **Given** sessions whose user-agent is missing, browser-only, or OS-only, or whose device type is mobile
- **When** cards render
- **Then** the titles are `"Unknown Device"`, the browser name, or the OS name as appropriate, both names render as `"Browser, OS"`, and the mobile card uses the phone icon
- **Notes:** Wrap the component in `AuthStoreProvider` and freeze time; `formatDateWithTimezone` formats created/expiry using the store user's timezone. The component does not remove a revoked row optimistically, so the list is unchanged until the parent refetches; confirm that is intended. `isLoading` is shared, so revoking one session puts every card's spinner into the loading state. The bulk-revoke action is hidden, not disabled, when there are no other sessions; the handler also early-returns.
