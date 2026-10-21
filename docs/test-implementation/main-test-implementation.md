# Test Implementation Specs

Living specification of every test the project should have, grouped by code area.

This folder is the **source of truth for test intent**. Test code lives next to the
source (`src/**/*.test.ts[x]`); this folder describes what that code must prove.

## Ownership and update rule

**AI agents must keep these documents current.** Whenever an agent creates, changes,
renames, or deletes application code, it must also:

1. Find the child document that owns the changed files (see [Document index](#document-index)).
2. Add, update, or remove the affected test cases in that document **in the same change**.
3. Re-check every `Status` value against the actual test files.
4. Update the document's coverage summary counts.
5. If the change introduces a new area with no owning document, create a child document,
   link it in the index, and note it in the change summary.

Developers may edit these documents too, but the agent is responsible for not letting
them drift from the code. A code change that silently leaves these docs stale is an
incomplete change.

## Global rules

- **Docs, not code.** Never put runnable test code here. Describe behavior, inputs,
  expected outcomes, and where the test belongs.
- **One owner per source file.** Every application source file maps to exactly one child
  document. If a file spans areas, assign it to the closest domain and cross-link.
- **Status must be evidence-based.** Mark a case `Implemented` only when a test exists
  and asserts the described outcome. A Storybook story is not a unit or integration test
  unless it contains play-function assertions.
- **Status vocabulary:** `Implemented` · `Partial` (test exists but misses cases/edges) ·
  `Missing` (no test) · `Obsolete` (behavior removed; ID stays reserved).
- **Priority vocabulary:** `P0` (data loss, auth, money, or core flow) · `P1` (main
  feature behavior) · `P2` (edge cases, UX polish).
- **Test type vocabulary:** `unit` · `integration` (handler + D1/Drizzle) · `component`
  (Testing Library) · `story` (Storybook play function) · `e2e` (route-level).
- **Do not delete a test case** because the code changed; mark it `Obsolete` and explain
  the replacement. Remove it only in a dedicated cleanup change.
- **Prefer behavior over implementation.** A test case should survive a refactor. Name
  the observable outcome, not the internal call sequence.
- **Cover the contract.** For oRPC procedures, test both the input/output contract and
  the procedure behavior (success, validation failure, auth failure, not-found).
- **Money is real.** Assert money values with explicit rounding/epsilons rather than
  exact floating-point equality.
- **Dates and IDs are injected.** Tests must not depend on the current clock or random
  IDs; inject them or freeze time.
- **Tests run with `pnpm test`.** Use `.test.ts` / `.test.tsx` next to the source.
  Component tests use jsdom + Testing Library; the setup file is `test/setup.ts`.

## Test case format

Each child document lists cases in this shape. Keep fields in this order.

```md
### AREA-001 · Short behavior-focused name

- **Covers:** `symbolName` — `src/path/to/file.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** some starting state
- **When** the behavior under test runs
- **Then** the observable outcome is asserted
- **Notes:** fixtures, mocks, or decisions still needed
```

ID prefixes are listed per document. IDs are stable: never renumber an existing case.

## When a test is implemented

1. Write the test next to the source.
2. Change the case's `Status` to `Implemented` (or `Partial` if some assertions remain).
3. Add the test file path to the case's `Covers` line or to the document's source map.
4. Update the document's summary counts.
5. If the implementation reveals a missing case, add it rather than widening an
   existing case.

## When code is deleted or replaced

- Mark affected cases `Obsolete`.
- Add replacement cases if behavior moved.
- Keep the ID reserved; do not reuse it.

## Document index

| Area                     | Document                                                 | Source scope                                                                                                          |
| ------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Auth feature             | [auth.md](./auth.md)                                     | `src/features/auth/**`                                                                                                |
| Cash closing             | [cash-closing.md](./cash-closing.md)                     | `src/features/cash-closing/**`                                                                                        |
| Customers                | [customers.md](./customers.md)                           | `src/features/customer/**`                                                                                            |
| Medicine                 | [medicine.md](./medicine.md)                             | `src/features/medicine/**`                                                                                            |
| Purchase                 | [purchase.md](./purchase.md)                             | `src/features/purchase/**`                                                                                            |
| Sales                    | [sales.md](./sales.md)                                   | `src/features/sale/**`                                                                                                |
| Roles                    | [role.md](./role.md)                                     | `src/features/role/**`                                                                                                |
| Users                    | [user.md](./user.md)                                     | `src/features/user/**`                                                                                                |
| Vendors and payments     | [vendors.md](./vendors.md)                               | `src/features/vendors/**`                                                                                             |
| Server and oRPC plumbing | [server.md](./server.md)                                 | `src/server/**`, `src/routes/api/**`                                                                                  |
| Routes and page shells   | [routes.md](./routes.md)                                 | `src/routes/**` except `src/routes/api/**`, `src/router.tsx`                                                          |
| Database utilities       | [db-utils.md](./db-utils.md)                             | `src/db/utils/**`                                                                                                     |
| Database infrastructure  | [db-infrastructure.md](./db-infrastructure.md)           | `src/db/clients/**`, `src/db/generators/**`, `src/db/sql-helpers.ts`                                                  |
| Shared library           | [lib.md](./lib.md)                                       | `src/lib/**`                                                                                                          |
| Zustand stores           | [stores.md](./stores.md)                                 | `src/stores/**`                                                                                                       |
| Shared utilities         | [utils.md](./utils.md)                                   | `src/utils/**`                                                                                                        |
| Hooks                    | [hooks.md](./hooks.md)                                   | `src/hooks/**`                                                                                                        |
| Constants and types      | [constants-types.md](./constants-types.md)               | `src/constants/**`, `src/types/**`                                                                                    |
| UI primitives            | [components-ui.md](./components-ui.md)                   | `src/components/ui/**`                                                                                                |
| Data table primitives    | [components-data-table.md](./components-data-table.md)   | `src/components/data-table/**`                                                                                        |
| Form field primitives    | [components-form-fields.md](./components-form-fields.md) | `src/components/form-fields/**`                                                                                       |
| Shared app components    | [components-shared.md](./components-shared.md)           | `src/components/shared/**`, `dev-panel/`, `providers/`, `time-range-filter/`, `tanstack-query/`, top-level components |
| Mail                     | [mail.md](./mail.md)                                     | `src/mail/**`                                                                                                         |
| Database seeds           | [db-seed.md](./db-seed.md)                               | `src/db/seed/**`                                                                                                      |

## Out of scope

- `src/db/schemas/**` — Drizzle table definitions, enums, and shared column helpers are
  excluded by project decision. Schema changes are still reviewed through the migration
  process in `AGENTS.md`.
- Generated files: `src/routeTree.gen.ts`, `worker-configuration.d.ts`, `graphify-out/**`.
- Third-party UI wrappers with no project-specific behavior beyond re-exporting a
  primitive. Group them under the closest component document and test only the
  project-specific wrappers.

## Maintenance checklist

Use this before finishing any code change:

- [ ] Owning document identified (or created and linked above)
- [ ] Added/updated/obsoleted cases for changed behavior
- [ ] `Status` values verified against real test files
- [ ] New test files recorded in the document's source map
- [ ] Summary counts updated
- [ ] `pnpm test`, `pnpm typecheck`, and `pnpm lint` run for code changes
