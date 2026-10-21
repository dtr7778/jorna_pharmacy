# Server and oRPC Plumbing — Test Implementation

Scope: `src/server/**` — oRPC base builders, error map, handlers, root router, and the
auth/error middlewares — plus the two HTTP endpoints in `src/routes/api/**`
(`auth.$.ts`, `rpc.$.ts`). Feature procedure behavior and `hasPermission` internals are
owned by their domain documents (`auth.md`, `user.md`, and so on); this document covers
how the server plumbing feeds them.

## Source map

| File                                        | Responsibility                                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/server/orpc.base.ts`                   | `baseOs` with `ORPCContext` and the five project error codes (401/403/400/429/422)                                                  |
| `src/server/orpc.contract-base.ts`          | `baseContract` mirroring the same error map for feature contracts                                                                   |
| `src/server/orpc.os-base.ts`                | `publicOs` (error middleware only) and `authBaseOs` (error + auth middleware)                                                       |
| `src/server/orpc.router.ts`                 | Root router: `user`, `role`, `vendor`, `customer`, `sale`, `purchase`, `medicine`, `cashClosing`                                    |
| `src/server/middleware/auth.middleware.ts`  | Session resolution, role/permission resolution, `authMiddleware`, `userRoleMiddleware`, `userPermissionMiddleware`, `validateRoles` |
| `src/server/middleware/error.middleware.ts` | `onError` mapping: input validation → 422, output validation, `ORPCError` passthrough, unknown errors → 500                         |
| `src/server/orpc.handler.ts`                | `rpcHandler` (CORS, CSRF, smart coercion) and `openAPIHandler` (Scalar reference docs)                                              |
| `src/server/orpc.ts`                        | Isomorphic client: server-side router client, browser `RPCLink`, TanStack Query utils                                               |
| `src/routes/api/auth.$.ts`                  | Splat route forwarding GET/POST to `auth.handler`                                                                                   |
| `src/routes/api/rpc.$.ts`                   | `ANY` route forwarding to `rpcHandler` under the `/api/rpc` prefix                                                                  |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 22     |
| **Total**   | **22** |

Existing test files: none. There are no `*.test.ts(x)` or `*.spec.ts(x)` files under
`src/server/**` or `src/routes/api/**`.

## Test environment and mocks

- The default Vitest project is jsdom (`vitest.config.ts`). Server tests should opt into
  Node with a per-file `// @vitest-environment node`.
- `src/lib/db.server.ts` imports `cloudflare:workers`; `src/server/orpc.ts` imports
  `@tanstack/react-start/server`. Mock those modules before importing anything that
  reaches them.
- Mock `@/features/auth/auth.server` (`auth.api.getSession`, `auth.handler`) and
  `@/features/auth/getUserPermission`. Do not boot better-auth, mail, or env-dependent
  auth plugins in these tests.
- `@/lib/env` validates on import. Set the required `process.env` keys or
  `SKIP_ENV_VALIDATION=true` before importing `src/server/orpc.handler.ts`, which also
  imports `package.json` for the OpenAPI version.
- Build `ORPCContext` fixtures with fixed ids, `new Headers()`, and a stub `db`. D1 is
  only reached through `getUserRolesAndPermission`; mock that module unless a case
  explicitly asks for Drizzle.
- Drive procedures with `call` or a throwaway procedure built on `baseOs` so assertions
  are on code/status/message/data, not on internal call order. Use `vi.fn()` for `next`
  only when testing a middleware in isolation.
- Router-shape tests import every feature router. Mock the seven feature router modules
  to keep this document's tests independent of domain changes.
- Route handlers: import the route module and invoke the handler exposed under the
  route's `options.server.handlers`. `createFileRoute` may warn about route ids under
  Vitest; if module-level creation is not viable, extract the handler bodies into
  importable functions. `Request`/`Response` are global on Node 20+.
- No real network, D1, or timers. Freeze time when a session fixture needs `expiresAt`.

## Base error maps and builders

### SRV-001 · Declared error codes carry their documented status and default message

- **Covers:** `baseOs` — `src/server/orpc.base.ts`; `baseContract` — `src/server/orpc.contract-base.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a procedure declared on `baseOs`
- **When** it throws `errors.UNAUTHORIZED()`, `FORBIDDEN()`, `BAD_REQUEST()`, and `TOO_MANY_REQUESTS()`
- **Then** the caller receives 401, 403, 400, and 429 respectively, each with the matching `API_MESSAGES.GENERAL` text
- **And** `INPUT_VALIDATION_FAILED` is 422 with `data.formErrors: string[]` and `data.fieldErrors: Record<string, string[] | undefined>`
- **And** `baseContract` declares the same five codes with identical statuses and default messages
- **Notes:** `success: false` is declared in both maps but is not a standard `ORPCError` field; assert what actually reaches the client and record it. Built-in codes such as `NOT_FOUND` come from oRPC, not this map.

### SRV-002 · `publicOs` runs without resolving a session

- **Covers:** `publicOs` — `src/server/orpc.os-base.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a procedure built on `publicOs` whose handler returns a value
- **When** it is called with an anonymous context (`session: null`, `user: null`)
- **Then** the handler runs, the value is returned, and `auth.api.getSession` is never called
- **Notes:** `publicOs` is currently exported but not imported anywhere. This case pins the intended contract of the builder rather than existing call sites.

### SRV-003 · `authBaseOs` rejects anonymous callers and forwards the session

- **Covers:** `authBaseOs` — `src/server/orpc.os-base.ts`; `authMiddleware` — `src/server/middleware/auth.middleware.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a procedure built on `authBaseOs`
- **When** it is called without a session
- **Then** it fails with `UNAUTHORIZED` (401, "Please login to continue.") and the handler is not called
- **And** when the context has a valid session/user, the handler receives those exact objects and its result is returned
- **Notes:** `authBaseOs` composes error middleware before auth middleware, unlike feature procedures (see SRV-017). It does not populate `roles`/`permissions`; they stay as supplied in the context.

## Auth middleware

### SRV-004 · A fully cached context bypasses the auth lookup

- **Covers:** `getAuthData` — `src/server/middleware/auth.middleware.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a context whose `session` and `user` are both non-null
- **When** `getAuthData` or `authMiddleware` runs
- **Then** it returns those exact objects and `auth.api.getSession` is not called
- **And** when only one of the two is non-null, the lookup still runs
- **Notes:** cached values are trusted without an expiry or signature check. If that changes, this case should assert re-validation instead.

### SRV-005 · A missing session produces 401 and never runs the handler

- **Covers:** `authMiddleware` — `src/server/middleware/auth.middleware.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** an anonymous context and `auth.api.getSession` resolving `null`
- **When** a protected procedure is called
- **Then** it fails with `UNAUTHORIZED`, status 401, message "Please login to continue."
- **And** the procedure handler and any downstream middleware are not executed
- **Notes:** the same response is expected for a missing cookie, an expired session, and an invalid session. Assert that no user or session detail is included in the error body.

### SRV-006 · Session lookup failures become 401, while `ORPCError`s propagate

- **Covers:** `getAuthData` — `src/server/middleware/auth.middleware.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `auth.api.getSession` rejects with a plain `Error` (database or network failure)
- **When** a protected procedure is called
- **Then** the caller sees `UNAUTHORIZED` 401, not 500
- **And** if the rejection is an `ORPCError` (for example `TOO_MANY_REQUESTS`), that error propagates unchanged
- **Notes:** `getAuthData` awaits the call inside `try`, so both branches are real. This masks auth-backend outages as "not logged in"; confirm that is intended. Role lookups behave differently — see SRV-007.

### SRV-007 · Role denial is 403, while role-resolution failure escapes as 500

- **Covers:** `userRoleMiddleware`, `getRolePermissionData`, `validateRoles` — `src/server/middleware/auth.middleware.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** an authenticated user whose roles resolve to `["USER"]`
- **When** a procedure requires `["ADMIN", "SUPER_ADMIN"]`
- **Then** the call fails with `FORBIDDEN` 403 and "You don't have permission to perform this action."
- **And** the handler never runs
- **And** an authenticated user with no role rows makes `getUserRolesAndPermission` reject with "User has no system role"; the rejection escapes `getRolePermissionData` (it returns the promise inside `try` instead of awaiting it), so the caller receives `INTERNAL_SERVER_ERROR` 500 rather than 401
- **Notes:** the `null` return in `getRolePermissionData` is effectively unreachable for async failures, and `resolveAuthContext`'s 401 branch therefore only fires for missing sessions. This is an inconsistency worth a decision: unprovisioned users should probably get 401/403, and the helper should `return await`. If that changes, turn the 500 expectation into the new status.

### SRV-008 · `validateRoles` uses empty-as-allow and any-of matching

- **Covers:** `validateRoles` — `src/server/middleware/auth.middleware.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** direct calls to `validateRoles`
- **When** the required role list is empty
- **Then** it returns `true` for any user, including one with no roles
- **And** with `["ADMIN", "SUPER_ADMIN"]` required, an `ADMIN` passes and an `EMPLOYEE` does not (any-of, not all-of)
- **And** matching is exact and case-sensitive (`"admin"` does not match `"ADMIN"`), and duplicate user roles do not change the result
- **Notes:** pure function, no DB or context required.

### SRV-009 · Role/permission cache requires both arrays, and the resolved context is injected

- **Covers:** `getRolePermissionData`, `userRoleMiddleware` — `src/server/middleware/auth.middleware.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a context with both `roles` and `permissions` non-empty
- **When** `userRoleMiddleware` runs
- **Then** `getUserRolesAndPermission` is not called and `next` receives `session`, `user`, `roles`, and `permissions`
- **And** when either array is empty, the database resolution runs instead
- **Notes:** a user with roles but a legitimately empty permission set re-queries on every call. If a resolved flag is added later, the cache condition and this case should change together.

### SRV-010 · Permission grants, the `manage` wildcard, and OR-semantics

- **Covers:** `userPermissionMiddleware` — `src/server/middleware/auth.middleware.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** an authenticated user with `{ level: "system", resource: "user", action: "read" }`
- **When** a procedure requires the same permission
- **Then** the handler runs
- **And** `system:user:manage` satisfies `system:user:read`, `list`, and `update`
- **And** a user without a matching `level:resource:action` gets `FORBIDDEN` 403 and the handler does not run
- **And** when several permissions are required, any single match grants access (OR), and no match denies
- **Notes:** `hasPermission` unit coverage belongs in `auth.md`. This case only proves the middleware wires the result to 403/allowed execution.

### SRV-011 · An empty permission requirement still requires authentication

- **Covers:** `userPermissionMiddleware` — `src/server/middleware/auth.middleware.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `userPermissionMiddleware([])`
- **When** an authenticated user with zero permissions calls the procedure
- **Then** it succeeds, because an empty requirement is treated as "allow"
- **And** an anonymous caller still gets 401 before the permission check
- **Notes:** no feature procedure passes an empty array today. Keep this as a documented edge in case one does.

### SRV-012 · Self-level requirements never receive a target resource id

- **Covers:** `userPermissionMiddleware` — `src/server/middleware/auth.middleware.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a requirement `{ level: "self", resource: "user", action: "update" }` and a user holding `self:user:update`
- **When** the middleware runs for a procedure whose input identifies a different user's id
- **Then** the middleware allows the call, because `hasPermission` is invoked with `{ userId }` only and the `userId !== resourceId` exclusion never runs
- **And** a `self`-level grant alone does not satisfy a `system`-level requirement (403)
- **Notes:** this is an authorization gap waiting for a caller. Today self-scoped procedures such as `user.updateProfile` mutate only `context.user.id`, so impact is contained. Decide whether the middleware should accept a resource-id resolver; if it does, this case becomes the regression test for the exclusion.

## Error middleware

### SRV-013 · Input validation maps to 422 with flattened error data

- **Covers:** `errorMiddleware` — `src/server/middleware/error.middleware.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a procedure whose input fails its zod schema, producing `BAD_REQUEST` with a `ValidationError` cause
- **When** the call passes through `errorMiddleware`
- **Then** the caller receives `INPUT_VALIDATION_FAILED` with status 422 and `message` set to the prettified zod error (not the generic `API_MESSAGES.GENERAL.INPUT_VALIDATION_FAILED` text)
- **And** `data.formErrors` / `data.fieldErrors` contain the flattened zod error, and `cause` is the original `ValidationError`
- **Notes:** assert the offending field keys and messages rather than the full prettified string, which is library/version dependent. A `BAD_REQUEST` without a `ValidationError` cause must fall through to the generic `ORPCError` branch instead.

### SRV-014 · Output validation maps to `OUTPUT_VALIDATION_FAILED`

- **Covers:** `errorMiddleware` — `src/server/middleware/error.middleware.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a handler returns data that fails its output schema, yielding `INTERNAL_SERVER_ERROR` with a `ValidationError` cause
- **When** the error reaches `errorMiddleware`
- **Then** the caller receives `OUTPUT_VALIDATION_FAILED` with status 500, the original message, original `data`, and the `ValidationError` cause
- **Notes:** this code is not declared in `baseOs` or `baseContract`. Verify client typing/serialization and that the status stays 500 rather than becoming a validation 422.

### SRV-015 · `ORPCError` passes through with code, status, message, and data intact

- **Covers:** `errorMiddleware` — `src/server/middleware/error.middleware.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a handler throws `new ORPCError("NOT_FOUND", { status: 404, message: "...", data: { id } })`
- **When** the error reaches `errorMiddleware`
- **Then** the caller receives an `ORPCError` with the same code, status, message, and data
- **And** its `cause` is the original error instance
- **Notes:** the middleware re-creates the error, so assert fields, not `toBe` identity. Confirm that the cause chain is not serialized to the client.

### SRV-016 · Unknown errors become 500, but non-`Error` throws pass through

- **Covers:** `errorMiddleware` — `src/server/middleware/error.middleware.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a handler throws `new Error("boom")`
- **When** the error reaches `errorMiddleware`
- **Then** the caller receives `INTERNAL_SERVER_ERROR` with status 500 and message "boom"
- **And** a thrown non-`Error` value (for example a string or plain object) is rethrown unchanged, because the `onError` callback returns without throwing
- **Notes:** decide whether non-`Error` throws should be normalized. Today they bypass the mapper and surface as an unmapped failure.

### SRV-017 · Middleware composition must yield the same public auth error

- **Covers:** `errorMiddleware` — `src/server/middleware/error.middleware.ts`; `src/server/orpc.os-base.ts`; feature procedure composition
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** feature procedures compose `.use(authMiddleware).use(errorMiddleware)`, while `authBaseOs` applies error middleware outside auth middleware
- **When** authentication fails
- **Then** both compositions expose the same `UNAUTHORIZED` 401 shape
- **Notes:** verify the installed oRPC version's middleware ordering before encoding expectations. If auth failures raised before `next` bypass `onError` in feature procedures, document that or standardize the composition. This case exists to keep the two paths consistent, not to bless a particular order.

## Router and transport

### SRV-018 · The root router exposes the expected namespaces

- **Covers:** `router` — `src/server/orpc.router.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the exported root router
- **When** its top-level keys are inspected
- **Then** they are exactly `user`, `role`, `vendor`, `customer`, `sale`, `purchase`,
  `medicine`, and `cashClosing`
- **And** `vendor.payment` exposes `create`, `list`, and `stats`; `customer` exposes
  `list`, `listForSearch`, `create`, `update`, and `details`; `customer.payment` exposes
  `list` and `create`; `sale.list` matches the sale router; `cashClosing.list` matches
  the cash closing router; and each namespace matches its feature router's procedures
- **Notes:** the import graph pulls all feature procedures and auth. Mock the eight
  feature router modules so this test tracks the composition, not domain changes.

### SRV-019 · The auth route forwards GET and POST to better-auth

- **Covers:** `src/routes/api/auth.$.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** the route handler for `/api/auth/$`
- **When** a GET or POST request for `/api/auth/sign-in/email` (or any nested auth path) is dispatched
- **Then** `auth.handler` receives the same `Request` instance and its `Response` is returned unchanged (status, headers, body)
- **And** no `PUT`, `PATCH`, `DELETE`, `HEAD`, or `OPTIONS` handler is declared by this module
- **Notes:** the file is a splat route, so every better-auth subpath lands here. Decide and test the expected status for unsupported methods (405 vs 404) instead of leaving it to the framework.

### SRV-020 · The RPC route builds an anonymous request context

- **Covers:** `src/routes/api/rpc.$.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** the `ANY` handler for `/api/rpc/$`
- **When** a request hits `/api/rpc/medicine/list`
- **Then** `rpcHandler.handle` receives the same `Request`, `prefix: "/api/rpc"`, `context.reqHeaders` identical to `request.headers`, `db` from `getDB()`, and `user`/`session` null with empty `roles` and `permissions`
- **And** `getDB()` is called once per request
- **And** GET, POST, and OPTIONS all dispatch through the same handler
- **Notes:** authentication is intentionally deferred to the procedure's middleware; the route must never pre-populate a user. When `handle` returns no response, the route returns a 404 with body "Not Found" — assert that fallback too.

### SRV-021 · RPC and OpenAPI handlers are configured differently

- **Covers:** `rpcHandler`, `openAPIHandler` — `src/server/orpc.handler.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the exported handlers
- **When** requests are dispatched through `rpcHandler`
- **Then** CORS, CSRF, and smart-coercion behavior is observable (for example, a string `"5"` is coerced for a numeric input)
- **And** a request without `x-csrf-token: orpc` fails with `CSRF_TOKEN_MISMATCH` 403, while the browser link plugin sends that header
- **And** OpenAPI generation uses `env.VITE_APP_NAME`, the package version, and bearer auth, while `openAPIHandler` is not mounted on any route
- **Notes:** `openAPIHandler` is exported but unused; only `/api/rpc` serves `rpcHandler`. Decide whether to mount the docs/OpenAPI endpoint or delete the export. Observe headers/status rather than asserting plugin arrays.

### SRV-022 · The isomorphic client builds server and browser contexts correctly

- **Covers:** `orpcClient`, `orpcTQClient` — `src/server/orpc.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the server branch of `createIsomorphicFn`
- **When** the router client is created and used
- **Then** its context factory returns `reqHeaders` from `getRequestHeaders()`, `db` from `getDB()`, `user`/`session` null, and empty `roles`/`permissions`, so middleware performs auth
- **And** the browser branch points `RPCLink` at `${window.location.origin}/api/rpc`, attaches the CSRF link plugin, and throws if evaluated without `window`
- **And** `orpcTQClient` exposes TanStack Query utils for the same router
- **Notes:** the two branches cannot both run in one environment; test the server context factory directly and the browser branch in jsdom. Dashboard routes depend on this module, so a regression here breaks every client call.
