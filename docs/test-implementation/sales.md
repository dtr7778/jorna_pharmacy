# Sales — Test Implementation

Scope: `src/features/sale/**` — the sales list contract and procedure, the list filter
schema, and the sales table, columns, status badge, and list screen.

Related documents: [customers.md](./customers.md) owns the customer list and the
`customerId` relationship; [purchase.md](./purchase.md) owns the purchase list this page
mirrors; [routes.md](./routes.md) owns `/dashboard/sales` route wiring;
[server.md](./server.md) owns mounting `saleRouter` on the root router;
[constants-types.md](./constants-types.md) owns the `SALE` message namespace and the
sidebar entry.

## Source map

| File                                                              | Responsibility                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/features/sale/sale.schema.ts`                                | `saleListFilterSchema` for the `createdAt` range                                                  |
| `src/features/sale/sale.schema.test.ts`                           | Filter schema unit tests                                                                          |
| `src/features/sale/api/sale.contract.ts`                          | `list` contract: pagination, search fields, order fields, date/customer/unpaid filters, row shape |
| `src/features/sale/api/sale.procedure.ts`                         | List handler: joins customer and item counts, filters, ordering, pagination meta, permission gate |
| `src/features/sale/api/sale.router.ts`                            | Mounts `sale.list` on the feature router                                                          |
| `src/features/sale/components/SaleStatusBadge.tsx`                | Derives Paid / Partially paid / Unpaid from due and paid                                          |
| `src/features/sale/components/SaleStatusBadge.test.tsx`           | Status badge rendering tests                                                                      |
| `src/features/sale/components/sale-table/SaleManagementTable.tsx` | List query, time range, unpaid toggle, global search, empty/loading/error states                  |
| `src/features/sale/components/sale-table/SaleTable.tsx`           | Data-table wiring and pagination meta                                                             |
| `src/features/sale/components/sale-table/saleTableColumn.tsx`     | Invoice + item count, customer/walk-in, total, paid, due, status, date columns                    |

## Coverage summary

| Status      | Count |
| ----------- | ----- |
| Implemented | 2     |
| Partial     | 0     |
| Missing     | 7     |
| **Total**   | **9** |

Existing test files:

- `src/features/sale/sale.schema.test.ts` — empty filters, ISO date coercion, invalid date
  rejection.
- `src/features/sale/components/SaleStatusBadge.test.tsx` — paid, partially paid, and
  unpaid badge labels.

## Test environment and mocks

- Schema and badge cases run in the default jsdom project with `test/setup.ts`.
- There is no D1 integration harness yet. Follow the approach in
  [vendors.md](./vendors.md#test-environment-and-mocks) for the procedure cases; until it
  exists those cases stay `Missing`.
- Build an `ORPCContext` with `db`, `user`, `session`, `permissions`, `roles`, and
  `reqHeaders`. Keep `permissions` non-empty in denied cases so the middleware does not
  fall back to a database lookup.
- Sales money columns (`subtotal`, `discount`, `total_amount`, `paid_amount`) are `real`.
  Assert computed due with `toBeCloseTo` and an explicit epsilon.
- Component cases need `QueryClientProvider`, a mocked `@/server/orpc`, a mocked
  `@tanstack/react-router` route API (`useQuerySearch`), and the auth store for
  permission-gated navigation. Use fake timers for the 500 ms global-search debounce.

## Filter schema

### SAL-001 · Sale list filter accepts empty input and coerces date bounds

- **Covers:** `saleListFilterSchema` — `src/features/sale/sale.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** `{}`, `{ createdAt: {} }`, ISO `from`/`to` strings, and an invalid `from`
- **When** each input is parsed with `saleListFilterSchema.safeParse`
- **Then** the empty shapes and both ISO strings succeed with `Date` bounds, and the
  invalid date fails
- **Notes:** asserted in `sale.schema.test.ts`. The route loader passes
  `buildDateRangeFilter(startTime, endTime)`, which returns `undefined` unless both
  bounds exist.

## Sales API

### SAL-010 · Sales list paginates with documented defaults and metadata

- **Covers:** `listSaleProcedure` — `src/features/sale/api/sale.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** 25 sales with distinct fixed `createdAt` values
- **When** `sale.list` is called with `{ page: 2, limit: 10 }`, then with no pagination
  fields
- **Then** the first call returns 10 rows with `meta.currentPage = 2`,
  `queryCount = 10`, `totalCount = 25`, `pageCount = 3`, `nextPage = 3`; the default call
  returns page 1 with up to 20 rows
- **Notes:** without an explicit `orderField`/`order`, rows are newest first by
  `createdAt`. An explicit order field is the primary sort.

### SAL-011 · Sales search matches invoice number or customer name

- **Covers:** `listSaleProcedure` — `src/features/sale/api/sale.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** sales `SI-000001`, `SI-000002`, and `SI-000003`; the first belongs to
  "Rahim Uddin", the second to "Karim Ahmed", and the third is a walk-in
