# Shared App Components — Test Implementation

Scope: `src/components/shared/**`, `src/components/dev-panel/**`,
`src/components/providers/**`, `src/components/time-range-filter/**`,
`src/components/tanstack-query/**`, and the top-level components in
`src/components/*.tsx` listed in the source map. UI primitives live in
`components-ui.md`, data-table pieces in `components-data-table.md`, and form fields in
`components-form-fields.md`.

## Source map

### Theme and app shell

| File                                                                     | Responsibility                                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `src/components/providers/theme-provider.tsx`                            | Theme context, localStorage persistence, `system` resolution, no-flash inline script |
| `src/components/theme-changer.tsx`                                       | Dropdown that sets `light` / `dark` / `system`                                       |
| `src/components/theme-changer.stories.tsx`                               | Storybook story (render-only, no play function)                                      |
| `src/components/shared/AppBreadcrumb.tsx`                                | `findBreadcrumbs` tree lookup and breadcrumb rendering                               |
| `src/components/shared/dashboard-shell/index.tsx`                        | Page shell with optional header slot and max-width layout                            |
| `src/components/shared/dashboard-shell/DashboardShellHeader.tsx`         | Title/description/header wrappers                                                    |
| `src/components/shared/dashboard-shell/DashboardShellSkeleton.tsx`       | `aria-hidden` shell skeleton with optional body                                      |
| `src/components/shared/dashboard-shell/DashboardShellHeaderSkeleton.tsx` | Title/description skeleton primitives                                                |

### Navigation chrome

| File                                                  | Responsibility                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `src/components/shared/sidebar/AppSidebar.tsx`        | Composes logo, main menu, footer, rail; `collapsible="icon"`    |
| `src/components/shared/sidebar/SidebarMainMenu.tsx`   | Filters `sidebarMenuLinks` by the auth store and renders groups |
| `src/components/shared/sidebar/filterSidebarMenu.ts`  | Pure permission-based menu filtering incl. nested items         |
| `src/components/shared/sidebar/NestedMenuItem.tsx`    | Link/nested-collapsible item, active state from `pathRegex`     |
| `src/components/shared/sidebar/SidebarFooterMenu.tsx` | Profile/settings links, prefix-based active state               |
| `src/components/shared/sidebar/SettingsSidebar.tsx`   | Settings sub-nav, exact-path active state                       |
| `src/components/shared/topbar/index.tsx`              | Sticky header: sidebar trigger, breadcrumb, theme changer, user |
| `src/components/shared/topbar/TopbarUser.tsx`         | Avatar trigger, profile links, logout flow                      |

### Dev panel

| File                                            | Responsibility                                       |
| ----------------------------------------------- | ---------------------------------------------------- |
| `src/components/dev-panel/index.tsx`            | Client-only, non-production gate; opener button      |
| `src/components/dev-panel/DevPanelContext.tsx`  | Panel state, persisted open/tab, logs, error counter |
| `src/components/dev-panel/DevPanelBody.tsx`     | Tabs, env badge, active panel switch                 |
| `src/components/dev-panel/ConsoleDevPanel.tsx`  | Patches `console.*`, filters, clears logs            |
| `src/components/dev-panel/AuthPanel.tsx`        | One-click seeded-user login / logout                 |
| `src/components/dev-panel/StoragePanel.tsx`     | Lists and deletes `localStorage` entries             |
| `src/components/dev-panel/EnvVarPanel.tsx`      | Read-only list of public env vars                    |
| `src/components/dev-panel/PerformancePanel.tsx` | Navigation timing, JS payload, heap, viewport, UA    |
| `src/components/dev-panel/DevPanelFooter.tsx`   | Current pathname and log count                       |

### Time range, query plumbing, standalone components

