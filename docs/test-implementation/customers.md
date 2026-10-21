# Customers — Test Implementation

Scope: `src/features/customer/**` — customer CRUD/search, customer details and
purchase/payment history, the derived due and last-purchase figures shown in the
list, and the customer management screen.

## Source map

| File                                                                          | Responsibility                                                                                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/features/customer/customer.schema.ts`                                    | Zod schemas for customer create/update and customer payment create/form                          |
| `src/features/customer/customer.schema.test.ts`                               | Payment create and form schema cases                                                             |
| `src/features/customer/api/customer.contract.ts`                              | oRPC contracts for list, search list, create, update, details, payment list/create               |
| `src/features/customer/api/customer.procedure.ts`                             | List/search/create/update/details and payment list/create handlers, aggregates, permission gates |
| `src/features/customer/api/customer.router.ts`                                | Wires customer and customer-payment procedures into the root router                              |
| `src/features/customer/api/customer.api.hook.ts`                              | `useCreateCustomer`, `useUpdateCustomer` mutations, cache invalidation, toasts                   |
| `src/features/customer/api/customerPayment.api.hook.ts`                       | `useCreateCustomerPayment` mutation and cross-domain cache invalidation                          |
| `src/features/customer/components/CustomerCreateDialog.tsx`                   | Create-customer dialog and form                                                                  |
| `src/features/customer/components/CustomerUpdateDialog.tsx`                   | Update-customer dialog, prefill, active toggle                                                   |
| `src/features/customer/components/CustomerHeader.tsx`                         | Customer name and active/inactive badge                                                          |
| `src/features/customer/components/CustomerPaymentCreateDialog.tsx`            | Record-payment dialog with optional sale selector                                                |
| `src/features/customer/components/CustomerSaleSelectorField.tsx`              | Searchable unpaid-sale selector for a customer                                                   |
| `src/features/customer/components/customer-details/CustomerDetailsTab.tsx`    | Summary stats, contact card, record dates, update dialog                                         |
| `src/features/customer/components/customer-details/CustomerPurchasesTab.tsx`  | Customer-scoped sale history with due and status badges                                          |
| `src/features/customer/components/customer-details/CustomerPaymentsTab.tsx`   | Customer-scoped payment history and record-payment action                                        |
| `src/features/customer/components/customer-table/CustomerManagementTable.tsx` | Customer page shell, search, create button, permission gate                                      |
| `src/features/customer/components/customer-table/CustomerTable.tsx`           | Customer data table wrapper                                                                      |
| `src/features/customer/components/customer-table/customerTableColumn.tsx`     | Columns: linked name/phone/address, due amount, last purchase, actions                           |
| `src/features/customer/components/customer-table/CustomerTableRowAction.tsx`  | Details link and permission-gated update dialog                                                  |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 1      |
| Partial     | 0      |
| Missing     | 18     |
| **Total**   | **19** |

Existing test file: `src/features/customer/customer.schema.test.ts` covers the
customer payment schemas (CUS-003). All procedure and component cases remain
`Missing`.

## Test environment and mocks

- **Schema cases** are plain `unit` tests. Import the schemas, call `safeParse`, and
  assert `success` plus issue paths/messages. No D1 binding.
- **Procedure cases** are `integration` tests: handler plus Drizzle/D1. The repo has no
  shared D1 test harness yet; follow the approach described in
  [vendors.md](./vendors.md#test-environment-and-mocks) (in-memory SQLite or Miniflare D1
  with `migrations/` applied, explicit `ORPCContext`, fixed UUIDs and frozen clock).
- Build an `ORPCContext` with `db`, `user`, `session`, `permissions`, `roles`, and
  `reqHeaders`. Keep `roles` and `permissions` non-empty for permission-denied cases so
  the middleware does not fall back to a database lookup.
- **Money:** `sales.total_amount` and `customer_payments.amount` are `real`. Assert due
  values with `toBeCloseTo` and an explicit epsilon.
- **Component cases** use jsdom + Testing Library. Mock `@/server/orpc` query options,
  wrap in `QueryClientProvider`, seed the auth store with `user` and `permissions`, mock
  TanStack Router `Link`, and mock `react-hot-toast`. Use fake timers for the 500 ms
  search debounce.

## Customer schemas

### CUS-001 · Customer create schema normalizes optional empty strings and enforces name limits

- **Covers:** `customerCreateSchema` — `src/features/customer/customer.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{ name: "Rahim" }`, then `{ name: "Rahim", phone: "", address: "", note: "" }`, then `{ name: "" }`, then a 101-character name
- **When** each input is parsed with `customerCreateSchema.safeParse`
- **Then** the first two succeed and empty optional fields become `undefined`; the last two fail on `name` with "Customer name is required" and "Name is too long"
- **Notes:** `name` is not trimmed, so `"   "` passes `min(1)`. Decide whether whitespace-only names should be rejected. This schema feeds the create dialog and the API contract.

### CUS-002 · Customer update schema is partial and types the active flag

- **Covers:** `customerUpdateSchema` — `src/features/customer/customer.schema.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `{ name: "Renamed" }`, `{ isActive: false }`, `{}`, and `{ isActive: "yes" }`
- **When** each input is parsed
- **Then** the first three succeed (all fields optional), and the string `isActive` fails
- **Notes:** the API contract adds a required `customerId` outside this schema. An empty payload is a legitimate no-op covered by CUS-015.

