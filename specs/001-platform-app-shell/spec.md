# Feature Specification: R01 — Platform Foundation & Application Shell

**Feature Branch**: `001-platform-app-shell`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Establish the foundational MAHAK web application shell — overall layout, persistent navigation, collapsible sidebar, core shell regions, responsive desktop/tablet/mobile behavior, RTL/LTR direction foundation, Light/Dark/System theme foundation, shell-level accessibility, shell application states, and the conceptual public vs authenticated shell boundary — while reserving stable entry points for future product modules. Excludes authentication, chat, history, search, projects, files, Teacher, knowledge, voice, memory, admin, billing, and model infrastructure."

**Roadmap Traceability**: `ROADMAP.md` → entry **R01 — Platform Foundation & Application Shell** (Phase A — Platform Foundation; depends on nothing; R02, R04, R05, R09 depend on this).

**Governing Document**: `.specify/memory/constitution.md` — Principles I (architectural discipline), IV (security/privacy boundaries), V (test-backed development), plus the *Security & Cross-Platform Constraints* section.

## Clarifications

### Session 2026-09-24

- Q: When the shell is in public (unauthenticated) mode, which of the eight reserved module destinations should appear in the navigation? → A: All eight module destinations are authenticated-scoped; the public shell's navigation carries only the sign-in/sign-up entry points and public global actions.
- Q: How should the shell decide which viewport class (desktop, tablet, or mobile) is active at startup? → A: Match by viewport width only, with fixed class boundaries; a wide touch device resolves to desktop and a narrow desktop window to mobile.
- Q: On initial shell load, what should the shell show across the whole frame while the shell itself is still preparing? → A: Show a whole-frame loading state (all three regions present but inert) until the shell is interactive, then switch to per-region loading states.
- Q: Which of the three theme modes and the two layout directions should the shell apply on a first visit with no saved preference? → A: Default to System theme and to the direction of the active language (RTL for Persian/Arabic, LTR otherwise).
- Q: What default navigation state should the shell assume on a first visit with no saved preference — sidebar expanded, sidebar collapsed, or class-dependent? → A: Expanded on desktop, collapsed on tablet; mobile is unaffected since its navigation is a drawer.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Application Shell Regions (Priority: P1)

A first-time visitor opens MAHAK in a desktop browser and sees one coherent application frame: a left navigation/sidebar area, a top header area, and a main content area. The three regions are immediately distinguishable, and the main content area is visually and structurally the primary destination for content.

**Why this priority**: Without stable, identifiable shell regions, no later module (chat, projects, teacher, admin) can be hosted. This is the minimal viable shell and the single most critical deliverable of R01.

**Independent Test**: Render the shell alone, with no feature content loaded; a reviewer can point to the navigation area, the header area, and the main content area, and each region keeps a stable, predictable position.

**Acceptance Scenarios**:

1. **Given** the MAHAK web application is opened for the first time in a desktop browser, **When** the shell finishes loading, **Then** exactly one sidebar/navigation area, one header area, and one main content area are visible, and each is visually distinguishable.
2. **Given** the shell is displayed, **When** a reviewer inspects the page structure, **Then** each region is addressable as a distinct, named area of the application (navigation, header/banner, main content) rather than an unstructured page.
3. **Given** the shell is displayed, **When** the main content area contains no feature content, **Then** a defined empty state is shown inside the main content area, not a blank or broken page.
4. **Given** two different shell destinations are opened, **When** they render, **Then** the sidebar and header regions remain in fixed positions and only the main content area changes.
5. **Given** the application is loading and the shell is not yet interactive, **When** the frame is displayed during startup, **Then** a whole-frame loading state is shown in which all three regions are present but inert, and it is replaced by the interactive shell — including any per-region loading states — once the shell is interactive.

---

### User Story 2 - Persistent Primary Navigation with Collapsible/Expandable Sidebar (Priority: P1)

A regular user wants the navigation to stay available while working, but also wants to reclaim horizontal space for content. The user collapses the sidebar to a compact rail (or expands it back to full width) using a single, always-reachable control, and the chosen state persists when the page is reloaded.

**Why this priority**: Navigation is the backbone of a ChatGPT-like application. Collapsible navigation is the core interaction pattern that later conversation history (R06), projects (R07), and settings will rely on.

**Independent Test**: Collapse the sidebar with one action, confirm the main content area grows and navigation remains reachable, reload the browser, and confirm the collapsed state is retained.

**Acceptance Scenarios**:

