---
storyId: "3.2"
epicId: "3"
title: "Calculate the exact policy installment schedule"
status: ready-for-dev
requirements:
  - FR11
dependencies:
  - "2.3"
  - "3.1"
---

# Story 3.2: Calculate the exact policy installment schedule

As an authenticated Customer,
I want my maturity date, total payable, and every installment calculated exactly,
So that I can review a complete schedule before it is committed.

## Acceptance Criteria

### AC1: Maturity Date follows the term contract

**Given** a valid Start Date and Product term
**When** the schedule is calculated
**Then** Maturity Date equals Start Date plus the Product term in calendar months

### AC2: Installment Due Dates follow Premium Frequency

**Given** Premium Frequency `MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, or `YEARLY`
**When** Due Dates are generated
**Then** consecutive Due Dates advance by 1, 3, 6, or 12 months respectively
**And** every Grace Period End Date is exactly one calendar month after its Due Date

### AC3: Evenly divisible schedules reconcile exactly

**Given** a term evenly divisible by the frequency interval
**When** Installments are generated
**Then** regular scheduled amounts and Installment count equal the deterministic Total Premium Payable
**And** the sum of all rows reconciles to that total exactly

### AC4: A final shorter period is prorated

**Given** a term that is not evenly divisible by the frequency interval
**When** the final Installment is generated
**Then** it represents only the remaining months
**And** its amount equals Premium Amount multiplied by remaining months divided by interval months, rounded to two decimals with `RoundingMode.HALF_UP`

### AC5: Financial precision and sequence are invariant

**Given** any generated schedule
**When** the result is validated
**Then** sequence numbers begin at 1 and are consecutive
**And** monetary values use `BigDecimal` with `NUMERIC(19,2)` precision semantics
**And** the full schedule reconciles to Total Premium Payable to the exact cent

### AC6: Calendar boundaries are deterministic

**Given** month-end dates, leap years, and each supported Premium Frequency
**When** the same schedule is calculated
**Then** preview and backend use the same documented calendar-date behavior
**And** tests cover representative boundary dates

### AC7: Calculation failure returns no partial schedule

**Given** a calculation error or invalid Product input
**When** schedule generation runs
**Then** no partial schedule is returned or persisted
**And** the UI receives a recoverable validation or service error

### AC8: The preview is complete before confirmation

**Given** a valid registration preview
**When** the Customer reviews it
**Then** Maturity Date, Total Premium Payable, Installment count, and every planned Installment are displayed
**And** no AI model participates in the calculation

## Requirements Traceability

- Functional: FR11
- Non-functional: NFR6, NFR7, NFR11, NFR18, NFR19
- UX: UX-DR5, UX-DR10, UX-DR14, UX-DR16
- Architecture: `BigDecimal`, `NUMERIC(19,2)`, `HALF_UP`, centralized InstallmentService calendar and proration logic

## Definition of Done

- Backend calculation and preview integration for all acceptance criteria are complete.
- Unit tests cover every Premium Frequency, even and uneven terms, final-period proration, calendar boundaries, and cent reconciliation.
- No AI dependency participates in any authoritative calculation.
- The implementation passes the project's build, lint, and focused test commands.
