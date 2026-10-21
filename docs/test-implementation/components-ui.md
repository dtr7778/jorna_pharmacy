# UI Components — Test Implementation

Scope: `src/components/ui/**` — 51 component files plus their Storybook stories and
`button.test.tsx`. Generated files are excluded. This document owns the reusable UI
primitives; domain wrappers in `src/components/form-fields/**` are owned by
[components-form-fields.md](./components-form-fields.md).

## Source map

| Family                      | Files                                                                                                                                                                                                                | Responsibility                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Buttons, loading, skeletons | `button.tsx`, `button-spinner.tsx`, `button-skeleton.tsx`, `refresh-button.tsx`, `spinner.tsx`, `skeleton.tsx`, `select-skeleton.tsx`                                                                                | Variant/size contracts, disabled/loading states, refresh cooldown, loading placeholders            |
| Form controls               | `input.tsx`, `textarea.tsx`, `label.tsx`, `field.tsx`, `input-group.tsx`, `checkbox.tsx`, `switch.tsx`, `slider.tsx`, `select.tsx`                                                                                   | Base-ui form primitives, field composition, prefix/suffix groups, validation display               |
| Text entry                  | `password-input.tsx`, `phone-input.tsx`, `searchable-input.tsx`                                                                                                                                                      | Password reveal, international phone + country picker, combobox with async options                 |
| Overlays and menus          | `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `dropdown-menu.tsx`, `command.tsx`, `popover.tsx`, `hover-card.tsx`, `tooltip.tsx`, `portal.tsx`, `collapsible.tsx`, `accordion.tsx`, `scroll-area.tsx` | Modal/non-modal surfaces, focus and dismissal, menus, command palette, body scroll lock            |
| Navigation and layout       | `sidebar.tsx`, `tabs.tsx`, `breadcrumb.tsx`, `pagination.tsx`, `toggle.tsx`, `toggle-group.tsx`                                                                                                                      | Sidebar state/shortcut/mobile sheet, tabs keyboard navigation, landmark and current-page semantics |
| Data display                | `avatar.tsx`, `badge.tsx`, `card.tsx`, `table.tsx`, `stat.tsx`, `status.tsx`, `empty.tsx`, `separator.tsx`                                                                                                           | Compound layout slots, image fallback, semantic variants, empty states                             |
| Filters and date pickers    | `date-filter.tsx`, `date-time-picker.tsx`, `faceted-filter.tsx`, `slider-filter.tsx`, `calendar.tsx`                                                                                                                 | Desktop popover/mobile drawer filters, single vs range dates, time selection, calendar selection   |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 2      |
| Partial     | 0      |
| Missing     | 28     |
| **Total**   | **30** |

Existing test files:

- `src/components/ui/button.test.tsx` — one example/direct test. It asserts render and the
  accessible button name only; it does not exercise clicks, variants, sizes, or disabled
  state.
- `src/components/form-fields/SearchableInputField.test.tsx` — eight tests that indirectly
  exercise `src/components/ui/searchable-input.tsx` through the form-field wrapper. This is
  the evidence for UI-060; the direct component surface (`disabled`, `onBlur`,
  `renderOption`) remains untested.
- Storybook: 50 `*.stories.tsx` files exist (`searchable-input` has no story). None contains
  a `play` function, `expect`, or any other assertion, so **no story counts as
  `Implemented`**. They are render/autodocs fixtures only.

## Test environment and mocks

- Vitest project `jsdom` + Testing Library, with `test/setup.ts` (`jest-dom`, `cleanup`).
  Use `userEvent` for interaction and `screen` for queries.
- Base-ui overlays portal into `document.body`; query through `screen` and await
  `findByRole`/`findByText` rather than using `container.querySelector`.
- `useIsMobile` calls `window.matchMedia` and reads `window.innerWidth`. jsdom does not
  provide `matchMedia`; mock it (and set `innerWidth` to `1024` for desktop or `767` for
  mobile) before rendering `Sidebar`, `DateFilter`, `DateTimePicker`, `FacetedFilter`, or
  `SliderFilter`. The hook is initially `false` and updates in an effect, so mobile
  assertions need `waitFor`.
- Base-ui positioners may need `ResizeObserver`/`IntersectionObserver`/`DOMRect` stubs in
  `test/setup.ts`. Popover content renders even when jsdom reports zero-sized rects; assert
  roles/content, not pixel position.
- Use fake timers for `RefreshButton` (2 s cooldown), `SliderFilter` (300 ms debounce), and
  search debounce. With `userEvent`, pass `advanceTimers` to `userEvent.setup`.
- Freeze time with `vi.setSystemTime` for calendar/picker cases and pass an explicit
  `timezone` (`DateFilter`/`DateTimePicker` default to `America/New_York`) so assertions do
  not depend on the machine timezone.
- jsdom does not apply Tailwind. Assert `buttonVariants`/`cva` output, `data-*` attributes,
  roles, and accessible names instead of computed colors or layout. In particular, the
  `hidden lg:flex` trigger badges still exist in the DOM in jsdom.
- The Storybook Vitest project renders stories in headless Chromium but does not turn them
  into assertions; `@storybook/addon-a11y` findings are reports, not test status.

## Buttons, loading, and skeletons

### UI-001 · Button renders an accessible button with its children

- **Covers:** `Button` — `src/components/ui/button.tsx`; `src/components/ui/button.test.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Implemented
- **Given** a rendered `<Button>Click me</Button>`
- **When** the tree is queried by role and accessible name
- **Then** `getByRole("button", { name: "Click me" })` is in the document
- **Notes:** this is exactly what the existing `button.test.tsx` asserts. The component also
  sets `data-slot="button"`, but the test does not assert it. It does not prove click
  handling, disabled state, `render`/link behavior, or any variant/size class. Those belong
  to UI-002.

