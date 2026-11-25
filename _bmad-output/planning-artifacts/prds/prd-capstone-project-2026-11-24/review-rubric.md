# PRD Quality Review - HealthDekho Insurance Management System

## Overall Verdict

The PRD has a clear product thesis, complete capability coverage, testable requirements, and strong downstream usability. Three financial/schema decisions must be resolved before architecture lock: Duplicate Registration lifetime, overdue transition timing, and penalty behavior after partial Payment. Divisible-term handling should also be promoted to an explicit product rule.

## Decision-Readiness - Adequate

- **critical** Duplicate Registration rule (Section 12, Open Question 1) - The choice between lifetime uniqueness and active-policy-only uniqueness drives the customer-policy schema and service behavior. Decide before architecture lock.
- **high** Overdue status timing (Section 12, Open Question 2) - Define whether `OVERDUE` begins after Due Date or after Grace Period End Date.
- **high** Penalty recalculation (Section 12, Open Question 4) - Define whether the 10% penalty is charged once per Installment or recalculated on later partial Payments.
- **high** Payment integration strategy (Section 12, Open Question 5) - The capstone assumption says no live provider, while the question remains open. Confirm simulated or recorded Payment completion and close the question.

## Substance Over Theater - Strong

The named user journeys drive real requirements. The NFRs are specific to money, ownership, AI validation, and transactional integrity. The glossary carries genuine insurance-domain terminology. No material finding.

## Strategic Coherence - Strong

The unifying thesis is consistent: Product selection, Registration, Recommendation, and Payment management form one Customer journey, with deterministic validation and auditability at each financial boundary. Success Metrics and counter-metrics enforce the thesis. No material finding.

## Done-Ness Clarity - Strong

All 19 FRs have measurable consequences. Exact age, maturity, installment, payment, penalty, status, authorization, and pagination behaviors are testable.

- **medium** Resolve penalty recalculation to make every partial-payment test unambiguous.
- **low** Specify that a failed AI call leaves the deterministic Product catalog available with a clear Recommendation failure state.

## Scope Honesty - Adequate

Non-goals, MVP scope, and the assumptions roundtrip are explicit. The main unresolved product decisions are surfaced, but one additional constraint should be promoted.

- **high** Term divisibility (Addendum Section 4) - Decide whether a term not divisible by Premium Frequency is rejected or represented with a final partial period.
- **medium** Consider making the AI-provider fallback and incomplete-profile behavior explicit assumptions if they affect demo scope.

## Downstream Usability - Strong

Glossary terms, contiguous IDs, user journeys, feature groups, and addendum boundaries support UX, architecture, and story extraction.

- **medium** Replace or consistently use `Calculable Balance`; requirements currently use `outstanding amount` more often.
- **medium** Define the Suitability enum or controlled scale before backend/API contract work.
- **medium** Define or link the capstone test dataset that supports the 300 ms p95 threshold.

## Shape Fit - Strong

The detail is appropriate for a capstone PRD feeding UX, architecture, testing, and story planning. The document is neither over-formalized nor dependent on unsupported market or persona claims.

## Mechanical Notes

- FR-1 through FR-19 are contiguous.
- UJ-1 through UJ-5 are contiguous and use named protagonists.
- SM-1 through SM-10 and SM-C1 through SM-C3 are contiguous.
- All two indexed inline assumptions round-trip correctly.
- Open Questions are numbered 1 through 2.
- Policy Identifier terminology is consistent.

## Review Resolution

- Resolved: active-only Duplicate Registration with re-registration after the prior Policy becomes inactive.
- Resolved: `OVERDUE` begins immediately after Due Date; penalty applicability remains controlled by Grace Period End Date.
- Resolved: every late partial Payment recalculates 10% on the current Outstanding Amount.
- Resolved: Payment completion is simulated and no live provider is called.
- Resolved: an uneven term creates a final Installment prorated by remaining months.
- Resolved: all unpaid Installments and supported Payment Methods allow partial Payment within the amount ceiling.
- Resolved: Suitability is `HIGH`, `MEDIUM`, or `LOW`.
- Resolved: AI failure displays a clear state while the eligible Product catalog remains available.
- Resolved: the balance glossary term now matches requirement language as Outstanding Amount.
- Deferred with owners: Architecture selects the Spring AI provider/model before AI integration configuration; QA and Architecture name the latency test dataset before performance validation.
- Deferred without blocking planning: incomplete-profile fallback behavior can be specified in UX/API design.
