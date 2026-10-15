# Research: R01 — Platform Foundation & Application Shell

**Branch**: `001-platform-app-shell` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

## Purpose

Resolve the technical unknowns named in the plan's Technical Context and the
two spec-level deferred decisions (A-02, A-08) so that Phase 1 design and the
later task breakdown are implementation-ready. Every entry records the
decision, the rationale, and the alternatives that were considered and
rejected.

## R-01 — Monorepo vs single-project layout

**Decision**: pnpm workspace monorepo with `apps/web`, `apps/api`, and
`packages/contracts`.

**Rationale**: The constitution requires clear separation between User
Experience, Application/API, and platform domains, and requires domains to
remain independently evolvable. Workspace boundaries make that separation
structural and machine-checkable rather than merely nominal: the web client
cannot import Python modules, the api cannot render UI, and both depend
inward on the shared contract package rather than outward on each other. It
also gives later roadmap features a place to land as additional
packages/apps without restructuring the shell.

**Alternatives considered**:

- *Single-project (one `src/` tree)* — rejected: it cannot express the
  frontend/backend/contract separation the constitution mandates, and future
  domains would have no structural home.
- *Separate repositories* — rejected at R01: the platform has no deployed
  boundary yet, and splitting now would distribute contract definitions
  across repos with no benefit. Can be split later at a real seam.

## R-02 — Frontend stack

**Decision**: React 19 + Vite + React Router, TypeScript.

**Rationale**: A component model is the natural fit for a shell composed of
three stable regions plus providers for theme, direction, viewport class, and
shell mode, and React Router gives the navigation registry a place to bind
reserved destination ids to lazy route slots. Vite keeps the dev loop fast,
which directly serves the 2-second interactive-shell target. TypeScript is
required to make the shared contract package meaningful to both layers.

**Alternatives considered**:

- *Vue / Svelte* — rejected: equally capable, but a smaller hiring and
  ecosystem surface for the multi-domain platform ahead, and no decisive
  advantage for this shell.
- *Next.js / Remix* — rejected for R01: their value is server rendering and
  data loading for feature pages, which R01 deliberately does not build. They
  can be introduced later behind the api boundary if a feature needs them.

## R-03 — Backend stack and Python gate

**Decision**: Python 3.12 + FastAPI, minimal bootstrap with one contract
route.

**Rationale**: The constitution's Principle V requires the backend to pass
`compileall` validation, which fixes Python as the backend language for the
platform. Establishing the api skeleton in R01 satisfies the constitution's
API-first requirement and gives the Python gate something real to validate
from the first feature onward, without introducing business logic that R01
must not contain.

**Alternatives considered**:

- *Node/TypeScript api* — rejected: contradicts the constitution's Python
  `compileall` gate, which implies a Python backend.
- *No api at all in R01* — rejected: the API-first requirement and the
  "protected backend capabilities" boundary in FR-055 need a live, if
  minimal, contract endpoint to exist. Stability is achieved by keeping the
  path and response shape fixed and letting later features update only the
  carried values while adding their own versioned business routes.

## R-04 — Shared contract package

**Decision**: A dependency-free TypeScript package (`packages/contracts`)
holds ShellMode, ModuleId, NavigationDestination, ViewportClass, ThemeMode,
Direction, and FeatureAvailability; the api mirrors the same values.

**Rationale**: FR-053 and FR-056 require stable, technology-agnostic
contracts, and FR-057 requires shell-level state to be consumable by future
modules while feature state stays owned by its own feature. A single
contract package makes drift between the web client and the api a type error
rather than a runtime incident, and gives later modules exactly one place to
declare their identity.

**Alternatives considered**:

- *Codegen from the api* — rejected at R01: one route does not justify a
  generator, and codegen couples the contract to the api build.
- *Hand-maintained duplicates per app* — rejected: violates the
  duplicated-business-logic prohibition in Principle I.

## R-05 — Shell state management

**Decision**: Local React context providers per concern (theme, direction,
viewport class, shell mode, preferences); no global store.

**Rationale**: R01 state is presentation state only, and each concern has a
small, independent surface. Per-concern providers keep feature/domain state
out of the shell entirely — satisfying FR-054 and FR-057 — and they are
individually testable, which serves NFR-005. A global store would centralize
state the shell is explicitly required not to own.

