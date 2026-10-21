# Database Seeds — Test Implementation

Scope: `src/db/seed/**` — destructive reset, identity seeds (roles, permissions,
role-permission mappings), development fixtures (users, vendors, medicines, purchases,
sales, payments, expenses, cash closings, stock movements), production bootstrap, seed
configuration and the Wrangler-backed seed database client.

## Source map

| File                                         | Responsibility                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/db/seed/clearAll.ts`                    | Sequentially delete all 30 schema tables, children before parents                               |
| `src/db/seed/roles.seed.ts`                  | Insert the four system roles and export `SYSTEM_ROLES`                                          |
| `src/db/seed/permission.seed.ts`             | Build the 5 self + 86 system permission catalog (91 rows)                                       |
| `src/db/seed/rolePermission.seed.ts`         | Map the four roles to permission tuples (60 rows)                                               |
| `src/db/seed/seed.config.ts`                 | Target row counts for the dev fixtures                                                          |
| `src/db/seed/seed-db.client.ts`              | Resolve `WRANGLER_CONFIG_PATH` / `SEED_REMOTE` into a Drizzle D1 client                         |
| `src/db/seed/seed-utils.ts`                  | Re-export chunked insert helpers; `daysAgo`, `addDays`, `splitAmount`                           |
| `src/db/seed/dev-seed/index.ts`              | Full dev orchestration, summary logging, dispose and exit                                       |
| `src/db/seed/dev-seed/user.seed.ts`          | 4 fixed + 46 random users, `user_roles`, credential accounts                                    |
| `src/db/seed/dev-seed/vendor.seed.ts`        | 12 vendors plus purchase-linked and on-account vendor payments                                  |
| `src/db/seed/dev-seed/medicine.seed.ts`      | 10 medicine categories and 28 medicines from a fixed catalog                                    |
| `src/db/seed/dev-seed/customer.seed.ts`      | 60 customers plus sale-linked and due-collection customer payments                              |
| `src/db/seed/dev-seed/purchase.seed.ts`      | 40 purchases, 40 invoices, purchase items, 6 returns, stock updates                             |
| `src/db/seed/dev-seed/sale.seed.ts`          | Up to 150 sales and sale items, stock updates                                                   |
| `src/db/seed/dev-seed/stockMovement.seed.ts` | Purchase/sale/return ledger rows derived from seeded items                                      |
| `src/db/seed/dev-seed/finance.seed.ts`       | 8 expense categories, 80 expenses, salary payments, 30 cash closings with varying period ranges |
| `src/db/seed/prod-seed/index.ts`             | Production bootstrap: reset, then roles/permissions/mappings only                               |

## Coverage summary

Verified against the repository on 2026-10-20. No seed tests exist today.

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 20     |
| **Total**   | **20** |

| Type        | Count  |
| ----------- | ------ |
| unit        | 2      |
| integration | 18     |
| component   | 0      |
| story       | 0      |
| e2e         | 0      |
| **Total**   | **20** |

| Priority  | Count  |
| --------- | ------ |
| P0        | 12     |
| P1        | 7      |
| P2        | 1      |
| **Total** | **20** |

Existing test files: none under `src/db/seed/**`.

## Test environment

- **Integration cases need a real SQLite engine.** The seed code relies on foreign keys,
  `CHECK` constraints, unique indexes, multi-row `RETURNING`, and D1's 100-parameter
  limit. Use either Miniflare through `getPlatformProxy()` with a temp `persist`
  directory and the migrations applied, or `drizzle-orm/libsql` with an in-memory
  database and `migrations/*.sql` applied before each test (cast the client to
  `DatabaseType` for the seed functions). Run these files with
  `// @vitest-environment node`.
- **Do not use `@variablesoftware/mock-d1` for constraint cases.** Its README describes
  a simple in-memory row store, not a SQL engine, so it cannot prove FK order, `CHECK`
  arithmetic, or unique-index behavior.
- **Reset between tests.** Drop and recreate the schema, or run `clearAll` and truncate
  identity tables. Never share a seeded database across test files.
- **Randomness and time.** Call `faker.seed(<number>)` before each fixture build and
  `vi.setSystemTime(...)` for date assertions. Restore faker state and env vars in
  `afterEach`. The seeds do not seed faker themselves.
- **Entrypoints self-execute.** Both `dev-seed/index.ts` and `prod-seed/index.ts` call
  `main()` at import time and call `process.exit()`. Orchestration cases require
  extracting/exporting `main` (or spawning `tsx` as a child process against a temp D1
  persist directory). Until then, test the individual seed functions directly.
- **Money is `real`.** Compare amounts with an epsilon (`1e-6`), not exact float
  equality, even though most generated values are integers.
- **IDs come from Drizzle.** `db_id` has a `$defaultFn(() => crypto.randomUUID())` and
  no SQL-level default, so inserts must go through Drizzle (or supply an `id`
  explicitly). Tests should read returned rows rather than assume IDs.

## Orchestration and environment gating

### SEED-001 · Dev seed runs every seed in dependency order and hits the target counts

- **Covers:** `main` — `src/db/seed/dev-seed/index.ts`; `seedConfigs` — `src/db/seed/seed.config.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a freshly migrated, empty database, frozen time, and a fixed faker seed
- **When** the dev seed entrypoint runs to completion
- **Then** it invokes seeds in this order: clear → roles → permissions → role-permissions →
  users → vendors → medicine categories → medicines → customers → purchases →
  vendor payments → sales → customer payments → purchase returns → expense categories →
  expenses → salaries → cash closings → stock movements
- **And** the resulting counts are: 4 roles, 91 permissions, 60 role-permission rows,
  50 users, 50 accounts, 50 user-role rows, 12 vendors, 10 medicine categories,
  28 medicines, 60 customers, 40 purchases, 40 purchase invoices, 80 expenses,
  8 expense categories, 30 cash closings, and between 80 and 240 purchase items
- **And** sales are at most 150, purchase returns at most 6, and
  `stock_movements = purchase_items + sale_items + purchase_return_items`
- **And** each user has exactly one credential account (`accountId = userId`,
  `providerId = "credential"`) and one `user_roles` row whose role matches `users.role`
- **And** every medicine resolves to one of the seeded categories and every foreign key
  resolves within the same run
- **Notes:** counts of vendor payments, customer payments, and salary payments are
  intentionally variable. The sales loop breaks early when no stocked batch remains,
  so 150 is the normal result, not a guarantee; assert the break condition instead of
  requiring exactly 150. Record call order by mocking the seed modules, or accept that
  a successful real-DB run proves the FK dependencies. The entrypoints self-execute, so
  see the Test environment note before attempting this case.

### SEED-002 · Production seed resets everything but only repopulates identity tables

- **Covers:** `main` — `src/db/seed/prod-seed/index.ts`; `clearAll` — `src/db/seed/clearAll.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a database containing users, vendors, purchases, sales, payments, and stock
- **When** the production seed entrypoint runs
- **Then** `roles`, `permissions`, and `role_permissions` contain 4, 91, and 60 rows
- **And** all other tables are empty, including `users`, `accounts`, `sessions`,
  `user_roles`, `vendors`, `customers`, `medicines`, `purchases`, `purchase_items`,
  `sales`, `sale_items`, `vendor_payments`, `customer_payments`, `salary_payments`,
  `expenses`, `cash_closings`, and `stock_movements`
- **Notes:** this is the intended bootstrap for a fresh production database, but it also
  means a production re-run deletes every user and all business history. Pair this case
  with SEED-004 before treating the behavior as safe.

### SEED-003 · `seedDbClient` maps environment variables to a local or remote proxy

- **Covers:** `seedDbClient` — `src/db/seed/seed-db.client.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `WRANGLER_CONFIG_PATH` is set and `getPlatformProxy` is mocked
- **When** `SEED_REMOTE` is `"true"`
- **Then** `getPlatformProxy` receives `environment: "production"`,
  `remoteBindings: true`, and `persist: false`
- **And** when `SEED_REMOTE` is `"false"` or unset, it receives `environment: undefined`,
  `remoteBindings: false`, and `persist: false` (no persist path) or
  `persist: { path }` when `WRANGLER_PERSIST_PATH` is set
- **And** the function returns a Drizzle client plus the proxy's `dispose`
- **And** when `WRANGLER_CONFIG_PATH` is missing it throws
  `WRANGLER_CONFIG_PATH must point to an app's wrangler config file`
- **Notes:** only the exact string `"true"` selects remote; `"TRUE"` and `"1"` silently
  select local. The function does not validate that the config exists or that its
  production D1 database id matches the intended target. Use `vi.stubEnv` +
  `vi.mock("wrangler")`; unstub in `afterEach`.

### SEED-004 · Remote seeding has no destructive-operation guard

- **Covers:** `src/db/seed/prod-seed/index.ts`, `src/db/seed/dev-seed/index.ts`,
  `src/db/seed/seed-db.client.ts`; scripts `db:seed:local` / `db:seed:remote` in `package.json`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** `prod-seed/index.ts` is invoked without `SEED_REMOTE=true` (or the dev
  entrypoint is invoked with it)
- **When** the entrypoint runs
- **Then** the current code targets whichever database the environment resolves to and
  still calls `clearAll` unconditionally
- **And** the desired contract is undecided: either refuse to run unless the entrypoint
  and `SEED_REMOTE` agree, or require an explicit reset/confirmation flag before
  deleting production data
- **Notes:** **decision required.** Current worst cases: `prod-seed` with a missing or
  mistyped `SEED_REMOTE` wipes the local database and leaves only identity rows;
  `prod-seed` with `SEED_REMOTE=true` deletes all production users and business data;
  `dev-seed` with `SEED_REMOTE=true` would additionally create 50 accounts that all
  share the password `12345678` (including the four fixed emails and a super admin) in
  production. Add the guard before any production run and test it here.

## Reset behavior

### SEED-005 · `clearAll` deletes children before parents under FK enforcement

- **Covers:** `clearAll` — `src/db/seed/clearAll.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** every one of the 30 schema tables contains at least one row, with
  `PRAGMA foreign_keys = ON`
- **When** `clearAll` runs
- **Then** it does not raise a foreign-key violation
- **And** every table reports zero rows afterward
- **And** `PRAGMA foreign_key_check` returns no rows
- **Notes:** assert against the full table list, not only the tables touched by the dev
  fixtures. This catches a newly added table that was not added to `clearAll`.
  Current order deletes `user_roles`/`role_permissions` first, auth/session tables next,
  then stock movements and payment/return/sale/purchase children, then parents, then
  users, roles, and permissions. `AddressTable` is deleted before `UserTable` but has no
  FK from users today.

### SEED-006 · `clearAll` is repeatable on an already-empty database

- **Covers:** `clearAll`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** `clearAll` has already run
- **When** it runs a second time
- **Then** it resolves without error and all tables still report zero rows
- **Notes:** also run the full dev seed twice and compare counts: the second run clears
  first, so the configured counts are restored (apart from the documented random
  early-break conditions), but the generated values and IDs differ (SEED-020).

### SEED-007 · A failed reset leaves partially deleted data because there is no transaction

- **Covers:** `clearAll`; `main` in both entrypoints
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a fully populated database and a database wrapper whose
  `delete(ExpenseTable)` rejects
- **When** `clearAll` runs
- **Then** the error propagates, but the twelve earlier deletes are already committed:
  `user_roles` through `salary_payments` are empty while `expense`, `cash_closings`,
  `sale_items`, `sales`, `purchases`, `medicines`, `users`, `roles`, and the remaining
  later tables still contain rows
- **And** `dispose()` still runs in the entrypoint's `finally`
- **Notes:** **decision required.** Wrap the reset in `db.batch`/a transaction, or
  document that a failed dev reset requires dropping and re-migrating the database.
  The same partial-state risk applies to a failure after a successful reset: the run
  leaves only the seeds that completed. The entrypoints log the error and exit `1`.

## Roles, permissions, and mappings

### SEED-008 · `seedRoles` inserts exactly the four system roles

- **Covers:** `seedRoles`, `rolesData`, `SYSTEM_ROLES` — `src/db/seed/roles.seed.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** an empty `roles` table
- **When** `seedRoles` runs
- **Then** it returns and persists four rows named `USER`, `EMPLOYEE`, `ADMIN`,
  `SUPER_ADMIN`, matching `RoleEnumSchema`
- **And** each name is unique, each row has a non-empty description, and each id is a UUID
- **And** `SYSTEM_ROLES` equals the same four names
- **Notes:** `role_name_unique` makes a second call fail without a reset. In
  `user.seed.ts` the objects carry a `roleId` field that is **not** a column on
  `users`; Drizzle's insert builder ignores unknown keys, so assert role linkage via
  the `user_roles` table, not `users.roleId`.

### SEED-009 · `seedPermission` inserts the complete 91-row permission catalog

- **Covers:** `seedPermission`, `permissionsData` — `src/db/seed/permission.seed.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** an empty `permissions` table
- **When** `seedPermission` runs
- **Then** it persists 91 rows: 5 with level `self` and 86 with level `system`
- **And** every `(level, resource, action)` tuple is unique and every value belongs to
  the corresponding zod enum
- **And** the system action sets are exactly:
  `user` and `role_permission` → create/read/list/update/delete/manage;
  `report` → read/list/export/manage;
  `purchase`, `purchase_return`, `medicine`, `vendor`, `vendor_payment`, `customer`,
  `customer_payment`, `sale`, `sale_return`, `salary` → create/read/list/update/delete/
  manage/export
- **And** the self rows are exactly `user:read`, `user:update`, `customer:read`,
  `customer:update`, `salary:read`
- **And** every row has a description and the returned array matches the table count
- **Notes:** `RESOURCE_TYPE` has 13 values and all are represented. The unique index
  `permission_level_resource_action_key` is the database-level guarantee. Counts are
  the early-warning signal for drift when a resource or action is added.

### SEED-010 · Identity seeds are not idempotent without `clearAll`

- **Covers:** `seedPermission`, `seedRolePermission`, `seedRoles`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** roles, permissions, and role-permission rows already exist
- **When** any of the three seed functions runs again without a reset
- **Then** the insert rejects with a unique-constraint error (role name, permission
  tuple, or role+permission pair respectively)
- **And** the existing row count is unchanged; no duplicate is created
- **Notes:** the full seed is only "idempotent" because `clearAll` runs first. Decide
  whether these seeds should upsert (`onConflictDoNothing` / `onConflictDoUpdate`) or
  keep failing fast. The same non-idempotency applies to categories, default user
  emails, purchase invoice numbers, and sale invoice numbers. Assert the rejection and
  that the message mentions `UNIQUE`; D1's exact error prefix may differ from SQLite's.

### SEED-011 · Role-permission mapping assigns the exact expected sets

- **Covers:** `seedRolePermission`, `rolesAndPermissionData` —
  `src/db/seed/rolePermission.seed.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** the four seeded roles and 91 permissions
- **When** `seedRolePermission` runs
- **Then** it creates 60 rows: `USER` 4, `EMPLOYEE` 20, `ADMIN` 17, `SUPER_ADMIN` 19
- **And** no `(roleId, permissionId)` pair is duplicated
- **And** every row joins to an existing role and permission
- **And** `SUPER_ADMIN` contains every `ADMIN` pair plus `system:user:manage` and
  `system:role_permission:manage`
- **And** `ADMIN` has no `user:create`, `user:delete`, or `role_permission:*` pair
- **And** `EMPLOYEE` has no delete/export or purchasing pair, and `USER` has only the
  four self user/customer read/update pairs
- **Notes:** assert exact tuple sets, not only counts. `rolesAndPermissionData` hardcodes
  role names as string literals; a typo is caught by the `RoleEnumType` annotation at
  compile time, but the runtime lookup uses `roles.find`. Mapping filters the supplied
  permission rows by tuple, so the result depends on both inputs.

### SEED-012 · A missing role or permission is silently skipped during mapping

- **Covers:** `seedRolePermission`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** the `EMPLOYEE` role is absent (or one mapped permission tuple is absent)
  while the other inputs are complete
- **When** `seedRolePermission` runs
- **Then** it resolves without error, returns fewer rows (40 when `EMPLOYEE` is
  missing; 59 when only a uniquely mapped tuple such as `system:sale:create` is
  missing), and only logs the reduced count
- **And** the caller cannot distinguish an intentional omission from a typo or a
  partially failed role/permission seed
- **Notes:** **decision required.** Prefer failing fast when a configured role or
  permission tuple is missing. If duplicate role names are supplied, `roles.find`
  silently uses the first match; cover that if custom roles become supported.

### SEED-013 · Chunked inserts preserve every row across the 100-parameter boundary

- **Covers:** `seedPermission`, `seedRolePermission`, `seedUsers` via
  `insertChunkedReturning`/`insertChunked` — `src/db/seed/seed-utils.ts` and
  `src/db/utils/chunk-by-params.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** 91 permission rows at 5 bound params each (455 total), 60 role-permission
  rows at 3 params each (180 total), and 50 user-role rows at 3 params each (150 total)
- **When** each seed runs against a real D1-compatible database with an execution spy
- **Then** permissions execute as eight inserts (currently 12/11/12/11/12/11/11/11 rows),
  each with at most 100 bound params
- **And** role permissions execute as two inserts of 30 rows (90 params each)
- **And** `user_roles` execute as two inserts of 25 rows (75 params each), not one
- **And** the returned arrays contain all 91, 60, and 50 distinct rows exactly once
  (compare as sets) while chunks execute in input order
- **Notes:** each `db_id` uses `$defaultFn(() => crypto.randomUUID())`, so Drizzle binds
  the generated id as a parameter even though the caller omits it; this is why a
  permission row costs 5 params (id + level + resource + action + description) and a
  join row costs 3 (id + two FKs). `createdAt`/`updatedAt` use SQL defaults and add no
  params. Count **executed statements**, not builder invocations; the recursive helper
  first builds oversized queries before splitting. `RETURNING` row order is not
  guaranteed by SQL semantics, so compare by id or tuple rather than array position. If
  columns are added, assert "≤100 params and no row loss" rather than exact chunk
  sizes. Cross-link the pure chunker cases in [db-utils.md](./db-utils.md)
  (DBU-001…DBU-022).

## Development fixtures

### SEED-014 · Seeded purchases satisfy invoice, amount, batch, and expiry invariants

- **Covers:** `seedPurchases`, `seedPurchaseReturns`, `updatePurchaseItemStock` —
  `src/db/seed/dev-seed/purchase.seed.ts`; `seedConfigs`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** seeded vendors, medicines, and users, with frozen time and a fixed faker seed
- **When** `seedPurchases` runs
- **Then** there are 40 purchases, 40 linked invoices, and 80–240 purchase items
- **And** invoice numbers are `0001`–`0040`, unique, with `isLinked = true` and
  `reservedBy = null`; every purchase has exactly one invoice
- **And** each purchase has 2–6 distinct medicines and
  `subtotal = Σ(qtyPurchased × costPerUnit)`,
  `discount ≤ floor(subtotal × 0.02)`, `totalAmount = subtotal − discount`, and
  `0 ≤ paidAmount ≤ totalAmount`
- **And** each item starts with `qtyRemaining = qtyPurchased`, `sellPerUnit > costPerUnit`,
  `expiryDate = createdAt + 365…1095 days`, and `createdAt` equal to its purchase's
  `createdAt` in the 90–180-days-ago window
- **And** `tabletsPerStrip`/`stripsPerBox` are set only for `tablet`/`capsule` batches
- **And** every `vendorInvoiceNo` matches `VINV-<year>-<counter>` or is `null`, and is
  unique per vendor
- **Notes:** `vendorInvoiceNo` is null about 15% of the time; SQLite unique indexes allow
  multiple nulls. Purchase returns later mutate `qtyRemaining`, so assert the initial
  value before returns or recompute from the ledger (SEED-017). Use epsilon for money.

### SEED-015 · Seeded sales satisfy walk-in payment, invoice, and line invariants

- **Covers:** `seedSales` — `src/db/seed/dev-seed/sale.seed.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** seeded customers, users, and purchased batches, with frozen time
- **When** `seedSales` runs
- **Then** it creates at most 150 sales; `invoiceNo` values are contiguous
  `SI-000001`, `SI-000002`, … with no gaps, and `createdAt` is non-decreasing
- **And** each sale has 1–4 lines using distinct batches; each line's `qty` is 1–10,
  does not exceed the batch's remaining stock, and
  `lineTotal = qty × unitPrice` with `unitPrice = batch.sellPerUnit` and
  `unitCost = batch.costPerUnit`
- **And** `subtotal = Σ lineTotal`, `discount ≤ floor(subtotal × 0.05)`, and
  `totalAmount = subtotal − discount`
- **And** a walk-in sale (`customerId = null`) has `paidAmount = totalAmount`; a
  customer sale has `0 ≤ paidAmount ≤ totalAmount`
- **And** every `customerId` and `createdBy` resolves
- **Notes:** the loop breaks entirely when no stocked batch remains, so fewer than 150
  sales is valid only when every `purchase_item.qtyRemaining` is `0` at that point;
  assert that condition. Sales run before purchase returns, so returned stock is not
  available to sales. Sale items' `createdAt` equals the sale's `createdAt`.

### SEED-016 · Vendor and customer payments reconcile to purchase and sale paid amounts

- **Covers:** `seedVendorPayments` — `src/db/seed/dev-seed/vendor.seed.ts`;
  `seedCustomerPayments` — `src/db/seed/dev-seed/customer.seed.ts`;
  `splitAmount` — `src/db/seed/seed-utils.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** seeded purchases, sales, vendors, customers, and users
- **When** both payment seeds run
- **Then** for every purchase with `paidAmount > 0`, the sum of its linked vendor
  payments equals `paidAmount` (epsilon), every payment amount is positive, and
  `vendorId` equals the purchase's vendor
- **And** for every customer-linked sale with `paidAmount > 0`, the sum of its linked
  customer payments equals `paidAmount` (epsilon), and `customerId` equals the sale's
  customer
- **And** walk-in sales have no linked customer payments
- **And** on-account rows have `purchaseId = null` / `saleId = null`, a valid parent,
  the documented note (`"On-account payment"` / `"Due collection"`), and amounts in
  1000–5000 / 500–3000 respectively
- **And** each payment's `createdAt` is not before its linked purchase/sale and not in
  the future
- **Notes:** `splitAmount` splits a paid amount into one or two positive rows, so linked
  sums must still equal the parent exactly. On-account due collections mean global
  customer-payment totals can exceed the sum of sale paid amounts; reconcile per
  parent, not globally. Purchases with `paidAmount = 0` produce no linked rows.

### SEED-017 · Stock movements reconcile with final purchase-item quantities

- **Covers:** `seedStockMovements` — `src/db/seed/dev-seed/stockMovement.seed.ts`;
  stock mutations in `purchase.seed.ts` and `sale.seed.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** seeded purchases, sales, and purchase returns
- **When** `seedStockMovements` runs
- **Then** there is exactly one `+qtyPurchased` row per purchase item, one `-qty` row
  per sale item (type `sale`), and one `-qty` row per purchase-return item
  (type `purchase_return`)
- **And** for every purchase item,
  `qtyPurchased + Σ(qtyChange) = qtyRemaining`, and
  `0 ≤ qtyRemaining ≤ qtyPurchased`
- **And** every `purchaseItemId` resolves; `refTable`/`refId` resolve to `purchases`,
  `sales`, or `purchase_returns` respectively
- **And** `createdBy` and `createdAt` equal the parent purchase/sale/return, and
  `reason` is populated only for return movements
- **And** no `adjustment`, `expired`, or `damaged` movements are seeded
- **Notes:** this is the strongest cheap integrity check: it catches a forgotten stock
  update, a double decrement, and an over-return. Returns are seeded after sales, so the
  final `qtyRemaining` reflects both. `sale_items.purchase_item_id` is `RESTRICT`, which
  keeps the ledger join valid.

### SEED-018 · Finance seeds respect staffing, amount ranges, and closing arithmetic

- **Covers:** `seedExpenseCategories`, `seedExpenses`, `seedSalaryPayments`,
  `seedCashClosings` — `src/db/seed/dev-seed/finance.seed.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** seeded users, with frozen time
- **When** the finance seeds run
- **Then** there are 8 expense categories and 80 expenses, each with a valid category,
  `100 ≤ amount ≤ 5000`, and a `createdAt` within the last 90 days
- **And** salary payments exist only for users whose role is not `USER`, with exactly
  three rows per such user at 30, 60, and 90 days ago and positive amounts in
  15000–40000
- **And** there are 30 cash closings, each with
  `expectedCash = openingCash + cashReceived − vendorPaid − totalExpenses − totalSalary`
  (`totalSalary = 0`), `countedCash = expectedCash + difference`,
  `−50 ≤ difference ≤ 50`, and `createdAt` 1–30 days ago
- **And** every closing has `periodStart < periodEnd`, the 30 periods are back-to-back
  and non-overlapping, and each period length is 1, 2, 7, or 30 days
- **Notes:** the number of salary rows is **not fixed** because random users receive
  random roles; assert "three per eligible user", not a total. Cash closings are
  synthetic aggregates: `totalSales`, `cashReceived`, `vendorPaid`, and
  `totalExpenses` do not reconcile with the seeded sales, payments, and expenses for
  the same period. **Decision required:** either derive closings from the transaction
  data or document them as unrelated demo numbers.

## Helpers and reproducibility

### SEED-019 · Date and amount helpers are deterministic and conservative

- **Covers:** `daysAgo`, `addDays`, `splitAmount` — `src/db/seed/seed-utils.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the system clock is frozen at a fixed instant and faker is seeded
- **When** `daysAgo(7)`, `addDays(date, 3)`, and `splitAmount(total)` are called
- **Then** `daysAgo(7)` is exactly `now − 7 × 86_400_000` ms and `addDays` adds exactly
  `days × 86_400_000` ms
- **And** for `total = 0` or `1`, `splitAmount` returns `[total]`
- **And** for every positive total, it returns one or two positive integers that sum
  exactly to `total`; when two are returned, both are less than `total`
- **Notes:** `splitAmount` branches on `faker.datatype.boolean(0.5)` and draws an int, so
  seed faker or spy on those methods to exercise both branches. It is currently only
  exercised indirectly through payments (SEED-016). Property-test values
  `0, 1, 2, 3, 1000`.

### SEED-020 · Seeded IDs and faker data are not reproducible across runs

- **Covers:** all seed files; `db_id` — `src/db/schemas/db-utils.ts`;
  entrypoints — `src/db/seed/dev-seed/index.ts`, `src/db/seed/prod-seed/index.ts`
- **Type:** integration · **Priority:** P2 · **Status:** Missing
- **Given** two freshly migrated databases seeded with the same `seedConfigs` and no
  explicit `faker.seed`
- **When** both dev seed runs complete
- **Then** every id is a UUID, but the two runs produce different ids and, with
  overwhelming probability, at least one faker-derived field (user name, vendor name,
  batch number, barcode) differs
- **And** the identity tables (roles, permissions, mappings, categories, medicines,
  users, vendors, customers, purchases, invoices, expenses, closings) have identical
  counts and identical role/permission tuples
- **And** purchase invoice numbers are the same set (`0001`–`0040`), while sale invoice
  numbers are contiguous from `SI-000001` within each run
- **And** every relationship still resolves inside its own run
- **Notes:** **decision required.** If reproducible fixtures are wanted for debugging or
  snapshots, add `faker.seed(...)` and deterministic UUIDs (for example, a fixed
  prefix plus row index) and document the reset requirement. Otherwise state explicitly
  that dev data is intentionally random. Counts of purchase items, sales, returns,
  payments, and salaries may vary between runs. `db_id` uses a Drizzle `$defaultFn` and
  has no SQL default, so raw SQL inserts must supply an id.
