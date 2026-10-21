# Data Table Components — Test Implementation

Scope: `src/components/data-table/**` — table shell, toolbar, column headers, filters,
pagination, view options, selection action bar, row menu, loading skeletons, and the
column-styling helper.

The components are presentational wrappers around an existing TanStack Table instance.
Most state is owned by `useDataTable` (`src/hooks/use-data-table.ts`, owned by the shared
library document) and passed down through `table`; only the search box, date filter,
faceted popover, slider display, and action-bar animation keep local state.

## Source map

| File                                                           | Responsibility                                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/components/data-table/data-table.tsx`                     | Renders header groups, body rows/cells, empty row, pagination, and selection-gated action bar |
| `src/components/data-table/data-table-toolbar.tsx`             | Toolbar shell: filters on the left; children + view options on the right                      |
| `src/components/data-table/data-table-column-header.tsx`       | Sort menu (asc/desc/reset), variant-specific labels, hide action, direction icon              |
| `src/components/data-table/data-table-pagination.tsx`          | Page-size select, selection summary, first/prev/next/last controls                            |
| `src/components/data-table/data-table-view-options.tsx`        | Hideable accessor-column list and visibility toggle                                           |
| `src/components/data-table/data-table-filter-view.tsx`         | Chooses inline filters (≤3 columns) or a filter dialog; reset button                          |
| `src/components/data-table/data-table-filter-items.tsx`        | Maps `ColumnMeta.variant` to text/number/slider/date/faceted controls                         |
| `src/components/data-table/data-table-faceted-filter.tsx`      | Single/multi select semantics written to column filter state                                  |
| `src/components/data-table/data-table-slider-filter.tsx`       | Range bounds/step derivation and range filter value mapping                                   |
| `src/components/data-table/data-table-date-filter.tsx`         | ISO date/range parsing plus apply/cancel/resync behavior                                      |
| `src/components/data-table/data-table-global-search.tsx`       | Local search input, reset, and refresh trigger (no internal debounce)                         |
| `src/components/data-table/data-table-row-menu.tsx`            | Icon dropdown wrapper for per-row actions                                                     |
| `src/components/data-table/data-table-action-bar.tsx`          | Portaled bulk-action toolbar, selection count, Escape-to-clear                                |
| `src/components/data-table/data-table-skeleton.tsx`            | Loading table shell with configurable rows and optional pagination                            |
| `src/components/data-table/data-table-toolbar-skeleton.tsx`    | Loading toolbar placeholders                                                                  |
| `src/components/data-table/data-table-pagination-skeleton.tsx` | Loading pagination placeholders                                                               |
| `src/components/data-table/data-table-empty.tsx`               | Static "No data" empty state                                                                  |
| `src/components/data-table/getColumnStyles.ts`                 | Sticky offsets, z-index/opacity, and pinned-edge border shadows                               |

Supporting files (not owned by this document):

- `src/hooks/use-data-table.ts` — controlled pagination/sorting/filter state; the 300 ms
  filter debounce and page reset live here.
- `src/types/data-table.ts` — `ColumnMeta`, `FilterVariant`, `Option`, `FiltersType`.
- `src/components/ui/{table,dropdown-menu,select,tooltip,popover,drawer,command,portal,empty,skeleton}.tsx`
  — primitives owned by [components-ui.md](./components-ui.md).

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 24     |
| **Total**   | **24** |

Existing test files: **none**. There are no `src/components/data-table/**/*.{test,spec}.{ts,tsx}`
files and no `*.stories.tsx` files for this folder, so every case below is `Missing`.

## Test environment

- **Runner:** Vitest jsdom project (the `jsdom` project in `vitest.config.ts`), Testing Library,
  `@testing-library/user-event`, `test/setup.ts` (`jest-dom`, `cleanup`). Run `pnpm test`.
- **No backend:** none of these components needs D1, oRPC, a router, or a QueryClient.
  Use `vi.fn()` for `setSearchValue`, `setFilters`, `refresh`, and row-action handlers.
- **Table fixture:** build a real table with `useReactTable` and the row models the
  component uses (`getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`,
  `getPaginationRowModel`, `getFacetedRowModel`, `getFacetedUniqueValues`,
  `getFacetedMinMaxValues`). For state-flow assertions, pass `state` plus
  `onPaginationChange`/`onSortingChange`/`onColumnFiltersChange` spies or a small
  stateful wrapper. For integration behavior, render `useDataTable` with controlled
  `filters`/`setFilters`.
- **`matchMedia`:** jsdom does not implement it, and `useIsMobile` calls it on mount.
  Stub `window.matchMedia` (returning `matches: false`, `addEventListener`,
  `removeEventListener`) and set `window.innerWidth = 1024` for Popover mode, `375`
  for Drawer mode. `useIsMobile` updates in a microtask, so await the re-render.
- **Base UI / cmdk:** stub `ResizeObserver`, `Element.prototype.scrollIntoView`, and
  (if pointer capture blocks clicks) `HTMLElement.prototype.setPointerCapture` /
  `releasePointerCapture`. Use `userEvent.setup({ pointerEventsCheck: 0 })` if a
  popover/menu trigger is inert because a portal set `pointer-events: none`.
- **Portals:** menus, tooltips, popovers, and the action bar render into `document.body`.
  Query with `screen`, not the render container. The action bar's `Portal` mounts after
  an effect/microtask; use `await screen.findByRole("toolbar")`.
- **Timers:** table filters commit after 300 ms (`useDataTable`,
  `SliderFilter`) and feature search consumers debounce 500 ms. Use fake timers and
  advance inside `act`; remember `RefreshButton` has a 2 s cooldown. React 19 +
  `userEvent` needs `advanceTimers` when fake timers are active.
- **Motion:** `DataTableActionBar` uses `motion/react` + `AnimatePresence`. jsdom does
  not run real animations; either mock `motion/react` with passthrough elements or
  assert presence with `waitFor` and never assert animation styles.
- **Dates/time zones:** `DateFilter` formats with `timezone` or defaults to
  `America/New_York`. Assert committed ISO strings, not rendered date labels; freeze
  time when selecting "today".
- **Known accessibility gaps:** the row-menu trigger and the refresh button are
  icon-only with no accessible name. Query them within their cell/container or add an
  `aria-label` before writing the test.

## Table shell, empty state, and loading

### DT-001 · Renders header and body cells from the table model

- **Covers:** `DataTable` — `src/components/data-table/data-table.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a table with columns `name` and `amount` and two data rows, where the header
  renders `<span>Name</span>` and cells render their values
