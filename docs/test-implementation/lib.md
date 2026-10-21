# Shared Library — Test Implementation

Scope: `src/lib/**` — the API response envelope, server-bound factories, environment
validation, browser storage wrappers, route search schemas, oRPC/TanStack Query setup,
zod schema builders, document-head builders, and the `cn` re-export.

Related documents: [server.md](./server.md) owns oRPC procedure wiring that consumes
these helpers; [db-utils.md](./db-utils.md) owns pagination query builders;
[components-shared.md](./components-shared.md) owns the React query provider.

## Source map

| File                                            | Responsibility                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `src/lib/apiResponse.ts`                        | Build the `{ message, success, data }` procedure envelope                 |
| `src/lib/db.server.ts`                          | Create a Drizzle D1 client from the Worker `env.DB` binding               |
| `src/lib/env.ts`                                | Validate server and client environment variables with `@t3-oss/env-core`  |
| `src/lib/localStorage.ts`                       | JSON `localStorage` get/set/remove with swallowed errors                  |
| `src/lib/sessionStorage.ts`                     | JSON `sessionStorage` get/set/remove with SSR guards and swallowed errors |
| `src/lib/mail.server.ts`                        | Build the mail service from environment variables                         |
| `src/lib/querySearchSchema.ts`                  | TanStack Router search schema and month range defaults                    |
| `src/lib/utils.ts`                              | Re-export `cn` from the external `cn` package                             |
| `src/lib/head/buildHead.ts`                     | Compose global/page meta and link descriptors                             |
| `src/lib/head/favicon.ts`                       | Static favicon and manifest link descriptors                              |
| `src/lib/head/og.ts`                            | Open Graph and Twitter meta descriptors                                   |
| `src/lib/head/index.ts`                         | Bind `buildHead` to app env, site constants, and the app stylesheet       |
| `src/lib/tanstack-query/query-client.ts`        | Plain TanStack `QueryClient` defaults                                     |
| `src/lib/tanstack-query/query-client.orpc.ts`   | Query client with oRPC key hashing and dehydrate serialization            |
| `src/lib/tanstack-query/serializer.ts`          | Shared `StandardRPCJsonSerializer` instance                               |
| `src/lib/zod-schemas/apiOutputSchema.ts`        | Wrap a data schema in the API response envelope                           |
| `src/lib/zod-schemas/baseZodSchema.ts`          | String transforms, email/password fields, range enum                      |
| `src/lib/zod-schemas/exportDataInputSchema.ts`  | Export request schema (`format`, ordering, filter)                        |
| `src/lib/zod-schemas/exportDataOutputSchema.ts` | Export response schema (rows or raw string, filename, content type)       |
| `src/lib/zod-schemas/fieldValidatorSchema.ts`   | Allow-list validation for `searchFields` arrays                           |
| `src/lib/zod-schemas/paginateInputSchema.ts`    | Pagination/search/filter input schema factory                             |
| `src/lib/zod-schemas/paginateOutputSchema.ts`   | Pagination result envelope with `meta` and `data`                         |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 28     |
| **Total**   | **28** |

Existing test files: none under `src/lib/**` as of this draft. All cases below are
`Missing`.

## Test environment and mocks

- Tests run in the default Vitest project (`jsdom`, `test/setup.ts`) and use the
  `@/` path alias resolved from `tsconfig.json`. No test needs a real D1 binding or
  network access.
- `src/lib/env.ts` validates at module evaluation. Tests must call `vi.resetModules()`,
  set variables with `vi.stubEnv()`, and then dynamically import the module per
  scenario. Client cases run under jsdom; server-variable cases need a separate
  `// @vitest-environment node` file because `createEnv` selects the client schema
  whenever `window` exists.
- `src/lib/db.server.ts` imports `cloudflare:workers`; mock that specifier and
  `@/db/clients/drizzle-client` rather than loading a Worker runtime.
