---
description: "Task breakdown for R01 Platform Foundation & Application Shell"
---

# Tasks: R01 — Platform Foundation & Application Shell

**Input**: Design documents from `/specs/001-platform-app-shell/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests ARE included — explicitly requested in the feature specification and required by Constitution Principle V (test-backed development) and NFR-005 (all shell behavior verifiable through automated tests).

**Organization**: Tasks are grouped by user story (US1–US9, priority order) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions; paths follow `plan.md` (`apps/web`, `apps/api`, `packages/contracts`)

**Scope guard**: R01 only. No authentication, chat, projects, Teacher, files, Knowledge, Voice, Memory, Admin, billing, or AI provider logic. Reserved module slots are inert seams.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo initialization per `plan.md` (pnpm workspace: `apps/web`, `apps/api`, `packages/contracts`).

- [ ] T001 Create monorepo workspace root config in `pnpm-workspace.yaml`, root `package.json`, and `tsconfig.base.json` per plan.md Project Structure
- [ ] T002 [P] Initialize web app in `apps/web` (Vite + React 19 + TypeScript + React Router 7) with Vitest, React Testing Library, jest-axe, and Playwright configured in `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/tests/e2e/`
- [ ] T003 [P] Initialize api app in `apps/api` (Python 3.12 + FastAPI) with `pyproject.toml` and `apps/api/tests/` configured for pytest
- [ ] T004 [P] Initialize contracts package in `packages/contracts` as a dependency-free TypeScript package (`packages/contracts/package.json`, `packages/contracts/src/index.ts`)
- [ ] T005 [P] Configure linting, formatting, and workspace scripts in root `package.json`; add `python -m compileall apps/api` as a validation script (Constitution Principle V Python gate)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared contracts, externalized resources, and persistence that every user story depends on. MUST complete before any user story work.

- [ ] T006 [P] Define `ShellMode` contract in `packages/contracts/src/shell-mode.ts` with exactly two enum values `public` and `authenticated` (verbatim from data-model.md: `ShellMode ::= "public" | "authenticated"`) — FR-042, FR-053
- [ ] T007 [P] Define `ModuleId` and `NavigationDestination` contracts in `packages/contracts/src/navigation.ts`; `NavigationDestination` fields: `id`, `moduleId`, `labelKey`, `routePath`, `availability ("reserved" | "available")`, `visibilityScope ("public" | "authenticated")`; `ModuleId` has exactly 12 values: `GENERAL_CHAT`, `CONVERSATIONS`, `PROJECTS`, `PRIVATE_TEACHER`, `FILES`, `SEARCH`, `SETTINGS`, `ADMIN_CONTROL_CENTER`, `KNOWLEDGE`, `MEMORY`, `VOICE`, `AI_MODEL_GATEWAY` (the last four are reserved seams with no destination in R01) — FR-011, FR-053, FR-056
- [ ] T008 [P] Define `ViewportClass` contract in `packages/contracts/src/viewport.ts` with enum values `mobile`, `tablet`, `desktop` and fixed boundaries (verbatim from data-model.md: mobile `< 768px`, tablet `768–1023px`, desktop `≥ 1024px`), resolved from viewport width only, never pointer type — FR-016, A-02
- [ ] T009 [P] Define `ThemeMode` (`light`, `dark`, `system`) and `ResolvedTheme` (`light`, `dark`) contracts in `packages/contracts/src/theme.ts` — FR-029, FR-053
- [ ] T010 [P] Define `Direction` (`rtl`, `ltr`) and `Locale` (`fa`, `ar`, `en`) contracts in `packages/contracts/src/direction.ts` with locale→direction map verbatim from data-model.md: `fa → rtl`, `ar → rtl`, `en → ltr` — FR-023, FR-061, FR-053
- [ ] T011 [P] Define `FeatureAvailability` contract in `packages/contracts/src/feature-availability.ts` — availability map keyed by `ModuleId`; all eight module entries are `reserved` in R01 — FR-013, FR-050, FR-056
- [ ] T012 Create externalized string resources in `apps/web/src/i18n/fa.json`, `apps/web/src/i18n/ar.json`, `apps/web/src/i18n/en.json` covering at minimum: product name, region labels, the eight destination labels, sign-in/sign-up entry points, and message text for every shell state (loading, empty, error, unavailable, offline) — FR-028
- [ ] T013 [P] Create theme design tokens in `apps/web/src/themes/` using CSS custom properties switched by a `data-theme` attribute on the application root; token set covers sidebar, header, main, drawer, and all shell states; both Light and Dark token sets assert ≥ 4.5:1 contrast for normal text — FR-030, FR-041, FR-052
- [ ] T014 [P] Implement structured browser logger in `apps/web/src/logger/` that logs shell state changes (mode, viewport class, theme, direction, sidebar, offline) with structured fields and MUST NOT log credentials, secrets, or sensitive user data — NFR-006, observability
- [ ] T015 Implement `ShellPreferences` persistence in `apps/web/src/providers/ShellPreferences.ts` using `localStorage` keys verbatim from data-model.md: `mahak.shell.theme`, `mahak.shell.direction`, `mahak.shell.sidebar`, `mahak.shell.locale`; first-visit defaults with nothing saved: theme `system`, direction derived from active locale; keys are shell-namespaced and later features MUST NOT write them — FR-008, FR-032, FR-060, FR-061
- [ ] T016 [P] Implement FastAPI app bootstrap in `apps/api/src/mahak_api/main.py` with versioned route prefix `/api/v1` and no embedded secrets or credentials — FR-055, NFR-006
- [ ] T017 Implement `GET /api/v1/shell` in `apps/api/src/mahak_api/routes/shell.py` returning per `contracts/api.md`: `apiVersion`, `shellMode` (resolves `public` as the R01 default), `features` (all eight values `reserved`), and `locales` (`supported: ["fa","ar","en"]`, direction map `fa→rtl, ar→rtl, en→ltr`); response MUST NOT contain credentials, secrets, tokens, provider keys, or user data — FR-055, NFR-006
- [ ] T018 [P] Write api contract test in `apps/api/tests/test_shell_contract.py` asserting the `/api/v1/shell` response shape and values per `contracts/api.md`, including that no credential or secret field is present — FR-055, NFR-005

**Checkpoint**: Foundation ready — contracts package, i18n resources, themes, logger, preferences, and the api shell endpoint all exist and pass their tests. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Core Application Shell Regions (Priority: P1) 🎯 MVP

**Goal**: One coherent application frame with exactly three stable, distinguishable regions (sidebar/navigation, header, main content).

**Independent Test**: Render the shell with no feature content loaded; a reviewer can point to the navigation area, the header area, and the main content area, each keeping a stable, predictable position; the main area shows a defined empty state.

### Tests for User Story 1

> Write these FIRST, ensure they FAIL before implementation.

- [ ] T019 [P] [US1] Component test in `apps/web/tests/component/AppShell.test.tsx`: rendering the shell shows exactly one sidebar region, one header region, and one main content region, each visually distinguishable — FR-001, FR-002
- [ ] T020 [P] [US1] Component test in `apps/web/tests/component/MainRegion.test.tsx`: when the main content area has no feature content, a defined empty state is shown inside the main area, not a blank or broken page — FR-002, FR-048

### Implementation for User Story 1

- [ ] T021 [US1] Implement `AppShell` in `apps/web/src/shell/AppShell.tsx` composing exactly three region types — sidebar/navigation, header/top action, main content — and nothing else (FR-001 verbatim: "exactly three primary region types"); mounts the theme, direction, viewport-class, and shell-mode providers from later stories behind no-op defaults so the frame renders standalone — FR-001, FR-002
- [ ] T022 [P] [US1] Implement `SidebarRegion` in `apps/web/src/shell/regions/SidebarRegion.tsx` as a stable, independently addressable navigation region anchor whose position does not change between destinations — FR-002
- [ ] T023 [P] [US1] Implement `HeaderRegion` in `apps/web/src/shell/regions/HeaderRegion.tsx` as a stable anchor providing a defined place for global actions and the product identity; MUST NOT be used as a substitute for primary navigation — FR-004
- [ ] T024 [P] [US1] Implement `MainRegion` in `apps/web/src/shell/regions/MainRegion.tsx` as the single destination for feature content and the only region whose content changes when moving between navigation destinations — FR-003
- [ ] T025 [US1] Implement empty-state rendering inside `MainRegion` in `apps/web/src/shell/states/EmptyState.tsx`, pulling all text from the externalized resources (T012), never hard-coded strings — FR-048, FR-028

**Checkpoint**: User Story 1 is fully functional and testable independently — the shell frame renders three stable regions with an empty main state.

---

## Phase 4: User Story 2 - Persistent Primary Navigation with Collapsible/Expandable Sidebar (Priority: P1)

**Goal**: A single, always-reachable control collapses the sidebar to a compact rail and expands it back; the chosen state persists across reloads; every destination stays reachable from the rail; the active destination is indicated.

**Independent Test**: Collapse the sidebar with one action, confirm the main content area grows and navigation remains reachable, reload the browser, and confirm the collapsed state is retained.

### Tests for User Story 2

> Write these FIRST, ensure they FAIL before implementation.

- [ ] T026 [P] [US2] Component test in `apps/web/tests/component/Sidebar.test.tsx`: activating the collapse control transitions the sidebar to a compact state consuming substantially less horizontal space while the main content area expands; expanding returns full labels; the control is reachable from both states; every destination remains reachable from the rail — FR-006, FR-007, FR-009
- [ ] T027 [P] [US2] Unit test in `apps/web/tests/unit/ShellPreferences.test.ts`: a saved `mahak.shell.sidebar` value of `collapsed` (or `expanded`) is restored on shell startup without additional user action — FR-008
- [ ] T028 [P] [US2] Component test in `apps/web/tests/component/NavigationRegistry.test.tsx`: activating a navigation destination marks it active and updates only the main content area — FR-010, FR-003

### Implementation for User Story 2

- [ ] T029 [US2] Implement `NavigationRegistry` in `apps/web/src/shell/navigation/NavigationRegistry.ts` holding destinations as registry data (not hard-coded layout), each with a stable `id` independent of label text and language, tracking the active destination — FR-010, FR-011, FR-014
- [ ] T030 [US2] Implement `Sidebar` in `apps/web/src/shell/navigation/Sidebar.tsx` with expanded and compact-rail presentations, a single collapse/expand control, and visible transitions completing within 300 ms of activation — FR-006, NFR-003
- [ ] T031 [US2] Implement collapse-control reachability from both the expanded and collapsed states in `apps/web/src/shell/navigation/Sidebar.tsx` — FR-007
- [ ] T032 [US2] Implement destination reachability from the compact rail in `apps/web/src/shell/navigation/Sidebar.tsx`: every primary destination remains reachable through icons or an affordance that reveals the full navigation — FR-009
- [ ] T033 [US2] Wire sidebar state persistence in `apps/web/src/shell/navigation/Sidebar.tsx` by reading/writing `mahak.shell.sidebar` through `ShellPreferences` (T015) — FR-008
- [ ] T034 [US2] Implement active-destination indication in `apps/web/src/shell/navigation/Sidebar.tsx`, marked both visually and semantically, updating only `MainRegion` content on change — FR-010, FR-003
- [ ] T035 [US2] Implement router binding in `apps/web/src/router/` so destination ids map to route slots and content renders into `MainRegion` — FR-003, FR-014

**Checkpoint**: User Stories 1 AND 2 both work independently — navigation with collapse/expand and persistence is operational.

---

## Phase 5: User Story 3 - Public vs Authenticated Shell Boundary (Priority: P1)

**Goal**: The shell behaves as two clearly distinct experiences — a public (unauthenticated) shell and an authenticated shell — driven by a two-valued contract. R01 implements NO authentication; the boundary is a contract seam for R02.

**Independent Test**: With authentication deliberately not implemented, drive the shell into each mode through the shell-mode seam and verify the correct navigation set and global actions are presented, with no module destination visible in public mode.

### Tests for User Story 3

> Write these FIRST, ensure they FAIL before implementation.

- [ ] T036 [P] [US3] Unit test in `apps/web/tests/unit/ShellModeProvider.test.tsx`: in `public` mode only sign-in/sign-up entry points and public global actions are presented and no reserved module destination is visible; in `authenticated` mode the eight reserved destinations and account area are presented — FR-042, FR-043, FR-058
- [ ] T037 [P] [US3] Component test in `apps/web/tests/component/ShellModeGuard.test.tsx`: attempting to reach an authenticated destination from public mode routes to the defined sign-in entry point rather than exposing protected content — FR-044
- [ ] T038 [P] [US3] Component test in `apps/web/tests/component/ShellModeTransition.test.tsx`: switching mode changes the navigation set without reloading or redesigning the core shell frame — FR-045

### Implementation for User Story 3

- [ ] T039 [US3] Implement `ShellModeProvider` in `apps/web/src/providers/ShellModeProvider.tsx` exposing exactly two values `public` and `authenticated`, resolved from the shell-mode seam (the api contract endpoint T017 with local fallback), never from any login implementation — FR-042, FR-046, FR-055
- [ ] T040 [US3] Implement navigation-set filtering by mode in `apps/web/src/shell/navigation/NavigationRegistry.ts`: `public` set contains zero module destinations (only sign-in/sign-up entry points as header global actions per the A-08 decision); `authenticated` set contains the reserved destinations — FR-043, FR-058
- [ ] T041 [P] [US3] Implement sign-in and sign-up entry points as header global actions in `apps/web/src/shell/regions/HeaderRegion.tsx`, labels sourced from externalized resources — FR-043, FR-058, FR-028
- [ ] T042 [US3] Implement the route guard in `apps/web/src/router/` so authenticated destinations reached from public mode resolve to the sign-in entry point — FR-044
- [ ] T043 [US3] Implement mode-switch transition in `apps/web/src/providers/ShellModeProvider.tsx` so changing mode swaps navigation sets without a page reload or shell restructure — FR-045

**Checkpoint**: User Stories 1, 2, AND 3 work independently — the public/authenticated boundary exists as a contract with no authentication code.

---

## Phase 6: User Story 4 - Responsive Shell Across Desktop, Tablet, and Mobile (Priority: P2)

**Goal**: The shell stays usable on desktop, tablet, and mobile — desktop keeps an open sidebar, tablet offers a compact rail, and mobile uses an on-demand overlay drawer that consumes no permanent space.

**Independent Test**: Resize the viewport across the three classes and confirm the navigation adapts as specified without horizontal scrolling or unreachable controls.

### Tests for User Story 4

> Write these FIRST, ensure they FAIL before implementation.

- [ ] T044 [P] [US4] Unit test in `apps/web/tests/unit/ViewportClassProvider.test.tsx`: class resolves from viewport width only at the fixed boundaries (`< 768px` → mobile, `768–1023px` → tablet, `≥ 1024px` → desktop); a wide touch device resolves to desktop and a narrow desktop window resolves to mobile — FR-016
- [ ] T045 [P] [US4] E2E test in `apps/web/tests/e2e/responsive.spec.ts` over widths 360, 480, 768, 900, 1024, 1440, 1920: desktop keeps an open sidebar, tablet offers the compact form, mobile shows no permanent sidebar and opens the drawer via a persistent control; no viewport class requires horizontal scrolling — FR-017, FR-018, FR-019, FR-021
- [ ] T046 [P] [US4] E2E test in `apps/web/tests/e2e/responsive.spec.ts`: crossing a breakpoint settles into the new class's navigation mode with no residual overlay, scrim, or duplicated navigation; opening the mobile drawer then resizing to desktop dismisses it cleanly — FR-022
- [ ] T047 [P] [US4] Unit test in `apps/web/tests/unit/ShellPreferences.test.ts`: first visit with no saved preference expands the sidebar in desktop and collapses it in tablet; mobile never shows a permanent sidebar; a saved `expanded` state reloaded into tablet resolves to compact and into mobile resolves to the drawer — FR-062, FR-063

### Implementation for User Story 4

- [ ] T048 [US4] Implement `ViewportClassProvider` in `apps/web/src/providers/ViewportClassProvider.tsx` resolving exactly one class from viewport width against `packages/contracts` boundaries, ignoring pointer type and device hints — FR-016
- [ ] T049 [US4] Implement desktop/tablet sidebar presentation in `apps/web/src/shell/navigation/Sidebar.tsx`: desktop capable of remaining open beside the main content area; tablet offering the compact form — FR-017, FR-018
- [ ] T050 [US4] Implement first-visit and precedence behavior in `apps/web/src/providers/ViewportClassProvider.tsx`: desktop defaults expanded, tablet defaults compact, mobile always uses the drawer; the active class overrides an incompatible saved sidebar state — FR-062, FR-063
- [ ] T051 [US4] Implement `NavDrawer` in `apps/web/src/shell/navigation/NavDrawer.tsx`: mobile overlay drawer opened by a persistent control, dismissible by its close affordance, by destination selection, and by scrim/backdrop activation; transitions complete within 300 ms — FR-019, FR-020, NFR-003
- [ ] T052 [US4] Implement breakpoint-crossing cleanup in `apps/web/src/providers/ViewportClassProvider.tsx`: no residual overlay, scrim, or duplicated navigation when the viewport crosses a boundary — FR-022
- [ ] T053 [US4] Enforce no horizontal scrolling in `apps/web/src/themes/` token layout and region styles across all three classes — FR-021

**Checkpoint**: User Stories 1–4 work independently — the shell is fully responsive across desktop, tablet, and mobile.

---

## Phase 7: User Story 5 - RTL/LTR Direction Foundation (Priority: P2)

**Goal**: Persian and Arabic lay out right-to-left, English left-to-right; switching direction mirrors every region without redesigning the shell, hiding content, or reloading.

**Independent Test**: Set the active language to Persian, Arabic, and English in sequence; verify the sidebar appears on the correct side and all shell regions remain fully usable.

### Tests for User Story 5

> Write these FIRST, ensure they FAIL before implementation.

- [ ] T054 [P] [US5] Unit test in `apps/web/tests/unit/DirectionProvider.test.tsx`: `fa` and `ar` resolve to `rtl`, `en` resolves to `ltr`; with no saved direction preference the active language is the single source of truth so the two cannot diverge at first paint — FR-023, FR-061
- [ ] T055 [P] [US5] E2E test in `apps/web/tests/e2e/direction.spec.ts` for `fa`, `ar`, `en`: root direction attribute matches the locale; the sidebar anchors to the correct side; every region mirrors with no clipped, overlapped, or hidden region — FR-024, FR-025
- [ ] T056 [P] [US5] E2E test in `apps/web/tests/e2e/direction.spec.ts`: switching direction mid-session mirrors all regions without a reload or re-navigation to the current destination; collapse/expand and drawer open/close behave identically in both directions; direction switch with the drawer open re-anchors without trapping focus — FR-026, FR-027

### Implementation for User Story 5

- [ ] T057 [US5] Implement `DirectionProvider` in `apps/web/src/providers/DirectionProvider.tsx` setting the active direction on the application root as the single source of truth, deriving the initial direction from the active locale when no saved preference exists — FR-024, FR-061
- [ ] T058 [US5] Implement layout mirroring in `apps/web/src/shell/` regions using logical CSS properties (start/end) rather than physical left/right, so every region — sidebar side, header layout, main content — mirrors from the root direction attribute — FR-025
- [ ] T059 [US5] Verify collapse/expand and drawer anchoring work identically in RTL and LTR in `apps/web/src/shell/navigation/Sidebar.tsx` and `apps/web/src/shell/navigation/NavDrawer.tsx`, anchored to the correct side — FR-026
- [ ] T060 [US5] Implement direction switching without reload in `apps/web/src/providers/DirectionProvider.tsx` — FR-027

**Checkpoint**: User Stories 1–5 work independently — the shell is fully usable in both directions for all three locales.

---

## Phase 8: User Story 6 - Theme Foundation: Light, Dark, and System (Priority: P2)

**Goal**: Light, Dark, and System themes apply consistently to every shell region, System follows the device preference, and selections persist.

**Independent Test**: Select Light, Dark, and System in turn; confirm each region follows the selected theme and the selection survives a reload.

### Tests for User Story 6

> Write these FIRST, ensure they FAIL before implementation.

- [ ] T061 [P] [US6] Unit test in `apps/web/tests/unit/ThemeProvider.test.tsx`: exactly three theme modes are supported; `system` resolves to light or dark via the device preference and follows a preference change at runtime; first visit with nothing saved defaults to `system` — FR-029, FR-031, FR-060
- [ ] T062 [P] [US6] E2E test in `apps/web/tests/e2e/theme.spec.ts`: Light and Dark apply to every region including the drawer with no unthemed region; the selection persists across a reload; no theme disables a navigation or shell control — FR-030, FR-032, FR-033
- [ ] T063 [P] [US6] Automated contrast test in `apps/web/tests/component/contrast.test.tsx` using jest-axe: all shell text meets ≥ 4.5:1 against its background in both Light and Dark resolved themes — FR-041, SC-008

### Implementation for User Story 6

- [ ] T064 [US6] Implement `ThemeProvider` in `apps/web/src/providers/ThemeProvider.tsx` supporting exactly `light`, `dark`, `system`; subscribing to the device appearance preference in `system` mode (falling back to light where the OS exposes no preference); defaulting to `system` on first visit; persisting selection to `mahak.shell.theme` — FR-029, FR-031, FR-032, FR-060, A-07
- [ ] T065 [US6] Apply the resolved theme in `apps/web/src/shell/AppShell.tsx` to every region — sidebar, header, main content, mobile drawer — via the `data-theme` root attribute and shared design tokens (T013), with no unthemed region — FR-030
- [ ] T066 [US6] Verify no theme disables any navigation or shell control in `apps/web/src/shell/` — FR-033

**Checkpoint**: User Stories 1–6 work independently — theme behavior is complete across all regions and modes.

---

## Phase 9: User Story 7 - Shell-Level Accessibility (Priority: P2)

**Goal**: A keyboard-only or screen-reader user can orient in the shell, move between regions, operate the sidebar controls, and understand current state.

**Independent Test**: Unplug the mouse, travel from header to sidebar, collapse/expand it, reach the main content area, and return; repeat with a screen reader running and confirm every region and control is announced meaningfully.

### Tests for User Story 7

> Write these FIRST, ensure they FAIL before implementation.

- [ ] T067 [P] [US7] Automated accessibility test in `apps/web/tests/component/a11y.test.tsx` using jest-axe: the three regions are exposed as distinct semantic navigation/banner/main landmarks; every interactive shell control exposes a meaningful accessible name — FR-034, FR-036
- [ ] T068 [P] [US7] E2E keyboard test in `apps/web/tests/e2e/a11y-keyboard.spec.ts`: Tab traverses header → sidebar → main in a logical order with a visible focus indicator at every stop; the skip-to-main affordance moves focus directly into the main region; opening the drawer moves focus into it and closing returns focus to the opening control — FR-035, FR-037, FR-038, FR-039
- [ ] T069 [P] [US7] E2E test in `apps/web/tests/e2e/a11y-keyboard.spec.ts`: state changes — sidebar collapsed/expanded, drawer opened/closed, theme changed — are communicated to assistive technology — FR-040
- [ ] T070 [P] [US7] E2E test in `apps/web/tests/e2e/zoom.spec.ts`: at 200% browser zoom all shell regions and navigation controls remain reachable and legible without overlapping or disappearing, at both desktop and mobile widths — NFR-007

### Implementation for User Story 7

- [ ] T071 [P] [US7] Expose the sidebar, header, and main content areas as distinct semantic landmarks in `apps/web/src/shell/regions/` (WAI-ARIA landmark roles or an equivalent standard mechanism) — FR-034
- [ ] T072 [P] [US7] Implement the skip-to-main-content affordance in `apps/web/src/shell/accessibility/SkipToMain.tsx` moving focus directly into the main region — FR-035
- [ ] T073 [US7] Give every interactive shell control a meaningful accessible name and visible focus indicator in `apps/web/src/shell/` (collapse/expand, drawer open/close, navigation destinations) — FR-036, FR-037
- [ ] T074 [US7] Implement logical, trap-free keyboard focus order across header, sidebar, and main regions in `apps/web/src/shell/`, with no traps except the intentionally modal drawer — FR-038
- [ ] T075 [US7] Implement drawer focus management in `apps/web/src/shell/accessibility/FocusTrap.tsx` and `apps/web/src/shell/navigation/NavDrawer.tsx`: focus moves into the drawer on open and returns to the opening control on close — FR-039
- [ ] T076 [US7] Announce shell state changes (sidebar, drawer, theme) to assistive technology in `apps/web/src/shell/` — FR-040

**Checkpoint**: User Stories 1–7 work independently — the shell is operable by keyboard and screen reader at standard and 200% zoom.

---

## Phase 10: User Story 8 - Shell Application States (Priority: P3)

**Goal**: The shell never looks broken — loading regions show a loading state, empty regions a helpful empty state, failures an error state with retry, unavailable destinations an explicit unavailable state, and offline conditions a clear indication.

**Independent Test**: Force each condition (a slow region, a region with no content, a failing region, a reserved destination, no network) and verify the shell presents the matching defined state with a recovery path where one exists.

### Tests for User Story 8

> Write these FIRST, ensure they FAIL before implementation.

- [ ] T077 [P] [US8] Component test in `apps/web/tests/component/ShellStates.test.tsx`: a region whose content is still preparing shows a loading state inside that region while the rest of the shell stays usable; a region with no content shows the defined empty state — FR-047, FR-048
- [ ] T078 [P] [US8] Component test in `apps/web/tests/component/ShellStates.test.tsx`: a failing region shows an error state with a plain-language message and a retry action where retrying is meaningful — FR-049
- [ ] T079 [P] [US8] Component test in `apps/web/tests/component/UnavailableState.test.tsx`: a reserved destination whose feature is unavailable presents the defined unavailable state, distinct from loading, empty, and error — FR-050, FR-013
- [ ] T080 [P] [US8] E2E test in `apps/web/tests/e2e/offline.spec.ts` with emulated offline: the shell indicates the interrupted condition, remains structurally intact, and keeps previously rendered regions visible; a reserved destination selected while offline still presents the unavailable state rather than a crash — FR-051, FR-013
- [ ] T081 [P] [US8] Component test in `apps/web/tests/component/ShellStates.test.tsx`: loading, empty, error, and unavailable states render correctly in the active theme and direction — FR-052
- [ ] T082 [P] [US8] Component test in `apps/web/tests/component/WholeFrameLoading.test.tsx`: during initial load all three regions are present but inert and transition to the interactive shell once ready, with no reload or core-frame re-layout — FR-059

### Implementation for User Story 8

- [ ] T083 [US8] Implement `WholeFrameLoading` in `apps/web/src/shell/states/WholeFrameLoading.tsx` showing all three regions present but inert during initial shell load, transitioning to the interactive shell — including per-region loading states — once interactive, without a reload or re-layout — FR-059, NFR-001
- [ ] T084 [P] [US8] Implement `RegionLoading` and `ErrorState` in `apps/web/src/shell/states/RegionLoading.tsx` and `apps/web/src/shell/states/ErrorState.tsx`: per-region loading that does not block other regions; plain-language failure messages with a retry action where meaningful — FR-047, FR-049
- [ ] T085 [P] [US8] Implement `UnavailableState` in `apps/web/src/shell/states/UnavailableState.tsx` for reserved destinations, text from externalized resources — FR-050, FR-013, FR-028
- [ ] T086 [US8] Implement `OfflineIndicator` in `apps/web/src/shell/states/OfflineIndicator.tsx` detecting interrupted/unavailable network conditions and keeping previously rendered regions visible — FR-051
- [ ] T087 [US8] Apply the active theme and direction to all state components in `apps/web/src/shell/states/` — FR-052
- [ ] T088 [US8] Implement graceful degradation in `apps/web/src/shell/AppShell.tsx`: an unexpected failure in one region MUST NOT take down the whole shell frame — NFR-008

**Checkpoint**: User Stories 1–8 work independently — all shell states behave correctly and degrade gracefully.

---

## Phase 11: User Story 9 - Reserved Entry Points for Future Product Modules (Priority: P3)

**Goal**: Each future module (General AI Chat, conversations/history, projects, Private Teacher, files, search, settings, Admin Control Center) has exactly one stable reserved destination, and later features can connect without redesigning the shell.

**Independent Test**: Inspect the navigation definition and confirm each future module maps to exactly one reserved destination with a defined availability state; activating one shows the unavailable state, not a real feature.

### Tests for User Story 9

> Write these FIRST, ensure they FAIL before implementation.

- [ ] T089 [P] [US9] Unit test in `apps/web/tests/unit/NavigationRegistry.test.ts`: exactly one destination exists per module id — `dest.general-chat`→`GENERAL_CHAT`, `dest.conversations`→`CONVERSATIONS`, `dest.projects`→`PROJECTS`, `dest.private-teacher`→`PRIVATE_TEACHER`, `dest.files`→`FILES`, `dest.search`→`SEARCH`, `dest.settings`→`SETTINGS`, `dest.admin`→`ADMIN_CONTROL_CENTER` — all with availability `reserved` and visibilityScope `authenticated`, verifiable against `ROADMAP.md` — FR-012, FR-015, SC-001
- [ ] T090 [P] [US9] Component test in `apps/web/tests/component/ReservedDestination.test.tsx`: activating a reserved destination presents the defined unavailable state and does not imply the feature exists — FR-013, FR-050
- [ ] T091 [P] [US9] Extensibility test in `apps/web/tests/unit/ModuleExtension.test.ts`: flipping a module's availability from `reserved` to `available` and binding its route renders it into the main region with no change to the shell's region structure, navigation contract, or layout — FR-014, FR-056

### Implementation for User Story 9

- [ ] T092 [US9] Register the eight reserved destinations in `apps/web/src/shell/navigation/NavigationRegistry.ts` with their stable ids, module bindings, and route paths per `contracts/navigation.md` — FR-012, FR-015, FR-011
- [ ] T093 [US9] Wire reserved destinations to the unavailable state in `apps/web/src/shell/navigation/ReservedDestination.tsx` — FR-013, FR-050
- [ ] T094 [US9] Implement a generic module extension seam in `apps/web/src/features/` that lets a future module bind to its reserved `ModuleId` and render into the main region without touching shell regions or the navigation contract. The seam MUST be generic only — R01 creates reserved directory slots for the eight NavigationDestination modules (`general-chat`, `conversations`, `projects`, `private-teacher`, `files`, `search`, `settings`, `admin`) and MUST NOT create feature slots, navigation destinations, or any implementation for `KNOWLEDGE`, `MEMORY`, `VOICE`, or `AI_MODEL_GATEWAY`, which remain identity-only future seams per `contracts/navigation.md` — FR-053, FR-054, FR-056, FR-057

**Checkpoint**: All nine user stories are independently functional. Each of the eight R01 navigation destinations (General AI Chat, conversations/history, projects, Private Teacher, files, search, settings, Admin Control Center) has exactly one stable reserved home in the shell; `KNOWLEDGE`, `MEMORY`, `VOICE`, and `AI_MODEL_GATEWAY` remain identity-only seams with no destinations or implementations.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Cross-cutting validation, performance, documentation, and the Constitution's quality gates.

- [ ] T095 Integrate the api shell contract client in `apps/web/src/services/` consuming `GET /api/v1/shell` for declared mode and availability, with local fallback so the shell remains fully functional when the api is unreachable — FR-055
- [ ] T096 [P] Validate performance targets in `apps/web/tests/e2e/performance.spec.ts`: core frame interactive within 2 s on a standard broadband desktop connection, and within 5 s on a 3G-class mobile connection presenting the loading state rather than failing silently — NFR-001, NFR-002
- [ ] T097 [P] Validate browser support per `apps/web/tests/e2e/` Playwright projects: current and previous major version of the project's desktop and mobile browser targets, with no legacy-specific layout — NFR-004
- [ ] T098 Run the Constitution's Python compilation gate: `python -m compileall apps/api` passes with no errors — NFR-005, Constitution Principle V
- [ ] T099 [P] Run all ten `quickstart.md` validation scenarios end-to-end against `specs/001-platform-app-shell/quickstart.md` and confirm every expected outcome, fixing failures at their source without weakening assertions or disabling tests — SC-001–SC-012, Constitution Development Workflow gates
- [ ] T100 [P] Update documentation: `apps/web/README.md`, `apps/api/README.md`, and root `README.md` describing shell architecture, the contract seam, the reserved module extension mechanism, and how to run the validation suites — Constitution Principle V (documentation MUST be updated when architecture changes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phase 3–11)**: All depend on Foundational completion. Can proceed in parallel (if staffed) or sequentially in priority order (P1 → P2 → P3).
- **Polish (Phase 12)**: Depends on all user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational. No dependencies on other stories. (MVP)
- **US2 (P1)**: Depends on US1 (regions exist to host navigation) and T015 (preferences).
- **US3 (P1)**: Depends on US2 (registry exists to filter by mode) and T017 (api contract).
- **US4 (P2)**: Depends on US2 (sidebar to make responsive).
- **US5 (P2)**: Depends on US1 (regions to mirror) and T010/T015 (direction contract + preferences).
- **US6 (P2)**: Depends on US1 (regions to theme) and T013/T015 (tokens + preferences).
- **US7 (P2)**: Depends on US1–US4 (controls and drawer exist to make accessible).
- **US8 (P3)**: Depends on US1 (regions to show states in) and US2 (destinations to be unavailable).
- **US9 (P3)**: Depends on US2 (registry) and US3 (authenticated visibility scope).

### Within Each User Story

- Tests are written FIRST and MUST fail before implementation (NFR-005).
- Contracts and models before services; services before UI wiring; core implementation before integration.

### Parallel Opportunities

- All Setup tasks marked [P] (T002–T005) run in parallel.
- All Foundational contract tasks (T006–T011, T013–T014, T016, T018) run in parallel — they touch different files in `packages/contracts/src/` and `apps/`.
- Once Foundational completes, independent story streams (US4, US5, US6) can proceed in parallel after their US1/US2 prerequisites.
- All tests within a story marked [P] run in parallel (separate test files).
- Polish tasks T096, T097, T099, T100 run in parallel.

---

## Parallel Example: User Story 4

```bash
# Launch all tests for User Story 4 together:
Task: "Unit test in apps/web/tests/unit/ViewportClassProvider.test.tsx"
Task: "E2E test in apps/web/tests/e2e/responsive.spec.ts"