### UI-002 · Button variant, size, disabled, and invalid contracts

- **Covers:** `Button`, `buttonVariants` — `src/components/ui/button.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a button rendered with no props, then with each `variant` and `size`
- **When** the rendered class list and `buttonVariants` output are inspected
- **Then** the defaults are `variant="default"` and `size="default"` (`bg-primary` and the
  `h-7` default size), every variant (`outline`, `secondary`, `ghost`, `destructive`,
  `link`) and size (`xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`) maps to a
  distinct class contract, and a caller `className` is appended
- **Given** a disabled button with an `onClick` spy
- **When** the user clicks it
- **Then** the spy is not called, the native `disabled` attribute is present, and
  `aria-invalid` passed by the caller is preserved
- **Notes:** unit-test `buttonVariants` instead of snapshotting the entire class string;
  Tailwind ordering can change. Base-ui `Button` can render a non-button element via
  `render`, which is used by `PaginationLink`.

### UI-003 · ButtonSpinner blocks interaction and swaps content while loading

- **Covers:** `ButtonSpinner` — `src/components/ui/button-spinner.tsx`; `Spinner` —
  `src/components/ui/spinner.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `isLoading` and children "Save" on a default-size button
- **When** the button is rendered and clicked
- **Then** the button is disabled and `aria-disabled="true"`, a `role="status"` spinner
  named "Loading" is present, "Save" is still visible, and `onClick` is not called
- **Given** `size="icon"` and loading
- **When** rendered
- **Then** the children are omitted while the spinner remains
- **Given** `isLoading={false}` or an explicit `disabled`
- **When** rendered
- **Then** no spinner is shown and the effective disabled state is
  `isLoading || disabled`
- **Notes:** the spinner's `aria-label="Loading"` is the only accessible status text.
  An icon-size loading button loses its accessible name when children are hidden; callers
  must pass `aria-label`. `aria-disabled` duplicates the native disabled attribute.

### UI-004 · RefreshButton enforces the two-second cooldown

- **Covers:** `RefreshButton` — `src/components/ui/refresh-button.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** fake timers, `isLoading={false}`, and an `onButtonClick` spy
- **When** the button is clicked once
- **Then** the spy runs once, the button becomes disabled, and the refresh icon has
  `animate-spin`
- **When** 1,999 ms elapse
- **Then** the button is still disabled and a second click is ignored
- **When** 2,000 ms elapse
- **Then** the button is enabled and the icon stops spinning
- **Given** `isLoading={true}`
- **When** rendered and clicked
- **Then** it starts disabled, spins, and never calls the spy
- **Notes:** the timeout is not cleared on unmount, so a test that unmounts during the
  cooldown can produce a state-update-after-unmount warning. The icon-only default has no
  accessible name (`RefreshCw` has no `aria-hidden` and no `sr-only` label); add one.
  Assert with `vi.advanceTimersByTime` inside `act`.

## Form controls

### UI-010 · PasswordInput toggles visibility and its accessible label

- **Covers:** `PasswordInput` — `src/components/ui/password-input.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a controlled password input with value `"secret"`
- **When** it renders
- **Then** the input has `type="password"` and a toggle button named "Show password"
- **When** the toggle is clicked
- **Then** the input becomes `type="text"`, the button is named "Hide password", and the
  eye icons are `aria-hidden`