- `src/lib/mail.server.ts` reads the env singleton at call time; mock `./env` (or
  `@/lib/env`) and `@/mail/createMailService.factory`.
- `src/lib/head/index.ts` evaluates env and imports `styles.css?url`; stub the env
  module and let Vitest/Vite resolve the CSS URL, or mock the CSS specifier. The
  builders in `buildHead.ts`, `og.ts`, and `favicon.ts` are pure and need no mocks.
- `localStorage` and `sessionStorage` wrappers are tested against jsdom `Storage`.
  Replace `Storage.prototype` methods with spies to simulate malformed JSON and
  quota exceptions, and restore them in `afterEach`.
- Freeze the clock (`vi.useFakeTimers()` + `setSystemTime`) for `rangeFilterSchema`.
  Compute expected month bounds with the same `date-fns` functions used by the source
  so the assertions do not depend on the machine timezone.
- Query client and serializer cases are pure; no React renderer is required.

## API response envelope

### LIB-001 · `apiResponse` builds the standard success envelope

- **Covers:** `apiResponse` — `src/lib/apiResponse.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a message and a data object, and no explicit success flag
- **When** `apiResponse` is called
- **Then** it returns exactly `{ message, success: true, data }`, preserving the data
  reference
- **Given** `success` is passed as `false`, and separately `data` is `null`
- **When** the helper is called
- **Then** the false flag is preserved and `null` data is returned as `null`, not
  coerced or dropped
- **Notes:** every procedure's contract asserts this envelope (`apiOutputSchema`).
  Assert the key set, because extra envelope keys would leak through oRPC output
  validation.

## Browser storage

### LIB-002 · Local storage round-trips JSON values and reports missing keys as `undefined`

- **Covers:** `setItem`, `getItem`, `removeItem` — `src/lib/localStorage.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** an empty jsdom `localStorage`
- **When** objects, arrays, strings, numbers, booleans, `0`, and `null` are written and
  read back through the wrappers
- **Then** `getItem` returns structurally equal values (including falsy values and
  `null`), and a key that was never written returns `undefined`
- **When** `removeItem` is called for a stored key
- **Then** the subsequent `getItem` returns `undefined`
- **Notes:** `setItem("k", undefined)` stores the string `"undefined"`, which the
  reader cannot parse; document that behavior rather than treating it as a supported
  round trip. Keys are not namespaced by this module.

### LIB-003 · Local storage swallows parse, serialization, and quota failures

- **Covers:** `setItem`, `getItem`, `removeItem` — `src/lib/localStorage.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `localStorage.getItem` returns malformed JSON, and `console.error` is spied
- **When** `getItem` is called
- **Then** it returns `undefined`, does not throw, and logs the parse error
- **Given** a circular object and a `setItem` spy that throws a quota `DOMException`
- **When** `setItem` is called with each
- **Then** neither call throws, both resolve to `undefined`, and the error is logged;
  `removeItem` also swallows a thrown storage error
- **Notes:** the API gives callers no success signal, so a failed write is silent data
  loss. Unlike `sessionStorage`, this module has no `typeof window` guard; on the
  server the `ReferenceError` is caught by the `try` block and logged. Decide whether
  that noisy-but-safe behavior is intended.

### LIB-004 · Session storage mirrors local storage and no-ops without `window`

- **Covers:** `setItem`, `getItem`, `removeItem` — `src/lib/sessionStorage.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** jsdom `sessionStorage`
- **When** a JSON value is written, read, and removed
- **Then** the value round-trips and the removed key reads as `undefined`
- **Given** malformed stored JSON and a `setItem` that throws a quota error
- **When** the wrappers are called
- **Then** they return `undefined`/no-op without throwing and log the error
- **Given** `window` is stubbed to `undefined` (SSR)
- **When** each wrapper is called
- **Then** `setItem` and `removeItem` return immediately and `getItem` returns
  `undefined`, with no storage access and no error log
