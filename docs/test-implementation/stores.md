# Zustand Stores — Test Implementation

Scope: `src/stores/**` — the auth store factory and React context, and the persisted
settings store.

## Source map

| File                                           | Responsibility                                                                                                                               | Test file                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `src/stores/zustand/auth/authStore.ts`         | Factory for an in-memory auth store (`user`, `session`, `roles`, `permissions`, `isAdminUser`) with a single `addUserData` action            | none                                              |
| `src/stores/zustand/auth/AuthStoreContext.tsx` | `AuthStoreProvider` creates one store per mount; `useAuthStore(selector)` reads it and throws outside the provider                           | none                                              |
| `src/stores/zustand/setting/settingStore.ts`   | Module-level persisted store (`localStorage` key `settings`, version `0`) holding `sidebar.open` with `setSidebarOpen` / `toggleSidebarOpen` | `src/stores/zustand/setting/settingStore.test.ts` |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 3      |
| Partial     | 1      |
| Missing     | 13     |
| **Total**   | **17** |

Existing test files:

- `src/stores/zustand/setting/settingStore.test.ts` — 4 tests: sidebar default,
  `setSidebarOpen`, `toggleSidebarOpen` both directions, and the persisted JSON shape
  under the `settings` key.

## Test environment

- Unit and component tests run in the Vitest `jsdom` project configured in
  `vitest.config.ts`; global setup is `test/setup.ts` (jest-dom matchers plus
  Testing Library `cleanup`). Run with `pnpm test`.
- `useSettingStore` is a module singleton created at import time. Reset it between
  tests with `useSettingStore.setState({ sidebar: { open: true } })` followed by
  `useSettingStore.persist.clearStorage()`, always after `window.localStorage.clear()`.
  Keep that order: `setState` writes to storage through the persist middleware.
- Use `vi.resetModules()` plus a dynamic `import()` when a case needs a genuinely fresh
  store (true initial state, hydration at construction, or SSR import). Re-importing
  also re-runs `createJSONStorage`, which captures `window.localStorage` **once**; a
  store imported earlier will keep using the original `Storage` object if a test later
  swaps `window.localStorage`.
- Hydration with synchronous `localStorage` may complete during import. Prefer writing
  storage, calling `await useSettingStore.persist.rehydrate()`, then asserting, or use
  `persist.hasHydrated()` / `persist.onFinishHydration` instead of assuming timing.
- SSR cases must remove `window` (`vi.stubGlobal("window", undefined)`) before a fresh
  import, then restore with `vi.unstubAllGlobals()`. `settingStore` also imports
  `@/lib/env`, which switches its runtime source to `process.env` when `window` is
  undefined. Mock `@/lib/env` (or set `SKIP_ENV_VALIDATION=true` and stub the required
  variables) so the case fails on store behavior, not environment validation.
- Auth fixtures: `AuthUser` / `AuthSession` are better-auth inferred session types.
  Build a typed fixture factory with the fields a case actually reads and cast the
  remainder (`as AuthUser`); do not depend on the full better-auth payload. Roles use
  `{ roleName }` and permissions use `{ level, resource, action }` from `src/types`.
- For context cases, render consumers with `@testing-library/react` and wrap store
  mutations in `act`. Spy on `console.error` / `console.warn` and restore mocks so
  persist warnings from other tests do not leak.

## Auth store

### STO-001 · Factory seeds state from its arguments

- **Covers:** `authStore` — `src/stores/zustand/auth/authStore.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** distinct fixture values for `user`, `session`, `roles`, `permissions`, and `isAdminUser`
- **When** `authStore(user, session, roles, permissions, isAdminUser)` is created and `getState()` is read
- **Then** all five fields equal the supplied values, `addUserData` is a function, and the store exposes no persistence API
- **Notes:** assert array contents (`roles`, `permissions`) rather than only lengths.

### STO-002 · `addUserData` replaces the user and leaves other slices untouched

- **Covers:** `addUserData` — `src/stores/zustand/auth/authStore.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a store seeded with user A, a session, roles, permissions, and `isAdminUser: true`
- **When** `addUserData(userB)` runs
- **Then** `state.user` equals user B, while `session`, `roles`, `permissions`, and `isAdminUser` keep their previous values and the action remains callable
- **Notes:** the action replaces the whole user object (no field merge). Assert the other slices are unchanged by value; asserting reference identity is optional.

