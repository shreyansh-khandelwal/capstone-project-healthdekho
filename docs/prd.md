---
title: HealthDekho Insurance Management System
status: final
created: 2026-11-24
updated: 2026-11-24
---

# PRD: HealthDekho Insurance Management System

**Status and recommendation:** Ready for UX, architecture, and story planning. The capstone MVP is product-complete, with the remaining questions limited to AI runtime configuration and the performance test dataset.

## 0. Document Purpose

This PRD translates the approved functional requirements for HealthDekho into a product definition for the capstone planning workflow. It is intended for product, UX, architecture, engineering, and test planning. The document defines the customer problem, user journeys, product capabilities, measurable outcomes, scope boundaries, and cross-cutting guardrails; detailed implementation and data-shape decisions belong in the accompanying addendum and downstream architecture artifacts.

## 1. Vision

HealthDekho gives insurance customers one secure place to understand their existing coverage, discover eligible products, receive explainable recommendations, register a policy, and manage premium payments. It replaces fragmented manual work with a traceable workflow in which every material calculation and state transition is deterministic and auditable.

The product thesis is that policy selection and premium management are parts of one customer journey, not separate transactions. HealthDekho therefore maintains these capabilities within a single authenticated experience: Product discovery, Recommendation, Registration, Installments, Payments, and Search. AI augments customer choice without controlling eligibility or financial outcomes.

For this capstone MVP, success means demonstrating the complete customer lifecycle with exact financial reconciliation, no cross-customer data access, no hallucinated Product Recommendations, and no partial multi-table mutations.

## 2. Target User

### 2.1 Primary User

The primary user is an authenticated customer who wants to buy and manage eligible insurance products without relying on manual insurer intervention.

### 2.2 Jobs To Be Done

- Understand which Policies I currently own, what they cost, and when they mature.
- Discover active Products I am eligible for without seeing Products I already hold.
- Receive an explainable shortlist of Products relevant to my age, goals, preferred term, and preferred insurance type.
- Register a selected Product and know the complete Installment schedule before committing.
- Pay one or more eligible Installments and see exactly how penalties and remaining balances were calculated.
- Find a Policy quickly using the identifiers and customer information available to me.

### 2.3 Non-Users (MVP)

- Insurance administrators and agents managing the Product catalog.
- Claims handlers or customers initiating a claim.
- Insurers evaluating underwriting risk beyond the product eligibility rules supplied by the catalog.
- Public or unauthenticated users accessing customer policy data.

### 2.4 Key User Journeys

- **UJ-1. Asha reviews her insurance position.** Asha signs in with her customer credentials, is taken to her personalized Dashboard, and sees a clear table of her registered Policies, payment frequency, Premium Amount, Sum Insured, and status. If she has no Policies, the Dashboard explains that state and offers Product discovery. A failed login keeps Asha on the login experience with a clear credential error.
- **UJ-2. Arjun finds and registers an eligible policy.** Arjun opens the available Products view, sees only active Products that do not conflict with the Duplicate Registration rule, and selects Register. The registration experience shows his read-only Customer profile and selected Product facts, calculates the Maturity Date and Total Premium Payable, and confirms the generated Policy Identifier and full Installment schedule.
- **UJ-3. Meera asks for an explainable recommendation.** Meera enters optional profile and preference inputs, requests recommendations, and sees a ranked table limited to active, eligible database Products she does not own. Each result includes a reason and Suitability value. Meera selects Register on a result and continues into the pre-populated registration journey. If the AI service fails, the deterministic Product catalog remains available.
- **UJ-4. Karan pays an overdue installment.** Karan searches for his Policy Identifier, reviews the Policy summary and Installment schedule, selects one or more unpaid eligible Installments, and submits a Payment. The system displays the 10% late penalty where applicable, records the amount, updates Installment and Policy statuses, and shows a unique Transaction Reference.
- **UJ-5. Sana finds a policy by supported search criteria.** Sana enters a Policy Identifier, Customer Name, or Policy Identifier plus Date of Birth. The system validates the combination, returns a paginated result with financial summary information, and shows an informative empty state when no owned Policy matches.

