# Medicine — Test Implementation

Scope: `src/features/medicine/**` — the medicine catalog API (list, search, create,
update), the medicine name resolver used by purchases, create/update schemas, type
labels, and the catalog table and dialogs.

There is no delete procedure. Deactivation (`isActive: false`) through `update` is the
only archive path exposed by this feature.

## Source map

| File                                                                          | Responsibility                                                                                     |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/features/medicine/api/medicine.contract.ts`                              | oRPC contract: list, listForSearch, create, update; pagination/search field allow-lists            |
| `src/features/medicine/api/medicine.procedure.ts`                             | Implementations, permission middleware, vendor/stock/price enrichment                              |
| `src/features/medicine/api/medicine.router.ts`                                | Mounts the four procedures under `medicine`                                                        |
| `src/features/medicine/api/medicine.api.hook.ts`                              | `useCreateMedicine` / `useUpdateMedicine` mutation hooks: toasts, cache invalidation, field errors |
| `src/features/medicine/medicine.schema.ts`                                    | `medicineCreateSchema`, partially applied `medicineUpdateSchema`                                   |
| `src/features/medicine/medicineResolver.ts`                                   | Normalizes names and resolves typed purchase items to existing or new medicines                    |
| `src/features/medicine/medicine.constants.ts`                                 | `MEDICINE_TYPE_OPTIONS`, `getMedicineTypeLabel`, `getMedicineTypeIcon`                             |
| `src/features/medicine/components/MedicineCreateDialog.tsx`                   | Create form, medicine search/prefill, validation feedback                                          |
| `src/features/medicine/components/MedicineUpdateDialog.tsx`                   | Edit form, active toggle, update submission                                                        |
| `src/features/medicine/components/MedicineSearchableField.tsx`                | Debounced medicine lookup and option rendering                                                     |
| `src/features/medicine/components/medicine-table/MedicineTable.tsx`           | Wires `DataTable` to medicine rows and query filters                                               |
| `src/features/medicine/components/medicine-table/MedicineManagementTable.tsx` | Route search state, list query, global search debounce, create gating                              |
| `src/features/medicine/components/medicine-table/MedicineTableRowAction.tsx`  | Update permission gate and update dialog trigger                                                   |
| `src/features/medicine/components/medicine-table/medicineTableColumn.tsx`     | Column definitions, badges, price/stock/provider formatting                                        |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 7      |
| Partial     | 1      |
| Missing     | 25     |
| **Total**   | **33** |

Existing test files:

- `src/features/medicine/medicineResolver.test.ts` — resolver cases for identity
  matching (name, generic name, strength), new-medicine creation, unresolved entries,
  and empty input. Verified on 2026-10-20 with
  `pnpm vitest run src/features/medicine/medicineResolver.test.ts`: **all passing**.

## Test environment

- Resolver, schemas, and constants are plain Vitest unit tests (jsdom project is fine).
- Procedure cases need a D1-compatible test database. No shared D1 test helper exists
  yet; the repo already depends on `@variablesoftware/mock-d1` and `@libsql/client`.
  Add a small helper under `test/` that creates the medicine, vendor, and purchase-item
  tables (the enrichment SQL reads `purchase_items.cost_per_unit`, `sell_per_unit`,
  `qty_remaining`, `created_at`, and `medicine_id`), then apply schema migrations.
- Invoke the procedures through `createRouterClient(medicineRouter, { context })` with a
  fake `ORPCContext`: `db`, `user`, `session`, `reqHeaders`, and both `roles` and
  `permissions` populated. `getRolePermissionData` only trusts the context when both
  arrays are non-empty; otherwise it queries the auth tables.
- For the unauthenticated case, mock `auth.api.getSession` (or `getAuthData`) to resolve
  `null`; do not rely on an absent cookie hitting a real auth backend.
- Freeze time for `createdAt` / `updatedAt`, and stub `crypto.randomUUID` when asserting
  generated IDs. Assert money with `toBeCloseTo`, never exact float equality.
- Component cases run in jsdom with `test/setup.ts`. Wrap in `QueryClientProvider`, and
  either wrap in `AuthStoreProvider` or mock `usePermissionCheck`. Mock
  `@/server/orpc` (`orpcTQClient.medicine.*`) and `react-hot-toast`; use fake timers for
  the 500 ms search debounce and the 300 ms input debounce.

## API contract and procedures

### MED-001 · List returns medicine rows with vendor, stock, and latest prices

- **Covers:** `listMedicineProcedure` — `src/features/medicine/api/medicine.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a vendor "Acme", a medicine with that vendor, and two purchase items for it
  (the later `createdAt` has different cost/sell prices), plus a medicine with no
  vendor and no purchases
