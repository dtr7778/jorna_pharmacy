# Vendors and Payments — Test Implementation

Scope: `src/features/vendors/**` — vendor CRUD/search, vendor payment recording and
reporting, the vendor detail view, and the vendor/payment management screens.

## Source map

| File                                                                       | Responsibility                                                                                |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/features/vendors/vendor.schema.ts`                                    | Zod schemas for vendor create/update, payment create, and payment form input                  |
| `src/features/vendors/api/vendor.contract.ts`                              | oRPC contracts for vendor list, search list, create, update, details                          |
| `src/features/vendors/api/vendorPyament.contract.ts`                       | oRPC contracts for payment list, create, stats (filename typo is intentional; see note below) |
| `src/features/vendors/api/vendor.procedure.ts`                             | Vendor list/search/create/update/details handlers and vendor permission gates                 |
| `src/features/vendors/api/vendorPayment.procedure.ts`                      | Payment create/list/stats handlers, balance check, purchase `paidAmount` update               |
| `src/features/vendors/api/vendor.router.ts`                                | Wires vendor and payment procedures into the root router                                      |
| `src/features/vendors/api/vendor.api.hook.ts`                              | `useCreateVendor`, `useUpdateVendor` mutations, cache invalidation, toasts                    |
| `src/features/vendors/api/vendorPayment.api.hook.ts`                       | `useCreateVendorPayment` mutation and cross-domain cache invalidation                         |
| `src/features/vendors/components/VendorCreateDialog.tsx`                   | Create-vendor dialog and form                                                                 |
| `src/features/vendors/components/VendorUpdateDialog.tsx`                   | Update-vendor dialog, prefill, active toggle                                                  |
| `src/features/vendors/components/VendorPaymentCreateDialog.tsx`            | Record-payment dialog, conditional selectors, string→number amount                            |
| `src/features/vendors/components/VendorSelectorField.tsx`                  | Searchable vendor selector backed by `vendor.listForSearch`                                   |
| `src/features/vendors/components/VendorHeader.tsx`                         | Vendor name and active/inactive badge                                                         |
| `src/features/vendors/components/vendor-table/VendorManagementTable.tsx`   | Vendor page shell, search, create button, permission gate                                     |
| `src/features/vendors/components/vendor-table/VendorTable.tsx`             | Vendor data table wrapper                                                                     |
| `src/features/vendors/components/vendor-table/vendorTableColumn.tsx`       | Vendor columns: name link, phone, address, status, created                                    |
| `src/features/vendors/components/vendor-table/VendorTableRowAction.tsx`    | Details link and permission-gated update dialog                                               |
| `src/features/vendors/components/payment-table/PaymentManagementTable.tsx` | Payment page shell, date range, search, create button, stats                                  |
| `src/features/vendors/components/payment-table/PaymentTable.tsx`           | Payment data table wrapper                                                                    |
| `src/features/vendors/components/payment-table/paymentTableColumn.tsx`     | Payment columns: invoice fallback, vendor link, amount, note, date                            |
| `src/features/vendors/components/payment-table/PaymentTableRowAction.tsx`  | "View vendor" row action                                                                      |
| `src/features/vendors/components/payment-table/PaymentStats.tsx`           | Total paid / due / payment-count cards                                                        |
| `src/features/vendors/components/vendor-details/VendorDetailsTab.tsx`      | Summary stats, contact card, record dates, update dialog                                      |
| `src/features/vendors/components/vendor-details/VendorPaymentsTab.tsx`     | Vendor-scoped payment history and record-payment action                                       |
| `src/features/vendors/components/vendor-details/VendorPurchasesTab.tsx`    | Vendor-scoped purchase history with due and status badges                                     |

**Filename typo:** the payment contract lives at
`src/features/vendors/api/vendorPyament.contract.ts` and is imported under that
misspelled name. Do not rename it as part of test work; if it is ever renamed, update
this document and every import in the same change.

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 26     |
| **Total**   | **26** |

Existing test files: none. A glob for `src/features/vendors/**/*.{test,spec}.{ts,tsx}`
returns no files, so every case below is `Missing`.

## Test environment and mocks

- **Schema cases** are plain `unit` tests in the default jsdom Vitest project. Import the
  schemas, call `safeParse`, and assert `success` plus issue paths/messages. No D1 binding.
- **Procedure cases** are `integration` tests: handler plus Drizzle/D1. The repo has no
  shared D1 test harness yet, so the first implementation task is to add one. Prefer an
  in-memory SQLite client that can execute joins, aggregates, and `$count` (for example
  an in-memory `@libsql/client` database passed to a Drizzle libsql client, or Miniflare
  D1) with `migrations/` applied. `@variablesoftware/mock-d1` is installed, but its
  README only promises simple SELECT/INSERT/UPDATE/DELETE, so verify it handles the
  joins and `SUM`/`COUNT` queries here before relying on it.
- Build an `ORPCContext` explicitly: `db`, `user`, `session`, `permissions`, `roles`,
  and `reqHeaders`. Seed `user` and `session` so `authMiddleware` returns early; for
  permission-denied cases pass non-empty `roles` **and** `permissions` that lack the
  required action. With empty arrays, `getRolePermissionData` falls back to a database
  lookup. For unauthenticated cases, stub `auth.api.getSession` to return `null`.
- Invoke handlers through the compiled procedure/router with the injected context.
  It is acceptable to call the router client built with `createRouterClient` if the
  auth stubs are in place.
- **IDs:** seed fixed UUIDs. Do not depend on `crypto.randomUUID()` from `db_id`.
  **Clock:** call `vi.setSystemTime` for `createdAt` ordering, date-range filters, and
  "last updated" assertions.
- **Money:** columns are `real`. Use `toBeCloseTo` with an explicit epsilon (for example
  `1e-9`, or 2 decimal places for currency display) instead of exact equality.
- **Component cases** (`component`) use jsdom + Testing Library. Mock
  `@/server/orpc` so `orpcTQClient.*.queryOptions` return controlled query keys and
  `queryFn`s, wrap in `QueryClientProvider`, seed the auth store with both `user` and
  `permissions` (`usePermissionCheck` dereferences `authUser.id`), mock
  `@tanstack/react-router` links, and mock `react-hot-toast`. Use fake timers for the
  500 ms search debounce.
- The mutation hooks are covered indirectly by VND-041 and VND-042. If their
  invalidation surface grows, add dedicated hook cases rather than widening the dialog
  cases.

## Vendor schemas

### VND-001 · Vendor create schema normalizes optional empty strings and enforces name limits

- **Covers:** `vendorCreateSchema` — `src/features/vendors/vendor.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{ name: "Acme" }`, then `{ name: "Acme", phone: "", address: "", note: "" }`, then `{ name: "" }`, then a 101-character name
- **When** each input is parsed with `vendorCreateSchema.safeParse`
- **Then** the first two succeed and the empty optional fields become `undefined`; the last two fail on `name` with "Vendor name is required" and "Name is too long"
- **Notes:** `name` is not trimmed, so `"   "` passes `min(1)`. Decide whether whitespace-only names should be rejected (and whether the procedure or schema should trim). This schema feeds the create dialog (VND-041) and the API contract.

### VND-002 · Vendor update schema is partial and requires a boolean active flag

- **Covers:** `vendorUpdateSchema` — `src/features/vendors/vendor.schema.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `{ name: "Renamed" }`, `{ isActive: false }`, `{}`, `{ isActive: "yes" }`, and a 101-character name
- **When** each input is parsed
- **Then** the first three succeed (all fields are optional), the string `isActive` fails, and the long name fails
- **Notes:** `.partial()` makes `name` optional even though the dialog always sends it. The API contract adds a required `vendorId` outside this schema. An empty payload is a legitimate no-op and is covered by VND-013.