- **Notes:** assert the intentional asymmetry with `localStorage` (explicit SSR guard
  here, none there). Storage is per-tab; the wrapper does not share data with the
  local wrapper.

## Route search schemas

### LIB-005 · Query search applies defaults and coerces page/limit

- **Covers:** `querySearchSchema` — `src/lib/querySearchSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** an empty search object
- **When** `querySearchSchema` parses it
- **Then** `page` is `1` and `limit` is `20` (the `DEFAULT_PAGE_INDEX` and
  `DEFAULT_PAGE_SIZE` constants), and `search`, `order`, and `orderField` are absent
- **Given** string values `"3"` and `"10"`
- **When** parsed
- **Then** both become numbers
- **Given** `page: "0"`, `page: "1.5"`, `limit: "abc"`, or `order: "sideways"`
- **When** parsed
- **Then** validation fails for non-positive, non-integer, non-numeric, and unknown
  direction values
- **Given** an unknown query key
- **When** parsed
- **Then** the key is stripped from the output
- **Notes:** `search` is accepted verbatim — it is not trimmed or lowercased here,
  unlike `paginateInputSchema`. Empty string `""` coerces to `0` and fails the minimum,
  so a route receiving `?page=` rejects rather than falling back to page 1.

### LIB-006 · Range filter defaults to the current month

- **Covers:** `rangeFilterSchema` — `src/lib/querySearchSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the clock frozen at a known instant inside a month
- **When** an empty object is parsed
- **Then** `range` is `"THIS_MONTH"` and `startTime`/`endTime` are the ISO strings for
  `startOfMonth(now)` and `endOfMonth(now)` in the local timezone
- **Given** an explicit ISO `startTime`
- **When** parsed
- **Then** that value is preserved while `endTime` still receives the current-month
  default
- **Given** an invalid ISO datetime or an unknown `range`
- **When** parsed
- **Then** validation fails
- **Notes:** defaults are evaluated from the real clock, so freeze time and derive the
  expected bounds with `date-fns` rather than hard-coded UTC strings. A requested range
  of `CUSTOM_WEEK`/`CUSTOM_MONTH` does **not** change the default bounds — absent
  `startTime`/`endTime` still use the current month. Decide whether that is intended
  or whether custom ranges must require explicit bounds.

## Base zod schemas

### LIB-007 · String transforms split, trim, drop empties, and map empty strings

- **Covers:** `stringToArray`, `stringArraySchema`, `emptyStrSchema` —
  `src/lib/zod-schemas/baseZodSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the input `"a, b,,c "`
- **When** `stringToArray` runs with the default comma separator
- **Then** it returns `["a", "b", "c"]`, and delimiter-only input returns `[]`
- **Given** the explicit `":"` separator
- **When** `stringToArray("a:b:c", ":")` runs
- **Then** it returns three parts; `stringArraySchema` always splits on commas
- **Given** an empty string, whitespace-only string, or non-empty string
- **When** `emptyStrSchema` parses it
- **Then** `""` becomes `undefined`, while `"  "` and `"x"` are preserved unchanged
- **Given** `undefined` or `null`
- **When** `emptyStrSchema` parses it
- **Then** validation fails, because the schema is not optional
- **Notes:** `emptyStrSchema` does not trim, so whitespace is not treated as empty.

### LIB-008 · Email and password field factories enforce their messages

- **Covers:** `emailField`, `passwordField` —
  `src/lib/zod-schemas/baseZodSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `emailField({ fieldName: "Email" })`
- **When** an invalid email is parsed
- **Then** it fails with `"Email is required"`; a valid email passes
- **Given** `passwordField({ fieldName: "Password", restrict: true })`
- **When** `"Abc123"` is parsed
- **Then** it passes
- **Given** `"abcdef"`, `"ABCDEF1"`, `""`, or a 21-character value
- **When** parsed
- **Then** the exact uppercase, lowercase, number, minimum-length, and
  maximum-length messages are produced as applicable
