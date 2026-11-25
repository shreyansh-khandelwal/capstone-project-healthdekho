---
status: final
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
inputDocuments:
  - docs/prd.md
  - docs/architecture.md
  - docs/ux-design.md
---

# capstone-project - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for HealthDekho, decomposing the PRD, UX design, and architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: A Customer can submit email and password to establish an authenticated Spring Security session; valid credentials redirect to the Dashboard, invalid credentials create no session and do not disclose which credential was wrong.

FR2: An authenticated Customer can view a Dashboard containing every Policy they own with its identity, product, term, schedule, premium, sum insured, and status facts; no-Policy users receive an explanatory empty state, and cross-Customer data is never exposed.

FR3: An authenticated Customer can browse only active Products that remain eligible under deterministic rules and are not already held through an active Policy; selecting Register carries the Product into Registration.

FR4: A Customer can request Recommendations with zero or more supported profile and preference inputs, receive deterministic calculated age, and observe explicit loading, success, empty, and error states with client- and server-side date validation.

FR5: The service can construct the AI candidate set exclusively from active PostgreSQL Products that are eligible for the Customer and not already owned; when AI is unavailable, the eligible Product catalog remains usable.

FR6: The service can expose an AI Recommendation only when every returned Product maps to the same request's eligible database candidate set, contains no duplicates, and is still active and eligible; hallucinated metadata must never be returned.

FR7: Every AI invocation persists one auditable Recommendation Request with Customer, preferences, calculated age, model metadata, prompt version, and timestamp, plus each displayed ranked item with request, Product, reason, and Suitability.

FR8: A Customer can compare Recommendation results showing complete Product facts, reason, Suitability, and Register action, continue into pre-populated Registration, and see the results described as explainable assistance rather than a suitability guarantee.

FR9: Registration opens with authenticated Customer and selected Product facts as read-only values, with Start Date defaulted to today and derived Maturity Date and Total Premium Payable shown before confirmation.

FR10: Registration rejects invalid requests with deterministic field-level errors, including future DOB, age outside Product bounds, invalid maturity date, non-positive financial or term values, and duplicate active registration as `409 Conflict`.

FR11: The service calculates Maturity Date, total premium, Installment count, regular Installments, and any final prorated Installment deterministically in two-decimal currency precision, with the schedule reconciling exactly to Total Premium Payable.

FR12: Registration atomically creates one unique Policy Identifier, one Policy, and a complete sequential Installment schedule with frequency-aligned Due Dates and one-month grace periods; any failure rolls back every row, and success returns the identifier and confirmation.

FR13: A Customer can retrieve only an owned Policy's financial summary and payment schedule by Policy Identifier, including all required financial totals, Installment facts, status, and selection eligibility.

FR14: A Customer can submit full or partial simulated Payment for one or more eligible Installments in one atomic operation using a supported Payment Method; accepted amounts cannot exceed the outstanding plus penalty obligation, `PAID` Installments cannot be paid, and any failure rolls back all rows.

FR15: A late Payment applies a deterministic 10% penalty only after the Grace Period End Date, recalculated against the current outstanding amount for each partial Payment, persisted separately, and limited by fixed two-decimal rounding.

FR16: The service transitions Installments through `PENDING`, `PARTIALLY_PAID`, `OVERDUE`, and `PAID`, applies due-date and grace-period semantics, and marks the Policy fully paid/completed only when all Installments are settled.

FR17: Each accepted Installment Payment creates one unique immutable ledger record with Transaction Reference, Payment Date, amount, penalty, method, and timestamp; application APIs provide no update or delete path.

FR18: Policy Search accepts only Policy Identifier, Customer Name, or Policy Identifier plus Date of Birth, rejects unsupported combinations with guidance, and always limits results to the authenticated Customer's ownership.

FR19: Policy Search returns ordered, paginated owned-Policy results with identity, product, dates, status, and financial summary; broad searches remain bounded and zero matches produce an informative empty state.

### NonFunctional Requirements

NFR1: Every protected endpoint resolves the authenticated Customer as the ownership authority and never trusts a client-supplied Customer identifier.

NFR2: Cross-Customer access returns `401` or `403` as applicable without useful object-existence disclosure.

NFR3: REST requests and responses use immutable record DTOs, and JPA entities never cross the API boundary.

NFR4: Every state-changing API validates mandatory and range-constrained fields server-side.

NFR5: Credentials, database connection details, AI settings, and session or JWT secrets are supplied through environment-specific configuration and are never committed.

NFR6: All monetary values use `BigDecimal` and `NUMERIC(19,2)` with `RoundingMode.HALF_UP` where rounding is required.

NFR7: Financial outputs are reproducible from stored Product, Policy, Installment, and Payment inputs and reconcile exactly to the cent.