### CUS-003 · Customer payment schemas require a positive whole amount

- **Covers:** `customerPaymentCreateSchema`, `customerPaymentCreateFormSchema` — `src/features/customer/customer.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** valid `{ customerId, amount: 500 }` with and without a `saleId`/note, an empty note, and invalid amounts (`0`, `-1`, `10.5`, missing, `""`, `"0"`, `"10.5"`)
- **When** each input is parsed with the matching schema
- **Then** the valid create payloads succeed and the empty note becomes `undefined`; whole-number string amounts succeed in the form schema; every non-positive, fractional, or missing amount fails
- **Notes:** the API schema validates a number; the form schema validates the raw string and requires digits only. Tests live in `customer.schema.test.ts`.

## Customer API

### CUS-010 · Customer list paginates with documented defaults and metadata

- **Covers:** `listCustomerProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** 25 customers with distinct fixed `createdAt` values
- **When** `customer.list` is called with `{ page: 2, limit: 10, orderField: "createdAt", order: "asc" }`, then with no pagination fields
- **Then** the first call returns 10 rows in ascending creation order with `meta.currentPage = 2`, `queryCount = 10`, `totalCount = 25`, `pageCount = 3`, `nextPage = 3`; the default call returns page 1 with up to 20 rows
- **Notes:** the total count query applies the same `where` as the data query, so a filtered list reports a filtered total.

### CUS-011 · Customer search matches name, phone, or address

- **Covers:** `listCustomerProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** customers "Rahim Uddin" (`+8801700000001`, "Mirpur, Dhaka"), "Karim Ahmed" (`+8801700000002`, "Uttara, Dhaka"), and "Other" (`+8801900000000`, "Chattogram")
- **When** `customer.list` is called with `search: "rahim"`, then `search: "0002"`, then `search: "uttara"`, each with `searchFields: ["name", "phone", "address"]`
- **Then** each call returns only the matching customer and `meta.totalCount` reflects the filtered set
- **Notes:** search is only applied when `searchFields` is supplied; `LIKE` wildcards in `search` are not escaped (same shared helper as the other list endpoints).

### CUS-012 · Customer list derives due amount from sales and payments

- **Covers:** `listCustomerProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** customer A with sales `100.10` and `50.20`, payments `60`, customer B with a sale of `40` and no payments, and customer C with no activity
- **When** `customer.list` is called
- **Then** A returns `dueAmount ≈ 90.30`, B returns `40`, and C returns `0`; the values exclude sales and payments belonging to other customers
- **Notes:** due is `SUM(sales.total_amount) - SUM(customer_payments.amount)`; `sales.paid_amount` is **not** subtracted separately because sale-linked customer payments already record that money (see the dev seed). A customer who overpays returns a negative due. Assert with an epsilon because the columns are `real`.

### CUS-013 · Customer list returns the most recent sale as last purchase

- **Covers:** `listCustomerProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** customer A with sales on three fixed timestamps, customer B with a walk-in-only history, and customer C with no sales
- **When** `customer.list` is called
- **Then** A's `lastPurchaseAt` equals its newest sale timestamp (not the oldest), and B/C return `null`
- **Notes:** the aggregate ignores `sales.customer_id IS NULL` walk-in rows. Timestamps are stored as epoch milliseconds and converted to `Date` before returning. Freeze the clock and use distinct timestamps so ordering is deterministic.

### CUS-014 · Creating a customer persists defaults and returns the row

- **Covers:** `createCustomerProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an authorized user and `{ name: "Rahim", phone: "+8801700000001", address: "Dhaka" }`
- **When** `customer.create` is called
- **Then** one `customers` row exists with those values, `isActive` defaults to `true`, `id` is a UUID, timestamps are set, and the response has `success: true` with "Customer created successfully."
- **Notes:** there is no unique-name or phone constraint, so duplicates are allowed. Phone is normalized only by the UI field, not the server.

### CUS-015 · Customer update changes supplied fields and no-ops on an empty payload

