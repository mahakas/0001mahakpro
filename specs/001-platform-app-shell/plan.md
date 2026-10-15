# Implementation Plan: R01 — Platform Foundation & Application Shell

**Branch**: `001-platform-app-shell` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-platform-app-shell/spec.md`

## Summary

R01 establishes the foundational MAHAK web application shell: three stable
shell regions (sidebar/navigation, header, main content), a stable navigation
registry with one reserved destination per future product module,
collapsible/expandable sidebar behavior, responsive desktop/tablet/mobile
presentation, RTL/LTR direction foundation, Light/Dark/System theme
foundation, shell-level accessibility, shell application states
(loading/empty/error/unavailable/offline), and the conceptual public vs
authenticated shell-mode boundary — with no authentication, no chat, and no
module business logic implemented.

Technical approach (from Phase 0 research): a pnpm workspace monorepo with a
TypeScript web application (`apps/web`), a minimal Python FastAPI application
(`apps/api`) that exists only to hold the API boundary and a shell-mode
contract endpoint, and a TypeScript contracts package (`packages/contracts`)
that is the single source of truth for shell-mode, navigation-destination, and
feature-availability contracts shared between layers.

## Technical Context

**Language/Version**: TypeScript 5.x (web + contracts), Python 3.12 (api)

**Primary Dependencies**: React 19, Vite 7, React Router 7, pnpm 10
workspace; FastAPI + Uvicorn (api); Vitest, React Testing Library, Playwright,
jest-axe (testing). No AI provider SDKs — R01 performs no AI calls.

**Storage**: None in R01. Shell preferences (theme, direction, sidebar state)
persist in browser `localStorage` only. No database, no ORM, no migrations.

**Testing**: Vitest (unit + component), React Testing Library (behavioral),
Playwright (viewport/responsive/RTL/theme/a11y E2E), jest-axe (automated
accessibility assertions), pytest (api contract).

**Target Platform**: Modern desktop and mobile browsers (current and previous
major version); local development on Windows/Linux/macOS.

**Project Type**: Web application (monorepo: web client + minimal api +
shared contracts package).

**Performance Goals**: Shell core frame interactive ≤ 2 s on broadband
desktop (NFR-001); usable on 3G-class mobile with shell load ≤ 5 s (NFR-002);
sidebar/drawer transitions complete within 300 ms (NFR-003).

**Constraints**: No credentials or secrets in the browser (NFR-006); no
horizontal scrolling at any viewport class (FR-021); 200 % browser zoom must
remain usable (NFR-007); one region failure must not take down the shell
(NFR-008); no authentication implementation in R01 (FR-046).

**Scale/Scope**: 1 web application shell, 3 shell regions, 8 reserved
navigation destinations, 2 shell modes, 3 viewport classes, 3 theme modes,
2 text directions, 5 shell-region states.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence / how the plan satisfies it |
|-----------|--------|--------------------------------------|
| **I. Product Integrity & Architectural Discipline** | **PASS** | The plan creates the six constitutional layers as separate workspace units: User Experience (`apps/web`), Application/API (`apps/api`), and cross-cutting contracts (`packages/contracts`), with reserved extension seams for AI Runtime, Knowledge System, Data Layer, and Admin Operations. Domain separation is structural, not merely naming: navigation is driven by a registry, so no module's business logic can leak into the shell (FR-053, FR-054, FR-057). No cross-layer shortcuts; `apps/web` never imports from a Python module and `apps/api` never renders UI. |
| **I. Core domains independently evolvable** | **PASS** | Every roadmap module (General AI Chat, Private Teacher, Projects, Knowledge, Memory, AI Model Gateway, Admin) has a reserved module identity in `packages/contracts` and a reserved destination in the navigation registry. Modules can be added without modifying the shell (FR-012, FR-014, FR-056). |
| **I. Web-first and API-first** | **PASS** | The shell is a web application consuming a versioned API contract. `apps/api` exists in R01 specifically to hold the API boundary, so later mobile/embedded clients can reuse the same backend capabilities. |
| **I. No hard-coded educational structures** | **N/A in R01** | R01 defines no grade/field/subject/course/chapter/topic relationships; those belong to R04 and are intentionally absent from this plan. |
| **II. AI, Knowledge & Evidence Integrity** | **N/A in R01** | R01 performs no retrieval, no knowledge handling, and no AI calls (spec non-requirements). Reserved module identities exist but bind to nothing yet. No fabricated capability is implied. |
| **III. Modularity, Provider Agnosticism** | **N/A in R01** | No provider, model, or embedding code is introduced. The reserved `AI_MODEL_GATEWAY` module identity preserves the seam for R09 without implementing it. |
| **IV. Security, Privacy & Operational Safety** | **PASS** | R01 implements no authentication, no credentials, and no secrets (FR-046, NFR-006). The public/authenticated boundary is a shell-mode contract only (FR-042–FR-046, FR-058). No privileged data reaches the browser: the only api responses are shell mode, feature availability, and locale direction metadata. No file uploads, no admin operations, no destructive actions exist in R01. |
| **IV. Explicit authorization boundary** | **PASS** | `ShellMode` is an explicit contract value. Authenticated destinations are unreachable in public mode (FR-015, FR-044, FR-058). The seam is ready for R02 to implement without restructuring the shell. |
| **V. Test-Backed Development** | **PASS** | Every planned unit carries test coverage: unit/component (Vitest), viewport/RTL/theme/a11y (Playwright), automated accessibility (jest-axe), and api contract (pytest). NFR-005 requires deterministic tests with external providers mocked — no external provider exists in R01, so all tests are deterministic by construction. |
| **V. Python `compileall` validation** | **PASS (trivially)** | R01 contains only a minimal Python application bootstrap in `apps/api`. `python -m compileall apps/api` is included in the validation command set and will pass once the bootstrap exists. |
| **V. Observability** | **PASS (shell-level)** | Shell state changes (mode, viewport class, theme, direction, sidebar, offline) are logged through the browser logger with structured fields and no secret data. Business usage/token/credit observability belongs to later roadmap features and is not introduced here. |
| **Security & Cross-Platform Constraints** | **PASS** | Desktop/tablet/mobile breakpoints, Persian/Arabic RTL + English LTR from the foundation, Light/Dark/System themes, and accessibility requirements are all first-class plan components, not additions. |
| **Development Workflow & Quality Gates** | **PASS** | This plan is produced from the approved spec + clarifications; tasks will be traceable to FR/NFR ids (see Traceability). Failures are fixed at source; no test weakening is permitted. |

**Gate result: PASS — no violations, no Complexity Tracking entries required.**
The Constitution Check is re-evaluated after Phase 1 design at the end of this
plan.

## Project Structure

### Documentation (this feature)

```text
specs/001-platform-app-shell/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── shell-mode.md
│   ├── navigation.md
│   ├── theme.md
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── web/                          # User Experience layer
│   ├── src/
│   │   ├── shell/
│   │   │   ├── AppShell.tsx          # the one top-level shell (FR-001)
│   │   │   ├── regions/
│   │   │   │   ├── SidebarRegion.tsx     # navigation region (FR-002)
│   │   │   │   ├── HeaderRegion.tsx      # banner/global actions (FR-004)
│   │   │   │   └── MainRegion.tsx        # content destination (FR-003)
│   │   │   ├── navigation/
│   │   │   │   ├── NavigationRegistry.ts # reserved destinations (FR-012)
│   │   │   │   ├── Sidebar.tsx           # expanded / compact rail (FR-006..009)
│   │   │   │   ├── NavDrawer.tsx         # mobile overlay drawer (FR-019, FR-020)
│   │   │   │   └── ReservedDestination.tsx
│   │   │   ├── states/
│   │   │   │   ├── WholeFrameLoading.tsx # startup state (FR-059)
│   │   │   │   ├── RegionLoading.tsx     # per-region (FR-047)
│   │   │   │   ├── EmptyState.tsx        # (FR-048)
│   │   │   │   ├── ErrorState.tsx        # (FR-049)
│   │   │   │   ├── UnavailableState.tsx  # (FR-013, FR-050)
│   │   │   │   └── OfflineIndicator.tsx  # (FR-051)
│   │   │   └── accessibility/
│   │   │       ├── SkipToMain.tsx        # (FR-035)
│   │   │       └── FocusTrap.tsx         # drawer focus mgmt (FR-039)
│   │   ├── providers/                # presentation state (owned by shell)
│   │   │   ├── ThemeProvider.tsx         # Light/Dark/System (FR-029..033)
│   │   │   ├── DirectionProvider.tsx     # RTL/LTR root truth (FR-024..027)
│   │   │   ├── ViewportClassProvider.tsx # desktop/tablet/mobile (FR-016..022)
│   │   │   ├── ShellModeProvider.tsx     # public/authenticated (FR-042..045)
│   │   │   └── ShellPreferences.ts       # localStorage persistence (FR-008, FR-032)
│   │   ├── features/                  # reserved module slots (empty in R01)
│   │   │   ├── general-chat/
│   │   │   ├── conversations/
│   │   │   ├── projects/
│   │   │   ├── private-teacher/
│   │   │   ├── files/
│   │   │   ├── knowledge/             # reserved seam only
│   │   │   ├── memory/                # reserved seam only
│   │   │   ├── voice/                 # reserved seam only
│   │   │   ├── search/
│   │   │   ├── settings/
│   │   │   └── admin/
│   │   ├── i18n/                      # externalized string resources (FR-028)
│   │   │   ├── fa.json
│   │   │   ├── ar.json
│   │   │   └── en.json
│   │   ├── themes/                    # design tokens for Light + Dark
│   │   ├── router/                    # route table bound to registry ids
│   │   └── logger/                    # structured browser logger (no secrets)
│   ├── tests/
│   │   ├── unit/                      # providers, registry, preferences
│   │   ├── component/                 # shell regions, states, navigation
│   │   └── e2e/                       # Playwright: viewport, RTL, theme, a11y
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── api/                           # Application/API layer
    ├── src/mahak_api/
    │   ├── main.py                     # FastAPI app bootstrap
    │   ├── routes/
    │   │   └── shell.py                # /api/v1/shell contract endpoint
    │   └── contracts/
    │       └── shell.py                # api-side mirror of shell contracts
    ├── tests/
    │   └── test_shell_contract.py
    ├── pyproject.toml
    └── README.md
