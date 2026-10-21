# React Hooks — Test Implementation

Scope: `src/hooks/**` — shared React hooks for refs, controllable state, debouncing,
viewport detection, permission checks, persisted storage, route search, range selection,
and TanStack Table state.

## Source map

| File                                        | Responsibility                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/hooks/use-as-ref.ts`                   | Stable ref synced to the latest committed props                                            |
| `src/hooks/use-callback-ref.ts`             | Stable callback wrapper that reads the latest callback                                     |
| `src/hooks/use-controllable-state.ts`       | Controlled/uncontrolled state with `onChange` and identity skip                            |
| `src/hooks/use-data-table.ts`               | Controlled pagination/sorting/filter state, 300 ms filter commit, visibility and selection |
| `src/hooks/use-debounced-callback.ts`       | Trailing debounce with latest-callback lookup and unmount cleanup                          |
| `src/hooks/use-isomorphic-layout-effect.ts` | `useLayoutEffect` in the browser, `useEffect` on the server                                |
| `src/hooks/use-mobile.ts`                   | 768 px viewport tracking through `matchMedia` plus `innerWidth`                            |
| `src/hooks/use-permission-check.ts`         | Auth-store permission check with OR semantics and `manage` expansion                       |
| `src/hooks/use-persist-storage.ts`          | Lazy local/session storage hydration, writes, and removal                                  |
| `src/hooks/use-query-search.ts`             | Route search filters, empty-value deletion, search/page reset                              |
| `src/hooks/use-range-selection.ts`          | Click-click period range selection, hover range, containment, clear                        |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 26     |
| **Total**   | **26** |

Existing test files: **none**. There are no `src/hooks/**/*.{test,spec}.{ts,tsx}`
files and no `*.stories.tsx` files for this folder, so every case below is `Missing`.

## Test environment and mocks

- **Runner:** Vitest jsdom project (`src/**/*.{test,spec}.{ts,tsx}`), Testing Library
  `renderHook`/`act`/`waitFor`, and `test/setup.ts` (`jest-dom`, `cleanup`). Run
  `pnpm test`.
- **Hooks:** use `renderHook` from `@testing-library/react`; capture `result.current`,
  rerender with new props, and assert values after `act`. These are hook-level component
  tests even when no DOM is rendered.
- **Timers:** debounce delays are 300 ms in `useDataTable` and 500 ms in feature callers.
  Install fake timers before invoking the debounced function, advance inside `act`, and
  restore real timers afterwards. `useIsMobile` schedules through `queueMicrotask`; flush
  microtasks with `await act(async () => {})`, or advance timers if the Vitest
  configuration fakes microtasks.
- **`matchMedia`:** jsdom does not implement `window.matchMedia`. Stub it with a captured
  listener and spyable `addEventListener`/`removeEventListener`. Make `window.innerWidth`
  writable per test (`Object.defineProperty` or `vi.stubGlobal`) and restore it.
- **Router:** `useQuerySearch` calls `getRouteApi(routeId)`, so it needs router context.
  Mock `getRouteApi` from `@tanstack/react-router` to return `useSearch` and
  `useNavigate` spies, or mount a memory router. Use a real route id literal so the
  generic constraint compiles. Assert the `search` updater by calling it with a previous
  object; actual URL serialization is the route schema's job (see
  [lib.md](./lib.md#route-search-schemas)).
- **Auth:** `usePermissionCheck` reads two selectors from the auth store. Prefer wrapping
  the hook in the real `AuthStoreProvider` with minimal `AuthUser`/`AuthSession` casts and
  canned `roles`, `permissions`, and `isAdminUser`. Mock `useAuthStore` only when the
  selector wiring itself is not under test. No network or D1 is needed.
- **Web Storage:** jsdom provides `localStorage` and `sessionStorage`; clear both between
  tests. Spy on `console.error` for corrupt JSON and quota failures, and spy on
  `Storage.prototype.setItem`/`removeItem` (or the `@/lib` wrappers) when asserting exact
  writes.
- **Data table:** build a real table through `useDataTable` with accessor columns, supply
  `pageCount`, and drive state through `table.setPageIndex`, `table.setPageSize`,
  `table.setSorting`, `table.setColumnFilters`, `table.toggleAllColumnsVisible`, and
  `table.toggleRowSelected`. Use a `setFilters` spy and `expect.objectContaining` for the
  partial filter object. No QueryClient, router, or backend is required. Remember
  `manualPagination`, `manualSorting`, and `manualFiltering` are always on.
- **Isomorphic effect:** environment selection is fixed at module evaluation. Test the
  server branch in a separate file with a `@vitest-environment node` docblock and a
  dynamic import after `vi.resetModules()`; do not try to remove jsdom's `window` in the
  same module graph.
- **Cleanup:** restore timers and globals, clear storage, and reset module mocks between
  cases so the module-level effect choice and media listeners do not leak.

## Adjacent ownership

- `hasPermission` internals and `manage` expansion are owned by [auth.md](./auth.md);
  HOOK-012–014 assert only the hook's observable outcome.
- The `@/lib/localStorage` and `@/lib/sessionStorage` wrappers are owned by
  [lib.md](./lib.md#browser-storage); HOOK-015–017 assert hook hydration and persistence.
- `querySearchSchema` parsing/serialization is owned by
  [lib.md](./lib.md#route-search-schemas); HOOK-018–019 assert only the hook's key
  deletion and navigation behavior.
- The auth store itself is owned by [stores.md](./stores.md); the hook tests its selectors.
- Table component behavior is owned by
  [components-data-table.md](./components-data-table.md); HOOK-022–026 assert the state
  hook those components consume.

## Refs and effects

### HOOK-001 · `useAsRef` returns one stable ref holding the latest committed props

- **Covers:** `useAsRef` — `src/hooks/use-as-ref.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a hook rendered with `{ value: 1 }` and a captured ref, then rerendered with
  `{ value: 2 }`