1. **Given** the sidebar is expanded, **When** the user activates the collapse control, **Then** the sidebar transitions to a compact state that consumes substantially less horizontal space, and the main content area expands accordingly.
2. **Given** the sidebar is collapsed, **When** the user activates the expand control, **Then** the sidebar returns to its full-width state and destination labels become fully readable again.
3. **Given** the user has collapsed the sidebar, **When** the application is reloaded, **Then** the sidebar opens in the collapsed state without any additional user action.
4. **Given** the sidebar is collapsed to a compact rail, **When** the user needs to reach a navigation destination, **Then** every primary destination remains reachable from the rail, either through icons or through an affordance that reveals the full navigation.
5. **Given** the sidebar is in either state, **When** the user activates a navigation destination, **Then** the destination is marked as active and the main content area is updated.

---

### User Story 3 - Public vs Authenticated Shell Boundary (Priority: P1)

A product owner needs MAHAK to behave as two clearly distinct experiences: a **public (unauthenticated) shell** shown to visitors who are not signed in, and an **authenticated shell** shown to signed-in users. R01 does not implement sign-in — it defines where the boundary lives and how the shell signals which mode it is in.

**Why this priority**: The constitution requires explicit authorization boundaries (Principle IV). Establishing the boundary in R01 means R02 can implement authentication without restructuring the shell.

**Independent Test**: With authentication deliberately not implemented, drive the shell into each mode using its defined boundary contract and verify that the correct regions and navigation set are presented.

**Acceptance Scenarios**:

1. **Given** the shell is in public (unauthenticated) mode, **When** a visitor views the application, **Then** only the defined sign-in/sign-up entry points and public global actions are presented, and no reserved module destination is visible or reachable through the shell.
2. **Given** the shell is in authenticated mode, **When** a signed-in user views the application, **Then** the authenticated navigation set and account area are presented in the shell.
3. **Given** the shell is in public mode, **When** the visitor attempts to reach an authenticated destination, **Then** the shell routes the visitor to the defined sign-in entry point rather than exposing protected content.
4. **Given** the shell is in either mode, **When** the mode changes, **Then** the transition happens without reloading or redesigning the core shell frame.

---

### User Story 4 - Responsive Shell Across Desktop, Tablet, and Mobile (Priority: P2)

A user switches between a desktop monitor, a tablet, and a phone. On each device the shell stays usable: on desktop the sidebar can stay open; on tablet it can be collapsed; on mobile the navigation becomes an overlay/drawer that opens on demand and does not consume permanent screen space.

**Why this priority**: The constitution requires the frontend to remain usable at desktop, tablet, and mobile breakpoints. It is P2 because the shell must exist first (P1) before responsive refinement is meaningful.

**Independent Test**: Resize the viewport (or use device emulation) across the three defined size classes and confirm the navigation adapts as specified without horizontal scrolling or unreachable controls.

**Acceptance Scenarios**:

1. **Given** a desktop-class viewport, **When** the shell loads, **Then** the sidebar defaults to an expanded or easily expandable state beside the main content area.
2. **Given** a tablet-class viewport, **When** the shell loads or space becomes limited, **Then** the sidebar offers its collapsed/compact form so the main content area remains comfortably usable.
3. **Given** a mobile-class viewport, **When** the shell loads, **Then** the sidebar is not permanently visible and a persistent control opens it as an overlay drawer.
4. **Given** the first visit with no saved sidebar preference, **When** the shell loads in the desktop class, **Then** the sidebar opens in the expanded state, and **when** it loads in the tablet class, **Then** the sidebar opens in the collapsed/compact state.
5. **Given** the mobile navigation drawer is open, **When** the user selects a destination or activates the close affordance (including the scrim/backdrop), **Then** the drawer closes and the main content area becomes the focus again.
6. **Given** any viewport size, **When** the shell renders, **Then** no region requires horizontal scrolling to read or reach primary controls.

---

### User Story 5 - RTL/LTR Direction Foundation (Priority: P2)

A Persian- or Arabic-speaking user opens MAHAK and the entire shell lays out right-to-left; an English-speaking user gets left-to-right. Switching direction mirrors the layout without redesigning the shell and without hiding or breaking any region.

**Why this priority**: The constitution mandates Persian, Arabic (RTL) and English (LTR) support from the beginning, and that language selection MUST affect layout direction. This is a P2 foundation that must be in place before R03 delivers the full localization experience.

**Independent Test**: Set the shell's active language to Persian, Arabic, and English in sequence; verify the sidebar appears on the appropriate side for each direction and that all shell regions remain fully usable.

**Acceptance Scenarios**:

