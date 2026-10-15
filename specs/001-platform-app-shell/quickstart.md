# Quickstart: R01 — Platform Foundation & Application Shell

**Branch**: `001-platform-app-shell` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Runnable validation scenarios that prove the R01 shell works end-to-end.
This is a validation guide; implementation details belong in `tasks.md` and
the implementation phase.

## Prerequisites

- Node.js (current LTS) and pnpm 10+
- Python 3.12
- A modern browser (current or previous major version)
- No credentials, secrets, or API keys are required — R01 has none (NFR-006)

## Setup

From the repository root (once the workspace exists):

```bash
pnpm install
```

The Python api uses its own environment, created from `apps/api`:

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux / macOS
pip install -e apps/api
```

## 1. Whole-frame startup loading (FR-059, NFR-001)

**Validate**: the shell never shows a partially assembled or blank frame.

- Start the web dev server: `pnpm --filter @mahak/web dev`
- Open the app and throttle the network in browser devtools to a slow
  profile.
- **Expected**: all three regions (sidebar, header, main) appear together in
  an inert whole-frame loading state, then transition to the interactive
  shell with no reload and no re-layout.
- **Pass**: transition completes and the interactive shell is usable; the
  frame never appears partially assembled.

## 2. Shell regions and navigation (FR-001–FR-015, SC-002)

**Validate**: three stable regions and a complete reserved navigation set.

- Sign in to the authenticated shell (R01 test harness or the shell-mode
  seam; R01 implements no login).
- **Expected**: exactly one navigation, one header, and one main region;
  the eight reserved destinations are present; activating a reserved
  destination shows the defined unavailable state, not a fabricated feature.
- **Pass**: all eight destinations map one-to-one to the roadmap modules and
  none implies an implemented feature.
- **Automated**: `pnpm --filter @mahak/web test component` — region and
  registry suites.

## 3. Sidebar collapse/expand and persistence (FR-006–FR-009, SC-003)

**Validate**: the collapse control and its memory.

- Collapse the sidebar, reload the page.
- **Expected**: main content area expands on collapse; the rail keeps every
  destination reachable; the collapsed state is restored after reload.
- **Pass**: reload preserves the state; collapse completes within the
  interaction budget (NFR-003).
- **Automated**: component suite for collapse/expand; E2E for reload
  persistence.

## 4. Responsive validation (FR-016–FR-022, SC-004)

**Validate**: correct navigation presentation per viewport class.

- Run the E2E viewport matrix: `pnpm --filter @mahak/web test:e2e`
- **Expected at 360/480px (mobile)**: no permanent sidebar; a persistent
  control opens the overlay drawer; drawer closes via close affordance,
  destination selection, or backdrop; no horizontal scrollbar.
- **Expected at 768/900px (tablet)**: compact rail by default; expandable;
  no horizontal scrollbar.
- **Expected at 1024/1440/1920px (desktop)**: expanded sidebar by default;
  no horizontal scrollbar.
- **Cross-breakpoint**: resizing across a boundary leaves no residual
  overlay, scrim, or duplicated navigation; reloading an expanded state into
  the tablet class resolves to compact and into the mobile class resolves to
  the drawer (FR-063).
- **Pass**: all widths behave as specified; see [plan.md](plan.md) Testing
  Strategy for the full matrix.

## 5. RTL/LTR validation (FR-023–FR-028, SC-005)

**Validate**: direction foundation across all three locales.

- Set the active language to `fa`, then `ar`, then `en`.
- **Expected**: `fa` and `ar` render RTL with the sidebar on the right; `en`
  renders LTR with the sidebar on the left; switching mid-session mirrors
  every region with no clipping, overlap, hidden region, or reload;
  collapse/expand behaves identically in both directions.
- **Pass**: identical usability in both directions for all three locales.
- **Automated**: E2E direction suite.

## 6. Theme validation (FR-029–FR-033, SC-006, SC-008)

**Validate**: Light/Dark/System behavior and contrast.

- Select Light, then Dark, then System; reload after each selection.
- **Expected**: every region including the drawer adopts the selected theme
  with no unthemed region; selection persists across reload; System follows a
  device appearance-preference change; no theme disables any control.
- **Pass**: all three modes behave as specified and contrast assertions
  (≥ 4.5:1) pass in both resolved themes.
- **Automated**: E2E theme suite + jest-axe contrast assertions.

## 7. Accessibility validation (FR-034–FR-041, SC-007, NFR-007)

**Validate**: keyboard, screen-reader, and contrast behavior.

- Keyboard-only: travel header → sidebar → collapse control → main region and
  back; use the skip-to-main link; open and close the mobile drawer.
- **Expected**: visible focus indicator at every stop; logical focus order;
  focus moves into the drawer on open and returns to the opener on close;
  all three regions announced as distinct semantic regions; every interactive
  control has a meaningful accessible name; state changes announced.
- Re-run at 200% browser zoom and at mobile width.
- **Pass**: all interactions complete without a mouse at both zoom levels.
- **Automated**: jest-axe assertions + keyboard E2E.

## 8. Shell states and offline (FR-047–FR-052, SC-009, NFR-008)

**Validate**: loading, empty, error, unavailable, and offline behavior.

- Force each condition: resolve a slow fixture, an empty fixture, a failing
  fixture, a reserved destination, and emulated offline.
- **Expected**: the matching state appears in the affected region with
  plain-language text and a retry action where meaningful; the rest of the
  shell stays usable; offline shows the interrupted indication and preserves
  rendered regions; no blank page and no crash.
- **Pass**: all five states are demonstrable on demand and honor the active
  theme and direction.
- **Automated**: component state suite + E2E offline emulation.

## 9. Public vs authenticated shell boundary (FR-042–FR-046, FR-058)

**Validate**: the shell-mode contract, without authentication.

- Drive the shell into `public` mode, then `authenticated` mode through the
  shell-mode seam (no login exists in R01).
- **Expected (public)**: header presents the sign-in and sign-up entry
  points; no module destination is visible or routable; reaching a module
  route resolves to the sign-in entry point.
- **Expected (authenticated)**: all eight reserved destinations are presented
  with the defined unavailable state; the account area is presented.
- **Pass**: mode switch changes navigation sets without reloading or
  redesigning the shell frame.

## 10. API contract and Python compilation gate (FR-055, NFR-005)

**Validate**: the api boundary and the constitution's Python gate.

- Start the api: run `uvicorn mahak_api.main:app --reload` from the activated
  venv, or the workspace dev script.
- `GET /api/v1/shell` — **Expected** `200` with `apiVersion`, `shellMode`,
  the eight `reserved` feature values, and the locale → direction map. No
  credential, secret, or user data appears in the response.
- **Stability check**: the endpoint path and response shape are stable, so a
  later feature that flips a `features` value to `available` (or R02 making
  `shellMode` session-aware) still satisfies this scenario's expected
  response shape — only the carried values change. Later business
  capabilities reach the client through their own versioned routes, not by
  extending this endpoint.
- Python compilation gate: `python -m compileall apps/api`
  — **Expected**: compiles with no errors.
- **Automated**: `pytest` from `apps/api`.

## Smoke summary

| # | Scenario | Key requirements |
|---|----------|------------------|
| 1 | Whole-frame startup loading | FR-059, NFR-001 |
| 2 | Shell regions and reserved navigation | FR-001–FR-015, SC-001, SC-002 |
| 3 | Sidebar collapse/expand + persistence | FR-006–FR-009, SC-003 |
| 4 | Responsive desktop/tablet/mobile | FR-016–FR-022, FR-062, FR-063, SC-004 |
| 5 | RTL/LTR across fa/ar/en | FR-023–FR-028, SC-005 |
| 6 | Light/Dark/System themes + contrast | FR-029–FR-033, SC-006, SC-008 |
| 7 | Accessibility, keyboard, and 200% zoom | FR-034–FR-041, SC-007, NFR-007 |
| 8 | Shell states and offline resilience | FR-047–FR-052, SC-009, NFR-008 |
| 9 | Public vs authenticated boundary | FR-042–FR-046, FR-058 |
| 10 | API contract and Python compile gate | FR-055, NFR-005 |

## Expected end state

All ten scenarios pass, `python -m compileall apps/api` is clean, and no
scenario requires a credential, secret, or live external service. If a
scenario fails, fix the failure at its source — do not weaken assertions or
disable tests (constitution, Development Workflow gates).

## References

- [spec.md](spec.md) — requirements and acceptance scenarios
- [plan.md](plan.md) — architecture, boundaries, testing strategy,
  traceability
- [data-model.md](data-model.md) — entities and state transitions
- [contracts/](contracts) — shell-mode, navigation, theme, and api contracts