- **When** `sale.list` is called with `search: "si-000002"`, then `search: "rahim"`, each
  with `searchFields: ["invoiceNo", "customerName"]`
- **Then** each call returns only its matching sale and `meta.totalCount` reflects the
  filtered set
- **Notes:** search is skipped when `searchFields` is omitted. `paginateInputSchema`
  lowercases `search`; SQLite `LIKE` handles ASCII case-insensitivity. The count query
  must join customers too, or a customer-name search will fail.

### SAL-012 · Date range, unpaid, and customer filters compose

- **Covers:** `listSaleProcedure` — `src/features/sale/api/sale.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** sales inside and outside January 2026, paid and partially paid sales, and
  sales for two customers plus a walk-in
- **When** `sale.list` is called with `filter.createdAt = { from, to }`, with
  `unpaidOnly: true`, and with a `customerId`
- **Then** the date range limits rows by `createdAt`, `unpaidOnly` keeps only rows where
  `totalAmount > paidAmount`, and `customerId` keeps only that customer's rows
- **And** combining all three applies every condition, and `meta.totalCount` uses the
  same combined `where` as the row query
- **Notes:** a fully paid sale must not appear under `unpaidOnly`. A walk-in sale can
  never be unpaid because of the `sale_walkInPaid_chk` constraint.

### SAL-013 · Sales rows include customer name and per-sale item count

- **Covers:** `listSaleProcedure` — `src/features/sale/api/sale.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a customer sale with two line items, a customer sale with no items, and a
  walk-in sale with one item
- **When** `sale.list` is called
- **Then** `itemCount` is `2`, `0`, and `1` respectively, `customerName` is the joined
  name for customer sales and `null` for the walk-in, and totals match the stored
  `subtotal`, `discount`, `totalAmount`, and `paidAmount`
- **Notes:** the handler uses a grouped `sale_items` subquery left-joined to `sales`, so
  sales without items still appear with `itemCount: 0`. Values are normalized with
  `Number()` before returning.

### SAL-014 · Sales list enforces authentication and sale permissions

- **Covers:** `authMiddleware`, `userPermissionMiddleware` usage in `listSaleProcedure`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** (a) no user/session, (b) a user with `system:sale:read` only, and (c) a user
  with `system:sale:list` or `system:sale:manage`
- **When** `sale.list` is called
- **Then** (a) fails with `UNAUTHORIZED` (401), (b) fails with `FORBIDDEN` (403), and (c)
  succeeds
- **Notes:** the gate accepts `manage` **or** `list`; `read` alone is not enough for the
  list endpoint because the create/details flows are not implemented yet.

## UI

### SAL-030 · Sales status badge maps due and paid amount to a label

- **Covers:** `SaleStatusBadge` — `src/features/sale/components/SaleStatusBadge.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Implemented
- **Given** `due = 0`, `due = 40` with `paidAmount = 60`, and `due = 100` with
  `paidAmount = 0`
- **When** the badge renders
- **Then** it shows "Paid", "Partially paid", and "Unpaid" respectively
- **Notes:** asserted in `SaleStatusBadge.test.tsx`. A zero or negative due is treated as
  paid.

### SAL-031 · Sales table renders invoice, customer, money, status, and date cells

- **Covers:** `SaleTable`, `saleTableColumn` — `src/features/sale/components/sale-table/*`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** rows for a customer sale with two items, a walk-in sale, a fully paid sale,
  and a partially paid sale
- **When** the table renders
- **Then** the invoice cell shows the invoice number with "2 items"/"1 item" beneath;
  the customer cell shows the name or "Walk-in"; total and paid use `formatCurrency`;
  due is right-aligned and destructive when positive; the status badge reflects the
  amounts; the date uses `dd MMM, yyyy`
- **Notes:** sorting is wired for `invoiceNo`, `totalAmount`, and `createdAt` because
  those are the contract's order fields. Customer, paid, due, and status are not
  sortable.

### SAL-032 · Sales screen forwards search, range, unpaid, and pagination filters

- **Covers:** `SaleManagementTable` — `src/features/sale/components/sale-table/SaleManagementTable.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the sales page mounted with route search state
- **When** the user types in the global search, changes the time range, toggles "Unpaid
  only", or changes page/sort
- **Then** `sale.list` receives `page`, `limit`, `search`, `searchFields`,
  `order`/`orderField`, `unpaidOnly`, and `filter.createdAt` from
  `buildDateRangeFilter`
- **And** the global search updates the URL after the 500 ms debounce, while the toggle
  and range updates reset `page` to 1
- **Notes:** the page does not render create or row actions yet; only the list is in
  scope.
