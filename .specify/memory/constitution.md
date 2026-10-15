<!--
SYNC IMPACT REPORT (temporary - remove before committing)

Version change: (none) -> 1.0.0
This is the initial ratification of the MAHAK constitution. No prior
constitution existed at .specify/memory/constitution.md.

Scaffold: resolved from constitution-template via resolve-template.ps1.
The template defines 5 principle slots, 2 additional sections, and a
Governance section. All placeholders were filled with project-specific
content; the template's 5 principle slots were expanded to 5 MAHAK
principles (I-V), matching the user-provided constitution text.

Modified principles: N/A (initial adoption)
  - I. Product Integrity & Architectural Discipline
  - II. AI, Knowledge & Evidence Integrity
  - III. Modularity, Provider Agnosticism & Capability-Based AI
  - IV. Security, Privacy & Operational Safety
  - V. Test-Backed Development, Observability & Quality Gates

Added sections:
  - Core Principles (I-V)
  - Security & Cross-Platform Constraints  (template SECTION_2)
  - Development Workflow & Quality Gates   (template SECTION_3)
  - Governance

Removed sections: N/A

Deferred items / TODOs: none. All placeholders resolved; RATIFICATION_DATE
and LAST_AMENDED_DATE both set to 2026-09-24 per the user-provided document.
No placeholder tokens remain.
-->

# MAHAK Constitution

## Core Principles

### I. Product Integrity & Architectural Discipline

MAHAK MUST be designed and implemented as a coherent AI platform rather than
as a collection of disconnected features.

* The platform MUST preserve a clear separation between User Experience,
  Application/API, AI Runtime, Knowledge System, Data Layer, and Admin
  Operations.
* Core domains MUST remain independently evolvable. At minimum, the
  architecture MUST distinguish General AI Chat, Private Teacher, Projects,
  Knowledge, Memory, AI Model Gateway, Admin, and Platform services.
* Private Teacher MUST be an independent domain entity and MUST NOT be
  represented merely as an LLM, provider, or prompt.
* Model, provider, prompt, teacher, project, conversation, memory, knowledge,
  source, and vector index MUST remain distinct concepts.
* Educational structures MUST be data-driven and configurable. Grade, field,
  subject, course, chapter, topic, and teaching-type relationships MUST NOT be
  hard-coded into the frontend or scattered throughout backend business logic.
* The initial product MUST be Web-first and API-first while preserving a clean
  boundary that allows future Mobile and other clients to reuse the same
  backend capabilities.
* Cross-layer shortcuts, duplicated business logic, hidden coupling, and
  monolithic modules MUST be avoided.
* Existing working behavior MUST NOT be broken for the sake of introducing a
  new feature. Changes MUST be incremental, compatible, and reversible where
  practical.

Rationale: MAHAK is intended to grow from a web product into a broader AI
platform. Architectural separation is required to prevent the UI, Teacher,
LLM, Knowledge, and Admin systems from becoming inseparably coupled.

### II. AI, Knowledge & Evidence Integrity

MAHAK MUST prioritize trustworthy, traceable, context-aware AI behavior.

* Private Teacher responses that depend on managed educational knowledge MUST
  use the applicable knowledge scope and MUST preserve source provenance.
* Evidence MUST be preserved whenever the underlying source supports it,
  including document, chapter, page, paragraph, timestamp, frame, transcript,
  URL, or other meaningful source location.
* MAHAK MUST NOT fabricate citations, pages, timestamps, frames, URLs, or
  source claims.
* Retrieval scope MUST be enforced. A Teacher, Project, User, or Conversation
  MUST NOT receive knowledge outside its authorized scope merely because that
  knowledge is semantically similar.
* Multimodal sources MUST retain their meaningful relationships. For example,
  a video transcript segment MUST remain connectable to its timestamp and, when
  available, its corresponding frame.
* When an answer is produced without reliable supporting knowledge, the system
  MUST distinguish model-generated knowledge from source-grounded knowledge.
* If a request inside Private Teacher is determined to be outside the Teacher's
  educational context, MAHAK MUST notify the user and route the request to the
  appropriate General AI experience according to the defined routing policy.
* User-uploaded knowledge MUST remain isolated from shared educational
  knowledge until required validation, review, and approval workflows have
  completed.
* Knowledge processing failures MUST be visible and diagnosable; silently
  publishing incomplete or failed knowledge MUST NOT be allowed.
