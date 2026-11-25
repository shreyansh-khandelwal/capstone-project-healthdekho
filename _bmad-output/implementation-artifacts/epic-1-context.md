# Epic 1 Context: Secure Access & Personalized Policy Overview

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable Customers to establish a protected session and review a complete portfolio of only their registered Policies, with reliable privacy and no disclosure of another Customer's data. The available planning inputs provide implementation constraints but do not include the full PRD, architecture, UX/design, or product brief, so this context should be regenerated if those artifacts become available.

## Stories

- Story 1.1: Sign in to a protected customer session
- Story 1.2: View my personalized policy overview

## Requirements & Constraints

- Protect sign-in, Dashboard, and Policy access with Spring Security. Resolve Customer identity from the authenticated security context; never accept a Customer identifier from the client as proof of ownership.
- Return only Policies owned by the authenticated Customer. Unauthorized Policy access must produce an appropriate `401` or `403` without exposing Policy data or useful evidence that an object exists.
- Use immutable record DTOs at REST boundaries, with safe profile and Policy payloads; JPA entities must not be accepted from or returned directly to clients.
- Present a paginated, ordered portfolio containing policy identity, product, policy type, term, dates, premium frequency and amount, sum insured, and status.
- Use standard authentication and error behavior: missing or invalid credentials return `401`, authenticated access violations return `403`, missing owned resources return `404`, and unexpected failures must not disclose internal details.
- Keep pending, failure, successful, and no-Policy outcomes explicit and recoverable. A Dashboard request must meet the agreed p95 response target of less than 300 ms on the designated test dataset.
- Preserve responsive, keyboard-accessible behavior: semantic table headers, visible focus, horizontally scrollable content with the Policy Identifier retained, and status meaning that does not rely on color alone.
- Format monetary values consistently to two decimal places with accessible reading order; persist financial values with exact two-decimal semantics.
- Externalize credentials, signing/session secrets, database settings, allowed origins, and profile-specific logging. Development defaults must never contain usable production credentials.

## Technical Decisions

- Backend: Java 21, Spring Boot 3.5.7, Spring Web, Spring Security, Spring Data JPA, Jakarta Bean Validation, and PostgreSQL.
- Keep Controller, Service, Repository, Entity, and DTO responsibilities separate. Controllers validate and delegate; services own authentication-adjacent orchestration and ownership-safe operations; repositories enforce Customer-scoped queries.
- Support ownership-safe Policy lookup by both authenticated Customer identity and Policy identity. Index Customer and Policy Status access to support the Dashboard query.
- Model required Policy facts with date-only database fields and `NUMERIC(19,2)` monetary columns. Use a consistent key strategy and immutable Java `record` request/response types.
- Frontend: React functional components and hooks with Axios for authenticated REST calls. Keep client-side pagination, loading, failure, empty, and notification states distinct; never consume JPA entities.
- Authentication mechanics may be session- or JWT-based, but the selected mechanism must rotate or clear state correctly, protect routes, and keep secrets out of source control.

## UX & Interaction Patterns

- The Dashboard follows successful authentication and functions as the Customer's private portfolio overview.
- Loading uses a skeleton, failures provide clear recoverable feedback, and no owned Policies produces an intentional illustrated or textual state that directs the Customer toward Product discovery rather than an empty table.
- Tables remain usable on desktop and mobile, with sticky Policy Identifier, bounded pagination, clear focus treatment, and text or icons accompanying color-coded status.
- Premium Amount and Sum Insured share the same currency display contract, including two decimals and tabular numerals.

## Cross-Story Dependencies

- Story 1.2 depends on Story 1.1's protected-session and Customer-resolution flow. Dashboard requests and protected routing must use the authenticated Customer established by sign-in.