# Launch independent implementation tasks together:
Task: "Implement NavDrawer in apps/web/src/shell/navigation/NavDrawer.tsx"
Task: "Enforce no horizontal scrolling in apps/web/src/themes/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (three regions + empty state)
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → test independently → **MVP**
3. Add US2, US3 → test independently → P1 complete (shell, navigation, boundary)
4. Add US4–US7 → test independently → P2 complete (responsive, RTL/LTR, theme, a11y)
5. Add US8, US9 → test independently → P3 complete (states, reserved entry points)
6. Polish → run all gates (`compileall`, full test matrix, quickstart scenarios)

### Parallel Team Strategy

With multiple developers after Foundational:

- Developer A: US4 (responsive)
- Developer B: US5 (RTL/LTR)
- Developer C: US6 (theme)
- US7 (accessibility) and US8 (states) follow once their prerequisites land

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] labels map tasks to user stories for traceability.
- Every task traces to one or more R01 requirements (FR-001–FR-063, NFR-001–NFR-008); see the traceability table in `plan.md`.
- All 63 FRs and all 8 NFRs are covered; no orphan requirements, no out-of-scope work.
- Verify tests fail before implementing; fix failures at their source; never weaken assertions or disable tests.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
- R01 MUST NOT implement authentication, chat, projects, Teacher, files, Knowledge, Voice, Memory, Admin, billing, or AI provider logic — reserved slots are inert seams only.