- **When** `<DataTable table={table} />` renders
- **Then** one header row contains both header labels, the body has two rows, and each
  cell renders the `flexRender` output in visible-column order
- **Notes:** assert roles/text, not class names. Hidden columns must not produce body
  cells, but are still counted by the empty state (DT-002). `DataTable` opts out of the
  React Compiler with `"use no memo"`; that is irrelevant to behavior.

### DT-002 · Empty row model shows the built-in "No results." row

- **Covers:** `DataTable`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a table with three columns, one of them hidden, and no data rows
- **When** `DataTable` renders
- **Then** the body contains one row with one cell reading "No results.", whose
  `colSpan` equals `table.getAllColumns().length` (3), while only two headers are shown
- **Notes:** `colSpan` counts hidden columns, so it exceeds the visible column count;
  decide whether it should use `getVisibleLeafColumns().length` (tie to DT-009). This is
  a different empty state from `DataTableEmpty` (DT-004), which feature pages use as a
  query-state fallback.

### DT-003 · Shell composition, children, and `showPagination`

- **Covers:** `DataTable`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a table and a child toolbar, rendered first with defaults and then with
  `showPagination={false}`, `className="custom-table"`, and `data-testid="table-shell"`
- **When** both variants render
- **Then** children appear above the table, pagination appears below only in the default
  variant, and the wrapper carries `custom-table` plus the forwarded test id
- **Notes:** the action bar is rendered in a separate div and is **not** controlled by
  `showPagination`. Split this case if reviewers prefer one behavior per case.

### DT-004 · Static empty and skeleton shells expose their placeholders

- **Covers:** `DataTableEmpty`, `DataTableToolbarSkeleton`,
  `DataTablePaginationSkeleton`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** each component rendered alone; the toolbar skeleton receives a child
