# HealthDekho Insurance Management System - Architecture

**Document Version:** 1.0  
**Last Updated:** 2026-11-24  
**Status:** Final

---

## 1. Architecture Overview

HealthDekko is a full-stack web application enabling authenticated customers to manage insurance policies, discover eligible products, receive AI-powered recommendations, pay premiums, and search for owned policies. The system maintains strict financial correctness, audit trails, and cross-customer data isolation.

### 1.1 High-Level Architecture Pattern

The application follows a **three-tier layered architecture** with clear separation of concerns:

```
┌────────────────────────────────────────────────────────────────┐
│                      React Frontend (SPA)                       │
│        (Responsive Web, Components, Hooks, State Mgmt)         │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST / JSON
┌──────────────────────────▼───────────────────────────────────────┐
│                  Spring Boot 3.5 REST API                        │
│    (Controllers, Services,repositories, Validation, Security, AI Client)     │
└──────────────────────────┬───────────────────────────────────────┘
                           │ SQL / JPA
┌──────────────────────────▼───────────────────────────────────────┐
│          PostgreSQL Database (Relational + Financial)            │
│    (Entities, Relationships, Constraints, Audit Ledgers)        │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Backend
- **Runtime:** Java 21
- **Framework:** Spring Boot 3.5.7
- **Core Dependencies:**
  - Spring Web (REST controllers, HTTP handling)
  - Spring Security (authentication, authorization, JWT/session)
  - Spring Data JPA (ORM, transactional data access)
  - Spring AI (LLM integration, vector search, prompt management)
  - Jakarta Bean Validation (server-side field validation)
  - Flyway or Liquibase (database migrations, versioning)

### Frontend
- **Framework:** React (functional components and hooks)
- **HTTP Client:** Axios (REST API calls, interceptors, error handling)
- **State Management:** React Hooks + Context API or Redux (optional)
- **Validation:** Client-side form validation (pre-flight UX)
- **UI Feedback:** Toast notifications, banners, loading spinners

### Database
- **System:** PostgreSQL 13+
- **Data Types:**
  - `NUMERIC(19,2)` for financial values (BigDecimal mapping)
  - `DATE` for event and schedule dates
  - `TIMESTAMP` for audit trails
  - `TEXT` for recommendation reasons and product descriptions
- **Features:** Full ACID compliance, transactional integrity, partial unique indexes

### External Services
- **AI Model Provider:** Spring AI abstraction (Claude, OpenAI, Gemini, or other LLM provider, configured via environment)
- **Configuration:** Environment variables for credentials, model names, prompt versions

---

## 3. Data Architecture

### 3.1 Entity Relationship Diagram

```
customer (1) ──────────────── (n) customer_policy
   │
   └──────────────────────────── (n) ai_recommendation_request

insurance_product (1) ──────────────── (n) customer_policy
   │
   └──────────────────────────── (n) ai_recommendation_item

customer_policy (1) ──────────────── (n) premium_installment

premium_installment (1) ──────────────── (n) premium_payment

