# Form Field Components — Test Implementation

Scope: `src/components/form-fields/**` — react-hook-form-connected field wrappers used by
feature forms. These tests own the wrapper contract: label/description/error wiring,
`Controller` integration, value modifiers, and the behavior each wrapper adds on top of a
UI primitive.

UI primitives under `src/components/ui/**` are owned by
[components-ui.md](./components-ui.md); a failure isolated to a primitive belongs there.
Form-field tests should mount real primitives rather than mocking them.

## Source map

| File                                                       | Responsibility                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| `src/components/form-fields/InputField.tsx`                | Text input with optional `valueModifier` and `onValueChange` |
| `src/components/form-fields/InputAddonField.tsx`           | Input group with inline-start / inline-end addons            |
| `src/components/form-fields/PasswordInputField.tsx`        | Password input with show/hide toggle                         |
| `src/components/form-fields/PhoneInputField.tsx`           | International phone input; stores E.164                      |
| `src/components/form-fields/SearchableInputField.tsx`      | Combobox backed by caller-supplied async options             |
| `src/components/form-fields/SelectField.tsx`               | Single-select with placeholder and option list               |
| `src/components/form-fields/TextareaField.tsx`             | Multiline text input                                         |
| `src/components/form-fields/CheckboxField.tsx`             | Boolean checkbox with label and description                  |
| `src/components/form-fields/DateTimePickerField.tsx`       | Date/time popover with confirm action                        |
| `src/components/form-fields/SearchableInputField.test.tsx` | Existing tests for the searchable field                      |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 3      |
| Partial     | 1      |
| Missing     | 20     |
| **Total**   | **24** |

Existing test files:

- `src/components/form-fields/SearchableInputField.test.tsx` — 8 tests covering initial
  state, search callback, list visibility, keyboard/click selection, Escape, and
  `onValueChange` semantics.

## Test environment and mocks

- Runs in the Vitest `jsdom` project (`vitest.config.ts`), with `test/setup.ts` providing
  `@testing-library/jest-dom` matchers and automatic `cleanup()`.
- Tests live next to the source as `*.test.tsx` and run with `pnpm test`. Use
  `@testing-library/react` + `@testing-library/user-event`; query by role and accessible
  name, never by the `useId`-generated ids.
- Build a harness with a real `useForm` (`defaultValues`, optional `mode: "onChange"`) and
  pass `control` to the field. Do not mock `react-hook-form` or `Controller`. Expose
  `getValues`, `trigger`, and `formState` in the harness so each case can assert stored
  values and validation state.
- Produce errors either with `rules={{ required: "..." }}` or a zod schema through
  `zodResolver`; assert the rendered message, not the resolver internals.
- Use `userEvent.setup()` for typing/clicking. For debounce assertions use fake timers
  (`vi.useFakeTimers()` plus `advanceTimers: vi.advanceTimersByTime`) so the "no call
  before the delay" assertion is meaningful.
- Freeze the clock with `vi.setSystemTime(new Date(...))` for every date/time case, and
  run date tests with `process.env.TZ = "UTC"` (set in the test or Vitest `env`). Pass
  `timezone="UTC"` to `DateTimePickerField` so formatted strings are deterministic; without
  a UTC process timezone, local-midnight day selection and UTC formatting can disagree.
- `DateTimePicker` calls `window.matchMedia()` from `useIsMobile`, which jsdom does not
  implement. Stub `window.matchMedia` or mock `@/hooks/use-mobile` to return `false`;
  otherwise the field throws during effects.
- Base UI overlays (Select, Popover, portal) may require jsdom stubs for
  `ResizeObserver`, `Element.prototype.scrollIntoView`, and pointer capture
  (`hasPointerCapture` / `releasePointerCapture`). Query portaled content through
  `screen`, since it mounts under `document.body`.
- Phone tests pass `defaultCountry="US"`. `react-phone-number-input` ships its metadata;
  no network or locale mocking is needed.
- No router, Query client, or D1 binding is required for these wrappers.

## InputField

### FF-001 · Label, description, and default value bind to the form field

