# Shared Utilities — Test Implementation

Scope: `src/utils/**` — formatting helpers (currency, dates, durations, bytes, enum
labels, initials), the user-image fallback, oRPC error mapping, and the date-range
filter builder.

## Source map

| File                                | Responsibility                                                              |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `src/utils/buildDateRangeFilter.ts` | Turn two optional bound strings into a `{ from, to }` filter or `undefined` |
| `src/utils/formatBytes.ts`          | Human-readable byte size with binary (1024) units                           |
| `src/utils/formatCurrency.ts`       | `en-US` number formatting with a trailing `৳` suffix                        |
| `src/utils/formatDate.ts`           | Format an instant in an IANA timezone via `TZDate` + date-fns               |
| `src/utils/formatDuration.ts`       | Human-readable millisecond duration with unit selection                     |
| `src/utils/formatEnum.ts`           | Snake-case enum value to title-cased label                                  |
| `src/utils/formatOrpcError.ts`      | Map oRPC / unknown errors to `{ type, message, fieldErrors }`               |
| `src/utils/resolveUserImage.ts`     | Fall back to the user placeholder image                                     |
| `src/utils/strInitials.ts`          | Build avatar initials from a display name                                   |

No test files exist for this area yet. Proposed locations, one per source file:
`src/utils/*.test.ts` next to each module (for example
`src/utils/formatCurrency.test.ts`).

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 28     |
| **Total**   | **28** |

Coverage by function:

| Function                 | Cases |
| ------------------------ | ----- |
| `buildDateRangeFilter`   | 3     |
| `formatBytes`            | 3     |
| `formatCurrency`         | 4     |
| `formatDateWithTimezone` | 4     |
| `formatDuration`         | 3     |
| `formatEnumValue`        | 2     |
| `formatOrpcError`        | 4     |
| `resolveUserImage`       | 2     |
| `strInitials`            | 3     |

## Test environment

- Pure unit tests under the default Vitest `jsdom` project; no D1 binding, no network,
  and no component rendering are required.
- No time freezing is needed: every date fixture uses an explicit UTC instant
  (`...Z` or an epoch millisecond value). Never pass a timezone-less string such as
  `"2024-01-01 10:00"` — it is parsed in the process timezone.
- `formatDateWithTimezone` uses `@date-fns/tz`'s `TZDate`, so results are independent
  of the machine timezone. Do not set `process.env.TZ` for these tests.
- `Intl` output comes from the Node ICU build (full ICU in CI and local Node 24). Assert
  exact digits and separators for `en-US`; normalize whitespace before comparing when
  `style: "currency"` is used, because ICU emits `U+00A0` (NBSP) between code and amount.
- `formatOrpcError` relies on `isDefinedError`, which requires a real `ORPCError`
  instance with `defined: true`. Plain object mocks will silently take the generic
  branch; construct errors with `new ORPCError(code, { defined: true, data })`.
- Money assertions compare the returned display string, not floating-point arithmetic.

## Date range filter

### UTL-001 · Two present bounds pass through unchanged

- **Covers:** `buildDateRangeFilter` — `src/utils/buildDateRangeFilter.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `startTime = "2024-01-01T00:00:00.000Z"` and
  `endTime = "2024-01-31T23:59:59.999Z"`
- **When** `buildDateRangeFilter(startTime, endTime)` runs
- **Then** it returns `{ from: startTime, to: endTime }` with both strings unchanged
- **Notes:** the helper only packages values; it performs no parsing, reordering, or
  timezone conversion. The purchase contracts later coerce these strings with
  `z.coerce.date()`, so returning strings is intentional.

### UTL-002 · Any missing or empty bound yields `undefined`

- **Covers:** `buildDateRangeFilter`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the pairs `(undefined, iso)`, `(iso, undefined)`, `(null, null)`,
  `("", iso)`, `(iso, "")`, and `("", "")`
- **When** `buildDateRangeFilter` runs on each pair
- **Then** every pair returns `undefined`
- **Notes:** `""` is treated as absent because the guard is a falsy check. A
  whitespace-only string such as `" "` is truthy and therefore produces a range —
  assert this so the boundary is explicit.

### UTL-003 · Malformed bounds are delegated, not rejected

- **Covers:** `buildDateRangeFilter`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `startTime = "not-a-date"` and `endTime = "2024-01-31"`
- **When** `buildDateRangeFilter` runs
- **Then** it still returns `{ from: "not-a-date", to: "2024-01-31" }`
- **Notes:** open decision. Today the helper never validates shape and never expands a
  date-only `to` to end-of-day; invalid input surfaces later as an oRPC validation
  error from `z.coerce.date()`. Either document that delegation or make the helper
  return `undefined`/throw for malformed values, and cover the chosen contract. Also
  decide whether date-only bounds must be normalized before reaching the server.

## Byte formatting

### UTL-004 · Zero and sub-kilobyte values use the `Bytes` unit

- **Covers:** `formatBytes` — `src/utils/formatBytes.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `0`, `1`, and `1023`
- **When** `formatBytes` runs with default decimals
- **Then** the results are `"0 Bytes"`, `"1 Bytes"`, and `"1023 Bytes"`
- **Notes:** `0` short-circuits before the logarithm. The label is always plural
  (`"1 Bytes"`), which is a display polish decision rather than a bug.