ai_recommendation_request (1) ──────────────── (n) ai_recommendation_item
```

### 3.2 Core Entities

#### Customer
- **Role:** Authenticated user and ownership authority
- **Key Fields:** `customer_id` (PK), `email` (unique), `password_hash`, `full_name`, `date_of_birth`, `phone`, `status`, `created_at`, `updated_at`
- **Constraints:** DOB ≤ CURRENT_DATE; unique email; indexed on status

#### InsuranceProduct
- **Role:** Master product catalog (read-only by customers)
- **Key Fields:** `product_id` (PK), `product_code` (unique), `policy_name`, `policy_type`, `term_months`, `premium_frequency`, `premium_amount`, `sum_insured`, `min_entry_age`, `max_entry_age`, `active`
- **Constraints:** Positive premium_amount and sum_insured; max_entry_age ≥ min_entry_age; indexed on `active`

#### CustomerPolicy
- **Role:** Customer's registered policy instance
- **Key Fields:** `policy_id` (PK), `policy_number` (unique, user-visible), `customer_id` (FK), `product_id` (FK), `start_date`, `maturity_date`, `premium_frequency`, `premium_amount`, `sum_insured`, `total_premium_payable`, `status`, `created_at`
- **Constraints:** Unique constraint on (customer_id, product_id) for active policies; indexed on customer_id and status
- **Financial Invariant:** Total Premium Payable = all Installment amounts (including adjusted final installment)

#### PremiumInstallment
- **Role:** Scheduled premium obligation
- **Key Fields:** `installment_id` (PK), `policy_id` (FK), `installment_number`, `due_date`, `grace_period_end_date`, `scheduled_amount`, `paid_amount`, `payment_status`
- **Constraints:** Unique on (policy_id, installment_number); grace_period_end_date = due_date + 1 month; paid_amount ≥ 0
- **Status Values:** `PENDING`, `PARTIALLY_PAID`, `OVERDUE`, `PAID`

#### PremiumPayment
- **Role:** Immutable transaction history (append-only)
- **Key Fields:** `payment_id` (PK), `installment_id` (FK), `transaction_reference` (unique), `payment_date`, `amount_paid`, `penalty_amount`, `payment_method`, `created_at`
- **Constraints:** amount_paid > 0; transaction_reference is unique and immutable
- **Payment Methods:** `CARD`, `UPI`, `NET_BANKING`, `CASH_OFFLINE`

#### AiRecommendationRequest
- **Role:** Audit record for each AI invocation
- **Key Fields:** `recommendation_request_id` (PK), `customer_id` (FK), `insurance_goals`, `preferred_term`, `preferred_policy_type`, `calculated_age`, `model_name`, `model_version`, `prompt_version`, `requested_at`
- **Constraints:** Indexed on customer_id and requested_at
- **Purpose:** Traceability and debugging of AI outputs

#### AiRecommendationItem
- **Role:** Each product returned for a recommendation
- **Key Fields:** `recommendation_item_id` (PK), `recommendation_request_id` (FK), `product_id` (FK), `rank_order`, `recommendation_reason`, `suitability`, `selected_for_registration`
- **Constraints:** Unique on (recommendation_request_id, product_id)
- **Suitability Values:** `HIGH`, `MEDIUM`, `LOW`

---

## 4. API Architecture

### 4.1 REST Endpoint Groups

#### Authentication & Session
- `POST /api/v1/auth/login` — Authenticate with email and password
- `POST /api/v1/auth/logout` — Clear session or revoke JWT
- `GET /api/v1/auth/me` — Retrieve authenticated customer profile

#### Dashboard & Owned Policies
- `GET /api/v1/dashboard` — Retrieve authenticated customer's policies and summary
- `GET /api/v1/policies` — List customer's owned policies with pagination
- `GET /api/v1/policies/{policyId}` — Retrieve single policy with installment summary

#### Product Discovery
- `GET /api/v1/products` — List active products, excluding duplicates for authenticated customer
- `GET /api/v1/products/{productId}` — Retrieve single product details
- `GET /api/v1/products/search` — Filter products by criteria (paginated)

#### AI Recommendations
- `POST /api/v1/recommendations` — Request AI recommendations with optional profile inputs
  - Request body: `{ insuranceGoals?, preferredTerm?, preferredPolicyType? }`
  - Response: Ranked list of products with reasons and suitability scores
- `GET /api/v1/recommendations/{requestId}` — Retrieve past recommendation request and items

#### Policy Registration
- `POST /api/v1/policies/register` — Atomically create policy, generate installments, and return policy number
  - Request body: `{ productId, startDate? }`
  - Validation: Age eligibility, duplicate check, maturity date, schedule calculation
  - Response: Policy number, maturity date, total premium, installment schedule
- `GET /api/v1/policies/{policyId}/schedule` — Retrieve full installment schedule with payment status

#### Premium Payments
- `GET /api/v1/policies/{policyId}/installments` — Retrieve payment schedule with status and eligibility
- `POST /api/v1/policies/{policyId}/payments` — Submit payment for one or more installments
  - Request body: `{ installmentIds: [], paymentMethod, amount? }`
  - Validation: Outstanding balance, duplicate transaction reference, late penalty calculation
  - Response: Transaction reference, penalty applied, remaining balance
- `GET /api/v1/policies/{policyId}/payments` — Retrieve payment history for a policy

#### Policy Search
- `GET /api/v1/search/policies` — Search owned policies
  - Query params: `policyNumber`, `customerName`, `dateOfBirth`
  - Supported combinations: policy number only, name only, policy number + DOB
  - Response: Paginated results with financial summary

### 4.2 Error Response Format

All endpoints return a consistent error envelope:

```json
{
  "timestamp": "2026-11-24T15:07:17.458Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldErrors": [
    {
      "field": "dateOfBirth",
      "message": "Date of birth cannot be in the future"
    }
  ]
}
```

**HTTP Status Codes:**
- `200 OK` — Successful query
- `201 Created` — Successful resource creation (Registration, Payment)
- `400 Bad Request` — Validation error
- `401 Unauthorized` — Missing or invalid authentication
- `403 Forbidden` — Authenticated but unauthorized (cross-customer access)
- `404 Not Found` — Resource does not exist
- `409 Conflict` — Duplicate registration attempted
- `500 Internal Server Error` — Unhandled server error

---

## 5. Service Architecture

### 5.1 Core Service Layers

#### AuthenticationService
- Login validation and credential hashing
- JWT or session token generation
- Current customer resolution from context
- Password security (one-way hashing, never returned in API)

#### CustomerService
- Customer profile queries
- Ownership verification (all endpoints must call this before returning customer data)
- DOB validation and age calculation

#### ProductService
- Fetch active products from database
- Duplicate registration filter (hide products already owned by customer)
- Product eligibility queries (age range, term, type)

#### PolicyService
- Policy creation and unique policy number generation
- Policy status transitions
- Financial summary aggregation (total paid, remaining amount)
- Ownership verification

#### InstallmentService
- Installment schedule generation from product and start date
- Proration logic for terms not evenly divisible by premium frequency
- Installment count and financial reconciliation (must equal Total Premium Payable)
- Grace period calculation (1 month after due date)

#### PaymentService
- Late penalty calculation (10% of outstanding amount after grace period)
- Multi-installment payment atomicity (all-or-nothing)
- Payment status transition logic
- Immutable payment ledger updates

#### RecommendationService
- AI recommendation request capture (audit log)
- Eligible product set construction (active, not duplicate, within age range)
- AI prompt construction and invocation
- Output validation (hallucination rejection, eligibility re-check)
- Recommendation item storage
- Fallback behavior when AI service is unavailable

#### SearchService
- Multi-criteria policy search (number, name, number+DOB)
- Pagination and result ordering
- Financial summary for each result

### 5.2 Cross-Cutting Concerns

#### Authorization & Ownership Verification
- **Pattern:** Every protected endpoint must resolve the authenticated customer and verify ownership
- **Implementation:** Use Spring Security `@PreAuthorize` and custom authorization expressions
- **Consequence:** Cross-customer access attempts return 403 without data leakage

#### Financial Validation
- **BigDecimal everywhere:** All monetary values use `BigDecimal` with `NUMERIC(19,2)` database storage
- **RoundingMode.HALF_UP:** Explicit rounding for schedule calculations and penalties
- **Reconciliation tests:** Every payment scenario must reconcile to the cent

#### Transaction Management
- **Registration:** Wrap policy creation and all installment inserts in `@Transactional(isolation=REPEATABLE_READ)`
- **Payment:** Wrap multi-installment payment in single transaction with rollback on any failure
- **Idempotency:** Transaction reference must be unique; duplicate payment attempts are rejected at database or service layer

#### Validation Strategy
- **Client-side:** Pre-flight validation for UX (email format, DOB not future, age range)
- **Server-side:** Mandatory validation on all state-changing endpoints; never trust client
- **Bean Validation:** Use `@Valid` annotations with custom validators for domain-specific rules

#### AI Service Integration
- **Candidate Set Construction:** Retrieve eligible products from PostgreSQL, pass to AI prompt
- **Hallucination Rejection:** Validate every returned product against the same eligible set
- **Error Recovery:** Timeout, provider unavailable, or validation failure → show deterministic eligible product catalog
- **Auditability:** Store request metadata (model, version, prompt version) even if output is rejected

---

## 6. Frontend Architecture

### 6.1 Component Structure

```
App
├── AuthContext / AuthProvider
│   └── useAuth() hook
├── Layout
│   ├── Header (navigation, logout)
│   ├── Sidebar (menu)
│   └── Main Content
└── Routes
    ├── /login
    │   └── LoginForm
    ├── /dashboard (protected)
    │   ├── PolicyTable
    │   ├── ProductDiscovery (link)
    │   └── Recommendation Panel (link)
    ├── /products (protected)
    │   ├── ProductList
    │   │   └── ProductCard (w/ Register action)
    │   └── Filters
    ├── /recommendations (protected)
    │   ├── PreferenceForm (insurance goals, term, type)
    │   ├── LoadingState
    │   └── RecommendationResults
    │       └── RecommendationItem (w/ Register action)
    ├── /register (protected)
    │   ├── ProfileSummary (read-only)
    │   ├── ProductSummary (read-only)
    │   ├── CalculatedValues (Maturity Date, Total Premium)
    │   ├── InstallmentPreview
    │   └── ConfirmButton
    ├── /policies/:policyId (protected)
    │   ├── PolicySummary
    │   ├── InstallmentTable
    │   ├── SelectMultiple
    │   └── PaymentForm
    └── /search (protected)
        ├── SearchForm
        ├── ResultsTable
        └── EmptyState