### VND-003 · Payment create schema only accepts positive whole-number amounts

- **Covers:** `vendorPaymentCreateSchema` — `src/features/vendors/vendor.schema.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a valid vendor UUID and amounts `100`, `0`, `-1`, `1.5`, `NaN`, and `"100"`, plus a non-UUID vendor and a valid input with `purchaseId` omitted
- **When** each input is parsed
- **Then** only `100` and the purchase-less input succeed; every other amount fails; the non-UUID vendor fails with "Vendor is required"
- **Notes:** `amount` must be an integer even though `vendor_payments.amount` is `real`, so the API cannot record fractional payments. This is the schema the API trusts; the dialog adds a separate string schema (VND-004).

### VND-004 · Payment form schema validates digit-only amount strings

- **Covers:** `vendorPaymentCreateFormSchema` — `src/features/vendors/vendor.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** amount strings `"100"`, `"0"`, `"1.5"`, `"-1"`, `""`, `"1e3"`, `"abc"`, and a valid UUID vendor
- **When** each form input is parsed
- **Then** only `"100"` succeeds; empty, decimal, negative, exponent, and non-numeric strings fail with the documented required/whole-number/positive messages
- **Notes:** the regex accepts arbitrarily long digit strings; the dialog then calls `Number(amount)`. Decide whether to cap at `Number.MAX_SAFE_INTEGER` to avoid precision loss before the API receives the value (VND-042).