- **When** each render commits
- **Then** the same ref object is returned on both renders, `current` is `{ value: 1 }`
  initially and `{ value: 2 }` after the second commit
- **Notes:** the layout effect has no dependency array, so it writes after every commit.
  During render `current` still holds the previous props; assert after `act`, not
  mid-render. On the server the isomorphic effect runs as a passive effect.

### HOOK-002 · `useCallbackRef` keeps wrapper identity while invoking the latest callback

- **Covers:** `useCallbackRef` — `src/hooks/use-callback-ref.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a hook rendered with spy A, then rerendered with spy B; separately rendered
  with `undefined`
- **When** the returned wrapper is called before and after the rerender, and when the
  undefined case is called
- **Then** the wrapper is the same function instance across renders; it calls A before
  the callback swap commits and B afterwards; with `undefined` it is a no-op and does not
  throw
- **Notes:** `callbackRef` is updated by a passive effect with no dependency array, so a
  layout effect in the same commit still sees the previous callback. The empty-deps
  `useMemo` is what keeps consumer effect dependencies stable.

### HOOK-003 · `useIsomorphicLayoutEffect` selects layout effect in browser and effect on server

- **Covers:** `useIsomorphicLayoutEffect` — `src/hooks/use-isomorphic-layout-effect.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the module imported in the jsdom project where `window` exists, then imported
  again in a node-environment test file where `window` is undefined
- **When** the exported value is compared with React's `useLayoutEffect` and `useEffect`
- **Then** it is `useLayoutEffect` in the browser and `useEffect` on the server
- **Notes:** the choice is made once at module evaluation; it cannot switch at runtime.
  Use `vi.resetModules()` plus a dynamic import in a node-environment file. This is the
  basis for SSR/hydration-safe ref writes.

## Controllable state

### HOOK-004 · Uncontrolled controllable state updates and reports every new value