- **When** `medicine.list` is called with `page: 1, limit: 20`
- **Then** the response has `success: true`, `message: "Medicines loaded successfully."`,
  `providerName` equal to the vendor name or `null`, `stockRemaining` equal to the sum of
  `qtyRemaining` (or `0`), and `costPrice` / `sellPrice` taken from the most recent
  purchase item (or `null`)
- **Notes:** use fixed timestamps to make "most recent" unambiguous; compare money with
  `toBeCloseTo`. The count query does not join vendors, so `meta.totalCount` is the
  medicine count, not a joined row count.

### MED-002 · Search matches the requested fields and normalizes the query

- **Covers:** `listMedicineProcedure`, `listMedicineContract` —
  `src/features/medicine/api/medicine.contract.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** "Napa Extra" (`genericName: "Paracetamol"`, barcode `"12345"`) and "Ace"
- **When** `medicine.list` is called with `search: "  NAP  "` and
  `searchFields: ["name", "genericName", "barcode"]`
- **Then** only "Napa Extra" is returned and `meta.totalCount` is `1`; searching
  `"para"` also matches via `genericName`, and `"234"` matches via `barcode`
- **Notes:** the contract trims and lowercases `search` before the handler. Search is
  applied only to the columns named in `searchFields`; omitting `searchFields` returns
  unfiltered rows. `barcode` is searchable but cannot be written through `create` or
  `update` (see MED-007), so barcode search can only be exercised with seeded rows.

### MED-003 · Pagination metadata reflects all matching rows on a partial page

- **Covers:** `listMedicineProcedure`, `buildPaginationMeta` —
  `src/features/medicine/api/medicine.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** 45 medicines and a request for `page: 3, limit: 20`
- **When** `medicine.list` is called
- **Then** `data` has 5 rows, `meta.totalCount` is `45`, `meta.queryCount` is `5`,
  `meta.pageCount` is `3`, `isFirstPage` is false, `isLastPage` is true,
  `previousPage` is `2`, and `nextPage` is `null`; omitting `page` and `limit` yields
  `currentPage: 1` and 20 rows
- **Notes:** current `buildPaginationMeta` derives `pageCount` from `queryCount` when the
  page is not full, so this assertion fails today (`ceil(5 / 20) = 1`). Fix the helper
  before implementing; cross-reference DBU-091 / DBU-092.

### MED-004 · Every medicine procedure enforces authentication and resource permission

- **Covers:** `listMedicineProcedure`, `listMedicineForSearchProcedure`,
  `createMedicineProcedure`, `updateMedicineProcedure` —
  `src/features/medicine/api/medicine.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** contexts with (a) no user/session, (b) a user with an unrelated permission,
  (c) a user with only `system:medicine:list`, and (d) a user with
  `system:medicine:manage`
- **When** each procedure is called with a valid input
- **Then** (a) returns `UNAUTHORIZED`, (b) returns `FORBIDDEN`, (c) can call `list` but
  not `create`/`update`, and (d) can call all four; `listForSearch` also accepts
  `system:purchase:manage`
- **Notes:** permissions are OR-ed. `authMiddleware` runs before the permission
  middleware, so unauthenticated calls never reach the handler. Keep `roles` and
  `permissions` non-empty in the fake context to avoid a database permission lookup.

### MED-005 · Invalid list inputs fail contract validation with field errors

- **Covers:** `medicineContract`, `listMedicineProcedure`,
  `listMedicineForSearchProcedure` — `src/features/medicine/api/medicine.contract.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** inputs with `page: 0`, `orderField: "price"`,
  `searchFields: ["vendorId"]` for `list`, and `filter.vendorId: "not-a-uuid"` or
  `searchFields: ["barcode"]` for `listForSearch`
- **When** the procedures are called
- **Then** each call rejects with `INPUT_VALIDATION_FAILED` (HTTP 422) and
  `data.fieldErrors` naming `page`, `orderField`, `searchFields`, or `filter`