| File                                                        | Responsibility                                            |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| `src/components/time-range-filter/index.tsx`                | Preset menu, custom dialogs, reset, trigger label/tooltip |
| `src/components/time-range-filter/month-range-select.tsx`   | Year/month grid, two-click range, apply/clear             |
| `src/components/time-range-filter/week-range-select.tsx`    | Week grid for a year, two-click range, apply/clear        |
| `src/components/time-range-filter/range-grid.tsx`           | Shared selectable grid with hover preview                 |
| `src/components/tanstack-query/hydration.tsx`               | `getQueryClient` cache, `HydrateClient` dehydration       |
| `src/components/tanstack-query/query-state-boundary.tsx`    | Loading/error/empty/data rendering                        |
| `src/components/tanstack-query/tanstack-query-provider.tsx` | Query client provider + devtools global                   |
| `src/components/DeleteDialog.tsx`                           | Type-`CONFIRM` destructive confirmation                   |
| `src/components/FormatDateCell.tsx`                         | Timezone-aware `<time>` cell                              |
| `src/components/LinkButton.tsx`                             | Router `Link` rendered as a `Button`                      |
| `src/components/MetaPagination.tsx`                         | Page window/ellipsis from `PaginationMeta`                |
| `src/components/SearchableSelector.tsx`                     | Debounced server-search selector (popover/drawer)         |
| `src/components/SidebarLogo.tsx`                            | Sidebar brand link                                        |
| `src/components/SiteLogo.tsx`                               | Auth-page brand link                                      |
| `src/components/tab-navigation.tsx`                         | URL search-param driven tabs                              |
| `src/components/UserAvatar.tsx`                             | Avatar image/initials, online dot, identity block         |
| `src/assets/icons/SocialIcons.tsx`                          | Google SVG icon used by the auth social button            |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 28     |
| **Total**   | **28** |

Existing test files in scope: none.

Existing stories in scope: `src/components/theme-changer.stories.tsx` exports only
`Default`, a render-only story with **no play function**, so it does not satisfy any
case below. `src/components/shared/**`, `dev-panel/**`, `providers/**`,
`time-range-filter/**`, and `tanstack-query/**` have no stories.

## Test environment and mocks

- Component tests run under `pnpm test` (jsdom project, setup `test/setup.ts`), next to
  the source as `*.test.tsx`. Pure helpers (`findBreadcrumbs`,
  `filterSidebarMenu`) can use `*.test.ts`.
- Wrap components that read auth state in `AuthStoreProvider` with a fixed user
  (`name`, `email`, `image: null`, `timezone`), session, roles, and permissions. Use
  `vi.mock` for `@/stores/zustand/auth/AuthStoreContext` only when the provider would
  pull in unrelated server code.
- Router-dependent components need a real memory router or module mocks for
  `useLocation`, `Link`, `useNavigate`, `useRouter`, and `getRouteApi`. `LinkButton`,
  `SidebarLogo`, and `SiteLogo` only need a `Link` stub.
- `window.matchMedia` must be stubbed (jsdom has none): return an object with `matches`,
  `addEventListener`, `removeEventListener`, and a helper to flip `matches` and fire the
  listener. `useIsMobile` reads `window.innerWidth` in a microtask, so viewport tests
  must set `innerWidth` before render and `await waitFor`.
- Stub `Element.prototype.scrollIntoView` (dev panel auto-scroll), and
  `window.performance.getEntriesByType`, `performance.memory`,
  `document.readyState`, and `navigator.userAgent` for `PerformancePanel`.
- Mock `@/features/auth/auth.client`, `react-hot-toast`, and
  `@tanstack/react-start`'s `createClientOnlyFn` where needed. The logout tests must
  invoke the `fetchOptions.onRequest/onSuccess/onError` callbacks supplied to
  `authClient.signOut`, because the component never calls them directly.
- Freeze time with `vi.setSystemTime` and pin `TZ` for preset/range tests. Presets build
  local `Date` values and serialize with `toISOString()`, so results depend on the
  timezone. `startOfWeek` uses `weekStartsOn: 1` (Monday).
- Use fake timers for the 500 ms selector debounce and for `queueMicrotask`-driven
  provider effects; flush microtasks with `await act(async () => {})` before asserting.
- Base UI menus, popovers, and dialogs render through portals. Open the trigger with
  `userEvent`, then query by role (`menu`, `menuitem`, `dialog`, `alertdialog`) with
  `findBy*`. Tooltip content requires `TooltipProvider` and a hover/focus.
- `@/lib/env` validates at import time; mock it with
  `{ VITE_APP_NAME: "Jorna Pharmacy" }` for logo tests instead of relying on `.env`.
- Clear `localStorage` between tests; theme and dev panel keys are raw/JSON strings
  respectively (`theme`, `dev_panel`, `dev_panel_active_tab`).

## Theme

### SH-001 · ThemeProvider restores the persisted theme and applies it on mount