- **Given** `restrict: false`
- **When** `"abcdef"`, `"ABCDEF"`, and `"123456"` are parsed
- **Then** only the 6–20 length rules apply and all three pass
- **Notes:** `"Abc 123"` currently passes because the regexes only require character
  presence; spaces and symbols are not rejected. `restrict` is typed as required but
  has a runtime default of `true`, so a call without it compiles only under a cast and
  behaves as restricted.

### LIB-009 · Field allow-lists reject unknown names when configured

- **Covers:** `fieldValidatorSchema` —
  `src/lib/zod-schemas/fieldValidatorSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `allowedFields` is `["name", "email"]`
- **When** `undefined`, `null`, `[]`, `["name"]`, or `["name", "email"]` is parsed
- **Then** all pass because the schema is nullish and empty arrays are allowed
- **Given** `["bogus"]` or `["name", "bogus"]`
- **When** parsed
- **Then** it fails with
  `Each value in 'searchFields' must be one of: "name", "email"`
- **Given** `allowedFields` is `undefined` or `[]`
- **When** any string array is parsed
- **Then** every value passes, because restrictions are considered absent
- **Notes:** the error-message branch for `<no allowed fields provided>` is
  unreachable through validation. Decide whether an empty allow-list should mean
  "no restriction" (current behavior) or "reject everything", and whether `null`
  should be accepted for a supplied field list.

## Pagination schemas

### LIB-010 · Pagination input defaults page 1 and limit 20

- **Covers:** `paginateInputSchema` —
  `src/lib/zod-schemas/paginateInputSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a model schema and a factory configured with `orderFields: ["name"]`
- **When** an empty object is parsed
- **Then** `page` is `1` and `limit` is `20`
- **Given** explicit positive integers
- **When** parsed
- **Then** they are preserved
- **Given** `page: null` or `limit: null`
- **When** parsed
- **Then** the value stays `null` rather than falling back to the default
- **Given** `page: 0`, `page: 1.5`, or `page: "3"`
- **When** parsed
- **Then** all fail: there is no numeric coercion and the value must be an integer of
  at least 1
- **Notes:** `.default(...).nullish()` produces "absent → default, explicit null →
  null". Callers must still handle nullable page/limit. This differs from
  `querySearchSchema`, which coerces strings and rejects null.

### LIB-011 · Pagination normalizes search and restricts ordering

- **Covers:** `paginateInputSchema` —
  `src/lib/zod-schemas/paginateInputSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `orderFields: ["name", "createdAt"]`
- **When** `search: "  NaPA  "` is parsed
- **Then** the result is `"napa"` (trimmed and lowercased)
- **Given** `order: "asc"` and `order: "desc"`
- **When** parsed
- **Then** both pass; any other direction fails
- **Given** `orderField` is `"name"`, `null`, or `"bogus"`
- **When** parsed
- **Then** the known field and `null` pass, while the unknown field fails validation
- **Given** unknown top-level keys
- **When** parsed
- **Then** they are stripped
- **Notes:** normalization means the procedure receives a lowercase search term;
  callers must not pre-lowercase for display. Nullable `orderField` is valid and must
  be treated as "no ordering".

### LIB-012 · Pagination validates `searchFields` and the filter shape

- **Covers:** `paginateInputSchema` —
  `src/lib/zod-schemas/paginateInputSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `searchFields: ["name", "email"]` and a filter schema with an optional
  `status`
- **When** `searchFields` is `["name"]`, `[]`, or `null`
- **Then** all pass; `["bogus"]` fails with the allow-list message
- **Given** a filter object with a known optional field
- **When** parsed with `{}` or `{ status: "active" }`
- **Then** it passes and unknown filter keys are stripped rather than rejected
- **Given** `filter: null` while a filter schema is configured
- **When** parsed
- **Then** it fails with "expected object, received null"
- **Given** no filter schema was configured
- **When** `filter` is omitted, `null`, or an arbitrary object
- **Then** all pass and object contents are stripped to `{}`
- **Notes:** the return type advertises `filter` as optional **and** nullable, but the
  custom-filter branch uses `.optional()` only. Either fix the type or allow null.
  This runtime/type mismatch is a contract risk for procedures.

