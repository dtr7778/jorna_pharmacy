# Cash Closing — Test Implementation

Scope: `src/features/cash-closing/**` — the cash closing list filter schema, contract,
procedure, router, and the cash closing table and its columns.

Related documents: [routes.md](./routes.md) owns `/dashboard/cash-closing` route wiring;
[server.md](./server.md) owns mounting `cashClosingRouter` on the root router;
[constants-types.md](./constants-types.md) owns the `CASH_CLOSING` message namespace;
[db-seed.md](./db-seed.md) owns the seeded `cash_closings` fixtures.

## Source map

| File                                                                                 | Responsibility                                                                             |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `src/features/cash-closing/cash-closing.schema.ts`                                   | `cashClosingListFilterSchema` for the `periodStart` range                                  |
| `src/features/cash-closing/api/cashClosing.contract.ts`                              | `list` contract: pagination, search/order fields, period filter, row shape                 |
| `src/features/cash-closing/api/cashClosing.procedure.ts`                             | List handler: joins the closing user, filters, orders, paginates, permission gate          |
| `src/features/cash-closing/api/cashClosing.router.ts`                                | Mounts `cashClosing.list` on the feature router                                            |
| `src/features/cash-closing/components/cash-closing-table/CashClosingTable.tsx`       | Data-table wiring for rows, page count, and pagination/sorting filters                     |
| `src/features/cash-closing/components/cash-closing-table/cashClosingTableColumn.tsx` | Period, closed-by, money totals, expected/counted/difference, note, and created-at columns |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 10     |
| **Total**   | **10** |

Existing test files: none.

## Test environment and mocks