1. **Given** the active language is Persian or Arabic, **When** the shell renders, **Then** the whole shell layout is right-to-left and the sidebar appears on the right side.
2. **Given** the active language is English, **When** the shell renders, **Then** the whole shell layout is left-to-right and the sidebar appears on the left side.
3. **Given** the shell is rendered in one direction, **When** the direction is switched to the other, **Then** every shell region mirrors correctly, no content is clipped or overlapped, and no region is hidden.
4. **Given** the shell is in RTL mode, **When** the sidebar is collapsed and expanded, **Then** the collapse/expand behavior works identically to LTR mode, anchored to the correct side.

---

### User Story 6 - Theme Foundation: Light, Dark, and System (Priority: P2)

A user prefers a dark interface at night and a light one during the day, or wants MAHAK to follow the operating system setting automatically. Selecting a theme changes the appearance of every shell region consistently, and the choice is remembered.

**Why this priority**: The constitution requires Light, Dark, and System/Automatic theme modes. P2 because it is a required foundation, but it does not gate the shell's existence.

**Independent Test**: Select Light, Dark, and System in turn; confirm each region of the shell (sidebar, header, main content, drawer) follows the selected theme and that the selection survives a reload.

**Acceptance Scenarios**:

1. **Given** the Light theme is selected, **When** the shell renders, **Then** all shell regions present the light appearance consistently.
2. **Given** the Dark theme is selected, **When** the shell renders, **Then** all shell regions present the dark appearance consistently, with no unthemed or glaringly bright region.
3. **Given** the System theme is selected, **When** the device's appearance preference changes, **Then** the shell follows the device preference without requiring a manual theme change.
4. **Given** the user has selected a theme, **When** the application is reloaded, **Then** the previously selected theme is applied automatically.
5. **Given** any theme, **When** the sidebar, header, and main content area are displayed together, **Then** text remains legible in every region (no text/background combination below the contrast requirement).

---

### User Story 7 - Shell-Level Accessibility (Priority: P2)

A user who relies on keyboard navigation or a screen reader must be able to orient in the shell, move between regions, operate the sidebar controls, and understand the current state without using a mouse.

**Why this priority**: The constitution requires accessibility to be considered in all interactive UI components. It is P2 rather than P1 only because accessibility attributes ride on top of the shell structure delivered by P1; it is still a MUST-level requirement for R01 completion.

**Independent Test**: Unplug the mouse, use only the keyboard to travel from the header to the sidebar, collapse/expand it, reach the main content area, and return; then repeat the same journey with a screen reader running and confirm every region and control is announced meaningfully.

**Acceptance Scenarios**:

1. **Given** the shell is displayed, **When** the user presses the Tab key repeatedly, **Then** focus moves through the header, sidebar, and main content area in a logical, predictable order with a visible focus indicator at every stop.
2. **Given** focus is on the sidebar collapse control, **When** the user activates it with the keyboard, **Then** the sidebar state changes and the change is communicated to assistive technology.
3. **Given** the shell is displayed, **When** a screen reader navigates the page, **Then** the navigation, header, and main content areas are announced as distinct semantic regions (landmarks), including a way to skip directly to the main content area.
4. **Given** any interactive shell control (collapse/expand, drawer open/close, navigation destination), **When** it is inspected, **Then** it exposes a meaningful accessible name and behaves as a standard interactive control.
5. **Given** the mobile navigation drawer is opened, **When** focus is inside the drawer, **Then** focus is moved into the drawer and is not lost to content hidden behind it.

---

### User Story 8 - Shell Application States (Priority: P3)

A user opens MAHAK on a slow connection, or while a region is still preparing, or when something has gone wrong. The shell must never look broken: loading regions show a loading state, empty regions show a helpful empty state, failures show an error state, and unavailable/offline conditions are communicated clearly.

**Why this priority**: These states are required for a trustworthy shell but are refinements on top of the working shell; they are P3 and can land after the primary shell behavior.

**Independent Test**: Force each condition (a slow region, a region with no content, a failing region, no network) and verify the shell presents the matching defined state and a recovery path where one exists.

**Acceptance Scenarios**:

1. **Given** a shell region's content is still being prepared, **When** the region renders before content is ready, **Then** a loading state is shown inside that region and the rest of the shell remains usable.
2. **Given** a shell region has no content to display, **When** it renders, **Then** a defined empty state is shown that explains the condition in plain language.
3. **Given** a shell region fails to load its content, **When** the failure occurs, **Then** an error state is shown with a plain-language message and, where a retry is meaningful, a retry action.
4. **Given** a feature destination is defined in the shell but not yet available, **When** the user reaches it, **Then** an explicit unavailable state is shown instead of a crash, a blank page, or a fabricated feature.
5. **Given** the device loses network connectivity while the shell is open, **When** the connection is interrupted, **Then** the shell indicates the interrupted condition and remains structurally intact, and previously rendered shell regions remain visible.