- **Covers:** `useControllableState` — `src/hooks/use-controllable-state.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** an instance with no `prop`, `defaultProp: 0`, and an `onChange` spy
- **When** `setValue(2)` runs, and after the commit `setValue(prev => prev + 3)` runs
- **Then** the value is `2` then `5`, and `onChange` receives `2` then `5` (never the
  updater function)
- **Notes:** the uncontrolled branch writes `valueRef` immediately, so same-tick
  functional updates compose. `defaultProp` initializes state once and is not a reset
  mechanism.

### HOOK-005 · Controlled state delegates to `onChange` and never changes itself

- **Covers:** `useControllableState`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `prop: 1` and an `onChange` spy whose parent does not update the prop
- **When** `setValue(5)` runs, then the parent rerenders with `prop: 2`
- **Then** the value remains `1` after the call, `onChange` receives `5`, and the value
  becomes `2` only when the prop changes
- **Notes:** controlled means `prop !== undefined`; ignoring `onChange` freezes the UI.
  Repeating `setValue(5)` while the prop stays `1` calls `onChange` every time because
  the cached value is still `1`.

### HOOK-006 · Switching controlled/uncontrolled follows the documented source

- **Covers:** `useControllableState`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** an uncontrolled instance changed from `1` to `2`, then rerendered with
  `prop: 10`, then rerendered again with no prop and `defaultProp: 99`
- **When** the value is read after each render
- **Then** it is `2`, then `10`, then back to `2`; the later `defaultProp` change does not
  reinitialize state
- **Notes:** **decision needed** — returning to the stale internal value is surprising;
  either pin it or deliberately reset the internal state on mode changes. A controlled
  `undefined` value is impossible because `undefined` is the uncontrolled sentinel.

### HOOK-007 · Equal values are skipped; batched functional updates differ by mode

- **Covers:** `useControllableState`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** uncontrolled and controlled instances, an update that returns the current
  value, and two functional increments invoked in one event handler
- **When** the updates run
- **Then** `Object.is`-equal updates produce no `onChange` and no render in both modes;
  uncontrolled composes `0→1→2` with `onChange(1)` then `onChange(2)`, while controlled
  computes both increments from the same committed prop and calls `onChange(1)` twice,
  leaving the rendered value at `0` until the parent updates it
- **Notes:** **decision needed** — should controlled mode optimistically advance
  `valueRef` like uncontrolled mode? The current asymmetry can drop increments inside one
  batched handler. Reproduce with a single handler, not two awaited `act` calls.

## Debounced callback

### HOOK-008 · Debounced callback runs once with the last arguments after the delay

- **Covers:** `useDebouncedCallback` — `src/hooks/use-debounced-callback.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a 500 ms debounce and calls with `"n"` at 0 ms, `"na"` at 100 ms, and
  `"nap"` at 200 ms
- **When** the clock advances to 699 ms, then to 700 ms
- **Then** the spy has not run at 699 ms and runs exactly once at 700 ms with `"nap"`
- **Notes:** trailing edge only; each call clears the previous timer, so there is no
  leading invocation. There is no flush or cancel API. `window.setTimeout` is captured
  at call time, so install fake timers before invoking.

### HOOK-009 · Debounce cancels on unmount, uses the latest callback, and keeps in-flight delay

- **Covers:** `useDebouncedCallback`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a pending call scheduled with delay 500 and callback A, then a rerender with
  callback B and delay 1000 before the timer fires; separately a pending call immediately
  before unmount
- **When** the pending timer elapses, and when the unmount case is allowed to elapse
- **Then** the in-flight call still fires at 500 ms and uses B; the unmounted call never
  runs
- **Notes:** **decision needed** — changing `delay` neither cancels nor reschedules an
  already scheduled timer; only the next call uses the new delay. Unmount cleanup clears
  only the last timer. The returned function identity changes when `delay` changes.
  Callback errors surface as unhandled async errors.

## Mobile viewport

### HOOK-010 · Mobile tracking follows `innerWidth` across 768 px and cleans up

- **Covers:** `useIsMobile` — `src/hooks/use-mobile.ts`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a `matchMedia` stub that captures the change listener and an initial
  `window.innerWidth` of 1024
- **When** the hook renders, microtasks flush, then `innerWidth` becomes 767 and the
  listener fires, then 768 and the listener fires, then the hook unmounts
- **Then** the first render returns `false` (state is still `undefined`), it remains
  `false` at 1024, becomes `true` at 767, returns `false` at 768, and unmount removes the
  listener
- **Notes:** `MOBILE_BREAKPOINT` is 768 and the query is `(max-width: 767px)`, but the
  change handler reads `window.innerWidth`, not `mql.matches`; if a stub makes them
  disagree, `innerWidth` wins. The queued microtask is not cancelled on unmount, so a
  late `setState` is possible. jsdom has no `matchMedia`; always stub it.

### HOOK-011 · Mobile hook is SSR-safe and starts desktop on the server

- **Covers:** `useIsMobile`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a component using `useIsMobile` rendered with `renderToString` in a node
  environment that has no `window` or `matchMedia`
- **When** the server render completes
- **Then** the output reflects `false`, no browser API is touched, and the first client
  render also starts `false` until the effect microtask runs
