---
storyId: "1.2"
epicId: "1"
title: "View my personalized policy overview"
status: done
baseline_commit: "NO_VCS"
requirements:
  - FR2
dependencies:
  - "1.1"
---

# Story 1.2: View my personalized policy overview

As an authenticated Customer,
I want to view my registered Policies on the Dashboard,
So that I understand my coverage, schedule, cost, and status in one place.

## Acceptance Criteria

### AC1: The Dashboard is scoped to the authenticated Customer

**Given** I am authenticated
**When** I open `/dashboard`
**Then** the backend resolves my Customer from the security context and returns only my Policies through immutable record DTOs

### AC2: Owned Policies expose complete portfolio facts

**Given** owned Policies exist
**When** the Dashboard loads
**Then** an ordered, paginated table shows Policy Identifier, Product Name, Policy Type, Term, Start Date, Maturity Date, Premium Frequency, Premium Amount, Sum Insured, and Policy Status

### AC3: Customers without Policies receive a purposeful empty state

**Given** I have no registered Policies
**When** the Dashboard loads
**Then** a purposeful illustrated or text empty state explains the absence and directs me to Product discovery instead of displaying a blank table

### AC4: Cross-Customer Policy data remains private

**Given** another Customer's Policy identifier
**When** I request that Policy through a protected Policy endpoint
**Then** the API returns `401` or `403` as applicable and exposes no Policy data or useful object-existence disclosure

### AC5: Async Dashboard states are explicit and recoverable

**Given** a Dashboard request that is pending, fails, or returns data
**When** each state occurs
**Then** the UI displays a skeleton, clear recoverable feedback, or the result table respectively
**And** no handled error causes an unhandled frontend exception
**And** the endpoint responds in less than 300 ms at p95 on the agreed test dataset

### AC6: The table is responsive and accessible

**Given** a desktop or mobile viewport and keyboard-only navigation
**When** I use the Dashboard table
**Then** the table has semantic headers, retains a sticky Policy Identifier column when horizontally scrolling, provides visible focus, and communicates statuses with text or icons in addition to color

### AC7: Financial values use the shared display contract

**Given** Premium Amount and Sum Insured values
**When** they are rendered
**Then** values use consistent two-decimal currency formatting, tabular numerals, and accessible reading order

## Requirements Traceability

- Functional: FR2
- Non-functional: NFR1, NFR2, NFR3, NFR9, NFR11, NFR16, NFR18, NFR19, NFR22, NFR24, NFR25, NFR26
- UX: UX-DR1, UX-DR2, UX-DR3, UX-DR5, UX-DR8, UX-DR14, UX-DR15, UX-DR16, UX-DR17
- Architecture: owned-Policy query, indexed Customer Policy access, pagination, DTO boundary, responsive table, loading/error/empty states

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Ownership denial and no-Policy states are covered by tests.
- Loading, error, and responsive accessibility states are verified.
- The Dashboard query meets the agreed p95 latency target in the performance test environment.
- The implementation passes the project's build, lint, and focused test commands.
