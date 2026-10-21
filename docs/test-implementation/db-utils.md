# Database Utilities — Test Implementation

Scope: `src/db/utils/**` — pagination query builders and D1 chunking helpers.

## Source map

| File                                                  | Responsibility                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/db/utils/chunk-by-params.ts`                     | Split inserts so each D1 statement stays under 100 bound params          |
| `src/db/utils/paginate-query/buildPaginateOptions.ts` | Compose `where`, `orderBy`, `limit`, `offset`, `page`                    |
| `src/db/utils/paginate-query/buildPaginationMeta.ts`  | Build page metadata from counts                                          |
| `src/db/utils/paginate-query/buildFilterWhere.ts`     | Equality, `IN`, and date-range filters                                   |
| `src/db/utils/paginate-query/buildSearchWhere.ts`     | `LIKE` search across one or more columns                                 |
| `src/db/utils/paginate-query/buildOrderBy.ts`         | `asc` / `desc` ordering with safe fallback                               |
| `src/db/utils/paginate-query/buildWhere.ts`           | Combine filter and search predicates with `AND`                          |
| `src/db/utils/paginate-query/utils.ts`                | Column resolution and date-range type guards                             |
| `src/db/utils/index.ts`                               | Barrel re-exports for the utils folder                                   |
| `src/db/utils/paginate-query/index.ts`                | Barrel re-exports for the pagination folder                              |
| `src/db/utils/paginate-query/types.ts`                | `TableColumns`, `FilterValue`, `PaginationMeta`, and option/result types |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 10     |
| Partial     | 1      |
| Missing     | 36     |
| **Total**   | **47** |

Existing test files:

- `src/db/utils/chunk-by-params.test.ts`
- `src/db/utils/paginate-query/buildPaginateOptions.test.ts`
- `src/db/utils/paginate-query/buildPaginationMeta.test.ts`

## Test environment

- Pure unit tests; no D1 binding is required for the query builders.
- Use `sqliteTable` fixtures (as in `buildPaginateOptions.test.ts`) to obtain real
  Drizzle columns, and inspect generated SQL with `query.toSQL()` where useful.
- Freeze time for any date-range assertions.

## Chunking

### DBU-001 · Empty input produces no chunks

- **Covers:** `chunkByParams` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** an empty row list
- **When** `chunkByParams([], 4)` runs
- **Then** it returns `[]`

### DBU-002 · Rows that fit stay in one chunk

- **Covers:** `chunkByParams`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** 10 rows and `paramsPerRow: 4` (40 params)
- **When** chunking runs
- **Then** one chunk containing all rows is returned

### DBU-003 · Rows split at the 100-parameter limit

- **Covers:** `chunkByParams`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** 105 rows and `paramsPerRow: 2`
- **When** chunking runs
- **Then** chunks have 50, 50, and 5 rows, and concatenating them preserves order

### DBU-004 · Chunk size never drops below one row

- **Covers:** `chunkByParams`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** `paramsPerRow` greater than 100
- **When** chunking three rows
- **Then** the result is `[[1], [2], [3]]`

### DBU-005 · Non-positive `paramsPerRow` is rejected or clamped

- **Covers:** `chunkByParams`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `paramsPerRow` is `0` or negative
- **When** chunking runs
- **Then** the function returns one chunk of all rows (or throws a documented error)
- **Notes:** current math produces `Infinity`; decide the contract and assert it.

### DBU-010 · `insertChunked` skips the query for empty input

- **Covers:** `insertChunked` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** an empty row list
- **When** `insertChunked` runs
- **Then** the insert builder is never called and nothing executes

### DBU-011 · `insertChunked` does not split when params fit

- **Covers:** `insertChunked`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** 20 rows at 4 params each (80 params)
- **When** `insertChunked` runs
- **Then** exactly one statement executes with all rows

### DBU-012 · `insertChunked` halves until every statement fits

- **Covers:** `insertChunked`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** 60 rows at 4 params each (240 params)
- **When** `insertChunked` runs
- **Then** four statements of 15 rows each execute in order

### DBU-013 · `insertChunked` attempts a single oversized row as-is

- **Covers:** `insertChunked`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** one row whose compiled query exceeds 100 params
- **When** `insertChunked` runs
- **Then** the row is sent once and the D1 error (if any) propagates
- **Notes:** mirror the `insertChunkedReturning` oversized-row case.

### DBU-014 · A failing chunk rejects the operation

- **Covers:** `insertChunked`, `insertChunkedReturning`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** the second chunk's query rejects
- **When** chunked insertion runs
- **Then** the promise rejects with that error and does not silently swallow it

### DBU-020 · `insertChunkedReturning` flattens results in order

- **Covers:** `insertChunkedReturning`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** 60 rows split across four statements
- **When** each chunk returns its rows
- **Then** the returned array equals the input order

### DBU-021 · `insertChunkedReturning` keeps one oversized row

- **Covers:** `insertChunkedReturning`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** one row that exceeds the param limit
- **When** the insert runs
- **Then** the row executes once and its result is returned

### DBU-022 · `insertChunkedReturning` returns an empty array for no rows

- **Covers:** `insertChunkedReturning`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** an empty row list
- **When** the insert runs
- **Then** it resolves to `[]` and never calls the builder

## Pagination composition

### DBU-030 · Defaults are page 1 and limit 20

- **Covers:** `buildPaginateOptions`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** options with no `page` or `limit`
- **When** options are built
- **Then** `page` is `1`, `limit` is `20`, and `offset` is `0`

### DBU-031 · Page and limit are clamped to at least 1

- **Covers:** `buildPaginateOptions`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `page: 0, limit: -5`
- **When** options are built
- **Then** both normalize to `1` and `offset` is `0`
- **Notes:** also cover numeric strings, since `Number()` coercion is used.

### DBU-032 · Offset follows `(page - 1) * limit`

- **Covers:** `buildPaginateOptions`
- **Type:** unit · **Priority:** P1 · **Status:** Partial
- **Given** `page: 1, limit: 10`
- **When** options are built
- **Then** `limit` is `10`, `offset` is `0`, and `page` is `1`
- **Notes:** the existing test only covers page 1. Add page 3 → offset 20.

### DBU-033 · Search and filter are combined with `AND`

- **Covers:** `buildPaginateOptions`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a search string and a filter object
- **When** options are built
- **Then** the `where` SQL contains both predicates joined by `AND`

### DBU-034 · Unknown filter/search/order fields are ignored

- **Covers:** `buildPaginateOptions`, `resolveColumns`, `getColumn`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** field names that are not columns on the table
- **When** options are built
- **Then** those names are skipped and no invalid SQL is produced

### DBU-035 · Valid order fields produce `ASC` / `DESC`

- **Covers:** `buildPaginateOptions`, `buildOrderBy`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `orderField: "createdAt"` with `order: "asc"` then `"desc"`
- **When** SQL is generated
- **Then** the matching column is ordered `ASC` then `DESC`

## Search builder

### DBU-040 · Missing or blank search yields no predicate

- **Covers:** `buildSearchWhere`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `search` is `undefined`, `null`, or `""`
- **When** the predicate is built
- **Then** it returns `undefined`

### DBU-041 · Search without fields yields no predicate

- **Covers:** `buildSearchWhere`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a search string and an empty field list
- **When** the predicate is built
- **Then** it returns `undefined`

### DBU-042 · One field uses a single `LIKE`

- **Covers:** `buildSearchWhere`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** one searchable column and `search: "nap"`
- **When** SQL is generated
- **Then** it is `column LIKE '%nap%'`

### DBU-043 · Multiple fields are combined with `OR`

- **Covers:** `buildSearchWhere`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `name` and `email` as search fields
- **When** SQL is generated
- **Then** both `LIKE` predicates appear joined by `OR`

### DBU-044 · Search wildcards are treated literally or escaped

- **Covers:** `buildSearchWhere`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `search` contains `%` or `_`
- **When** the predicate is built
- **Then** the documented behavior is asserted (currently unescaped)
- **Notes:** a bare `%` matches everything. Decide whether to escape with `ESCAPE` and
  cover it; flag as a security/correctness risk.

## Filter builder

### DBU-050 · Empty filter yields no predicate

- **Covers:** `buildFilterWhere`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `filter` is `undefined` or `{}`
- **When** the predicate is built
- **Then** it returns `undefined`

### DBU-051 · Primitive filters use equality

- **Covers:** `buildFilterWhere`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `{ role: "admin" }`
- **When** the predicate is built
- **Then** SQL is `role = 'admin'`

### DBU-052 · Array filters use `IN`

- **Covers:** `buildFilterWhere`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `{ status: ["active", "draft"] }`
- **When** the predicate is built
- **Then** SQL uses `IN ('active', 'draft')`

### DBU-053 · Empty arrays are a documented no-op

- **Covers:** `buildFilterWhere`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{ status: [] }`
- **When** the predicate is built
- **Then** no condition is added (current behavior)
- **Notes:** confirm this is intended versus "return no rows"; the code has a TODO comment.