- **Notes:** the render-time value is always `false` because state starts `undefined`.
  This avoids hydration mismatch but flashes the desktop layout for one paint on mobile.
  The `matchMedia` work exists only in the client effect.

## Permission check

### HOOK-012 · Permission check allows a matching grant and expands `manage`

- **Covers:** `usePermissionCheck` — `src/hooks/use-permission-check.ts`; outcome of
  `hasPermission` — `src/features/auth/permission.ts`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** a signed-in user whose permissions contain only
  `{ level: "system", resource: "medicine", action: "manage" }`
- **When** the hook checks `system:medicine:create`, then an empty requirement list
- **Then** both return `true`, because `manage` expands to every action and an empty
  requirement list is allowed even with other grants absent
- **Notes:** requirements use OR semantics — any one match is enough. `manage` expands to
  all `ACTION_TYPE` values, including `manage` and `export`. Test through the provider so
  both store selectors are exercised; no network is involved.

### HOOK-013 · Permission check denies missing or differently scoped grants

- **Covers:** `usePermissionCheck`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** a grant of only `system:medicine:read`; separately a user with no permissions
- **When** the hook checks `system:medicine:update`, `system:vendor:read`, and
  `system:medicine:read` for the empty-grant user
- **Then** all three return `false`; level, resource, and action must all match
- **Notes:** resources match exactly; there is no wildcard resource. This is client-side
  gating only — server middleware remains authoritative. Assert boolean outcomes, not how
  the permission map is built.

### HOOK-014 · Self-level ownership is not evaluated; roles and admin flag are ignored

- **Covers:** `usePermissionCheck`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** (a) a `self:user:update` grant, the same required permission, and a target
  user id different from the signed-in id; (b) an ADMIN role with `isAdminUser: true` but
  no matching permission
- **When** the hook runs in each case
- **Then** (a) returns `true` because the hook passes only `userId` and no `resourceId`,
  so `hasPermission`'s ownership comparison never runs; (b) returns `false` because the
  hook never reads `roles` or `isAdminUser`
- **Notes:** **decision needed** — add a `resourceId`/target argument and pass it through,
  or document that a self permission grants every resource and ownership must be checked
  separately. Confirm that admins always receive explicit permissions from the server;
  otherwise admin-only actions disappear from the UI.

## Persisted storage

### HOOK-015 · Persisted state hydrates from storage with a fallback

- **Covers:** `usePersistStorage` — `src/hooks/use-persist-storage.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** localStorage contains `true` under `"dev_panel"`, no entry under
  `"missing"`, and `"{not json"` under `"broken"`
- **When** three instances mount with initial values `false`, `42`, and `false`
- **Then** they return `true`, `42`, and `false`; the corrupt entry logs a parse error and
  does not throw
- **Notes:** hydration happens lazily on the first render only, and the stored value wins
  even when its type differs from `initialData`. Absent and empty-string entries return
  `undefined`. On the server the localStorage wrapper catches the missing `window` and
  logs, so the initial value is used.

### HOOK-016 · Dispatch updates state and writes JSON; equal values write nothing

- **Covers:** `usePersistStorage`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `usePersistStorage("count", 0, "local")` with no stored entry
- **When** `dispatch(1)` runs, then after commit `dispatch(prev => prev + 1)`, then
  `dispatch(2)` and `dispatch(prev => prev)` while the value is already `2`
- **Then** the value is `1` then `2`; localStorage `"count"` is `"1"` then `"2"`; the
  equal actions cause no additional write
- **Notes:** functional actions receive the latest value through a ref, so same-tick
  functional updates compose. Writes use `JSON.stringify`; dispatching `undefined` writes
  the literal `"undefined"`, which fails to parse on rehydrate — **decision needed** if
  `T` can include `undefined`. A quota or serialization failure is logged and swallowed,
  leaving React state updated while storage is stale.

### HOOK-017 · Remove clears storage; key/type changes do not rehydrate

- **Covers:** `usePersistStorage`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** an instance that starts with `initialData: false`, rerenders with
  `initialData: true`, and has a stored value; then an instance whose `key` and `type`
  props change after a value was set
- **When** `remove()` runs, and when the next `dispatch` runs after the key/type change
- **Then** remove deletes the key, resets state to the latest committed `initialData`
  (`true`) without writing it back; after the key/type change the state is unchanged, the
  next write targets the new key/storage, and the new location is never read
- **Notes:** **decision needed** — remount or add a sync effect if key/type changes must
  rehydrate; today one key's value can be shown while being persisted under another.
  `remove()` intentionally leaves storage empty rather than storing the default. Session
  cases must assert `sessionStorage`, not `localStorage`.

## Query search

### HOOK-018 · `setFilters` deletes empty values and keeps falsy/non-empty ones

- **Covers:** `useQuerySearch` — `src/hooks/use-query-search.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** parsed route search
  `{ page: 2, limit: 20, search: "napa", order: "asc", orderField: "name", filter: { status: ["active"] }, keep: 0 }`