- **When** it is clicked again
- **Then** the value is masked again and the label returns to "Show password"
- **Notes:** the toggle is `type="button"`, so it must not submit the surrounding form. The
  icon swap is visual; the `sr-only` text is the stable accessible contract. The inline
  `<style>` hides Edge/IE reveal controls and should not be asserted in jsdom.

### UI-011 · PasswordInput disables reveal for empty, disabled, and uncontrolled values

- **Covers:** `PasswordInput` — `src/components/ui/password-input.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a controlled input with `value=""`, or `value={undefined}`, or `disabled`
- **When** rendered
- **Then** the reveal toggle is disabled and cannot change the input type
- **Given** a controlled input whose value changes from empty to non-empty
- **When** it re-renders
- **Then** the toggle becomes enabled
- **Notes:** `disabled` is derived solely from `props.value`, so an uncontrolled
  `PasswordInput` (with `defaultValue` only) has `value === undefined` and the toggle is
  permanently disabled. Decide whether to support uncontrolled usage or document the
  controlled-only contract; the current behavior is surprising. This is a separate product
  decision from the reveal test in UI-010.

### UI-012 · PhoneInput country picker filters and reflects the selected country

- **Covers:** `PhoneInput`, `CountrySelect` — `src/components/ui/phone-input.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `defaultCountry="US"` and a valid phone value
- **When** the country trigger is opened
- **Then** a searchable country command appears with the current country checked
- **When** the user types "United" and selects "United Kingdom"
- **Then** only matching countries are offered, the trigger reflects GB, and the existing
  number is reinterpreted for the new country
- **Given** a partial/invalid number typed into the field
- **When** the number changes
- **Then** `onChange` is not called for an invalid/empty value (current truthiness guard)
- **Notes:** clearing a previously valid number never reaches `onChange`; the
  form-level clearing contract and its fix are owned by FF-010 in
  [components-form-fields.md](./components-form-fields.md). The country trigger has no
  `aria-label`; its name depends on the flag `<title>`. The uncontrolled popover is not
  closed by `handleSelect`, so the list may remain open after choosing a country—decide
  whether to close it and assert that. `smartCaret` is explicitly off.

### UI-013 · Field wires labels, invalid state, and deduplicated errors

- **Covers:** `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSeparator` —
  `src/components/ui/field.tsx`; `Label` — `src/components/ui/label.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a `Field` containing `FieldLabel htmlFor="email"` and `<Input id="email">`
- **When** rendered
- **Then** the input's accessible name is the label text and `Field` exposes
  `role="group"` with its `data-orientation`
- **Given** `data-invalid="true"` and an input with `aria-invalid="true"`
- **When** `FieldError` receives errors with messages `"Required"`, `"Required"`, and
  `"Too short"`
- **Then** one `role="alert"` is rendered, duplicate messages collapse to one entry, and
  multiple distinct messages render as a list
- **Given** a single error, explicit children, or no errors
- **When** `FieldError` renders
- **Then** the single message is text, explicit children replace derived errors, and no
  alert is rendered when there is no content
- **Notes:** `Field` sets the invalid styling context but does not set `aria-invalid` on the
  control; callers must do that. `FieldError` filters empty messages only in the list
  branch. `FieldSeparator` uses `data-content` to decide whether content is present.

### UI-014 · InputGroup addon focuses its control without hijacking buttons

- **Covers:** `InputGroup`, `InputGroupAddon`, `InputGroupInput`, `InputGroupButton` —
  `src/components/ui/input-group.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** an `InputGroup` with `InputGroupInput` and an addon containing text
- **When** the non-button part of the addon is clicked
- **Then** the input receives focus
- **Given** an addon containing an `InputGroupButton` with an `onClick` spy
- **When** the button is clicked
- **Then** the input is not focused and the button handler runs
- **Notes:** `InputGroupAddon` spreads caller props after its internal `onClick`, so a
  caller-supplied `onClick` replaces the focus behavior. It finds the first `input` via the
  parent element and does not handle `textarea` (use `InputGroupTextarea` when the control
  is a textarea). Both the group and the addon use `role="group"`, producing nested groups.

## Overlays and menus

### UI-020 · Dialog opens, labels itself, traps focus, and dismisses predictably