## Vendor API

### VND-010 · Vendor list paginates with documented defaults and metadata

- **Covers:** `listVendorProcedure` — `src/features/vendors/api/vendor.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** 25 vendors with distinct fixed `createdAt` values
- **When** `vendor.list` is called with `{ page: 2, limit: 10, orderField: "createdAt", order: "asc" }`, then with no pagination fields
- **Then** the first call returns 10 rows in ascending creation order with `meta.currentPage = 2`, `queryCount = 10`, `totalCount = 25`, `pageCount = 3`, `nextPage = 3`; the default call returns page 1 with up to 20 rows
- **Notes:** `buildPaginateOptions` defaults to page 1/limit 20 and clamps values below 1. The response envelope is `{ message, success, data: { meta, data } }`. `orderBy` falls back to `sql\`1\`` when the field or direction is missing.

### VND-011 · Vendor search matches name or phone and reports a filtered total

- **Covers:** `listVendorProcedure` — `src/features/vendors/api/vendor.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** vendors "Napa Traders" (`+8801700000001`), "Ace Pharma" (`+8801700000002`), and "Other" (`+8801900000000`)
- **When** `vendor.list` is called with `search: "nap"` and `searchFields: ["name", "phone"]`, then with `search: "0002"`
- **Then** the first call returns only "Napa Traders"; the second returns only "Ace Pharma"; `meta.totalCount` and `meta.pageCount` reflect the matching rows
- **Notes:** **Current bug:** `totalCount` uses `context.db.$count(VendorTable)` without `where`, so it counts every vendor while `data` is filtered. `buildPaginationMeta` can therefore inflate `pageCount` when a full page is returned. Search is only applied when `searchFields` is supplied; with it omitted the procedure returns all vendors. Decide whether omitting `searchFields` should fall back to the contract's declared fields. `LIKE` wildcards in `search` are unescaped (see DBU-044).

### VND-012 · Creating a vendor persists defaults and returns the row

- **Covers:** `createVendorProcedure` — `src/features/vendors/api/vendor.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an authorized user and a payload `{ name: "Acme", phone: "+8801700000001", address: "Dhaka" }`
- **When** `vendor.create` is called
- **Then** one `vendors` row exists with those values, `isActive` defaults to `true`, `id` is a UUID, `createdAt`/`updatedAt` are set, and the response has `success: true` and the "Vendor created successfully." message
- **Notes:** there is no unique-name constraint, so duplicate names are allowed. Phone is not validated or normalized on the server (only the UI phone field does that). Empty optional strings are converted to `undefined` before insert (VND-001).

### VND-013 · Vendor update changes supplied fields and no-ops on an empty payload

- **Covers:** `updateVendorProcedure` — `src/features/vendors/api/vendor.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an existing vendor and an authorized user
- **When** `vendor.update` is called with `{ vendorId, name: "Renamed", isActive: false, address: "Chattogram" }`, then with `{ vendorId }` only
- **Then** the first call persists the new name, active flag, and address and returns the updated row; the second returns the existing row unchanged with the update message and does not change `updatedAt`
- **Notes:** `db_updated_at` has `$onUpdate`, so the non-empty update bumps `updatedAt` while the empty-payload branch returns early. **Decision needed:** sending `""` for `phone`/`address`/`note` is transformed to `undefined`, and Drizzle skips undefined columns, so optional fields cannot be cleared. Decide whether `""` should null the column and add the matching test.

### VND-014 · Updating an unknown vendor returns NOT_FOUND

- **Covers:** `updateVendorProcedure` — `src/features/vendors/api/vendor.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** no vendor with the supplied UUID
- **When** `vendor.update` is called with that ID and a valid change
- **Then** it throws the contract's `NOT_FOUND` error (404, "Vendor not found.") and inserts/updates nothing
- **Notes:** the existence check runs before the empty-payload shortcut, so even a no-op update of an unknown ID returns 404.