- **When** the hook's `setFilters` is called with
  `{ search: "", order: null, orderField: undefined, page: NaN, limit: 10, filter: {}, keep: 0, flag: false }`
  and the captured navigate updater is applied to the previous search
- **Then** the result is `{ limit: 10, filter: {}, keep: 0, flag: false }`; search, order,
  orderField, and page are deleted, all untouched keys are preserved, and 0, false, and
  empty containers are kept
- **Notes:** only `null`, `undefined`, `""`, and `NaN` delete. The hook never parses or
  serializes — it reads the router's already-parsed search object and lets the route
  schema encode the URL. It calls `navigate` with `replace: false`, so each update pushes
  history. The navigate mock should resolve; the hook fires it with `void`.

### HOOK-019 · `setSearchFilter` writes or removes search and always resets page

- **Covers:** `useQuerySearch`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** parsed route search
  `{ page: 3, limit: 20, search: "napa", order: "asc" }`
- **When** `setSearchFilter("ace")` runs, then `setSearchFilter(undefined)`, then
  `setSearchFilter("")`
- **Then** the first updater yields `{ limit: 20, order: "asc", search: "ace" }`; the
  second and third both delete `search` and `page`, yielding
  `{ limit: 20, order: "asc" }`; every call uses `replace: false`
- **Notes:** an empty string means removal, not a search for `""`. Page is deleted
  unconditionally, even when the search is unchanged; this is what returns pagination to
  page 1. Because every call pushes history, continuous typing through the feature-level
  debounce can create many entries — **decision needed** on `replace` for search updates.

## Range selection

### HOOK-020 · First and second clicks build an inclusive, order-independent range