- **When** inspected
- **Then** the empty state shows "No data" and "No data found"; the toolbar skeleton has
  `role="toolbar"` and two `data-slot="button"` skeletons around the child; the
  pagination skeleton shows two select placeholders and five button placeholders
- **Notes:** plain skeletons render `data-slot="skeleton"`; `ButtonSkeleton` overrides
  it with `data-slot="button"`. Assert landmarks and counts, not Tailwind classes.
  These are static components with no props other than `className`/children.

### DT-005 · Loading table renders the requested row count and optional pagination

- **Covers:** `DataTableSkeleton`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** `rows={3}` with `pagination={false}`, then the defaults
- **When** rendered
- **Then** three body rows each contain a skeleton cell and there is one header
  skeleton; the default renders ten body rows and a pagination placeholder
- **Notes:** defaults are `rows=10`, `pagination=true`; the default page therefore has
  11 table skeletons plus 7 pagination skeletons. Assert row/placeholder landmarks
  rather than one global skeleton count. Children (typically the toolbar skeleton)
  render above the table.

## Sorting and column headers

### DT-006 · Text header sorts ascending/descending and offers reset

- **Covers:** `DataTableColumnHeader`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a sortable, hideable text column labeled "Name" with initial sorting `[]`
- **When** the header trigger is opened and "A - Z", then "Z - A", then "Reset" are
  chosen
- **Then** sorting becomes `[{id:"name", desc:false}]`, then `desc:true`; the matching
  checkbox item is checked and the direction icon changes; "Reset" appears only while a
  sort is active and `clearSorting` empties sorting
- **Notes:** use a real table and a stateful `onSortingChange` to observe state (the
  controlled pattern). `toggleSorting(false)` is idempotent when already ascending —
  Reset is the only clear path. Menu items close the menu after selection.

### DT-007 · Header variants change labels; hide-only and plain headers render correctly

- **Covers:** `DataTableColumnHeader`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** number/range and date/dateRange columns, a hide-only column
  (`enableSorting:false`), and a column with both sorting and hiding disabled
- **When** their header menus render
- **Then** number/range items read "0 - 1"/"1 - 0", date variants read "Oldest
  first"/"Newest first", hide-only still opens a menu with "Hide", and the fully
  disabled column renders only its label with no dropdown trigger
- **Notes:** "Hide" is checked when `!column.getIsVisible()` and appears whenever
  `getCanHide()` is true, independently of sorting. A date column in descending order
  uses `ArrowDown01`, not an alphabetic icon; assert labels/roles, not SVG internals.

## Column visibility and toolbar

### DT-008 · View options lists hideable accessor columns and toggles visibility

- **Covers:** `DataTableViewOptions`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** three columns: hideable accessor `name` with `meta.label: "Name"`, accessor
  `id` with `enableHiding:false`, and a display/selection column with no accessor
- **When** "View" is opened and "Name" is toggled off then on
- **Then** only "Name" is listed (text from `meta.label ?? id`), its checkbox reflects
  `getIsVisible()`, and the header/body cells disappear then reappear
- **Notes:** the trigger is `role="combobox"` with `aria-label="Toggle columns"`; it is
  `hidden lg:inline-flex`, but jsdom does not apply Tailwind, so it remains queryable.
  Assert visibility through the table state or header count, not CSS.

### DT-009 · Column visibility survives re-renders but not remounts

- **Covers:** `DataTableViewOptions` with `useDataTable` state
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a hideable column hidden through the view options
- **When** the same table instance re-renders for a sort/filter/page change, and then
  the owning component is unmounted and remounted
- **Then** the column stays hidden across re-renders and is visible again after the
  remount, because visibility lives in `useState` in `useDataTable` and no local/session
  storage is involved
- **Notes:** **decision needed** — "persistence" currently means only in-memory state.
  If visibility must survive reloads, add `usePersistStorage` (or table `initialState`)
  and update this case; if not, codify the reset. Also re-check the empty-state
  `colSpan` behavior in DT-002.

### DT-010 · Toolbar composes filters/actions/view options and gates filter reset

- **Covers:** `DataTableToolbar`, `DataTableFilterView`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a table with two filterable columns and one active column filter, plus a
  child action button