- **Notes:** assert the error code and flattened field keys, not the prettified message.
  The allow-lists are: list search `name`, `genericName`, `barcode`; list order
  `createdAt`, `name`; search search `name`, `genericName`, `strength`; search order
  `name`.

### MED-006 · Search lookup returns only active medicines for the selected vendor

- **Covers:** `listMedicineForSearchProcedure` —
  `src/features/medicine/api/medicine.procedure.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** active "Napa" (vendor A), inactive "Ace" (vendor A), and active "Zinc"
  (vendor B)
- **When** `medicine.listForSearch` is called with `filter: { vendorId: A }`
- **Then** only "Napa" is returned, ordered by `name` ascending, and each row contains
  exactly `id`, `name`, `genericName`, `strength`, `type`, `baseUnit`
- **Notes:** the handler always adds `isActive = true`; there is no pagination metadata
  and no offset, so only `limit` affects the result. Inactive medicines remain visible in
  `medicine.list`, which is why deactivation is a soft archive.

### MED-007 · Create stores defaults and permits duplicate names

- **Covers:** `createMedicineProcedure` —
  `src/features/medicine/api/medicine.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a valid payload without `minimumStock`, `categoryId`, or `vendorId`, and an
  existing medicine named "Napa"
- **When** `medicine.create` is called for "Napa" and again for "napa" with different
  details
- **Then** each call returns `success: true`, `message: "Medicine created successfully."`,
  a UUID `id`, `minimumStock: 0`, `isActive: true`, and timestamps; both rows persist
- **Notes:** there is no unique index on `medicines.name`, and the procedure performs no
  duplicate check, so case-insensitive duplicates are currently allowed. Duplicate
  suppression exists only in `resolveMedicines` during purchases. `isActive` and
  `barcode` are absent from `medicineCreateSchema`, so barcode can never be set through
  the API. An unknown `vendorId` is not checked by the schema or handler; where the D1
  foreign key is enforced it surfaces as `INTERNAL_SERVER_ERROR`, not a validation error.

### MED-008 · Create rejects invalid catalog fields

- **Covers:** `createMedicineProcedure`, `medicineCreateSchema` —
  `src/features/medicine/medicine.schema.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** payloads with an empty name, a 151-character name, an empty base unit, a
  51-character base unit, `type: "syrup"`, `minimumStock: -1`, `minimumStock: 1.5`, or
  `categoryId: "x"`
- **When** `medicine.create` is called for each
- **Then** each rejects with `INPUT_VALIDATION_FAILED` and the matching field key; no
  medicine row is inserted
- **Notes:** optional string fields accept `""` and transform it to `undefined`. A
  whitespace-only `"   "` name currently passes because the schema does not trim; decide
  whether to reject it and add an assertion. `minimumStock` uses `z.coerce`, so numeric
  strings are accepted (see MED-018).

### MED-009 · Update changes supplied fields without disturbing the rest

- **Covers:** `updateMedicineProcedure` —
  `src/features/medicine/api/medicine.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** an active medicine with `minimumStock: 10`
- **When** `medicine.update` is called with
  `{ medicineId, name: "Napa Extra", minimumStock: 7 }`
- **Then** it returns `message: "Medicine updated successfully."`, the name and minimum
  stock change, `isActive` and all other columns are unchanged, and `updatedAt` advances
- **Notes:** supply `minimumStock` explicitly in this case to isolate normal update
  behavior from the defaulting defect in MED-010. Freeze the clock and advance it before
  the update to assert `updatedAt`.

### MED-010 · Omitting minimumStock on update must preserve the threshold

- **Covers:** `updateMedicineProcedure`, `medicineUpdateSchema` —
  `src/features/medicine/medicine.schema.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a medicine with `minimumStock: 10`
- **When** `medicine.update` is called with `{ medicineId, isActive: false }`
- **Then** `isActive` becomes false and `minimumStock` stays `10`
- **Notes:** this currently fails. `.partial()` does not remove the
  `.default(0)` on `minimumStock`, so every parsed update contains
  `minimumStock: 0` (verified with `medicineUpdateSchema.safeParse`). As a result the
  handler's `Object.keys(data).length === 0` early return is unreachable, and any update
  that omits the threshold silently resets it. Fix the schema or strip defaulted values
  in the procedure, then implement this case.

### MED-011 · Update returns NOT_FOUND for an unknown medicine

- **Covers:** `updateMedicineProcedure` —
  `src/features/medicine/api/medicine.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a well-formed UUID that does not exist