│
packages/
└── contracts/                      # shared contract definitions (FR-053, FR-056)
    ├── src/
    │   ├── shell-mode.ts               # ShellMode type + values
    │   ├── navigation.ts               # ModuleId, NavigationDestination contract
    │   ├── viewport.ts                 # ViewportClass + boundaries
    │   ├── theme.ts                    # ThemeMode contract
    │   ├── direction.ts                # Direction contract + locale map
    │   └── feature-availability.ts     # availability map (all reserved in R01)
    └── package.json
│
pnpm-workspace.yaml
package.json
tsconfig.base.json
```

**Structure Decision**: pnpm workspace monorepo (web application variant). The
constitutional layer separation is expressed as workspace boundaries: `apps/web`
(User Experience), `apps/api` (Application/API), and `packages/contracts`
(the shared contract seam that keeps the two independent). The `features/`
directories in `apps/web` exist only as reserved slots that bind to
`packages/contracts` module identities; they contain no module business logic
in R01 and are the exact points where R05–R28 will later attach.

## Complexity Tracking

> No Constitution Check violations require justification. This section is
> intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Architecture Overview

### Layered view

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Browser client — apps/web  (User Experience layer)                  │
│                                                                      │
│  AppShell ── regions (Sidebar / Header / Main)                       │
│    │                                                                 │
│    ├── providers: Theme · Direction · ViewportClass · ShellMode      │
│    ├── navigation: NavigationRegistry (8 reserved destinations)      │
│    ├── states: loading · empty · error · unavailable · offline       │
│    └── i18n: fa / ar / en externalized strings                       │
│         │                                                            │
│         └── reads/writes shell preferences (localStorage, no server) │
│                                                                      │
└───────────────┬──────────────────────────────────────────────────────┘
                │  HTTP (versioned JSON contract only)
                │  no credentials, no module data, no AI calls
┌───────────────▼──────────────────────────────────────────────────────┐
│  apps/api — Application/API layer (Python)                           │
│  /api/v1/shell  →  shell mode + feature availability + locale dir    │
│  (R01 scope: contract existence only; no auth, no business logic)    │
│  Path + response shape are stable; later features add their own      │
│  versioned business routes and may update carried values only.        │
└───────────────┬──────────────────────────────────────────────────────┘
                │  imports the contract definitions
┌───────────────▼──────────────────────────────────────────────────────┐
│  packages/contracts — shared contract seam                           │
│  ShellMode · ModuleId · NavigationDestination · ViewportClass ·      │
│  ThemeMode · Direction · FeatureAvailability                        │
└──────────────────────────────────────────────────────────────────────┘

Reserved seams (defined, not implemented, in R01):
  AI Runtime (R09/R10) · Knowledge System (R12–R18) ·
  Data Layer (none in R01) · Admin Operations (R27/R28) ·
  Voice (R25) · Memory (R24) · Billing (R31)
```