### STO-003 · `isAdminUser` is injected, not derived from roles

- **Covers:** `authStore` — `src/stores/zustand/auth/authStore.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a store created with `roles: [{ roleName: "STAFF" }]` and `isAdminUser: true`
- **When** `addUserData(otherUser)` runs
- **Then** `isAdminUser` remains `true` even though the roles contain no admin role
- **Notes:** documents the current contract: the dashboard computes `isAdminUser` once from route context and the store never recomputes it. If a user's roles can change in-session, decide whether `addUserData` should also refresh roles/`isAdminUser`; until then this is a stale-authorization risk.

## Auth store context

### STO-004 · `useAuthStore` outside the provider throws

- **Covers:** `useAuthStore` — `src/stores/zustand/auth/AuthStoreContext.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a consumer component that calls `useAuthStore((state) => state.user)` rendered without `AuthStoreProvider`
- **When** it renders
- **Then** rendering throws `Error("AuthStoreProvider is not found")`
- **Notes:** there is no global fallback store. Assert the exact message and silence the expected React error output.

### STO-005 · Provider exposes the initial auth slices through selectors

- **Covers:** `AuthStoreProvider` — `src/stores/zustand/auth/AuthStoreContext.tsx`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** the provider mounted with user, session, roles, permissions, and `isAdminUser` fixtures
- **When** a child selects each field with `useAuthStore`
- **Then** the rendered values match the props exactly, including array contents and the admin flag
- **Notes:** also confirm a multi-field selector returns a stable object for unchanged state if consumers rely on that; otherwise select primitives.

### STO-006 · `addUserData` through the hook updates consumers

- **Covers:** `AuthStoreProvider`, `useAuthStore`, `addUserData`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a consumer showing `user.name` with a button that calls `addUserData(updatedUser)`
- **When** the button is clicked inside `act`
- **Then** the rendered name changes to the updated value, `session` / `roles` / `permissions` stay unchanged, and the provider is not remounted
- **Notes:** this is the observable subscription contract of `useStore(store, selector)`; use `userEvent`.

### STO-007 · Provider ignores prop changes after mount

- **Covers:** `AuthStoreProvider` — `src/stores/zustand/auth/AuthStoreContext.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a mounted provider with user A
- **When** it is rerendered with user B and a different `isAdminUser`
- **Then** consumers still see user A and the original admin flag
- **Notes:** the store is created in a `useState` initializer, so props are read once. If session or permissions can change without a remount, this is a staleness bug; decide whether the provider should sync props via an effect and add the case accordingly.

## Settings store

### STO-008 · Default sidebar state is open on a fresh store

- **Covers:** `initialState` — `src/stores/zustand/setting/settingStore.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Partial
- **Given** no persisted `settings` entry in `localStorage`
- **When** a fresh store is created (fresh module import or `getInitialState()`)
- **Then** `sidebar.open` is `true`
- **Notes:** the existing test asserts this **after** `beforeEach` writes `{ open: true }` via `setState`, so it would still pass if the module default changed to `false`. Strengthen it with `useSettingStore.getInitialState().sidebar.open` or an isolated import before any reset.

### STO-009 · `setSidebarOpen` applies the explicit value

- **Covers:** `setSidebarOpen` — `src/stores/zustand/setting/settingStore.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** a reset store with the sidebar open
- **When** `setSidebarOpen(false)` then `setSidebarOpen(true)` run
- **Then** `sidebar.open` is `false` then `true`
- **Notes:** current test covers only the `false` direction; the second call is a cheap addition and makes "explicit value, not toggle" unambiguous.

### STO-010 · `toggleSidebarOpen` flips the value both ways

- **Covers:** `toggleSidebarOpen` — `src/stores/zustand/setting/settingStore.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** a reset store with the sidebar open
- **When** `toggleSidebarOpen()` runs twice
- **Then** `sidebar.open` is `false` after the first call and `true` after the second
- **Notes:** matches the existing test; no other state is touched.

