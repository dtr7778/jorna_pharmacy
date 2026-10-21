# Purchase — Test Implementation

Scope: `src/features/purchase/**` — purchase oRPC contracts and procedures, invoice
reservation, line-item and create schemas, totals math, API hooks, and the create,
details, and table UI.

Related documents: [vendors.md](./vendors.md) owns `vendorPayment` procedures that
increment `purchases.paid_amount`; [medicine.md](./medicine.md) owns
`medicineResolver`; [db-utils.md](./db-utils.md) owns pagination composition.

## Source map

| File                                                                          | Responsibility                                                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/features/purchase/api/purchase.contract.ts`                              | Six oRPC contracts: `list`, `listForSearch`, `details`, `stats`, `nextInvoiceNo`, `create` |
| `src/features/purchase/api/purchase.procedure.ts`                             | Procedure handlers, pricing, medicine resolution, invoice claiming, batch writes           |
| `src/features/purchase/api/purchase.router.ts`                                | Mounts purchase procedures on the feature router                                           |
| `src/features/purchase/api/purchase.api.hook.ts`                              | `useNextPurchaseInvoiceNo`, `useCreatePurchase`; toast and cache invalidation              |
| `src/features/purchase/invoiceResolver.ts`                                    | `reserveInvoice`, `claimInvoice`, `releaseInvoice` over `purchase_invoices`                |
| `src/features/purchase/purchase.schema.ts`                                    | Item form, create form, API create schema; invoice number schema; defaults                 |
| `src/features/purchase/purchase.utils.ts`                                     | `calculatePurchaseTotals`, `calculateMargin`, `toMoneyInputValue`                          |
| `src/features/purchase/purchase.schema.test.ts`                               | Existing schema unit tests                                                                 |
| `src/features/purchase/purchase.utils.test.ts`                                | Existing totals and margin unit tests                                                      |
| `src/features/purchase/components/PurchaseStatusBadge.tsx`                    | Derives Paid / Partially paid / Unpaid from due and paid                                   |
| `src/features/purchase/components/VendorPurchaseSelectorField.tsx`            | Searches unpaid purchases for a vendor and renders their due                               |
| `src/features/purchase/components/purchase-create/PurchaseCreateForm.tsx`     | Invoice bootstrap, form defaults, paid-in-full sync, submit mapping, redirect              |
| `src/features/purchase/components/purchase-create/PurchaseLine.tsx`           | `useFieldArray` add/remove and empty state                                                 |
| `src/features/purchase/components/purchase-create/PurchaseLineItem.tsx`       | Per-line inputs and derived line total, revenue, profit, margin                            |
| `src/features/purchase/components/purchase-create/PurchaseSummaryCard.tsx`    | Paid-now input, paid-in-full toggle, summary rows, submit/cancel                           |
| `src/features/purchase/components/purchase-details/PurchaseDetailsView.tsx`   | Details query, boundary, skeleton                                                          |
| `src/features/purchase/components/purchase-details/PurchaseDetailHeader.tsx`  | Invoice number, status, vendor link, vendor invoice                                        |
| `src/features/purchase/components/purchase-details/PurchaseInfoCard.tsx`      | Recorded-by, timestamps, vendor address/phone, note                                        |
| `src/features/purchase/components/purchase-details/PurchaseItemsCard.tsx`     | Item table, line totals, subtotal/discount/total footer                                    |
| `src/features/purchase/components/purchase-details/PurchasePaymentsCard.tsx`  | Payment timeline, paid/due, conditional add-payment action                                 |
| `src/features/purchase/components/purchase-details/PurchaseSummaryStats.tsx`  | Total, paid, due, discount stat cards                                                      |
| `src/features/purchase/components/purchase-table/PurchaseManagementTable.tsx` | List query, time range, unpaid toggle, search, stats                                       |
| `src/features/purchase/components/purchase-table/PurchaseStats.tsx`           | Stats query and three headline stats                                                       |
| `src/features/purchase/components/purchase-table/PurchaseTable.tsx`           | Data-table wiring and pagination meta                                                      |
| `src/features/purchase/components/purchase-table/purchaseTableColumn.tsx`     | Invoice, vendor, money, due, status, note, date columns                                    |
| `src/features/purchase/components/purchase-table/PurchaseTableRowAction.tsx`  | Row links and permission-gated payment dialog                                              |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 11     |
| Partial     | 1      |
| Missing     | 22     |
| **Total**   | **34** |

Existing test files:

- `src/features/purchase/purchase.schema.test.ts` — item form and create-item schemas,
  plus decimal money fields on the generated select schemas.
- `src/features/purchase/purchase.utils.test.ts` — totals for two items, empty input,
  invalid input, margin rounding, and money-input formatting.

## Test environment

- Unit cases run in the default jsdom project from `vitest.config.ts`; setup is
  `test/setup.ts` (Testing Library cleanup, jest-dom matchers).
- There is no D1 integration harness in the repo yet. Procedures and
  `invoiceResolver` need one: either `@variablesoftware/mock-d1` (already a dev
  dependency) with the SQL in `migrations/`, or a hand-built `DatabaseType` stub.
  Until that exists, the integration cases below are `Missing`.
- Procedure tests must supply an oRPC context with `db`, `user`, and permissions, or
  call the handler through a test client. Permission middleware is part of the
  contract, so cover both an allowed and a denied permission set.
- Freeze time with `vi.useFakeTimers()` for every invoice-reservation assertion. Use
  `vi.setSystemTime` so the 30-minute window is deterministic.
- `crypto.randomUUID()` is called in `resolveMedicines` and the create handler. Stub it
  when asserting IDs; otherwise assert shape only.
- Component tests render inside `QueryClientProvider`; mock `@/server/orpc` and
  `@tanstack/react-router` (`useNavigate`, `Link`) rather than booting a router.
  Mock `react-hot-toast` for hook tests.
- Money assertions use `toBeCloseTo(expected, 2)` (or explicit rounding) — never
  `toBe` on a computed float. UI assertions go through `formatCurrency`, which uses
  `Intl.NumberFormat("en-US")` and appends `" ৳"`.

## Schemas and line-item validation

### PUR-001 · Existing-medicine line requires only name, quantity, and prices

- **Covers:** `purchaseItemFormSchema` — `src/features/purchase/purchase.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** an item with `isNewMedicine: false`, a name, `qtyPurchased: "10"`,
  `costPerUnit: "5"`, `sellPerUnit: "7"`, and no type or base unit