### Boundary rules

1. `apps/web` MUST NOT import from `apps/api`; it consumes the api only
   through the versioned JSON contract (FR-055).
2. `apps/web` MUST NOT contain module business logic; modules bind through
   the navigation registry and the reserved `features/` slots (FR-053,
   FR-054).
3. `packages/contracts` MUST remain free of business logic and free of any
   runtime dependency — it is a contract definition package only (FR-053,
   FR-056, FR-057).
4. `apps/api` MUST NOT render UI and MUST NOT return secrets; its only R01
   responses are shell mode, feature availability, and locale direction
   metadata (NFR-006).
5. No layer MAY depend on a specific AI provider, model, or vendor (spec
   non-requirements; constitution Principle III reserved seam).

## Component / Module Boundaries

| Planned unit | Layer | Owns | Must not do | Traces to |
|--------------|-------|------|-------------|-----------|
| `AppShell` | web | the single top-level shell frame; mounts exactly 3 regions | must not render feature content itself | FR-001, FR-002, FR-003 |
| `SidebarRegion` / `HeaderRegion` / `MainRegion` | web | stable, addressable region anchors | must not change position between destinations | FR-002, FR-003, FR-004 |
| `NavigationRegistry` | web | the set of reserved destinations + active destination + visibility scope | must not hold feature business logic | FR-010, FR-011, FR-012, FR-014, FR-015, FR-056 |
| `Sidebar` | web | expanded ↔ compact rail transition + persistence | must not consume permanent space in mobile class | FR-006, FR-007, FR-008, FR-009, FR-017, FR-018 |
| `NavDrawer` | web | mobile overlay drawer, scrim dismiss, focus management | must not remain open after crossing to desktop/tablet | FR-019, FR-020, FR-039 |
| `ThemeProvider` | web | theme resolution, System preference tracking, persistence | must not disable any control | FR-029–FR-033 |
| `DirectionProvider` | web | root `dir` truth, locale → direction mapping | must not require reload on switch | FR-024–FR-027, FR-061 |
| `ViewportClassProvider` | web | width-only class resolution + breakpoint transitions | must not use pointer/device type | FR-016, FR-021, FR-022, FR-063 |
| `ShellModeProvider` | web | public/authenticated mode + navigation set switching + sign-in routing | must not implement authentication | FR-042–FR-046, FR-058 |
| `ShellPreferences` | web | localStorage read/write + first-visit defaults | must not sync cross-device | FR-008, FR-032, FR-060, FR-062 |
| `WholeFrameLoading` + region states | web | startup and per-region state presentation | must not crash together (graceful degradation) | FR-013, FR-047–FR-052, FR-059 |
| `i18n` resources | web | externalized fa/ar/en strings | must not embed strings in components | FR-028 |
| `logger` | web | structured state-change logging | must not log secrets or sensitive user data | NFR-006, observability |
| `packages/contracts` | contracts | ShellMode, ModuleId, destination, viewport, theme, direction, availability types | must not contain runtime logic | FR-053, FR-055–FR-057 |
| `apps/api` shell route | api | `/api/v1/shell` contract endpoint | must not implement auth or module endpoints; must not host feature business logic | FR-055 |