- **When** the toolbar renders, then the active filter is reset
- **Then** the `role="toolbar"` region contains filter controls on the left and the
  child plus "View" on the right; controls render inline for ≤3 filterable columns and
  move into a "Filters" dialog for 4+; "Reset filters" (aria-label) exists only while
  `columnFilters.length > 0` and clears them
- **Notes:** `resetColumnFilters` is converted by `useDataTable` into
  `setFilters({page:1, filter:{...}})` after a 300 ms debounce, so the reset also
  returns to page 1. Filterable hidden columns still render a control. The dialog body
  uses the same `DataTableFilterItems`, so filter tests can target either surface.

## Global search

### DT-011 · Search input updates on every keystroke; debounce is the caller's job

- **Covers:** `DataTableGlobalSearch`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** an empty search value and a bare `setSearchValue` spy; separately, the
  feature wiring where a parent wraps that callback in a 500 ms debounce
- **When** the user types "napa"
- **Then** the input shows "napa" immediately; with the bare spy the prop is called once
  per keystroke (four calls) and this component schedules no timer; with the parent
  debounce only the last value reaches the route after 500 ms; the Reset button becomes
  visible
- **Notes:** there is **no internal debounce** here — the 500 ms delay is owned by
  `MedicineManagementTable`, `PaymentManagementTable`, and peers (feature documents).
  The refresh `Button` is icon-only with no accessible name today; query it
  structurally or add an `aria-label`. The initial `searchValue` populates the input
  once at mount.

### DT-012 · Reset clears the box and parent value; external prop changes do not sync

- **Covers:** `DataTableGlobalSearch`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** an input containing "napa", then separately a `searchValue` prop changed
  externally to "ace" (for example, browser back/forward)
- **When** Reset is clicked, and then when the prop changes
- **Then** Reset calls `setSearchValue(undefined)`, empties the input, and removes the
  Reset button; a prop change after mount does **not** change the input or the button
- **Notes:** `inputValue` is local state with no effect syncing `searchValue`; reset
  sends `undefined`, not `""`. **Decision needed:** should route-driven search changes
  sync into the box? If yes, add the effect and split the external-sync assertion into
  its own case.

## Filters

### DT-013 · Text/number filter items write raw values; unsupported variants render nothing

- **Covers:** `DataTableFilterItems`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** columns with `meta.variant` of `text`, `number` (with `unit: "%"`), and
  `boolean`; plus a column with no variant
- **When** the text and number inputs are edited
- **Then** text renders an input with `id=column.id` and placeholder
  `meta.placeholder ?? meta.label ?? column.id`, dispatching the raw string via
  `setFilterValue`; number renders a numeric input plus the unit addon; boolean and
  no-variant columns render nothing
- **Notes:** values are not coerced to numbers. If the existing filter value is an
  array (as `useDataTable` builds), the input receives its comma-joined string. The
  `FilterVariant` union includes `boolean` (and `DataTableFilterView` still counts it
  as filterable), but there is no renderer — **decision needed**: implement a boolean
  control or remove the variant so it does not leave a blank filter slot.

### DT-014 · Faceted filter handles single and multi selection plus clear

- **Covers:** `DataTableFacetedFilter` (with `FacetedFilter`)
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a column with options `Active`/`Inactive` and no filter value
- **When** an option is chosen in single mode; then two options in multi mode; then
  "Clear filter" or re-clicking the last selected option
- **Then** single mode sets `["active"]`, closes the popover, and selecting the active
  option again sets `undefined`; multi mode accumulates values, removes a value on
  re-click, and sets `undefined` when the set becomes empty; "Clear filter" resets
- **Notes:** selected values are derived only when `getFilterValue()` is an array; a
  scalar value is ignored. `FacetedFilter` renders a Popover on desktop and a Drawer on
  mobile, chosen by `useIsMobile` — stub `matchMedia` and set `innerWidth`. The cmdk
  search input appears only in multi mode; options carry optional counts but counts are
  supplied by the column definition, not computed here.

### DT-015 · Slider filter derives bounds/step and commits/clamps ranges

- **Covers:** `DataTableSliderFilter` (with `SliderFilter`)
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a range column with `meta.range: [0, 100]` and no filter value
- **When** the slider or the from/to number inputs are changed, then "Clear filter" is
  clicked
