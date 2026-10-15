# Data Model: R01 — Platform Foundation & Application Shell

**Branch**: `001-platform-app-shell` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

## Scope note

R01 defines **no database, no ORM, and no server-side persistence**. The data
model below is the in-memory and browser-local contract model required by the
shell, plus the api contract payload. It is expressed technology-agnostically;
concrete types live in `packages/contracts`.

Server-side persistence is deferred to the roadmap features that need it
(R02 sessions, R03 preferences, R07 projects, etc.). R01 introduces none of it.

## Entities

### ShellMode

The application's authentication mode. Exactly one value is active at any time.

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `mode` | enum | `public`, `authenticated` | `public` = unauthenticated visitor; `authenticated` = signed-in user (FR-042) |

**Rules**

- Exactly two values exist; no third (e.g., "loading") mode is permitted
  (FR-042).
- In R01 the value is resolved from the shell contract, not from any login
  implementation (FR-046).
- `public` implies the public navigation set: only the sign-in and sign-up
  entry points plus public global actions; no module destination is visible
  or routable (FR-015, FR-058).
- `authenticated` implies the authenticated navigation set plus the account
  area (FR-043).
- Switching mode MUST NOT reload or restructure the shell frame (FR-045).

**State transitions**

```text
public ──(sign-in completed by R02)──▶ authenticated
authenticated ──(sign-out by R02)──▶ public
```

R01 defines the transitions' effect on the shell only; the triggers are owned
by R02. During R01 the contract exposes both values for testing through the
shell-mode seam.

### NavigationDestination

One addressable place in the shell's navigation.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (stable identifier) | Language- and label-independent; later features bind to this (FR-011, FR-056) |
| `moduleId` | ModuleId enum | The reserved product module this destination hosts; exactly one destination per module (FR-012) |
| `labelKey` | string | Key into the externalized string resources (FR-028); never a hard-coded string |
| `availability` | enum `reserved` \| `available` | All eight module destinations are `reserved` in R01 (FR-013, FR-050) |
| `visibilityScope` | enum `public` \| `authenticated` | All eight module destinations are `authenticated` (FR-015, FR-058) |
| `routePath` | string | The route slot the destination binds to |

**Rules**

- Exactly one destination exists per future product module (FR-012).
- The set of destinations is expressible as registry data, so a future module
  becoming available requires no change to the shell's layout or navigation
  contract (FR-014, FR-056).
- Activating a `reserved` destination presents the defined unavailable state
  and MUST NOT imply the feature exists (FR-013, FR-050).
- Exactly one destination is active at a time, and the navigation indicates
  which one it is (FR-010).

**Reserved destinations in R01**

| id | moduleId | availability | visibilityScope |
|----|----------|--------------|-----------------|
| `dest.general-chat` | `GENERAL_CHAT` | reserved | authenticated |
| `dest.conversations` | `CONVERSATIONS` | reserved | authenticated |
| `dest.projects` | `PROJECTS` | reserved | authenticated |
| `dest.private-teacher` | `PRIVATE_TEACHER` | reserved | authenticated |
| `dest.files` | `FILES` | reserved | authenticated |
| `dest.search` | `SEARCH` | reserved | authenticated |
| `dest.settings` | `SETTINGS` | reserved | authenticated |
| `dest.admin` | `ADMIN_CONTROL_CENTER` | reserved | authenticated |

The public navigation set contains no NavigationDestination rows — only the
sign-in and sign-up entry points (FR-058).

### ModuleId

The reserved identity of a future product module. This is the stable seam that
later roadmap features bind to.

| Value | Reserved for |
|-------|--------------|
| `GENERAL_CHAT` | R05 / R10 |
| `CONVERSATIONS` | R06 |
| `PROJECTS` | R07 |
| `PRIVATE_TEACHER` | R19–R22 |
| `FILES` | R08 |
| `SEARCH` | R06 |
| `SETTINGS` | R03 |
| `ADMIN_CONTROL_CENTER` | R27 / R28 |
| `KNOWLEDGE` | R12–R18 (reserved seam; no destination in R01) |
| `MEMORY` | R24 (reserved seam; no destination in R01) |
| `VOICE` | R25 (reserved seam; no destination in R01) |
| `AI_MODEL_GATEWAY` | R09 (reserved seam; no destination in R01) |

`KNOWLEDGE`, `MEMORY`, `VOICE`, and `AI_MODEL_GATEWAY` exist as identities only
— extension seams the constitution requires to remain distinguishable. They
have no navigation destination in R01 because none is specified for them.

### ShellRegion

One of the three primary areas of the shell.

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `id` | enum | `sidebar`, `header`, `main` | Exactly three region types exist (FR-001) |
| `state` | enum | `ready`, `loading`, `empty`, `error`, `unavailable` | Per-region state (FR-047–FR-050) |

**Rules**

- Exactly three region types; no fourth region (FR-001).
- Only the `main` region's content changes when moving between destinations
  (FR-003).
- The header hosts global actions and product identity; it is not a
  substitute for primary navigation (FR-004).
- Each region exposes a semantic landmark (FR-034).

**State transitions (per region, independently)**