## Deferred Decision Resolution

Per the spec, two decisions were reserved for this plan. Both are resolved
here without expanding R01 scope.

### A-02 — Numeric viewport class boundaries

**Decision**: mobile `< 768px`; tablet `768–1023px`; desktop `≥ 1024px`.

**Rationale**: These are the most widely supported boundaries in the web
platform and its testing tooling, which keeps both implementation and the
Playwright responsive suite simple and deterministic. They match the spec's
clarified rule that class is resolved from viewport width alone — a wide touch
device resolves to desktop and a narrow desktop window resolves to mobile.

**Spec consistency**: FR-016 (width-only resolution, single source of truth),
A-02. Boundary values live in `packages/contracts/src/viewport.ts` so they can
be shared by the app and the test suite.

### A-08 — Sign-in/sign-up presentation in the public navigation set

**Decision**: In public mode the sidebar region is not rendered at all; the
sign-in and sign-up entry points are presented as global actions in the header
region. No reserved module destination is rendered or routed in public mode.

**Rationale**: The spec requires the public shell to show only sign-in/sign-up
entry points and public global actions (FR-058), and requires the header to be
the home of global actions (FR-004). Placing them in the header yields the
smallest possible public surface, keeps the three-region shell contract intact
(sidebar simply renders an empty navigation set), and gives R02 a single,
stable place to attach real authentication without restructuring the shell.

