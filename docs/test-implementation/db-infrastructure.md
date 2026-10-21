# Database Infrastructure — Test Implementation

Scope: `src/db/clients/**`, `src/db/generators/**`, and `src/db/sql-helpers.ts` — the Drizzle
client factory, SQL expression helpers, and the export scripts.

## Source map

| File                                  | Responsibility                                                            |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `src/db/clients/drizzle-client.ts`    | `createDrizzleClient` binds a D1 database to Drizzle with the full schema |
| `src/db/sql-helpers.ts`               | `coalesce`, `jsonObject`, and `jsonGroupArray` SQL expression builders    |
| `src/db/generators/dbml-generator.ts` | Writes `schema.dbml` from the Drizzle schema at process start             |
| `src/db/generators/sql-generator.ts`  | Runs `drizzle-kit export` and writes `full-schema.sql`                    |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 18     |
| **Total**   | **18** |

## Test environment

- `createDrizzleClient` can be unit-tested with a fake `AnyD1Database` object; assert the
  returned object exposes Drizzle query builders rather than hitting a real D1 binding.
- A true round-trip needs `@libsql/client` + `drizzle-orm/libsql` or the project's
  `@variablesoftware/mock-d1` package. No shared harness exists yet.
- Both generators execute at import time and are not exported. Testing them requires a
  small refactor: export the functions, accept output paths, and move `main()` behind a
  guard such as `import.meta.main` / an explicit CLI entry.
- Mock `node:child_process`, `node:fs/promises`, and `node:path` for generator tests;
  never run real `drizzle-kit export` in unit tests.

## Drizzle client

### DBI-001 · Client factory binds the database and schema

- **Covers:** `createDrizzleClient` — `src/db/clients/drizzle-client.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a fake D1 database object
- **When** `createDrizzleClient(db)` is called
- **Then** it returns a Drizzle client whose `select`, `insert`, `update`, and `delete`
  builders are available for schema tables
- **Notes:** assert `drizzle` was called with `{ schema }` so relational queries work.

### DBI-002 · Queries route through the provided D1 binding

- **Covers:** `createDrizzleClient`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** two distinct in-memory D1 databases with the same schema
- **When** a row is inserted through a client created for database A
- **Then** it is visible in A and not in B
- **Notes:** proves the factory does not capture a module-level singleton.

### DBI-003 · D1 errors propagate to the caller

- **Covers:** `createDrizzleClient`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a fake binding whose query rejects with a D1 constraint error
- **When** the client executes a query
- **Then** the same error rejects and is not swallowed or rewritten

### DBI-004 · `DatabaseType` stays compatible with Drizzle D1

- **Covers:** `DatabaseType` — `src/db/clients/drizzle-client.ts`
- **Type:** unit (type-level) · **Priority:** P2 · **Status:** Missing
- **Given** a `DrizzleD1Database<typeof schema>` value
- **When** it is assigned to `DatabaseType` and vice versa
- **Then** the types are mutually assignable
- **Notes:** use `expectTypeOf`; this is a compile-time contract, not runtime behavior.

## SQL expression helpers

### DBI-030 · `coalesce` joins values with commas

- **Covers:** `coalesce` — `src/db/sql-helpers.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a list of columns and SQL expressions
- **When** `coalesce(values)` builds SQL
- **Then** it produces `COALESCE(value1, value2, ...)` with the values in input order

### DBI-031 · `coalesce` returns the first non-null value

- **Covers:** `coalesce`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** rows where the first column is `NULL` and the second has a value
- **When** the expression is selected
- **Then** the result equals the second column's value; when all are `NULL`, the result
  is `NULL`

### DBI-032 · `jsonObject` binds keys and keeps column order

- **Covers:** `jsonObject`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** `{ id: users.id, name: users.name }`
- **When** the expression is selected for one row
- **Then** SQLite returns `{"id": ..., "name": ...}` parsed to an object with the same key
  order
- **Notes:** keys must be bound parameters, not string-interpolated identifiers.

### DBI-033 · `jsonGroupArray` aggregates rows and filters all-null groups

- **Covers:** `jsonGroupArray`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a left join where a parent has two matching children, one parent has none,
  and a child column is `NULL`
- **When** the expression is grouped per parent
- **Then** matching parents get an array of objects, parents without matches get `[]`,
  and all-null join rows are excluded by the `FILTER` clause

### DBI-034 · `jsonGroupArray` defaults the filter column to the first column

- **Covers:** `jsonGroupArray`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** no explicit `filterColumn`
- **When** SQL is generated
- **Then** the `FILTER (WHERE ... IS NOT NULL)` clause references the first column in the
  object

### DBI-035 · `jsonGroupArray` parses TEXT and tolerates non-strings

- **Covers:** `jsonGroupArray`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the mapper receives a JSON string, `null`, or an already-parsed value
- **When** the column mapper runs
- **Then** strings are `JSON.parse`d and `null` becomes `[]`, while other values pass
  through unchanged

### DBI-036 · `jsonGroupArray` handles an empty column map

- **Covers:** `jsonObject`, `jsonGroupArray`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** an empty column object
- **When** SQL is built
- **Then** the documented behavior is asserted (currently produces an empty `json_object`
  and a filter with no column); decide whether to throw

## DBML generator

### DBI-010 · Generator writes `schema.dbml` to the working directory

- **Covers:** `src/db/generators/dbml-generator.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a mocked `drizzle-dbml-generator` and a temp working directory
- **When** the generator runs
- **Then** `sqliteGenerate` receives the full schema, `relational: true`, and
  `<cwd>/schema.dbml` as the output path

### DBI-011 · Generator failure exits non-zero

- **Covers:** `src/db/generators/dbml-generator.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `sqliteGenerate` throws
- **When** the script runs as a CLI
- **Then** the error is logged and the process exits with code `1`
- **Notes:** requires the export/guard refactor described above.

## SQL generator

### DBI-020 · Successful export writes stdout verbatim

- **Covers:** `exportDrizzleSQL` — `src/db/generators/sql-generator.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `execAsync` resolves with non-empty SQL and no stderr
- **When** the exporter runs
- **Then** it runs
  `pnpm drizzle-kit export --sql --config="./drizzle.config.ts"`, creates the output
  directory, and writes the SQL to `<cwd>/full-schema.sql` as UTF-8

### DBI-021 · Empty output is an error and writes nothing

- **Covers:** `exportDrizzleSQL`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `execAsync` resolves with `""` or whitespace only
- **When** the exporter runs
- **Then** it throws `No SQL output received from drizzle-kit export` and `writeFile`
  is not called

### DBI-022 · Warnings are tolerated, other stderr is logged

- **Covers:** `exportDrizzleSQL`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** stderr containing `warn` versus stderr without it
- **When** the export succeeds
- **Then** the warning case stays quiet and the other case logs a warning without
  failing the export

### DBI-023 · Exporter rethrows and the CLI exits non-zero

- **Covers:** `exportDrizzleSQL`, `main`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `execAsync` or `writeFile` rejects
- **When** the script runs
- **Then** the error is logged, rethrown from `exportDrizzleSQL`, and the CLI exits `1`

### DBI-024 · Success logs the output size

- **Covers:** `exportDrizzleSQL`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** SQL output of a known byte length
- **When** the export succeeds
- **Then** the log reports the size in KB with two decimals