- **Then** bounds are 0–100 with step 5 (`ceil(span/20)`); when a value is present the
  trigger shows `"0 - 100"`; `setFilterValue` receives `[start, end]` after the 300 ms
  debounce; inputs clamp to the opposite bound; and Clear sends `undefined` immediately
- **Notes:** without `meta.range` bounds come from `getFacetedMinMaxValues()`. Step is
  1 for span ≤20, `ceil(span/20)` for span ≤100, and `ceil(span/50)` above; invalid or
  inverted ranges force `max=min+1`. `column` is optional in the props but dereferenced
  in `computeBounds` (throws if both `column` and `range` are missing). The value memo
  depends only on `[column]`, so an external filter-value change may not refresh the
  trigger — **decision needed**: fix the dependencies or pin the current behavior.

### DT-016 · Date filter applies ISO values, discards on cancel, and re-syncs externally

- **Covers:** `DataTableDateFilter`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a date column with no filter value; later an external value
  `["2026-01-01T00:00:00.000Z", "2026-01-31T00:00:00.000Z"]`
- **When** a single day is picked; then a range is applied; then Cancel is clicked; then
  the external value changes
- **Then** single mode commits one ISO string and closes; range mode commits
  `[fromISO, toISO]` and allows a one-sided range as `[fromISO, undefined]` or
  `[undefined, toISO]`; Cancel commits `undefined`; external values repopulate the
  internal date state in a microtask
- **Notes:** only strings matching
  `^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$` parse;
  `Date` objects, malformed strings, and non-string array entries are ignored. The
  calendar defaults to `America/New_York` for display; assert committed ISO values,
  not labels. Cancel discarding an already-applied filter is surprising — **decision
  needed** on whether it should revert instead.

## Pagination

### DT-017 · Navigation moves pages and disables edges

- **Covers:** `DataTablePagination`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a table with `pageCount: 3` at `pageIndex: 1` (page 2); then tables at
  index 0 and index 2
- **When** first, previous, next, and last are clicked
- **Then** the label reads "Page 2 of 3"; the controls target index 0/0/2/2; at index 0
  first and previous are disabled, and at index 2 next and last are disabled
- **Notes:** pagination is fully controlled by TanStack state — with a frozen
  `pageIndex` the label does not move even though the handler fires, so assert state
  callbacks as well as text. `getCanNextPage` is false for `pageCount=0` but true for
  the unknown sentinel `pageCount=-1`, where the label would show "Page 1 of -1".
  First/last buttons are CSS-hidden below `lg` yet remain in the jsdom tree.

### DT-018 · Page-size change preserves the top row and recomputes the page

- **Covers:** `DataTablePagination` with `useDataTable`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a controlled table at `pageIndex: 2`, `pageSize: 10`, using options
  10/20/30/40/50
- **When** 20 is chosen in the page-size select
- **Then** applying the updater passed to `onPaginationChange` yields
  `{pageIndex: floor(10 * 2 / 20) = 1, pageSize: 20}` (top row preserved, so the UI
  moves to page 2) and `useDataTable` calls `setFilters({page: 2, limit: 20})`;
  selecting the current size leaves pagination state unchanged (the callback may
  still fire)
- **Notes:** TanStack `setPageSize` does **not** reset to page 1; it preserves the
  first visible row. The component has no local state. If the current page size is not
  present in `pageSizeOptions`, the select has no matching item — verify the intended
  fallback. Row selection is unaffected by resizing.

### DT-019 · Selection summary and zero-page edge

- **Covers:** `DataTablePagination`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** 20 filtered rows on the current page with 0, 1, and 2 selected; separately
  a table with `pageCount: 0`
- **When** pagination renders
- **Then** it reads "0 of 20 row selected.", "1 of 20 row selected.", "2 of 20 rows
  selected."; with zero pages it reads "Page 1 of 0" and all four navigation controls
  are disabled
- **Notes:** the total is `getFilteredRowModel().rows.length` (the rows passed for this
  page), not server `meta.totalCount`, so "of 20" can be mistaken for the total. Plural
  only applies above one, making zero read "row". **Decision needed:** use the total
  count and/or pluralize zero.

## Selection and bulk action bar

### DT-020 · Selected rows are marked and the table action bar is selection-gated