**Spec consistency**: FR-004, FR-042–FR-044, FR-058, A-08. The decision is a
presentation choice within the spec's allowed range and changes no
requirement.

## Testing Strategy

### Levels and tooling

| Level | Tool | Covers | Traces to |
|-------|------|--------|-----------|
| Unit | Vitest | providers (theme/direction/viewport/mode resolution), preferences defaults + persistence, navigation registry membership and scope filtering | FR-008, FR-011–FR-016, FR-029–FR-032, FR-042, FR-058–FR-063 |
| Component | React Testing Library + jest-axe | region rendering, sidebar collapse/expand, drawer open/close + focus return, state components, landmarks and accessible names | FR-001–FR-010, FR-019–FR-020, FR-034–FR-041, FR-047–FR-052 |
| E2E | Playwright | viewport classes and breakpoint crossing, RTL/LTR switching, theme switching + persistence, public/authenticated navigation sets, offline indicator, whole-frame startup | FR-016–FR-027, FR-051, FR-059, SC-002–SC-010 |
| API contract | pytest + FastAPI test client | `/api/v1/shell` response shape and values | FR-055 |
| Compilation | `python -m compileall apps/api` | constitution Principle V Python gate | NFR-005 |

### Validation suites

**Responsive validation** — a Playwright project matrix that renders the shell
at six widths (360, 480, 768, 900, 1024, 1440, 1920) and asserts: the expected
viewport class is active; no horizontal scrollbar appears; the sidebar is
permanent at desktop, offered compact at tablet, and drawer-only at mobile;
crossing a breakpoint leaves no residual overlay/scrim; a saved expanded state
reloaded into tablet resolves to compact and into mobile resolves to drawer.

**RTL/LTR validation** — for each of fa, ar, en: root `dir` attribute matches
the expected direction; the sidebar anchors to the correct side; collapse and
expand work identically in both directions; switching direction mid-session
mirrors every region with no clipping, overlap, or reload; direction switch
with the drawer open re-anchors without trapping focus.

**Theme validation** — Light, Dark, and System are applied per suite: all three
regions and the drawer resolve to the same theme with no unthemed region;
selection persists across reload; System mode follows a emulated device
preference change; text contrast is asserted at ≥ 4.5:1 for normal text in
both themes via jest-axe.

**Accessibility validation** — keyboard-only traversal from header → sidebar →
collapse control → main region and back, with a visible focus indicator at
every stop; skip-to-main moves focus into MainRegion; drawer open moves focus
in and close returns it to the opener; every interactive control exposes a
meaningful accessible name; state changes are announced to assistive
technology; the suite is re-run at 200 % zoom and at mobile width.

**State validation** — each of loading, empty, error, unavailable, and offline
is forced deterministically (resolved content, empty fixture, failing fixture,
reserved destination, emulated offline) and asserts the correct state content,
that the rest of the shell stays usable, and that no blank page or crash
occurs. States are asserted to honor the active theme and direction.

### Quality gates

- All unit, component, E2E, and api contract tests pass deterministically.
- `python -m compileall apps/api` passes.
- No test may be disabled or weakened to make a failure pass (constitution,
  Development Workflow gates).
- External services are mocked; R01 has no live provider by construction
  (NFR-005).

## Integration Considerations

- The web client and the api share contract definitions through
  `packages/contracts`, so the navigation registry and the api response cannot
  drift apart. The api mirrors the same module identities rather than
  duplicating them semantically.
- The api is deliberately minimal: only `/api/v1/shell`. No authentication,
  no module endpoints, no AI calls. The endpoint path and its response shape
  remain stable; later features add their own versioned business routes under
  `/api/v1/...` and MUST NOT introduce business logic into the shell endpoint,
  so adding them does not require touching the shell (FR-014, FR-053,
  FR-056).