```

### 6.2 Key Patterns

#### Authentication Flow
1. User lands on login form
2. Submit credentials → `POST /api/v1/auth/login`
3. API returns JWT (or sets session cookie)
4. AuthContext stores token; subsequent requests include token in Authorization header
5. Navigation to protected routes checks auth state; redirect to login if missing
6. `useAuth()` hook provides current customer and logout

#### Data Fetching
- Axios instance with baseURL and default Authorization header from AuthContext
- Request/response interceptors for error handling and token refresh
- Loading and error states per component (avoid global loader paralysis)

#### Form Validation
- Controlled components with state tracking for each field
- Real-time validation feedback (optional, non-blocking)
- Submit validation (server-side errors override client errors)
- Display field-level errors from API error response

#### Loading & Async States
- Loading spinner or skeleton screen during API calls
- Prevent duplicate submission during in-flight mutations (disable submit button)
- Explicit error messages (not generic "error occurred")
- Fallback UI for timeout scenarios (e.g., Recommendation timeout → show deterministic product list)

#### Responsive Design
- Mobile-first CSS or Tailwind utility classes
- Flexbox/CSS Grid for layouts
- Touch-friendly button sizes (48px minimum)
- Table overflow handling on mobile (horizontal scroll or card view)

---

## 7. AI Integration Strategy

### 7.1 Recommendation Workflow

```
1. Customer enters optional preferences (goals, term, type, DOB)
   ↓
