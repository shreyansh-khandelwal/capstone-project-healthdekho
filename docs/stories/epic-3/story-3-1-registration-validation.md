---
storyId: "3.1"
epicId: "3"
title: "Validate a policy registration request"
status: ready-for-dev
requirements:
  - FR10
dependencies:
  - "2.3"
---

# Story 3.1: Validate a policy registration request

As an authenticated Customer,
I want invalid or ineligible registration requests rejected deterministically,
So that only valid Policies can reach calculation or persistence.

## Acceptance Criteria

### AC1: Registration inputs use trusted server-owned values

**Given** a Registration request
**When** it is received
**Then** Customer identity is resolved from authentication and the Product is loaded from PostgreSQL
**And** client-supplied Customer identity or editable trusted Product terms are not accepted

### AC2: Mandatory and constrained fields have deterministic feedback

**Given** invalid mandatory or range-constrained fields
**When** server validation runs
**Then** the API returns `400` with the standard envelope and fieldErrors that identify each invalid field
**And** no Policy or Installment rows are created

### AC3: Customer Date of Birth and age are valid

**Given** a missing or future Date of Birth
**When** Registration is validated
**Then** the request is rejected with `400`
**And** no persistence occurs

**Given** a calculated age outside the Product's minimum or maximum entry age
**When** Registration is validated
**Then** the request is rejected with an explicit age-bound message that the UI can display

### AC4: Dates are logically consistent

**Given** Start Date and derived Maturity Date values
**When** Registration is validated
**Then** Maturity Date is strictly after Start Date
**And** inconsistent values return `400`

### AC5: Domain values are positive

**Given** a non-positive Policy Term, Premium Amount, or Sum Insured
**When** validation runs server-side
**Then** the request is rejected even if client validation was bypassed

### AC6: Duplicate active registration returns conflict

**Given** the Customer already has an active Policy for the selected Product
**When** Registration is submitted
**Then** the backend returns `409 Conflict`
**And** the UI can link or direct the Customer to their existing Policy without exposing another Customer's data

### AC7: Concurrency cannot create active duplicates

**Given** concurrent duplicate Registration requests for the same Customer and Product
**When** they are processed
**Then** service validation and the partial database unique constraint permit at most one accepted active Policy
**And** the other request receives a deterministic conflict

### AC8: UI validation maps to backend field errors

**Given** client or server validation feedback
**When** the errors are displayed
**Then** all required fields have associated labels and matching field-level messages
**And** no handled validation response causes an unhandled frontend exception

## Requirements Traceability

- Functional: FR10
- Non-functional: NFR1, NFR2, NFR3, NFR4, NFR5, NFR11, NFR16, NFR17, NFR18, NFR19, NFR22, NFR23, NFR24, NFR25, NFR26
- UX: UX-DR6, UX-DR10, UX-DR14, UX-DR16, UX-DR17
- Architecture: Bean Validation, deterministic age/date/domain validators, active-policy partial unique index, centralized conflict/error handling

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Tests cover future DOB, entry-age boundaries, invalid dates/values, duplicate conflict, stale requests, and concurrent duplication.
- No invalid request creates persistence rows.
- The implementation passes the project's build, lint, and focused test commands.