### DBU-054 · Date-range filters use inclusive bounds

- **Covers:** `buildFilterWhere`, `isDateRangeFilter`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `{ createdAt: { from, to } }`
- **When** the predicate is built
- **Then** SQL uses `>= from` and `<= to`

### DBU-055 · One-sided date ranges work

- **Covers:** `buildFilterWhere`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** only `from` or only `to`
- **When** the predicate is built
- **Then** only the provided bound is applied

### DBU-056 · Unknown filter keys are skipped

- **Covers:** `buildFilterWhere`, `getColumn`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{ doesNotExist: "x" }`
- **When** the predicate is built
- **Then** it returns `undefined` without throwing

### DBU-057 · Multiple filters are combined with `AND`

- **Covers:** `buildFilterWhere`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** role and status filters
- **When** the predicate is built
- **Then** both appear joined by `AND`

## Ordering and combining

### DBU-060 · Missing field or direction falls back to `1`

- **Covers:** `buildOrderBy`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** no `orderField` or no `order`
- **When** ordering is built
- **Then** it returns the constant ``sql`1` ``

### DBU-061 · Unknown order field falls back to `1`

- **Covers:** `buildOrderBy`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** an unknown field name
- **When** ordering is built
- **Then** it returns the constant ``sql`1` ``

### DBU-062 · Ascending and descending map to `asc` / `desc`

- **Covers:** `buildOrderBy`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a valid field with each direction
- **When** ordering is built
- **Then** the generated SQL matches the requested direction

### DBU-070 · No predicates yields `undefined`

- **Covers:** `buildWhere`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** both inputs are `undefined`
- **When** combining
- **Then** it returns `undefined`

### DBU-071 · One predicate is passed through

- **Covers:** `buildWhere`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** only a filter or only a search predicate
- **When** combining
- **Then** that predicate is returned unchanged

### DBU-072 · Both predicates are combined with `AND`

- **Covers:** `buildWhere`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** both predicates
- **When** combining
- **Then** the result is `and(filter, search)`

## Type guards and column resolution

### DBU-080 · `isObject` rejects arrays and `null`

- **Covers:** `isObject`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** objects, arrays, `null`, and primitives
- **When** the guard runs
- **Then** only plain non-null objects return `true`

### DBU-081 · `isDateRangeFilter` validates shape and value types

- **Covers:** `isDateRangeFilter`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{ from, to }` combinations with dates, `null`, `undefined`, and strings
- **When** the guard runs
- **Then** only valid date/`null`/`undefined` ranges pass