- **Covers:** `useRangeSelection` — `src/hooks/use-range-selection.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** UTC period fixtures for January, February, and March 2026 with real start/end
  dates, `range: null`, and an `onChange` spy
- **When** a fresh instance calls `select(1)` then, after the anchor commit, `select(0)`;
  separately `select(0)` then `select(0)`
- **Then** the first call emits a single February range and sets `isSelecting`; the second
  emits January 1 through the end of February (indices normalized with `min`/`max`) and
  clears selecting; selecting the same index twice yields a single-period range
- **Notes:** boundaries are the lower period's `start` and the higher period's `end`, as
  ISO strings; assert UTC values with explicit date fixtures. `select(index)` on a missing
  period is a no-op. **Decision needed:** the anchor is an index that survives period-array
  replacement, so changing the year mid-selection completes against the _new_ year's
  periods; if cross-year ranges are intended, the anchor date must be stored as well.

### HOOK-021 · Hover range, containment, and clear reset selection state

- **Covers:** `useRangeSelection`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a range from February 1 through March 31 with January–April periods, then an
  active selection anchored at index 1
- **When** `isInRange` is checked for indices 0–3; `isInHoverRange` is checked before and
  after `setHoverIndex(3)`; then `clear()` runs
- **Then** `isInRange` is true only for February and March (periods fully inside the
  range) and false for January and April; hover is false before a hover and highlights
  only indices 1–3 while selecting; `clear()` calls `onChange(null)`, turns selecting off,
  and leaves no hover range
- **Notes:** containment requires both `period.start` and `period.end` inside the range,
  so a partially overlapping boundary period is excluded. `isInHoverRange` does not check
  that a period exists at the index. The first `select` does not reset hover; only
  completion or `clear()` does. Invalid range dates produce `false`, not an error.

## Data table state

### HOOK-022 · Pagination maps one-based filters to TanStack state and back

- **Covers:** `useDataTable` — `src/hooks/use-data-table.ts`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `filters: { page: 3, limit: 50 }`, `pageCount: 10`, and a `setFilters` spy
- **When** the hook renders; then `table.setPageIndex(0)` runs; then
  `table.setPageSize(25)` runs without the parent changing `filters`
- **Then** initial state is `{ pageIndex: 2, pageSize: 50 }`; the page-index change calls
  `setFilters({ page: 1, limit: 50 })`; the size change preserves the top row
  (`floor(50 * 2 / 25) = 4`) and calls `setFilters({ page: 5, limit: 25 })`
- **Notes:** defaults are page 1 and limit 20 when omitted. Only `{ page, limit }` is
  sent; other filter keys are not echoed. The hook does not clamp values. Manual
  pagination is always on, and `pageCount: -1` is the unknown-total sentinel. With a
  frozen `filters` prop the table state does not move even though the spy fires.

### HOOK-023 · Sorting maps to one order pair and clears explicitly

- **Covers:** `useDataTable`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `filters` with `orderField: "name"` and `order: "asc"`, then `"desc"`, then
  no order pair; separately a sort with two entries
- **When** `table.setSorting([{ id: "name", desc: true }])`, then `table.setSorting([])`,
  then `table.setSorting([{ id: "a", desc: false }, { id: "b", desc: true }])` run
- **Then** state is `[{ id: "name", desc: true }]`; clearing calls
  `setFilters({ orderField: undefined, order: undefined })`; the multi-sort uses only the
  first entry and calls `setFilters({ orderField: "a", order: "asc" })`
- **Notes:** sorting is derived, never stored locally; it is `[]` whenever either
  `orderField` or `order` is missing. Multi-column sorting silently loses every entry
  after the first. Sorting does not reset the page.

### HOOK-024 · Initial column filters mirror `filter` and do not follow later changes

- **Covers:** `useDataTable`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `filters.filter` is
  `{ status: ["active", "draft"], role: "ADMIN", empty: null }` with status and role
  columns enabled for filtering
- **When** the hook mounts, then the parent rerenders with
  `filter: { status: ["inactive"] }` (for example browser back/forward)
- **Then** initial `columnFilters` is
  `[{ id: "status", value: ["active", "draft"] }, { id: "role", value: ["ADMIN"] }]`
  (null skipped, scalar wrapped), and after the prop change it still contains the old
  entries
- **Notes:** **decision needed** — state is initialized once and never synced from
  `filter`, so back/forward can show stale filters and the next edit can re-commit stale
  values. Consider a keyed remount or a sync effect. Initial entries are not restricted to
  columns with `enableColumnFilter`.

### HOOK-025 · Filter edits commit after 300 ms, reset page, and send removals as null

- **Covers:** `useDataTable`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** filterable status and role columns, a non-filterable name column, an empty
  filter, fake timers, and a `setFilters` spy
- **When** `table.setColumnFilters` adds status, then 299 ms later adds role and name,
  then the debounce elapses; later status is removed
- **Then** local state contains all three entries, but `setFilters` fires once at 300 ms
  after the last edit with `{ page: 1, filter: { status: ["active"], role: [...] } }` and
  no name; the later removal re-sends the remaining role and adds `status: null` after
  another 300 ms
- **Notes:** uncommitted edits are lost on unmount because the timer is cancelled. In
  `enableAdvancedFilter` mode initial filters are `[]` and `onColumnFiltersChange` is a
  no-op. Only columns with `enableColumnFilter` reach the server, while removals of any
  previous filter (including initially supplied non-filterable ones) become null. The
  hook schedules inside a state updater, so StrictMode may invoke the updater more than
  once (the debounce still collapses it). Clearing every filter sends `filter: {}` rather
  than `undefined` — **decision needed**.

### HOOK-026 · Visibility and row selection stay local; filtering is opt-in

- **Covers:** `useDataTable`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a hideable `name` column, an `id` column, and columns with and without an
  explicit `enableColumnFilter`
- **When** name visibility is toggled off and a row is selected, then the table rerenders
  for a page/sort change, then the owner unmounts and remounts
- **Then** name stays hidden and the row stays selected across rerenders, and both reset
  after remount; a column without explicit `enableColumnFilter` is not filterable because
  `defaultColumn` sets it to false, while columns that set true remain filterable
- **Notes:** both states are plain `useState`; no local/session storage is involved. No
  prop currently seeds visibility: the hook passes an explicit `columnVisibility: {}` in
  `state`, which overrides `initialState` — **decision needed** if callers expect seeding.
  This complements DT-009 and DT-018 in
  [components-data-table.md](./components-data-table.md).
