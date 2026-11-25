# HealthDekho PRD Addendum: Implementation Inputs

## Purpose

This addendum preserves implementation constraints, detailed calculation rules, and data-contract inputs supplied with the functional requirements. The PRD remains the product authority; this file provides downstream architecture and engineering context without expanding product scope.

## 1. Technology Constraints

### Backend

- Java 21.
- Spring Boot 3.5.7.
- Spring Web for REST APIs.
- Spring Security for authentication and ownership enforcement.
- Spring Data JPA and PostgreSQL for persistence.
- Spring AI for Product Recommendation explanations and rankings only.
- Jakarta Bean Validation on request DTOs.
- Immutable Java `record` DTOs at all REST boundaries.
- Java Time (`LocalDate`, `YearMonth`, `Period`), `BigDecimal`, `Optional`, Streams, and pattern matching/switch expressions where they clarify status or input handling.

### Frontend

- React with functional components and hooks.
- Axios for authenticated REST calls.
- Client-side validation, search/filter behavior, tables, pagination, loading states, and banner or toast notifications.
- No JPA entity payloads are consumed directly by the frontend.

### Database

- PostgreSQL.
- Monetary columns use `NUMERIC(19,2)`.
- Date-only fields use `DATE`.
- Audit timestamps use `TIMESTAMPTZ`.
- `BIGINT` or `UUID` keys may be selected during architecture, but the selected key approach must be consistent.

## 2. Layering and API Boundary Rules

- Controller, Service, Repository, Entity, DTO, and AI Integration responsibilities must remain separate.
- Controllers validate and delegate; they do not own financial or eligibility calculations.
- Services own deterministic validation, calculations, transactional orchestration, and status transitions.
- Repositories expose ownership-safe Product, Policy, Installment, and Recommendation queries.
- Spring AI integration receives structured prompt context and returns structured output suitable for validation.
- REST endpoints use Java records for requests and responses.
- Entity objects never appear in controller method parameters or response bodies.
- All authenticated workflows resolve Customer ownership from the security context rather than a request-provided Customer ID.

## 3. Database Contract Inputs

### Customer

- Key: `customer_id`.
- Unique required email.
- Required password hash, full name, Date of Birth, status, and creation timestamp.
- Optional phone and update timestamp.
- Constraint: `date_of_birth <= CURRENT_DATE`.
- Index status.

### Insurance Product

- Key: `product_id`.
- Unique required Product Code.
- Required Product Name, Policy Type, term in months, Premium Frequency, Premium Amount, Sum Insured, minimum entry age, maximum entry age, and active flag.
- Checks that ensure Premium Amount and Sum Insured are positive currency values.
- Constraint: maximum entry age is greater than or equal to minimum entry age.
- Index active.

### Customer Policy

- Key: `policy_id`.
- Unique required Policy Identifier.
- Required references to Customer and Product.
- Required Start Date, Maturity Date, Premium Frequency, Premium Amount, Sum Insured, Total Premium Payable, Policy Status, and creation timestamp.
- Enforce at most one active registration per Customer/Product combination by using a partial unique index over active Policy states.
- Permit Registration of the same Product after the prior Policy becomes inactive.
- Index Customer and Policy Status.

### Premium Installment

- Key: `installment_id`.
- Required Policy reference, sequence number, Due Date, Grace Period End Date, scheduled amount, paid amount, and Payment Status.
- Unique Policy/sequence pair.
- Non-negative paid amount.
- Index Policy and due/status fields as architecture requires.

### Premium Payment

- Key: `payment_id`.
- Required Installment reference, unique Transaction Reference, Payment Date, amount paid, penalty amount, Payment Method, and creation timestamp.
- Positive amount paid and non-negative penalty.
- Index Installment and Payment Date.
- No normal application update/delete path.

### AI Recommendation Request

- Key: `recommendation_request_id`.
- Required Customer reference, Calculated Age, model name, model version, prompt version, and request timestamp.
- Optional goals, preferred term, and preferred Policy Type.
- Index Customer and request timestamp.

### AI Recommendation Item

- Key: `recommendation_item_id`.
- Required AI Recommendation Request reference, Product reference, rank, and Suitability.
- Optional Recommendation reason.
- Selection-for-Registration flag defaults to false.
- Unique Product within one AI Recommendation Request.

## 4. Deterministic Calculation Rules

### Calculated Age

- Use `Period.between(dateOfBirth, relevantDate).getYears()` rather than an approximate day count.
- Reject future Date of Birth values before age calculations or catalog eligibility checks.

### Maturity Date

- `maturityDate = startDate.plusMonths(product.termMonths)`.
- Reject any result that is not strictly later than Start Date.

### Premium Frequency and Installment Count

- `MONTHLY`: 12 Installments per 12-month period, one per term month.
- `QUARTERLY`: one Installment per 3 months.
- `HALF_YEARLY`: one Installment per 6 months.
- `YEARLY`: one Installment per 12 months.
- Generate full-frequency Installments for complete intervals, followed by one final adjusted Installment when the remaining term is shorter than the interval.
- Prorate the final adjusted Installment as `premiumAmount * remainingMonths / frequencyIntervalMonths`, rounded to two decimals with `HALF_UP`.

### Total Premium Payable