- **Covers:** `ThemeProvider`, `useTheme`, `getThemeScript` — `src/components/providers/theme-provider.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `localStorage.theme = "dark"` and a document element without a theme class
- **When** `ThemeProvider` mounts with `defaultTheme="system"` and a probe reads `useTheme()`
- **Then** the probe eventually reports `"dark"`, `<html>` has `dark` (and not `light`) and
  `style.colorScheme === "dark"`; calling `setTheme("light")` writes the raw string
  `"light"` to `localStorage` and swaps the class to `light`
- **Notes:** the provider reports `defaultTheme` on the first render (stored value is read
  in an effect + microtask), so assert with `waitFor`; an invalid stored value
  (`"blue"`) falls back to `defaultTheme`; the value is stored raw, not JSON-encoded.
  `getThemeScript` is only observable by inspecting the injected `<script>` text.

### SH-002 · `system` resolves from the OS preference and reacts to changes

- **Covers:** `ThemeProvider`, `applyTheme` — `src/components/providers/theme-provider.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** no stored theme, `defaultTheme="system"`, and a `matchMedia` stub whose
  `(prefers-color-scheme: dark)` query reports `matches: true`
- **When** the provider mounts, then the stub flips to `matches: false` and fires its
  `change` listener, then the user selects `light` and the stub changes again
- **Then** the first resolution applies `dark`, the OS change re-applies `light`, and no
  further re-application happens for an explicit `light` theme; the listener is removed
  on unmount
- **Notes:** assert `style.colorScheme` as well as the class; `applyTheme` always removes
  both classes first; jsdom needs the `matchMedia` stub for every theme test.

### SH-003 · ThemeChanger offers all three themes and persists the choice

- **Covers:** `ThemeChanger` — `src/components/theme-changer.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** `ThemeChanger` rendered inside `ThemeProvider`
- **When** the trigger (accessible name "Toggle theme") is opened and `Dark` is clicked,
  then the menu is reopened and `System` is clicked
- **Then** the menu lists Light, Dark, System in order; each click calls the provider's
  `setTheme`, writes the matching value to `localStorage`, applies the resolved class,
  and closes the menu
- **Notes:** the existing story `theme-changer.stories.tsx` only renders `Default` and has
  no play function, so it does not make this case `Implemented`; the trigger renders a
  different icon per theme with one `sr-only` label. Base UI menu items are portalled.

## Breadcrumbs

### SH-004 · Breadcrumb chain is derived per path segment

- **Covers:** `findBreadcrumbs` — `src/components/shared/AppBreadcrumb.tsx`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the exported `breadcrumbRoutes` tree
- **When** `findBreadcrumbs` is called with `/dashboard/settings/profile`,
  `/dashboard/users`, `/dashboard/vendors/42`, and `/`
- **Then** the first path returns Dashboard → Settings → Profile in order, `/dashboard/users`
  returns Dashboard → All Users, `/dashboard/vendors/42` returns only Dashboard (no
  vendors entry exists), and `/` returns `[]`
- **Notes:** the function walks segments and searches recursively for an exact `path`;
  unknown intermediate segments are silently skipped and there is no fallback title.
  Decide whether vendors, medicines, purchases, and payments need entries (or whether
  breadcrumbs should derive from route handles) and turn that decision into a case.

## Sidebar and navigation state

### SH-005 · Menu filtering honours permissions and keeps reachable parents

- **Covers:** `filterSidebarMenu` — `src/components/shared/sidebar/filterSidebarMenu.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** fixture groups containing an unguarded item, a `vendor:list` item, a
  `manage`-only item, a denied parent with one permitted child, and a permitted parent
  whose children are all denied
- **When** `filterSidebarMenu` runs for `[]`, for `vendor:list`, and for
  `role_permission:manage`
- **Then** an empty permission list removes every guarded item and drops empty groups;
  `manage` grants all actions; a denied parent is retained with only the permitted child;
  a permitted parent whose children are all denied is retained with `items: []`
- **Notes:** `hasPermission` also supports `self`-level checks with `userId`, which this
  helper passes but never satisfies without a `resourceId`; menu filtering is UX only —
  assert that real authorization remains in oRPC procedures. Group with zero items is
  dropped, but a permitted parent with zero children is not.

### SH-006 · Active navigation item comes from `pathRegex` and opens its parent