### LIB-013 · Pagination and export factories crash when `orderFields` is omitted

- **Covers:** `paginateInputSchema` — `src/lib/zod-schemas/paginateInputSchema.ts`;
  `exportDataInputSchema` — `src/lib/zod-schemas/exportDataInputSchema.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `paginateInputSchema({})` or `exportDataInputSchema({})`
- **When** the factory is invoked at schema-construction time
- **Then** it currently throws `TypeError: Cannot convert undefined or null to object`
  from `z.enum(undefined)`
- **Notes:** both factories type `orderFields` as optional, so a valid-looking caller
  crashes at config/import time rather than failing request validation. Decide the
  contract: default to an empty/no-ordering enum, or make `orderFields` required in
  the TypeScript signature. Until then, assert the current throw so the behavior is
  visible, and cover both factories.

### LIB-014 · Pagination output accepts complete metadata and strips extras

- **Covers:** `paginateOutputSchema` —
  `src/lib/zod-schemas/paginateOutputSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a valid `meta` with all eight fields and one valid data row
- **When** parsed
- **Then** the result contains the same meta and rows
- **Given** extra properties on `meta`, a row, or the envelope
- **When** parsed
- **Then** the extra properties are stripped
- **Given** a missing `meta` or `data`, a missing meta field, a non-boolean flag, or a
  string `previousPage`
- **When** parsed
- **Then** validation fails
- **Given** an empty `data` array with zero counts and null previous/next pages
- **When** parsed
- **Then** it passes
- **Notes:** `previousPage`/`nextPage` are nullable numbers; `pageCount`,
  `totalCount`, and `queryCount` are required non-negative-by-contract numbers (the
  schema itself does not enforce non-negativity).

## Export schemas

### LIB-015 · Export input restricts format and ordering

- **Covers:** `exportDataInputSchema` —
  `src/lib/zod-schemas/exportDataInputSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `orderFields: ["name"]`
- **When** `format` is `"csv"` or `"json"`
- **Then** both pass; `"xml"`, an empty value, or a missing format fails
- **Given** `order` is `"asc"`, `"desc"`, `null`, or absent
- **When** parsed
- **Then** all are accepted; another direction fails
- **Given** `orderField` is `"name"`, `null`, or `"bogus"`
- **When** parsed
- **Then** the known field and `null` pass while the unknown field fails
- **Given** a filter schema is configured and `filter` is omitted, `null`, or `{}`
- **When** parsed
- **Then** all three pass, unlike the pagination custom-filter branch
- **Notes:** the export factory has the same omitted-`orderFields` construction crash
  as LIB-013. Export ordering is not combined with pagination fields.

### LIB-016 · Export output accepts rows or a raw string payload

- **Covers:** `exportDataOutputSchema` —
  `src/lib/zod-schemas/exportDataOutputSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a row schema and an array of valid rows
- **When** parsed with `filename` and `contentType`
- **Then** the payload passes and rows are validated against the schema
- **Given** `data` is a raw string, such as CSV text
- **When** parsed
- **Then** it passes without row validation
- **Given** an invalid row, a missing filename, a missing content type, or a non-string
  data value
- **When** parsed
- **Then** validation fails
- **Given** an empty row array
- **When** parsed
- **Then** it passes
- **Notes:** the union is "array of rows **or** string", so a JSON export returning a
  single object is invalid; exporters must wrap it in an array.

## API output schema

### LIB-017 · API output schema wraps any supported data schema