- **Covers:** `updateCustomerProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an existing customer and an authorized user
- **When** `customer.update` is called with `{ customerId, name: "Renamed", isActive: false, address: "Chattogram" }`, then with `{ customerId }` only
- **Then** the first call persists the new values and returns the updated row; the second returns the existing row with the update message and does not change `updatedAt`
- **Notes:** `db_updated_at` has `$onUpdate`. Sending `""` for optional fields transforms to `undefined`, and Drizzle skips undefined columns, so optional fields cannot be cleared yet; decide whether `""` should null them.

### CUS-016 · Updating an unknown customer returns NOT_FOUND

- **Covers:** `updateCustomerProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** no customer with the supplied UUID
- **When** `customer.update` is called with that ID and a valid change
- **Then** it throws the contract's `NOT_FOUND` error (404, "Customer not found.") and updates nothing
- **Notes:** the existence check runs before the empty-payload shortcut, so a no-op update of an unknown ID also returns 404.

### CUS-017 · Customer search list returns active customers with selector fields only

- **Covers:** `listCustomerForSearchProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** active and inactive customers matching a search
- **When** `customer.listForSearch` is called with `searchFields: ["name", "phone", "address"]` and `limit: 5`
- **Then** the response is a bare array (no pagination envelope) of `{ id, name, phone, address }` objects, sorted by name, containing no inactive customers and at most the requested limit
- **Notes:** unlike the paginated list, this endpoint filters `isActive = true`. It is intended for future sale/customer selectors.

### CUS-019 · Customer details aggregate sales and payments

- **Covers:** `customerDetailsProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** customer A with sales totalling `200.50` (two sales, newest `2026-01-02T10:00:00Z`) and customer payments totalling `70` (two payments), and customer B with no activity
- **When** `customer.details` is called for A, then B, then an unknown UUID
- **Then** A returns its fields plus `summary.totalPurchased ≈ 200.50`, `totalPaid ≈ 70`, `dueAmount ≈ 130.50`, `purchaseCount = 2`, `paymentCount = 2`, and `lastPurchaseAt` equal to the newest sale; B returns zero totals/counts and `lastPurchaseAt: null`; the unknown ID throws `NOT_FOUND` (404)
- **Notes:** like the list, due is `SUM(sales.total_amount) - SUM(customer_payments.amount)` and ignores `sales.paid_amount` separately. Convert the `MAX(created_at)` epoch value to a `Date`. Assert money with an epsilon.

### CUS-020 · Creating a customer payment records money and updates a linked sale

- **Covers:** `createCustomerPaymentProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a customer with an unpaid sale, a fully paid sale, a sale belonging to another customer, and an unknown customer ID
- **When** `customer.payment.create` is called with a general payment, a sale-linked payment within the remaining balance, a sale-linked payment larger than the balance, a sale owned by another customer, and an unknown customer
- **Then** the valid calls insert a `customer_payments` row with `createdBy` set to the caller and return it; a sale-linked call also increases `sales.paid_amount` by the amount; the over-balance call throws `PAYMENT_EXCEEDS` (400); the cross-customer sale throws `SALE_NOT_FOUND` (404); the unknown customer throws `CUSTOMER_NOT_FOUND` (404); failed calls write nothing
- **Notes:** sale ownership is checked before the remaining-balance check. A general payment has no balance cap, matching the vendor payment behavior.

### CUS-021 · Customer payment list is scoped and paginated

- **Covers:** `listCustomerPaymentsProcedure` — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** customer A with two payments (one sale-linked, one general) and customer B with one payment
- **When** `customer.payment.list` is called with A's ID, page/limit, and an optional invoice search or created-at range
- **Then** only A's payments are returned newest first (unless an explicit order is given), each with its linked `invoiceNo` or `null` for a general payment; `meta.totalCount` reflects A's filtered set
- **Notes:** search matches `sales.invoice_no` through a left join, so general payments simply do not match an invoice search. The customer ID is required by the contract.

### CUS-018 · Customer procedures enforce authentication and action permissions

- **Covers:** `authMiddleware`, `userPermissionMiddleware` usage in the customer and customer-payment procedures — `src/features/customer/api/customer.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** (a) no user/session, (b) a user with `system:customer:list` and `system:customer_payment:list` only, and (c) a user with `system:customer:manage` and `system:customer_payment:manage`
- **When** `customer.list`, `customer.listForSearch`, `customer.create`, `customer.update`, `customer.details`, `customer.payment.list`, and `customer.payment.create` are called
- **Then** (a) every call fails with `UNAUTHORIZED` (401); (b) list/search/details/payment-list succeed while create/update/payment-create fail with `FORBIDDEN` (403); (c) every call succeeds because `manage` expands to all actions
- **Notes:** each endpoint accepts either `manage` or its specific action. Details needs `customer:read`; customer payments need `customer_payment:read` or `:create`. A forbidden mutation must write nothing. UI permission hiding is not sufficient; the gate is inside the procedure.