- The feature has no dedicated tests yet; every case below is `Missing`.
- Follow [vendors.md](./vendors.md#test-environment-and-mocks) for procedure cases until a
  D1 integration harness exists. Build an `ORPCContext` with `db`, `user`, `session`,
  `permissions`, `roles`, and `reqHeaders`, and keep `permissions` non-empty in denied
  cases so the middleware does not query the database.
- The list procedure is gated by the existing `report` resource (`manage` or `list`), not
  a `cash_closing` resource. Fixtures should use `{ level: "system", resource: "report",
action: "list" }`.
- Money columns (`opening_cash`, `total_sales`, `total_returns`, `cash_received`,
  `vendor_paid`, `total_expenses`, `total_salary`, `expected_cash`, `counted_cash`,
  `difference`) are `real`; assert with `toBeCloseTo` and an explicit epsilon.
- Table cases need `QueryClientProvider`, a mocked `@/server/orpc` (or direct props), and
  the auth store used by `FormatDateCell`. Freeze the clock for deterministic dates.

## Filter schema

### CCL-001 · Cash closing list filter accepts empty input and coerces date bounds

- **Covers:** `cashClosingListFilterSchema` — `src/features/cash-closing/cash-closing.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{}`, `{ periodStart: {} }`, ISO `from`/`to` strings, and an invalid `from`
- **When** each input is parsed with `cashClosingListFilterSchema.safeParse`
- **Then** the empty shapes and both ISO strings succeed with `Date` bounds, and the
  invalid date fails
- **Notes:** the route loader passes `buildDateRangeFilter(startTime, endTime)`, which
  returns `undefined` unless both bounds exist.

## Cash closing API

### CCL-010 · List input accepts documented search/order/filter fields and rejects others

- **Covers:** `listCashClosingContract.input` — `src/features/cash-closing/api/cashClosing.contract.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** valid input using `searchFields: ["closedByName", "note"]`,
  `orderField: "difference"`, and a `periodStart` range
- **When** the input schema parses it
- **Then** it succeeds; unknown `searchFields`, an unsupported `orderField`, and a
  non-numeric `difference` order still follow the shared pagination validator
- **Notes:** `periodStart`, `periodEnd`, every money field, and `createdAt` are supported
  order fields. `closedByName` is searched but deliberately not listed as an order field.

### CCL-011 · List output row requires closing period and nullable count fields

- **Covers:** `listCashClosingContract.output` — `src/features/cash-closing/api/cashClosing.contract.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a row with a `periodStart`/`periodEnd`, numeric totals, a nullable
  `closedByName`, and `expectedCash`, `countedCash`, and `difference` set to `null`
- **When** the output schema parses it
- **Then** it succeeds and preserves exactly the documented fields; a missing
  `periodStart` or `totalSales` is rejected
- **Notes:** `closedBy` is nullable because the relation uses `onDelete: "set null"`.
  The list row intentionally omits `updatedAt`.

## Cash closing procedures

### CCL-020 · List returns rows newest period first with the closing user name

- **Covers:** `listCashClosingProcedure` — `src/features/cash-closing/api/cashClosing.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** authorized callers, closings linked to users, and one closing with
  `closedBy: null`
- **When** `cashClosing.list` is called without explicit ordering
- **Then** rows are ordered by `periodStart` descending, `closedByName` is the linked
  user's name or `null`, and no duplicated rows appear from the left join
- **Notes:** the default order is `desc(CashClosingTable.periodStart)`, not `createdAt`.

### CCL-021 · List applies the period start range and search terms

- **Covers:** `listCashClosingProcedure` — `src/features/cash-closing/api/cashClosing.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** closings inside and outside a fixed `periodStart` range, plus notes and
  closing user names that partially match a search term
- **When** `cashClosing.list` is called with `filter.periodStart = { from, to }` and a
  search term
- **Then** only rows whose `periodStart` falls inside the inclusive range and whose
  `note` or `closedByName` matches are returned
- **Notes:** assert one-sided ranges (`from` only, `to only`) separately; the shared
  `buildFilterWhere` emits only the provided bounds.

### CCL-022 · List paginates and reports matching totals

- **Covers:** `listCashClosingProcedure` — `src/features/cash-closing/api/cashClosing.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** 25 closings matching the filters
- **When** `cashClosing.list` is called with `{ page: 2, limit: 10 }`
- **Then** it returns 10 rows and metadata with `currentPage: 2`, `totalCount: 25`,
  `queryCount: 10`, `pageCount: 3`, `previousPage: 1`, and `nextPage: 3`
- **Notes:** counts must be scoped by the same search/filter conditions as the rows.

### CCL-023 · List rejects callers without report manage or list permission

- **Covers:** `listCashClosingProcedure` — `src/features/cash-closing/api/cashClosing.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** an authenticated caller with no `system:report` permission and a caller with
  `{ level: "system", resource: "report", action: "list" }`
- **When** `cashClosing.list` is called
- **Then** the first call is rejected with `FORBIDDEN` and the second succeeds
- **Notes:** `report:manage` must also pass because `manage` expands to every action for
  the resource. An unauthenticated caller must fail with `UNAUTHORIZED` before any query.

### CCL-024 · An empty cash closing table returns an empty page

- **Covers:** `listCashClosingProcedure` — `src/features/cash-closing/api/cashClosing.procedure.ts`
- **Type:** integration · **Priority:** P2 · **Status:** Missing
- **Given** an authorized caller and no rows in `cash_closings`
- **When** `cashClosing.list` is called with defaults
- **Then** the response is `{ success: true, message: "Cash closings loaded successfully.",
data: { meta: { currentPage: 1, totalCount: 0, queryCount: 0, pageCount: 0, ... },
data: [] } }`
- **Notes:** assert the message against `API_MESSAGES.CASH_CLOSING.GET_ALL`, not a literal
  copy.

## Cash closing table

### CCL-030 · Table renders period, closed-by, totals, note, and closed-at columns

- **Covers:** `CashClosingTable`, `cashClosingTableColumn` — `src/features/cash-closing/components/cash-closing-table/**`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** one row with a known period, closing user, money totals, a note, and a
  creation date
- **When** the table renders
- **Then** the period cell shows the start and end dates, "Closed by" shows the name,
  every money cell uses the shared currency formatter with tabular numerals, and the
  created-at cell shows the formatted date
- **Notes:** `FormatDateCell` reads the auth store timezone; provide a store fixture so
  dates are deterministic. The table must not offer a sort control for `note`.

### CCL-031 · Missing count fields render a dash and negative differences use the error tone

- **Covers:** `cashClosingTableColumn` — `src/features/cash-closing/components/cash-closing-table/cashClosingTableColumn.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** rows with `expectedCash`, `countedCash`, and `difference` set to `null`, a
  negative difference, and a positive difference
- **When** the table renders
- **Then** null money cells show `—`, the negative difference carries
  `text-destructive`, and the positive difference does not
- **Notes:** `openingCash`, `vendorPaid`, `expectedCash`, `countedCash`, and `difference`
  are nullable. A zero difference must not be treated as negative.

### CCL-032 · Sorting and pagination update the list filters

- **Covers:** `CashClosingTable` — `src/features/cash-closing/components/cash-closing-table/CashClosingTable.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** the table rendered with page 1 and no ordering
- **When** the user sorts by "Difference" descending and moves to the next page
- **Then** `setFilters` is called with `{ orderField: "difference", order: "desc" }` and
  `{ page: 2, limit }` respectively, and the server page count drives pagination
- **Notes:** `useDataTable` uses manual pagination/sorting, so no client-side re-sort or
  slice should occur. Sorting a column whose id is absent from the contract order fields
  must not be possible.