**Alternatives considered**:

- *Global store (Redux/Zustand)* — rejected: invites shell-owned feature
  state, which FR-057 forbids, and adds machinery for state that is local to
  presentation.
- *URL state only* — rejected: theme, direction, viewport class, and offline
  status are not route state.

## R-06 — Viewport class resolution strategy

**Decision**: Viewport width only, against fixed boundaries
(mobile `< 768px`, tablet `768–1023px`, desktop `≥ 1024px`), ignoring pointer
type and device hints.

**Rationale**: The clarified R01 rule (FR-016, A-02) requires exactly one
class to be active, resolved from width alone. A single signal is trivially
testable with a resize matrix and behaves identically across devices — a wide
touch laptop resolves to desktop, a narrow desktop window resolves to mobile —
which is exactly the deterministic behavior the responsive suite asserts.

**Alternatives considered**:

- *Width plus pointer/media features* — rejected: produces combined classes
  like "wide touch" that have no specified behavior in R01 and make startup
  non-deterministic relative to the spec.
- *Server-side or UA-sniffed classes* — rejected: the spec scopes resolution
  to the browser viewport, and UA sniffing is unreliable and untestable.

## R-07 — Theme implementation

**Decision**: CSS custom properties for design tokens, switched by a `data-theme`
attribute on the application root; `System` mode subscribes to the device
preference and resolves to Light or Dark.

**Rationale**: Token-level theming guarantees every region — sidebar, header,
main, drawer — resolves from the same source, which is what FR-030 asserts.
Attribute-based switching works identically in RTL and LTR and never requires
a reload, serving FR-025 and FR-027. Keeping tokens in CSS means contrast can
be asserted automatically per theme.

**Alternatives considered**:

- *CSS-in-JS / runtime theme objects* — rejected: runtime style computation
  adds work on the critical path toward the 2-second interactivity target.
- *Prefers-color-scheme media query alone* — rejected: it cannot express the
  explicit Light and Dark selections that FR-029 requires alongside System.

## R-08 — RTL/LTR implementation

**Decision**: Logical CSS properties plus a single `dir` attribute on the
application root; direction is derived from the active language when no saved
preference exists.

**Rationale**: FR-024 makes the root direction the single source of truth and
FR-025 requires every region to mirror without clipping or overlap. Logical
properties make mirroring a consequence of the root attribute rather than N
per-component conditionals, which is the only way the RTL/LTR suite can assert
identical behavior for collapse/expand and drawer open/close in both
directions (FR-026). Deriving the initial direction from the active language
prevents the two from diverging at first paint (FR-061).

**Alternatives considered**:

- *Per-component direction conditionals* — rejected: duplicated logic and a
  proven source of mirroring bugs, which Principle I prohibits.
- *Two separate stylesheets* — rejected: doubles the surface that must be
  kept in sync and makes direction switching require a reload.

## R-09 — Preferences persistence

**Decision**: `localStorage` keys scoped to shell preferences only; no
cross-device sync.

**Rationale**: FR-008 and FR-032 only require persistence across reloads
within the same browser, and A-05 explicitly scopes persistence to the same
browser. localStorage needs no server, no account, and no credential, which
keeps R01 free of authentication concerns (FR-046) and free of secrets
(NFR-006).

**Alternatives considered**:

- *Server-stored preferences* — rejected: requires the account and
  authorization machinery that R01 must not build, and is owned by R03.
- *SessionStorage* — rejected: does not survive the reload that FR-008 and
  FR-032 explicitly require.

## R-10 — Shell mode contract (public vs authenticated)

**Decision**: `ShellMode` is a two-valued contract (`public | authenticated`)
consumed by the web client; no authentication is implemented. In public mode
the sidebar renders no module destinations and the sign-in/sign-up entry
points live in the header.

**Rationale**: FR-042–FR-046 require the boundary to exist as a contract that
R02 later implements, and the clarification settled that all eight module
destinations are authenticated-scoped. Placing sign-in/sign-up in the header
matches FR-004 (header owns global actions) and yields the smallest testable
public surface. The web client must also remain usable when the api is
unreachable, so mode and availability resolve locally with the api as the
declared source. R02 extends only the server-side resolution of `shellMode`
— from R01's public/default behavior to session-aware behavior — while the
endpoint path, the response schema, the `ShellMode` enum values, and the
navigation semantics stay unchanged; no redesign of the shell is involved.