- **When** `medicine.update` is called with `{ medicineId, name: "Ghost" }`
- **Then** it rejects with `NOT_FOUND` and the message "Medicine not found."; no row is
  inserted or updated
- **Notes:** use a valid UUID so the contract passes and the handler's existence check is
  the failing layer. A malformed UUID instead yields `INPUT_VALIDATION_FAILED`.

### MED-012 · Clearing an optional field through update is undefined behavior

- **Covers:** `updateMedicineProcedure`, `medicineUpdateSchema`,
  `MedicineUpdateDialog` — `src/features/medicine/medicine.schema.ts`
- **Type:** integration · **Priority:** P2 · **Status:** Missing
- **Given** a medicine with `genericName: "Paracetamol"`, `strength: "500 mg"`, and
  `rackLocation: "A-1"`
- **When** `medicine.update` is called with `genericName: ""`, `strength: ""`, and
  `rackLocation: ""` (the values the dialog submits for cleared inputs)
- **Then** the documented behavior must be asserted: either the columns become `null`,
  or the request is rejected with a validation error
- **Notes:** current behavior keeps the old values (`emptyStrSchema` turns `""` into
  `undefined`, and Drizzle drops undefined columns from the update set) while still
  resetting `minimumStock` per MED-010. The update contract does not accept `null`, so
  users cannot clear these fields today. Decide the contract and add the assertion.

## Mutation hooks

### MED-013 · Mutation hooks report progress, invalidate the list, and surface field errors

- **Covers:** `useCreateMedicine`, `useUpdateMedicine` —
  `src/features/medicine/api/medicine.api.hook.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a `QueryClientProvider` and mocked `orpcTQClient.medicine.create/update`
  mutation options
- **When** a mutation starts, succeeds with `{ message }`, fails with a validation
  error, and fails with a general error
- **Then** `toast.loading` uses the stable `create_medicine_toast_message` /
  `update_medicine_toast_message` id and text "Creating..." / "Updating...", success
  shows the server message, `invalidateQueries` is called for
  `medicine.list.queryKey({ input: {} })` with `exact: false`, `onSuccess(message)` runs,
  validation errors call `onValidationErrors` with the formatted field list, and both
  error paths call `onError(message)` plus `toast.error`
- **Notes:** mock `react-hot-toast` and spy on `queryClient.invalidateQueries`. Assert the
  callback order only where the hook awaits invalidation before `onSuccess`.

## Name resolver

### MED-014 · Names are trimmed and lowercased before matching

- **Covers:** `getMedicineKey`, `resolveMedicines` —
  `src/features/medicine/medicineResolver.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** an existing medicine "Napa" with generic name "Paracetamol" and strength
  "500", and a purchase item `"  napa "` with generic name `" paracetamol "` and strength
  `"500 "`
