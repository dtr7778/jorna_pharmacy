# Constants and Shared Types — Test Implementation

Scope: `src/constants/**` (API message catalog, app-wide constants and navigation
registries) and `src/types/**` (shared type contracts and TanStack module augmentation).
Runtime behavior owned by consumers is tested in their own documents and cross-linked
below: `components-shared.md` for `findBreadcrumbs` / `filterSidebarMenu` /
`NestedMenuItem`, `server.md` for oRPC contracts that consume `API_MESSAGES`, and
`routes.md` for the route files themselves.

> **Document registration:** this is a new child document. Add it to the index in
> `main-test-implementation.md` (`Constants and shared types` → `src/constants/**`,
> `src/types/**`) in the same change that links it; this draft does not edit the index.

## Source map

| File                             | Responsibility                                                                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/constants/apiMessage.ts`    | `API_MESSAGES` catalog: general, user/role, medicine, customer, sale, vendor, purchase, and payment success/error copy                                                  |
| `src/constants/index.ts`         | Theme/background colors, site description, auth path constants, OAuth provider tuple, `breadcrumbRoutes`, pagination defaults                                           |
| `src/constants/sidebarLinks.tsx` | `sidebarMenuLinks` (grouped main nav with permission tuples and active-state regexes), `footerMenuLinks`, `settingsMenuLinks`                                           |
| `src/types/index.ts`             | `RoutePathType`, `NODE_ENV_TYPE`, `RoleType`, `PermissionType`, `BreadcrumbRouteType`, `SidebarMenuLinkType`, `SidebarGroupMenuLinkType`, `FieldError`, `IApiHookInput` |
| `src/types/data-table.ts`        | `QueryKeys`, `Option`, `FilterVariant`, `ColumnType`, `FiltersType`, plus `TableMeta` / `ColumnMeta` module augmentation                                                |
| `src/types/orpc.types.ts`        | `ORPCContext`, `InferContractRouterType`                                                                                                                                |

Existing test files in scope: **none**. No test file currently imports anything from
`src/constants/**` or `src/types/**`, and no story asserts these modules.

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 16     |
| **Total**   | **16** |

Group counts: API message catalog 3 · constants index 3 · breadcrumbs 2 · sidebar
links 5 · types 3.

## Test environment

- Pure unit tests. Add `*.test.ts` next to the source; the jsdom project in
  `vitest.config.ts` includes `src/**/*.{test,spec}.{ts,tsx}` and loads
  `test/setup.ts`. No D1 binding and no React renderer is required.
- Importing `src/constants/sidebarLinks.tsx` evaluates React elements for the lucide
  icons at module load. This is safe in jsdom but is the reason the module is **not**
  re-exported from `src/constants/index.ts` (server code imports the barrel).
- Type-level cases (`CON-014`–`CON-016`) use `expectTypeOf` from `vitest` and must live
  inside a real `test(...)` block: Vitest fails a file that registers no suite, and the
  assertions are erased at runtime. The authoritative gate for those cases is
  `pnpm typecheck` (tsconfig `include` covers every `*.ts` / `*.tsx` under the repo,
  so `@ts-expect-error` is enforced there, not by `pnpm test`).
- Permission enum values come from `src/db/schemas/enums/enum-values.ts`
  (`PERMISSION_LEVEL`, `RESOURCE_TYPE`, `ACTION_TYPE`). Those schema files are out of
  scope for coverage by project decision; they are imported only as test fixtures.
- Do not duplicate route-path lists from `src/routes/**` in tests. Read the generated
  `routeTree` (`src/routeTree.gen.ts`) or the route module list so the assertions cannot
  drift from the real routing table.

## API message catalog

### CON-001 · Every API message leaf is a non-empty, trimmed string

- **Covers:** `API_MESSAGES` — `src/constants/apiMessage.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the imported `API_MESSAGES` object (nested namespaces, including
  `VENDOR.PURCHASE`, `VENDOR.PAYMENT`, `CUSTOMER`, `SALE`, and `CASH_CLOSING`)
- **When** every leaf is collected recursively
- **Then** each leaf is a `string` whose trimmed length is greater than zero, with no
  leading or trailing whitespace and no line breaks
- **Notes:** guards against a new namespace being added with an empty placeholder. Do not
  assert uniqueness: `USER.GET_ALL` and `USER.GET_ALL_FOR_SEARCH` intentionally share
  the same text.

### CON-002 · General error copy matches the documented contract strings

- **Covers:** `API_MESSAGES.GENERAL` — `src/constants/apiMessage.ts`; consumed by
  `src/server/orpc.base.ts` and `src/server/orpc.contract-base.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the five general error entries used by the base oRPC contract
- **When** each message is read
- **Then** the values are exactly: `UNAUTHORIZED` = "Please login to continue.",
  `FORBIDDEN` = "You don't have permission to perform this action.",
  `BAD_REQUEST` = "Invalid request. Please check your input and try again.",
  `TOO_MANY_REQUESTS` = "Too many requests. Please try again later.",
  `INPUT_VALIDATION_FAILED` = "Please check your input and fix any errors."
- **Notes:** these strings are user-visible API defaults; pinning them makes copy changes
  deliberate. Server-side status/message wiring is covered in `server.md`; this case
  asserts only the catalog values.

### CON-003 · Error copy is free of known typos and follows one punctuation style

- **Covers:** `API_MESSAGES.USER.NOT_UPDATE`, `API_MESSAGES.VENDOR.NOT_CREATE`,
  `API_MESSAGES.VENDOR.NOT_UPDATE`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the catalog entries for failed user and vendor updates/creates
- **When** compared against the catalog's sentence style (most failure messages end with
  a period)
- **Then** `USER.NOT_UPDATE` reads "Failed to update profile. Please try again." (today it
  contains the typo "prifle"), and every `NOT_CREATE` / `NOT_UPDATE` message ends with a
  period
- **Notes:** decision required from the owner before implementing: fix the typo and add
  the missing periods in `apiMessage.ts` (vendor entries currently have none), or record
  that vendor copy intentionally omits terminal punctuation. Write the test against the
  agreed final copy, and update any snapshot/toast expectations that quote it.

## Constants index

### CON-004 · The `@/constants` barrel exports the documented surface

- **Covers:** `src/constants/index.ts` (and its public import surface)
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `import * as constants from "@/constants"`
- **When** the exported names are enumerated
- **Then** they are exactly `THEME_COLOR`, `BACKGROUND_COLOR`, `SITE_DESCRIPTION`,
  `DEFAULT_UNAUTH_PATH`, `DEFAULT_AUTH_PATH`, `RESET_PASSWORD_PATH`,
  `AUTH_ERROR_PAGE`, `SUPPORTED_OAUTH_PROVIDERS`, `breadcrumbRoutes`,
  `DEFAULT_PAGE_INDEX`, `DEFAULT_PAGE_SIZE`
- **Given** `SUPPORTED_OAUTH_PROVIDERS`
- **When** read at runtime
- **Then** it deep-equals `["google"]` and its static type is the readonly tuple
  `readonly ["google"]` (assert with `expectTypeOf` inside the same test)
- **Notes:** `sidebarLinks` and `apiMessage` are intentionally subpath imports; add a
  comment in the test so a future contributor does not "helpfully" add them to the
  barrel and pull JSX into server bundles. `SITE_DESCRIPTION` and color values are
  asserted as non-empty strings, not exact marketing copy.

### CON-005 · Default navigation and pagination constants hold their documented values

- **Covers:** `DEFAULT_UNAUTH_PATH`, `DEFAULT_AUTH_PATH`, `RESET_PASSWORD_PATH`,
  `AUTH_ERROR_PAGE`, `DEFAULT_PAGE_INDEX`, `DEFAULT_PAGE_SIZE` —
  `src/constants/index.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the exported default constants
- **When** their values are read
- **Then** the four paths are `/sign-in`, `/dashboard`, `/reset-password`, and
  `/auth-error`; each starts with `/` and all four are distinct
- **And** `DEFAULT_PAGE_INDEX` is `1` and `DEFAULT_PAGE_SIZE` is `20`, both integers
  greater than or equal to `1`
- **Notes:** `querySearchSchema` (`src/lib/querySearchSchema.ts`) and the table hooks
  depend on these defaults, so a change is a behavior change. Distinctness matters
  because auth guards compare these paths.

### CON-006 · Path constants resolve to real routes in the generated route tree

- **Covers:** `DEFAULT_UNAUTH_PATH`, `DEFAULT_AUTH_PATH`, `RESET_PASSWORD_PATH`,
  `AUTH_ERROR_PAGE` — `src/constants/index.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the generated `routeTree` from `src/routeTree.gen.ts`
- **When** the router tree is traversed and each constant path is looked up
- **Then** every constant resolves to a registered route (`/sign-in`, `/dashboard`,
  `/reset-password`, `/auth-error`)
- **Notes:** these constants are typed as plain strings, so a deleted/renamed route is
  not caught by `tsc`; a stale value silently breaks redirects. Index routes are
  registered as `/dashboard/` in the generated path map while the layout route's
  `fullPath` is `/dashboard` — tolerate the trailing slash. Prefer walking `fullPath`
  values over importing internal route modules.

## Breadcrumbs

### CON-007 · Breadcrumb routes form an absolute, unique, parent-prefixed tree

- **Covers:** `breadcrumbRoutes` — `src/constants/index.ts`; consumed by
  `findBreadcrumbs` in `src/components/shared/AppBreadcrumb.tsx`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the `breadcrumbRoutes` tree
- **When** every node is walked recursively
- **Then** each `path` starts with `/`, each non-empty `title` has no leading/trailing
  whitespace, no `path` appears twice, and every child path equals
  `` `${parent.path}/${childSegment}` `` (children are nested under their parent)
- **Notes:** path matching in `findBreadcrumbs` is exact string equality per segment, so
  a parent/child prefix mistake yields a missing crumb rather than an error. Rendering
  and lookup behavior stay in `components-shared.md`.

### CON-008 · Every sidebar destination has a complete breadcrumb trail

- **Covers:** `sidebarMenuLinks`, `footerMenuLinks`, `settingsMenuLinks` —
  `src/constants/sidebarLinks.tsx`; `breadcrumbRoutes` — `src/constants/index.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** every destination path in the three navigation registries
- **When** each path is passed to `findBreadcrumbs(breadcrumbRoutes, path)`
- **Then** the returned trail is non-empty and its last entry's `path` equals the
  destination path
- **Notes:** expected to fail for `/dashboard/vendors`, `/dashboard/payments`,
  `/dashboard/purchases`, `/dashboard/medicines`, and `/dashboard/sales`, which only
  resolve the `/dashboard` crumb today. Decision required: add the missing `breadcrumbRoutes`
  entries (preferred, keeps the topbar consistent) or narrow this case to an explicit
  allowlist of pages that intentionally show only the root crumb. Importing
  `findBreadcrumbs` pulls the component module; if that proves heavy, extract the pure
  lookup into a helper as a separate code change (owned by `components-shared.md`).

## Sidebar navigation

### CON-009 · Every link path matches its own active-state regex

- **Covers:** `sidebarMenuLinks.items`, `footerMenuLinks` — `src/constants/sidebarLinks.tsx`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** every link that declares `pathRegex` (main groups recursively, plus footer)
- **When** `pathRegex.test(path)` is evaluated for that link
- **Then** the result is `true` for every link, including nested items
- **Notes:** `NestedMenuItem` uses this regex for `isActive`. `settingsMenuLinks` has no
  `pathRegex` and `SettingsSidebar` compares `pathname === path` instead, so it is out of
  scope here. `footerMenuLinks[].pathRegex` is currently unused by
  `SidebarFooterMenu` (it uses equality/prefix); keep the assertion anyway since the
  field is declared in `SidebarMenuLinkType`.

### CON-010 · Navigation paths and titles are unique within their registries

- **Covers:** `sidebarMenuLinks`, `footerMenuLinks`, `settingsMenuLinks` —
  `src/constants/sidebarLinks.tsx`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the flattened links of all three registries
- **When** paths and titles are collected
- **Then** every `path` is unique across all three registries, and every `title` is
  unique within its own group (two different groups may reuse a title)
- **Notes:** duplicate paths create duplicate React keys (`nav-*` keys use indexes, but
  breadcrumbs and the settings list key by path) and render two active entries.
  `Profile` exists both as a footer destination and a settings sub-page with different
  paths, which is valid.

### CON-011 · Sidebar permission tuples validate against the database permission enums

- **Covers:** `sidebarMenuLinks.items[].permissions` — `src/constants/sidebarLinks.tsx`;
  `PermissionType` — `src/types/index.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** every declared permission in every main navigation group
- **When** `level`, `resource`, and `action` are validated against `PERMISSION_LEVEL`,
  `RESOURCE_TYPE`, and `ACTION_TYPE`
- **Then** all three values are members of their respective enum arrays, and every
  permission object has exactly those three keys
- **Notes:** the compiler already enforces this through `PermissionType`, but a cast or a
  stale enum name would leave a menu item permanently hidden at runtime. This is the
  navigation-side guard that permission resources consumed by `hasPermission` stay
  spelled exactly like the database enums (`role_permission`, `vendor_payment`).

### CON-012 · Permission coverage per navigation group follows the documented policy

- **Covers:** `sidebarMenuLinks`, `footerMenuLinks` — `src/constants/sidebarLinks.tsx`;
  `filterSidebarMenu` in `src/components/shared/sidebar/filterSidebarMenu.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the main navigation groups and the footer links
- **When** each link's `permissions` is inspected
- **Then** `/dashboard` (Overview) and every footer link (My Profile, Settings) have no
  `permissions`, while every other main link declares at least one permission whose
  action is `manage` or `list`
- **And** no main link declares the same `level:resource:action` tuple twice
- **Notes:** `filterSidebarMenu` treats a missing `permissions` array as "visible to every
  authenticated user". Decision required: confirm that Dashboard and the self-service
  footer links are intentionally ungated; if profile/settings should require a `self`
  permission, encode that instead. This case exists to make an omitted permission list on
  a new link fail loudly.

### CON-013 · Active-state regexes do not match unrelated sibling sections

- **Covers:** `sidebarMenuLinks.items[].pathRegex`, `footerMenuLinks[].pathRegex` —
  `src/constants/sidebarLinks.tsx`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** each link with a `pathRegex`
- **When** the regex is tested against a synthetic sibling path built by appending
  `-archive` to the link path (for example `/dashboard/payments-archive`) and against
  unrelated registry paths
- **Then** it returns `false`, except where the matched path is a genuine descendant of
  the link path (the Dashboard parent may match `/dashboard/users`)
- **Notes:** the main navigation links use anchored patterns: Dashboard matches only
  `/dashboard` (optionally with a trailing slash), single-page destinations match only
  their own page, and list-plus-detail destinations match their subtree. Keep new links
  on the same convention; do not weaken the test to `true` for archive paths.

## Shared types

### CON-014 · `RoutePathType` accepts real routes and rejects unknown paths

- **Covers:** `RoutePathType` — `src/types/index.ts`; navigation registries use it for
  every `path`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the generated route tree
- **When** a known route such as `"/dashboard/users"` is assigned to `RoutePathType`
  and an unknown path such as `"/dashboard/nope"` is assigned with
  `// @ts-expect-error`
- **Then** the known path compiles, the unknown path is a type error, and
  `RoutePathType` is not simply `string`
- **Notes:** type-level only; assertions live in a `test(...)` block and are verified by
  `pnpm typecheck`. `src/constants/index.ts` path constants are untyped strings, so this
  case does not protect them — `CON-006` does. If `RoutePathType` ever degrades to
  `string`, the `@ts-expect-error` becomes an unused directive and `typecheck` fails,
  which is the intended signal.

### CON-015 · `FiltersType` and `FilterVariant` match the table query contract

- **Covers:** `FiltersType`, `FilterVariant` — `src/types/data-table.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the exported `FiltersType` and `FilterVariant` types
- **When** their members are asserted with `expectTypeOf`
- **Then** `page` and `limit` accept `number | undefined`; `order` accepts
  `"asc" | "desc" | null | undefined`; `orderField` accepts `string | null | undefined`;
  `search` accepts `string | null | undefined`; `filter` accepts
  `Record<string, string | string[] | null> | undefined`
- **And** `FilterVariant` is exactly `"text" | "number" | "range" | "date" |
"dateRange" | "boolean" | "select" | "multiSelect"`
- **Notes:** compile-time only. `FiltersType` is wrapped in `Partial`, so every key is
  optional. Note the divergence from `querySearchSchema` (`src/lib/querySearchSchema.ts`),
  where `search` is `string | undefined` with no `null`; the table state may hold `null`.
  If the owner wants a single contract, add a case rather than silently narrowing one
  side. Table components are covered in `components-data-table.md`.

### CON-016 · `ORPCContext` and the data-table module augmentation expose the expected members

- **Covers:** `ORPCContext` — `src/types/orpc.types.ts`; `QueryKeys`, `Option`,
  `ColumnType`, and the `TableMeta` / `ColumnMeta` augmentation —
  `src/types/data-table.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the exported `ORPCContext` interface
- **When** its properties are asserted with `expectTypeOf`
- **Then** `reqHeaders` is a `Readonly<Headers>`, `db` is `DatabaseType`, `user` and
  `session` are nullable, and `permissions` / `roles` are arrays of `PermissionType` /
  `RoleType`
- **Given** the TanStack table augmentation
- **When** `ColumnMeta` and `TableMeta` are asserted
- **Then** `ColumnMeta` accepts `variant: FilterVariant`, `options: Option[]`,
  `range: [number, number]`, and `unit: string`, and `TableMeta` accepts
  `queryKeys?: QueryKeys`
- **Notes:** compile-time only; no runtime assertions. `db` intentionally resolves to the
  Drizzle client type, so this test does not import a D1 binding. Nullability of `user`
  and `session` is the contract the auth middleware relies on; middleware behavior is
  covered in `server.md`.

## Compile-time-only type surface

These exported types have no runtime behavior and no useful standalone type assertion
beyond the cases above, so they are listed here rather than as separate cases. They are
still part of the public contract and are exercised indirectly wherever they are used.

| Type                                              | File                      | Disposition                                                                                                                          |
| ------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV_TYPE`                                   | `src/types/index.ts`      | Compile-time only; union is consumed by the dev panel (`components-shared.md`)                                                       |
| `RoleType`, `PermissionType`                      | `src/types/index.ts`      | `PermissionType` asserted via `CON-011`; `RoleType` is compile-time only                                                             |
| `BreadcrumbRouteType`                             | `src/types/index.ts`      | Compile-time annotation for `breadcrumbRoutes`; shape asserted behaviorally by `CON-007`                                             |
| `SidebarMenuLinkType`, `SidebarGroupMenuLinkType` | `src/types/index.ts`      | Compile-time annotations for the registries; behavior asserted by `CON-009`–`CON-013`                                                |
| `FieldError`, `IApiHookInput`                     | `src/types/index.ts`      | Compile-time only; consumed by feature API hooks (`user.md`, `medicine.md`, `vendors.md`)                                            |
| `QueryKeys`, `Option`, `ColumnType`               | `src/types/data-table.ts` | Compile-time only; `QueryKeys` / `Option` touched by `CON-016`, `ColumnType` used by table column files (`components-data-table.md`) |
| `InferContractRouterType`                         | `src/types/orpc.types.ts` | Compile-time only; consumed by every `*.contract.ts` (`server.md` and feature docs)                                                  |

## Known risks and open decisions

1. **`CON-003`** — live typo in `USER.NOT_UPDATE` ("prifle") and inconsistent terminal
   punctuation in the vendor failure copy. Needs an owner decision before the test can
   be written with a definite expectation.
2. **`CON-008`** — four main navigation destinations have no breadcrumb entry today
   (vendors, payments, purchases, medicines). Decide between adding entries and
   documenting the root-only trail.
3. **`CON-012`** — Dashboard and the self-service footer links are ungated by design or by
   omission; the policy must be stated so a new link cannot ship unscoped.
4. **`CON-013`** — three active-state regexes over-match (`payments`, `purchases`,
   `dashboard`); users can see the wrong item highlighted on archive-like paths.
5. **`CON-006`** — auth redirect path constants are not typed as `RoutePathType`, so route
   renames are only caught by a runtime route-tree test.
6. **`CON-015`** — `FiltersType.search` allows `null` while `querySearchSchema` does not;
   confirm whether both representations are intentional.
