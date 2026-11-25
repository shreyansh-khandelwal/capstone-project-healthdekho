---
storyId: "4.2"
epicId: "4"
title: "Prepare an exact multi-installment payment quote"
status: ready-for-dev
requirements:
  - FR14
  - FR15
dependencies:
  - "4.1"
---

# Story 4.2: Prepare an exact multi-installment payment quote

As an authenticated Customer,
I want to select unpaid installments and see the exact amount, penalty, and method before payment,
So that I can make a full or partial payment without exceeding what is due.

## Acceptance Criteria

### AC1: Only owned unpaid Installments can be quoted

**Given** selected `PENDING`, `PARTIALLY_PAID`, or `OVERDUE` Installments
**When** the server creates a Payment quote
**Then** each Installment is owned by the authenticated Customer and remains eligible
**And** `PAID`, missing, or another Customer's Installment identifiers are rejected

### AC2: Payments by the grace-period deadline have no late penalty

**Given** a Payment Date on or before an Installment's Grace Period End Date
**When** the quote is calculated
**Then** its applicable late penalty is zero

### AC3: Late Payments apply the current-balance penalty

**Given** a Payment Date after Grace Period End Date
**When** the quote is calculated
**Then** the applicable penalty is 10% of that Installment's current Outstanding Amount
**And** a later partial Payment recalculates the 10% from the then-current balance with two-decimal `HALF_UP` precision and stores the penalty as a separate quote value

### AC4: Submitted amounts remain within the authoritative ceiling

**Given** a full or partial amount entered for an Installment
**When** it is validated
**Then** it is greater than zero and no greater than Outstanding Amount plus applicable penalty
**And** the server independently enforces the ceiling and returns field-level errors for invalid values

### AC5: Only supported simulated Payment Methods are available

**Given** the Payment Method selector
**When** a method is chosen
**Then** it is limited to configured MVP values `CARD`, `UPI`, `NET_BANKING`, or `CASH_OFFLINE`
**And** the UI clearly identifies the operation as simulated

### AC6: The selected-payment action bar shows an exact quote

**Given** one or more selected Installments
**When** the quote UI renders
**Then** a sticky action card lists selected Installment numbers, defaults the amount to the authoritative maximum, permits a lower partial amount, and accessibly updates selected, maximum, and penalty totals

### AC7: Stale quotes are refreshed rather than silently submitted

**Given** a changed status or balance after quote creation
**When** the client attempts to proceed
**Then** the authoritative quote is recalculated or the request is rejected with refresh guidance
**And** a stale amount is never silently accepted

### AC8: Quoting does not mutate financial records

**Given** this story's quote and validation endpoint
**When** a Customer reviews a quote
**Then** no PremiumPayment, Installment balance/status, or Policy aggregate is changed
**And** mutation remains owned by Story 4.3

## Requirements Traceability

- Functional: FR14, FR15
- Non-functional: NFR1, NFR3, NFR4, NFR6, NFR7, NFR8, NFR11, NFR16, NFR17, NFR18, NFR19, NFR24, NFR25, NFR26
- UX: UX-DR5, UX-DR6, UX-DR11, UX-DR12, UX-DR14, UX-DR16, UX-DR17
- Architecture: Payment quote validation, BigDecimal penalty calculation, stale-balance guard, immutable DTO response, simulated method configuration

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Unit tests cover on/before grace period, repeated late partial Payments, invalid amounts, unsupported methods, and stale selection.
- No quote operation mutates financial records.
- The responsive accessible quote and action bar are verified.
- The implementation passes the project's build, lint, and focused test commands.