## UI

### CUS-030 · Customer management screen renders the combined row and gates actions

- **Covers:** `CustomerManagementTable`, `CustomerTable`, `customerTableColumn`, `CustomerTableRowAction` — `src/features/customer/components/customer-table/*`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** customer rows: one with phone and address, one missing both, one with a positive due, one with a zero due, one with a negative (advance) due, and one with no purchases; users with and without `customer:create` / `customer:update`
- **When** the customer page renders
- **Then** the first cell shows the linked name with phone and address below it (or "No phone"/"No address"); the name and the row menu's Details action point to `/dashboard/customers/$customerId?tab=details`; the due cell shows a right-aligned `formatCurrency` amount for a positive due, "No due" for zero, and an advance label for a negative due; the last-purchase cell shows a `dd MMM, yyyy` date or "No purchases"; "Create customer" appears only with `customer:create`; Details is always offered and Update appears only with `customer:update` and opens a prefilled dialog
- **Notes:** the due threshold is `0.005`, so a near-zero float renders "No due". Amounts use `formatCurrency` (`#,##0.### ৳`). Seed the auth store with both `user` and `permissions`, and advance fake timers to assert the debounced global search.

### CUS-031 · Customer create and update dialogs validate, submit, and invalidate caches

- **Covers:** `CustomerCreateDialog`, `CustomerUpdateDialog`, `useCreateCustomer`, `useUpdateCustomer` — `src/features/customer/components/CustomerCreateDialog.tsx`, `CustomerUpdateDialog.tsx`, `api/customer.api.hook.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the create dialog open, and the update dialog opened for a customer with a null address/note
- **When** the create form is submitted with an empty name, then with valid values; and the update form is submitted after toggling `isActive` and renaming
- **Then** the empty-name submit shows "Customer name is required" and does not mutate; the valid create calls `mutate` once, resets, closes, and invalidates `customer.list` and `customer.listForSearch`; the update form is prefilled with `""` for null fields, its title includes the customer name, and submit sends `{ ...values, customerId }`, closes on success, and invalidates `customer.list`, `customer.listForSearch`, and `customer.details({ customerId })`
- **Notes:** server-side validation errors are mapped with `form.setError` via `onValidationErrors`; add that path. Toast IDs are `create_customer_toast_message` and `update_customer_toast_message`. Mutation failures must leave the dialog open.

### CUS-032 · Customer details route renders the requested tab from the URL

- **Covers:** `src/routes/dashboard/_dashboardLayout/customers/$customerId.tsx`, `CustomerHeader`, `CustomerDetailsTab`, `CustomerPurchasesTab`, `CustomerPaymentsTab`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a customer with summary data, purchases, and payments; URLs without `tab`, with `?tab=purchase`, and with `?tab=payment`
- **When** the route renders
- **Then** the header shows the customer name and active badge; the loader requests `customer.details`; Details is the default tab; "Details", "Purchase", and "Payments" switch content and write the tab to the URL; Details shows total purchases, total paid, due/advance, contact fields, record dates, and the permission-gated edit button; Purchase lists only that customer's sales with invoice/total/paid/due/status; Payments lists only that customer's payments
- **Notes:** the route accepts `tab: "details" | "purchase" | "payment"`. A user with `customer:read` can open the page, while `customer:update` is needed for the edit action. Money is rendered with `formatCurrency`.

### CUS-033 · Recording a customer payment validates and invalidates related queries

- **Covers:** `CustomerPaymentCreateDialog`, `CustomerSaleSelectorField`, `useCreateCustomerPayment` — `src/features/customer/components/CustomerPaymentCreateDialog.tsx`, `CustomerSaleSelectorField.tsx`, `api/customerPayment.api.hook.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the Payments tab for a customer, with and without `customer_payment:create`, and unpaid sales available
- **When** the user opens the dialog, submits an empty/zero/fractional amount, then submits a valid amount with and without selecting a sale
- **Then** "Record payment" is hidden without `customer_payment:create`; invalid amounts show field errors and do not mutate; a valid submit sends `{ customerId, saleId?, amount: Number(amount), note }`, closes on success, and invalidates `customer.payment.list({ customerId })`, `customer.details({ customerId })`, `customer.list`, and `sale.list`
- **Notes:** the sale selector queries `sale.list` with `customerId` and `unpaidOnly: true`; leaving it empty records a general payment. Toast ID is `create_customer_payment_toast_message`.