NFR8: Financial mutations are transactional and idempotent at the accepted Transaction Reference boundary.

NFR9: Standard CRUD and paginated Search endpoints respond in less than 300 ms at p95 on the agreed capstone dataset.

NFR10: AI Recommendation requests finish within 5 seconds in the demo environment or transition to a recoverable timeout state.

NFR11: Async UI shows loading and prevents duplicate mutation submission while an operation is in flight.

NFR12: Registration cannot leave a Policy without its complete Installment schedule.

NFR13: A multi-Installment Payment cannot partially apply if one selected Installment fails validation or persistence.

NFR14: Simulated failures during Registration or multi-Installment Payment leave no partial database rows.

NFR15: Failed AI calls do not corrupt or invent Recommendation audit records.

NFR16: Centralized error handling returns a stable payload containing timestamp, status, error, message, and fieldErrors.

NFR17: Validation, authentication, authorization, missing-resource, conflict, and server errors map to `400`, `401`, `403`, `404`, `409`, and `500` respectively.

NFR18: The UI provides clear feedback for invalid login, validation errors, empty states, successful Registration, successful Payment, and recoverable service errors.

NFR19: A handled backend error never causes an unhandled frontend exception.

NFR20: AI Recommendation Requests and items retain complete request-to-result provenance.

NFR21: Payment records are append-only through normal application workflows.

NFR22: Customer, Product, Policy, Installment, Payment, and Recommendation persistence maintains referential integrity.

NFR23: Uniqueness constraints enforce Product Code, Policy Identifier, Transaction Reference, Policy Installment sequence, one active Customer/Product registration, and one Product per AI request.

NFR24: Primary journeys are keyboard-operable with associated labels, visible focus, semantic headings, and accessible table headers.

NFR25: Status and error feedback never depends on color alone.

NFR26: The responsive web application functions on current desktop and mobile viewport classes, with Chrome and Edge's two latest major versions assumed.

### Additional Requirements

- Establish a three-tier React, Spring Boot, and PostgreSQL architecture with Java 21, Spring Boot 3.5.7, and PostgreSQL 13+.
- Use Spring Web, Spring Security, Spring Data JPA, Spring AI, Jakarta Bean Validation, and Flyway or Liquibase for backend concerns.
- Use React functional components and hooks, Axios interceptors, Context/auth hooks, controlled forms, and local loading/error states for frontend concerns.
- Define all REST contracts in `/api/v1`, including authentication, Dashboard, Products, Recommendations, Registration, Payments, and Search endpoints.
- Implement immutable record DTOs and a centralized error envelope for all API requests and responses.
- Implement Customer, InsuranceProduct, CustomerPolicy, PremiumInstallment, PremiumPayment, AiRecommendationRequest, and AiRecommendationItem persistence with the architecture's relationships and fields.
- Enforce the architecture's database checks, foreign keys, unique constraints, partial active-policy unique index, indexes, and timestamp/audit fields.
- Use Spring Security with JWT or session authentication, one-way password hashing, configurable 30-minute inactivity timeout, CSRF protections where applicable, and TLS 1.3 for production traffic.
- Resolve the authenticated Customer from SecurityContext and verify ownership inside each protected data access flow.
- Make Registration and multi-Installment Payment operations transactional with `REPEATABLE_READ` isolation and idempotent Transaction Reference handling.
- Centralize deterministic age, eligibility, schedule, proration, penalty, reconciliation, and status-transition calculations in backend services.
- Build the AI candidate set from PostgreSQL, invoke Spring AI only with eligible Product facts, validate every output, persist provenance, and recover from timeout/provider failure without blocking Product discovery.
- Implement Product, Policy, Installment, Payment, Recommendation, and Search indexes, pagination with default page size 20, and query shapes that avoid unbounded responses and N+1 issues.
- Externalize database, session/JWT, AI provider, model, prompt version, and timeout configuration by environment and Spring profile.
- Provide Maven or Gradle backend builds, npm React builds/lint/tests, multi-stage container builds, health probes, and environment startup configuration.
- Instrument structured logging and audit access, Actuator/Prometheus metrics, and production-safe error tracking or observability integration.
- Create unit, integration, E2E, performance, and security tests, including rollback, cent-perfect financial reconciliation, AI hallucination rejection, and cross-Customer access cases.
- Target more than 80% coverage for critical authentication, registration, payment, validation, and transition logic.

### UX Design Requirements

UX-DR1: Implement the specified semantic design tokens for primary, secondary, background, surface, border, text, success, warning, and danger states.

UX-DR2: Use Inter or system sans-serif typography with tabular numerals for all money, dates, and Policy Identifiers; implement the 12-column responsive container and 24 px desktop/16 px mobile gutters.

