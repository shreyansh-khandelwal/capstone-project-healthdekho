# Reconciliation: Functional Requirements to PRD

## Verdict

Clean translation. No critical requirement is missing. Product behavior is represented in the PRD, while stack, schema, transaction, calculation, and AI integration detail is preserved in the addendum.

## Intentionally Deferred Decisions

1. Overdue status timing is not defined by the source and is tracked as PRD Open Question 2.
2. “Partial payments where applicable” does not identify which Installments or Payment Methods permit partial Payment; this is tracked as PRD Open Questions 3 and 4.
3. Duplicate Registration is ambiguous between a lifetime unique constraint and an active-policy-only partial unique constraint; this is tracked as PRD Open Question 1 and in Addendum Section 3.
4. The source does not define the full Policy Status hierarchy; PRD FR-16 defines the required completed state and leaves other aggregate states for architecture resolution.

## Preservation Checks

- Authentication, clear invalid-credential feedback, and protected endpoints are preserved.
- Active Product filtering and backend duplicate enforcement are preserved.
- AI candidate restriction, output validation, hallucination prevention, and audit persistence are preserved and strengthened.
- Registration and multi-Installment Payment atomicity are preserved.
- The 10% penalty rule, two-decimal precision, partial-payment amount ceiling, and immutable ledger are preserved.
- Ownership checks, `record` DTO boundaries, standardized errors, pagination, and PostgreSQL constraints are preserved.
- Exact calculation, transaction, AI contract, and error payload implementation inputs are present in the addendum.

## Gaps Requiring Downstream Resolution

No additional PRD content is required for these gaps. Architecture and API design must resolve the four deferred decisions before implementation readiness is declared.