### UTL-005 · Binary unit boundaries from KB through PB

- **Covers:** `formatBytes`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `1024`, `1536`, `1024 ** 2`, `1024 ** 3`, `1024 ** 4`, and `1024 ** 5`
- **When** `formatBytes` runs
- **Then** the results are `"1 KB"`, `"1.5 KB"`, `"1 MB"`, `"1 GB"`, `"1 TB"`, and
  `"1 PB"`
- **Notes:** units are binary (1024), not SI (1000). Trailing zeros disappear because
  the scaled value is passed through `parseFloat`. Unit choice uses
  `floor(log(bytes) / log(1024))`, so `1024 ** 4 - 1` renders as `"1024 GB"` instead
  of rolling over to `"1 TB"` — assert this boundary artifact or fix it deliberately.

### UTL-006 · Decimals and invalid byte counts are unguarded

- **Covers:** `formatBytes`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `formatBytes(1536, 0)`, `formatBytes(1536, -1)`, `formatBytes(-1)`,
  `formatBytes(NaN)`, and `formatBytes(Infinity)`
- **When** the helper runs
- **Then** the first two return `"2 KB"`, and the invalid counts return
  `"NaN undefined"`
- **Notes:** negative `decimals` clamps to `0`; no guard exists for negative or
  non-finite `bytes`, so the unit lookup yields `undefined`. The docblock claims a
  default of `1` decimal while the signature defaults to `2` — align the comment or
  the code. Decide whether invalid input should return a placeholder or throw.

## Currency formatting

### UTL-007 · Default formatting groups thousands and appends `৳`

- **Covers:** `formatCurrency` — `src/utils/formatCurrency.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `1234.5`, `1234.5678`, `0.005`, `1000`, and `0`
- **When** `formatCurrency` runs with no options
- **Then** the results are `"1,234.5 ৳"`, `"1,234.568 ৳"`, `"0.005 ৳"`,
  `"1,000 ৳"`, and `"0 ৳"`
- **Notes:** money columns store `real` values, so display is not forced to two
  decimals; `Intl.NumberFormat` caps fractions at three digits. The locale is hard
  coded to `en-US` while the symbol is BDT. If pharmacy display requires
  `1,234.50 ৳`, that is a code change and this case must be updated.

### UTL-008 · `Intl.NumberFormatOptions` are forwarded

- **Covers:** `formatCurrency`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{ minimumFractionDigits: 2, maximumFractionDigits: 2 }`
- **When** `formatCurrency(1234.5, options)` runs
- **Then** it returns `"1,234.50 ৳"`
- **Notes:** also cover `{ style: "currency", currency: "BDT" }`, which produces
  `"BDT 1,234.50 ৳"` (NBSP before the amount) — a double currency marker. Decide
  whether `style`/`currency` should be ignored or supported, and normalize whitespace
  in the assertion. Options are spread after the empty default object, so callers can
  override formatting entirely, including `useGrouping: false`.

### UTL-009 · Negative and zero amounts render as-is

- **Covers:** `formatCurrency`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `-1234.5`, `-0.01`, and `0`
- **When** `formatCurrency` runs
- **Then** the results are `"-1,234.5 ৳"`, `"-0.01 ৳"`, and `"0 ৳"`
- **Notes:** there is no absolute value or sign handling. Callers that must not show a
  negative balance clamp with `Math.max(value, 0)`; this helper should not silently
  do so, but the contract needs a decision. Assert the minus sign exactly (ICU uses
  ASCII `-` in `en-US` for this version).