### STO-011 · Sidebar state persists under `settings` with version 0

- **Covers:** `persist` config — `src/stores/zustand/setting/settingStore.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** an empty `localStorage`
- **When** `setSidebarOpen(false)` runs
- **Then** `localStorage["settings"]` exists and parses to an object with `version: 0` and `state.sidebar.open === false`
- **Notes:** the existing test uses `toMatchObject`, so extra keys would not fail. The serialized state contains only data because `JSON.stringify` drops functions; do not claim action exclusion until asserted.

### STO-012 · Persisted sidebar state hydrates into a fresh store

- **Covers:** `persist` hydration — `src/stores/zustand/setting/settingStore.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `localStorage["settings"]` preloaded with `{ version: 0, state: { sidebar: { open: false } } }`
- **When** the store is freshly imported (or `persist.rehydrate()` is awaited after writing)
- **Then** `sidebar.open` is `false` and both actions are still callable
- **Notes:** do not rely on the module singleton already being hydrated. The default merge is shallow, so unknown top-level keys from storage are copied into state; assert the documented shape only.

### STO-013 · Version mismatch without `migrate` keeps defaults and logs

- **Covers:** `persist` versioning — `src/stores/zustand/setting/settingStore.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `localStorage["settings"]` contains `{ version: 1, state: { sidebar: { open: false } } }`
- **When** hydration runs
- **Then** `sidebar.open` stays `true` (the fresh default) and `console.error` is called about a state that cannot be migrated
- **Notes:** `version: 0` and no `migrate` are configured. Also assert the stored entry is not rewritten to the default; decide whether to add a migration if the version is ever bumped.

### STO-014 · Corrupt persisted JSON does not crash hydration

- **Covers:** `persist` hydration — `src/stores/zustand/setting/settingStore.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `localStorage["settings"]` contains `"not-json"`
- **When** the store is imported or rehydrated
- **Then** no exception escapes, `sidebar.open` is the default `true`, and actions still work
- **Notes:** `JSON.parse` failures are swallowed by the persist thenable and hydration completion is not guaranteed; assert state/no-throw, not `hasHydrated()`. Decide whether corrupt entries should be cleared or reported.

### STO-015 · `clearStorage` removes the entry but does not reset state

- **Covers:** `persist.clearStorage` — `src/stores/zustand/setting/settingStore.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a store with `sidebar.open === false` already written to `localStorage`
- **When** `persist.clearStorage()` runs and hydration is attempted again
- **Then** `localStorage["settings"]` is `null`, while in-memory `sidebar.open` remains `false`
- **Notes:** there is no `reset` action; clearing storage is not a state reset. If logout must restore defaults, decide and add an explicit reset action plus cases for it.

### STO-016 · Store creation is safe without `window` / `localStorage`

- **Covers:** `persist` storage creation — `src/stores/zustand/setting/settingStore.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `window` is undefined (SSR) and the module is freshly imported with `@/lib/env` mocked
- **When** the store is created and `setSidebarOpen(false)` runs
- **Then** import does not throw, `sidebar.open` starts `true` and becomes `false` in memory, no storage access occurs, and the persistence API is absent or inert
- **Notes:** `createJSONStorage(() => window.localStorage)` catches the missing `window` once at import and persist falls back to a no-op storage that warns on writes. Assert the fallback behavior rather than assuming a crash. Restore globals and module registry afterwards.

### STO-017 · Settings beyond the sidebar are undefined

- **Covers:** `SettingState` — `src/stores/zustand/setting/settingStore.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the settings store and its persisted payload
- **When** preference coverage is reviewed (theme, density, language, table preferences)
- **Then** only `sidebar.open` exists and no theme or other preference setter is available
- **Notes:** decision needed. If theme/locale preferences are planned, add state, setters, persistence, and hydration cases here; until then, tests must not invent a theme contract. A future `theme` field also affects FOUC/SSR behavior, so decide the storage and default strategy before implementing.