### VND-015 · Vendor details compute purchase, payment, and balance totals

- **Covers:** `vendorDetailsProcedure` — `src/features/vendors/api/vendor.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** vendor A with purchases `100.10` and `50.20` and payments `60`, vendor B with unrelated purchases/payments, and vendor C with no activity
- **When** `vendor.details` is called for each
- **Then** A returns `totalPurchased ≈ 150.30`, `totalPaid = 60`, `balance ≈ 90.30`, `purchaseCount = 2`, `paymentCount = 1`; B's rows are excluded; C returns all zeros
- **Notes:** totals come from `purchases.totalAmount` and `vendor_payments.amount`, not from `purchases.paidAmount`, so the two views can diverge (see VND-030). Purchase returns are **not** netted out of the balance; decide whether they should be. Use an epsilon for the balance because the columns are `real`. A vendor overpaid through general payments returns a **negative** balance; only the UI clamps it (VND-043).

### VND-016 · Vendor details for an unknown ID returns NOT_FOUND

- **Covers:** `vendorDetailsProcedure` — `src/features/vendors/api/vendor.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** no vendor with the supplied UUID
- **When** `vendor.details` is called
- **Then** it throws `NOT_FOUND` (404, "Vendor not found.") and does not run the totals queries
- **Notes:** mirrors the update not-found path; assert the contract error code, not just the HTTP status.

### VND-017 · Vendor search list projects only the selector fields and ignores paging

