---
storyId: "1.1"
epicId: "1"
title: "Sign in to a protected customer session"
status: done
baseline_commit: "NO_VCS"
context:
  - "docs/architecture.md"
requirements:
  - FR1
---

# Story 1.1: Sign in to a protected customer session

As an existing Customer,
I want to sign in with my email and password,
So that I can access my private HealthDekho policy workspace.

## Acceptance Criteria

### AC1: Valid credentials establish a protected session

**Given** a valid seeded Customer
**When** I submit valid credentials
**Then** the system establishes an authenticated JWT or session, returns a safe Customer profile DTO, and redirects me to `/dashboard`
**And** the password is never returned or logged and the stored value is a strong one-way hash

### AC2: Invalid credentials fail safely

**Given** an invalid email or password
**When** I submit the Login form
**Then** the API returns `401` with the standard error envelope, the UI shows one generic "Invalid email or password" message, and no session is created

### AC3: Protected resources reject missing or expired sessions

**Given** a missing, invalid, or expired credential
**When** I request a protected route or API
**Then** the frontend returns me to `/login` and the API returns `401` without exposing protected data

### AC4: Login feedback and controls follow the UX contract

**Given** the Login form
**When** it is displayed or submitted
**Then** email and password have explicit labels, password visibility can be toggled, required and email validation runs, and the submit control shows a spinner and is disabled while the request is in flight

### AC5: Handled errors remain accessible and stable

**Given** a login error or success state
**When** the API response is handled
**Then** feedback is accessibly announced, remains understandable without color alone, and no handled response causes an unhandled frontend exception

### AC6: Protected navigation and logout use the authenticated Customer

**Given** valid authentication state
**When** I navigate the application
**Then** Dashboard, Payment, and Policy Search surfaces are protected by the authenticated Customer resolved by the server
**And** Logout clears the active session

## Requirements Traceability

- Functional: FR1
- Non-functional: NFR1, NFR2, NFR3, NFR4, NFR5, NFR11, NFR16, NFR17, NFR18, NFR19, NFR24, NFR25, NFR26
- UX: UX-DR3, UX-DR4, UX-DR7, UX-DR14, UX-DR16, UX-DR17
- Architecture: Spring Security authentication, safe record DTOs, centralized error envelope, environment-externalized session/JWT secrets, protected frontend routing

## Review Triage Log

| # | Layer | Verdict | Evidence | Route |
|---|---|---|---|---|
| 1 | blind-hunter | false | `HealthdekhoApplication.java` exists; the no-VCS full-tree addition obscured pre-existing files. | reject |
| 2 | blind-hunter | false | `healthdekho-ui/index.html` exists and was not introduced by this change. | reject |
| 3 | blind-hunter | false | The UI root `tsconfig.json` exists and the focused build passed. | reject |
| 4 | blind-hunter | false | `eslint.config.js` exists and the focused lint command passed. | reject |
| 5 | blind-hunter | false | The raw property name is `spring.datasource.password`; tool output masked its value, not its key. | reject |
| 6 | blind-hunter | high | Manual authentication saved an existing session identifier without rotation. Login now rotates it and has a regression test. | patch |
| 7 | blind-hunter | high | The security context was persisted before profile resolution, allowing a partial authenticated session on lookup failure. Profile resolution now precedes persistence. | patch |
| 8 | blind-hunter | medium | The session cookie was not production-secured. It is now environment-controlled and secure in the production profile. | patch |
| 9 | blind-hunter | high | Post-login 401 responses did not clear authenticated UI state. An API response handler and route-level session refresh now clear or revalidate state. | patch |
| 10 | blind-hunter | false | Payment and Policy Search navigation are already gated by `ProtectedRoute`, whose authenticated state is resolved by `/auth/me`. | reject |
| 11 | blind-hunter | medium | Unbounded passwords can increase BCrypt work and exceed its effective input length. Server and client limits are now enforced. | patch |
| 12 | blind-hunter | medium | Malformed JSON and `ResponseStatusException` bypassed the standard envelope. Explicit handlers now normalize them. | patch |
| 13 | edge-case-hunter | medium | Case-insensitive lookup with case-sensitive uniqueness can admit duplicate identities and produce ambiguous lookup failures. Emails are normalized before persistence and the database email remains unique. | patch |
| 14 | edge-case-hunter | high | Existing anonymous sessions were not rotated at authentication. Fixed with `changeSessionId()` and coverage. | patch |
| 15 | edge-case-hunter | high | A profile lookup failure could follow successful authentication with persisted context. Ordering is corrected. | patch |
| 16 | edge-case-hunter | false | The login page cannot submit while bootstrap is active because it is withheld until `isLoading` becomes false. | reject |
| 17 | edge-case-hunter | high | Expired sessions could retain client-side protected navigation. Route transitions now revalidate the server session. | patch |
| 18 | edge-case-hunter | medium | A failed initial CSRF bootstrap prevented later login attempts from obtaining a token. Login now explicitly refreshes the token before each submission. | patch |
| 19 | edge-case-hunter | medium | Cross-origin API configuration required explicit CSRF-header support and matching CORS policy. Axios and Spring Security are now configured for both. | patch |
| 20 | verification-gap | high | E2E tests mocked every auth endpoint and could not detect cookie or CSRF integration failures. Playwright now starts the real Spring backend and Vite. | patch |
| 21 | verification-gap | high | Unit tests replaced migrated data and did not prove the seeded BCrypt account worked. Real-backend E2E now authenticates the Flyway-seeded customer. | patch |
| 22 | verification-gap | medium | No test observed the in-flight disabled/spinner state. A deferred-login unit test now asserts it. | patch |
| 23 | verification-gap | medium | Email-format and password-required validation branches lacked assertions. A focused unit test now covers both. | patch |
| 24 | verification-gap-other | high | `ProtectedRoute` trusted initial in-memory state indefinitely. It now performs server-backed session checks on route changes. | patch |
| 25 | verification-gap-other | false | Raw inspection confirmed the datasource password property is correctly named; the displayed value was masked by the host. | reject |

## Definition of Done

- Backend, frontend, and automated tests for all acceptance criteria are complete.
- Valid and invalid credential flows are covered by integration tests.
- Protected-route and logout behavior are covered by UI/E2E tests.
- No plaintext password or secret is introduced.
- The implementation passes the project's build, lint, and focused test commands.