- **Covers:** `Dialog`, `DialogTrigger`, `DialogContent`, `DialogTitle`,
  `DialogDescription`, `DialogClose` — `src/components/ui/dialog.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a dialog with a trigger, title "Edit vendor", description, and the default close
  button
- **When** the trigger is clicked
- **Then** a `role="dialog"` popup appears in the body portal, its accessible name is
  "Edit vendor", the description is associated, and the close button is named "Close"
- **When** Escape is pressed, the close button is clicked, or the backdrop is clicked
- **Then** the dialog closes and focus returns to the trigger
- **Given** `showCloseButton={false}`
- **When** opened
- **Then** no built-in close button is rendered
- **Notes:** verify focus trapping and return with the real base-ui behavior rather than
  asserting `document.activeElement` immediately after a synchronous click. Avoid asserting
  backdrop dismissal if the caller sets `disablePointerDismissal`. `DialogResponsiveContent`
  still uses `data-[state=open]`/`data-[state=closed]` animation selectors while base-ui
  emits `data-open`/`data-closed`; animation-only assertions would be misleading. The
  responsive close button is a raw button, not the shared `Button`.

### UI-021 · AlertDialog distinguishes cancel from the confirming action

- **Covers:** `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`,
  `AlertDialogContent` — `src/components/ui/alert-dialog.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** an alert dialog with title "Delete vendor?", description, a Cancel button, and
  an Action button with spies
- **When** opened
- **Then** a `role="alertdialog"` is named by the title, the description is associated, and
  Escape closes it
- **When** Cancel is clicked
- **Then** the dialog closes and the action spy is not called
- **When** Action is clicked
- **Then** the action spy runs
- **Notes:** `AlertDialogAction` is a plain `Button`, not an `AlertDialogPrimitive.Close`,
  unlike `AlertDialogCancel`; current behavior may leave the dialog open after confirming.
  Decide whether actions auto-close and assert that contract explicitly. Alert dialogs are
  intentionally harder to dismiss than a regular dialog; do not assume backdrop click
  closes.

### UI-022 · Sheet and Drawer expose side, modality, and close semantics

- **Covers:** `Sheet`, `SheetContent`, `SheetTitle`, `SheetClose` —
  `src/components/ui/sheet.tsx`; `Drawer`, `DrawerContent`, `DrawerTitle`,
  `DrawerSwipeHandle` — `src/components/ui/drawer.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a `Sheet` with `side="left"` or `side="right"`, a title, and the default close
  button
- **When** opened
- **Then** the dialog popup carries `data-side`, is named by `SheetTitle`, has a "Close"
  button, traps focus, and closes on Escape
- **Given** a `Drawer` with `modal={true}` and `showSwipeHandle`
- **When** opened
- **Then** an overlay is rendered and the swipe handle is present with `aria-hidden="true"`
- **Given** `modal={false}`
- **When** opened
- **Then** no overlay is rendered
- **Notes:** these are the mobile surfaces behind `Sidebar` and the mobile filter drawers.
  `SheetContent` hides its built-in close button visually in the sidebar via
  `[&>button]:hidden`; the element is still in the tree. Do not assert swipe gestures in
  jsdom; assert structure and dismissal only.

### UI-023 · DropdownMenu supports keyboard selection, checkbox, radio, and submenu items

- **Covers:** `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`,
  `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuSub` —
  `src/components/ui/dropdown-menu.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a trigger and a menu with regular, destructive, checkbox, radio, and submenu
  items
- **When** the trigger is opened and ArrowDown/ArrowUp/Enter are used
- **Then** focus moves through the items, Enter invokes the focused item and closes the
  menu, and the destructive item exposes `data-variant="destructive"`
- **Given** a checkbox item
- **When** toggled
- **Then** `data-checked`/the checked prop changes and the indicator is visible
- **Given** a radio group and a submenu
- **When** an option or the submenu trigger is selected
- **Then** exactly one radio item is checked and ArrowRight opens the submenu
- **Notes:** both the menu content and submenu content unconditionally add the `dark` class,
  forcing dark popover styling even in light mode; decide whether this is intended and
  assert the chosen contract. Assert roles/menu semantics, not positioning classes.

### UI-024 · Command filters items and CommandDialog supplies its modal chrome

- **Covers:** `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandItem`,
  `CommandShortcut`, `CommandDialog` — `src/components/ui/command.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a command palette with grouped items including "Calendar" and "Settings"
- **When** the user types `"cal"`
- **Then** non-matching items are hidden, "Calendar" remains, and the shortcut text stays
  visible
- **Given** a query with no match
- **When** typing completes
- **Then** `CommandEmpty` renders "No results found."
- **When** ArrowDown/Enter are used
- **Then** the focused item's `onSelect` runs
- **Given** `CommandDialog` with the default title/description
- **When** opened
- **Then** a dialog appears with the sr-only title "Command Palette" and description, and
  Escape closes it
- **Notes:** `CommandDialog` renders `DialogHeader` outside `DialogContent`/the portal, so
  the title may not label the actual popup; decide whether to move the header inside the
  content. cmdk filtering is case-insensitive; do not assert internal filter state.

## Navigation and layout

### UI-030 · Sidebar toggles with Ctrl/Cmd+B and exposes expanded state

- **Covers:** `SidebarProvider`, `Sidebar` — `src/components/ui/sidebar.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a desktop viewport (`innerWidth = 1024`, mocked `matchMedia`) and
  `defaultOpen`