### DBU-082 · `getColumn` resolves table objects and column maps

- **Covers:** `getColumn`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a Drizzle table object and a plain `{ field: column }` map
- **When** a field is looked up
- **Then** a real `SQLiteColumn` is returned; unknown names return `undefined`

### DBU-083 · `resolveColumns` drops empty and unknown fields

- **Covers:** `resolveColumns`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `null`, `[]`, known names, and unknown names
- **When** resolving
- **Then** it returns only real columns in input order

## Pagination metadata

### DBU-090 · First page metadata

- **Covers:** `buildPaginationMeta`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** `totalCount: 100, queryCount: 50, page: 1, perPage: 10`
- **When** metadata is built
- **Then** `isFirstPage` is true, `previousPage` is `null`, `nextPage` is `2`,
  `pageCount` is `5`

### DBU-091 · Middle page metadata

- **Covers:** `buildPaginationMeta`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** page 3 of 5
- **When** metadata is built
- **Then** `previousPage` is `2`, `nextPage` is `4`, and both flags are false

### DBU-092 · Last page metadata

- **Covers:** `buildPaginationMeta`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the final page
- **When** metadata is built
- **Then** `isLastPage` is true and `nextPage` is `null`

### DBU-093 · Empty result set has zero pages

- **Covers:** `buildPaginationMeta`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `queryCount: 0, totalCount: 0`
- **When** metadata is built
- **Then** `pageCount` is `0`, `isLastPage` is true, and next/previous are `null`

## Public exports

### DBU-100 · Barrel files expose the documented helpers and types

- **Covers:** `src/db/utils/index.ts`, `src/db/utils/paginate-query/index.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the two barrel modules
- **When** they are imported
- **Then** every public helper (`chunkByParams`, `insertChunked`,
  `insertChunkedReturning`, `buildPaginateOptions`, `buildPaginationMeta`,
  `buildFilterWhere`, `buildSearchWhere`, `buildOrderBy`, `buildWhere`) and the exported
  types are reachable, and no duplicate or broken export is introduced
