---
storyId: "4.1"
epicId: "4"
title: "Review an owned policy payment schedule"
status: ready-for-dev
requirements:
  - FR13
dependencies:
  - "1.1"
  - "3.3"
---

# Story 4.1: Review an owned policy payment schedule

As an authenticated Customer,
I want to retrieve one owned Policy and its Installment schedule,
So that I can understand totals, balances, eligibility, and which installments I may pay.

## Acceptance Criteria

### AC1: Owned Policy data is complete and safe

**Given** a Policy Identifier belonging to me
**When** I fetch its payment schedule
**Then** the backend returns an immutable DTO containing Policy Identifier, Customer Name, Product Name, term, Start Date, Maturity Date, Total Premium Payable, total paid, remaining amount, and ordered Installments

### AC2: Other Customers' schedules are private

**Given** another Customer's Policy Identifier
**When** I request its schedule
**Then** the API returns `401` or `403` as applicable
**And** it exposes no Policy or Installment data

### AC3: Every Installment exposes payment-readiness facts

**Given** an Installment in the response
**When** it is rendered
**Then** the UI shows its sequence, Premium Amount, Due Date, Grace Period End Date, Payment Status, outstanding plus applicable penalty summary, and whether it is selectable

### AC4: Selection eligibility matches authoritative status

**Given** an Installment with `PENDING`, `PARTIALLY_PAID`, or `OVERDUE` status
**When** I interact with its selection control
**Then** the control is enabled and the row may be submitted

**Given** a `PAID` Installment
**When** I inspect its selection control
**Then** it is disabled and the row cannot be submitted

### AC5: The payment view follows the UX contract

**Given** the Payments route
**When** I open it
**Then** it provides Policy Identifier lookup, four-metric financial summary, ordered Installment table, and optional auto-load from a `policyNumber` query parameter

### AC6: Async and exceptional schedule states are explicit

**Given** pending, not-found, forbidden, empty-schedule, or success responses
**When** each occurs
**Then** the UI presents an accessible skeleton, stable error, informative state, or complete schedule respectively
**And** no handled response causes an unhandled frontend exception

### AC7: The schedule is responsive and accessible

**Given** a desktop or mobile viewport and keyboard navigation
**When** I review the schedule
**Then** the table uses semantic headers, sticky identifying columns where needed, labeled checkbox controls, visible focus, status text or icons in addition to color, and two-decimal currency formatting

### AC8: Schedule retrieval meets the latency target

**Given** the agreed performance dataset
**When** the owned schedule endpoint is measured
**Then** it uses indexed and ordered queries and responds in less than 300 ms at p95

## Requirements Traceability

- Functional: FR13
- Non-functional: NFR1, NFR2, NFR3, NFR9, NFR11, NFR16, NFR18, NFR19, NFR24, NFR25, NFR26
- UX: UX-DR4, UX-DR5, UX-DR11, UX-DR12, UX-DR14, UX-DR15, UX-DR16, UX-DR17
- Architecture: owned schedule endpoint, indexed Installment query, immutable DTO, accessible responsive Payment table

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Tests cover owned and cross-Customer access, all Payment Statuses, query parameter auto-load, and async states.
- Responsive accessibility and p95 latency are verified.
- The implementation passes the project's build, lint, and focused test commands.