---

### User Story 9 - Reserved Entry Points for Future Product Modules (Priority: P3)

A planner (product owner or engineer) needs confidence that General AI Chat, conversations/history, projects, Private Teacher, files, search, settings, and the Admin Control Center each have a stable reserved home in the shell's navigation — even though none of them are implemented yet.

**Why this priority**: The core product requirement of R01 is a stable UX and architectural boundary. Reserved destinations are the physical expression of that boundary, but they carry no user-visible feature value until later phases ship, so they are P3.

**Independent Test**: Inspect the shell's navigation definition and confirm each future module maps to exactly one reserved destination with a defined availability state; activating a reserved destination shows the defined unavailable/placeholder state rather than a real feature.

**Acceptance Scenarios**:

1. **Given** the shell's navigation is defined, **When** each future module is considered (General AI Chat, conversations/history, projects, Private Teacher, files, search, settings, Admin Control Center), **Then** exactly one reserved navigation destination exists for it.
2. **Given** a reserved destination that has no implemented feature behind it, **When** the user activates it, **Then** the shell presents the defined unavailable/placeholder state and does not imply the feature exists.
3. **Given** a reserved destination, **When** the shell is inspected, **Then** the destination carries a stable identifier that later features can bind to without redesigning the shell.
4. **Given** a future module becomes available in a later release, **When** it is connected to its reserved destination, **Then** it appears in the shell without modifying the shell's fundamental layout or navigation contract.

---

### Edge Cases

- **Sidebar collapse at the boundary**: The user activates collapse while the sidebar is already collapsed, or expand while already expanded. The control MUST remain stable and idempotent; no error, flicker, or state corruption.
- **Collapse during content loading**: The user collapses or expands the sidebar while the main content area is still loading. Both behaviors MUST complete independently; neither blocks the other.
- **Direction switch while the drawer is open**: The user changes language/direction while the mobile navigation drawer is open. The drawer MUST re-anchor to the correct side and remain fully usable, and it MUST NOT trap focus in a now-invalid position.
- **Theme switch during a loading state**: The user changes theme while a loading or error state is displayed. The state MUST re-render in the new theme without losing its meaning or retry capability.
- **Resize across breakpoints**: The user drags the browser window slowly across the tablet/mobile boundary while interacting with the shell. The shell MUST settle into the correct navigation mode (rail vs drawer) without leaving a stuck overlay, a stray scrim, or duplicated navigation.
- **Drawer open on mobile, then rotate to tablet/desktop**: The user opens the mobile drawer and then rotates the device or resizes to desktop. The drawer MUST dismiss cleanly and the desktop sidebar MUST take over navigation without the drawer remaining open behind it.
- **Reloading an expanded state into the tablet class**: The user expands the sidebar on desktop, then reloads in the tablet viewport class. The shell MUST resolve to the collapsed/compact form rather than an oversized sidebar that squeezes the main content area.
- **Reloading in a collapsed state on a narrow screen**: The user collapses the sidebar on desktop, then reloads on a mobile-class viewport. The shell MUST resolve to the mobile drawer pattern rather than an unusable zero-width rail.
- **Offline at shell startup**: The user opens MAHAK with no network at all. The shell MUST present the interrupted/offline indication rather than a blank white page, and MUST NOT imply that any feature is available when it cannot be loaded.
- **Reserved destination while offline**: The user activates a reserved (not-yet-implemented) destination while offline. The shell MUST still present the defined unavailable state; the offline condition MUST NOT turn it into a raw error or crash.
- **Repeated rapid theme/direction toggling**: The user switches theme or direction rapidly several times in succession. The shell MUST converge on the final selected state without visual tearing, stuck intermediate states, or lost content.
- **Very wide and very narrow desktop widths**: The user opens the shell on an ultra-wide monitor and on a narrow netbook-class width. The shell MUST remain proportionate and readable in both, with the main content area neither stretched unreadably wide nor squeezed unreadably narrow.
- **Text at long locale lengths**: Shell labels (e.g., the product name or region names) are rendered in all three languages, and a localized label is considerably longer than the English one. The shell MUST accommodate the longer label without clipping, overlapping another region, or hiding the label's meaning.
- **Zoom and text scaling**: The user increases browser zoom or text scale to 200%. All shell regions and navigation controls MUST remain reachable and legible without overlapping or disappearing.

---

## Requirements *(mandatory)*

### Functional Requirements

**Shell structure and regions**

