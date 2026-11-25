---
storyId: "2.1"
epicId: "2"
title: "Browse eligible available insurance Products"
status: ready-for-dev
requirements:
  - FR3
dependencies:
  - "1.1"
---

# Story 2.1: Browse eligible available insurance Products

As an authenticated Customer,
I want to browse active insurance Products I can register,
So that I can choose coverage without seeing products I already hold or cannot register.

## Acceptance Criteria

### AC1: Discovery is active, eligible, and duplicate-safe

**Given** authenticated Customer profile data
**When** Products are requested
**Then** the API returns only active PostgreSQL Products that pass deterministic eligibility
**And** Products with an active Policy for this Customer are excluded

### AC2: Product results are bounded and complete

**Given** a Product listing request
**When** the results are returned
**Then** they are ordered and paginated through immutable DTOs
**And** each result includes Product Code, Product Name, Policy Type, term, Sum Insured, Premium Frequency, Premium Amount, and a Register action

### AC3: Product selection continues safely into Registration

**Given** a Product row
**When** Register is chosen
**Then** the Product identifier is carried into the Registration route
**And** the client cannot alter trusted Product terms or bypass server-side eligibility

### AC4: No eligible Products produces an informative state

**Given** no eligible available Products
**When** discovery completes
**Then** the UI displays a specific empty state while preserving the rest of the authenticated Dashboard

### AC5: Async Product discovery states are explicit

**Given** a pending, failed, or successful discovery request
**When** each state occurs
**Then** the UI shows a skeleton, recoverable error feedback, or the Product result table respectively
**And** in-flight work does not permit duplicate requests

### AC6: Product discovery follows the responsive UX contract

**Given** a desktop or mobile viewport and keyboard navigation
**When** I inspect and interact with the Product table
**Then** semantic headers, visible focus, a sticky Product Code column when scrolling, consistent currency formatting, and non-color state semantics are present

### AC7: Stale client state cannot bypass validation

**Given** a Product becomes inactive or is registered through another request
**When** its previously displayed Register action is used
**Then** the server revalidates current eligibility and rejects the stale selection

## Requirements Traceability

- Functional: FR3
- Non-functional: NFR1, NFR2, NFR3, NFR4, NFR9, NFR11, NFR18, NFR19, NFR22, NFR23, NFR24, NFR25, NFR26
- UX: UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR8, UX-DR14, UX-DR15, UX-DR16, UX-DR17
- Architecture: authenticated Product endpoint, active/duplicate filtering, Product indexes, pagination, DTO boundary, responsive Product table

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Active, age/rule eligibility, duplicate-filtering, stale state, and empty-result cases are covered.
- Responsive, loading, and failure states are verified.
- The implementation passes the project's build, lint, and focused test commands.