UX-DR3: Provide a persistent 64 px top navigation containing brand, Dashboard, Make Payment, Policy Search, authenticated Customer badge, and Logout action.

UX-DR4: Implement protected routes for Dashboard, Registration, Payments, and Policy Search, plus a public Login route, with unauthenticated redirects and preserved Registration/Product selection state.

UX-DR5: Format all monetary values consistently with a currency symbol and exactly two decimal places, clear financial breakdowns, and tabular alignment.

UX-DR6: Surface age eligibility, duplicate registration, grace period, overdue, and 10% penalty rules proactively before submission and distinguish assistance from guaranteed suitability.

UX-DR7: Build the Login screen with labeled email/password fields, email validation, password visibility toggle, in-flight spinner, disabled submission, and generic invalid-credential feedback.

UX-DR8: Build the Dashboard with a registered-Policy table, complete columns, no-Policy empty state, filtered available-Product table, and Register action.

UX-DR9: Build the AI Advisor as a collapsible/drawer panel with optional DOB, goals, term, and type inputs, skeleton loading state, ranked result table, expandable rationale, Suitability pills, and Register action.

UX-DR10: Build Registration as a responsive read-only Customer/Product detail area plus interactive Start Date, computed Maturity Date and Total Premium, upfront eligibility state, conflict feedback, and confirmation card with follow-up actions.

UX-DR11: Build the Payment screen with Policy lookup, four-metric summary, sequential Installment table, selectable unpaid rows, disabled paid rows, editable partial/full amount, supported methods, and sticky selected-payment action bar.

UX-DR12: Display late penalties as a separate explicit breakdown, highlight grace-period dates and overdue state without relying on color alone, and update balances and statuses after accepted payment.

UX-DR13: Build Policy Search with Policy Identifier, Customer Name, and Date of Birth controls, valid-combination inline guidance, reset action, required result columns, pagination, page-size selection, and informative empty state.

UX-DR14: Standardize skeleton loading, mutation-button spinners, field-level API errors, dismissible global toasts, success banners, and recoverable service error states across all journeys.

UX-DR15: Make responsive tables horizontally scrollable below 768 px and keep Policy Identifier or Product Code visible as the sticky first column.

UX-DR16: Add explicit labels, semantic controls/headings, accessible table headers, visible keyboard focus, minimum 48 px touch targets, and `aria-live="polite"` announcements for dynamic totals and alerts.

UX-DR17: Maintain at least 4.5:1 contrast for status badges and represent success, warning, danger, and loading with text/icon semantics in addition to color.

### FR Coverage Map

FR1: Epic 1 - Authenticate a Customer and establish the ownership boundary.

FR2: Epic 1 - Display the authenticated Customer's complete personalized Policy overview.

FR3: Epic 2 - Discover active, eligible Products without duplicate registration conflicts.

FR4: Epic 2 - Capture profile preferences and initiate explainable Recommendation requests.

FR5: Epic 2 - Build a deterministic eligible Product candidate set for Recommendations.

FR6: Epic 2 - Validate AI output against the same request's eligible Product set.

FR7: Epic 2 - Persist auditable Recommendation request and ranked result provenance.

FR8: Epic 2 - Display actionable Recommendations and continue to Registration.

FR9: Epic 2 Story 2.3 and Epic 3 - Display and then submit the Registration data sourced from authenticated Customer and selected Product facts.

FR10: Epic 3 - Validate Registration with deterministic field and conflict errors.

FR11: Epic 2 Story 2.3 for pre-submit previews and Epic 3 for authoritative calculation and persisted Installments.

FR12: Epic 3 - Create a Policy and complete schedule atomically.

FR13: Epic 4 - Retrieve an owned Policy financial summary and payment schedule.

FR14: Epic 4 - Accept eligible multi-Installment full or partial simulated Payments atomically.

FR15: Epic 4 - Apply and persist exact late-payment penalties.

FR16: Epic 4 - Transition Installment and aggregate Policy payment states.

FR17: Epic 4 - Maintain an immutable, uniquely referenced Payment ledger.

FR18: Epic 5 - Validate the supported owned-Policy search combinations.

FR19: Epic 5 Story 5.1 for the exact result-table columns and Story 5.2 for bounded ordering, pagination, and empty-state behavior.

## Epic List

### Epic 1: Secure Access & Personalized Policy Overview

Customers can sign in, establish a protected session, and see a complete personalized portfolio without exposure of another Customer's data.

**FRs covered:** FR1, FR2

### Epic 2: Eligible Product Discovery & Explainable Recommendations

Customers can discover active, eligible Products that they do not already own, optionally request explainable AI rankings based on that same eligible set, and carry a selected Product into Registration.

**FRs covered:** FR3, FR4, FR5, FR6, FR7, FR8