- **FR-001**: The MAHAK web application MUST render one top-level application shell composed of exactly three primary region types: a sidebar/navigation area, a header/top action area, and a main content area.
- **FR-002**: Each shell region MUST be a stable, independently addressable area of the application so that later features can bind content to it without modifying the shell's fundamental layout.
- **FR-003**: The main content area MUST be the destination for feature content, and MUST be the only region whose content changes when the user moves between navigation destinations.
- **FR-004**: The header area MUST provide a defined place for global actions and the product identity, and MUST NOT be used as a substitute for primary navigation.

**Primary navigation**

- **FR-005**: The shell MUST provide persistent primary navigation that remains reachable in every shell mode and at every supported viewport size.
- **FR-006**: The shell MUST provide a single control that collapses the sidebar to a compact form and expands it back to full form.
- **FR-007**: The collapse/expand control MUST be reachable from both the expanded and collapsed sidebar states.
- **FR-008**: The selected sidebar state (collapsed or expanded) MUST persist across page reloads within the same browser.
- **FR-009**: When the sidebar is collapsed to its compact form, every primary navigation destination MUST remain reachable.
- **FR-010**: The navigation MUST indicate which destination is currently active.
- **FR-011**: Navigation destinations MUST each carry a stable identifier that is independent of the label text and of the active language, so later features can bind to them without redesigning the shell.

**Foundation for later modules**

- **FR-012**: The shell MUST reserve exactly one navigation destination for each future product module: General AI Chat, conversations/history, projects, Private Teacher, files, search, settings, and Admin Control Center.
- **FR-013**: A reserved destination whose feature is not yet implemented MUST present the defined unavailable/placeholder state when activated, and MUST NOT imply the feature exists.
- **FR-014**: The set of reserved destinations MUST be expressible without code-level changes to the shell's layout when a future module becomes available.
- **FR-015**: All eight reserved module destinations — including the Admin Control Center — MUST be part of the authenticated navigation set only, and MUST NOT appear in the public (unauthenticated) shell.

**Responsive behavior**

- **FR-016**: The shell MUST define and support three viewport classes — desktop, tablet, and mobile — with behavior specified for each. The active class MUST be determined by viewport width only, against fixed class boundaries, and MUST be the single source of truth for the shell's responsive navigation behavior; a wide touch device resolves to the desktop class and a narrow desktop window resolves to the mobile class.
- **FR-017**: At desktop-class widths, the sidebar MUST be capable of remaining open beside the main content area.
- **FR-018**: At tablet-class widths, the shell MUST offer the collapsed/compact sidebar form so the main content area retains comfortable usable width.
- **FR-019**: At mobile-class widths, the sidebar MUST NOT consume permanent screen space; it MUST be openable as an overlay drawer via a persistent control.
- **FR-020**: The mobile drawer MUST be dismissible by its close affordance, by selecting a destination, and by activating the area outside it (scrim/backdrop).
- **FR-021**: No shell viewport class MAY require horizontal scrolling to read content or reach primary controls.
- **FR-022**: When the viewport crosses a breakpoint, the shell MUST settle into the navigation mode of the new class without leaving a residual overlay, scrim, or duplicated navigation.

**Direction (RTL/LTR) foundation**

- **FR-023**: The shell MUST support right-to-left layout for Persian and Arabic, and left-to-right layout for English.
- **FR-024**: The active direction MUST be set on the application root and MUST be the single source of truth for the shell's layout direction.
- **FR-025**: Switching direction MUST mirror every shell region — including the sidebar side, the header layout, and the main content area — without hiding, clipping, or overlapping any region.
- **FR-026**: Collapsing/expanding the sidebar and opening/closing the mobile drawer MUST behave identically in RTL and LTR, anchored to the correct side for the active direction.
- **FR-027**: Changing direction MUST NOT require reloading the shell or re-navigating to the current destination.
- **FR-028**: All user-visible shell text MUST be held outside the shell structure as externalizable string resources, so that labels can be translated without modifying the shell.

**Theme foundation**

- **FR-029**: The shell MUST support exactly three theme modes: Light, Dark, and System (follows the device appearance preference).
- **FR-030**: A theme change MUST apply consistently to every shell region — sidebar, header, main content area, and mobile drawer — with no unthemed region.
- **FR-031**: In System mode, the shell MUST follow changes of the device appearance preference without requiring a manual theme change.
- **FR-032**: The selected theme MUST persist across page reloads within the same browser.
- **FR-033**: The shell MUST remain fully functional and legible in every theme; no theme MAY disable a navigation or shell control.

**Accessibility**