### UTL-010 · `NaN` and `Infinity` are rendered instead of rejected

- **Covers:** `formatCurrency`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `NaN` and `Infinity`
- **When** `formatCurrency` runs
- **Then** the results are `"NaN ৳"` and `"∞ ৳"`
- **Notes:** open decision. A failed money calculation currently surfaces as
  `"NaN ৳"` in the UI. Either guard in the helper (return `"—"` or throw) or document
  that callers validate first; cover the chosen behavior.

## Date and timezone formatting

### UTL-011 · Formats an instant in the requested timezone across a date boundary

- **Covers:** `formatDateWithTimezone` — `src/utils/formatDate.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `new Date("2024-01-01T02:00:00.000Z")` and the pattern
  `"yyyy-MM-dd HH:mm"`
- **When** formatted in `"America/New_York"` and in `"Asia/Dhaka"`
- **Then** the results are `"2023-12-31 21:00"` and `"2024-01-01 08:00"`
- **Notes:** proves the output follows the requested zone, not the process zone, and
  that the calendar date can move backwards. Add one assertion with a `PPP p` pattern
  and a `locale` option from `date-fns/locale` to cover `FormatOptions` pass-through.

### UTL-012 · Falsy timezone falls back to `America/New_York` for all input forms

- **Covers:** `formatDateWithTimezone`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the same instant as a `Date`, an ISO string, and an epoch millisecond
  number, each paired with `undefined`, `null`, and `""` as the timezone
- **When** formatted with `"yyyy-MM-dd HH:mm"`
- **Then** all combinations return `"2023-12-31 21:00"`
- **Notes:** `""` is falsy and takes the fallback. The docblock refers to a
  `DEFAULT_TIMEZONE` constant that does not exist; the value is a literal in the
  function. Define the constant or fix the comment.

### UTL-013 · DST boundaries resolve to the correct offset

- **Covers:** `formatDateWithTimezone`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `2024-03-10T06:30:00Z`, `2024-03-10T07:30:00Z`, and
  `2024-11-03T05:30:00Z` in `"America/New_York"`
- **When** formatted with `"yyyy-MM-dd HH:mm XXX"`
- **Then** the results are `"2024-03-10 01:30 -05:00"`,
  `"2024-03-10 03:30 -04:00"`, and `"2024-11-03 01:30 -04:00"`
- **Notes:** covers the spring-forward gap and the repeated fall-back hour. `TZDate`
  resolves the ambiguous local `01:30` to the earlier (EDT) occurrence; if the
  business needs the later occurrence, that must be explicit.

### UTL-014 · Empty pattern and invalid dates throw `RangeError`

- **Covers:** `formatDateWithTimezone`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `formatStr = ""` and, separately, `dateValue = new Date("nope")`
- **When** `formatDateWithTimezone` runs
- **Then** the empty pattern throws `RangeError` with the message
  `"formatDateWithTimezone: formatStr is required and cannot be empty."`, and the
  invalid date throws `RangeError` with `"Invalid time value"`
- **Notes:** the first error is intentional and has a custom message; the second comes
  from date-fns and is not wrapped. Open decision: a bad date currently crashes render
  code — return a placeholder or let callers guard. Note that `new Date("2024-02-30")`
  does **not** throw; it normalizes to March 1, so this helper cannot detect every
  invalid calendar date.

## Duration formatting

### UTL-015 · The largest fitting unit is selected

- **Covers:** `formatDuration` — `src/utils/formatDuration.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `500`, `1500`, `65_000`, `3_600_000`, and `86_400_000`
- **When** `formatDuration` runs with default decimals
- **Then** the results are `"500 ms"`, `"1.5 s"`, `"1.08 min"`, `"1 h"`, and `"1 d"`
- **Notes:** matches the docblock examples. Units are ms, s, min, h, d; anything above
  one day stays in days (for example 2 days is `"2 d"`), there is no week/month unit.

### UTL-016 · Values are rounded after unit selection

- **Covers:** `formatDuration`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `999`, `1000`, `59_999`, `60_000`, `formatDuration(1500, 0)`, and
  `formatDuration(1500, -1)`
- **When** the helper runs
- **Then** the results are `"999 ms"`, `"1 s"`, `"60 s"`, `"1 min"`, `"2 s"`, and
  `"2 s"`