- **When** the item is resolved
- **Then** it links to `med-1`; no medicine is created and no name is unresolved
- **Notes:** asserted in `medicineResolver.test.ts` ("links to an existing medicine when
  name, generic name and strength match ignoring case and surrounding spaces"). A medicine
  is identified by name, generic name and strength together (see MED-017, MED-027).

### MED-015 · Case-variant unmatched names collapse into one new medicine

- **Covers:** `resolveMedicines` —
  `src/features/medicine/medicineResolver.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** existing "Napa" and two items "Ace" and "ace", both with
  `medicineType: "tablet"` and `baseUnit: "tablet"`, and no generic name or strength
- **When** the items are resolved
- **Then** exactly one new medicine is returned with name "Ace", type "tablet", base
  unit "tablet", and a generated id; the identity key for "ace" maps to that id; no
  names are unresolved
- **Notes:** the test asserts `expect.any(String)` for the id, so it checks the shape
  only. Stub `crypto.randomUUID` if an exact id is needed.

### MED-016 · Incomplete unmatched entries are reported unresolved

- **Covers:** `resolveMedicines` —
  `src/features/medicine/medicineResolver.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Partial
- **Given** an unmatched item "Zinc" with a base unit but no medicine type, and another
  unmatched item with a type but a blank base unit
- **When** the items are resolved
- **Then** both trimmed original names appear in `unresolvedNames`, `newMedicines` is
  empty, and no id is mapped for them
- **Notes:** the existing test covers only the missing-type branch. Add the blank or
  whitespace-only `baseUnit` branch. Duplicate unresolved names collapse to one entry via
  the pending-name map.

### MED-017 · Same name with a different strength or generic name creates a separate medicine

- **Covers:** `resolveMedicines` —
  `src/features/medicine/medicineResolver.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** existing "Napa" with generic name "Paracetamol" and strength "500"
- **When** a purchase item "Napa" arrives with strength "650", or with generic name
  "Acetaminophen", each with `medicineType: "tablet"` and `baseUnit: "tablet"`
- **Then** each is created as a new medicine carrying its own generic name and strength;
  neither links to "Napa"
- **Notes:** asserted in `medicineResolver.test.ts` ("creates a new medicine when the
  strength differs…" and "…generic name differs…"). Without details, such an item is
  reported as unresolved.

## Schemas and validation

### MED-018 · Create schema applies defaults and blank-string transforms

- **Covers:** `medicineCreateSchema` —
  `src/features/medicine/medicine.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a valid payload with `genericName: ""`, `strength: ""`,
  `rackLocation: ""`, `minimumStock: "5"`, and no category/vendor
- **When** the schema parses it
- **Then** parsing succeeds, the three blank strings become `undefined`,
  `minimumStock` is the number `5`, and omitting `minimumStock` yields `0`
- **Notes:** this schema is shared by the form resolver and the API contract. `name` and
  `baseUnit` are not trimmed, so whitespace-only values pass the minimum length; decide
  whether to trim. `type` must be one of the seven values in `MEDICINE_TYPE_OPTIONS`.

### MED-019 · Update schema is partial and rejects invalid supplied fields

- **Covers:** `medicineUpdateSchema` —
  `src/features/medicine/medicine.schema.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{}`, `{ isActive: false }`, `{ name: "" }`, `{ type: "syrup" }`,
  `{ baseUnit: "" }`, and `{ isActive: "yes" }`
- **When** each is parsed
- **Then** `{}` and `{ isActive: false }` succeed, while the invalid name, type, base
  unit, and non-boolean active flag fail with the matching path
- **Notes:** `{}` parses to `{ minimumStock: 0 }` because of the retained default
  (MED-010). `categoryId` and `vendorId` accept only a UUID or omission; `null` is
  rejected even though the table allows null. The UI still marks name, type, and base
  unit as required, but the partial schema does not require them.

## UI components

### MED-020 · Table renders medicine details, price fallbacks, restock, and status

- **Covers:** `medicineTableColumn` —
  `src/features/medicine/components/medicine-table/medicineTableColumn.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a row with `stockRemaining: 3`, `minimumStock: 5`, `providerName: null`,
  `costPrice: null`, `sellPrice: 12.5`, `type: "tablet"`, and a second row with
  `stockRemaining: 5`, `minimumStock: 5`
- **When** `MedicineTable` renders
- **Then** the name shows "Paracetamol · 500 mg", type shows "Tablet", provider shows
  "Not provided", stock shows "3 tablet", cost shows "—", sell shows the formatted
  currency, and both rows show a "Restock" badge (the comparison is inclusive); an
  inactive row shows "Inactive"
- **Notes:** `stockRemaining <= minimumStock` means zero stock with a zero threshold is
  "Restock", not "In stock". Assert the currency through `formatCurrency` or a locale
  pattern. Also assert all `MEDICINE_TYPE_OPTIONS` labels and the
  `getMedicineTypeLabel` fallback for an unknown value.

### MED-021 · Management table drives the list query and renders query states

- **Covers:** `MedicineManagementTable` —
  `src/features/medicine/components/medicine-table/MedicineManagementTable.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** route filters `page: 2, limit: 10, search: "nap", order: "asc",
orderField: "name"` and `searchFields: ["name", "genericName", "barcode"]`
- **When** the table renders in loading, error, and empty-result states, and the user
  types in global search
- **Then** `medicine.list` receives those filters plus `searchFields`; loading shows the
  table/toolbar skeleton; error shows "Something Went Wrong" with the error message;
  empty data renders a table with "No results."; typing calls `setSearchFilter` only
  after the 500 ms debounce and resets the page
- **Notes:** the component passes `isEmpty={() => false}`, so `DataTableEmpty` is
  unreachable and the empty state is actually the table's "No results." row. Decide
  whether to use `data.data.length === 0` and assert the empty fallback. The refresh
  action is wired to `refetch`.

### MED-022 · The create affordance and dialog require medicine:create

- **Covers:** `MedicineManagementTable`, `MedicineCreateDialog` —
  `src/features/medicine/components/medicine-table/MedicineManagementTable.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** an auth store with only `system:medicine:list`, then with
  `system:medicine:create` or `system:medicine:manage`
- **When** the management table renders and the button is clicked
- **Then** without create permission there is no "Create medicine" button and no dialog
  mounted; with it the button opens a dialog titled "Create medicine" with Cancel and
  Create actions
- **Notes:** `manage` grants every action via `hasPermission`. The create dialog renders
  `VendorSelectorField` without `fetchApi`, so its vendor query is disabled
  (`enabled: fetchApi`, default false); verify whether that field is intentionally
  non-functional or pass `fetchApi`.

### MED-023 · Create form blocks invalid submission and maps server field errors

- **Covers:** `MedicineCreateDialog` —
  `src/features/medicine/components/MedicineCreateDialog.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** an open create dialog with empty name, type, and base unit
- **When** the user submits, and separately when the mutation reports validation field
  errors
- **Then** the client shows "Medicine name is required" and "Base unit is required", an
  error for the missing type, and does not call `mutate`; server field errors are applied
  inline through `form.setError` and remain visible
- **Notes:** the type error text comes from the Zod enum default, so assert presence
  rather than exact wording. The submit button is a `ButtonSpinner` tied to
  `isPending`; Cancel is disabled while pending. Blank optional strings are submitted as
  `""` and transformed by the schema.

### MED-024 · Selecting an existing medicine prefills the form, and success closes it

- **Covers:** `MedicineCreateDialog`, `MedicineSearchableField` —
  `src/features/medicine/components/MedicineCreateDialog.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a search result for "Napa" with generic name "Paracetamol", strength
  "500 mg", type "tablet", and base unit "tablet"
- **When** the user selects the option and submits a valid form, and the mutation
  succeeds
- **Then** generic name, strength, type, and base unit are prefilled; on success the
  dialog closes and the form resets to its defaults
- **Notes:** `SearchableInput` writes the option label into the name field, so the name
  becomes `"Napa - Paracetamol - 500 mg"` and is submitted that way. Treat this as a
  defect or define a separate display-label/raw-name mapping. The callback does not set
  `vendorId`.

### MED-025 · Row actions are permission-gated and open a prefilled update dialog

- **Covers:** `MedicineTableRowAction`, `MedicineUpdateDialog` —
  `src/features/medicine/components/medicine-table/MedicineTableRowAction.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a medicine row and an auth store without, then with,
  `system:medicine:update`
- **When** the row renders and the "Update" item is clicked
- **Then** without permission the action cell renders nothing; with permission a row
  menu contains "Update", which opens a dialog titled with the medicine name and fields
  prefilled from the row; submitting calls update with `medicineId` plus the form values,
  and success closes the dialog
- **Notes:** the dialog is mounted only while open, so defaults are read on each open.
  `isActive` is edited through a checkbox. Optional blanks are submitted as `""` and do
  not clear stored values (MED-012).

### MED-026 · Medicine search field queries only for non-blank input and formats options

- **Covers:** `MedicineSearchableField` —
  `src/features/medicine/components/MedicineSearchableField.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a form control for the medicine name with no search text, then with
  `"nap"` and a `vendorId`
- **When** the field renders, the user types, and an option is selected
- **Then** the query is disabled while the search is blank; after the 300 ms input
  debounce it requests `page: 1, limit: 5`, search fields `name`, `genericName`,
  `strength`, and `filter.vendorId`; options read
  `"Napa - Paracetamol - 500 mg"`; selecting one calls `onSelectMedicine` with the row
  and sets the field value
- **Notes:** `enabled` uses `Boolean(search?.trim())`, so whitespace does not query. The
  selected value is the joined label, not the raw medicine name (see MED-024). Clearing
  the input does not clear previously fetched options.

## Purchase identity resolution

### MED-027 · Blank generic name and strength match only blank values

- **Covers:** `getMedicineKey`, `resolveMedicines` —
  `src/features/medicine/medicineResolver.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** an existing "Zinc" with no generic name and no strength, and a purchase item
  "Zinc" with generic name `""` and no strength
- **When** the item is resolved
- **Then** it links to the existing medicine; no medicine is created
- **Notes:** asserted in `medicineResolver.test.ts` ("links blank generic name and
  strength to an existing medicine that has none"). The reverse case, a blank item against
  an existing medicine that has a strength, is covered by "does not link a medicine with a
  blank strength to one that has a strength".

### MED-028 · Purchase lookup only considers medicines of the purchase's vendor

- **Covers:** `createVendorPurchaseProcedure` lookup —
  `src/features/purchase/api/purchase.procedure.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** an existing active medicine "Napa" (generic "Paracetamol", strength "500")
  linked to vendor A, and a purchase from vendor B with the same name, generic name and
  strength plus a type and base unit
- **When** `purchase.create` is called for vendor B
- **Then** a new medicine is created for vendor B and the purchase item points to it; the
  existing vendor A medicine is unchanged
- **Notes:** needs the D1 harness described in the test environment section. The lookup
  filters on `vendorId`, so medicines with no vendor (created through the catalog without a
  vendor) are never matched by a purchase. Confirm that is intended.

### MED-029 · Purchase creates new medicines with generic name and strength

- **Covers:** `createVendorPurchaseProcedure` — `newMedicineRows`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a vendor and a purchase item "Napa" with generic name "Paracetamol", strength
  "500", type "tablet", and base unit "tablet", with no existing match
- **When** `purchase.create` is called
- **Then** the inserted medicine row has `genericName: "Paracetamol"`, `strength: "500"`,
  and `vendorId` equal to the purchase vendor; the purchase item references that row
- **Notes:** the resolver output is unit-tested (MED-017); this case checks the row written
  by the procedure. Needs the D1 harness.

### MED-030 · Every medicine type maps to its own icon

- **Covers:** `getMedicineTypeIcon` — `src/features/medicine/medicine.constants.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Implemented
- **Given** each value in `MEDICINE_TYPE_OPTIONS`
- **When** `getMedicineTypeIcon` is called with it
- **Then** every call returns a defined icon, and no two types share an icon
- **Notes:** asserted in `medicine.constants.test.ts`. The icon set is a product choice; the
  test does not pin which icon each type gets.

### MED-031 · Search option shows the icon for the medicine's type

- **Covers:** `MedicineSearchableField` `renderOption` —
  `src/features/medicine/components/MedicineSearchableField.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a search result for a `capsule` medicine and one for a `tablet` medicine
- **When** the options list is open
- **Then** each option renders the icon returned by `getMedicineTypeIcon` for its `type`
  and the name and generic/strength lines
- **Notes:** the icon is decorative (`aria-hidden`). Assert through the mapping (MED-030)
  or by mocking `getMedicineTypeIcon`; the rendered SVG itself is not asserted.

### MED-032 · A selected "name - genericName - strength" label resolves to the medicine's identity

- **Covers:** `getMedicineIdentity`, `getMedicineItemKey`, `resolveMedicines` —
  `src/features/medicine/medicineResolver.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** an existing "Napa" (generic "Paracetamol", strength "500") and a purchase item
  whose `medicineName` is the search label `"Napa - Paracetamol - 500"` with no explicit
  generic name or strength
- **When** the item is resolved
- **Then** it links to the existing medicine; no medicine is created and nothing is
  unresolved. For a new medicine ("Ace - Aceclofenac - 100" with type and base unit), the
  stored name is `"Ace"`, not the full label
- **Notes:** asserted in `medicineResolver.test.ts` (the two "label" cases). The purchase
  procedure uses the same identity for its lookup query and item matching, so the label
  must not reach the database as a name. The procedure path itself is covered by MED-028.

### MED-033 · Explicit fields override label segments; spaced separators only

- **Covers:** `getMedicineIdentity` — `src/features/medicine/medicineResolver.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** a label `"Napa - Paracetamol - 500"` with explicit strength `"650"`; a label
  `"Napa - 500"` with explicit strength `"500"`; and a name `"Co-amoxiclav"` with no spaces
  around the hyphen
- **When** the identity is derived
- **Then** the explicit strength `"650"` is used; the `"500"` segment is not read as a
  generic name (generic is `null`); and `"Co-amoxiclav"` stays intact as the name
- **Notes:** asserted in `medicineResolver.test.ts`. A label with no explicit fields is
  split positionally: the first remaining segment becomes the generic name, the second the
  strength. Direct API callers that send only a label with a single detail segment get that
  segment as the generic name, which is ambiguous and not tested.