---

## Phase 13: Convergence

**Purpose**: Remaining work identified by `/speckit.converge` verification of the implemented R01 codebase against spec.md, plan.md, tasks.md, contracts/, quickstart.md, and the constitution. All functional, non-functional, success, and clarification intent is otherwise satisfied; these two items close the residual validation/documentation gap.

- [x] T101 Create the missing root `README.md` and `apps/web/README.md` (only `apps/api/README.md` currently exists) documenting the shell architecture (three regions, navigation registry, providers), the shared `packages/contracts` seam, the reserved module-extension mechanism under `apps/web/src/features/`, and how to run the validation suites, per T100 and Constitution Principle V (documentation MUST be updated when architecture changes) (partial)
- [x] T102 Add an explicit NFR-002 validation to `apps/web/tests/e2e/performance.spec.ts`: assert the shell completes load and presents its loading state (rather than failing silently) within 5 s on a 3G-class throttled mobile connection, complementing the existing 2 s broadband desktop budget (NFR-001, NFR-002) (partial)

---

## Phase 14: Convergence

**Purpose**: Close the remaining gaps between the implemented R01 codebase and the spec/plan/tasks intent. All functional, non-functional, success, and clarification requirements are satisfied by the current implementation except for two items: a missing E2E test for assistive-technology state announcements (FR-040 / T069) and a missing test file at the path specified by T090 (the behavior itself is covered in `UnavailableState.test.tsx` but not in the expected `ReservedDestination.test.tsx`).

- [x] T103 [P] Add an E2E test in `apps/web/tests/e2e/a11y-keyboard.spec.ts` verifying that shell state changes — sidebar collapsed/expanded, drawer opened/closed, and theme changed — are communicated to assistive technology via the `AnnouncementProvider` polite live region (`[role="status"][aria-live="polite"][data-testid="shell-announcer"]`), satisfying FR-040 (per T069)
- [x] T104 [P] Create `apps/web/tests/component/ReservedDestination.test.tsx` containing a component test that activates a reserved destination and asserts the defined unavailable state is presented without implying the feature exists, per T090 (the same assertions exist in `UnavailableState.test.tsx`; this task moves them to the path specified by the task breakdown)