- **FR-034**: The sidebar, header, and main content area MUST be exposed as distinct semantic navigation/banner/main regions (W3C WAI-ARIA landmarks or an equivalent standard semantic mechanism).
- **FR-035**: The shell MUST provide a skip-to-main-content affordance that moves focus directly into the main content area.
- **FR-036**: Every interactive shell control — collapse/expand, drawer open/close, navigation destinations — MUST be operable by keyboard alone and MUST expose a meaningful accessible name.
- **FR-037**: Every interactive shell control MUST present a visible focus indicator when focused.
- **FR-038**: Keyboard focus order MUST follow a logical sequence across header, sidebar, and main content area, and MUST NOT trap the user in any region except the intentionally modal mobile drawer.
- **FR-039**: When the mobile drawer opens, keyboard focus MUST move into it; when it closes, focus MUST return to the control that opened it.
- **FR-040**: Changes to shell state — sidebar collapsed/expanded, drawer opened/closed, theme changed — MUST be communicated to assistive technology.
- **FR-041**: Text and essential graphics in every shell region MUST meet the project's defined contrast requirement (at least the WCAG 2.1 AA ratio of 4.5:1 for normal text) in Light and in Dark themes.

**Authentication boundary (definition only — no implementation)**

- **FR-042**: The shell MUST expose a single, defined concept of shell mode with exactly two values: public (unauthenticated) and authenticated.
- **FR-043**: The shell MUST present the public navigation set and public global actions only when in public mode, and MUST present the authenticated navigation set and account area when in authenticated mode.
- **FR-044**: An attempt to reach an authenticated destination from public mode MUST route the visitor to the defined sign-in entry point rather than exposing protected content.
- **FR-045**: Switching shell mode MUST NOT require reloading or redesigning the core shell frame.
- **FR-046**: R01 MUST NOT implement authentication, credential handling, sessions, roles, or permissions; the boundary MUST be defined as a contract that R02 implements.
- **FR-058**: In public (unauthenticated) mode, the navigation MUST present only the defined sign-in and sign-up entry points and public global actions; no reserved module destination (General AI Chat, conversations/history, projects, Private Teacher, files, search, settings, Admin Control Center) MAY be visible in the public navigation set.

**Application states**

- **FR-047**: Each shell region MUST support a loading state used while its content is being prepared, without blocking the rest of the shell.
- **FR-059**: During initial shell load, the shell MUST present a whole-frame loading state in which the sidebar, header, and main content area are all present but inert, and MUST transition to the interactive shell — including any per-region loading states — once the shell is interactive, without a reload or a re-layout of the core frame.
- **FR-060**: On the first visit with no saved shell preferences, the shell MUST default to the System theme mode and to the layout direction of the active language (right-to-left for Persian and Arabic, left-to-right otherwise), and MUST NOT require the visitor to choose a theme or language before the shell renders.
- **FR-061**: The active language MUST be the single source of truth for the initial layout direction when no saved direction preference exists, so that the direction default and the active language cannot diverge at first paint.
- **FR-062**: On the first visit with no saved sidebar preference, the shell MUST default the sidebar to the expanded state in the desktop viewport class and to the collapsed/compact state in the tablet viewport class; the mobile viewport class MUST use its overlay drawer and MUST NOT show a permanent sidebar at first visit.
- **FR-063**: When a saved sidebar state conflicts with the current viewport class, the active viewport class MUST take precedence: a state saved as expanded on desktop MUST resolve to the collapsed/compact form if the shell loads in the tablet class, and MUST resolve to the overlay drawer pattern if it loads in the mobile class.
- **FR-048**: Each shell region MUST support an empty state that explains in plain language that there is nothing to show yet.
- **FR-049**: Each shell region MUST support an error state that states the failure in plain language and offers a retry action where retrying is meaningful.
- **FR-050**: A reserved destination whose feature is unavailable MUST present the defined unavailable state; this state MUST be distinct from loading, empty, and error.
- **FR-051**: The shell MUST detect and indicate an interrupted or unavailable network condition while the shell is open, and MUST remain structurally intact and show previously rendered regions during the interruption.
- **FR-052**: Loading, empty, error, and unavailable states MUST honor the active theme and direction like any other shell content.

**Platform integration boundaries**

- **FR-053**: The shell MUST integrate future product modules through stable, technology-agnostic contracts for navigation, shell regions, global actions, and presentation state, rather than embedding feature-specific business logic in the shell.
- **FR-054**: The shell MUST keep presentation responsibilities separate from feature/domain behavior so that later modules can change their internal workflows, data, and business rules without requiring a redesign of the shell's fundamental regions.
- **FR-055**: The shell MUST define a clear boundary between browser presentation, application behavior, and protected backend capabilities; R01 MAY define the existence and purpose of these boundaries but MUST NOT prescribe a specific transport, framework, programming language, database, or vendor implementation.
- **FR-056**: Reserved module destinations MUST bind to a stable module identity and availability contract so a later feature can become available without changing the shell's navigation structure or primary region layout.
- **FR-057**: Shell-level navigation and presentation state MUST be consumable by future modules through stable contracts, while feature-specific domain state MUST remain owned by the corresponding roadmap feature.