- **Covers:** `DataTable` — `actionBar` prop
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a table with row selection enabled, a checkbox column, and
  `actionBar={<div>Bulk actions</div>}`
- **When** one row is selected, then all rows are deselected, then the selected row is
  filtered out of the filtered row model
- **Then** the selected `<tr>` has `data-state="selected"` (unselected rows have
  `data-state="false"`), and "Bulk actions" exists only while
  `getFilteredSelectedRowModel().rows.length > 0`
- **Notes:** `DataTable` itself renders no checkboxes; feature column definitions must
  supply them. The selection gate ignores rows filtered out of the current model; use
  a client-side filtering fixture to exercise that branch. No current feature enables
  row selection or passes `actionBar`, so this API is only exercised by tests/stories
  until a consumer arrives.

### DT-021 · Action bar shows the count and clears selection by button or Escape

- **Covers:** `DataTableActionBar`, `DataTableActionBarSelection`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a table with two selected rows rendered inside `DataTableActionBar` with
  `DataTableActionBarSelection`
- **When** it renders, its clear button is clicked, then Escape is pressed after
  re-selecting rows
- **Then** a portaled `role="toolbar"` shows "2 selected"; the clear button calls
  `toggleAllRowsSelected(false)`; Escape clears all selection and the bar disappears
- **Notes:** the window keydown listener must be removed on unmount. `ActionBarAction`
  swaps its children for a spinner and disables itself while `isPending`, and renders
  a tooltip only when `tooltip` is provided. Assert after `waitFor` or with motion
  mocked; the portal defaults to `document.body`.

### DT-022 · Action bar visibility can be controlled with `visible`

- **Covers:** `DataTableActionBar`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** no selected rows with `visible={true}`, then selected rows with
  `visible={false}`
- **When** the bar renders
- **Then** it appears only in the first case; the prop overrides the selection-derived
  value in both directions, and a supplied `portalContainer` receives the portal
  instead of `document.body`
- **Notes:** this is the controlled/uncontrolled split: `visible` omitted means derive
  from filtered selection; provided means fully controlled. `AnimatePresence` may keep
  the exiting node briefly in jsdom — assert with `waitFor`, or mock `motion/react`
  with a plain `div`.

## Row menu and column styling

### DT-023 · Row menu opens and renders the supplied actions

- **Covers:** `DataTableRowMenu`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a row menu containing two `DropdownMenuItem` children and
  `contentProps={{ className: "custom-menu", align: "start" }}`
- **When** the icon trigger is clicked
- **Then** a menu opens containing both actions, and its content merges `w-40` with
  `custom-menu`
- **Notes:** the component defaults `align` to `end` and accepts `contentProps.align`
  (the case passes `start`); if the positioner does not expose alignment as a DOM
  attribute under jsdom, assert it through the rendered positioner style/snapshot
  rather than text. The trigger is icon-only and has no accessible name — query it
  inside the row or add an `aria-label`. Only `className` and `align` are read from
  `contentProps`; other dropdown props are silently dropped. The menu is a wrapper;
  actual actions (edit/delete dialogs) belong to feature documents such as
  [medicine.md](./medicine.md).

### DT-024 · `getColumnStyles` returns sticky offsets and pinned-edge shadows

- **Covers:** `getColumnStyles` — `src/components/data-table/getColumnStyles.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** stub columns: pinned-left last column with `getStart("left") = 120`,
  pinned-right first column with `getAfter("right") = 80`, a middle pinned column, and
  an unpinned column
- **When** `getColumnStyles` is called with and without `withBorder`
- **Then** left returns `left:"120px"`, `position:"sticky"`, `zIndex:1`,
  `opacity:0.97` and the inset left shadow when bordered; right returns `right:"80px"`
  and the right shadow; the middle pinned column has no shadow; unpinned returns
  `position:"relative"`, `opacity:1`, and no offsets/zIndex/shadow
- **Notes:** pure function — call it directly with a cast stub. Shadows apply only to
  the last left / first right pinned column and only when `withBorder=true`. No current
  feature enables column pinning, so the sticky branches are unexercised in the app;
  this unit test is the primary guard. Exact shadow strings are part of the returned
  contract and may be asserted.