- **Covers:** `apiOutputSchema` — `src/lib/zod-schemas/apiOutputSchema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** an array-of-objects data schema
- **When** a valid `{ message, success, data }` envelope is parsed
- **Then** it passes and `data` items are validated
- **Given** a `z.null()` data schema
- **When** `data: null` is parsed
- **Then** it passes, while a non-null object fails
- **Given** a missing `data`, a non-boolean `success`, or a non-string `message`
- **When** parsed
- **Then** validation fails
- **Given** an extra envelope key
- **When** parsed
- **Then** the key is stripped
- **Notes:** the generic constraint accepts objects, arrays, records, and null, not
  primitive/string schemas. Pair this case with LIB-001 so both the producer and the
  validator of the envelope are covered.

## oRPC and TanStack Query

### LIB-018 · Serializer round-trips oRPC built-in types

- **Covers:** `serializer` — `src/lib/tanstack-query/serializer.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a structure containing a `Date`, `undefined` in an array, `NaN`, a
  `bigint`, a `URL`, a `RegExp`, a `Set`, and a `Map`
- **When** `serialize` runs and `deserialize` receives the JSON and meta
- **Then** the restored value contains the same typed instances and values, and plain
  JSON input produces empty meta
- **Notes:** assert the built-in type codes (bigint `0`, date `1`, NaN `2`, undefined
  `3`, URL `4`, RegExp `5`, Set `6`, Map `7`) only if the test is meant to pin the
  wire format; otherwise assert round-trip behavior. `undefined` object properties are
  dropped by the serializer (array holes are preserved via meta). Blobs require the
  separate maps/getBlob path and no custom serializers are configured.

### LIB-019 · oRPC query client sets defaults and hashes typed query keys

- **Covers:** `createQueryClient` —
  `src/lib/tanstack-query/query-client.orpc.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a client from the oRPC factory
- **When** default query options are read
- **Then** `staleTime` is `60_000` and `gcTime` is `300_000`
- **Given** identical query keys
- **When** `queryKeyHashFn` runs twice
- **Then** it returns the same string
- **Given** a key containing a `Date` and a key containing the equivalent ISO string
- **When** hashed
- **Then** the hashes differ, proving the serializer runs before stringification
- **Given** object keys with different insertion order
- **When** hashed
- **Then** the current implementation produces different hashes
- **Notes:** the hash is `JSON.stringify` of the serializer output, not TanStack's
  order-stable default hash, so logically equal objects with different key order miss
  the cache. Decide whether canonical key ordering is required. Each factory call
  returns a new client.

### LIB-020 · oRPC query client dehydrates pending queries and restores typed data

- **Covers:** `createQueryClient` —
  `src/lib/tanstack-query/query-client.orpc.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** query data containing a `Date`, `NaN`, and an `undefined` object property
- **When** the dehydrate `serializeData` option runs
- **Then** the date becomes an ISO string, `NaN` becomes `null`, and the meta records
  the date and NaN locations
- **When** the hydrate `deserializeData` option runs on that payload
- **Then** the date is a `Date` instance and `NaN` is restored, while the undefined
  property remains absent
- **Given** query states with `pending` and `success` status
- **When** `shouldDehydrateQuery` runs
- **Then** both are dehydrated (the default predicate plus the explicit pending case)
- **Notes:** the pending branch exists so streaming/suspense queries are included.
  Assert `meta` structurally where practical; exact segment paths are part of the
  serializer wire contract.

### LIB-021 · Plain query client keeps defaults without oRPC serialization

- **Covers:** `createQueryClient` —
  `src/lib/tanstack-query/query-client.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a client from the plain factory
- **When** default query options are read
- **Then** `staleTime` is `60_000`, `gcTime` is `300_000`, and no custom
  `queryKeyHashFn` is configured
- **Given** pending and success query states
- **When** the dehydrate predicate runs
- **Then** pending and success queries are both included, and no custom data
  serializer/deserializer options are configured
- **Notes:** the router currently imports the oRPC variant, so this factory appears
  unused. The test pins the two factories apart and catches accidental divergence if
  it is adopted later.

## Environment and server factories

### LIB-022 · Environment validation parses client values and applies defaults

- **Covers:** `env` — `src/lib/env.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** jsdom (client schema), stubbed `VITE_APP_NAME`, `VITE_SITE_URL`,
  `VITE_MAIL`, and `VITE_GOOGLE_CLIENT_ID`, and no `VITE_ENVIRONMENT`
