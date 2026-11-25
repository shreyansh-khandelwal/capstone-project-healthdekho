---
storyId: "3.3"
epicId: "3"
title: "Commit registration and its installment schedule atomically"
status: ready-for-dev
requirements:
  - FR12
dependencies:
  - "3.1"
  - "3.2"
---

# Story 3.3: Commit registration and its installment schedule atomically

As an authenticated Customer,
I want to confirm a validated registration in one reliable action,
So that I receive a unique Policy and complete schedule without orphaned or partial records.

## Acceptance Criteria

### AC1: A valid request creates one uniquely identified Policy

**Given** valid Customer, Product, validation, and calculation results
**When** Confirm Registration is submitted
**Then** the backend generates one unique Policy Identifier and creates one Customer Policy inside a `REPEATABLE_READ` transaction

### AC2: The full Installment schedule commits with the Policy

**Given** the created Policy
**When** the transaction persists its schedule
**Then** every Installment is inserted with consecutive sequence numbers, calculated amount and dates, one-month grace period, and the correct initial `PENDING` state before commit

### AC3: Any failure rolls back the entire Registration

**Given** a failure during any Policy or Installment insert or update
**When** the Registration transaction fails
**Then** every row and partial total from that request is rolled back
**And** an injected mid-workflow failure test verifies that no Policy or Installment rows remain

### AC4: Concurrent requests cannot create active duplicates

**Given** concurrent duplicate Registration attempts for the same Customer and Product
**When** both are processed
**Then** service and partial database uniqueness permit at most one active Policy
**And** the losing request receives `409 Conflict`

### AC5: Success returns authoritative persisted values

**Given** the transaction commits
**When** the API responds
**Then** it returns `201` with Policy Identifier, Maturity Date, Total Premium Payable, Installment count/schedule, and confirmation message
**And** those values are sourced from persisted authoritative rows

### AC6: The confirmation view exposes useful next actions

**Given** a successful Registration response
**When** the UI renders success
**Then** the form is replaced by a confirmation card showing Policy Identifier, Maturity Date, Installment count, Pay First Installment, and Return to Dashboard actions

### AC7: Service and database failures support safe retry

**Given** a database or unexpected service failure
**When** registration does not complete
**Then** the API uses the standard error mapping and the UI displays recoverable feedback
**And** the user can retry safely, duplicate in-flight submission is blocked, and no unhandled frontend exception occurs

### AC8: Persisted totals and audit fields remain consistent

**Given** a committed Policy
**When** its stored totals are inspected
**Then** Total Premium Payable equals the sum of its Installments to the exact cent
**And** required timestamps and referential constraints are present

## Requirements Traceability

- Functional: FR12
- Non-functional: NFR6, NFR7, NFR8, NFR12, NFR14, NFR16, NFR17, NFR18, NFR19, NFR22, NFR23
- UX: UX-DR10, UX-DR14, UX-DR16, UX-DR17
- Architecture: Spring transaction isolation, PostgreSQL constraints, Policy/Installment persistence, rollback test, confirmation response

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Integration tests verify complete success and rollback after injected mid-transaction failures.
- Concurrency tests verify active duplicate prevention.
- The success UI and safe retry path are tested.
- The implementation passes the project's build, lint, and focused test commands.