- **Covers:** `NestedMenuItem`, `SidebarMainMenu` — `src/components/shared/sidebar/NestedMenuItem.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a fixture menu with a leaf `pathRegex: /\/dashboard\/vendors(\/.*)?$/`
  and a parent with children, rendered inside `SidebarProvider`
- **When** the pathname is `/dashboard/vendors/42` and later `/dashboard/users`
- **Then** the Vendors link exposes `data-active="true"` (from
  `SidebarMenuButton`'s `state.active`) and the other leaf does not; a parent whose regex
  matches the pathname is open by default while a non-matching parent is closed, and a
  user can still collapse it
- **Notes:** active state is regex-based, not route-id based, so a regex with the `g` flag
  would be stateful — keep test fixtures without `g`. Parent open state is uncontrolled
  (`defaultOpen`); navigating later does not force it open. The exact DOM marker depends
  on Base UI `useRender` state (`data-active`); confirm once and keep the test
  behavior-oriented.

### SH-007 · Dashboard link is active on every dashboard route

- **Covers:** `sidebarMenuLinks` Dashboard entry, `NestedMenuItem` — `src/constants/sidebarLinks.tsx`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the shipped Dashboard item with `pathRegex: /\/dashboard/`
- **When** the pathname is `/dashboard/medicines`, `/dashboard/users`, or
  `/dashboard/settings/profile`
- **Then** the Dashboard link reports active in addition to the page-specific link
- **Notes:** this is current behavior, not a documented requirement. Decide whether the
  Dashboard regex should be `^/dashboard$` (or use exact matching) before asserting the
  outcome; the test should encode the decision, not the coincidence. Same pattern check
  for footer links, which use `startsWith`, versus `SettingsSidebar`'s exact equality.

### SH-008 · Sidebar collapses on desktop and becomes a sheet on mobile

- **Covers:** `AppSidebar`, `SidebarProvider`, `SidebarRail`, `SidebarTrigger` — `src/components/shared/sidebar/AppSidebar.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** `AppSidebar` inside `SidebarProvider` at `window.innerWidth = 1024`
- **When** the rail or the trigger (sr-only "Toggle Sidebar") is clicked, the viewport is
  changed to 500 px and `AppSidebar` re-renders, then the trigger is clicked again
- **Then** desktop renders `data-collapsible="icon"` with the rail, toggling sets the
  container `data-state` to `collapsed` and back; mobile renders a closed `Sheet` with
  `data-mobile="true"` that opens on trigger click and is dismissible
- **Notes:** `useIsMobile` updates from a microtask and a `matchMedia` listener; collapse
  state is in-memory only (no cookie/localStorage), so it resets on reload — decide
  whether persistence is expected. Rail/tooltip text ("Toggle Sidebar") is covered by
  `components-ui.md`; keep this case focused on `AppSidebar` wiring.

## Topbar

### SH-009 · Topbar composes navigation and the user menu shows identity

- **Covers:** `Topbar`, `TopbarUser` — `src/components/shared/topbar/index.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a user fixture (`name: "Jane Doe"`, `email: "jane@example.com"`,
  `image: null`) and pathname `/dashboard`
- **When** the topbar renders and the avatar trigger is opened
- **Then** the header contains the sidebar trigger, the Dashboard breadcrumb, the theme
  trigger, and the avatar; the menu shows "Jane Doe", the email, Profile, Profile
  setting, and Log out, with links to `/dashboard/profile` and
  `/dashboard/settings/profile`
- **Notes:** requires `SidebarProvider`, `TooltipProvider`, router mocks, and a
  `DropdownMenu` portal; the avatar is the trigger itself (no separate button label), so
  query by the image alt or the user's initials.

### SH-010 · Logout succeeds with redirect or reports failure

- **Covers:** `handleLogout` — `src/components/shared/topbar/TopbarUser.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a mocked `authClient.signOut` and pathname `/dashboard/medicines`
- **When** Log out is clicked and the supplied `onRequest`/`onSuccess` callbacks run, then
  the flow is repeated with `onError`
- **Then** loading and success toasts use the fixed id, `router.invalidate()` runs once,
  and navigation targets `/sign-in?redirect=/dashboard/medicines`; the error path shows
  the failure toast and does not navigate or invalidate
