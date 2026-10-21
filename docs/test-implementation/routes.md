# Routes and Page Shells — Test Implementation

Scope: `src/routes/**` except `src/routes/api/**` — the root shell, public index, auth
layout and pages, the authenticated dashboard layout, every dashboard page, and the
settings layout/tabs. Server endpoints under `src/routes/api/**` are owned by
[server.md](./server.md); auth feature components/forms are owned by [auth.md](./auth.md);
domain tables and detail views are owned by their feature documents.

## Source map

| Area                 | File                                                                                 | Responsibility                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| App shell            | `src/router.tsx`                                                                     | `getRouter` factory: route tree, scroll restoration, preload defaults, default error component, injected `queryClient` |
| App shell            | `src/routes/__root.tsx`                                                              | Loads `requireSessions` into router context, global `<head>`, 404 component, document/shell composition                |
| App shell            | `src/routes/index.tsx`                                                               | `/` placeholder page                                                                                                   |
| Auth                 | `src/routes/(auth)/_authLayout.tsx`                                                  | Redirects signed-in users to `/dashboard`; auth page chrome, title                                                     |
| Auth                 | `src/routes/(auth)/_authLayout/sign-in.tsx`                                          | Sign-in card; `redirect`/`invitationId` search schema                                                                  |
| Auth                 | `src/routes/(auth)/_authLayout/sign-up.tsx`                                          | Sign-up card; `redirect`/`invitationId` search schema                                                                  |
| Auth                 | `src/routes/(auth)/_authLayout/forgot-password.tsx`                                  | Forgot-password card                                                                                                   |
| Auth                 | `src/routes/(auth)/_authLayout/reset-password.tsx`                                   | Token/error branching for password reset                                                                               |
| Auth                 | `src/routes/(auth)/_authLayout/auth-error.tsx`                                       | OAuth error code lookup and fallback                                                                                   |
| Dashboard layout     | `src/routes/dashboard/_dashboardLayout.tsx`                                          | Authentication guard, `AuthStoreProvider`, sidebar/topbar shell, outlet                                                |
| Dashboard layout     | `src/routes/dashboard/_dashboardLayout/index.tsx`                                    | Dashboard landing page greeting                                                                                        |
| Operations pages     | `src/routes/dashboard/_dashboardLayout/medicines.tsx`                                | Permission gate, query search, list loader, skeleton                                                                   |
| Operations pages     | `src/routes/dashboard/_dashboardLayout/customers/index.tsx`                          | Permission gate, query search, customer list loader, skeleton                                                          |
| Customers detail     | `src/routes/dashboard/_dashboardLayout/customers/$customerId.tsx`                    | Permission gate, details loader, URL-driven details/purchase/payment tabs, skeleton                                    |
| Operations pages     | `src/routes/dashboard/_dashboardLayout/sales.tsx`                                    | Permission gate, query + range + `unpaidOnly` search, sales list loader, skeleton                                      |
| Operations pages     | `src/routes/dashboard/_dashboardLayout/payments.tsx`                                 | Permission gate, query + range search, payment list loader                                                             |
| Operations pages     | `src/routes/dashboard/_dashboardLayout/cash-closing/index.tsx`                       | Permission gate, query + range search, cash closing list loader, skeleton                                              |
| Operations pages     | `src/routes/dashboard/_dashboardLayout/roles.tsx`                                    | Permission gate, role table page                                                                                       |
| Operations pages     | `src/routes/dashboard/_dashboardLayout/profile.tsx`                                  | Profile tabs driven by `?tab=` search param                                                                            |
| Operations pages     | `src/routes/dashboard/_dashboardLayout/users/index.tsx`                              | Permission gate, user list + stats loaders                                                                             |
| Users/vendors detail | `src/routes/dashboard/_dashboardLayout/users/$userId.tsx`                            | Permission gate, user details loader, `?tab=`                                                                          |
| Users/vendors detail | `src/routes/dashboard/_dashboardLayout/vendors/index.tsx`                            | Permission gate, vendor list loader                                                                                    |
| Users/vendors detail | `src/routes/dashboard/_dashboardLayout/vendors/$vendorId.tsx`                        | Permission gate, vendor details loader, `?tab=`                                                                        |
| Purchases            | `src/routes/dashboard/_dashboardLayout/purchases/index.tsx`                          | Permission gate, query + range + `unpaidOnly` search, list loader                                                      |
| Purchases            | `src/routes/dashboard/_dashboardLayout/purchases/new.tsx`                            | Permission gate, create form page                                                                                      |
| Purchases            | `src/routes/dashboard/_dashboardLayout/purchases/$purchaseId.tsx`                    | Permission gate, purchase details loader                                                                               |
| Settings             | `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout.tsx`                 | Settings shell: header, settings sidebar, outlet                                                                       |
| Settings             | `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout/index.tsx`           | `/dashboard/settings` → `/dashboard/settings/profile`                                                                  |
| Settings             | `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout/profile.tsx`         | Profile update tab                                                                                                     |
| Settings             | `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout/sessions.tsx`        | Lists sessions via server fn                                                                                           |
| Settings             | `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout/update-password.tsx` | Branches on credential account                                                                                         |
| Settings             | `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout/connected-apps.tsx`  | Filters credential accounts before linking UI                                                                          |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 30     |
| **Total**   | **30** |