- **When** Ctrl+B or Meta+B is pressed on `window`
- **Then** the desktop sidebar's `data-state` flips between `expanded` and `collapsed`,
  `preventDefault` is called, and the listener is removed on unmount
- **Given** `defaultOpen={false}`
- **When** the shortcut is pressed
- **Then** the sidebar expands
- **Notes:** the shortcut does not check the event target, so it also toggles while typing
  in an input or textarea; decide whether to ignore editable targets. A held key can repeat
  and flip the state multiple times. `useIsMobile` is initially false and updates after an
  effect, so wait before asserting. The shortcut is `b`, not the `k` used by command
  palettes.

### UI-031 · SidebarTrigger, Rail, controlled state, and mobile sheet

- **Covers:** `SidebarTrigger`, `SidebarRail`, `SidebarProvider`, `Sidebar` —
  `src/components/ui/sidebar.tsx`; `Sheet` usage
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a controlled provider (`open`, `onOpenChange` spy)
- **When** the `SidebarTrigger` named "Toggle Sidebar" is clicked
- **Then** `onOpenChange(!open)` runs, but the visual state does not change until the
  parent re-renders with the new prop
- **Given** the `SidebarRail`
- **When** inspected and clicked
- **Then** it has `aria-label="Toggle Sidebar"`, `tabIndex={-1}`, and clicking toggles the
  sidebar
- **Given** a mobile viewport (`innerWidth = 767`)
- **When** the trigger is clicked
- **Then** a sheet dialog titled "Sidebar" opens and closing it calls `setOpenMobile(false)`
- **Notes:** desktop and mobile use different state paths (`open` vs `openMobile`); assert
  both. The desktop root is CSS-hidden below `md`, but jsdom still renders it—use
  `useIsMobile` behavior, not `toBeVisible`, to distinguish modes. `SidebarRail` is
  intentionally removed from the tab order.

### UI-032 · SidebarMenuButton exposes active state and collapsed-only tooltip

- **Covers:** `SidebarMenuButton` — `src/components/ui/sidebar.tsx`; `Tooltip` —
  `src/components/ui/tooltip.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a collapsed sidebar and a menu button with `isActive` and `tooltip="Home"`
- **When** the button is hovered or focused
- **Then** the tooltip content "Home" is available, `data-active` is true, and the button
  keeps its configured `data-size`
- **Given** an expanded sidebar or a mobile viewport
- **When** the same button is hovered
- **Then** the tooltip is hidden
- **Notes:** `isActive` sets only `data-active`; it does not set `aria-current="page"`.
  Navigation callers must add `aria-current` themselves. `SidebarMenuButton` uses
  `Tooltip` without a local `TooltipProvider`; tests may need a provider (the app shell
  supplies one). Assert tooltip text presence/absence rather than transition timing.

### UI-033 · Tabs switch panels with pointer and keyboard input

- **Covers:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` —
  `src/components/ui/tabs.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** tabs with a default value and two panels
- **When** a tab is clicked
- **Then** that tab has `data-active`, its panel is visible, the other panel is not, and
  the list exposes `data-variant` (`default`/`line`)
- **When** ArrowRight/ArrowLeft are pressed while a tab is focused
- **Then** focus and selection move according to base-ui's roving tabindex, with only the
  active tab in the tab order
- **Given** `orientation="vertical"`
- **When** rendered
- **Then** the root and list expose vertical orientation and ArrowDown/ArrowUp navigate
- **Notes:** disabled triggers must be skipped and expose `disabled`/`aria-disabled`.
  Assert `data-active` and panel visibility, not the underline pseudo-element.

### UI-034 · Breadcrumb and Pagination expose landmark and current-page semantics

- **Covers:** `Breadcrumb`, `BreadcrumbPage`, `BreadcrumbSeparator` —
  `src/components/ui/breadcrumb.tsx`; `Pagination`, `PaginationLink`,
  `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis` —
  `src/components/ui/pagination.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a breadcrumb with a link, a current page, and a separator
- **When** rendered
- **Then** the nav is named "breadcrumb", the current item has `aria-current="page"` and
  `aria-disabled="true"`, and separators are `role="presentation"`/`aria-hidden`