- **Notes:** the component passes `href`, not `to`; the redirect value is interpolated
  without encoding, so pathnames containing `?` or `&` would break the query. Only
  `pathname` is preserved (no search/hash). Mock `createClientOnlyFn` to an identity
  function if it defers execution in the test environment.

## Dev panel

### SH-011 · Dev panel is client-only and hidden in production

- **Covers:** `DevPanel`, `useIsClient` — `src/components/dev-panel/index.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a server snapshot render and client renders with `currentEnv` of
  `"production"`, `"test"`, and `"development"`
- **When** `DevPanel` renders with `envVars=[]`
- **Then** the server render outputs nothing; production outputs nothing; test and
  development render the "DEV" opener (`aria-label="Toggle Dev Panel"`) and the
  "Developer Panel" region, and clicking the opener toggles the panel
- **Notes:** the panel body is always mounted and only translated off-screen
  (`translate-x-full`) when closed — it has no `aria-hidden`/`inert`, so it remains in the
  accessibility tree and tab order. Assert visibility via the translate class or add a
  proper hidden state (decision + follow-up case). Only the exact string `"production"`
  is gated; an invalid env value would leave the panel visible.

### SH-012 · Console panel captures, filters, clears, and restores logs

- **Covers:** `ConsoleDevPanel`, `DevPanelContext` log reducer — `src/components/dev-panel/ConsoleDevPanel.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `ConsoleDevPanel` inside `DevPanelContextProvider` with `console` methods
  spied
- **When** `console.log("a")`, `console.warn("b")`, `console.error("c")`, and
  `console.info("d")` run, then the `warn` filter is selected, then CLEAR is clicked, then
  the panel unmounts
- **Then** each entry appears with its type and timestamp, the console tab label becomes
  `console (1)` after the warning only, filtering shows only warnings and the empty filter
  shows "no logs yet" after clearing, and unmount restores the original console methods
- **Notes:** `errorCount` increments for `console.warn` but **not** for `console.error`;
  `decrementErrorCount`/`clearErrorCount` are never used by the UI. Logs are capped at
  300 (oldest dropped silently) and ids restart per provider mount. Patching globals
  breaks other tests unless restored, so spy and unmount carefully.

### SH-013 · Dev auth panel logs in seeded users and logs out with redirect

- **Covers:** `AuthPanel` — `src/components/dev-panel/AuthPanel.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `authClient.signOut` and `authClient.signIn.email` mocks and
  `redirectUrl="/dashboard"`
- **When** "Employee Login" is clicked, its callbacks resolve, then "Logout" is clicked
  and resolves
- **Then** sign-out runs before sign-in, sign-in receives
  `{ email: "employee@mail.com", password: "12345678", callbackURL: "/dashboard" }`,
  buttons are disabled while `isLoading`, success/failure toasts use the fixed id,
  and logout navigates to `/dashboard` with `replace: true` only for the redirecting
  button
- **Notes:** the password is hard-coded for local seeded accounts; the panel is only
  reachable when `DevPanel` is rendered (non-production), which is the real safeguard.
  Errors must reset loading and must not navigate. "Logout" calls `handleLogout(true)`
  directly, i.e. as a click handler that receives the click event as `isRedirect` (truthy).

### SH-014 · Storage panel lists and deletes `localStorage` entries

- **Covers:** `StoragePanel` — `src/components/dev-panel/StoragePanel.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** `localStorage` containing `theme` and `dev_panel`, with the storage tab active
- **When** the panel mounts, a key's ✕ is clicked, and the remaining key is deleted
- **Then** both keys and their values render, each click removes the key from
  `localStorage` and the list, and the final state shows "localStorage is empty"
- **Notes:** the snapshot is taken only when `activeTab` becomes `"storage"`; writes made
  elsewhere are not reflected until the tab is re-selected. Values are displayed as raw
  stored strings (JSON text for `usePersistStorage` keys), not parsed.

### SH-015 · Env and performance panels render values and fallbacks