- **When** the item form schema parses it
- **Then** parsing succeeds
- **Notes:** asserted in `purchase.schema.test.ts` ("does not require a type or base
  unit for an existing medicine"). `baseUnit` and `medicineType` are optional for
  existing medicines because the selected medicine supplies them.

### PUR-002 · New-medicine line requires a type and a base unit

- **Covers:** `purchaseItemFormSchema` (`superRefine`)
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** an item with `isNewMedicine: true` but no `medicineType` and no `baseUnit`
- **When** the item form schema parses it
- **Then** parsing fails with issues on both `medicineType` and `baseUnit`; adding
  `medicineType: "tablet"` and `baseUnit: "tablet"` makes it pass
- **Notes:** both outcomes are asserted today. The `superRefine` uses
  `!item.baseUnit?.trim()`, so a whitespace-only base unit is also invalid; that
  specific input is not tested — see PUR-004 for the remaining input edges.

### PUR-003 · Cost and sell prices accept up to two decimals and reject zero

- **Covers:** `purchaseItemFormSchema` — `requiredDecimal`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** `costPerUnit` / `sellPerUnit` values of `"1.5"`, `"2.75"`, `"1.555"`,
  `"1."`, `".5"`, `"abc"`, `"1.5.5"`, and `"0.00"`
- **When** the line is parsed
- **Then** `"1.5"` and `"2.75"` pass; the malformed strings and zero fail
- **Notes:** the existing table only mutates `costPerUnit`; `sellPerUnit` uses the same
  helper, so add the same table for sell. The regex is `^\d+(\.\d{1,2})?$` followed by
  a `> 0` refine, so `"01"` is accepted and normalizes via `Number()`.

### PUR-004 · Quantity must be a positive whole number

- **Covers:** `purchaseItemFormSchema` — `requiredWholeNumber`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `qtyPurchased` values `"0"`, `"-1"`, `"1.5"`, `"abc"`, `""`, `"1"`, `"10"`
- **When** the line is parsed
- **Then** only `"1"` and `"10"` pass; the rest report `"Quantity must be a whole
number"` or `"Quantity must be greater than 0"`
- **Notes:** no existing test varies quantity. The same helper also drives
  `tabletsPerStrip` / `stripsPerBox` through `optionalPositiveWholeNumber`, where
  `undefined` and `""` are allowed; cover that branch separately (P2).

### PUR-005 · Invoice number schema requires at least four digits

- **Covers:** `invoiceNoSchema` — `src/features/purchase/purchase.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** invoice numbers `"0001"`, `"123"`, `"12a4"`, `"12345"`
- **When** the schema parses each value
- **Then** `"0001"` and `"12345"` pass, while the three-digit and non-numeric values
  fail with `"Invoice number must be at least 4 digits"`
- **Notes:** this schema validates the reserved number on the create form only; the API
  accepts `invoiceId` instead. Numbers are generated by `printf('%04d', …)` in
  `invoiceResolver`, so shorter values indicate a data problem.

### PUR-006 · Create form caps paid amount at the line-item subtotal

- **Covers:** `purchaseCreateFormSchema` (`superRefine`)
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** one item with quantity `2` and cost `2.5`, and `paidAmount: "5.00"`
- **When** the form schema parses it
- **Then** it succeeds; with `paidAmount: "5.01"` it fails at `paidAmount` with
  `"Paid amount cannot exceed the purchase total"`
- **Notes:** asserted in `purchase.schema.test.ts` ("accepts a fractional paid amount
  equal to the subtotal", "rejects a paid amount above the subtotal"). The cap is
  `sum(qty * cost)`; sell price and discount are excluded. `paidAmount` is a string
  refined by `moneyInput`, which allows up to two decimal places. The subtotal is raw
  JavaScript float math — assert boundaries with `toBeCloseTo` and consider `3 × 0.1`
  as a regression input (see PUR-014).

### PUR-007 · API create schema accepts fractional payments and enforces the same cap

- **Covers:** `purchaseCreateSchema` — `src/features/purchase/purchase.schema.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** one item with quantity `2` and `costPerUnit: 2.5` (subtotal `5`)
- **When** `paidAmount` is `2.5`, `-1`, and `6`
- **Then** `2.5` passes, `-1` fails nonnegative, and `6` fails the
  `paidAmount cannot exceed` refine
- **Notes:** asserted in `purchase.schema.test.ts` ("accepts a fractional paid amount
  within the total", "rejects a negative paid amount", "rejects a paid amount above the
  total"). This is the server-side gate for the form in PUR-006. The contract also
  declares an `INVALID_AMOUNT` error, but the procedure never throws it — an
  over-payment is rejected earlier by input validation and returns a generic
  validation error. Decide whether to keep the dead error code.

### PUR-008 · A purchase may be created with zero line items

- **Covers:** `purchaseCreateSchema` — `items` array
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** `items: []`, a valid invoice and vendor ID, and `paidAmount: 0`
- **When** the schema parses the input
- **Then** it succeeds
- **Notes:** asserted in `purchase.schema.test.ts` ("accepts a purchase with an empty item
  list"). The procedure handles an empty list: no medicine lookup rows, no medicine
  inserts, and no stock movements, with the invoice still claimed. The array has no
  `.min(1)`, so this is a deliberate behaviour; confirm it is the intended product rule.

### PUR-009 · API line items are looser than the form for zero prices and blank text

- **Covers:** `purchaseItemCreateSchema`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** an API item with `costPerUnit: 0`, `sellPerUnit: 0`, `baseUnit: "   "`,
  `batchNo: ""`, and `expiryDate: "2027-01-01"`
- **When** the item is parsed
- **Then** it succeeds with zero prices, `baseUnit`/`batchNo` as `undefined`, and a
  `Date` for expiry
- **Notes:** `nonnegative()` allows zero prices while the form requires `> 0`; only API
  clients can record free stock. `optionalTrimmedString` converts blank strings to
  `undefined`, and `z.coerce.date()` accepts strings. Decide whether zero prices are
  intentional and align the two schemas.

## Totals and margin

### PUR-010 · Totals sum subtotal, revenue, and profit across lines

- **Covers:** `calculatePurchaseTotals` — `src/features/purchase/purchase.utils.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** lines `{10, 5, 7}` and `{2, 1.5, 2.25}`
- **When** totals are calculated
- **Then** `subtotal` is `53`, `revenue` is `74.5`, and `profit` is `21.5`
- **Notes:** asserted with `toEqual` today because these values are exact binary
  fractions. Assert money with `toBeCloseTo(…, 2)` in new cases. Profit is computed as
  `qty * (sell - cost)`, independently of `subtotal` and `revenue`.

### PUR-011 · Empty item list returns zero totals

- **Covers:** `calculatePurchaseTotals`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** no items
- **When** totals are calculated
- **Then** all three totals are `0`
- **Notes:** the reducer seeds `{subtotal: 0, revenue: 0, profit: 0}`.

### PUR-012 · Missing, invalid, and negative values are coerced to zero

- **Covers:** `calculatePurchaseTotals` — `toAmount`
- **Type:** unit · **Priority:** P1 · **Status:** Partial
- **Given** a line with an empty quantity, `costPerUnit: "abc"`, and an undefined sell
  price, and separately a line with negative quantity/cost/sell values
- **When** totals are calculated
- **Then** each contributes `0`; negative values are clamped by `Math.max(0, …)`
- **Notes:** the existing test covers missing/invalid values only. Add the negative
  branch, including a negative profit line, to prove the clamp happens per input
  rather than per total.

### PUR-013 · Margin is profit over revenue rounded to one decimal

- **Covers:** `calculateMargin`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** revenue `3` and profit `1`, then revenue `0` and profit `-5`
- **When** margin is calculated
- **Then** the results are `33.3` and `0`
- **Notes:** formula is `Math.round((profit / revenue) * 100 * 10) / 10`; it is not a
  guard against negative margin, and a negative profit produces a negative percentage.
  `Math.round` rounds half away from zero for positive values; do not assume banker's
  rounding.

### PUR-014 · Float multiplication can leave sub-cent artifacts in totals

- **Covers:** `calculatePurchaseTotals`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** one line with quantity `3`, cost `0.1`, and sell `0.2`
- **When** totals are calculated
- **Then** `subtotal` is approximately `0.3`, `revenue` approximately `0.6`, and
  `profit` approximately `0.3`, asserted with a two-decimal epsilon
- **Notes:** raw IEEE-754 values are `0.30000000000000004` and `0.6000000000000001`.
  Nothing in `calculatePurchaseTotals` or the create procedure rounds before insert, so
  these values can reach `purchases.subtotal` and `total_amount` (`real` columns).
  Decide whether to round to two decimals in the util or at persistence, and assert the
  chosen contract. `formatCurrency` hides the artifact only at display time.

## Invoice reservation and claiming

### PUR-015 · Reserve reuses the lowest unlinked invoice and extends it by 30 minutes

- **Covers:** `reserveInvoice` — `src/features/purchase/invoiceResolver.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** unlinked invoices `0002` (unreserved), `0001` (reserved until the past), and
  `0003` (linked)
- **When** `reserveInvoice(db, userId)` runs at a frozen time
- **Then** it returns `0001`, sets `reservedBy` to the user, and sets `reservedUntil` to
  now + 30 minutes; `0002` and `0003` are untouched
- **Notes:** ordering is `CAST(number AS INTEGER) ASC`, so reuse is numeric, not
  lexicographic. The update targets a subquery selecting one row and returns the row;
  assert both the return value and the persisted reservation.

### PUR-016 · Reserve creates the next invoice number when none is available

- **Covers:** `reserveInvoice`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** no unlinked, expired reservation exists and the highest invoice number is
  `0009`
- **When** `reserveInvoice` runs
- **Then** it inserts `0010` with the reservation and returns it; an empty table yields
  `0001`
- **Notes:** the insert uses
  `printf('%04d', COALESCE(MAX(CAST(number AS INTEGER)), 0) + 1)`. Numbers above `9999`
  simply widen. Assert the zero-padding.

### PUR-017 · Claim succeeds only for the reserving user with an unexpired reservation

- **Covers:** `claimInvoice`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** an unlinked invoice reserved by user A until now + 10 minutes
- **When** user A claims it, then user B claims it, then the reservation is expired and
  user A claims again
- **Then** the first claim returns `{id}` and sets `isLinked`; the other two return
  `undefined`
- **Notes:** the `WHERE` requires `isLinked = false`, `reservedBy = userId`, and
  `reservedUntil > now`. The first successful claim is what consumes the invoice number
  in the create flow. Freeze time between calls to test expiry.

### PUR-018 · Release unlinks the invoice but keeps its reservation

- **Covers:** `releaseInvoice`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an invoice claimed by user A and then released
- **When** `releaseInvoice` runs and `reserveInvoice` is called immediately by user B
- **Then** `isLinked` is `false`, but user B does not receive that invoice because
  `reservedUntil` is still in the future; user A can reclaim it
- **Notes:** `releaseInvoice` only sets `isLinked: false` and never clears
  `reservedBy` / `reservedUntil`. This is what makes the create-failure path retryable
  for the same user, but it also holds released numbers for up to 30 minutes. Decide
  whether release should clear the reservation; assert the chosen behavior.

### PUR-019 · Concurrent reservations cannot allocate the same new number

- **Covers:** `reserveInvoice`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an empty available set and two reservations issued concurrently
- **When** both run the `MAX(number) + 1` insert
- **Then** the unique index `purchase_invoice_number_idx` rejects one insert; the
  behavior (error surfaced or retried) is documented
- **Notes:** there is no retry loop. On D1 the statements may serialize, but the query
  is read-then-insert, so a race remains possible. Ask whether to retry, use a
  sequence, or accept the failure. This also affects `nextInvoiceNo` under parallel
  tabs.

## Procedures

### PUR-020 · List paginates, filters by vendor and date, and returns metadata

- **Covers:** `listVendorPurchasesProcedure` — `src/features/purchase/api/purchase.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** three purchases across two vendors and two dates
- **When** `purchase.list` is called with `vendorId`, `page: 2`, `limit: 1`, and a
  `createdAt` range covering two rows
- **Then** only the in-range vendor row for that page is returned, with
  `meta.currentPage: 2`, `meta.queryCount: 1`, and `meta.totalCount` equal to the
  filtered count
- **Notes:** rows are ordered by `createdAt DESC` then the requested order (which falls
  back to `sql\`1\``because the contract allows no order fields). The count query
joins only`purchase_invoices`, while the data query also joins vendors. Watch
`buildPaginationMeta`: when a page returns fewer rows than `limit`, it recomputes
`pageCount`from`queryCount`, so last-page metadata can collapse to `1`. Record the
  current behavior and link the fix to DBU-091/DBU-092.

### PUR-021 · List search matches invoice numbers and `unpaidOnly` is strict

- **Covers:** `listVendorPurchasesProcedure`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** fully paid, partially paid, and unpaid purchases
- **When** `purchase.list` is called with `search: "0001"` and then with
  `unpaidOnly: true`
- **Then** search matches only the invoice number containing `0001`; `unpaidOnly`
  returns rows where `totalAmount > paidAmount` and excludes fully paid ones
- **Notes:** `search` is trimmed and lowercased by `paginateInputSchema`; the only
  allowed search field is `invoiceNo`, mapped to `PurchaseInvoiceTable.number`.
  Passing any other `searchFields` value is a contract validation error. The
  comparison is strict `>`, so an overpaid row is also excluded (correct) but a
  zero-total row with zero paid is excluded as paid.

### PUR-022 · Search listing ignores pagination and returns every match

- **Covers:** `listPurchaseForSearchProcedure`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** ten unpaid purchases for a vendor
- **When** `purchase.listForSearch` is called with `limit: 5`, `page: 1`, and
  `unpaidOnly: true`
- **Then** all ten are returned as a flat array, ordered by `createdAt DESC`
- **Notes:** the handler accepts `page`/`limit` but never applies them. The vendor
  purchase selector requests `limit: 5` and therefore over-fetches. Decide whether to
  honor pagination or remove the inputs; the output contract is already an array, not
  a paginated envelope.

### PUR-023 · Details returns vendor, items, payments, and a clamped due summary

- **Covers:** `vendorPurchaseDetailsProcedure`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a purchase with `subtotal: 50`, `discount: 1`, `totalAmount: 50`,
  `paidAmount: 20`, two items, and two payments
- **When** `purchase.details` is called
- **Then** the response contains the vendor subset, items ordered by medicine name
  ascending, payments newest first, `summary.itemCount: 2`,
  `summary.paymentCount: 2`, and `summary.dueAmount: 30`
- **Notes:** due is `Math.max(totalAmount - paidAmount, 0)`, so an overpaid purchase
  reports zero. `createdByUser` is `null` when `createdBy` is null and raises
  `USER.NOT_FOUND` if a non-null creator has no user row. The payments query left-joins
  `user_roles`/`roles`, so a payer with multiple roles can duplicate a payment row and
  inflate `paymentCount`; cover that case or fix the join.

### PUR-024 · Details returns a 404 for an unknown purchase

- **Covers:** `vendorPurchaseDetailsProcedure`, `PURCHASE_NOT_FOUND`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** no purchase with the supplied UUID
- **When** `purchase.details` is called
- **Then** it throws the `PURCHASE_NOT_FOUND` oRPC error with status `404` and
  `"Purchase not found."`
- **Notes:** also assert the input contract rejects a non-UUID `purchaseId` before the
  handler runs.

### PUR-025 · Create computes purchase totals and writes items, stock, and initial payment

- **Covers:** `createVendorPurchaseProcedure`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a vendor, one existing medicine, an item with quantity `3` and cost `10.5`
  and sell `15`, a reserved invoice owned by the caller, and `paidAmount: 10`
- **When** `purchase.create` is called
- **Then** the purchase has `subtotal: 31.5`, `totalAmount: 31.5`, `paidAmount: 10`;
  the item stores `qtyRemaining: 3`; one `purchase` stock movement of `+3` references
  the purchase; one vendor payment of `10` is inserted; the invoice becomes linked; and
  the returned row matches the inserted purchase
- **Notes:** totals are raw `qty * cost` with no rounding. `discount` is never written,
  so the column default `1` applies — every created purchase shows a 1 ৳ discount while
  `totalAmount` still equals `subtotal` (the discount is not subtracted). Flag this as a
  money bug and decide whether the default or the total formula is wrong. Assert all
  money with a two-decimal epsilon. `paidAmount: 0` must skip the payment insert.

### PUR-026 · Create rejects missing vendor, unknown medicine, duplicate invoice, and lost reservation

- **Covers:** `createVendorPurchaseProcedure`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** separate calls with an unknown `vendorId`; with a medicine name that is
  missing or inactive and has no type/base unit; with a `vendorInvoiceNo` already used
  by that vendor; and with an expired/foreign `invoiceId`
- **When** `purchase.create` runs
- **Then** the errors are `VENDOR_NOT_FOUND` (404), `MEDICINE_DETAILS_REQUIRED` (400),
  `DUPLICATE_VENDOR_INVOICE` (409), and `INVOICE_NOT_AVAILABLE` (409) respectively
- **Notes:** medicine lookup is `lower(trim(name))` and `isActive = true`, so an
  inactive medicine is reported as "details required" rather than "not found" — decide
  if that is intended. The lookup is also scoped to the purchase's `vendorId` (MED-028). A batch failure calls `releaseInvoice` and rethrows; assert the
  invoice is unlinked afterward. `MEDICINE_NOT_FOUND` is effectively unreachable after
  resolution, and the declared `INVALID_AMOUNT` is never thrown (PUR-007).

### PUR-027 · Stats filter totals by date but report due across all purchases

- **Covers:** `vendorPurchaseStatsProcedure`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** purchases inside and outside a date range, including an overpaid one
- **When** `purchase.stats` is called with a `createdAt` filter
- **Then** `totalPurchased` and `purchaseCount` cover only in-range rows;
  `dueAmount` sums `totalAmount - paidAmount` over every purchase and is not clamped
- **Notes:** the due query has no `where`, matching the UI copy "across all purchases".
  An overpaid row reduces the due total below zero. Empty tables return `0` for all
  three fields via `COALESCE`. Use `toBeCloseTo` for the sums.

## Components

### PUR-028 · Status badge derives Paid, Partially paid, and Unpaid from due and paid

- **Covers:** `PurchaseStatusBadge` — `src/features/purchase/components/PurchaseStatusBadge.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** pairs `(due 0, paid 100)`, `(due 40, paid 60)`, `(due 0, paid 0)`,
  `(due 100, paid 0)`, and `(due -5, paid 105)`
- **When** the badge renders
- **Then** the labels are Paid, Partially paid, Paid, Unpaid, and Paid respectively
- **Notes:** the first branch is `due <= 0`, so a zero-total zero-paid purchase is
  "Paid" and an overpayment is "Paid". The table passes unclamped
  `totalAmount - paidAmount`, while the details header passes the clamped
  `summary.dueAmount`; both produce the same label. `paidAmount` is incremented by the
  vendor payment procedure (vendors.md), which is the actual status transition.

### PUR-029 · Create form summary tracks line math and clamps balance due

- **Covers:** `PurchaseCreateForm`, `PurchaseSummaryCard`, `PurchaseLineItem`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a mocked `nextInvoiceNo` response and no vendor
- **When** the user enters quantity `3`, cost `10`, sell `15`, then `paidAmount: "20"`
- **Then** the line shows a line total of `30 ৳`, revenue `45 ৳`, profit `15 ৳`,
  margin `33.3%`; the summary shows subtotal/total `30 ৳`, and balance due `10 ৳`
- **When** paid exceeds the total and the form submits
- **Then** submission is blocked with the paid-amount error, and the error summary is
  focused; a successful mutation navigates to `/dashboard/purchases/$purchaseId`
- **Notes:** due is `Math.max(subtotal - paidAmount, 0)` and `total` is `subtotal`
  (discount is not part of the form). Submit maps strings to numbers, omits
  `medicineType`/`baseUnit` unless `isNewMedicine`, and converts packaging counts only
  when truthy. `requestAnimationFrame` focus needs fake timers or a wait. Mock
  `useCreatePurchase` and assert the payload rather than hitting oRPC.

### PUR-030 · Record-payment actions require permission and an outstanding balance

- **Covers:** `PurchaseTableRowAction` (and the same gate in `PurchasePaymentsCard`)
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a row with `totalAmount: 100`, `paidAmount: 40` and a user with
  `vendor_payment:create`; then the same row without permission; then a fully paid row
  with permission
- **When** the row menu renders
- **Then** "Record payment" appears only in the first case, the dialog opens on click,
  and "View purchase" / "View vendor" always appear
- **Notes:** the condition is `totalAmount > paidAmount` (strict) plus
  `usePermissionCheck`. `PurchasePaymentsCard` uses the same permission plus
  `dueAmount > 0` for its icon button, so an overpaid purchase has no add action.
  Assert the dialog is not mounted until the item is clicked.

### PUR-031 · API line items accept generic name and strength, blanks become undefined

- **Covers:** `purchaseItemCreateSchema` — `src/features/purchase/purchase.schema.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** an API item with `genericName: "  Paracetamol "` and `strength: "   "`
- **When** the item is parsed
- **Then** `genericName` is `"Paracetamol"` and `strength` is `undefined`
- **Notes:** asserted in `purchase.schema.test.ts` ("keeps generic name and strength and
  trims blank values to undefined"). These two fields, with the name, identify a medicine
  (see MED-017).

### PUR-032 · Create form sends generic name and strength for every line

- **Covers:** `PurchaseCreateForm` submit mapping —
  `src/features/purchase/components/purchase-create/PurchaseCreateForm.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a line with medicine "Napa", generic name "Paracetamol", and strength "500",
  for both an existing and a new medicine
- **When** the form submits
- **Then** `useCreatePurchase` is called with an item that includes `genericName` and
  `strength` alongside `medicineName`
- **Notes:** mock `useCreatePurchase` and assert the payload. Not covered by any test yet.

### PUR-033 · Paid-in-full toggle fills and locks the paid-now input

- **Covers:** `PurchaseSummaryCard`, `PurchaseCreateForm`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a purchase total of `30` and `paidAmount: "0"`
- **When** the user checks "Paid in full"
- **Then** paid now becomes `30`, the input is disabled, and balance due shows `0 ৳`
- **When** a line quantity or cost changes while the toggle is checked
- **Then** paid now follows the new total
- **When** the checkbox is unchecked
- **Then** paid now returns to `0` and the input is editable again
- **Notes:** `paidInFull` defaults to `false`. The checkbox handler sets the amount
  immediately and an effect keeps it in sync with the recomputed subtotal. No
  component test exists yet; mock `useNextPurchaseInvoiceNo` and `useCreatePurchase`.

### PUR-034 · Money input formatting rounds to two decimal places

- **Covers:** `toMoneyInputValue` — `src/features/purchase/purchase.utils.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** amounts `0.1 * 3`, `12.345`, `0`, `53`, and `12.5`
- **When** each is formatted for the money input
- **Then** the results are `"0.3"`, `"12.35"`, `"0"`, `"53"`, and `"12.5"`
- **Notes:** asserted in `purchase.utils.test.ts` ("rounds floating point noise to two
  decimal places", "keeps whole amounts and short decimals unchanged"). Used by the
  paid-in-full checkbox so `3 × 0.1` does not become `"0.30000000000000004"` in the
  money input.