- **Given** pagination with an active page link, previous, next, and ellipsis
- **When** rendered
- **Then** the nav is named "pagination", the active link has `aria-current="page"`, prev
  and next are named "Go to previous page"/"Go to next page", and the ellipsis is
  `aria-hidden`
- **Notes:** the ellipsis's `aria-hidden` wraps its `sr-only` "More pages" text, so screen
  readers never hear that label; decide whether to move the hidden text outside the
  `aria-hidden` element. `PaginationLink` renders an `<a>` through the Button `render` prop
  with `nativeButton={false}`; assert link semantics, not button semantics.

### UI-035 · Pagination boundary and empty-page behavior are undefined

- **Covers:** `PaginationPrevious`, `PaginationNext`, `PaginationLink`,
  `PaginationEllipsis` — `src/components/ui/pagination.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** the first page, the last page, or a result set with zero pages
- **When** pagination is rendered
- **Then** the current implementation provides no disabled/edge API: previous/next remain
  ordinary links unless the caller omits them, and there is no automatic page-window or
  ellipsis computation
- **Notes:** decide and document the contract: render disabled anchors with
  `aria-disabled="true"` and `tabIndex={-1}`, or require callers to omit boundary links.
  Whichever is chosen, add a test for first page, last page, and zero pages. `PaginationLink`
  forwards arbitrary anchor props, so callers can pass `aria-disabled` today, but no visual
  or keyboard behavior follows from it.

## Data display

### UI-040 · Avatar falls back on image failure and keeps size/badge composition

- **Covers:** `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`,
  `AvatarGroupCount` — `src/components/ui/avatar.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** an avatar with a broken image source and fallback initials "JS"
- **When** the image error event fires
- **Then** the fallback becomes visible and the image is hidden/removed by base-ui
- **Given** `size="sm"`, `"default"`, or `"lg"`
- **When** rendered with a badge or inside an avatar group
- **Then** `data-size` drives the size classes and the badge/group-count elements keep
  their expected slots
- **Notes:** jsdom does not fetch images or fire `error` automatically; dispatch the event
  on the `<img>`. Assert `data-slot`/text, not the ring/blend styling.

### UI-041 · Stat and Status variant contracts

- **Covers:** `Stat`, `StatLabel`, `StatValue`, `StatIndicator`, `StatTrend`,
  `StatDescription`, `StatSeparator` — `src/components/ui/stat.tsx`; `Status`,
  `StatusIndicator`, `StatusLabel` — `src/components/ui/status.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a `Stat` with label "Revenue", value "৳12,500", an indicator, and an upward
  trend
- **When** rendered
- **Then** each child exposes its `data-slot`, the trend exposes `data-trend="up"`, and the
  indicator exposes `data-variant`/`data-color`
- **Given** a `Status` with each variant (`default`, `success`, `error`, `warning`, `info`)
- **When** rendered
- **Then** `data-variant` matches, the label/indicator slots are present, and the indicator
  inherits the variant color contract
- **Given** `render={<a href="..." />}` on `Status`
- **When** rendered
- **Then** the custom element replaces the default `div` while preserving the status
  classes and data attributes
- **Notes:** assert semantic data attributes and cva output rather than hard-coded
  green/blue/orange values. The status palette intentionally carries semantic colors even
  though they are literal Tailwind color utilities.

## Filters and date pickers

### UI-050 · FacetedFilter selection modes, trigger summary, and clear action

- **Covers:** `FacetedFilter`, `FacetedFilterTrigger`, `FacetedFilterContent` —
  `src/components/ui/faceted-filter.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** options with counts and a `selectedValues` set
- **When** an option is selected in multiple mode
- **Then** `onSelect(option, wasSelected)` reports the previous membership, the popover
  stays open, and `CommandInput` is available
- **When** one or two values are selected
- **Then** the trigger shows their badges; with more than two it shows a single
  "`n` selected" badge
- **When** selected values exist and `onReset` is provided
- **Then** "Clear filter" is offered and calls `onReset`
- **Given** `isMultiple={false}`
- **When** an option is chosen
- **Then** no search input is rendered and the popover closes after selection
- **Given** a mobile viewport
- **When** opened
- **Then** the content appears in a drawer titled with the placeholder and a
  "`n` selected" description
- **Notes:** `onSelect` receives `isSelected` for the state **before** the change; the
  story harness inverts it when building the next set. Trigger badges use
  `hidden lg:flex`, but jsdom still finds them—do not use `toBeVisible` for the summary.
  A count of `0` is hidden by `!!option.count`.

### UI-051 · SliderFilter clamps, debounces, and resets the range