**Alternatives considered**:

- *Implement a real login stub* — rejected: FR-046 explicitly forbids
  authentication in R01.
- *Render all destinations as disabled in public mode* — rejected: it implies
  features exist and contradicts the clarification that the public navigation
  set contains no module destinations.

## R-11 — Testing toolchain

**Decision**: Vitest + React Testing Library for unit/component, Playwright
for E2E (viewport, RTL, theme, a11y), jest-axe for automated contrast and
a11y assertions, pytest for the api contract route; all external services
mocked.

**Rationale**: NFR-005 demands deterministic automated coverage of layout,
responsive classes, direction, theme, accessibility semantics, and every
application state. Playwright is the only tool that can genuinely resize a
viewport and emulate offline, which the responsive and state suites require;
jest-axe turns the contrast requirement (FR-041) into an assertion rather
than a manual check; React Testing Library drives behavior through accessible
roles, which keeps tests aligned with the accessibility requirements.

**Alternatives considered**:

- *jsdom-only testing* — rejected: jsdom has no real layout or media-query
  evaluation, so responsive, RTL, and contrast assertions would be
  untestable.
- *Cypress* — rejected: equally capable for E2E but weaker for the
  multi-project viewport matrix, and Playwright's browser-context offline
  emulation is required by the state suite.

## R-12 — Accessibility approach

**Decision**: WAI-ARIA landmarks for the three regions, skip-to-main link,
visible focus styles, accessible names on every interactive control, focus
management for the mobile drawer, and contrast tokens asserted per theme.

**Rationale**: FR-034–FR-041 are MUST-level and map directly onto standard
landmark and focus-management patterns, which are also what screen readers
announce reliably. Assertion via jest-axe plus a keyboard-only E2E makes the
requirements verifiable rather than aspirational, and FR-039's drawer focus
return is only provable with real focus movement.

**Alternatives considered**:

- *Manual a11y review only* — rejected: constitution Principle V requires
  automated verification, and manual review does not regress-proof theme
  contrast.

## R-13 — Deferred decision A-02 (viewport boundaries)

**Decision**: mobile `< 768px`; tablet `768–1023px`; desktop `≥ 1024px`.

**Rationale**: The spec left the numeric boundaries to the plan (A-02) while
fixing the rule (width-only). These three boundaries are the most widely
supported split in the platform and its testing tooling, and they sit at
natural layout transitions: below 768px a permanent sidebar leaves too little
content width (FR-019 forces a drawer), and above 1024px an expanded sidebar
leaves comfortable content width (FR-017). Keeping the constants in
`packages/contracts` lets the app and the test matrix share one definition.

**Alternatives considered**:

- *Two boundaries only (mobile < 768, desktop ≥ 768)* — rejected: the spec
  mandates three classes (FR-016), so a two-band model cannot express tablet.
- *Four or more classes* — rejected: R01 specifies exactly three; extra
  classes would be untested behavior with no requirement behind them.

## R-14 — Deferred decision A-08 (public navigation presentation)

**Decision**: In public mode, the sidebar region renders no navigation
destinations and the sign-in/sign-up entry points are global actions in the
header region.

**Rationale**: The clarification requires the public navigation set to
contain only sign-in/sign-up entry points and public global actions (FR-058).
The header is already the defined home of global actions (FR-004), so placing
them there keeps the three-region contract uniform in both modes and gives
R02 one stable attachment point. Rendering the sidebar region with an empty
navigation set keeps the shell frame identical across modes, which is what
FR-045 (no shell redesign on mode change) requires.

**Alternatives considered**:

- *Show eight disabled destinations in public mode* — rejected: implies the
  features exist and is explicitly outside the clarification's answer.
- *A separate public landing page without the shell* — rejected: would
  create a second shell to maintain and would contradict the single
  top-level shell requirement (FR-001).

## Open items

None. All Technical Context entries are resolved, both deferred decisions
(A-02, A-08) are settled, and no `[NEEDS CLARIFICATION]` markers remain. The
research decisions feed directly into `data-model.md`, `contracts/`, and
`quickstart.md`.