Existing test files: none. Globs for `src/routes/**/*.{test,spec}.{ts,tsx}` and
`src/router.{test,spec}.{ts,tsx}` return no files, and no Storybook story targets a route,
so every case below is `Missing`.

## Test environment and mocks

- These are route-level (`e2e` in this repo's vocabulary) tests run in the default jsdom
  Vitest project. Build a real router with `createRouter({ routeTree, context,
history: createMemoryHistory({ initialEntries: ["/…"] }) })` and render
  `<RouterProvider router={router} />`; assert on the rendered shell plus
  `router.state.location`.
- `__root.tsx` calls the `requireSessions` server function in `beforeLoad`. Mock
  `@/features/auth/auth.functions` per test so it resolves a fixture
  `{ user, session, roles, permissions }` or `null`. Keep the real `requirePermissions`
  unless the case is about the guard helper (see [auth.md](./auth.md) AUTH-040).
- Importing any route pulls `@/lib/env`, which validates server and client variables at
  module load. Set `SKIP_ENV_VALIDATION=true` (or provide dummy `VITE_*`/auth values) in
  the Vitest environment before importing route modules.
- Loaders call `queryClient.query(orpcTQClient.…queryOptions(...))`. Stub `@/server/orpc`
  and/or `queryClient.query`, and assert the loader input rather than hitting oRPC.
  Loaders must not run when a `beforeLoad` guard throws; assert the mock was not called.
- Settings routes (`sessions`, `update-password`, `connected-apps`) wrap server functions
  around `getRequestHeaders()` and `auth.api.*`. Mock
  `@tanstack/react-start/server` and `@/features/auth/auth.server` for those loaders.
- The dashboard layout uses the sidebar (`matchMedia`), Base UI primitives, and
  `ThemeProvider`/`localStorage`. Stub `window.matchMedia`, `ResizeObserver`, and
  `IntersectionObserver` in the test file if `test/setup.ts` does not already provide
  them; `test/setup.ts` currently only registers `jest-dom` and `cleanup`.
- Freeze the clock (`vi.setSystemTime`) and set `TZ=UTC` for date-range defaults.
  `rangeFilterSchema` computes `startOfMonth`/`endOfMonth` at parse time.
- Permission fixtures are `{ level, resource, action }` objects. `hasPermission` uses OR
  semantics across the required list, and a `manage` grant expands to every action for
  that resource.

## Root shell and not-found

### RTE-001 · Root `beforeLoad` exposes the session fixture to child routes

- **Covers:** `src/routes/__root.tsx` (`beforeLoad`)
- **Type:** e2e · **Priority:** P0 · **Status:** Missing
- **Given** `requireSessions` resolves a user, session, roles, and permissions
- **When** the router loads any route
- **Then** route context contains exactly that `user`, `session`, `roles`, and
  `permissions`, and `queryClient` is preserved from the router context
- **Notes:** also cover `requireSessions → null`: all four fields must be `undefined`
  (not stale values from a previous navigation) so the auth layouts can fall back.

### RTE-002 · Unknown top-level paths render the root 404 page

- **Covers:** `src/routes/__root.tsx` (`notFoundComponent`)
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** the router starts at `/does-not-exist` or `/foo/bar`
- **When** the route tree is matched
- **Then** the page shows `404` and "The requested page could not be found." inside the
  root shell, and no dashboard/auth layout chrome is rendered
- **Notes:** decide and assert what an unknown path _under_ `/dashboard` (for example
  `/dashboard/settings/nope`) does — whether the dashboard guard runs first (redirecting
  anonymous users to sign-in) or the root 404 wins. Do not assert either behavior until
  that decision is recorded.

### RTE-003 · A signed-in user without a system role breaks every route

- **Covers:** `src/routes/__root.tsx` → `requireSessions` →
  `getUserRolesAndPermission` — `src/features/auth/getUserPermission.ts`
- **Type:** e2e · **Priority:** P0 · **Status:** Missing
- **Given** `auth.api.getSession` returns a user whose role rows are missing
- **When** the root `beforeLoad` runs for `/dashboard` or even `/sign-in`
- **Then** `getUserRolesAndPermission` throws "User has no system role" and the route
  renders the router's default error surface instead of a redirect or a 403
- **Notes:** the server function does not catch this, so a bad seed or a failed sign-up
  role assignment locks the user out of the whole app, including the auth pages. The
  helper behavior is covered by AUTH-031; this case is the route-level consequence.
  Decide whether root should degrade to unauthenticated/forbidden.

## Auth layout and pages

### RTE-004 · Anonymous access to `/dashboard` redirects to sign-in

- **Covers:** `src/routes/dashboard/_dashboardLayout.tsx` (`beforeLoad`)
- **Type:** e2e · **Priority:** P0 · **Status:** Missing
- **Given** `requireSessions` resolves `null` and the user opens `/dashboard`
- **When** the dashboard layout guard runs
- **Then** the app navigates to `/sign-in` and no dashboard child or loader renders
- **Notes:** the guard intends `search: { redirect: location.pathname }`, but it passes
  `href: "/sign-in"`. TanStack derives the redirect location from `href` and ignores the
  separate `search` object, so the `redirect` parameter is currently dropped. Assert the
  actual URL, then decide whether to switch to `to:` (preferred) or encode the query in
  `href`. Also assert the redirect is a replacement entry, not a history push.

### RTE-005 · Every dashboard child redirects anonymous users before loading data

- **Covers:** `src/routes/dashboard/_dashboardLayout.tsx` guard applied to
  `purchases/index.tsx`, `purchases/new.tsx`, `purchases/$purchaseId.tsx`,
  `users/index.tsx`, `users/$userId.tsx`, `vendors/index.tsx`, `vendors/$vendorId.tsx`,
  `medicines.tsx`, `customers/index.tsx`, `customers/$customerId.tsx`, `sales.tsx`,
  `payments.tsx`, `roles.tsx`, `profile.tsx`, `settings/_settingsLayout/*`
- **Type:** e2e · **Priority:** P0 · **Status:** Missing
- **Given** an anonymous context
- **When** the router opens each nested path, including `/dashboard/purchases/new`,
  `/dashboard/users/<uuid>`, `/dashboard/customers/<uuid>`,
  `/dashboard/settings/sessions`, and `/dashboard/settings/connected-apps`
- **Then** each one redirects to `/sign-in`, and no route loader, `queryClient.query`, or
  settings server function is invoked
- **Notes:** run this as one parameterized case. It proves the parent guard runs before
  child `beforeLoad`/`loader` for every branch, including the pathless settings layout.

### RTE-006 · Signed-in users are redirected away from all auth pages

- **Covers:** `src/routes/(auth)/_authLayout.tsx` (`beforeLoad`) and pages `sign-in`,
  `sign-up`, `forgot-password`, `reset-password`, `auth-error`
- **Type:** e2e · **Priority:** P0 · **Status:** Missing
- **Given** `requireSessions` resolves a user and session
- **When** the user opens `/sign-in`, `/sign-up`, `/forgot-password`,
  `/reset-password?token=x`, or `/auth-error?error=state_not_found`
- **Then** each redirects to `/dashboard` with `replace: true`, dropping the auth-page
  search params, and the auth cards do not render
- **Notes:** also cover a context with `session` but no `user` (partial mock): the auth
  layout condition requires both, so it must render instead of redirecting.

### RTE-007 · `/` is an empty placeholder with no redirect

- **Covers:** `src/routes/index.tsx`
- **Type:** e2e · **Priority:** P2 · **Status:** Missing
- **Given** either an anonymous or an authenticated context
- **When** the user opens `/`
- **Then** the route renders an empty `div` and stays at `/`; no redirect to `/sign-in`
  or `/dashboard` occurs
- **Notes:** decide whether `/` should send anonymous users to `/sign-in` and signed-in
  users to `/dashboard`, or host a real landing page. Until then this case documents the
  blank-screen behavior.

## Dashboard layout

### RTE-008 · Dashboard layout composes the authenticated shell and greeting

- **Covers:** `src/routes/dashboard/_dashboardLayout.tsx` and
  `src/routes/dashboard/_dashboardLayout/index.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a context with user `{ name: "Ayesha" }`, a session, roles, and permissions
- **When** `/dashboard` renders
- **Then** the page shows "Welcome back, Ayesha", renders the app sidebar, topbar, and
  `<main>` outlet, wraps children in `AuthStoreProvider` with the same session/user/
  roles/permissions, and sets `isAdminUser` true only for `ADMIN` or `SUPER_ADMIN`
- **Notes:** assert `isAdminUser` false for a non-admin role set and true for either admin
  role. The sidebar open state comes from the zustand setting store; toggling it should
  update the provider, but sidebar internals belong to
  [components-shared.md](./components-shared.md).

### RTE-009 · Missing context fields redirect, while empty arrays pass the layout guard

- **Covers:** `src/routes/dashboard/_dashboardLayout.tsx` (`beforeLoad`)
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a context with `user` present but `session`, `roles`, or `permissions` missing
  (one at a time)
- **When** `/dashboard` is opened
- **Then** each incomplete combination redirects to `/sign-in`
- **Notes:** then cover `roles: []` and `permissions: []`: both are truthy, so the layout
  renders and only page-level `requirePermissions` gates can reject. That asymmetry is
  intentional in the current code; assert it so it is not "fixed" by accident.

## Permission gates

### RTE-010 · Each dashboard page requires its documented permission (OR semantics)

- **Covers:** `src/routes/dashboard/_dashboardLayout/` — `medicines.tsx`,
  `customers/index.tsx`, `customers/$customerId.tsx`, `sales.tsx`, `payments.tsx`,
  `roles.tsx`, `users/index.tsx`, `users/$userId.tsx`, `vendors/index.tsx`,
  `vendors/$vendorId.tsx`, `purchases/index.tsx`, `purchases/new.tsx`,
  `purchases/$purchaseId.tsx`, `cash-closing/index.tsx`
- **Type:** e2e · **Priority:** P0 · **Status:** Missing
- **Given** a signed-in context whose permissions are varied per route
- **When** each route's `beforeLoad` runs
- **Then** access is granted when either listed permission is present:
  - `medicine` `manage` **or** `list` → medicines
  - `customer` `manage` **or** `list` → customers list; `manage` **or** `read` →
    customer detail
  - `sale` `manage` **or** `list` → sales
  - `vendor_payment` `manage` **or** `list` → payments
  - `role_permission` `list` → roles
  - `user` `manage` **or** `list` → users list; `user` `manage` **or** `read` → user detail
  - `vendor` `manage` **or** `list` → vendors list; `vendor` `manage` **or** `read` →
    vendor detail
  - `purchase` `manage` **or** `list` → purchases list; `manage` **or** `create` → new
    purchase; `manage` **or** `read` → purchase detail
  - `report` `manage` **or** `list` → cash closings
- **Notes:** `manage` expands to every action, so `manage` alone must pass every gate.
  `profile`, the dashboard index, and all settings tabs have no page-level permission
  requirement — they only need authentication. Assert that too, so a later gate addition
  is a deliberate change.

### RTE-011 · A failed permission gate redirects to the dashboard, not a 403

- **Covers:** `requirePermissions` invocation in every gated route (helper owned by
  [auth.md](./auth.md) AUTH-040)
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a signed-in user with no matching permission for `/dashboard/roles`
- **When** the route's `beforeLoad` runs
- **Then** the router redirects to `/dashboard` with replacement, the roles page does not
  render, and no loader or oRPC call runs
- **Notes:** the destination is `DEFAULT_AUTH_PATH` (`/dashboard`), not a 403 or
  not-found page, so a denied user sees no explanation. The redirect uses `href` rather
  than `to`; verify it is an internal client navigation. If `/dashboard` ever gains a
  page-level gate, this becomes an infinite redirect. Decide whether a dedicated 403
  route is needed.

## Search-param validation

### RTE-012 · Paginated list routes apply `querySearchSchema` defaults

- **Covers:** `src/routes/dashboard/_dashboardLayout/medicines.tsx`,
  `src/routes/dashboard/_dashboardLayout/customers/index.tsx`,
  `src/routes/dashboard/_dashboardLayout/sales.tsx`,
  `src/routes/dashboard/_dashboardLayout/payments.tsx`,
  `src/routes/dashboard/_dashboardLayout/roles.tsx`,
  `src/routes/dashboard/_dashboardLayout/users/index.tsx`,
  `src/routes/dashboard/_dashboardLayout/vendors/index.tsx`,
  `src/routes/dashboard/_dashboardLayout/purchases/index.tsx` —
  `src/lib/querySearchSchema.ts`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a request with no query string
- **When** `/dashboard/medicines` and the other list routes resolve
- **Then** parsed search is `{ page: 1, limit: 20, search: undefined, order: undefined,
orderField: undefined }`, and each list loader receives those values
- **Notes:** assert `loaderDeps` forwarding: changing `page`, `limit`, `search`, `order`,
  or `orderField` in the URL must re-run the loader and pass the new values (plus the
  route's `searchFields`). Roles has no loader, so only the parsed search is asserted
  there.

### RTE-013 · Invalid pagination values do not silently fall back to defaults

- **Covers:** `src/lib/querySearchSchema.ts` usage in list routes
- **Type:** e2e · **Priority:** P2 · **Status:** Missing
- **Given** `?page=0`, `?page=1.5`, `?page=abc`, or `?limit=0`
- **When** a paginated route resolves
- **Then** the route reports a search-validation error instead of rendering with page 1
  and limit 20
- **Notes:** `.default()` applies only to `undefined`; coercion failures do not fall back.
  Decide the UX: a route-level `errorComponent`/redirect to sanitized defaults, or keep
  the default router error screen. Record the decision here before asserting a surface.

### RTE-014 · Purchases and sales lists default to the current month and forward the range

- **Covers:** `src/routes/dashboard/_dashboardLayout/purchases/index.tsx`,
  `src/routes/dashboard/_dashboardLayout/sales.tsx`,
  `src/lib/querySearchSchema.ts`
  (`rangeFilterSchema`), `src/utils/buildDateRangeFilter.ts`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** the clock is frozen at a known instant and no query string is present
- **When** `/dashboard/purchases` and `/dashboard/sales` resolve
- **Then** `range` defaults to `THIS_MONTH`, `startTime`/`endTime` default to the start
  and end of that month, and the loader passes
  `filter.createdAt = { from: startTime, to: endTime }` to `purchase.list` or
  `sale.list` respectively
- **Notes:** freeze `TZ=UTC` or compute expectations with the same `date-fns` helpers to
  avoid local-time drift. `buildDateRangeFilter` returns `undefined` if either bound is
  missing, so cover one-sided input. `range` itself is validated but unused by the
  loader; only `startTime`/`endTime` drive the filter.

### RTE-015 · `unpaidOnly` coercion accepts `"false"` as true

- **Covers:** `src/routes/dashboard/_dashboardLayout/purchases/index.tsx`,
  `src/routes/dashboard/_dashboardLayout/sales.tsx`
  (`validateSearch`, `unpaidOnly` forwarding)
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** `/dashboard/purchases?unpaidOnly=false` and
  `/dashboard/sales?unpaidOnly=0`
- **When** the search schema parses the value
- **Then** `unpaidOnly` is `true` because `z.coerce.boolean()` applies `Boolean("false")`,
  and the loader forwards `true` to `purchase.list` or `sale.list`
- **Notes:** only `?unpaidOnly=` (empty) or an absent param yields `false`. Assert the
  current behavior, then decide whether to replace the schema with an explicit
  `"true"`/`"false"` enum transform so a URL cannot mean the opposite of its text.

### RTE-016 · Profile tabs read and write the `tab` search param

- **Covers:** `src/routes/dashboard/_dashboardLayout/profile.tsx`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** `/dashboard/profile` with no query string
- **When** the page renders and the user selects Roles then Permissions
- **Then** the default tab is `details`, clicking a tab writes `?tab=roles` /
  `?tab=permissions` to the URL, and a reload restores that tab
- **Notes:** the enum is `details | roles | permissions`; `?tab=other` must produce a
  search-validation error, not fall back to `details`. The profile page reads user,
  roles, and permissions from route context (not a loader), so assert badge contents
  change with the fixture.

### RTE-017 · Detail pages constrain their `tab` values

- **Covers:** `src/routes/dashboard/_dashboardLayout/users/$userId.tsx`,
  `src/routes/dashboard/_dashboardLayout/vendors/$vendorId.tsx`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a user-detail URL and a vendor-detail URL
- **When** each page parses its search
- **Then** the user page accepts only `details` (default `details`), the vendor page
  accepts `details | purchase | payment` (default `details`), and any other value is a
  validation error
- **Notes:** for the vendor page, also assert each tab renders its corresponding tab
  component with the same `vendorId`. Tab content behavior is owned by
  [vendors.md](./vendors.md); this case only covers the route's enum/default wiring.

## Auth page search handling

### RTE-018 · Sign-in/sign-up pass `redirect` through and validate `invitationId`

- **Covers:** `src/routes/(auth)/_authLayout/sign-in.tsx`,
  `src/routes/(auth)/_authLayout/sign-up.tsx`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** `/sign-in?redirect=/dashboard/users&invitationId=<uuid>` and the same for
  `/sign-up`
- **When** the page renders
- **Then** `SignInForm`/`SignUpForm` and `SocialAuth` receive `redirect` unchanged and
  the UUID `invitationId`, and when `redirect` is absent they receive `/dashboard`
- **Notes:** an invalid `invitationId` (non-UUID) must fail search validation. The
  `redirect` value is an arbitrary string forwarded to better-auth as `callbackURL`;
  decide whether the route should allow only same-origin relative paths to avoid an open
  redirect, and add that assertion once decided.

### RTE-019 · Reset-password prioritizes `error` over `token`

- **Covers:** `src/routes/(auth)/_authLayout/reset-password.tsx`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** `/reset-password` with (a) `error` and a token, (b) only a token, (c) neither
- **When** the page renders
- **Then** (a) shows "Something went wrong" and no form, (b) renders `ResetPasswordForm`
  with that token, and (c) shows the "'token' is not found in search | query params"
  message
- **Notes:** `error` is any non-empty string, not an error-code enum; decide whether to
  narrow it. Assert the reset form is never mounted when `error` is present.

### RTE-020 · Auth-error page maps known codes and falls back for unknown ones

- **Covers:** `src/routes/(auth)/_authLayout/auth-error.tsx`,
  `src/features/auth/authErrors.ts`
- **Type:** e2e · **Priority:** P2 · **Status:** Missing
- **Given** `/auth-error?error=state_mismatch`, an unknown code, and no code
- **When** the page renders
- **Then** the known code shows its title/message, while unknown/missing show
  "Authentication Error" with the generic message, and "Return to Sign In" /
  "Go to Homepage" links target `/sign-in` and `/`
- **Notes:** the footer still renders `Error code: ${error}`; assert it is empty for the
  missing-code case (or decide to hide it).

## Detail-route params and loaders

### RTE-021 · Detail loaders forward route params and resolve static routes first

- **Covers:** `src/routes/dashboard/_dashboardLayout/users/$userId.tsx`,
  `src/routes/dashboard/_dashboardLayout/vendors/$vendorId.tsx`,
  `src/routes/dashboard/_dashboardLayout/purchases/$purchaseId.tsx`,
  `src/routes/dashboard/_dashboardLayout/purchases/new.tsx`
- **Type:** e2e · **Priority:** P0 · **Status:** Missing
- **Given** `/dashboard/users/<uuid>`, `/dashboard/vendors/<uuid>`, and
  `/dashboard/purchases/<uuid>`
- **When** each route resolves
- **Then** its loader calls the matching `details` procedure with the raw route param,
  the component renders the returned name/email (or vendor/purchase view), and
  `/dashboard/purchases/new` matches the static `new` route without calling
  `purchase.details`
- **Notes:** vendor and purchase routes set a loader-dependent document title
  (`"<name>" vendor`, `Purchase <invoiceNo>`); the user-detail route defines no `head` and
  inherits the root default. Assert the titles (or record the gap) and assert "Go Back"
  links point to the list routes.

### RTE-022 · Invalid or missing detail records have no route-level 404 mapping

- **Covers:** `src/routes/dashboard/_dashboardLayout/users/$userId.tsx`,
  `src/routes/dashboard/_dashboardLayout/vendors/$vendorId.tsx`,
  `src/routes/dashboard/_dashboardLayout/purchases/$purchaseId.tsx`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** `/dashboard/users/not-a-uuid` and a well-formed UUID that does not exist
- **When** the loader runs
- **Then** the contract rejects the malformed ID before the handler, and the missing
  record yields the procedure's not-found error
- **Notes:** neither route defines `errorComponent` or maps a not-found error to the root
  404, so both cases currently surface the router's default error screen. Decide whether
  to render the 404 page, a page-level "not found" state, or keep the error surface, then
  assert that decision. Route params are otherwise plain strings — validation happens in
  the oRPC contract, not `validateSearch`.

## Customers page

### RTE-027 · Customers route gates access and forwards list filters to the loader

- **Covers:** `src/routes/dashboard/_dashboardLayout/customers/index.tsx`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a signed-in user with `customer:list` and a query string
- **When** `/dashboard/customers?page=2&limit=10&search=rahim&order=desc&orderField=createdAt` resolves
- **Then** `beforeLoad` passes, the loader calls `customer.list` with those values plus
  `searchFields: ["name", "phone", "address"]`, the page renders "Customer Management",
  and the loader re-runs when any forwarded filter changes
- **Notes:** a user without `customer:manage` or `customer:list` is redirected to
  `/dashboard` before the loader runs. The customer table behavior is owned by
  [customers.md](./customers.md) CUS-030/CUS-031; this case covers only route wiring.

### RTE-029 · Customer detail route loads the customer and drives tabs from `?tab=`

- **Covers:** `src/routes/dashboard/_dashboardLayout/customers/$customerId.tsx`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a signed-in user with `customer:read` and customer A, and URLs
  `/dashboard/customers/<A>`, `?tab=purchase`, `?tab=payment`, and `?tab=other`
- **When** each URL resolves
- **Then** `beforeLoad` passes, the loader calls `customer.details` with A's raw route
  param, the document title is `"<A name>" customer`, the header shows the name and
  active badge, and "Go Back" targets `/dashboard/customers`; no `tab` defaults to
  Details, `?tab=purchase` renders Purchases, `?tab=payment` renders Payments, clicking a
  tab writes its value to the URL, and `?tab=other` is a search-validation error
- **Notes:** tab values are `details | purchase | payment` while the visible labels are
  "Details", "Purchase", and "Payments". The route accepts `customer:manage` or
  `customer:read`; a user without either is redirected before the loader runs. A missing
  customer surfaces the procedure's not-found error. Tab content is owned by
  [customers.md](./customers.md) CUS-032; this case covers route wiring only.

## Sales page

### RTE-028 · Sales route gates access and forwards list filters to the loader

- **Covers:** `src/routes/dashboard/_dashboardLayout/sales.tsx`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a signed-in user with `sale:list` and a query string
- **When** `/dashboard/sales?page=2&limit=10&search=si-0002&order=desc&orderField=createdAt&unpaidOnly=true` resolves
- **Then** `beforeLoad` passes, the loader calls `sale.list` with those values plus
  `searchFields: ["invoiceNo", "customerName"]` and `filter.createdAt` from the range
  defaults, the page renders "Sales Management", and the loader re-runs when any
  forwarded filter changes
- **Notes:** a user without `sale:manage` or `sale:list` is redirected to `/dashboard`
  before the loader runs. The sales table behavior is owned by
  [sales.md](./sales.md) SAL-031/SAL-032; this case covers only route wiring.

## Cash closing page

### RTE-030 · Cash closing route gates on report access and forwards the period range

- **Covers:** `src/routes/dashboard/_dashboardLayout/cash-closing/index.tsx`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a signed-in user with `{ level: "system", resource: "report", action: "list" }`
  and `/dashboard/cash-closing?page=2&limit=10&search=admin&order=desc&orderField=difference`
- **When** the route resolves
- **Then** `beforeLoad` passes, the loader calls `cashClosing.list` with those values plus
  `searchFields: ["closedByName", "note"]` and `filter.periodStart` built from the
  `THIS_MONTH` range defaults, the page renders "Cash Closings", and changing any
  forwarded filter re-runs the loader
- **Notes:** a user without `report:manage` or `report:list` is redirected to `/dashboard`
  before the loader runs. Opening `/dashboard/cash-closing` with no query string keeps
  the default `range`, `startTime`, and `endTime`. The table behavior is owned by
  [cash-closing.md](./cash-closing.md) CCL-030–CCL-032.

## Settings

### RTE-023 · Settings shell redirects its index and gates only on authentication

- **Covers:** `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout.tsx`,
  `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout/index.tsx` and the
  four tab routes
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** an authenticated user with no domain permissions opening
  `/dashboard/settings`
- **When** the settings layout and index render
- **Then** the URL becomes `/dashboard/settings/profile`, the header shows "Settings"
  with the settings sidebar and outlet, and `profile`, `update-password`, `sessions`, and
  `connected-apps` all render without a page-level permission redirect
- **Notes:** `<Navigate>` runs in a layout effect with no `replace`, so it pushes a new
  entry; pressing Back from profile returns to `/dashboard/settings` and immediately
  pushes profile again. Decide whether to use `replace` and assert history behavior.
  Confirm that "any authenticated user may change their own password/sessions" is
  intended before locking this in.

### RTE-024 · Update-password chooses change vs. set from linked accounts

- **Covers:** `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout/update-password.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the accounts loader returns a `credential` account (or only OAuth accounts)
- **When** the page renders
- **Then** the credential case shows "Change Password" with `UpdatePasswordForm`, and the
  OAuth-only case shows "Set Password" with `SetPasswordButton`
- **Notes:** the loader calls `auth.api.listUserAccounts` through a server function;
  assert the mocked headers path and the empty-array case (treated as "Set Password").

### RTE-025 · Sessions and connected-apps map loader data correctly

- **Covers:** `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout/sessions.tsx`,
  `src/routes/dashboard/_dashboardLayout/settings/_settingsLayout/connected-apps.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the sessions loader returns two sessions and the dashboard layout context
  exposes the current session token; the accounts loader returns one `credential` and
  one `google` account
- **When** each page renders
- **Then** `SessionManagement` receives both sessions plus the current token, and
  `LinkingApps` receives only the Google account (credential filtered out)
- **Notes:** both loaders run inside the settings outlet, so they inherit the dashboard
  guard and the `session` from route context. Assert the filter with an all-credential
  list as well (empty array to `LinkingApps`).

## Router factory

### RTE-026 · `getRouter` builds the router with the documented defaults and a fresh query client

- **Covers:** `getRouter` — `src/router.tsx`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** no router has been created yet
- **When** `getRouter()` is called
- **Then** the returned router uses the generated `routeTree`, sets
  `scrollRestoration: true`, `defaultPreload: "intent"`, and
  `defaultPreloadStaleTime: 0`, provides a `defaultErrorComponent` that renders
  TanStack's `ErrorComponent` with the thrown error, and exposes a working
  `queryClient` in its context
- **Notes:** calling `getRouter()` twice must yield separate query clients rather than a
  shared module-level instance. Importing `src/router.tsx` pulls `routeTree.gen` and
  `@/lib/env`, so set `SKIP_ENV_VALIDATION=true` before import. Assert against
  `router.options` (and render the error component with a sample error) rather than
  relying on file contents. The `Register` module augmentation is type-only and needs no
  runtime assertion.

## Known risks

- **Dropped redirect target:** the dashboard guard's `href` redirect discards
  `search.redirect`, so users never return to the page they requested after signing in.
- **Silent permission denial:** unauthorized users are sent to `/dashboard` with no 403
  or explanation, and the target would loop if `/dashboard` ever gains a gate.
- **Role-less lockout:** a signed-in user without a role row crashes the root
  `beforeLoad`, including auth pages.
- **Boolean coercion:** `unpaidOnly=false` means "true".
- **Settings history loop:** the settings index pushes instead of replacing, so Back
  re-triggers the redirect.
- **Param errors:** malformed/missing detail IDs show the generic router error surface;
  there is no route-level 404 mapping.