- **Covers:** `SliderFilter`, `SliderFilterTrigger` — `src/components/ui/slider-filter.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `min=0`, `max=100`, `debounceMs=300`, and `value={[10, 90]}`
- **When** the slider or number inputs change
- **Then** the displayed range updates immediately, values are clamped so the lower bound
  never exceeds the upper bound and vice versa, and `onValueChange` is called once with the
  clamped tuple after 300 ms
- **When** "Clear filter" is clicked
- **Then** the display resets to `[min, max]` and `onValueChange(undefined)` is called
  immediately
- **Given** a value
- **When** the trigger renders
- **Then** it shows "`from` - `to`" with the optional unit and no range when the value is
  undefined
- **Notes:** clearing does not cancel an already-scheduled debounce; a pending range can
  fire after the reset and overwrite `undefined`. Decide whether `useDebouncedCallback`
  needs a cancel path and test the race with fake timers. The numeric inputs have sr-only
  "from"/"to" labels, but the slider thumbs have no accessible value names; add
  `aria-label`/`getAriaLabel` if the slider is tested directly. The sync effect uses
  `queueMicrotask`, so wrap prop updates in `act`.

### UI-052 · DateFilter single/range modes, apply/cancel, and mobile drawer

- **Covers:** `DateFilter`, `DateFilterTrigger`, `DateFilterContent` —
  `src/components/ui/date-filter.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `isInRange={false}` and a controlled date value
- **When** a day is selected
- **Then** `onValueChange(date)` and `onApply(date)` run and the popover closes
- **Then** the trigger shows the placeholder, a vertical separator, and the formatted date
  in the supplied timezone
- **Given** `isInRange={true}` with a partial or complete range
- **When** days are selected
- **Then** `onValueChange` receives the range but `onApply` does not run until Apply is
  clicked
- **When** Cancel is clicked
- **Then** `onCancel` runs, the popover closes, and `onApply` is not called
- **When** Apply is clicked
- **Then** `onApply(currentValue)` runs and the popover closes
- **Given** controlled `open`/`onOpenChange` and a mobile viewport
- **Then** the trigger is a drawer whose title is the placeholder; desktop uses a popover
- **Notes:** with no `timezone`, dates format in `America/New_York`; pass an explicit
  timezone and freeze the date. Apply forwards the `value` prop, so a parent that does not
  update on `onValueChange` can commit a stale range—test with a controlled harness. In
  range mode the trigger shows a single bound when only one end exists.

### UI-053 · Calendar selects dates, ranges, and keyboard-focused days

- **Covers:** `Calendar`, `CalendarDayButton` — `src/components/ui/calendar.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a single-mode calendar opened to a fixed month
- **When** a day is clicked
- **Then** `onSelect` receives that `Date` and the selected day exposes
  `data-selected-single="true"`
- **Given** range mode with a start and end
- **When** days are selected
- **Then** the start/end days expose `data-range-start`/`data-range-end` and the days
  between expose `data-range-middle`
- **Given** `showOutsideDays` and disabled days
- **When** the grid renders
- **Then** outside days are visible unless disabled and disabled days cannot be selected
- **When** ArrowRight/ArrowLeft are pressed
- **Then** the focused day receives DOM focus via `CalendarDayButton` and the focus ring
  state follows the focused modifier
- **Notes:** react-day-picker's `data-day` value uses `toLocaleDateString(locale.code)`;
  pass a locale or query by accessible day name carefully. `DateFilter` supplies the
  timezone through `calendarProps`; `Calendar` itself is timezone-agnostic. Caption
  dropdowns use abbreviated month labels.

### UI-054 · DateTimePicker confirms the pending date/time and renders booking counts

- **Covers:** `DateTimePicker`, `DateTimePickerContent`, `DateTimePickerTrigger`,
  `DateTimeDayButton` — `src/components/ui/date-time-picker.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `value={null}`, `showTimeSelection={true}`, and a frozen `now`
- **When** the picker opens, a day is chosen, and Done is clicked
- **Then** `onSelectValue` receives the pending `Date`, the popover closes, and selecting a
  day preserves the previously chosen hours/minutes
- **Given** `showTimeSelection={false}`
- **When** opened
- **Then** the time row is absent and the trigger formats the value without a time
- **Given** a `DateTimeDayButton` with a `bookings` map and a timezone
- **When** a day with a positive count renders
- **Then** the count badge appears for the matching `yyyy-MM-dd` key in that timezone and
  is hidden for zero/absent counts
- **Notes:** `pendingDate` is initialized from `value ?? new Date()` at content mount and
  is not re-synced from later `value` changes; closing and reopening should remount the
  content, but controlled-open tests should verify that assumption. `disabled` disables the
  trigger and calendar. The booking badge is only used by stories today, so keep it a
  secondary assertion. Minute selection is limited to five-minute increments (see UI-055).