- **Notes:** `59_999` becomes `"60 s"` rather than `"1 min"` because the unit is chosen
  before `toFixed`. Negative `decimals` clamps to `0`. Decide whether the `60 s`
  artifact is acceptable, since it appears in latency-style output.

### UTL-017 · Zero, negative, `NaN`, and `Infinity` inputs

- **Covers:** `formatDuration`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `0`, `-1`, `NaN`, and `Infinity`
- **When** the helper runs
- **Then** the results are `"0 ms"`, `"0 ms"`, `"0 ms"`, and `"Infinity d"`
- **Notes:** zero, falsy, and negative values collapse to `"0 ms"`; `Infinity` leaks
  through the unit search and prints an unreal unit value. Add a finiteness guard or
  document that callers must pass finite durations.

## Enum labels

### UTL-018 · Snake case becomes title-cased words

- **Covers:** `formatEnumValue` — `src/utils/formatEnum.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `"PENDING"`, `"PARTIALLY_PAID"`, `"already_lower"`, and `"ÉCLAIR"`
- **When** `formatEnumValue` runs
- **Then** the results are `"Pending"`, `"Partially Paid"`, `"Already Lower"`, and
  `"Éclair"`
- **Notes:** the whole string is lowercased before word capitalization, so acronyms
  such as `"NGO"` become `"Ngo"`. Only `_` is a separator; camelCase is not split
  (`"camelCase"` becomes `"Camelcase"`). If a role label relies on acronyms, add an
  explicit mapping rather than relying on this helper.

### UTL-019 · Empty and repeated separators are preserved

- **Covers:** `formatEnumValue`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `""`, `"A__B"`, `"_LEADING"`, and `"A_"`
- **When** `formatEnumValue` runs
- **Then** the results are `""`, `"A  B"`, `" Leading"`, and `"A "`
- **Notes:** there is no trimming or empty-segment collapsing, so a malformed enum
  produces visible extra spaces. Open decision: normalize separators for display, or
  rely on the enum contract. The parameter is typed `string`; a runtime `null` would
  throw and is not handled.

## oRPC error mapping

### UTL-020 · Defined validation errors map to a validation result

- **Covers:** `formatOrpcError` — `src/utils/formatOrpcError.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `new ORPCError("INPUT_VALIDATION_FAILED", { defined: true, data: { fieldErrors: { email: ["Invalid email"], name: ["Required", "Too short"] } } })`
- **When** `formatOrpcError` runs
- **Then** it returns `type: "validation"`, `message: "Input validation failed"`, and
  `fieldErrors` of `[{ fieldName: "email", message: "Invalid email" }, { fieldName: "name", message: "Required" }]`
- **Notes:** only the first message per field is kept, and field order follows
  `Object.entries` insertion order, which the form maps onto `setError`. Construct a
  real `ORPCError`; a plain object fails the `instanceof` check.

### UTL-021 · Empty message arrays and empty field maps fall back safely

- **Covers:** `formatOrpcError`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a defined validation error with `fieldErrors: { email: [], name: [""] }`
  and another with `fieldErrors: {}`
- **When** `formatOrpcError` runs
- **Then** the first yields message `"Input validation error"` for both fields, and the
  second yields `type: "validation"` with `fieldErrors: []`
- **Notes:** `Array.isArray(messages) && messages[0]` is the fallback condition, so an
  empty string message also falls back. A validation result with no fields is not
  converted to a general error; the calling hook only invokes
  `onValidationErrors` when the array is non-empty.

### UTL-022 · A validation error without `fieldErrors` throws

- **Covers:** `formatOrpcError`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `new ORPCError("INPUT_VALIDATION_FAILED", { defined: true })` (data
  `undefined`) and the same with `data: {}`
- **When** `formatOrpcError` runs
- **Then** it throws `TypeError: Cannot convert undefined or null to object`
- **Notes:** open decision. This is the error-handling path, so a malformed server
  error turns a toast into an unhandled exception. Either guard with
  `error.data?.fieldErrors ?? {}` or enforce the payload at the throw site. When fixed,
  update the expected outcome rather than deleting the case.

### UTL-023 · General and non-oRPC errors preserve their messages

- **Covers:** `formatOrpcError`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a defined `NOT_FOUND` error with message `"Vendor not found"`, a
  non-defined `INPUT_VALIDATION_FAILED` error, `new Error("boom")`, `new Error("")`,
  and the non-Error values `"oops"`, `null`, and `42`