- **When** the module is imported after `vi.resetModules()`
- **Then** `env.VITE_ENVIRONMENT` is `"development"`, and the four required values are
  exposed unchanged
- **Given** `VITE_ENVIRONMENT: "production"` or `"test"`
- **When** imported
- **Then** that value is accepted; an unknown value fails validation
- **Given** a missing required value, an empty string, an invalid URL, or an invalid
  email
- **When** imported
- **Then** importing rejects with `Invalid environment variables` (empty strings are
  treated as undefined)
- **Given** a client context
- **When** a server-only key such as `MAIL_PASS` is read
- **Then** it throws the "Attempted to access a server-side environment variable on
  the client" error
- **Notes:** `emptyStringAsUndefined` deletes empty entries from the runtime env
  object, mutating `import.meta.env`/`process.env`; reset modules and restore env
  between cases. Use a fresh import per scenario because validation runs once at
  module scope.

### LIB-023 · Server environment requires secrets and honors the validation skip flag

- **Covers:** `env` — `src/lib/env.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a node-environment test with `MAIL_USER`, `MAIL_PASS`,
  `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, and the client variables set
- **When** the module is imported
- **Then** server values are readable and `ENVIRONMENT` defaults to `"development"`
- **Given** a missing `MAIL_PASS`, an invalid `ENVIRONMENT`, or a non-URL
  `VITE_SITE_URL`
- **When** imported
- **Then** validation rejects with `Invalid environment variables`
- **Given** `SKIP_ENV_VALIDATION: "true"` and missing required values
- **When** imported
- **Then** the raw runtime env is returned without parsing, so required keys may be
  `undefined`
- **Notes:** `skipValidation` is read at import time, so the flag must be set before
  the dynamic import. In this mode the returned object is not validated or proxied,
  which makes missing-config failures appear later at first use. Do not read or copy
  values from `.env.local`; use synthetic values.

### LIB-024 · Server factories adapt the Worker binding and env into services

- **Covers:** `getDB` — `src/lib/db.server.ts`; `getMail` — `src/lib/mail.server.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a mocked `cloudflare:workers` module exposing a fake `DB` binding and a
  mocked `createDrizzleClient`
- **When** `getDB()` runs twice
- **Then** the factory is called with that same binding each time, returns the mocked
  client, and creates a fresh client rather than caching one
- **Given** a mocked env with distinct app name, mail user, mail password, and mail
  from values, plus a mocked `createMailService`
- **When** `getMail()` runs
- **Then** the factory receives exactly `{ appName, authUser, authPass, mailFrom }`
  mapped from `VITE_APP_NAME`, `MAIL_USER`, `MAIL_PASS`, and `VITE_MAIL`, and its
  return value is passed through
- **Notes:** `cloudflare:workers` cannot resolve in the jsdom project, so the mock is
  mandatory. `getDB` is called per request (`src/server/orpc.ts`, `rpc.$.ts`,
  auth functions); assert the non-caching behavior rather than import-time creation.

## Document head

### LIB-025 · Head factory requires a title placeholder and builds global defaults

- **Covers:** `buildHead` — `src/lib/head/buildHead.ts`; `head`/`globalHead` —
  `src/lib/head/index.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a config whose `titleTemplate` lacks `%s`
- **When** `buildHead(config)` runs
- **Then** it throws `buildHead: titleTemplate must contain "%s"`
- **Given** a valid config and `globalHead()`
- **When** called
- **Then** the meta starts with charset, viewport, theme color, default title, default
  description, robots (`index, follow` when unset), a verbose googlebot policy,
  format detection, mobile web app, and Apple title/status entries; social OG/Twitter
  entries follow when `social` is true