### UI-055 · DateTimePicker hour/minute selects show the current value

- **Covers:** `HourSelect`, `MinuteSelect`, `MeridiemSelect` —
  `src/components/ui/date-time-picker.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a value whose local hour is 1–9 or whose minute is 0–9 (for example 09:05)
- **When** the picker opens
- **Then** the hour, minute, and meridiem selects should display the value's current time
- **Notes:** this currently fails by construction. `HourSelect` items use values `"1"`…
  `"12"` but passes `value` zero-padded (`"01"`), and `MinuteSelect` items use `"0"`,
  `"5"`, … while passing zero-padded values (`"00"`, `"05"`). Values 10–12 and 10/20/…/50
  happen to match. Also decide whether non-five-minute values are allowed; the options only
  offer 5-minute steps. Fix the value/label mapping (pad the item values or stop padding
  the selected value) and assert 09:05, 12:00 AM, and 12:00 PM explicitly. Meridiem
  conversions use `getHours()`, not the timezone prop.

## Searchable combobox

### UI-060 · SearchableInput opens, navigates, selects, and dismisses options

- **Covers:** `SearchableInput` — `src/components/ui/searchable-input.tsx`; indirect
  coverage in `src/components/form-fields/SearchableInputField.test.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Implemented
- **Given** an empty combobox with two options
- **When** it renders
- **Then** only the combobox is visible and no listbox is mounted
- **When** the user types `"n"`
- **Then** a `listbox` appears with two `option`s, and with `options={[]}` no listbox or
  empty message appears
- **When** ArrowDown is pressed twice and Enter is pressed
- **Then** the second option is selected, the input shows its label, the listbox closes,
  and `onOptionSelect` receives that option
- **When** Escape is pressed while open
- **Then** the listbox closes
- **When** an option is clicked
- **Then** the input fills with its label and the listbox closes
- **When** the user types
- **Then** `onValueChange` receives the typed text, but selecting an option does not call
  `onValueChange` again
- **Notes:** the existing eight `SearchableInputField` tests assert all of the above through
  the form-field wrapper; that is sufficient for this case's behavior. They do not cover
  the direct `disabled`, `onBlur`, `renderOption`, or `inputRef` props, nor debounce timing
  (owned by FF-012 in [components-form-fields.md](./components-form-fields.md)). The
  popup is portaled to `document.body` and positioned from
  `getBoundingClientRect`; jsdom reports zeros, so assert content rather than coordinates.

### UI-061 · SearchableInput active descendant and option ids must agree

- **Covers:** `SearchableInput`, `SearchableInputList`, `SearchableInputItem` —
  `src/components/ui/searchable-input.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** an open listbox with an active option
- **When** the combobox's ARIA attributes are inspected
- **Then** `aria-expanded` is `true`, `aria-controls` equals the listbox `id`, and
  `aria-activedescendant` equals the active option's `id`
- **Notes:** this currently fails. Option ids are built as `` `${id}-${index}` `` using the
  optional consumer `id`, while `aria-activedescendant` is built as
  `` `${listboxId}-${index}` `` using the generated listbox id; when no `id` is passed the
  option ids become `"undefined-0"`. Decide the id strategy (prefer the listbox id for both)
  and add the assertion. The existing tests only assert roles and text, so they pass
  despite the broken relationship. Also verify `aria-selected` follows the active index.

## Known risks

- **Broken combobox active descendant** (UI-061): screen readers cannot follow the
  highlighted option.
- **DateTimePicker time selects** (UI-055): hours 1–9 and minutes 0–9 do not display the
  current value because item values and selected values use different padding.
- **PhoneInput clearing** (FF-010) and country selection: `onChange` ignores empty values,
  and the country popover does not close on select; the trigger has no explicit label.
- **PasswordInput uncontrolled usage** (UI-011): the reveal button is always disabled
  because the component only reads `props.value`.
- **SliderFilter reset race** (UI-051): a pending debounced range can fire after
  "Clear filter" and restore the old range.
- **RefreshButton accessibility/lifecycle** (UI-004): no accessible name on the icon-only
  button and the cooldown timeout is not cleared on unmount.
- **Pagination accessibility** (UI-034/UI-035): the ellipsis's `aria-hidden` suppresses its
  own sr-only text, and boundary/disabled behavior is left to callers.
- **Overlay styling drift** (UI-020/UI-023): responsive dialog animations target
  `data-[state=…]` instead of base-ui's `data-open`/`data-closed`, and dropdown content
  always forces the `dark` class.
