---
storyId: "4.3"
epicId: "4"
title: "Commit an atomic multi-installment payment"
status: ready-for-dev
requirements:
  - FR14
  - FR16
  - FR17
dependencies:
  - "4.2"
---

# Story 4.3: Commit an atomic multi-installment payment

As an authenticated Customer,
I want my selected simulated payments applied together,
So that every amount, penalty, status, and ledger entry is exact and no partial transaction remains.

## Acceptance Criteria

### AC1: The full Payment request is validated in one transaction

**Given** a submitted owned Payment selection
**When** processing begins
**Then** the current authoritative state and quote are revalidated in one `REPEATABLE_READ` transaction
**And** missing, stale, `PAID`, ineligible, unsupported-method, or over-limit Installments reject the whole request

### AC2: Every accepted Installment Payment has an immutable ledger entry

**Given** an accepted Installment Payment
**When** it is persisted
**Then** one PremiumPayment row is created with unique Transaction Reference, Payment Date/time, amount paid, separate penalty amount, method, and timestamps
**And** application APIs expose no update or delete path for that row

### AC3: Partial Payments transition status correctly

**Given** a partial Payment that leaves an obligation unsettled
**When** the transaction applies
**Then** paid amount increases exactly
**And** the Installment becomes `PARTIALLY_PAID`, or remains/becomes `OVERDUE` if its Due Date has passed and the obligation remains unsettled

### AC4: A fully settled Installment becomes paid

**Given** scheduled and applicable penalty obligations are fully settled
**When** the Payment applies
**Then** the Installment becomes `PAID`
**And** an already `PAID` Installment cannot receive another Payment

### AC5: Due-date status and grace-period penalty remain distinct

**Given** an unpaid Installment after its Due Date
**When** status is evaluated
**Then** it is `OVERDUE` immediately
**And** a late penalty remains applicable only after Grace Period End Date

### AC6: Policy aggregate status follows all Installments

**Given** a Payment that changes Installment state
**When** Policy status is aggregated
**Then** the Policy reaches fully paid/completed only when all associated Installments are `PAID`
**And** otherwise its aggregate remains consistent with unsettled obligations

### AC7: Any mutation failure rolls back the whole request

**Given** a failure creating any ledger row, updating any Installment, or updating Policy aggregate state
**When** the transaction fails
**Then** all Payment, Installment, and Policy mutations in the request roll back
**And** injected mid-workflow failure tests verify zero partial ledgers or status/balance updates

### AC8: Retries cannot create a second charge

**Given** a retry with the same accepted Transaction Reference boundary
**When** it is submitted
**Then** unique and idempotent handling returns deterministic conflict or previously accepted semantics without a second Payment record

### AC9: Success returns refreshed financial evidence

**Given** a committed transaction
**When** the API responds
**Then** it returns `201` with unique Transaction Reference(s), per-Installment penalty and amount, and refreshed financial totals
**And** the UI shows success and reloads schedule, balance, and status facts

### AC10: Failure feedback is recoverable

**Given** a handled Payment failure
**When** the response is displayed
**Then** the UI shows a stable recoverable message, prevents duplicate in-flight submission, and produces no unhandled frontend exception

## Requirements Traceability

- Functional: FR14, FR16, FR17
- Non-functional: NFR6, NFR7, NFR8, NFR13, NFR14, NFR16, NFR17, NFR18, NFR19, NFR21, NFR22, NFR23
- UX: UX-DR11, UX-DR12, UX-DR14, UX-DR16, UX-DR17
- Architecture: `REPEATABLE_READ` Payment transaction, immutable PremiumPayment ledger, Transaction Reference idempotency, aggregate status transition

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Integration tests inject failures at each multi-row mutation stage and verify complete rollback.
- Unit and integration tests cover partial, late, full, repeated, and retry Payments.
- The refreshed UI and transaction reference presentation are verified.
- The implementation passes the project's build, lint, and focused test commands.