2. Backend constructs eligible product set:
   - Fetch active products from PostgreSQL
   - Filter by age range (using calculated age)
   - Exclude products already owned (Duplicate Registration rule)
   - Pass only eligible product IDs to AI
   ↓
3. Spring AI prompt constructs request:
   - Product catalog: [product_id, name, type, term, sum_insured, premium_amount]
   - Customer age: [calculated_age]
   - Customer preferences: [goals, term, type]
   - System message: "Recommend relevant products from the catalog only"
   ↓
4. AI responds with ranked list:
   - Product ID, rank order, reason, suitability score
   ↓
5. Backend validates output:
   - Every product ID exists in eligible set? Reject if unknown.
   - Is every product still active and not duplicate? Reject if changed.
   - No duplicates within result? Reject if repeated.
   - Store valid items; exclude invalid.
   ↓
6. Frontend displays:
   - Results in rank order with reason and suitability
   - Register action pre-populates product in registration flow
```

### 7.2 Error Handling

**AI Service Unavailable or Timeout:**
- Catch Spring AI exception
- Record the failed recommendation request (for debugging)
- Return 503 or error response with recovery message
- Frontend shows: "Recommendations temporarily unavailable. Browse products directly."
- Link to product discovery remains available

**Hallucinated Products:**
- Validate each product_id against eligible set
- Exclude unknown products from result
- Do not return hallucinated metadata (product name, pricing) to customer
- Log incident for debugging

---

## 8. Security Architecture

### 8.1 Authentication & Authorization

- **Strategy:** Spring Security with JWT or session-based authentication
- **Password Storage:** BCrypt or Argon2; never log or return plaintext passwords
- **Session Timeout:** 30-minute inactivity timeout (configurable)
- **CSRF Protection:** Enabled for form submissions (SameSite cookie + CSRF tokens)
- **HTTPS Enforcement:** All production traffic must use TLS 1.3

### 8.2 Data Access Control

- **Principal Resolution:** Extract authenticated customer from Spring Security context
- **Resource Ownership Validation:** Every endpoint that returns policy/payment data must verify authentication and ownership
- **Cross-Customer Protection:** Return 403 Forbidden if customer attempts to access another customer's data
- **Audit Logging:** All data access (especially payments and recommendations) logged with timestamp, customer ID, action

### 8.3 Input Validation & Output Encoding

- **Input Validation:** Server-side validation on all state-changing endpoints; use Bean Validation and custom domain validators
- **SQL Injection Prevention:** Use parameterized queries via JPA/Hibernate (never string concatenation)
- **XSS Prevention:** React escapes output by default; sanitize rich-text inputs if needed
- **API Response Encoding:** REST DTOs never expose JPA entities or sensitive internal data

### 8.4 Configuration & Secrets Management

- **Environment Variables:** Database credentials, JWT secret, AI model credentials, API keys
- **No Hard-Coded Secrets:** Never commit credentials to version control
- **Spring Profiles:** `application.properties` (default) + `application-prod.properties` (prod overrides)
- **Twelve-Factor App:** Database URL, model names, timeout values all from environment

---

## 9. Database Design Principles

### 9.1 Persistence Strategy

- **JPA/Hibernate ORM:** Entities mapped to tables; lazy loading disabled for performance
- **Flyway Migrations:** Version-controlled SQL scripts for schema evolution
- **Connection Pooling:** HikariCP with appropriate pool size for expected concurrency
- **Read Replicas:** Not in MVP scope; production deployments may add read-only replicas for reporting

### 9.2 Consistency & Integrity

- **Foreign Keys:** Cascading behavior defined per relationship (cascade delete for installments on policy delete; restrict on product update)
- **Unique Constraints:** Enforce at database level + service layer for critical uniqueness (e.g., policy number, transaction reference, product code)
- **Check Constraints:** Database-level constraints for domain boundaries (age ranges, positive amounts, date logic)
- **Partial Unique Indexes:** One active customer/product registration enforced via partial unique index on (customer_id, product_id) where status = 'ACTIVE'

### 9.3 Audit & Traceability

- **Created/Updated Timestamps:** All entities include `created_at` and `updated_at` (updated via `@PrePersist` and `@PreUpdate`)
- **Immutable Ledgers:** PremiumPayment table is append-only; no updates or deletes allowed
- **Status Transitions:** Policy and Installment status changes logged via service layer with timestamp
- **AI Audit Trail:** AiRecommendationRequest and AiRecommendationItem tables store full context

---

## 10. Performance Considerations

### 10.1 Query Optimization

- **Indexing Strategy:**
  - Customer table: index on `email` (login), `status` (dashboard filters)
  - InsuranceProduct table: index on `active`, `min_entry_age`, `max_entry_age`
  - CustomerPolicy table: composite index on (`customer_id`, `status`); index on `policy_number` (search)
  - PremiumInstallment table: index on (`policy_id`, `payment_status`); index on `due_date` (overdue detection)
  - PremiumPayment table: index on (`installment_id`, `payment_date`); unique index on `transaction_reference`
  - AiRecommendationRequest table: index on (`customer_id`, `requested_at`)

- **Query Patterns:**
  - Dashboard: `SELECT * FROM customer_policy WHERE customer_id = ? AND status IN (...)` → use composite index
  - Product discovery: `SELECT * FROM insurance_product WHERE active = true AND product_id NOT IN (...)` → use partial index on active, then exclude via app logic
  - Installment schedule: `SELECT * FROM premium_installment WHERE policy_id = ? ORDER BY installment_number` → use index on policy_id
  - Payment history: `SELECT * FROM premium_payment WHERE installment_id = ? ORDER BY payment_date DESC` → use index on installment_id

- **Pagination:** All list endpoints support `page` and `size` query parameters; default page size 20
- **Lazy Loading Disabled:** Set `spring.jpa.properties.hibernate.enable_lazy_initialization=false` to catch N+1 problems

### 10.2 Caching Strategy

- **HTTP Caching:** Product catalog changes infrequently; cache GET /api/v1/products with 1-hour max-age
- **Database Query Cache:** Hibernate Query Cache for frequently accessed lookups (optional for MVP)
- **Session Cache:** Spring Session with Redis (optional; in-memory H2 acceptable for MVP)
- **Do Not Cache:** Customer dashboard, payment status, recommendation results (dynamic per request)

### 10.3 Latency Targets

- **Standard CRUD & Search:** < 300 ms at p95 on test dataset
  - Achieved via indexed queries, pagination, and proper connection pooling
- **Recommendation Requests:** < 5 seconds end-to-end
  - Includes eligible set construction, AI call, validation, and storage
  - Timeout recovery: return deterministic product catalog if AI exceeds 5 seconds
- **Frontend Rendering:** < 2 seconds for initial page load
  - React bundle optimization, lazy code splitting, CDN for static assets

---

## 11. Deployment Architecture

### 11.1 Build Pipeline

- **Backend:** Maven (or Gradle)
  - `mvn clean package` → Spring Boot JAR
  - `mvn test` → Run all integration and unit tests
  - Code coverage target: > 80% for critical paths (auth, payment, registration)

- **Frontend:** Node.js / npm or yarn
  - `npm install` → Install dependencies
  - `npm run build` → Production React bundle
  - `npm run lint` → Check code style
  - `npm test` → Run Jest unit tests

### 11.2 Container & Orchestration

- **Dockerfile:** Multi-stage build for backend JAR and frontend static files
- **Environment Variables:** Loaded at container startup from ConfigMap or Secrets
- **Health Checks:** Liveness probe (`/actuator/health`), readiness probe (`/actuator/health/readiness`)
- **Kubernetes Deployment:** Replicas = 2 (minimum for HA), resource requests/limits defined

### 11.3 Configuration Management

- **Spring Profiles:** `dev`, `staging`, `prod`
  - `application-dev.properties`: H2 in-memory DB, debug logging
  - `application-prod.properties`: PostgreSQL, error logging, security headers enabled
- **Environment Overrides:** Properties prefixed with `SPRING_` override file values (12-factor compliance)

### 11.4 Monitoring & Observability

- **Logging:** SLF4J + Logback; centralized logging via ELK or similar
- **Metrics:** Spring Boot Actuator with Prometheus exporter
- **Distributed Tracing:** Spring Cloud Sleuth + Jaeger (optional for MVP, recommended for production)
- **Error Tracking:** Sentry or similar for unhandled exceptions

---

## 12. Data Consistency & Atomicity

### 12.1 Registration Atomicity

**Requirement:** If any step in policy creation fails, no rows are written.

**Implementation:**
```java
@Transactional(isolation = Isolations.REPEATABLE_READ)
public PolicyRegistrationResponse registerPolicy(RegisterPolicyRequest request) {
  // 1. Validate age, duplicate, dates
  // 2. Create Policy with generated policy_number
  // 3. Create InstallmentSchedule (may be 10+ rows)
  // 4. Update Policy.total_premium_payable = sum of installments
  // 5. Commit or rollback entire transaction
}
```

**Verification:** Test rollback scenario (e.g., simulate database connection loss after step 2); verify no orphaned policies.

### 12.2 Payment Atomicity

**Requirement:** Multi-installment payment either fully applies or is fully rejected.

**Implementation:**
```java
@Transactional(isolation = Isolations.REPEATABLE_READ)
public PaymentResponse submitPayment(PaymentRequest request) {
  // 1. Validate all selected installments are eligible
  // 2. For each installment:
  //    a. Calculate applicable penalty (if late)
  //    b. Create PremiumPayment record
  //    c. Update Installment.paid_amount, payment_status
  // 3. Update Policy.aggregate_status
  // 4. Commit or rollback entire transaction
}
```

**Verification:** Test mid-transaction failure (e.g., constraint violation on second installment); verify no partial payments recorded.

### 12.3 Idempotency

**Transaction Reference Uniqueness:**
- Every payment generates a unique `transaction_reference` via UUID or database sequence
- Duplicate payment submission with same reference returns 409 Conflict (not 200 OK)
- Prevents double-charging due to network retries

---

## 13. Testing Strategy

### 13.1 Unit Tests
- Service layer logic: validation, calculation, status transitions
- Target: > 80% coverage of critical business logic
- Example: Test 10% penalty calculation for late payments with multiple scenarios

### 13.2 Integration Tests
- Layered tests (controller → service → repository → database)
- Use `@SpringBootTest` with embedded PostgreSQL or H2 test database
- Verify end-to-end workflows: login → register → pay → verify reconciliation

### 13.3 Functional (E2E) Tests
- Selenium or Playwright for browser automation
- Test all five core user journeys (login, dashboard, product discovery, registration, payment)
- Verify financial reconciliation in UI (balance matches server calculation)

### 13.4 Performance Tests
- Load testing with JMeter or Gatling
- Target: 300ms p95 latency under expected concurrency (configurable)
- Verify index effectiveness under query load

### 13.5 Security Tests
- SQL injection attempts on search endpoints
- Cross-customer access attempts (retrieve another customer's policy)
- Unauthorized endpoint access without authentication
- Password validation (hashing, never returned in API)

---

## 14. Known Constraints & Assumptions

### 14.1 Constraints

- **AI Availability:** Capstone MVP does not define SLA for AI service; timeout recovery is built-in
- **Payment Settlement:** No integration with payment gateway; Payment records simulation only
- **Multi-Currency:** Single currency (INR); no conversion logic
- **Scalability:** MVP designed for single-database deployment; production may require read replicas

### 14.2 Assumptions

- Test dataset is sufficiently representative to exercise indexes without being production-scale
- Current browser support: Chrome and Edge (two most recent major versions)
- PostgreSQL 13+ available in deployment environment
- Spring AI abstraction available for chosen LLM provider (credentials externalized)
- 30-minute session timeout acceptable for typical customer workflows

---

## 15. Future Enhancements

### Post-MVP Roadmap
1. **Mobile Apps:** Native iOS/Android with same API contracts
2. **Real Payment Gateway:** Integrate Razorpay or similar for live settlement
3. **Notifications:** Email/SMS for payment reminders, policy milestones
4. **Multi-Currency:** Support multiple currencies with conversion rates
5. **Claims Module:** Extend schema and workflows for claim initiation and tracking
6. **Advanced Analytics:** Dashboard for insurer administrators (product performance, customer segments)
7. **ML Model Fine-Tuning:** Train recommendation model on historical customer registration data
8. **Geographic Failover:** Multi-region deployment for disaster recovery

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| Calculated Age | Customer's exact age derived from DOB and request date |
| Duplicate Registration | Attempt to register a product already owned (active policy) |
| Grace Period | 1 month after installment due date; late penalty applies after |
| Installment | One scheduled premium payment obligation |
| Outstanding Amount | Remaining amount due on an installment (after partial payments) |
| Payment Status | Current state of installment: PENDING, PARTIALLY_PAID, OVERDUE, PAID |
| Recommendation | AI-ranked product suggestion with reason and suitability score |
| Total Premium Payable | Sum of all installment amounts for a policy |
| Transaction Reference | Unique identifier for each payment (prevents duplicates) |

---

## 17. References

- **Functional Requirements:** `docs/functional-requirements.md`
- **PRD:** `docs/prd.md`
- **Database Schema:** `docs/schema.md`
- **API Addendum:** `docs/addendum.md` (implementation details, field mappings)