## 3. Glossary

- **AI Recommendation Request** - One auditable request containing Customer profile inputs, Calculated Age, model metadata, prompt version, and request time.
- **Outstanding Amount** - The remaining scheduled or penalty-adjusted amount available for Payment on an Installment.
- **Calculated Age** - A Customer's exact age derived from Date of Birth and the relevant current date.
- **Customer** - The authenticated person who owns Policies and initiates Recommendations, Registrations, Payments, and Searches.
- **Customer Name** - The full name stored on the Customer profile.
- **Dashboard** - The authenticated landing experience showing a Customer's Policies, Product discovery entry point, and Recommendation panel.
- **Date of Birth** - A Customer's profile date, which must not be in the future.
- **Duplicate Registration** - An attempt by the same Customer to register a Product while an active Policy for that Product still exists. Re-registration is permitted after the prior Policy becomes inactive.
- **Grace Period End Date** - The final date after which a late Payment penalty applies to an Installment; one calendar month after its Due Date.
- **Installment** - One scheduled premium obligation belonging to a Policy.
- **Maturity Date** - The date on which a Policy term ends, calculated from Start Date and Product term.
- **Payment** - An immutable financial audit record associated with one Installment and one Transaction Reference.
- **Payment Method** - The recorded channel used for Payment: Card, UPI, Net Banking, or Cash / Offline in MVP.
- **Payment Status** - The current Installment state: `PENDING`, `PARTIALLY_PAID`, `OVERDUE`, or `PAID`.
- **Policy** - A registered instance of a Product owned by one Customer.
- **Policy Identifier** - The unique, user-visible identifier assigned to a Policy, corresponding to the stored policy number.
- **Policy Search** - A Customer-owned Policy query using one of the supported valid search combinations.
- **Policy Status** - The lifecycle and aggregate payment state of a Policy.
- **Premium Amount** - The currency value due for one Installment.
- **Premium Frequency** - The recurrence of Premium Amount obligations: `MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, or `YEARLY`.
- **Product** - An active or inactive insurance offering in the PostgreSQL catalog.
- **Product Code** - The unique catalog identifier used to refer to a Product.
- **Recommendation** - A Product selected and ranked by Spring AI from the eligible database Product set, with a reason and Suitability.
- **Registration** - The atomic act of creating a Customer Policy and all associated Installments.
- **Start Date** - The date on which a Policy begins; it defaults to the current date and may be explicitly changed only within the validated registration flow.
- **Suitability** - The model-provided classification of how well a Recommendation matches the Customer's supplied profile and preferences: `HIGH`, `MEDIUM`, or `LOW`.
- **Sum Insured** - The maximum insured amount displayed and stored for a Policy or Product.
- **Total Premium Payable** - The deterministic total scheduled premium for the complete Policy term before late penalties.
- **Transaction Reference** - The unique identifier assigned to a Payment.

## 4. Features

### 4.1 Customer Authentication and Dashboard

**Description:** Provides the secure entry point and personalized Policy overview. Realizes UJ-1 and establishes the ownership boundary for every later journey.

**Functional Requirements:**

#### FR-1: Authenticate a Customer

A Customer can submit email and password through the React login form and establish an authenticated session through Spring Security.

**Consequences (testable):**
- Valid credentials create an authenticated session and redirect the Customer to the Dashboard.
- Invalid credentials do not create a session and show a clear user-facing error without disclosing which credential was wrong.
- Dashboard, Recommendation, Registration, Payment, and Policy Search endpoints require authentication.
- Passwords are stored only as strong one-way hashes and are never returned through an API.

#### FR-2: Display a Personalized Dashboard

An authenticated Customer can view every Policy they own and that Policy's key status, schedule, and payment facts.

**Consequences (testable):**
- The table displays Policy Identifier, Product Name, Policy Type, Term, Start Date, Maturity Date, Premium Frequency, Premium Amount, Sum Insured, and Policy Status.
- Customers with no Policies see a specific empty state rather than an empty table.
- A request for another Customer's Policy returns `401` or `403` and exposes no Policy data.

#### FR-3: Discover Available Products

An authenticated Customer can browse active, eligible Products that pass the Duplicate Registration rule.

**Consequences (testable):**
- Only Products with `active = true` are displayed.
- Products already registered by the Customer under the Duplicate Registration rule are excluded before results are returned.
- Each row displays Product Code, Product Name, Policy Type, term, Sum Insured, Premium Frequency, Premium Amount, and a Register action.
- Selecting Register carries the selected Product Code into the Registration experience.

### 4.2 Explainable AI Recommendations

**Description:** Generates a ranked shortlist from the eligible database Product set while keeping eligibility and financial logic deterministic. Realizes UJ-3.

**Functional Requirements:**

#### FR-4: Capture Recommendation Inputs

A Customer can request Recommendations using optional or combined Date of Birth, insurance goals and preferences, preferred term, and preferred insurance type.

**Consequences (testable):**
- The interface accepts zero or more supported preference inputs and visibly reports loading, success, empty, and error states.
- Invalid dates are rejected by client validation and server validation.
- Calculated Age is derived deterministically for every Recommendation workflow.

#### FR-5: Build the Eligible Recommendation Set

The service can build a Recommendation candidate set from active database Products that the Customer does not already own and that satisfy deterministic profile eligibility where sufficient profile data exists.

**Consequences (testable):**
- The AI provider receives only Product data retrieved from PostgreSQL and excluded by server-side eligibility rules.
- Ineligible, inactive, and duplicate Products never enter the model candidate set.
- When the AI service is unavailable, the UI shows a clear Recommendation failure state and the deterministic eligible Product catalog remains available.

#### FR-6: Validate AI Output

The service can accept a Recommendation only when every returned Product maps to an eligible database Product from the same request.

**Consequences (testable):**
- Any unknown, inactive, duplicate, or ineligible Product is excluded from the customer-visible result and cannot be registered from that result.
- Recommendation count cannot exceed the eligible candidate set.
- A hallucinated Product never appears in the API response, including as display-only metadata.

#### FR-7: Persist Recommendation Audit Data

The service can record the request and each valid ranked item for auditability.

**Consequences (testable):**
- Every AI invocation persists one AI Recommendation Request, including Customer, preferences, Calculated Age, model name, model version, prompt version, and request timestamp.
- Every displayed Recommendation persists with request ID, Product ID, rank order, reason, and Suitability.
- Duplicate Product items cannot be stored within one AI Recommendation Request.

#### FR-8: Display and Act on Recommendations

A Customer can compare Recommendation results and continue to Registration from a selected result.

**Consequences (testable):**
- Results display Product Code, Product Name, Policy Type, term, Sum Insured, Premium Frequency, Premium Amount, reason, Suitability, and Register.
- Register opens the Registration experience with the selected Product pre-populated.
- The UI labels Recommendations as explainable assistance rather than a guarantee of suitability.

### 4.3 Policy Registration

**Description:** Creates a Policy from a selected Product and generates the entire premium schedule atomically. Realizes UJ-2 and the Registration branch of UJ-3.

**Functional Requirements:**

#### FR-9: Pre-Populate Registration

A Customer can open Registration with read-only Customer profile data and read-only selected Product data.

**Consequences (testable):**
- Customer Name, Date of Birth, and contact information are read from the authenticated Customer profile and cannot be edited in Registration.
- Policy Type, Product Name, term, Premium Frequency, Premium Amount, and Sum Insured are read from the selected database Product and cannot be edited in Registration.
- Start Date defaults to the current date, Maturity Date is derived, and Total Premium Payable is displayed before confirmation.

#### FR-10: Validate Registration

The service can reject invalid Registration requests with deterministic field-level errors.

**Consequences (testable):**
- Date of Birth is never in the future.
- Calculated Age is within the Product's minimum and maximum entry-age bounds.
- Maturity Date is strictly after Start Date.
- Premium Amount, Sum Insured, and term are strictly positive.
- Duplicate Registration is rejected with `409 Conflict` even if the client does not correctly filter the Product.

#### FR-11: Calculate Policy Values

The service can calculate total financial and schedule values without AI participation.

**Consequences (testable):**
- Maturity Date equals Start Date plus the selected Product term in months.
- Total Premium Payable is derived from Premium Amount, Premium Frequency, and term, using two-decimal rounding.
- A term not evenly divisible by the Premium Frequency interval creates a final adjusted Installment for the shorter remaining period.
- The final adjusted Installment is prorated as Premium Amount multiplied by remaining months divided by frequency interval months.
- Every Installment count and amount reconciles to Total Premium Payable, with rounding and final-period adjustment explicitly tested.

#### FR-12: Create Policy and Installment Schedule Atomically

The service can create a unique Policy Identifier, one Policy, and the complete sequential Installment schedule in a single transaction.

**Consequences (testable):**
- Installments receive consecutive sequence numbers beginning at 1.
- Each Due Date follows the selected Premium Frequency from Start Date.
- Each Grace Period End Date is one calendar month after its Due Date.
- Any failure in Policy or Installment creation rolls back every row written by that Registration.
- Successful Registration returns the generated Policy Identifier and a confirmation message.

### 4.4 Premium Payment Management

**Description:** Lets a Customer review obligations, pay one or more eligible Installments, and receive exact payment and penalty information. Realizes UJ-4.

**Functional Requirements:**

#### FR-13: Find a Policy Payment Schedule

A Customer can search by Policy Identifier to retrieve an owned Policy summary and its Installment schedule.

**Consequences (testable):**
- The summary displays Policy Identifier, Customer Name, Product Name, term, Start Date, Maturity Date, Total Premium Payable, total paid, and remaining amount.
- The schedule displays sequence, Premium Amount, Due Date, Grace Period End Date, Payment Status, and selection eligibility.
- Another Customer's Policy cannot be retrieved.

#### FR-14: Pay Selected Eligible Installments

A Customer can submit Payment for one or multiple selected eligible Installments in a single atomic operation.

**Consequences (testable):**
- The API accepts only supported Payment Methods.
- MVP Payment submission simulates successful completion without calling an external provider.
- The system accepts partial Payment for any unpaid Installment and any supported Payment Method, subject to the amount ceiling and transaction validation.
- A full or partial Payment creates a corresponding immutable Payment record and updates the selected Installment.
- A `PAID` Installment cannot receive another Payment.
- A submitted amount cannot exceed the Outstanding Amount plus the applicable penalty.
- Any failure among selected Installments rolls back all Payment, Installment, and Policy updates in the request.

#### FR-15: Apply Late Payment Penalties

The service can deterministically apply a late penalty after an Installment's Grace Period End Date.

**Consequences (testable):**
- No late penalty applies when Payment Date is on or before Grace Period End Date.
- A Payment Date after Grace Period End Date adds 10% of the outstanding Installment amount as the applicable penalty.
- Every later partial Payment after the Grace Period End Date recalculates the 10% penalty against the Outstanding Amount at that Payment Date.
- Penalty calculations use fixed two-decimal currency precision and are included in the maximum permitted Payment calculation.
- The Payment record stores the applied penalty separately from the amount paid.

#### FR-16: Transition Payment and Policy Statuses

The service can transition an Installment through `PENDING`, `PARTIALLY_PAID`, `OVERDUE`, and `PAID`, then aggregate the Policy state.

**Consequences (testable):**
- An unpaid Installment becomes `OVERDUE` immediately after its Due Date, while the Grace Period continues to control penalty applicability.
- A partial accepted Payment results in `PARTIALLY_PAID` until the Installment becomes fully paid; if the Due Date has passed, the status remains `OVERDUE` until the obligation is settled.
- An Installment reaches `PAID` only when its scheduled and applicable penalty obligation is fully settled.
- The Policy reaches the fully paid/completed state only when all associated Installments are `PAID`.

#### FR-17: Maintain an Immutable Payment Ledger

The service can create one unique and immutable Payment audit record per accepted installment Payment.

**Consequences (testable):**
- Each Payment receives a unique Transaction Reference, Payment Date, amount paid, penalty amount, Payment Method, and creation timestamp.
- API behavior provides no update or delete operation for a recorded Payment.
- Stored Payment rows cannot be silently altered through normal application workflows.

### 4.5 Policy Search

**Description:** Enables efficient multi-criteria lookup of owned Policies with financial aggregation. Realizes UJ-5.

**Functional Requirements:**

#### FR-18: Validate Search Criteria

A Customer can search by Policy Identifier, Customer Name, or Policy Identifier plus Date of Birth.

**Consequences (testable):**
- Requests without a valid supported combination return `400 Bad Request` with guidance about accepted combinations.
- Date of Birth alone is not accepted unless paired with Policy Identifier.
- Customer Name alone is supported as a match criterion.
- Search criteria cannot override authenticated Customer ownership.

#### FR-19: Return Paginated Policy Results

The system can return an ordered, paginated result set containing Policy and financial summary values.

**Consequences (testable):**
- Results display Policy Identifier, Customer Name, Date of Birth, Product Name, Policy Type, Start Date, Maturity Date, Total Premium Payable, Policy Status, total paid, and remaining amount.
- Pagination prevents an unbounded response for broad Customer Name searches.
- Zero matches return an informative empty result without an error.

## 5. Non-Goals (Explicit)

- Processing claims or storing claim-related data.
- Product catalog administration, underwriting workflows, or insurer staff roles.
- AI-generated eligibility decisions, policy validation, financial calculations, Payment status transitions, or policy lifecycle decisions.
- Live settlement or bank reconciliation with an external Payment gateway. MVP Payment submission simulates successful completion and records the selected Payment Method without contacting a provider.
- Customer self-registration, password reset, or identity verification beyond credential-based login.
- Cross-customer or staff-facing administration of Policies.
- Notifications by email, SMS, push, or calendar reminders.
- Policy cancellation, surrender, refund, renewal, reinstatement, or claims servicing.

## 6. MVP Scope

### 6.1 In Scope

- Customer authentication and personalized Dashboard.
- Owned Policy display and no-policy state.
- Active Product discovery with duplicate filtering.
- Explainable AI Recommendations from eligible database Products, with full auditability.
- Product-to-Registration pre-population, deterministic validation, atomic Policy creation, and Installment generation.
- Multi-installment Payments with partial Payment, late penalty, status transition, and immutable ledger behavior.
- Policy Search with the three supported combinations and pagination.
- Web application states for validation feedback, loading, empty results, errors, success, and notifications.
- PostgreSQL persistence and environment-externalized configuration.

### 6.2 Out of Scope for MVP

- Every item in Non-Goals.
- Mobile-native applications; the MVP is a responsive web application.
- Real-time currency conversion or multiple currencies.
- Recommendation model training or fine-tuning.
- Production operational commitments such as on-call, disaster recovery objectives, or geographic failover.

## 7. Cross-Cutting NFRs

### 7.1 Security and Ownership

- Every protected endpoint must resolve the authenticated Customer as the ownership authority.
- Customers must receive only their own Dashboard, Policy, Installment, Payment, and Recommendation data.
- Unauthorized cross-Customer attempts must return `401` or `403`, as applicable, with no useful object existence disclosure.
- REST requests and responses must use record DTOs; JPA entities must never cross the API boundary.
- All state-changing APIs must validate mandatory and range-constrained fields server-side.
- Credentials, database connection details, AI model settings, and session or JWT secrets must be supplied by environment configuration.

### 7.2 Financial Correctness

- Monetary values must use `BigDecimal` with `NUMERIC(19,2)` persistence and `RoundingMode.HALF_UP` where rounding is needed.
- Calculations must be reproducible from stored Product, Policy, Installment, and Payment inputs.
- Schedule totals, paid amounts, penalties, and remaining balances must reconcile to the exact cent.
- Policy, Installment, Payment, and aggregate status mutations must be transactional and idempotent at the accepted Transaction Reference boundary.

### 7.3 Performance

- Standard CRUD and paginated Search endpoints must respond in less than 300 ms at p95 on the agreed capstone test dataset. `[ASSUMPTION: The test dataset will be large enough to exercise indexed dashboard and search queries but does not represent production scale.]`
- AI Recommendation requests must finish within 5 seconds in the demo environment or show a recoverable timeout state.
- The UI must show a loading state for asynchronous operations and prevent duplicate submission during in-flight mutations.

### 7.4 Reliability and Atomicity

- Registration must not leave a Policy without its complete Installment schedule.
- A multi-Installment Payment must not partially apply if one selected Installment fails validation or persistence.
- Simulated failures in the middle of either multi-table workflow must leave no partial rows.
- A failed AI call must not corrupt or invent Recommendation audit records.

### 7.5 Error Handling and User Feedback

- Centralized error handling must return `timestamp`, `status`, `error`, `message`, and `fieldErrors` in a stable payload.
- Expected validation, authentication, authorization, missing-resource, conflict, and server-error conditions must map to `400`, `401`, `403`, `404`, `409`, and `500` respectively.
- The UI must display clear feedback for invalid login, validation errors, no Policies, no Recommendations, no Search results, successful Registration, successful Payment, and recoverable service errors.
- No handled error may result in an unhandled frontend exception.

### 7.6 Auditability and Data Integrity

- AI Recommendation Requests and items must retain request-to-result provenance.
- Payment records must be append-only through normal application paths.
- Customer, Policy, Product, Installment, Payment, and Recommendation records must maintain referential integrity.
- Unique constraints must enforce Product Code, Policy Identifier, Transaction Reference, one sequence per Policy, at most one active Customer/Product registration, and one Product per AI Recommendation Request.

### 7.7 Accessibility and Responsive Web

- The primary journeys must be keyboard-operable and use associated labels, visible focus, semantic headings, and accessible table headers.
- User-visible status and error feedback must not depend on color alone.
- The MVP must render and function on current desktop and mobile web viewport classes. `[ASSUMPTION: Current browser support means the two most recent major versions of Chrome and Edge.]`

## 8. Constraints and Guardrails

### 8.1 Product and Domain Guardrails

- AI can explain, rank, and summarize active eligible Products; it cannot replace deterministic business validation, age eligibility, Duplicate Registration checks, schedule generation, or financial calculations.
- Recommendations must come only from Product records retrieved from PostgreSQL for the same authenticated request.
- Every financial result presented in the UI must be reproduced or accepted by deterministic server logic, never calculated solely by the AI model or trusted client arithmetic.
- Claims remain excluded for the complete MVP.

### 8.2 Technical Constraints

- Backend: Java 21 and Spring Boot 3.5.7, using Spring Web, Spring Security, Spring Data JPA, Spring AI, and Jakarta Bean Validation.
- Frontend: React functional components and hooks, Axios, client-side validation, loading states, and banner or toast feedback.
- Database: PostgreSQL with date/time and currency types appropriate to the financial and audit workflows.
- Data boundary: immutable record DTOs for all REST requests and responses.
- Configuration: environment-specific development and production profiles; no committed credentials or model secrets.

Implementation-level mapping is maintained in [addendum.md](addendum.md).

## 9. Information Architecture

The responsive web application exposes the following top-level authenticated experiences:

1. Dashboard - owned Policies and entry points to Product discovery and Recommendations.
2. Available Products - filtered catalog with Register actions.
3. Recommendation Panel - optional preference inputs and ranked results; may be displayed within the Dashboard.
4. Registration - read-only profile and Product facts, calculated Policy facts, and confirmation.
5. Payments - Policy Identifier lookup, financial summary, Installment schedule, selection, and Payment submission.
6. Policy Search - validated criteria, paginated results, and empty state.

The login experience is the only unauthenticated functional surface in MVP.

## 10. Risks and Mitigations

| Risk | Product impact | Mitigation |
|---|---|---|
| AI invents or ranks an unavailable Product | Unsafe or incorrect Registration path | Restrict candidate set in PostgreSQL, validate every output, and test hallucination rejection |
| Floating-point or rounding differences | Incorrect financial obligations and failed demos | Centralize two-decimal `BigDecimal` calculations and exact reconciliation tests |
| Partial multi-table failure | Inconsistent Policy or Payment state | Use one transaction per Registration or Payment request and simulate rollback failure |
| Cross-Customer object access | Data confidentiality failure | Resolve ownership from authentication and never trust a client-supplied Customer identifier |
| Repeated late partial Payments | Penalty amount may be recalculated incorrectly | Recalculate 10% of the Outstanding Amount on every late partial Payment and store each applied penalty separately |
| Slow AI response | Apparent hang or unusable Recommendation journey | Loading state, 5-second target, timeout recovery, and fallback catalog |
| Simulated Payment is mistaken for settlement | Demo behavior could be misrepresented | Label the capstone flow as simulated and keep external settlement explicitly out of scope |
| Active-only Duplicate Registration constraint is violated | Concurrent requests could create conflicting Policies | Enforce one active Customer/Product registration in service validation and a partial database unique index |

## 11. Success Metrics

### Primary

- **SM-1: Core Workflow Completion** - 100% of the five core journeys execute end-to-end across React, Spring Boot REST APIs, and PostgreSQL without manual database intervention. Validates FR-1 through FR-19.
- **SM-2: Duplicate Registration Prevention** - 100% of attempts to register an already-held active Product are blocked by UI filtering and backend conflict or database constraint behavior. Validates FR-3 and FR-10.
- **SM-3: Financial Reconciliation** - 100% of tested Total Premium Payable, Installment schedule, 10% penalty, partial Payment, remaining balance, and Policy completion scenarios reconcile exactly to the cent. Validates FR-11, FR-14, FR-15, and FR-16.
- **SM-4: Transaction Atomicity** - 100% of simulated Registration and multi-Installment Payment failures leave zero partial records. Validates FR-12 and FR-14.
- **SM-5: AI Product Integrity** - 0 hallucinated Products reach the API or UI; 100% of Recommendations map to valid active eligible Products. Validates FR-5 and FR-6.
- **SM-6: Recommendation Audit Coverage** - 100% of AI Recommendation invocations persist both the AI Recommendation Request and each ranked item. Validates FR-7.
- **SM-7: Ownership Security** - 100% of tested cross-Customer Dashboard, Policy, Recommendation, and Payment access attempts return `401` or `403` with no data leakage. Validates FR-1, FR-2, FR-13, and FR-18.

### Secondary

- **SM-8: API Latency** - Standard CRUD and paginated Search endpoints respond in under 300 ms at p95 on the capstone test dataset. Validates FR-2, FR-3, FR-13, and FR-19.
- **SM-9: Recommendation Latency** - Recommendation calls complete in under 5 seconds or transition to a clear recoverable timeout state. Validates FR-4 through FR-8.
- **SM-10: Error and Empty-State Coverage** - 100% of planned validation, empty Policy, zero Recommendation, zero Search, and recoverable service-error scenarios display user-friendly feedback without an unhandled frontend exception. Validates FR-1 through FR-19.

### Counter-Metrics (Do Not Optimize)

- **SM-C1: Recommendation Conversion Rate** - Do not optimize registration count at the expense of Product eligibility, explainability, auditability, or Customer choice. Counterbalances SM-1, SM-5, and SM-6.
- **SM-C2: Average Payment Amount** - Do not encourage overpayment or discourage valid partial Payments merely to improve aggregate Payment values. Counterbalances SM-3 and SM-4.
- **SM-C3: API Response Suppression** - Do not satisfy latency targets by silently truncating eligible Products, Recommendations, Installments, or Search matches. Counterbalances SM-8.

## 12. Open Questions

1. Which exact Spring AI provider and model are available in the demonstration environment, and what fallback behavior is expected when credentials are absent?
2. What named capstone test dataset and deployment environment will be used to verify the stated latency targets?

## 13. Assumptions Index

- [Section 7.3] The latency test dataset is sufficiently representative to exercise indexes but is not production-scale.
- [Section 7.7] Current browser support means the two most recent major versions of Chrome and Edge.

---

Source: [functional-requirements.md](../../../../docs/functional-requirements.md)
