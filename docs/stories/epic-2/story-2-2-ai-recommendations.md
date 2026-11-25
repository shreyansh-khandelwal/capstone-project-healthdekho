---
storyId: "2.2"
epicId: "2"
title: "Generate auditable eligible AI recommendations"
status: ready-for-dev
requirements:
  - FR4
  - FR5
  - FR6
  - FR7
dependencies:
  - "1.1"
  - "2.1"
---

# Story 2.2: Generate auditable eligible AI recommendations

As an authenticated Customer,
I want to request explainable Product recommendations from my preferences,
So that I can compare relevant eligible Products without giving AI authority over business or financial rules.

## Acceptance Criteria

### AC1: Supported recommendation inputs are validated and audited

**Given** one or more optional Date of Birth, insurance goals, preferred term, and policy type inputs
**When** I request recommendations
**Then** the backend derives age deterministically, validates dates, and persists request provenance including model, version, prompt version, timestamp, Customer, and supplied preferences

### AC2: AI receives only the deterministic eligible candidate set

**Given** the authenticated Customer and current PostgreSQL catalog
**When** the AI request is constructed
**Then** it contains only active, eligible Products that the Customer does not already own
**And** Products removed as ineligible, inactive, or duplicate never enter the prompt candidate set

### AC3: Every AI result is validated before exposure

**Given** AI output
**When** the backend validates it
**Then** unknown, inactive, ineligible, or duplicate Product identifiers are excluded, no hallucinated display metadata is returned, and recommendation count cannot exceed the eligible candidate count

### AC4: Valid ranked results retain request-to-item provenance

**Given** validated Recommendation results
**When** they are persisted
**Then** each item references its Recommendation Request and Product and stores rank, reason, and `HIGH`, `MEDIUM`, or `LOW` suitability
**And** the database does not allow the same Product twice within one request

### AC5: Recommendation results use the exact table contract

**Given** Recommendation results in the UI
**When** the result table renders
**Then** its columns appear in this order: Product Code, Policy Name, Policy Type, Policy Term, Sum Insured, Premium Frequency, Premium Amount, Recommendation Reason, Suitability, and Action
**And** every Action cell contains a Register button

### AC6: Recommendation rationale is explainable but not guaranteed

**Given** a Recommendation reason
**When** I inspect it
**Then** the rationale is available as accessible expandable tooltip or text
**And** the UI labels it as AI-generated explainable assistance rather than a guarantee of suitability

### AC7: AI failure preserves a usable recovery path

**Given** an AI timeout, provider failure, invalid model output, or missing credentials
**When** the request fails or becomes invalid
**Then** failure provenance is retained safely
**And** the UI shows a clear recoverable state while the deterministic eligible Product catalog remains available

### AC8: Recommendation latency and in-flight behavior are controlled

**Given** an AI Recommendation request
**When** it is pending
**Then** loading feedback appears immediately and duplicate submission is prevented
**And** the request completes or transitions to timeout recovery within 5 seconds in the demo environment

### AC9: The Advisor panel follows the interaction contract

**Given** the AI Advisor panel
**When** it is displayed and used
**Then** Date of Birth, goals, preferred term, and policy type controls have explicit labels, optional-state guidance, validation feedback, skeleton loading, result status pills, and accessible live feedback

## Requirements Traceability

- Functional: FR4, FR5, FR6, FR7
- Non-functional: NFR9, NFR10, NFR11, NFR15, NFR18, NFR19, NFR20, NFR21, NFR22, NFR24, NFR25, NFR26
- UX: UX-DR5, UX-DR6, UX-DR9, UX-DR14, UX-DR16, UX-DR17
- Architecture: Spring AI abstraction, PostgreSQL candidate construction, hallucination rejection, Recommendation request/item persistence, external model configuration, recoverable Product fallback

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Unit and integration tests cover eligibility construction, invalid and hallucinated output, duplicate output, audit persistence, and fallback behavior.
- UI tests verify exact table columns and column order, rationale accessibility, loading, and timeout recovery.
- Credentials and model settings are externalized.
- The implementation passes the project's build, lint, and focused test commands.