- **Covers:** `InputField` — `src/components/form-fields/InputField.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a `useForm` harness with `defaultValues: { name: "Napa" }`, `label="Medicine name"`,
  and a description
- **When** the field renders and the user appends " Extra"
- **Then** the textbox is reachable as `getByRole("textbox", { name: "Medicine name" })`, the
  description is visible, the initial value is `"Napa"`, and typing stores `"Napa Extra"`
  via `getValues("name")` while calling `onValueChange` with the same string
- **Notes:** proves the `htmlFor`/`id` association and the `Controller` default-value path.
  The description is a plain `<p>` with no `id` or `aria-describedby`; decide whether to
  link it (see FF-002 notes).

### FF-002 · Required marker plus validation error, and error clears after correction

- **Covers:** `InputField`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a required `name` field with an empty default and the label rendered with
  `requiredField`
- **When** the harness form is submitted
- **Then** the required marker is rendered inside the label, the input has
  `aria-invalid="true"`, and `getByRole("alert")` shows the validation message
- **Given** the user then types a valid value
- **When** validation re-runs
- **Then** the alert disappears and `aria-invalid` becomes `"false"`
- **Notes:** the asterisk is a decorative SVG; assert it via the label subtree, not as text.
  `requiredField` currently sets neither `required` nor `aria-required` on the input, so
  requiredness is not exposed to assistive technology. Decide whether to add
  `aria-required` and extend this case.

### FF-003 · `valueModifier` changes display only, not the stored value

- **Covers:** `InputField`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** `defaultValues: { amount: "1000" }` and
  `valueModifier={(value) => Number(value).toLocaleString("en-US")}`
- **When** the field renders
- **Then** the input displays `"1,000"`
- **When** the user replaces the text with `"2000"`
- **Then** the form stores the raw `"2000"`, `onValueChange` receives `"2000"`, and the
  display becomes `"2,000"`
- **Notes:** the modifier runs in `useMemo` over `field.value`; it is never applied on
  change. Assert the raw value, never the formatted string, for the form contract.

### FF-004 · Disabled field blocks edits and reflects disabled state

- **Covers:** `InputField`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a field with `disabled` and `defaultValues: { name: "Napa" }`
- **When** the user attempts to type
- **Then** the input is disabled, the label has `aria-disabled="true"`, and the form value
  stays `"Napa"`
- **Notes:** `readOnly` is forwarded to the native input but has no wrapper-level handling;
  add a read-only assertion here if read-only money fields are required.

## InputAddonField

### FF-005 · Addons render on both sides while the input still binds to the form

- **Covers:** `InputAddonField` — `src/components/form-fields/InputAddonField.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `firstAddon="৳"`, `secondAddon="/kg"`, and a label
- **When** the field renders and the user types `"12"`
- **Then** two addon groups exist with `data-align="inline-start"` (text `৳`) and
  `data-align="inline-end"` (text `/kg`), the labeled textbox contains `"12"`, the form
  stores `"12"`, and `onValueChange` received `"12"`
- **When** the user clicks the start addon
- **Then** the input receives focus
- **Notes:** DOM order is input then addons; assert by `data-align`, not DOM order. Omitting
  both addon props must render no addon groups. `InputGroupAddon` focuses the input unless
  the click target is a button.

### FF-006 · Addon field error and disabled wiring

- **Covers:** `InputAddonField`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** an invalid field (required, submitted empty) with a description
- **When** the field renders
- **Then** the description is visible, the input has `aria-invalid="true"`, and the error
  message is announced via `role="alert"`
- **Given** a second render with `disabled`
- **When** the user tries to type
- **Then** the input is disabled, the label has `aria-disabled="true"`, clicking an addon
  cannot focus the disabled input, and the value does not change
- **Notes:** `InputGroup` suppresses its invalid ring only through
  `has-[[data-slot][aria-invalid=true]]`; assert the attribute on the inner input. The
  disabled label styling is driven by `aria-disabled`, not the native `disabled` attribute.

## PasswordInputField

### FF-007 · Password is masked by default and the visibility toggle works

