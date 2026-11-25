---
storyId: "5.1"
epicId: "5"
title: "Validate owned-policy search criteria and return its table contract"
status: ready-for-dev
requirements:
  - FR18
  - FR19
dependencies:
  - "1.1"
  - "3.3"
  - "4.3"
---

# Story 5.1: Validate owned-policy search criteria and return its table contract

As an authenticated Customer,
I want the system to accept only the supported Policy search combinations,
So that I get a clear financial result table without leaking or broadly enumerating another Customer's policies.

## Acceptance Criteria

### AC1: Only supported combinations are accepted

**Given** Policy Identifier only, Customer Name only, or Policy Identifier plus Date of Birth
**When** Search is submitted
**Then** the combination is accepted

**Given** empty or any other combination
**When** Search is submitted
**Then** the API returns `400` with guidance describing the accepted combinations

### AC2: Date of Birth alone is rejected

**Given** only Date of Birth is supplied
**When** Search is validated
**Then** the request is rejected
**And** the UI explains that Date of Birth must be paired with Policy Identifier

### AC3: Customer Name searches remain ownership-scoped

**Given** Customer Name as the only criterion
**When** Search executes
**Then** matching is limited to Policies owned by the authenticated Customer

### AC4: Policy Identifier and DOB are applied together

**Given** Policy Identifier plus Date of Birth
**When** Search executes
**Then** both criteria apply to the owned-Policy query
**And** no client-supplied Customer identity overrides authentication

### AC5: Search does not reveal another Customer's object

**Given** another Customer's matching Policy
**When** Search evaluates the supplied criteria
**Then** that Policy is not returned and no useful object-existence information is disclosed

### AC6: Results use the exact table contract

**Given** a valid Search result
**When** the table renders
**Then** columns appear in this order: Policy Identifier, Customer Name, Date of Birth, Policy Name, Policy Type, Policy Start Date, Policy Maturity Date, Total Premium Payable, Premium Payment Status, Total Premium Paid, and Remaining Premium

### AC7: Invalid UI criteria have accessible guidance

**Given** invalid or empty Search criteria
**When** the Search button is used
**Then** the UI displays "Enter a Policy Identifier, Customer Name, or Policy Identifier with Date of Birth to search."
**And** associated controls expose labeled validation feedback and the invalid form does not call the API unnecessarily

### AC8: Reset and valid submission states are explicit

**Given** Reset Filters
**When** it is activated
**Then** all criteria and current results clear consistently

**Given** valid Search submission
**When** it is in flight
**Then** the control displays loading and is disabled to prevent duplicate requests

## Requirements Traceability

- Functional: FR18, result-table portion of FR19
- Non-functional: NFR1, NFR2, NFR3, NFR4, NFR11, NFR16, NFR17, NFR18, NFR19, NFR24, NFR25, NFR26
- UX: UX-DR4, UX-DR5, UX-DR13, UX-DR14, UX-DR15, UX-DR16, UX-DR17
- Architecture: SearchService criterion validation, authenticated ownership predicate, DTO field contract, stable error envelope

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Tests cover all accepted and rejected criterion combinations plus cross-Customer matching.
- UI tests verify the exact eleven result columns and their order.
- Reset, loading, and accessibility behavior are verified.
- The implementation passes the project's build, lint, and focused test commands.
