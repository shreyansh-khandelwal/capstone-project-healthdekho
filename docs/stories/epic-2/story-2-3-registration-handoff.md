---
storyId: "2.3"
epicId: "2"
title: "Open pre-populated Registration from a recommendation"
status: ready-for-dev
requirements:
  - FR8
  - FR9
dependencies:
  - "2.2"
---

# Story 2.3: Open pre-populated Registration from a recommendation

As an authenticated Customer,
I want Register from a recommendation to open a pre-populated registration form,
So that I can verify trusted Customer and Product details before confirming the Policy.

## Acceptance Criteria

### AC1: Register navigates through a revalidated Product selection

**Given** a valid Recommendation
**When** I choose Register
**Then** the backend revalidates the Product as active, eligible, and not already held
**And** the frontend opens `/policies/register/:productCode` without duplicate navigation

### AC2: Trusted Customer details are read-only

**Given** the Registration form from a selected Product
**When** it loads
**Then** Customer Name, Date of Birth, and Contact Information are populated as read-only values from the authenticated Customer profile

### AC3: Trusted Product details are read-only

**Given** the selected Product
**When** the Registration form loads
**Then** Policy Type, Policy Name, Policy Term, Premium Payment Frequency, Premium Amount, and Sum Insured are populated as read-only values resolved from the Product in the database
**And** trusted terms are not accepted from the recommendation payload

### AC4: Start Date and Maturity Date follow the date contract

**Given** the Registration form opens
**When** no Start Date has been selected
**Then** Policy Start Date defaults to the current date
**And** Policy Maturity Date is read-only and calculated from Start Date plus Policy Term

### AC5: The financial preview uses the approved calculation contract

**Given** a valid Start Date and trusted Product premium data
**When** the preview is calculated
**Then** Total Premium Payable is read-only, is calculated by the shared deterministic logic implemented in this story, and is displayed with exactly two decimal places

### AC6: Date edits refresh previews without persisting a Policy

**Given** I change Policy Start Date
**When** the date is valid
**Then** maturity and total-payable previews refresh as required
**And** no Policy or Installment rows are created

### AC7: Stale recommendation selection fails safely

**Given** a recommended Product becomes inactive, duplicate, or ineligible
**When** Register is selected
**Then** the server returns the applicable validation or `409` conflict response
**And** the UI displays actionable feedback instead of opening a misleading Registration form

### AC8: Registration preview follows the responsive and accessibility contract

**Given** a desktop or mobile viewport and keyboard navigation
**When** I review the Registration preview
**Then** the desktop 7/5 form-summary split stacks on mobile, mandatory and read-only fields have explicit labels, financial totals use `aria-live`, focus remains visible, and the AI-assistance disclaimer is visible

### AC9: Transaction persistence remains in Epic 3

**Given** this story is complete
**When** the Customer reviews the form
**Then** no final submission, unique Policy number generation, duplicate database mutation, Policy persistence, or Installment persistence occurs
**And** those atomic transaction concerns remain owned by Epic 3

## Requirements Traceability

- Functional: FR8, FR9, pre-submit preview scope of FR11
- Non-functional: NFR1, NFR2, NFR3, NFR4, NFR6, NFR7, NFR11, NFR16, NFR17, NFR18, NFR19, NFR20, NFR24, NFR25, NFR26
- UX: UX-DR2, UX-DR4, UX-DR5, UX-DR6, UX-DR9, UX-DR10, UX-DR14, UX-DR16, UX-DR17
- Architecture: Product revalidation, authenticated profile DTO, database-resolved Product DTO, React registration preview, responsive financial summary

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Tests verify read-only field sources, Product revalidation, default dates, preview calculations, stale results, and responsive accessibility.
- No Policy or Installment is persisted by the preview flow.
- The implementation passes the project's build, lint, and focused test commands.