- **Covers:** `PasswordInputField` — `src/components/form-fields/PasswordInputField.tsx`
  and `PasswordInput` — `src/components/ui/password-input.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a field with `defaultValues: { password: "secret" }`
- **When** the field renders
- **Then** the input has `type="password"` and the toggle button is named "Show password"
- **When** the toggle is clicked
- **Then** the input has `type="text"` and the button is named "Hide password"
- **When** it is clicked again
- **Then** the input returns to `type="password"` and the value stays `"secret"`
- **Notes:** the toggle is disabled while the value is empty
  (`props.value === "" || undefined`), so seed a value or type before clicking. The
  accessible name comes from the `sr-only` span; icon SVGs are `aria-hidden`.

### FF-008 · Password field validation and disabled state

- **Covers:** `PasswordInputField`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a required password field submitted empty
- **When** the field renders after validation
- **Then** the input has `aria-invalid="true"` and `role="alert"` shows the message
- **Given** a disabled field with an existing value
- **When** the user attempts to type or reveal the value
- **Then** the input and the toggle are disabled, `aria-disabled="true"` is on the label,
  and the form value is unchanged
- **Notes:** typing a valid value must clear both the alert and `aria-invalid`. There is no
  `isDescriptionInfoIconShow` prop on this wrapper even though the other text fields have
  one; do not assert an info icon here.

## PhoneInputField

### FF-009 · Typing a phone number formats the display and stores E.164

- **Covers:** `PhoneInputField` — `src/components/form-fields/PhoneInputField.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `defaultCountry="US"`, a label, and an empty form value
- **When** the user types `2025550123`
- **Then** the tel input displays the national format (`(202) 555-0123`), the form stores
  `+12025550123`, and `onValueChange` is called with `+12025550123`
- **Notes:** formatting belongs to `react-phone-number-input`; assert the stored E.164 value
  as the contract and the formatted value as display. If `user.type` fights the controlled
  formatting, assert the display after `setValue` and keep a separate typing assertion for
  `onValueChange`. `requiredField` is visual only; validation is supplied by the feature
  schema (zod), not this wrapper.

### FF-010 · Clearing a phone number updates the form value

- **Covers:** `PhoneInputField`, `PhoneInput` — `src/components/ui/phone-input.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a phone field with a valid stored value
- **When** the user deletes every digit
- **Then** the form value becomes empty (decide: `""` or `undefined`) and `onValueChange`
  receives that empty value
- **Notes:** current behavior likely fails. `PhoneInput` only calls its `onChange` when the
  incoming value is truthy (`if (value) onChange?.(value)`), so clearing never reaches the
  field and the form keeps the last number. This is a correctness bug for optional phone
  fields. Decide the empty representation, fix the wrapper, then implement this case.

## SearchableInputField

### FF-011 · Only the combobox renders before the user types

- **Covers:** `SearchableInputField` — `src/components/form-fields/SearchableInputField.tsx`
  and `src/components/form-fields/SearchableInputField.test.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Implemented
- **Given** a form with `label="Medicine"`, an empty value, and a non-empty `options` list
- **When** the field renders
- **Then** `getByRole("combobox", { name: "Medicine" })` is visible and no `listbox` exists
- **Notes:** the accessible name proves the `useId` label/input association. The existing
  test "shows only a text input and no list before the user types" covers this.

### FF-012 · Typing calls `onSearch` once after the debounce delay

- **Covers:** `SearchableInputField`, `useDebouncedCallback`
- **Type:** component · **Priority:** P1 · **Status:** Partial
- **Given** an `onSearch` spy and the default debounce (or an explicit non-zero
  `searchDebounceMs`)
- **When** the user types `"nap"` and the debounce elapses
- **Then** `onSearch` is called exactly once with `"nap"` and is not called before the
  delay
- **Notes:** the existing test sets `searchDebounceMs={0}` and only asserts the last call
  with `waitFor`; it proves callback wiring but not debouncing or call count. Add a
  fake-timer case (type, assert no call, advance, assert one call) and then set this to
  `Implemented`.