* AI-generated educational content MUST preserve the applicable context,
  audience, difficulty, and Teacher policy.

Rationale: MAHAK's value depends not only on generating fluent answers, but on
being able to explain where an answer came from and why that source applies.

### III. Modularity, Provider Agnosticism & Capability-Based AI

MAHAK MUST remain independent from any single AI provider, model, vendor, or
implementation strategy.

* LLM providers MUST be accessed through a stable abstraction layer.
* Models MUST be selected by capability and policy rather than being directly
  embedded throughout application code.
* The system MUST support independent capabilities including, where available:
  fast chat, reasoning, vision, embedding, reranking, speech-to-text,
  text-to-speech, image generation, and future capabilities.
* The architecture MUST support both external providers and local models.
* Local embedding MUST be a first-class capability and MUST support models
  such as BAAI/bge-m3 without requiring application redesign.
* Provider configuration MUST support primary and fallback models where
  appropriate.
* Provider credentials and API keys MUST remain server-side and MUST never be
  exposed to browser clients.
* Switching a model or provider MUST NOT require rewriting Teacher definitions,
  Project definitions, Knowledge metadata, or conversation data.
* New providers, model capabilities, source types, Teacher types, tools, and
  output types SHOULD be added through extension points rather than invasive
  rewrites.
* Long-running AI and Knowledge operations MUST be designed for asynchronous
  execution when blocking an HTTP request would harm reliability,
  responsiveness, or scalability.

Rationale: MAHAK must be able to evolve as models, providers, costs, local
models, and AI capabilities change.

### IV. Security, Privacy & Operational Safety

Security MUST be treated as a foundational product requirement rather than a
later enhancement.

* Authentication MUST support the product's approved mechanisms, including
  email/password, phone/OTP, and Google authentication where enabled.
* Email/password authentication MUST include CAPTCHA or equivalent anti-bot
  protection.
* Authentication and AI endpoints MUST implement appropriate abuse
  protections, including rate limiting and other anti-spam controls where
  required.
* Authorization MUST be explicit and role-aware. Administrative operations
  MUST NOT be available to ordinary users.
* Sensitive credentials, provider API keys, secrets, tokens, and internal
  administrative data MUST NOT be exposed to the frontend.
* Uploaded files MUST be validated by type and size, and security scanning
  MUST be applied where appropriate.
* User, Project, Teacher, organization-ready, and Knowledge boundaries MUST be
  represented explicitly so that future multi-tenant deployment can be added
  without redesigning the entire platform.
* Sensitive administrative and AI operational actions MUST be auditable.
* Admin AI MUST NOT silently perform destructive or high-impact actions.
  Operations such as delete, replace, publish, unpublish, bulk changes, and
  other policy-defined sensitive actions MUST pass through the approval
  workflow before execution.
* Failed administrative or AI operations MUST report the failure reason,
  failed stage, relevant logs, and available recovery information.
* Data deletion, migrations, replacements, and other destructive changes MUST
  have a defined recovery or rollback strategy where technically practical.

Rationale: MAHAK processes user files, conversations, credentials, educational
content, AI provider credentials, and administrative operations. Security and
operational accountability therefore affect the core architecture.

### V. Test-Backed Development, Observability & Quality Gates

Every meaningful behavioral change MUST be testable, verifiable, and observable.

* Every feature MUST have an explicit specification before implementation.
* Non-trivial features MUST progress through the Spec Kit workflow:
  specification, clarification when necessary, planning, task breakdown,
  implementation, and convergence/verification.
* Every completed feature MUST include appropriate unit tests and integration
  tests, plus smoke validation where applicable.
* Changes MUST preserve existing tests and MUST add or update regression
  coverage for changed behavior.
* Before modifying established functionality, the current relevant test suite
  SHOULD be run to establish a baseline.
* After modifications, the project MUST run its required automated tests and
  validation commands.
* The backend MUST pass Python compilation validation, including the project's
  configured `compileall` checks.
* Relevant smoke tests MUST be executed after implementation.
* Features involving APIs, streaming, authentication, file processing,
  retrieval, multimodal processing, model routing, or administrative actions
  MUST have tests appropriate to their failure modes.
* External providers SHOULD be mocked or controlled in automated tests unless
  a test is explicitly designated as an opt-in live integration test.