```text
loading ──▶ ready
loading ──▶ empty      (nothing to show)
loading ──▶ error      (failure; retry offered where meaningful)
any    ──▶ unavailable (reserved destination selected; main region only)
ready  ──▶ loading     (navigating to another destination)
```

One region in `error` MUST NOT force another region out of its own state
(NFR-008).

### ViewportClass

The responsive class the shell is operating in.

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `class` | enum | `mobile`, `tablet`, `desktop` | Exactly one active (FR-016) |

**Resolution rule**: viewport width only, against fixed boundaries held in
`packages/contracts` — mobile `< 768px`, tablet `768–1023px`, desktop
`≥ 1024px` (A-02 decision). Pointer type and device hints are not consulted
(FR-016).

**Precedence rule**: the active class overrides any saved sidebar state that
is incompatible with it (FR-063) — expanded→tablet resolves to compact;
expanded/collapsed→mobile resolves to the drawer pattern.

**First-visit defaults** (FR-062): desktop → sidebar expanded; tablet →
sidebar compact; mobile → overlay drawer, no permanent sidebar.

### ThemeMode

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `theme` | enum | `light`, `dark`, `system` | Exactly three modes (FR-029) |
| `resolvedTheme` | enum | `light`, `dark` | What is actually rendered; `system` resolves to one of these via the device preference |

**Rules**

- `system` follows device preference changes at runtime (FR-031); OSes
  exposing no preference fall back to `light` (A-07).
- Selection persists across reloads within the same browser (FR-032).
- Applies to every region including the drawer, with no unthemed region
  (FR-030).
- First visit with no saved preference defaults to `system` (FR-060).
- No theme disables any navigation or shell control (FR-033).

### Direction

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `direction` | enum | `rtl`, `ltr` | Set on the application root as the single source of truth (FR-024) |
| `activeLocale` | string | `fa`, `ar`, `en` | The active interface language |

**Locale → direction mapping**

| Locale | Direction |
|--------|-----------|
| `fa` | `rtl` |
| `ar` | `rtl` |
| `en` | `ltr` |

**Rules**

- The active language is the single source of truth for the initial direction
  when no saved preference exists, so the two cannot diverge at first paint
  (FR-061).
- Switching direction mirrors every region with no clipping, overlap, or
  hidden region (FR-025), and requires no reload (FR-027).
- Collapse/expand and drawer open/close behave identically in both
  directions, anchored correctly (FR-026).

### ShellConfiguration

The user's shell-level presentation choices, persisted browser-locally.

| Field | Type | Default when unset | Persistence |
|-------|------|--------------------|-------------|
| `theme` | ThemeMode | `system` (FR-060) | localStorage, same browser |
| `direction` | Direction | derived from active locale (FR-060, FR-061) | localStorage, same browser |
| `sidebarState` | enum `expanded` \| `collapsed` | desktop: `expanded`; tablet: `collapsed` (FR-062) | localStorage, same browser |
| `activeLocale` | string | platform default locale, falling back to `fa` | localStorage, same browser |

**Rules**

- Persistence scope is the same browser; no cross-device sync (A-05).
- The active ViewportClass overrides an incompatible saved `sidebarState`
  (FR-063).
- First visit MUST NOT require the visitor to choose theme or language before
  the shell renders (FR-060).

### ShellPreferencesRecord (browser-local shape)

The concrete persisted record behind ShellConfiguration. Keys are namespaced
to avoid collisions with later features.

| Key | Value | Owner |
|-----|-------|-------|
| `mahak.shell.theme` | `light` \| `dark` \| `system` | R01 shell |
| `mahak.shell.direction` | `rtl` \| `ltr` | R01 shell |
| `mahak.shell.sidebar` | `expanded` \| `collapsed` | R01 shell |
| `mahak.shell.locale` | `fa` \| `ar` \| `en` | R01 shell |

Later features MUST use their own namespaced keys and MUST NOT write shell
keys (FR-057).

## Relationship map

```text
AppShell
  ├── ShellMode ──────────▶ selects NavigationDestination visibility scope
  ├── ViewportClass ──────▶ selects navigation presentation
  │                        (open sidebar | compact rail | overlay drawer)
  ├── ShellConfiguration ─▶ theme + direction + sidebarState + locale
  │      ▲                  persisted browser-locally
  │      └── first-visit defaults
  └── ShellRegion × 3 (sidebar | header | main)
         ├── state: ready | loading | empty | error | unavailable
         └── NavigationDestination[] (sidebar/header only)
                 ├── moduleId ──▶ ModuleId (reserved seam)
                 └── availability: reserved | available
                         (all `reserved` in R01)
```

## Validation rules summary

- Exactly 3 region types (FR-001); exactly 8 module destinations (FR-012);
  exactly 2 shell modes (FR-042); exactly 3 theme modes (FR-029); exactly 3
  viewport classes (FR-016).
- All module destinations are `authenticated` scope and `reserved`
  availability in R01 (FR-013, FR-015, FR-058).
- No region is hidden, clipped, or overlapped in any of
  3 viewport classes × 2 directions × 2 resolved themes
  (FR-021, FR-025, FR-030, NFR-007).
- No credential, secret, or provider key appears in any entity, persisted
  record, or api payload (NFR-006).