- **When** `formatOrpcError` runs on each
- **Then** the defined error and `Error("boom")` return `type: "general"` with their
  messages; the non-defined validation code returns `"INPUT_VALIDATION_FAILED"`;
  `Error("")` returns an empty message; all non-Error values return
  `"An unexpected error occurred"`
- **Notes:** `isDefinedError` requires both `instanceof ORPCError` and
  `defined === true`. A non-defined `INPUT_VALIDATION_FAILED` is therefore **not**
  treated as validation and loses its field errors. JSON-decoded or plain-object
  errors also fall through. The `error.message || "An error occurred"` fallback only
  applies to oRPC errors; an empty `Error` message is returned as-is.

## User image resolution

### UTL-024 · Truthy image strings pass through unchanged

- **Covers:** `resolveUserImage` — `src/utils/resolveUserImage.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `"/uploads/user-1.png"`, a `data:image/png;base64,...` URL, and `"  "`
- **When** `resolveUserImage` runs on each
- **Then** each input is returned exactly as provided
- **Notes:** no trimming, URL validation, or protocol restriction. A whitespace-only
  string is truthy and reaches `<img src>` unchanged, which the UI will treat as a
  broken image rather than showing the fallback.

### UTL-025 · Null, undefined, and empty values use the placeholder

- **Covers:** `resolveUserImage`, `USER_PLACEHOLDER_IMAGE`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `null`, `undefined`, and `""`
- **When** `resolveUserImage` runs on each
- **Then** it returns `USER_PLACEHOLDER_IMAGE`, which is
  `"/user_placeholder_img.png"`
- **Notes:** assert against the exported constant instead of duplicating the literal,
  and separately assert the constant value so a renamed/missing public asset is
  caught. The fallback is used for both avatar images and profile views.

## Initials

### UTL-026 · Default output uses the first letter of up to two words

- **Covers:** `strInitials` — `src/utils/strInitials.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `"Saiful Islam"`, `"saiful islam"`, `"A B C"`, and `"Éclair Test"`
- **When** `strInitials` runs with the default length
- **Then** the results are `"SI"`, `"SI"`, `"AB"`, and `"ÉT"`
- **Notes:** initials are upper-cased after joining, so lower-case names work. The
  result is sliced to two characters by default, not two graphemes.

### UTL-027 · Single-word, empty, and whitespace-heavy names

- **Covers:** `strInitials`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `"Saiful"`, `""`, `"   "`, `"  Leading"`, and `"saiful  islam"`
- **When** `strInitials` runs
- **Then** the results are `"S"`, `""`, `""`, `"L"`, and `"SI"`
- **Notes:** splitting on a single space produces empty segments whose `[0]` is
  `undefined`; `join` drops them, so there is no throw and no stray text. Back-to-back
  spaces therefore collapse in the output even though they were not trimmed.

### UTL-028 · Length truncates after assembly, including negative and multibyte edges

- **Covers:** `strInitials`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `("A B C", 1)`, `("A B C", 0)`, `("A B C", -1)`, `("A B C", 10)`, and
  `("😀 Test")` with the default length
- **When** `strInitials` runs
- **Then** the results are `"A"`, `""`, `"AB"`, `"ABC"`, and `"\uD83DT"`
- **Notes:** a negative length hits `String.prototype.slice(0, -1)` and drops the last
  character instead of returning empty. Emoji names are sliced by UTF-16 code unit, so
  the default length returns a lone high surrogate plus the next initial — malformed
  output. Decide whether to clamp `length` and use grapheme segmentation
  (`Intl.Segmenter`) for non-BMP names. Do not delete this case if the behavior is
  fixed; update the expectations.

## Open decisions

- `formatCurrency` never forces two decimals and can emit a second currency marker
  when callers pass `style: "currency"`; locale (`en-US`) and currency (BDT) are mixed.
- `formatBytes` and `formatDuration` accept non-finite/negative numbers without a
  guard; `formatDateWithTimezone` throws on invalid dates inside render paths.
- `formatOrpcError` throws when a defined validation error lacks `fieldErrors`, and
  ignores non-defined `INPUT_VALIDATION_FAILED` errors entirely.
- `strInitials` is not grapheme-safe and accepts a negative length.
- `buildDateRangeFilter` performs no validation or end-of-day normalization; the
  calling oRPC contract is the only validator.