- **Covers:** `listVendorForSearchProcedure` — `src/features/vendors/api/vendor.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** three matching vendors and a search string
- **When** `vendor.listForSearch` is called with `searchFields: ["name", "phone"]`, `limit: 1`, and `page: 1`
- **Then** the response `data` is a bare array (no pagination envelope) of `{ id, name, phone }` objects only, and all three matches are currently returned
- **Notes:** the procedure drops `offset`, `limit`, and `orderBy` entirely, although the contract accepts them. The selector intentionally requests `limit: 5`, so a large directory can overflow the dropdown. Decide whether to honor the page size or document the unbounded result. There is no `ORDER BY`, so result order is not deterministic; assert set membership, not order.

### VND-018 · Vendor deletion is not exposed by the API

- **Covers:** `vendorContract`, `vendor.router.ts`, `VendorTable` — `src/features/vendors/api/*`, `src/db/schemas/table/vendor/vendor.table.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** `API_MESSAGES.VENDOR.REMOVE` exists and vendor foreign keys use `onDelete("restrict")`
- **When** the vendor API surface is inspected for a delete/archive procedure
- **Then** no delete endpoint exists, and the vendor table/row menu offers no delete action
- **Notes:** this is a coverage gap, not a behavior test yet. **Decision needed:** implement soft delete (`deletedAt`/`deletedBy` helpers exist), block hard deletion when purchases or payments exist, and add a permission-gated action — or explicitly declare vendor deletion out of scope. Add a real case once the choice is made.

## Permissions

### VND-020 · Vendor and payment procedures enforce authentication and action permissions

- **Covers:** `authMiddleware`, `userPermissionMiddleware` usage in the vendor and payment procedures — `src/features/vendors/api/*.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** (a) no user/session, (b) a user with `system:vendor:list`, `system:vendor:read`, and `system:vendor_payment:read` only, and (c) a user with `manage` on both resources
- **When** `vendor.list`, `vendor.create`, `vendor.update`, `vendor.details`, `vendor.payment.list`, `vendor.payment.create`, and `vendor.payment.stats` are called
- **Then** (a) every call fails with `UNAUTHORIZED` (401); (b) the list/details/payment list/payment stats calls succeed and create/update/payment create calls fail with `FORBIDDEN` (403); (c) every call succeeds because `manage` expands to all actions
- **Notes:** required actions are `vendor:list|read|create|update` and `vendor_payment:read|create` (each endpoint also accepts `manage`). The check is inside the procedure, so UI hiding is not sufficient. For case (b), keep `roles` and `permissions` non-empty, otherwise the middleware attempts a database permission lookup. Include at least one assertion that a mutation rejected with 403 wrote nothing.

## Payment API

### VND-030 · Recording a payment against a purchase increments the purchase paid amount

- **Covers:** `createVendorPaymentProcedure` — `src/features/vendors/api/vendorPayment.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a vendor, a purchase with `totalAmount: 500` and `paidAmount: 100`, and an authorized user
- **When** `vendor.payment.create` is called with `{ vendorId, purchaseId, amount: 200, note: "Cash" }`
- **Then** one payment row is inserted with `createdBy` equal to the user ID and the supplied values; the purchase's `paidAmount` becomes `300`; the response contains the payment and the "Payment recorded successfully." message
- **Notes:** the payment insert and the `paidAmount` increment are **not** wrapped in a transaction. A failure between them leaves a payment that is not reflected on the purchase. Decide whether to move both statements into `db.transaction` (or batch) and add a fault-injection test for rollback. Payment amounts are integers, so `paidAmount` gains integer increments.

### VND-031 · The overpayment rule rejects amounts above the remaining balance

- **Covers:** `createVendorPaymentProcedure` — `src/features/vendors/api/vendorPayment.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a purchase with `totalAmount: 500` and `paidAmount: 200` (remaining 300)
- **When** payments of `300`, then `301`, then `0.01` are attempted
- **Then** `300` succeeds and leaves a zero balance; `301` fails with `PAYMENT_EXCEEDS` (400, "Payment amount exceeds the remaining balance."); a fractional amount is rejected by input validation; neither rejected call inserts a payment or changes `paidAmount`
- **Notes:** the check is `amount > purchase.totalAmount - purchase.paidAmount`, so exact payment is allowed. Because the schema requires an integer, fractional overpayment can only arrive through a contract violation. Whole-number only means integer payments; still assert the money arithmetic with an epsilon for decimal purchase totals (for example `totalAmount: 100.3, paidAmount: 0.1`). **Rounding risk:** the subtraction is unrounded floating point; decide whether to normalize money to minor units or round before comparing.

### VND-032 · General payments without a purchase are allowed and do not touch purchases

- **Covers:** `createVendorPaymentProcedure` — `src/features/vendors/api/vendorPayment.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a vendor with purchases totalling `100` and an authorized user
- **When** `vendor.payment.create` is called with `{ vendorId, amount: 250 }` and no `purchaseId`
- **Then** the payment is inserted with `purchaseId: null`, no purchase's `paidAmount` changes, and the vendor balance becomes `-150` in `vendor.details`
- **Notes:** there is no vendor-level overpayment guard, so general payments can exceed everything owed. The UI labels these rows "General payment" (VND-040/VND-043). Decide whether to cap general payments or allow credit/advance payments, and document the intended balance sign.

### VND-033 · Payment creation reports missing vendor or purchase separately

- **Covers:** `createVendorPaymentProcedure` — `src/features/vendors/api/vendorPayment.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an unknown vendor ID, and separately a known vendor with an unknown purchase ID
- **When** `vendor.payment.create` is called for each
- **Then** the first throws `VENDOR_NOT_FOUND` (404, "Vendor not found."); the second throws `PURCHASE_NOT_FOUND` (404, "Purchase not found."); neither inserts a payment
- **Notes:** the vendor check runs first, so an input with both IDs invalid reports the vendor error. Assert the contract error codes and that payment count is unchanged.

### VND-034 · Payment vendor must match the purchase vendor

- **Covers:** `createVendorPaymentProcedure` — `src/features/vendors/api/vendorPayment.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** vendor A and a purchase that belongs to vendor B, with an outstanding balance
- **When** `vendor.payment.create` is called with `vendorId: A` and that purchase's ID
- **Then** the call should be rejected (or the vendor should be derived from the purchase) and no payment or `paidAmount` change should occur
- **Notes:** **Decision needed.** Current code never compares `purchase.vendorId` with `vendorId`; it records the payment under A and increments B's purchase. The payment dialog's purchase description says "The vendor is taken from the selected purchase", but the dialog never copies the purchase's vendor into `vendorId`, so the mismatch is reachable from the UI. This is a data-integrity risk and should be resolved before calling payment recording complete.

### VND-035 · Payment list filters by vendor, invoice search, and created-at range

- **Covers:** `listVendorPaymentsProcedure` — `src/features/vendors/api/vendorPayment.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** payments for two vendors, some linked to purchases with invoice numbers and some general payments, with fixed timestamps inside and outside a range
- **When** `vendor.payment.list` is called with `vendorId`, `search` + `searchFields: ["invoiceNo"]`, and `filter.createdAt: { from, to }` in separate calls
- **Then** each call returns only matching payments; rows include `vendorName`, `invoiceNo` (string or `null`), amount, note, and `createdAt` but not `createdBy`; metadata counts match the filtered result set; results are newest-first
- **Notes:** the invoice filter joins `vendor_payments → purchases → purchase_invoices` and inner-joins vendors. General payments have `invoiceNo: null` and display a fallback label. Search only works when `searchFields` is supplied. `createdAt` bounds are inclusive (`gte`/`lte`); freeze time around the boundary. Use distinct timestamps because the secondary `orderBy` is the constant fallback.

### VND-036 · Payment stats filter payments but not the due amount

- **Covers:** `vendorPaymentStatsProcedure` — `src/features/vendors/api/vendorPayment.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** payments in two different months and purchases across multiple vendors with outstanding balances
- **When** `vendor.payment.stats` is called with a `createdAt` range covering only one month
- **Then** `totalPaid` and `paymentCount` include only in-range payments; `dueAmount` is the sum of `totalAmount - paidAmount` across **all** purchases regardless of range or vendor; `dueAmount` can be negative for overpaid purchases
- **Notes:** the UI labels due as "across all purchases", which matches the implementation, but the stat sits next to a date filter and can mislead. **Decision needed:** should due respect the selected range (and/or a vendor) or stay a global figure? There is no vendor filter input on this endpoint. The due query also ignores purchase returns.

### VND-037 · Vendor payments have no update or delete operation

- **Covers:** `vendorPaymentContract`, `vendor.router.ts`, `PaymentTableRowAction.tsx`, `updateVendorPaymentSchema` — `src/features/vendors/api/vendorPyament.contract.ts`, `src/db/schemas/table/vendor/vendorPayment.table.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a recorded payment and `updateVendorPaymentSchema` exists in the database layer
- **When** the payment API surface and payment row menu are inspected
- **Then** only list/create/stats exist; the row menu only offers "View vendor"; no edit or delete action is reachable
- **Notes:** **Decision needed.** If edit/delete is added, it must reverse the purchase `paidAmount` effect, prevent over-reversal, and recalculate balances atomically; a delete that only removes the payment row would corrupt `purchases.paidAmount`. Until then, this is a documented gap rather than a passing behavior.

## UI

### VND-040 · Vendor and payment management screens render rows and gate actions

- **Covers:** `VendorManagementTable`, `VendorTable`, `vendorTableColumn`, `VendorTableRowAction`, `PaymentManagementTable`, `PaymentTable`, `paymentTableColumn`, `PaymentTableRowAction`, `PaymentStats` — `src/features/vendors/components/{vendor-table,payment-table}/*`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** vendor rows (one with phone/address, one without), payment rows (invoice, purchase without invoice, general payment), fixed stats, and a user with create/update permissions
- **When** the vendor and payment pages render
- **Then** vendor rows link to `/dashboard/vendors/$vendorId` with `tab=details`, show the phone under the name, "Not provided" for a missing address, and Active/Inactive badges; the row menu always offers Details and offers Update only with `vendor:update`; payment rows fall back to "Purchase without invoice"/"General payment", link the vendor with `tab=payment`, format amounts, and show "—" for a missing note; the row menu offers "View vendor"; stats render formatted total paid, due, and count; "Create vendor"/"Record payment" appear only with the matching `create` permission
- **Notes:** seed the auth store with `permissions` and `user` (`usePermissionCheck` reads both). Assert that the global search calls the setter after the 500 ms debounce by advancing fake timers. Amounts use `formatCurrency` (`#,##0.### ৳`), so assert the formatted string, not a raw number.

### VND-041 · Vendor create and update dialogs validate, submit, and invalidate caches

- **Covers:** `VendorCreateDialog`, `VendorUpdateDialog`, `useCreateVendor`, `useUpdateVendor` — `src/features/vendors/components/VendorCreateDialog.tsx`, `VendorUpdateDialog.tsx`, `api/vendor.api.hook.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the create dialog open, and the update dialog opened for a vendor with a null address/note
- **When** the create form is submitted with an empty name, then with valid values; and the update form is submitted after toggling `isActive` and renaming
- **Then** the empty-name submit shows "Vendor name is required" and does not mutate; the valid create calls `mutate` once, resets the form, closes the dialog, and invalidates the vendor list query; the update form is prefilled with `""` for null fields, its title includes the vendor name, and submit sends `{ ...values, vendorId }`, closes on success, and invalidates the vendor list (prefix) plus the exact `vendor.details` query for that ID
- **Notes:** server-side validation errors are mapped with `form.setError` via `onValidationErrors`; add that path to the test. `isPending` disables inputs and buttons. Mutation failures should leave the dialog open. The create/update toast IDs are stable (`create_vendor_toast_message`, `update_vendor_toast_message`).

### VND-042 · Payment dialog adapts to preselected IDs and converts the amount

- **Covers:** `VendorPaymentCreateDialog`, `useCreateVendorPayment`, `VendorSelectorField`, `VendorPurchaseSelectorField` — `src/features/vendors/components/VendorPaymentCreateDialog.tsx`, `VendorSelectorField.tsx`, `api/vendorPayment.api.hook.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the dialog rendered (a) with neither `vendorId` nor `purchaseId`, (b) with `vendorId` only, (c) with `purchaseId` only, and (d) with an invalid amount
- **When** each variant renders and the amount is submitted as `"12"`, `"1.5"`, and `"0"`
- **Then** (a) shows both selectors and disables the purchase selector until a vendor is chosen; (b) hides the vendor selector; (c) hides the purchase selector; `"12"` mutates with `amount: 12`; `"1.5"` and `"0"` show the whole-number/positive messages and do not mutate; success resets, closes, and invalidates payment list/stats, purchase list/stats, vendor details, and (when `purchaseId` is set) purchase details
- **Notes:** the purchase selector queries `purchase.listForSearch` with `unpaidOnly: true`, `limit: 5`, and the watched vendor ID. Its description claims the vendor comes from the purchase, but no `onChange` copies the purchase's vendor — cross-reference the VND-034 decision. The selector query is disabled until `open` and (`fetchApi`) / a vendor is present. Mock the selector queries rather than exercising the full search UI.

### VND-043 · Vendor detail header, summary, and tabs render money and empty states

- **Covers:** `VendorHeader`, `VendorDetailsTab`, `VendorPaymentsTab`, `VendorPurchasesTab` — `src/features/vendors/components/{VendorHeader.tsx,vendor-details/*}`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a vendor with summary `{ totalPurchased: 150.3, totalPaid: 60, balance: 90.3, purchaseCount: 2, paymentCount: 1 }`, null phone/address/note, payments (invoice, purchase without invoice, general), purchases (unpaid, partially paid, paid, overpaid), and a user with/without update and `vendor_payment:create`
- **When** the header and each tab render
- **Then** the header shows the name and an Active/Inactive badge; the details tab formats the three summary values, shows "Outstanding to vendor" when balance > 0, "Fully settled" and a zero display when balance ≤ 0 (including negative), shows "Not provided" for null contact fields, formats created/updated dates, and shows the edit button only with `vendor:update`; the payments tab shows the invoice fallback labels, amounts, note dash, `MetaPagination`, an empty "No payments yet" state, and "Record payment" only with `vendor_payment:create`; the purchases tab clamps the displayed due at 0 and renders Paid / Partially paid / Unpaid badges, an empty "No purchases yet" state, and pagination
- **Notes:** **Rounding risk:** `hasBalance = summary.balance > 0` has no epsilon, so a balance such as `5e-17` renders "Outstanding to vendor" while `formatCurrency` displays `0 ৳`. Assert that a near-zero balance is treated as settled. The API returns negative balances for overpayment (VND-015/VND-032); the summary clamps display with `Math.max(balance, 0)`. Formatting assertions must match `formatCurrency` and the `dd MMM, yyyy` date format.