- Derive the number of complete intervals plus any final adjusted Installment from term and Premium Frequency.
- Derive Total Premium Payable by summing all full and prorated Installment amounts.
- Persist and return two-decimal results.
- Use `RoundingMode.HALF_UP` when a calculation creates more than two decimal places.

### Grace Period and Late Penalty

- `gracePeriodEndDate = dueDate.plusMonths(1)`.
- An unpaid Installment becomes `OVERDUE` immediately after Due Date, while penalties remain controlled by Grace Period End Date.
- No penalty when `paymentDate <= gracePeriodEndDate`.
- If `paymentDate > gracePeriodEndDate`, `penalty = outstandingInstallmentAmount * 0.10`, rounded to two decimals with `HALF_UP`.
- Every later late partial Payment recalculates a new 10% penalty on the amount still outstanding at that Payment Date and records it separately.
- The amount permitted for a Payment equals outstanding scheduled amount plus the penalty calculated for that submission.

### Paid and Remaining Amounts

- Total paid is the sum of accepted `amount_paid` values.
- Penalty is stored separately from base premium and may be included in a Payment record.
- Remaining premium is the Total Premium Payable minus accepted base premium amounts paid.
- Installment and Policy completion require all scheduled and applicable penalty obligations to be satisfied.

## 5. Transaction Boundaries

### Registration Transaction

One service transaction must:

1. Load the selected Product and authenticated Customer.
2. Revalidate age, active state, Duplicate Registration, dates, and positive values.
3. Generate the Policy Identifier.
4. Create the Policy.
5. Generate and create every Installment.
6. Commit all rows together.
7. Return the generated identifier and summary.

Any exception after the first mutation must roll back the complete transaction.

### Payment Transaction

One service transaction must:

1. Load the owned Policy and all selected Installments with appropriate locking if concurrent Payment is possible.
2. Revalidate ownership, eligibility, Payment Status, amount ceilings, Payment Date, and Payment Method.
3. Calculate outstanding base premium and applicable penalty.
4. Create an immutable Payment record for every accepted Installment Payment.
5. Update Installment paid amount and Payment Status.
6. Recalculate remaining balances and Policy completion.
7. Commit all selected operations together.

A Transaction Reference is unique and may be used to detect retries or duplicate submission. Idempotency semantics must be specified in API design.

## 6. AI Integration Contract

### Model Inputs

- Authenticated Customer identifier resolved server-side.
- Calculated Age.
- Optional goals and preferences.
- Preferred term.
- Preferred Policy Type.
- Structured eligible Product candidates, including Product Code, Product Name, Policy Type, term, Premium Frequency, Premium Amount, Sum Insured, and eligibility bounds as needed for explanation.

### Structured Output

Each model item must contain at least:

- Product Code.
- Rank order.
- Recommendation reason.
- Suitability as `HIGH`, `MEDIUM`, or `LOW`.

### Output Validation

- Parse model output into a typed DTO.
- Reject or filter malformed items.
- Match Product Code against the exact candidate set for that invocation.
- Never issue a Recommendation for an inactive, unknown, duplicate, or owned Product.
- Deduplicate Products before persistence.
- Fail visibly if ranking or controlled values violate the agreed contract.

### Audit Metadata

Persist model name, model version, prompt version, request timestamp, Customer, Calculated Age, preference inputs, returned valid Product IDs, ranks, reasons, and Suitability.

## 7. Security and Error Contract

### Authentication

- Use Spring Security and BCrypt password hashing.
- Protect Dashboard, Recommendation, Registration, Payment, and Search endpoints.
- Choose session or JWT mechanics in architecture; do not commit secrets.

### Ownership

- Derive Customer identity from `Authentication`/`Principal`.
- Query by both authenticated Customer identity and requested Policy or Recommendation identity where appropriate.
- Avoid returning data-bearing `404`/`403` combinations that enable existence enumeration beyond the agreed policy.

### Error Payload

```json
{
  "timestamp": "2026-11-24T00:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Request validation failed",
  "fieldErrors": {
    "startDate": "must be today or a permitted valid date"
  }
}
```

Expected mappings:

- `400` validation or unsupported search combination.
- `401` missing or invalid authentication.
- `403` authenticated but unauthorized ownership/access.
- `404` missing owned resource.
- `409` Duplicate Registration, duplicate Payment/Transaction Reference, or conflicting state transition.
- `500` unexpected server failure without internal data disclosure.

## 8. Configuration Profiles

Externalize at least:

- PostgreSQL URL, username, and password.
- Spring AI provider, model, credentials, and endpoint where applicable.
- Prompt and model version identifiers.
- Session or JWT signing secrets.
- Allowed origins.
- Environment name and logging level.

Provide environment-specific development and production profiles. Local defaults must not contain usable production credentials.

## 9. Payment Method Interpretation for MVP

The PRD accepts four recorded Payment Methods: Card, UPI, Net Banking, and Cash / Offline. Payment submission is simulated: the backend validates and records the selected method, amount, penalty, and Transaction Reference without contacting a live provider.

## 10. Suggested Downstream Artifacts

- UX specification for UJ-1 through UJ-5 and responsive table/form behavior.
- Architecture decision for authentication mechanism and ownership-safe query patterns.
- Architecture decision for Duplicate Registration and overdue/penalty state rules.
- API contract for authentication, Product discovery, Recommendations, Registration, Payment, and Search.
- Test strategy covering exact money, rollback, idempotency, AI hallucination rejection, ownership/IDOR, and accessible UI states.