- **When** links are inspected
- **Then** configured stylesheets come first, then the five favicon/manifest links,
  and no canonical link is present
- **Given** the real `src/lib/head/index.ts` wiring with stubbed env and stylesheet
- **When** `globalHead()` runs
- **Then** the title is `Dashboard | <app name>`, the template is
  `%s | Dashboard | <app name>`, robots are `noindex, nofollow`, and the app
  stylesheet is included
- **Notes:** `head/index.ts` performs env validation and a `styles.css?url` import at
  module scope; stub the env module to avoid coupling this case to LIB-022. The
  googlebot value falls back to the project's verbose default for indexable pages.

### LIB-026 · Page head builds titles, descriptions, and canonical URLs

- **Covers:** `buildHead` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a site URL ending in `/` and `head({ pathname: "/", titleByTemplate:
"Welcome" })`
- **When** the result is built
- **Then** the title is `Welcome | <app name>`, the canonical href is the site URL
  without its trailing slash, and `og:url` matches it
- **Given** `head({ pathname: "/medicines", title: "Meds", description: "Custom" })`
- **When** the result is built
- **Then** the title is exactly `Meds` (no template applied), the description is the
  custom value, and canonical/`og:url` are `<site>/medicines`
- **Given** a page description is omitted
- **When** built
- **Then** the global description is used
- **Given** a template title containing the literal `$&`
- **When** substituted
- **Then** the replacement is literal (the implementation uses a replacer function),
  not a regex substitution artifact
- **Notes:** the input type requires either `title` or `titleByTemplate`, but the
  runtime does not enforce it; a missing title yields an undefined meta title. Only a
  single trailing slash is stripped from `siteUrl`, and the page pathname is appended
  verbatim (no normalization of duplicate or trailing slashes).

### LIB-027 · Social, robots, OG image, and favicon descriptors are correct

- **Covers:** `buildHead` — `src/lib/head/buildHead.ts`; `buildOgMeta` —
  `src/lib/head/og.ts`; `buildFaviconLinks` — `src/lib/head/favicon.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `social: false`
- **When** head metadata is built
- **Then** no `og:*` or `twitter:*` entries are present
- **Given** a trailing-slash site URL and `ogImagePath: "/og.png"`
- **When** metadata is built
- **Then** `og:image` and `twitter:image` are exactly `<site>/og.png`; the default
  path is `/opengraph-image.jpeg`
- **Given** `robots: "noindex, nofollow"`
- **When** metadata is built
- **Then** both the `robots` and `googlebot` entries contain that exact value;
  otherwise googlebot uses the verbose index/follow policy
- **Given** the OG builder inputs
- **When** `buildOgMeta` runs
- **Then** it returns 15 entries with `og:type: website`, image dimensions
  `1200`/`630`, locale `en_US`, and Twitter card `summary_large_image`
- **When** `buildFaviconLinks` runs
- **Then** it returns the manifest, 96×96 PNG, SVG, ICO, and 180×180 Apple touch icon
  links in that order
- **Notes:** `ogImagePath` is concatenated directly after the trimmed site URL, so a
  value without a leading slash produces a malformed image URL. `social` defaults to
  true and the googlebot noindex branch reuses the whole robots string.

## General utilities

### LIB-028 · `cn` merges conflicting Tailwind classes and conditionals

- **Covers:** `cn` — `src/lib/utils.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `cn("px-2 py-1", "px-4")`
- **When** called
- **Then** the later padding wins and the result contains `px-4`, `py-1`, and not
  `px-2`
- **Given** arrays, false conditions, and object maps
- **When** passed
- **Then** only truthy classes are emitted
- **Given** no arguments
- **When** called
- **Then** it returns an empty string
- **Notes:** this is a thin re-export of the external `cn` package (a
  clsx/tailwind-merge replacement). The case guards the dependency contract used by
  all UI primitives; there is no project-specific logic to test beyond delegation.