### FF-013 · List visibility, Escape dismissal, and empty options

- **Covers:** `SearchableInputField`, `src/components/form-fields/SearchableInputField.test.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Implemented
- **Given** two options and an empty form field
- **When** the user types `"n"`
- **Then** a `listbox` appears with two `option`s
- **When** the user presses Escape
- **Then** the listbox is removed
- **Given** `options={[]}`
- **When** the user types `"zzz"`
- **Then** no listbox and no "no results" message is rendered
- **Notes:** covered by the existing tests "opens a list below the input when results are
  returned", "does not open a list when results are empty", and "closes the list when
  Escape is pressed". Known accessibility defect not asserted here: option ids are
  `` `${id}-${index}` `` while `aria-activedescendant` uses `` `${listboxId}-${index}` ``,
  so the active descendant points at a non-existent element.

### FF-014 · Selecting an option fills the field and closes the list

- **Covers:** `SearchableInputField`, `src/components/form-fields/SearchableInputField.test.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Implemented
- **Given** two options and an empty field
- **When** the user types `"nap"` and clicks the "Napa 500" option
- **Then** the combobox shows `"Napa 500"`, the form stores `"Napa 500"`,
  `onOptionSelect` receives that option, the listbox closes, and `onValueChange` is not
  called again by the selection
- **Given** the list is open with no active option
- **When** the user presses ArrowDown twice and then Enter
- **Then** the second option is selected, the combobox shows its label, the listbox closes,
  and `onOptionSelect` receives it
- **Notes:** covered by the existing tests "moves highlight with arrow keys and selects
  with Enter", "reports typed text through `onValueChange` but not when an option is
  picked", and "fills the input and closes the list when an option is clicked".
  `onValueChange` fires only from typing in `SearchableInput.handleOnChange`; selection
  goes through `selectOption` → `onChange` / `onOptionSelect`. ArrowDown while the list is
  closed only requests open and does not set an active index.

### FF-015 · Required, description, error, and disabled contract

- **Covers:** `SearchableInputField`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `requiredField`, a description, and a submitted empty required value
- **When** the field renders
- **Then** the description is visible, the combobox has `aria-invalid="true"`, and
  `role="alert"` shows the validation message
- **Given** a disabled field with options available
- **When** the user types or presses ArrowDown
- **Then** the combobox is disabled, the label has `aria-disabled="true"`, no listbox opens,
  and the form value is unchanged
- **Notes:** the wrapper forwards `aria-invalid` and `disabled` but never sets
  `aria-describedby` for the description or error. Decide whether to add those ids. Do not
  assert a native `required` attribute; only `requiredField`'s visual marker exists.

### FF-016 · Async loading, empty results, and filtering contract

- **Covers:** `SearchableInputField`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a query in flight with `options={undefined}` and then a resolved empty array
- **When** the user types
- **Then** the documented loading affordance is visible while pending, a documented
  "no results" state appears for the empty result, and stale options from a previous query
  are not shown
- **Notes:** this is currently a product decision, not implemented behavior. The component
  derives `isOpen` from `items.length > 0` and renders no loading or empty state; the
  existing tests explicitly assert the absence of an empty message. The field also does
  not filter locally — it renders `options` as supplied and delegates search to
  `onSearch` (see `MedicineSearchableField`). Decide whether to add `isLoading` /
  `emptyMessage` props and whether local filtering is ever expected, then implement.

### FF-017 · Blur closes the list and marks the field touched

- **Covers:** `SearchableInputField`, `SearchableInput` — `src/components/ui/searchable-input.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** an open list after typing and an `onBlur` spy
- **When** the combobox loses focus (Tab or click outside)
- **Then** `onBlur` fires once, `formState.touchedFields[name]` is `true`, and the listbox is
  removed
- **Notes:** `SearchableInput` calls `onBlur()` then `closeList()`, and the field passes
  `field.onBlur`/`field.ref` through `Controller`. Clicking an option uses `onMouseDown`
  `preventDefault`, so selection must not be mistaken for blur.

## CheckboxField

### FF-018 · Checkbox toggling, default, error, and disabled state

- **Covers:** `CheckboxField` — `src/components/form-fields/CheckboxField.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `defaultValues: { active: false }` and `label="Active"`
- **When** the field renders
- **Then** `getByRole("checkbox", { name: "Active" })` is unchecked and the form value is
  `false`
