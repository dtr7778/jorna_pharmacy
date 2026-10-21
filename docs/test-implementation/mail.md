# Mail — Test Implementation

Scope: `src/mail/**` — the mail service factory, the `react-email` + `worker-mailer` send
pipeline, the shared email components, and the eight auth templates.

Related documents: [lib.md](./lib.md) owns `src/lib/mail.server.ts` and its env wiring
(LIB-024); [auth.md](./auth.md) owns the call sites in `src/features/auth/auth.server.ts`
(AUTH-054, AUTH-055 and the device-login cases). This document owns the rendering and
delivery contract those callers rely on.

## Source map

| File                                                | Responsibility                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/mail/createMailService.factory.ts`             | Return `new MailService(config)` for a `MailConfig`                                                           |
| `src/mail/Mail.service.tsx`                         | SMTP transport, Message-ID, template rendering, eight `send*Mail` methods                                     |
| `src/mail/components/EmailLayout.tsx`               | `EmailLayout` (preview, header, footer, support link), `EmailHeading`, `EmailInfoCard`, `EmailMetric`         |
| `src/mail/components/EmailButton.tsx`               | `react-email` `Button` with primary styles                                                                    |
| `src/mail/components/EmailLink.tsx`                 | `react-email` `Link` with primary/break-all styles                                                            |
| `src/mail/templates/auth/WelcomeMail.tsx`           | `userName`, `dashboardUrl`                                                                                    |
| `src/mail/templates/auth/EmailVerificationMail.tsx` | `userName`, `verifyUrl`, optional `userAgent`, `ipAddress`                                                    |
| `src/mail/templates/auth/ResetPasswordMail.tsx`     | `userName`, `resetUrl`, optional `ipAddress`                                                                  |
| `src/mail/templates/auth/PasswordChangedMail.tsx`   | `userName`, `changeTimestamp`, `ipAddress`, `deviceInfo`                                                      |
| `src/mail/templates/auth/NewDeviceLoginMail.tsx`    | `userName`, `loginTimestamp`, `deviceInfo`, `browser`, `ipAddress`, `approximateLocation`, `secureAccountUrl` |
| `src/mail/templates/auth/SuspiciousLoginMail.tsx`   | `userName`, `attemptTimestamp`, `ipAddress`, `location`, `deviceInfo`, `secureAccountUrl`                     |
| `src/mail/templates/auth/RoleChangedMail.tsx`       | `userName`, `oldRole`, `newRole`, `changedBy`, `permissionsUrl`                                               |
| `src/mail/templates/auth/AccountLockedMail.tsx`     | `userName`, `lockTimestamp`, `failedAttempts`, `ipAddress`, `unlockUrl`                                       |

All templates also require `appName` and `supportMail`; the service injects both and the
public `send*` option types omit them, so callers cannot set them through the typed API.

`src/lib/mail.server.ts` is the production wiring (`getMail()` maps `VITE_APP_NAME`,
`MAIL_USER`, `MAIL_PASS`, `VITE_MAIL` into `createMailService`). It is owned by
[lib.md](./lib.md) LIB-024; MAIL-001 verifies the same path end-to-end and must not
duplicate LIB-024's env-failure cases.

## Service API inventory

| Method                      | Recipient input | Subject (with `appName = "Jorna"`)                 | Template props supplied by caller                                                                             |
| --------------------------- | --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `sendWelcomeMail`           | `to`            | `Welcome to Jorna`                                 | `userName`, `dashboardUrl`                                                                                    |
| `sendEmailVerificationMail` | `to`            | `Verify your email for Jorna`                      | `userName`, `verifyUrl`, optional `userAgent`, `ipAddress`                                                    |
| `sendPasswordResetMail`     | `to`            | `Reset your password for Jorna`                    | `userName`, `resetUrl`, optional `ipAddress`                                                                  |
| `sendPasswordChangedMail`   | `to`            | `Password changed for Jorna`                       | `userName`, `changeTimestamp`, `ipAddress`, `deviceInfo`                                                      |
| `sendNewDeviceLoginMail`    | `to`            | `New device login detected for Jorna`              | `userName`, `loginTimestamp`, `deviceInfo`, `browser`, `ipAddress`, `approximateLocation`, `secureAccountUrl` |
| `sendSuspiciousLoginMail`   | `to`            | `Suspicious login detected for your Jorna account` | `userName`, `attemptTimestamp`, `ipAddress`, `location`, `deviceInfo`, `secureAccountUrl`                     |
| `sendRoleChangedMail`       | `to`            | `Your role has been changed for Jorna`             | `userName`, `oldRole`, `newRole`, `changedBy`, `permissionsUrl`                                               |
| `sendAccountLockedMail`     | `to`            | `Your Jorna account has been locked`               | `userName`, `lockTimestamp`, `failedAttempts`, `ipAddress`, `unlockUrl`                                       |

Transport contract (`Mail.service.tsx`):

- SMTP is hard-coded to `smtp.gmail.com:587`, `secure: false`, `startTls: true`,
  `authType: ["plain", "login"]`, credentials `{ username: authUser, password: authPass }`.
- `from` is `{ name: appName, email: mailFrom }`.
- `Message-ID` is `<{crypto.randomUUID()}@{mailFrom.split("@").pop()}>`; the same string is
  the method's return value. `worker-mailer`'s own return value is `void` and discarded.
- `sendMailTemplate` awaits `render(component)`, derives `text` with `toPlainText(html)`,
  and forwards the caller's extra `EmailOptions` (`cc`, `bcc`, `reply`, `attachments`, …).
- There is no try/catch anywhere in the service, so render and SMTP failures reject the
  caller's promise.

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 20     |
| **Total**   | **20** |

Existing test files: none under `src/mail/**` as of this draft. Every case below is
`Missing`. No Storybook stories target these templates, so no `story` case exists.

## Test environment and mocks

- Vitest runs these as server-side unit tests in the default `jsdom` project. Nothing is
  mounted in the DOM: assert on the HTML string returned by `await render(<Component />)`
  and on `toPlainText(html)`, not on Testing Library queries.
- Mock the transport, never the network:
  `vi.mock("worker-mailer", () => ({ WorkerMailer: { send: vi.fn() } }))`.
  `WorkerMailer.send` is static and resolves to `void`.
- Stub `crypto.randomUUID` (`vi.stubGlobal("crypto", { randomUUID: () => "<fixed-uuid>" })`)
  so Message-ID assertions are deterministic. Restore it after each case.
- Freeze time with `vi.useFakeTimers()` before rendering. `EmailLayout` reads
  `new Date().getFullYear()`, so an unfrozen clock makes the footer year drift.
- The tests exercise the real `render`/`toPlainText` from `react-email` (v6); do not mock
  the renderer in service tests or the HTML/plain-text assertions become vacuous.
- For MAIL-001, mock `@/lib/env` with synthetic values, call `vi.resetModules()`, then
  dynamically import `@/lib/mail.server`. Never read or copy `.env.local` values. The
  existing LIB-024 already covers factory argument mapping and env-validation failures.
- Suggested locations: `src/mail/Mail.service.test.tsx`,
  `src/mail/components/email-components.test.tsx`, and one
  `src/mail/templates/auth/<Template>.test.tsx` per template. Keep inline string
  assertions preferred over snapshots; if a snapshot is used, exclude the footer year and
  never include real addresses or tokens.
- Use synthetic fixtures only: `appName: "Jorna"`, `mailFrom: "no-reply@jorna.test"`,
  `supportMail: "help@jorna.test"`, URLs on `https://app.jorna.test`.

## Service and wiring

### MAIL-001 · Factory and env wiring produce a configured service

- **Covers:** `createMailService` — `src/mail/createMailService.factory.ts`; `getMail` — `src/lib/mail.server.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `createMailService({ appName, authUser, authPass, mailFrom })`
- **When** the factory returns
- **Then** the result is a `MailService` whose `mailConfig` is the same object and whose
  send methods are functions
- **Given** a mocked `@/lib/env` with distinct `VITE_APP_NAME`, `MAIL_USER`, `MAIL_PASS`,
  and `VITE_MAIL` values, and a mocked `createMailService`
- **When** `getMail()` is called
- **Then** the factory receives exactly
  `{ appName: VITE_APP_NAME, authUser: MAIL_USER, authPass: MAIL_PASS, mailFrom: VITE_MAIL }`
  and its return value is passed through
- **Notes:** cross-reference LIB-024, which owns the env-validation and non-caching
  behavior. This case exists to prove the mail module is reachable through the factory,
  not to repeat env-failure tests. `env` is validated at import time, so reset modules and
  stub before the dynamic import.

### MAIL-002 · Welcome mail delivers the expected envelope and returns its Message-ID

- **Covers:** `sendWelcomeMail`, `sendMail` — `src/mail/Mail.service.tsx`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a service with `appName: "Jorna"`, `mailFrom: "no-reply@jorna.test"`,
  `authUser: "smtp-user"`, `authPass: "smtp-pass"`, a mocked `WorkerMailer.send`, and a
  stubbed `crypto.randomUUID` returning `"11111111-1111-4111-8111-111111111111"`
- **When** `sendWelcomeMail({ to: "jane@example.test", userName: "Jane", dashboardUrl: "https://app.jorna.test/dashboard" })` resolves
- **Then** `WorkerMailer.send` is called once with the Gmail relay config
  (`host: "smtp.gmail.com"`, `port: 587`, `secure: false`, `startTls: true`,
  `authType: ["plain", "login"]`, the configured username/password)
- **Then** the message carries `to: "jane@example.test"`,
  `from: { name: "Jorna", email: "no-reply@jorna.test" }`,
  `subject: "Welcome to Jorna"`, an HTML part containing the dashboard URL, and a
  plain-text part containing the same URL and no HTML tags
- **Then** the resolved value is
  `"<11111111-1111-4111-8111-111111111111@jorna.test>"` and equals the message's
  `headers["Message-ID"]`
- **Notes:** assert `WorkerMailer.send` was called exactly once with two arguments; use
  `expect.objectContaining` for the message because `html`/`text` are large.
  `toPlainText` may add whitespace, so assert with `toContain`, never full-string equality.

### MAIL-003 · Every convenience method sets the documented subject and recipient

- **Covers:** all eight `send*Mail` methods — `src/mail/Mail.service.tsx`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a valid, fully populated option object for each method with
  `to: "jane@example.test"` and `appName: "Jorna"`
- **When** each method is awaited in turn
- **Then** the captured subjects are exactly:
  `Welcome to Jorna`, `Verify your email for Jorna`,
  `Reset your password for Jorna`, `Password changed for Jorna`,
  `New device login detected for Jorna`,
  `Suspicious login detected for your Jorna account`,
  `Your role has been changed for Jorna`, and
  `Your Jorna account has been locked`
- **Then** every captured message has `to: "jane@example.test"` and
  `from.name: "Jorna"`
- **Notes:** table-driven over the eight methods. The suspicious-login subject is the only
  one that says "your … account"; changing that wording is a deliberate contract change,
  not a copy tweak. This case also proves `appName` is injected by the service rather than
  by the caller.

### MAIL-004 · `sendMailTemplate` renders HTML, derives plain text, and forwards options

- **Covers:** `sendMailTemplate` — `src/mail/Mail.service.tsx`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a `WelcomeMail` element rendered through
  `sendMailTemplate("jane@example.test", "Custom subject", element, { cc: "ops@jorna.test" })`
- **When** the call resolves
- **Then** the captured message has `subject: "Custom subject"`, `cc: "ops@jorna.test"`,
  an `html` string containing an anchor whose `href` is the dashboard URL, and a `text`
  string containing "Hello Jane" without markup
- **Then** the `html` and `text` parts are different strings and neither is empty
- **Notes:** this is the only public way to send an ad-hoc template; the typed
  `send*Mail` methods always win over a caller-supplied `to`/`subject` because those are
  assigned after the options spread. `from` cannot be overridden (`SendMailOption` omits
  it and `sendMail` sets it last).

### MAIL-005 · SMTP rejection propagates to the caller

- **Covers:** `sendMail` and the `send*Mail` wrappers — `src/mail/Mail.service.tsx`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `WorkerMailer.send` rejects with `new Error("550 relay denied")`
- **When** `sendPasswordResetMail(...)` is awaited
- **Then** the promise rejects with that same error (message preserved, not wrapped) and
  no Message-ID is returned
- **Then** `WorkerMailer.send` was still called exactly once, so a caller retry cannot be
  mistaken for an at-most-once guarantee
- **Notes:** the service deliberately has no catch. Auth callers run inside
  `runInBackgroundOrAwait`; see AUTH-052/054/055 for whether the rejection is observable.
  Do not "fix" this by asserting a swallowed error — silent loss of security mail is worse.

### MAIL-006 · Missing or malformed mail configuration is a documented decision

- **Covers:** `MailConfig` consumption, `sendMail` domain parsing — `src/mail/Mail.service.tsx`; `getMail` — `src/lib/mail.server.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `authUser: ""`, `authPass: ""`, or `mailFrom: "no-reply"` (no `@`)
- **When** `sendWelcomeMail` is called
- **Then** the desired behavior is one of: the constructor/factory throws a clear
  configuration error before any SMTP call, or env validation guarantees non-empty values
  and the service documents that it trusts them
- **Notes:** current behavior silently sends with blank credentials and builds a
  Message-ID such as `<uuid@no-reply>` or `<uuid@>`. `mailFrom.split("@").pop()` never
  throws, so the failure surfaces only as an SMTP rejection. Decide where validation
  belongs (`createMailService`, `getMail`, or the env schema) and assert that single
  boundary. Do not assert today's permissive behavior as if it were intended.

### MAIL-007 · Caller headers do not collide with the generated Message-ID

- **Covers:** `sendMail` header assembly — `src/mail/Mail.service.tsx`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a caller option object containing
  `headers: { "X-Entity-Ref-ID": "reset-42" }` and `reply: "support@jorna.test"`
- **When** a mail is sent
- **Then** the captured message either contains both `X-Entity-Ref-ID` and `Message-ID`,
  or the implementation explicitly documents that `headers` is reserved and overwritten
- **Then** `reply` is forwarded unchanged
- **Notes:** current code replaces the whole `headers` object with `{ "Message-ID": … }`,
  silently dropping caller headers. `reply`, `cc`, `bcc`, and `attachments` pass through.
  A merge (`{ ...options.headers, "Message-ID": messageId }`) is the likely intended fix;
  ask before implementing either branch so the test encodes the decision.

### MAIL-008 · A render failure aborts the send

- **Covers:** `sendMailTemplate` render step — `src/mail/Mail.service.tsx`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a component function that throws `new Error("render boom")` during render
- **When** `sendMailTemplate("jane@example.test", "Subject", <Boom />)` is awaited
- **Then** the promise rejects with "render boom"
- **Then** `WorkerMailer.send` is never called, because rendering happens before the
  transport call
- **Notes:** `await render(component)` is the first statement after the signature; a
  failure must not produce a subject-only or empty-body email. Restore the mocked
  transport in `afterEach`.

## Templates and shared components

Assertions below render the real component with `await render(...)` and check the
returned HTML strings. Each template has `PreviewProps` used by the email preview tooling;
those fixtures are not tests and are not asserted here.

### MAIL-009 · Welcome mail renders greeting, CTA, fallback link, and support address

- **Covers:** `WelcomeMail` — `src/mail/templates/auth/WelcomeMail.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `userName: "Jane Smith"`, `appName: "Jorna"`,
  `supportMail: "help@jorna.test"`, `dashboardUrl: "https://app.jorna.test/dashboard"`
- **When** the template is rendered
- **Then** the HTML contains the preview text "Welcome! Your account is ready.",
  "Welcome to Jorna", "Hello Jane Smith", a button labelled "Go to Dashboard", and a
  fallback anchor with the same `href`
- **Then** the footer and closing paragraph link to `mailto:help@jorna.test`
- **Notes:** the button and the fallback link must both use `dashboardUrl`; a mismatch
  between them is a real user-facing bug. The heading contains an emoji — assert text
  fragments, not an exact decorated string.

### MAIL-010 · Email verification renders the full verification URL

- **Covers:** `EmailVerificationMail` — `src/mail/templates/auth/EmailVerificationMail.tsx`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** `verifyUrl: "https://app.jorna.test/api/auth/verify-email?token=abc123&callbackURL=%2Fdashboard"`,
  `userName: "John Doe"`, `appName: "Jorna"`, `supportMail: "help@jorna.test"`, plus
  `ipAddress` and `userAgent`
- **When** the template is rendered
- **Then** the HTML contains "Hello John Doe", "Thanks for joining Jorna", a
  "Verify Email" button, and a fallback link whose target preserves the path, `token`,
  and `callbackURL` query values exactly (query separators appear as `&amp;` in HTML but
  must resolve to the same URL)
- **Then** the security block states "This link expires in 24 hours."
- **Notes:** the service passes the better-auth URL through untouched; this template does
  not construct or rewrite it. **Risk:** `emailVerification.expiresIn` is `60 * 60`
  seconds (one hour) in `auth.server.ts`, while the copy (and only when a security block
  is shown) claims 24 hours. Decide whether to fix the copy, always show the expiry, or
  change the server expiry, then update this case. The fixture URL is synthetic.

### MAIL-011 · Verification security details are conditional and independent

- **Covers:** `EmailVerificationMail` props `userAgent` / `ipAddress`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** neither `ipAddress` nor `userAgent`
- **When** the template is rendered
- **Then** no "Security Details", "IP Address:", "Device:", or 24-hour expiry text appears
- **Given** only `ipAddress`, then separately only `userAgent`
- **When** each is rendered
- **Then** the block appears with the supplied line and omits the other line
- **Notes:** the expiry sentence lives inside the `(userAgent || ipAddress)` block, so a
  plain verification email never states an expiry. That coupling is likely unintended;
  see MAIL-010. Use `toContain`/`not.toContain` for each label rather than counting
  elements.

### MAIL-012 · Password reset renders the reset URL, expiry, and optional IP

- **Covers:** `ResetPasswordMail` — `src/mail/templates/auth/ResetPasswordMail.tsx`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** `resetUrl: "https://app.jorna.test/reset-password?token=reset-token"`,
  `userName: "John Doe"`, `appName: "Jorna"`, and no `ipAddress`
- **When** the template is rendered
- **Then** the HTML contains the preview "Reset your password",
  "We received a request to reset your Jorna password", a "Reset Password" button, a
  fallback link with the token URL, and "This link will expire in 1 hour for security
  reasons."
- **Then** the HTML does not contain "Request originated from IP"
- **Given** `ipAddress: "192.0.2.10"`
- **When** rendered again
- **Then** the IP card shows `192.0.2.10`
- **Notes:** the one-hour copy matches `resetPasswordTokenExpiresIn: 60 * 60` in
  `auth.server.ts`. A missing `ipAddress` must not render an empty IP card.

### MAIL-013 · Password-changed mail renders the audit trail

- **Covers:** `PasswordChangedMail` — `src/mail/templates/auth/PasswordChangedMail.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `userName: "John Doe"`, `changeTimestamp: "Oct 25, 2023 at 10:45 AM"`,
  `deviceInfo: "Chrome on Windows"`, `ipAddress: "192.0.2.11"`, `appName: "Jorna"`
- **When** the template is rendered
- **Then** the HTML contains "Password Changed Successfully", "Hello John Doe", the
  timestamp, device, and IP values, and the compromise warning
- **Notes:** the upstream caller passes `Date.now().toString()`, so production emails show
  a raw epoch-millisecond string rather than a formatted date. This template only formats
  nothing; the defect belongs to `auth.server.ts` (see AUTH-055). Do not assert a
  human-readable date here, and flag the raw timestamp when that caller is fixed.

### MAIL-014 · New-device login renders device context and a secure-account CTA

- **Covers:** `NewDeviceLoginMail` — `src/mail/templates/auth/NewDeviceLoginMail.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `loginTimestamp: "Oct 25, 2023 at 9:15 AM"`, `deviceInfo: "MacBook Pro"`,
  `browser: "Safari 17 on macOS"`, `approximateLocation: "Mountain View, CA"`,
  `ipAddress: "198.51.100.7"`,
  `secureAccountUrl: "https://app.jorna.test/dashboard/settings/reset-password"`
- **When** the template is rendered
- **Then** the HTML contains "New Device Login", all five values, a button
  "Secure Your Account", and a fallback link with the same URL
- **Notes:** values are labelled "When", "Device", "Browser/OS", "Location", and
  "IP Address"; assert each label with its value so a row cannot be silently swapped.
  The production URL points at the settings reset-password page, not a dedicated security
  page (AUTH-052 note); keep the fixture aligned with that reality.

### MAIL-015 · Suspicious-login mail renders the blocked-attempt context

- **Covers:** `SuspiciousLoginMail` — `src/mail/templates/auth/SuspiciousLoginMail.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `attemptTimestamp: "Oct 25, 2023 at 2:30 AM"`,
  `location: "Lagos, Nigeria"`, `deviceInfo: "Firefox on Linux"`,
  `ipAddress: "203.0.113.9"`, and a secure-account URL
- **When** the template is rendered
- **Then** the HTML contains "Suspicious Login Attempt", all four values under their
  labels, the "we blocked the sign-in attempt" explanation, a "Secure My Account" button,
  and a fallback link with the same URL
- **Notes:** **Risk:** the copy promises the attempt was blocked, but nothing in this repo
  calls `sendSuspiciousLoginMail` (no production caller), so that promise is untested
  operationally. Wire-up is out of this document's scope; note it when adding a caller.
  The `location` prop is free text and is escaped (MAIL-018).

### MAIL-016 · Role-changed mail shows the old and new role and who changed it

- **Covers:** `RoleChangedMail` — `src/mail/templates/auth/RoleChangedMail.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `oldRole: "User"`, `newRole: "System Admin"`,
  `changedBy: "Super Admin"`,
  `permissionsUrl: "https://app.jorna.test/dashboard/permissions"`
- **When** the template is rendered
- **Then** the HTML contains "Your account permissions have changed", "Hello John Doe",
  "Previous Role" with "User", "New Role" with "System Admin", the actor "Super Admin",
  and a "View Your Permissions" button pointing at the permissions URL
- **Notes:** this template has no plain-link fallback, unlike Welcome/Verify/Reset/Device/
  Suspicious/Locked — decide whether that asymmetry is intentional. `changedBy` is
  emphasized with a `<span>`, not a link. **Risk:** no production caller exists for this
  method.

### MAIL-017 · Account-locked mail renders the failed-attempt count and unlock CTA

- **Covers:** `AccountLockedMail` — `src/mail/templates/auth/AccountLockedMail.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** `failedAttempts: 5`, `lockTimestamp: "Oct 25, 2023 at 11:00 AM"`,
  `ipAddress: "203.0.113.42"`,
  `unlockUrl: "https://app.jorna.test/dashboard"`
- **When** the template is rendered
- **Then** the HTML contains "Account Locked", "5 failed login attempts", the timestamp,
  the IP, an "Unlock My Account" button, and a fallback link with the same URL
- **Notes:** `failedAttempts` is a `number` rendered inside a sentence; assert the digits
  appear adjacent to "failed login attempts". **Risk:** the label "Attacker IP Address"
  asserts intent that the data may not support, and this method has no production caller.
  The unlock URL points at the dashboard, not a tokenized unlock flow — confirm that is
  the intended recovery path.

### MAIL-018 · User-provided values are HTML-escaped in text and attributes

- **Covers:** all templates via `EmailLayout`/`Text`/`EmailLink`; exercise with `WelcomeMail`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** `userName: "<img src=x onerror=alert(1)>"`,
  `appName: "Jorna & <b>Co</b>"`, and a `dashboardUrl` containing a quote and angle
  brackets such as `https://app.jorna.test/dashboard?next="><script>alert(1)</script>`
- **When** the template is rendered and the HTML part is inspected
- **Then** the HTML contains `&lt;img`, `&amp;`, and `&quot;` (or equivalent numeric
  entities) for the injected fragments
- **Then** the HTML does not contain a raw `<img src=x`, a raw `<b>Co</b>`, or a
  `<script>` element originating from the values
- **Then** the plain-text part may preserve the literal characters, since `text/plain`
  does not interpret markup
- **Notes:** this is the security regression guard for every template; `React` escaping
  is the mechanism, so the assertion must check the serialized HTML, not the props.
  Do not weaken it to "no error thrown". `supportMail` is interpolated into `mailto:`
  hrefs, so include one hostile value there if the escape logic is ever centralized.

### MAIL-019 · Layout renders preview text, app header, support link, and a stable year

- **Covers:** `EmailLayout`, `EmailHeading`, `EmailInfoCard` — `src/mail/components/EmailLayout.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the system time is frozen at `2030-01-01T00:00:00Z` and a child component
- **When** `EmailLayout` is rendered with `appName: "Jorna"`,
  `previewText: "Preview line"`, and `supportMail: "help@jorna.test"`
- **Then** the HTML contains "Preview line" in the preview region, "Jorna" in the header,
  "Need help? Contact our support team at", an anchor whose `href` is
  `mailto:help@jorna.test`, and "© 2030 Jorna. All rights reserved."
- **Then** rendering the same tree twice with the clock frozen yields identical HTML
- **Notes:** `EmailLayout` calls `new Date().getFullYear()` directly, so this case must
  freeze time; without it the footer year changes every January. `EmailMetric` is
  exported but unused by all eight templates — keep it out of scope until a template
  consumes it. The footer class `text-mutated-foreground` is a typo for
  `text-muted-foreground` and has no visual effect; assert content, not that class.

### MAIL-020 · EmailButton and EmailLink render anchors and honor overrides

- **Covers:** `EmailButton` — `src/mail/components/EmailButton.tsx`; `EmailLink` — `src/mail/components/EmailLink.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** `<EmailButton href="https://app.jorna.test/dashboard">Go to Dashboard</EmailButton>`
- **When** rendered
- **Then** the HTML contains an `<a>` with that `href`, the label, and the default primary
  classes (`bg-primary`, `text-primary-foreground`, `inline-flex`)
- **Given** `<EmailLink href="https://app.jorna.test/x" className="custom">https://app.jorna.test/x</EmailLink>`
- **When** rendered
- **Then** the anchor keeps the `href` and label and its `class` is `custom`, because the
  spread `{...props}` follows the default `className`
- **Notes:** the override behavior is intentional in the current spread order; if the
  defaults should always win, swap the order and update this case. These components are
  only meaningful inside `EmailLayout`; standalone rendering has no Tailwind compilation,
  so do not assert inlined styles here.