**Non-functional requirements**

- **NFR-001**: The shell MUST render its core frame (sidebar, header, main content area) and become interactive on a standard broadband connection in a desktop browser in 2 seconds or less, measured from initial navigation to interactive shell.
- **NFR-002**: The shell MUST remain usable on a stable 3G-class mobile connection, presenting its loading state rather than failing silently, and completing shell load within 5 seconds.
- **NFR-003**: Sidebar collapse/expand and drawer open/close MUST visibly complete within 300 milliseconds of activation so the interaction feels immediate.
- **NFR-004**: The shell MUST support the current and previous major version of the project's defined desktop and mobile browser targets, without requiring a legacy-specific layout.
- **NFR-005**: All shell behavior MUST be verifiable through automated tests, including layout, responsive classes, direction, theme, accessibility semantics, and each application state, with external providers mocked so tests are deterministic.
- **NFR-006**: The shell MUST NOT contain, log, or expose any credential, secret, or provider key; no shell-level behavior MAY depend on server-side secrets being present in the browser.
- **NFR-007**: The shell MUST remain usable at 200% browser zoom/text scaling without loss of content, overlapping regions, or unreachable controls.
- **NFR-008**: Shell behavior MUST degrade gracefully: an unexpected failure in one region MUST NOT take down the whole shell frame.

### Key Entities

- **ShellRegion**: One of the primary areas of the application — navigation/sidebar, header, or main content. Has a stable identity, a position determined by the active direction, and a state (ready, loading, empty, error, unavailable).
- **NavigationDestination**: A single addressable place in the shell's navigation. Has a stable identifier independent of label text and language, a reserved module binding, an availability state (reserved/available), and a visibility scope (public, authenticated). Exactly one destination exists per future product module. All eight module destinations carry the authenticated scope, so they are presented only in the authenticated shell; the public navigation set consists only of the defined sign-in and sign-up entry points.
- **ShellMode**: The application's authentication mode — public (unauthenticated) or authenticated. Determines which navigation set and global actions the shell presents. In R01 the mode is defined as a contract and is not produced by any sign-in implementation.
- **ShellConfiguration**: The user's shell-level presentation choices — sidebar state (expanded/collapsed), theme mode (Light/Dark/System), and active direction (RTL/LTR). When no saved configuration exists, theme mode defaults to System and direction defaults to the direction of the active language. Persists across reloads within the same browser.
- **ShellViewportClass**: The responsive class the shell is operating in — desktop, tablet, or mobile — which determines the navigation presentation (open sidebar, compact rail, or overlay drawer). Exactly one class is active at any time, resolved from the current viewport width against the fixed class boundaries and independent of device or pointer type. The active class takes precedence over any saved sidebar state that is incompatible with it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of later roadmap modules (General AI Chat, conversations/history, projects, Private Teacher, files, search, settings, Admin Control Center) map to exactly one reserved navigation destination, verifiable by inspecting the shell navigation definition against `ROADMAP.md`.
- **SC-002**: A first-time visitor can identify the navigation, header, and main content areas within 5 seconds of the shell becoming interactive.
- **SC-003**: Users can collapse or expand the sidebar with a single action in under 1 second, and the selected state persists across a full browser reload in 100% of test runs.
- **SC-004**: 100% of primary navigation destinations remain reachable at every supported viewport class — desktop (open sidebar), tablet (compact rail), and mobile (drawer) — with zero horizontal scrolling required.
- **SC-005**: Switching between Persian, Arabic, and English produces correct RTL or LTR layout in 100% of shell regions, with zero clipped, overlapped, or hidden regions.
- **SC-006**: Light, Dark, and System themes apply to 100% of shell regions, and the selected theme survives a browser reload in 100% of test runs.
- **SC-007**: 100% of interactive shell controls are reachable and operable using keyboard alone, with a visible focus indicator at every stop and correct semantic regions announced by at least one screen reader.
- **SC-008**: All shell text meets at least a 4.5:1 contrast ratio against its background in both Light and Dark themes.
- **SC-009**: 100% of defined shell states (loading, empty, error, unavailable, offline/interrupted) are demonstrable on demand, and none of them presents a blank page or an unhandled crash.
- **SC-010**: The shell core frame becomes interactive on a standard broadband desktop connection in 2 seconds or less, and on a 3G-class mobile connection in 5 seconds or less.
- **SC-011**: 100% of R01 functional requirements are covered by automated tests that pass deterministically, with no external live service required to run them.
- **SC-012**: Zero functional requirements of R01 depend on any technology choice that is not yet decided, verifiable by reviewing the specification for implementation-specific detail (none permitted).