- **When** the user clicks it
- **Then** it is checked, the form value is `true`, and `onValueChange` received `true`
- **When** the user clicks it again
- **Then** it is unchecked and the form value is `false`
- **Given** a second render with `active: true`
- **Then** the checkbox starts checked
- **Given** a required checkbox with a description, submitted untouched
- **When** the field renders after validation
- **Then** the description is visible, the checkbox has `aria-invalid="true"`, and
  `role="alert"` shows the message
- **Given** `disabled`
- **When** the user clicks the checkbox or its label
- **Then** the form value does not change, the checkbox is disabled, and the label has
  `aria-disabled="true"`
- **Notes:** `field.onChange` stores the raw `boolean | "indeterminate"`, while
  `onValueChange` coerces to `checked === true`; if indeterminate is ever enabled these
  diverge and need a decision. `requiredField` only adds the asterisk; no
  `required`/`aria-required` reaches the control. The horizontal layout places the label
  and description in `FieldContent`; assert the accessible name from the label text and
  the association through `htmlFor`/`id`.

## SelectField

### FF-019 · Options, placeholder, and selection bind to the form

- **Covers:** `SelectField` — `src/components/form-fields/SelectField.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `options={[{ value: "kg", label: "Kilogram" }]}`, an empty value, and
  `placeholder="Select unit"`
- **When** the field renders
- **Then** the trigger is a labeled `combobox` showing the placeholder
- **When** the user opens it and selects "Kilogram"
- **Then** the trigger shows "Kilogram", the form stores `"kg"`, and `onValueChange`
  received `"kg"`
- **Given** `defaultValues: { unit: "kg" }`
- **When** the field renders
- **Then** the trigger shows "Kilogram" without interaction
- **Notes:** Base UI renders the popup in a portal; query `role="option"` from `screen`.
  `items={options}` is what lets `SelectValue` map a stored value to its label. Only
  single-select is supported even though `handleValueChange` is typed oddly.

### FF-020 · Select error and disabled state

- **Covers:** `SelectField`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a required select submitted empty with a description
- **When** the field renders after validation
- **Then** the trigger has `aria-invalid="true"`, the error is announced via `role="alert"`,
  and the description is visible
- **Given** `disabled`
- **When** the user clicks the trigger
- **Then** the trigger is disabled, no options open, the label has `aria-disabled="true"`,
  and the form value is unchanged
- **Notes:** the className prop merges with the trigger's `w-full`; layout is not the
  contract. If Base UI focuses options on open, the jsdom pointer-capture stubs listed
  above are required.

## TextareaField

### FF-021 · Textarea binds value, reports errors, and honors disabled

- **Covers:** `TextareaField` — `src/components/form-fields/TextareaField.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `defaultValues: { notes: "Line one" }`, a label, and a description
- **When** the user appends `"\nLine two"`
- **Then** the textbox is reachable by its label, the form stores the full multiline string,
  and `onValueChange` received the same string
- **Given** a submitted required empty value
- **When** the field renders after validation
- **Then** the textarea has `aria-invalid="true"` and `role="alert"` shows the message
- **Given** a disabled textarea
- **When** the user attempts to type
- **Then** the value does not change and the textarea is disabled
- **Notes:** this wrapper has no `valueModifier`; `{...field}` supplies `value` and the
  overridden `onChange` keeps RHF in sync. The description is not linked by
  `aria-describedby`.

## DateTimePickerField

### FF-022 · Placeholder and confirmed selection update the form