- **Covers:** `EnvVarPanel`, `PerformancePanel`, `DevPanelFooter` — `src/components/dev-panel/EnvVarPanel.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** `envVars` of `[{ key: "VITE_APP_NAME", value: "Jorna" }, { key: "VITE_MAIL", value: "" }]`
  and a stubbed performance timeline (navigation entry, two script resources, no
  `performance.memory`)
- **When** the env and performance tabs render with `document.readyState === "complete"`
- **Then** env shows the keys, `"Jorna"`, and `"empty"` for the blank value (or
  "no public env vars" when the list is empty); performance shows formatted DNS/TCP/TTFB/
  DOM/load durations, JS transfer/gzip/parsed totals, `N/A` for heap, and the
  `width × heightpx · ratio x` viewport plus `navigator.userAgent`; the footer shows the
  pathname and `"2 entries"`
- **Notes:** values with no navigation entry or no memory are `N/A`; the panel waits for
  the `load` event when the document is not complete, so either stub `readyState` or
  dispatch `load`. `formatDuration`/`formatBytes` themselves are owned by `utils.md`;
  assert the rendered composition, not their arithmetic.

## Time range filter

### SH-016 · Presets produce Monday-based week and calendar-month bounds

- **Covers:** `TimeRangeFilter`, `presetRanges` — `src/components/time-range-filter/index.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** frozen time Wednesday 2026-06-17 in a pinned timezone and a
  `setRangeSearch` spy
- **When** each of This Week, This Month, Last Week, Last Month is selected from the
  dropdown
- **Then** each call receives the matching enum plus ISO `startTime`/`endTime`: this week
  Monday 00:00 → Sunday 23:59:59.999, this month the 1st → last day, last week the
  previous Monday → previous Sunday, last month the previous month's full bounds; the
  dropdown closes after each selection
- **Notes:** presets build local `Date` objects and serialize with `toISOString()`, so the
  assertion must pin `TZ`; `weekStartsOn: 1`; `setRangeSearch` is called once per
  selection. The radio group reflects `rangeSearch.range` as its checked value.

### SH-017 · Custom week and month dialogs apply `CUSTOM_*` ranges

- **Covers:** `TimeRangeFilter`, `WeekRangeSelect`, `MonthRangeSelect`, `RangeGrid` — `src/components/time-range-filter/index.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `rangeSearch` with no range and frozen time in 2026
- **When** "Custom Week" is chosen, two weeks (anchor then a later week) are clicked, and
  Apply is pressed; then "Custom Month" is chosen, February then April are clicked, and
  "Apply Range" is pressed
- **Then** the first apply calls `setRangeSearch` with `range: "CUSTOM_WEEK"` and ISO
  bounds spanning the first week's start through the second week's end, the second with
  `range: "CUSTOM_MONTH"` spanning February's start through April's end, and both dialogs
  close; clicking in reverse order normalizes the bounds
- **Notes:** selection is anchor-by-index (first click sets a single period, second
  completes), so hover preview is only visual; year arrows update the heading and call
  `onYearChange`; `defaultRange` prefills only when both `startTime` and `endTime` exist.
  `RangeGrid` is passed `aria-label`, but its props do not accept or forward it — either
  forward it (decision) or assert the group has no accessible name. Month selection at
  12 items needs no scroll; the week grid is scrollable with one button per computed
  week.

### SH-018 · Trigger label, tooltip, and reset reflect the selection

- **Covers:** `TimeRangeFilter`, `handleReset` — `src/components/time-range-filter/index.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the filter wrapped in `TooltipProvider` with a user timezone
- **When** it renders with `range: null`, then with `range: "THIS_WEEK"` and ISO bounds,
  then the clear button is clicked
- **Then** the label is "Select range" with no clear control at first; with a selection
  the label is "This Week", the tooltip shows both bounds formatted `dd, MMM` in the
  user's timezone, and a clear button labelled "Clear time range filter" appears; the
  click calls `setRangeSearch({ range: null, startTime: null, endTime: null })`, hides
  the clear button, and does not open the dropdown
- **Notes:** the tooltip falls back to "Time range" when either bound is missing; the
  reset calls `event.stopPropagation()` because the button sits next to the dropdown
  trigger. Tooltips need hover/focus, not just render.

## TanStack Query plumbing

### SH-019 · HydrateClient dehydrates the supplied query client