### Epic 3: Policy Registration & Complete Installment Schedule

Customers can validate and register a selected Product, review exact maturity and total premium values, and receive a complete sequential Installment schedule created atomically.

**FRs covered:** FR9, FR10, FR11, FR12

### Epic 4: Premium Review & Atomic Multi-Installment Payment

Customers can review an owned Policy's schedule, make full or partial simulated Payments across eligible Installments, see exact penalties and status updates, and receive an immutable transaction reference.

**FRs covered:** FR13, FR14, FR15, FR16, FR17

### Epic 5: Owned-Policy Search & Financial Discovery

Customers can use the three supported search combinations to find only their owned Policies, page through bounded results, and review financial summaries with clear empty-state feedback.

**FRs covered:** FR18, FR19

## Epic 1: Secure Access & Personalized Policy Overview

Customers can sign in, establish a protected session, and see a complete personalized portfolio without exposure of another Customer's data.

### Story 1.1: [Sign in to a protected customer session](./epic-1/story-1-1-sign-in.md)

FR1; secure authentication, protected-session handling, Login UX, and Logout.

### Story 1.2: [View my personalized policy overview](./epic-1/story-1-2-policy-dashboard.md)

FR2; owned-Policy Dashboard, financial summary, empty/error states, responsive accessibility, and ownership enforcement.

## Epic 2: Eligible Product Discovery & Explainable Recommendations

Customers can discover active, eligible Products that they do not already own, optionally request explainable AI rankings based on that same eligible set, and carry a selected Product into Registration.

### Story 2.1: [Browse eligible available insurance Products](./epic-2/story-2-1-product-discovery.md)

FR3; active and eligible catalog discovery, duplicate filtering, responsive Product table, and safe Registration navigation.

### Story 2.2: [Generate auditable eligible AI recommendations](./epic-2/story-2-2-ai-recommendations.md)

FR4-FR7; guarded Spring AI candidate construction, output validation, Recommendation auditability, exact result columns, loading, and fallback states.

### Story 2.3: [Open pre-populated Registration from a recommendation](./epic-2/story-2-3-registration-handoff.md)

FR8-FR9 and registration previews; trusted Customer/Product display, Start Date, maturity, total-payable preview, stale-result handling, and accessible responsive form.

## Epic 3: Policy Registration & Complete Installment Schedule

Customers can validate and register a selected Product, review exact maturity and total premium values, and receive a complete sequential Installment schedule created atomically.

### Story 3.1: [Validate a policy registration request](./epic-3/story-3-1-registration-validation.md)

FR10; authoritative Customer/Product validation, age/date/value checks, duplicate conflict handling, and stable field-level feedback.

### Story 3.2: [Calculate the exact policy installment schedule](./epic-3/story-3-2-installment-schedule.md)

FR11; deterministic maturity, frequency-aligned dates, final-period proration, two-decimal totals, reconciliation, and preview.

### Story 3.3: [Commit registration and its installment schedule atomically](./epic-3/story-3-3-atomic-registration.md)

FR12; unique Policy creation, full Installment persistence, rollback safety, concurrency, confirmation, and safe retry.

## Epic 4: Premium Review & Atomic Multi-Installment Payment

Customers can review an owned Policy's schedule, make full or partial simulated Payments across eligible Installments, see exact penalties and status updates, and receive an immutable transaction reference.

### Story 4.1: [Review an owned policy payment schedule](./epic-4/story-4-1-payment-schedule.md)

FR13; owned-Policy summary, ordered Installments, selection eligibility, responsive financial table, ownership, and async states.

### Story 4.2: [Prepare an exact multi-installment payment quote](./epic-4/story-4-2-payment-quote.md)

FR14-FR15; owned selection validation, partial/full amounts, 10% late-penalty calculation, supported methods, and accessible payment action bar.

### Story 4.3: [Commit an atomic multi-installment payment](./epic-4/story-4-3-atomic-payment.md)

FR14, FR16-FR17; immutable ledger creation, idempotency, Installment/Policy status transitions, exact balance updates, rollback, and success feedback.

## Epic 5: Owned-Policy Search & Financial Discovery

Customers can use the three supported search combinations to find only their owned Policies, page through bounded results, and review financial summaries with clear empty-state feedback.

### Story 5.1: [Validate owned-policy search criteria and return its table contract](./epic-5/story-5-1-policy-search-validation.md)

FR18 and the exact FR19 result contract; supported combinations, ownership, criteria validation, exact eleven result columns, and accessible controls.

### Story 5.2: [Paginate owned-policy search results](./epic-5/story-5-2-policy-search-pagination.md)

FR19; consistent ordering, bounded page sizes, exact financial columns, total counts, responsive pagination controls, empty state, and latency.