- **Covers:** `DateTimePickerField` — `src/components/form-fields/DateTimePickerField.tsx`
  and `DateTimePicker` — `src/components/ui/date-time-picker.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `vi.setSystemTime(new Date("2026-10-20T10:30:00Z"))`, `timezone="UTC"`,
  `showTimeSelection={false}`, an empty value, and `placeholder="Delivery date"`
- **When** the field renders
- **Then** the trigger shows `"Delivery date"` and the form value is empty
- **When** the user opens the picker, selects day 15, and clicks "Done"
- **Then** the day click alone has not changed the form value; after "Done" the form stores
  a `Date` for 2026-10-15, `onValueChange` is called once, the popover closes, and the
  trigger shows the formatted date
- **Notes:** `pendingDate` starts at `value ?? new Date()` and selecting a day preserves the
  previous hours/minutes. Freeze the clock and do not assert the time-of-day unless the
  case sets it. Formatting uses `formatDateWithTimezone` with the supplied timezone.

### FF-023 · Time selection, `showTimeSelection`, and timezone formatting

- **Covers:** `DateTimePickerField`, `DateTimePicker`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a fixed `value`, `showTimeSelection` enabled, and `timezone="UTC"`
- **When** the user changes the hour, minute, and AM/PM selects and confirms
- **Then** the stored `Date` matches the chosen wall-clock time and the trigger text uses
  the `"PP - p"` format in UTC
- **Given** `showTimeSelection={false}`
- **When** the picker opens
- **Then** no hour/minute/AM-PM selects render and the trigger uses the `"PP"` format
- **Notes:** minutes are offered in 5-minute steps; a stored minute that is not a multiple
  of five has no matching option, so decide whether to normalize. The hour/minute selects
  also compare a zero-padded value (`"09"`, `"05"`) against item values that are not padded
  (`"9"`, `"5"`), so single-digit hours/minutes may display no selection; assert the chosen
  values and decide the normalization. The timezone defaults to `America/New_York` when
  omitted. The AM/PM + hour conversion has noon/midnight edge cases worth a table-driven
  assertion.

### FF-024 · Label association, error, and disabled accessibility

- **Covers:** `DateTimePickerField`, `DateTimePicker`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a labeled, required `DateTimePickerField` with a description and a validation
  error, plus a disabled variant
- **When** the field renders
- **Then** clicking the label focuses/opens the picker trigger, the trigger has
  `aria-invalid="true"`, `role="alert"` shows the message, the description is visible, and
  the disabled trigger cannot be opened
- **Notes:** current behavior likely fails the label and `aria-invalid` assertions.
  `fieldId` is passed to `calendarProps.id` (the calendar inside the popover), not to the
  trigger `Button`; `<label htmlFor>` therefore targets an element that is not mounted
  until the popover opens, and clicking the label does nothing. The trigger receives
  `aria-disabled` but never `aria-invalid`. Decide whether the wrapper should expose a
  focusable trigger id and forward invalidity; implement this case only after that fix.

## Known risks and decisions

- **Requiredness is not exposed.** Every wrapper renders an asterisk when `requiredField`
  is set but adds no `required`/`aria-required`; screen-reader users only learn the rule
  after validation.
- **Description and error are not associated.** `FieldDescription` and `FieldError` have no
  ids wired through `aria-describedby`; `role="alert"` announces the error but the field is
  not programmatically linked to it.
- **DateTimePicker trigger is not associated with its label.** `htmlFor` points at the
  calendar id (mounted only while open) instead of the trigger, and the trigger never gets
  `aria-invalid`.
- **Phone numbers cannot be cleared.** The `PhoneInput` wrapper drops falsy values, so
  deleting the last digit leaves the previous number in the form.
- **Searchable active descendant points nowhere.** Option ids and
  `aria-activedescendant` use different prefixes; combobox keyboard users lose the
  announced active option.
- **Consumer `onChange` can override RHF.** Each text wrapper spreads `...props` after its
  internal `onChange`, so a caller-supplied handler replaces the controller handler and
  silently stops form updates. Document or enforce prop precedence.
- **`valueModifier` is display-only.** Form values remain raw; money/format tests must
  assert the raw value.
- **No async feedback.** The searchable field has no loading/empty API and never filters
  locally; that contract is still a product decision (FF-010, FF-016).