- **Covers:** `HydrateClient`, `getQueryClient` — `src/components/tanstack-query/hydration.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a `QueryClient` with `setQueryData(["medicine", 1], { id: 1 })` and a
  `staleTime` long enough to avoid refetch
- **When** a child using `useQuery` for that key renders inside `HydrateClient`
- **Then** the child sees the cached value on first render and no query function runs;
  `getQueryClient()` returns the same instance on repeated calls within one render scope
- **Notes:** `getQueryClient` is `cache(createQueryClient)`, so identity is per request /
  React cache scope — assert inside a single server-style render rather than across test
  cases. Do not add a `QueryClientProvider`; `HydrationBoundary` supplies the state.

### SH-020 · QueryStateBoundary checks loading, error, empty, then data

- **Covers:** `QueryStateBoundary` — `src/components/tanstack-query/query-state-boundary.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a render helper that passes `isLoading`, `isError`, `error`, `data`, and
  `isEmpty`
- **When** the states are set to loading + error, error only, `data: []`, `data: 0`,
  `data: undefined`, and valid data
- **Then** loading wins over error and renders the default five skeletons (or a custom
  `loadingFallback`); error renders "Something Went Wrong" plus the message and calls a
  custom `errorFallback` with a real `Error` when provided; empty/undefined/`0` render
  "No results found." (or a custom `emptyFallback`); valid data renders `children(data)`
  and never calls `isEmpty`
- **Notes:** a null/absent error is replaced with `new Error("Unknown error")`;
  `isEmpty` is not called when `data` is falsy because of the short-circuit. The default
  error block is informational only — there is no retry control.

## Confirmation dialog

### SH-021 · Delete requires the exact word CONFIRM

- **Covers:** `DeleteDialog` — `src/components/DeleteDialog.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `openDialog: true`, an `onDelete` spy, and `isDeleteing` false
- **When** the input receives `"confirm"`, then `"CONFIRM "`, then exactly `"CONFIRM"`,
  and Delete is clicked; separately `isDeleteing: true` with `"CONFIRM"`
- **Then** Delete is disabled and `aria-disabled` until the exact match; the successful
  click calls `onDelete` once and clears the input; the in-flight flag keeps Delete
  disabled even with the magic word; Cancel closes via `setOpenDialog(false)` without
  deleting
- **Notes:** comparison is case-sensitive and does not trim; `onDelete` is fire-and-forget
  and the dialog stays open until the parent flips `openDialog`. The `isDeleteing` prop
  is misspelled in the public API; renaming would be a breaking change for callers.

### SH-022 · Typed confirmation survives cancel and reopen

- **Covers:** `DeleteDialog` local `inputValue` — `src/components/DeleteDialog.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** the dialog opened with `"CONF"` typed and Cancel clicked
- **When** the parent reopens the dialog
- **Then** the input still contains `"CONF"` and Delete remains disabled; if the user had
  typed `"CONFIRM"` before cancelling, reopening allows an immediate delete
- **Notes:** current behavior never resets on close (only after a successful delete).
  Decide whether closing should clear the input; a reopen-and-delete path is an
  accidental-deletion risk worth locking down with the decision.

## Date, pagination, and selector primitives

### SH-023 · FormatDateCell renders a timezone-aware `<time>`

- **Covers:** `FormatDateCell` — `src/components/FormatDateCell.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** an auth user with `timezone: "Asia/Dhaka"` and a fixed UTC timestamp
- **When** the cell renders with a `Date`, an ISO string, and a millisecond number, using
  `format: "PPP p"` and one cell with a `locale` option
- **Then** each `<time>` has `dateTime` equal to the input's ISO string and text formatted
  in the user's timezone across the date boundary; extra props (e.g. `className`,
  `title`) are forwarded
- **Notes:** an invalid value throws (`toISOString` on an invalid `Date`); decide whether
  to render a dash instead and add a case. `formatDateWithTimezone` itself (default
  timezone `America/New_York`, empty-format error) belongs to `utils.md`.

### SH-024 · MetaPagination windows pages and disables boundaries

- **Covers:** `MetaPagination` — `src/components/MetaPagination.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `PaginationMeta` objects for page 5 of 10 with `siblingCount: 1`, page 1 of
  10, page 10 of 10, and page 1 of 0
- **When** the component renders and the numbered/Previous/Next buttons are clicked
- **Then** the middle page shows `1 … 4 5 6 … 10` with `aria-current="page"` and
  `data-active` on 5, Previous/Next call `onPageChange(4)`/`(6)`; first page disables
  Previous and last disables Next; a zero-page result renders no number buttons and both
  arrows disabled