- The web client MUST function with the api unreachable: shell preferences,
  viewport class, direction, theme, and offline indication resolve locally;
  the api only supplies mode and availability metadata. This keeps local
  development and the E2E suites deterministic and network-independent.
- No environment secrets are required to run R01. The validation commands in
  `quickstart.md` run without credentials (NFR-006).
- Integration with future modules is by registration, not modification: a
  later feature flips its availability entry, binds its router slot, and
  renders into `MainRegion` — the shell layout, regions, and navigation
  contract stay untouched (FR-014, FR-053, FR-056, FR-057).

## Traceability — Requirements to Planned Work

| Planned unit | Requirements covered |
|--------------|----------------------|
| AppShell + regions | FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-008 |
| NavigationRegistry | FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-056 |
| Sidebar + collapse control | FR-005, FR-006, FR-007, FR-008, FR-009, FR-017, FR-018, FR-062, FR-063, NFR-003 |
| NavDrawer | FR-019, FR-020, FR-039, FR-040 |
| ThemeProvider | FR-029, FR-030, FR-031, FR-032, FR-033, FR-041, FR-060 |
| DirectionProvider + i18n | FR-023, FR-024, FR-025, FR-026, FR-027, FR-028, FR-061 |
| ViewportClassProvider | FR-016, FR-021, FR-022, FR-063 |
| ShellModeProvider | FR-042, FR-043, FR-044, FR-045, FR-046, FR-058 |
| ShellPreferences | FR-008, FR-032, FR-060, FR-062, FR-063 |
| Shell states (whole-frame, per-region, offline) | FR-013, FR-047, FR-048, FR-049, FR-050, FR-051, FR-052, FR-059, NFR-008 |
| Accessibility (skip link, focus trap, names, landmarks) | FR-034, FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-041, NFR-007 |
| packages/contracts | FR-053, FR-054, FR-055, FR-056, FR-057 |
| apps/api shell route | FR-055, NFR-006 |
| logger | NFR-006, observability |
| Test suites (unit/component/e2e/api) | NFR-005, SC-001–SC-012 |

Requirements with no dedicated unit — by design:

- **FR-053–FR-057** are satisfied structurally by the workspace and contract
  boundaries rather than by a runtime component.
- **NFR-004** is satisfied by the toolchain and browser target policy and is
  verified by the E2E matrix rather than by a dedicated module.

Uncovered requirement check: all 63 functional requirements and all 8
non-functional requirements map to at least one planned unit above.

## Constitution Check — Post-Design Re-evaluation

Re-checked against the Phase 1 design (contracts, data model, project
structure):

1. **Layer separation (Principle I)** — PASS. `apps/web`, `apps/api`, and
   `packages/contracts` are separate workspace units with import rules
   enforced by boundary rule 1–3. No cross-layer shortcut exists in the
   design; the shell consumes only the versioned JSON contract.
2. **Independent domain evolution (Principle I)** — PASS. Eight module
   identities plus reserved seams for AI Runtime, Knowledge, Memory, Voice,
   Admin, and Billing; each attaches later without shell modification.
3. **Web-first / API-first (Principle I)** — PASS. The api exists to hold the
   boundary; the web client is the first client of the versioned contract.
4. **No authentication, no secrets (Principle IV)** — PASS. The design
   contains no credential, session, role, or permission code. Public vs
   authenticated is a contract value plus a routing guard that redirects to
   the header sign-in entry point.
5. **Test-backed development (Principle V)** — PASS. Every planned unit has
   an assigned test level; the Python `compileall` gate is included; tests are
   deterministic with no external provider.
6. **Accessibility, i18n, theme, responsiveness (Cross-Platform Constraints)**
   — PASS. All four are first-class providers with dedicated validation
   suites, and contrast is asserted automatically.
7. **No scope expansion** — PASS. Nothing outside the R01 spec is designed:
   no chat UI, no history list, no project pages, no Teacher, no file upload,
   no knowledge pipeline, no admin console, no billing, no model gateway.
   Reserved slots are inert by design.

**Final gate result: PASS.** No deviations from MUST-level principles, so no
Complexity Tracking entries and no amendment is required. The plan is ready
for `/speckit.tasks`.
