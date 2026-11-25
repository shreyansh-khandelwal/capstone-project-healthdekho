---
storyId: "5.2"
epicId: "5"
title: "Paginate owned-policy search results"
status: ready-for-dev
requirements:
  - FR19
dependencies:
  - "5.1"
---

# Story 5.2: Paginate owned-policy search results

As an authenticated Customer,
I want ordered, bounded search results with financial summaries,
So that I can find my Policy without an unbounded query or silent truncation.

## Acceptance Criteria

### AC1: Search results are owned, ordered, and bounded

**Given** valid Search criteria
**When** results are queried
**Then** every result belongs to the authenticated Customer, results use consistent ordering, and page/page-size parameters bound the response

### AC2: Supported page sizes return accurate metadata

**Given** a page-size value of 10, 20, or 50
**When** Search executes
**Then** the API returns the selected page with accurate current page, page size, total elements, and total pages
**And** unsupported or malformed paging values are rejected or constrained explicitly

### AC3: Pagination controls preserve the search

**Given** multiple result pages
**When** I navigate them
**Then** the UI shows "Showing X-Y of Z policies," a 10/20/50 page-size selector, Previous, Next, and disabled boundary controls
**And** active criteria remain applied across page changes

### AC4: Every result row exposes the approved financial contract

**Given** any result row
**When** it renders
**Then** the eleven columns from Story 5.1 are populated from owned Policy and aggregate financial values
**And** money uses exact two-decimal formatting

### AC5: Zero matches produce a useful empty page

**Given** no matching owned Policies
**When** Search completes
**Then** the API returns a successful empty page
**And** the UI displays "No insurance policies matched your search criteria. Check the policy identifier or spelling and try again."

### AC6: Broad searches meet the latency target without hidden truncation

**Given** broad Customer Name criteria on the agreed performance dataset
**When** Search is measured
**Then** indexed, paginated behavior completes in less than 300 ms at p95
**And** no eligible matches are silently omitted outside the reported total

### AC7: Pagination is responsive and accessible

**Given** a mobile viewport or keyboard navigation
**When** I use Search results and pagination
**Then** the table remains horizontally usable, Policy Identifier stays sticky, pagination controls expose their state and current page, and result-count changes are announced

### AC8: Paging and service errors remain recoverable

**Given** a malformed paging request or Search service failure
**When** the error is handled
**Then** the standard error envelope and recoverable UI feedback are used
**And** no unhandled frontend exception occurs

## Requirements Traceability

- Functional: FR19
- Non-functional: NFR3, NFR9, NFR11, NFR16, NFR18, NFR19, NFR24, NFR25, NFR26
- UX: UX-DR2, UX-DR5, UX-DR13, UX-DR14, UX-DR15, UX-DR16, UX-DR17
- Architecture: indexed SearchService query, bounded pagination DTO, responsive result table, aggregate financial DTO

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Tests verify page boundaries, page metadata, criterion retention, exact empty state, responsive controls, and p95 latency.
- Search never silently truncates unreported matches.
- The implementation passes the project's build, lint, and focused test commands.