- **Notes:** when `pageCount ≤ siblingCount * 2 + 3` all pages render without ellipsis;
  ellipsis nodes have no accessible label; page buttons are keyed by index. `meta` comes
  from `buildPaginationMeta` and should be built with that helper rather than hand-rolled
  (see `db-utils.md`).

### SH-025 · Selector search is debounced and surfaces loading/empty/error

- **Covers:** `SearchableSelector`, `SearchableSelectorContent` — `src/components/SearchableSelector.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the selector with `data`/`isLoading`/`isError` props, an `onSearch` spy, and a
  caller-provided loading/empty/error fallback
- **When** the trigger opens, the command input receives `"nap"` under fake timers, and
  each query state is rendered
- **Then** `onSearch` is called once with `"nap"` after the 500 ms debounce (or the
  configured `searchDebounceMs`), not per keystroke; loading shows the loading fallback,
  `[]` shows the empty fallback, an error shows the error fallback with the `Error`, and
  success renders one `CommandItem` per supplied row; `data` is never client-filtered
  (`shouldFilter={false}`)
- **Notes:** typing while the popover is open keeps the previous rows visible until the
  new data arrives; `QueryStateBoundary` order is loading → error → empty. Empty UI comes
  from the caller's fallback, not `CommandEmpty`. Use fake timers plus `act` and flush
  the microtask that opens the desktop popover.

### SH-026 · Selector toggles single and multiple values correctly

- **Covers:** `handleSelect` — `src/components/SearchableSelector.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a selector with `multiple: false` and `value: "2"`, then re-rendered with
  `multiple: true` and `value: ["2"]`
- **When** item `"1"` is selected, then item `"2"`, then in multiple mode `"1"` and `"2"`
  are selected, and finally the trigger is clicked with `disabled: true`
- **Then** single mode calls `onChange("1")` and closes, selecting the current value calls
  `onChange(undefined)`; multiple mode calls `onChange(["2", "1"])` then
  `onChange(["2"])` without closing; a disabled trigger does not open
- **Notes:** chosen items expose `data-checked`; the component only reports changes and
  never owns the value, so the harness must rerender with the new `value`. In single mode
  the toggle-off behavior means "clear selection", not "keep previous".

## Avatar and tabs

### SH-027 · UserAvatar falls back to initials and renders identity details

- **Covers:** `UserAvatar` — `src/components/UserAvatar.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** users with `image: null`, a broken image URL, a single-word name, and
  `userRoles: [{ roleName: "super_admin" }]`
- **When** the avatar renders with `showDetails`, `showRoleDetails`, and `isActive`
- **Then** a null image uses `/user_placeholder_img.png`, a load error reveals uppercase
  initials (`"John Doe"` → `"JD"`, `"Madonna"` → `"M"`), the image `alt` is the user name,
  active state renders the sr-only "Online" label, details show the name plus the
  formatted role (`"Super Admin"`) when roles exist and the email otherwise
- **Notes:** Base UI `Avatar` renders the fallback only after the image fails, so fire
  `error` on the `<img>`; `resolveUserImage` and `strInitials` are owned by `utils.md`,
  `formatEnumValue` renders snake_case as Title Case. The container is not a button — the
  consuming dropdown trigger supplies interaction.

### SH-028 · TabNavigation reads and writes the URL search param

- **Covers:** `TabNavigation`, `TabNavigationList`, `TabNavigationTrigger`, `TabNavigationContent` — `src/components/tab-navigation.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `getRouteApi` mocked so `useSearch()` returns `{ tab: "settings" }` and
  `useNavigate()` is a spy
- **When** the tabs render with `defaultTab="overview"`, then the Overview trigger is
  clicked; the case is repeated with no `tab` param and with `paramName="section"`
- **Then** Settings is selected and its content shown; clicking Overview calls navigate
  with a search updater that preserves other params, sets `tab: "overview"`, and
  `resetScroll: true`; a missing param falls back to `defaultTab`; a custom `paramName`
  reads/writes that key
- **Notes:** the component always writes the param, including when the value equals
  `defaultTab`, which contradicts its JSDoc ("the param is omitted from the URL") — decide
  whether to delete the key for the default and encode that decision. Only the search
  updater is invoked; the router owns history. The list adds scroll containers and a
  line variant; trigger/content keyboard behavior belongs to the tabs primitive.