## Assumptions

- **A-01**: Users have a modern browser and a stable network connection under normal operation; degraded-connection behavior is defined but 3G-class performance is treated as a floor, not the primary target.
- **A-02**: "Desktop", "tablet", and "mobile" are treated as viewport classes rather than specific devices, so the behavior is defined by available screen space; exactly one class is active at any time, resolved from viewport width alone. The exact numeric boundaries will be fixed in the implementation plan.
- **A-03**: The public (unauthenticated) shell mode exists in R01 as a defined contract and a demonstrable state; because R01 does not implement sign-in, acceptance scenarios exercise it through that contract rather than a real login flow.
- **A-04**: The exact Persian, Arabic, and English label wording for shell text is not fixed by R01; R01 requires the strings to be externalized and the direction behavior to work, while full localization management is R03.
- **A-05**: Theme and sidebar-state persistence is scoped to the same browser; cross-device synchronization of preferences is out of scope for R01. On the first visit with no saved preferences, the shell defaults to the System theme mode, to the layout direction of the active language, to an expanded sidebar in the desktop class, and to a collapsed/compact sidebar in the tablet class; the mobile class always uses its overlay drawer.
- **A-06**: The contrast requirement follows the WCAG 2.1 AA threshold (4.5:1 for normal text) as the project default; a stricter project target may replace it later without changing this specification's intent.
- **A-07**: "System" theme follows the device-level appearance preference exposed to the browser; operating systems that expose no such preference fall back to the Light appearance.
- **A-08**: Reserved navigation destinations are visible in the authenticated shell by default with the defined unavailable/placeholder state. In the public (unauthenticated) shell, no module destination is shown and the navigation presents only the defined sign-in/sign-up entry points and public global actions. Whether to additionally hide reserved destinations in the authenticated shell is a presentation choice the implementation plan may make without contradicting this specification.
- **A-09**: Performance targets are measured on a conventional host with no heavy background load; they are user-perceived timing targets, not micro-benchmark thresholds.
- **A-10**: The shell is web-first, consistent with the constitution's Web-first and API-first requirement; native mobile shells are future work and are represented here only as responsive behavior.

## Scope Boundaries

**In scope (R01)**

- The overall MAHAK web application shell: sidebar/navigation area, header/top action area, and main content area.
- Persistent primary navigation and the stable destination contract that later features bind to.
- Collapsible/expandable sidebar behavior and its persistence.
- Desktop, tablet, and mobile responsive shell behavior, including the mobile overlay navigation drawer.
- RTL/LTR direction foundation for Persian, Arabic, and English at the shell level.
- Light, Dark, and System theme foundation at the shell level.
- Shell-level accessibility: semantic regions, keyboard navigation, focus visibility, accessible names, contrast.
- Loading, empty, error, unavailable, and offline/interrupted shell states.
- The conceptual public (unauthenticated) vs authenticated shell boundary, as a defined contract only.
- Reserved navigation entry points for all later product modules.

**Out of scope (owned by later roadmap entries)**

- Authentication, sessions, credentials, roles, permissions, and RBAC — **R02**.
- User preferences management and localization management in detail — **R03**.
- Educational and product catalog content — **R04**.
- General AI Chat, conversation streaming, and message exchange — **R05**.
- Conversation history, search implementation, and conversation organization — **R06**.
- Projects and project semantics — **R07**.
- File upload, attachments, and storage — **R08**.
- AI Model Gateway, provider management, and model routing — **R09**.
- Private Teacher functionality and behavior — **R19** and related entries.
- Knowledge/RAG, ingestion, embedding, retrieval, and citation — **R12** through **R18**.
- Voice interaction — **R25**.
- Memory — **R24**.
- Admin Control Center functionality and Admin AI Copilot — **R27** and **R28**.
- Billing, credits, and usage — **R31**.
- Production deployment infrastructure — **R36**.

**Explicit non-requirements**

- R01 MUST NOT implement any authentication or authorization mechanism.
- R01 MUST NOT implement any of the reserved product modules; their destinations exist only as reserved, clearly-unavailable entry points.
- R01 MUST NOT introduce live AI provider calls, model selection, or knowledge behavior.
- R01 MUST NOT depend on any specific programming language, framework, or vendor in its requirements.