* Logs MUST contain enough structured information to diagnose failures without
  exposing secrets or sensitive user data.
* Usage, model selection, token consumption, credit consumption, latency,
  retrieval behavior, failures, and relevant operational events MUST be
  observable according to the applicable feature.
* Documentation MUST be updated when user-visible behavior, configuration,
  architecture, or operational procedures change.

Rationale: MAHAK combines multiple AI systems, asynchronous jobs, retrieval,
multimodal processing, and user-facing state. Without strong verification and
observability, regressions can remain invisible until production.

## Security & Cross-Platform Constraints

* The product MUST support modern desktop and mobile browser environments
  appropriate to the deployment target.
* Backend development MUST remain compatible with the supported server
  operating environments and local development environments defined by the
  active technical plan.
* Frontend behavior MUST remain usable at common desktop, tablet, and mobile
  breakpoints.
* The application MUST support Persian, Arabic, and English from the
  beginning.
* Language selection MUST affect both UI language and layout direction:
  Persian and Arabic MUST support RTL, while English MUST support LTR.
* Theme selection MUST support Light, Dark, and System/Automatic modes.
* Localization MUST cover interface content, validation messages, settings,
  navigation, relevant date/number presentation, and applicable AI interaction
  behavior.
* Accessibility MUST be considered in all interactive UI components,
  including keyboard navigation, focus handling, labels, contrast, dialogs,
  error states, and screen-size adaptability.
* Security-sensitive code MUST be reviewed for authentication bypass,
  authorization errors, secret exposure, file traversal, unsafe file handling,
  injection risks, and abuse scenarios.
* Browser clients MUST never receive privileged credentials intended for
  server-side AI providers, databases, or administrative infrastructure.

## Development Workflow & Quality Gates

* Every new feature MUST begin from a feature specification that describes
  user goals, behavior, boundaries, and measurable success criteria.
* Technical implementation choices belong primarily in the plan and MUST not
  be used to bypass product requirements.
* The `plan` MUST include a Constitution Check confirming compliance with the
  applicable principles before implementation begins.
* Tasks MUST be traceable to requirements in the specification and MUST avoid
  unnecessary work outside the approved scope.
* Implementation MUST be incremental and MUST avoid unrelated rewrites.
* Each completed feature MUST include:

  * implementation
  * automated tests
  * integration coverage where applicable
  * smoke validation where applicable
  * documentation updates
* CI and local validation MUST enforce the project's required tests and quality
  checks.
* Failures MUST be fixed at their source rather than hidden with weakened
  assertions, disabled tests, or silent fallback behavior.
* Experimental, live-provider, or destructive operations MUST be explicitly
  identified and isolated from deterministic automated test paths.
* Changes to prompts, models, retrieval behavior, Teacher behavior, or
  administrative policies MUST be treated as behavioral changes and receive
  regression coverage appropriate to their impact.
* Any deliberate deviation from a MUST-level principle MUST be documented in
  the plan with rationale and explicit approval through the project's
  governance process.

## Governance

This constitution is the governing contract for MAHAK engineering. It
supersedes informal conventions where they conflict with an explicit MUST
principle.

* Principles I–V are binding engineering and product gates.
* The `Constitution Check` section of every applicable plan MUST evaluate the
  planned implementation against this constitution.
* `/speckit.analyze` and `/speckit.converge` MUST treat an unresolved conflict
  with a MUST-level constitutional requirement as a critical issue requiring
  remediation.
* Violations MUST be resolved by changing the specification, plan, or tasks,
  or by formally amending this constitution. They MUST NOT be hidden by
  weakening the rule during implementation.
* Constitution amendments MUST include a written rationale and MUST update
  the version according to semantic versioning.
* MAJOR changes include removing or redefining a core principle in a
  backward-incompatible manner.
* MINOR changes include adding a new principle or materially expanding the
  governance scope.
* PATCH changes include clarifications, wording fixes, and non-semantic
  refinements.
* Changes to this constitution MUST be reviewed before adoption.
* Every major architectural decision that affects multiple principles SHOULD
  be documented as an Architecture Decision Record (ADR).
* The Constitution MUST remain concise enough to act as an enforceable
  engineering contract; detailed implementation procedures belong in
  specifications, plans, architecture documents, and task files.

**Version**: 1.0.0 | **Ratified**: 2026-09-24 | **Last Amended**: 2026-09-24
