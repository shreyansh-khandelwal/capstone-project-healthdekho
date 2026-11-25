# Functional Requirements Specification: HealthDekho Insurance Management System

## 1. Project Overview & Scope
**HealthDekho** is a centralized, full-stack web-based Insurance Management System designed to modernize manual insurance operations. The platform automates customer authentication, policy discovery, AI-assisted personalized policy recommendations, policy registration with installment scheduling, premium payment tracking, and policy search.

* **In Scope:** Customer authentication, personalized dashboard, available product catalog, Spring AI-powered product recommendations, policy registration & installment generation, premium payment collection & penalty calculation, and multi-criteria policy search.
* **Out of Scope:** Insurance claim processing and claim-related database tables (reserved for future enhancement).

---

## 2. Technology Stack & Architectural Constraints

### 2.1 Backend Stack
* **Language:** Java 21 (Mandatory — utilize Records, Pattern Matching with `instanceof` and `switch`, `LocalDate`, `YearMonth`, `BigDecimal`, `Optional`, and Stream API)
* **Framework:** Spring Boot 3.5.7 (Spring Web, Spring Security, Spring Data JPA, Spring AI, Jakarta Bean Validation)
* **Database:** PostgreSQL (`BIGINT` or `UUID` primary keys, `NUMERIC(19,2)` for currency, `DATE` for dates, `TIMESTAMP WITH TIME ZONE` for audit timestamps)

### 2.2 Frontend Stack
* **Framework:** React.js (Functional Components and React Hooks)
* **HTTP Client & UI:** Axios for REST integration, client-side form validation, search/filtering, tabular data presentation, loading states, and toast/banner notifications for success and error handling.

### 2.3 Architecture & Design Rules
* **Layered Architecture:** Strictly separate `Controller`, `Service`, `Repository`, `Entity`, `DTO`, and `AI Integration` layers.
* **DTO Boundary:** Never expose JPA entities directly in REST endpoints; use immutable Java 21 `record` DTOs for all API requests and responses.
* **Transactional Integrity:** Enforce `@Transactional` on multi-step state mutations (policy registration + installment creation, payment recording + installment/policy status updates).
* **AI Guardrails:** Spring AI generates explanations and suitability rankings, but **must never** replace deterministic business validations, eligibility checks, or financial calculations, and **must only** recommend active products retrieved from PostgreSQL.

---

## 3. Functional Requirements

### FR-1: Customer Authentication, Dashboard & Policy Discovery

#### FR-1.1 Customer Authentication
* Provide a React login form accepting customer credentials (email/password) and authenticate via Spring Security.
* Redirect authenticated customers to their personalized dashboard; display clear error messages on invalid credentials.
* Restrict all dashboard, recommendation, registration, and payment endpoints to the authenticated customer's context.

#### FR-1.2 Personalized Customer Dashboard
* Retrieve and display all insurance policies registered by the logged-in customer in a table with columns:
  * `Policy Identifier` (Unique policy number)
  * `Policy Name` (Registered insurance product name)
  * `Policy Type` (Insurance category)
  * `Policy Term` (Duration in months/years)
  * `Policy Start Date`
  * `Policy Maturity Date`
  * `Premium Frequency` (`MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, `YEARLY`)
  * `Premium Amount` (Per installment)
  * `Sum Insured`
  * `Policy Status`
* Display an appropriate message when the customer has no registered policies.

#### FR-1.3 View Available Insurance Policies
* Fetch all active insurance products (`active = true`) from PostgreSQL and filter out products the customer has already registered for (per duplicate-registration rules) using Java Streams.
* Display eligible products in a table with columns: `Product Code`, `Policy Name`, `Policy Type`, `Policy Term`, `Sum Insured`, `Premium Frequency`, `Premium Amount`, and a **Register** action button.
* Clicking **Register** navigates to the Policy Registration screen with the selected product pre-populated.

---

### FR-2: AI-Based Insurance Policy Recommendations

#### FR-2.1 Recommendation Workflow & Rules
* Provide an AI recommendation panel on the customer dashboard accepting optional/combined inputs:
  * Date of Birth (DOB)
  * Insurance Goals and Preferences (free text)
  * Preferred Policy Term
  * Preferred Insurance Type
* Calculate the customer's exact age deterministically using `java.time.LocalDate` and `Period`.
* Retrieve active products from PostgreSQL and exclude products already owned by the customer.
* Pass customer profile inputs, calculated age, and the filtered list of eligible database products to Spring AI.
* Validate that every product returned by the AI model exists in the eligible database product set (preventing hallucinated products).
* Persist both the request metadata (`ai_recommendation_request`) and recommended items (`ai_recommendation_item`) in PostgreSQL for auditability.
* Display results in a table with columns: `Product Code`, `Policy Name`, `Policy Type`, `Policy Term`, `Sum Insured`, `Premium Frequency`, `Premium Amount`, `Recommendation Reason`, `Suitability`, and a **Register** action button that pre-populates the registration form.

#### FR-2.2 Java 21 Expectations
* Use Java `record` DTOs, `LocalDate` / Java Time API, `Optional`, Stream API with `Collectors`, and pattern matching with `instanceof`.

---

### FR-3: Insurance Policy Registration

#### FR-3.1 Registration Form & Pre-Population
* **Auto-populated from Customer Profile (Read-Only):** `Customer Name`, `Date of Birth`, `Contact Information`.
* **Auto-populated from Selected Product (Read-Only):** `Policy Type`, `Policy Name`, `Policy Term`, `Premium Payment Frequency`, `Premium Amount`, `Sum Insured`.
* **User/System Computed Fields:**
  * `Policy Start Date`: Defaults to current date (`LocalDate.now()`).
  * `Policy Maturity Date`: Automatically calculated from `start_date` + `term_months`.
  * `Total Premium Payable`: Calculated deterministically using `BigDecimal` based on `premium_amount`, `premium_frequency`, and `term_months`.

#### FR-3.2 Validations & Persistence
* Validate all mandatory fields via Bean Validation (`@NotNull`, `@Positive`, etc.).
* Reject future dates of birth (`date_of_birth <= LocalDate.now()`).
* Enforce product age eligibility (`min_entry_age <= customer_age <= max_entry_age`).
* Ensure `maturity_date` is strictly after `start_date`, and `premium_amount`, `sum_insured`, and `term_months` are strictly positive.
* Enforce duplicate-registration prevention for the same customer and product.
* Generate a unique `policy_number` and generate the full sequential `premium_installment` schedule (calculating each `due_date` and `grace_period_end_date = due_date.plusMonths(1)`).
* Persist `customer_policy` and all `premium_installment` rows atomically in a single transaction, then return the generated `policy_number` and confirmation message.

#### FR-3.3 Java 21 Expectations
* Immutable `record` DTOs, `LocalDate`, `BigDecimal` for all monetary math, `Optional`, and Stream/collection operations.

---

### FR-4: Insurance Premium Payment Management

#### FR-4.1 Policy Lookup & Installment Schedule
* Allow users to search a policy by its unique `Policy Identifier`.
* Display policy summary metrics: `Policy Identifier`, `Customer Name`, `Policy Name`, `Policy Term`, `Policy Start Date`, `Policy Maturity Date`, `Total Premium Payable`, `Total Premium Paid`, and `Total Remaining Premium Amount`.
* Display the installment schedule table with columns: `Installment Number`, `Premium Amount`, `Due Date`, `Grace Period End Date`, `Payment Status` (`PAID`, `PENDING`, `PARTIALLY_PAID`, `OVERDUE`), and a selection checkbox for unpaid/eligible installments.

#### FR-4.2 Payment Processing & Penalty Rules
* Support paying one or multiple selected eligible installments in a single transaction.
* **Late Payment Penalty:** If `payment_date > grace_period_end_date`, apply a **10% penalty** on the outstanding installment amount (`BigDecimal`).
* Support partial payments where applicable; transition installment status across `PENDING`, `PARTIALLY_PAID`, `OVERDUE`, and `PAID` using Java 21 `switch` expressions.
* Reject duplicate payments on already `PAID` installments and reject payment amounts exceeding `(scheduled_amount - paid_amount + applicable_penalty)`.
* Insert immutable audit records into `premium_payment` with unique `transaction_reference`, `payment_date`, `amount_paid`, `penalty_amount`, and `payment_method`.
* Mark the parent `customer_policy` as fully paid/completed only when **all** associated installments reach `PAID` status.

#### FR-4.3 Java 21 Expectations
* `record` DTOs, `YearMonth` for payment period tracking, `BigDecimal`, `switch` expressions/pattern matching for status transitions, Stream API, and `@Transactional` service methods.

---

### FR-5: Customer Insurance Policy Search

#### FR-5.1 Search Criteria & Validation
* Provide a React search interface supporting searches by:
  1. `Policy Identifier`
  2. `Customer Name`
  3. `Policy Identifier` + `Date of Birth`
* Validate that at least one valid search combination is supplied before querying.

#### FR-5.2 Search Results & Pagination
* Query PostgreSQL efficiently using Spring Data JPA (`Pageable` / pagination support).
* Display matching records in a table with columns: `Policy Identifier`, `Customer Name`, `Date of Birth`, `Policy Name`, `Policy Type`, `Policy Start Date`, `Policy Maturity Date`, `Total Premium Payable`, `Premium Payment Status`, `Total Premium Paid`, and `Remaining Premium`.
* Display an informative message when no records match the search criteria.

#### FR-5.3 Java 21 Expectations
* `record` response DTOs, Stream API mapping, `Collectors.groupingBy()` where aggregating installments/policies, `Optional`, and Spring Data `Page<T>`.

---

## 4. Non-Functional Requirements
1. **Security:** Passwords stored using strong one-way hashing (`BCryptPasswordEncoder`). Role/ownership checks ensure customers can only access their own policies and payments.
2. **Error Handling:** Centralized `@RestControllerAdvice` returning standardized error payloads (`timestamp`, `status`, `error`, `message`, `fieldErrors`) with appropriate HTTP status codes (`400`, `401`, `403`, `404`, `409`, `500`).
3. **Configuration Management:** Externalize database credentials, Spring AI model settings, and JWT/session secrets via `application.yml` and environment-specific profiles (`dev`, `prod`).
4. **Financial Precision:** All monetary values stored as `NUMERIC(19,2)` in PostgreSQL and processed with `BigDecimal` (`RoundingMode.HALF_UP`) in Java.

---

## 5. Database Schema Specification (PostgreSQL)

1. **`customer`** — Authenticated customer profile data.
   * **Columns:** `customer_id` (PK, BIGINT/UUID), `email` (UQ, NOT NULL), `password_hash` (NOT NULL), `full_name` (NOT NULL), `date_of_birth` (DATE, NOT NULL), `phone`, `status` (NOT NULL), `created_at` (TIMESTAMPTZ, NOT NULL), `updated_at` (TIMESTAMPTZ)
   * **Constraints & Indexes:** `CHECK (date_of_birth <= CURRENT_DATE)`, index on `status`.

2. **`insurance_product`** — Master catalog of insurance products.
   * **Columns:** `product_id` (PK), `product_code` (UQ, NOT NULL), `policy_name` (NOT NULL), `policy_type` (NOT NULL), `term_months` (INT, NOT NULL), `premium_frequency` (NOT NULL), `premium_amount` (NUMERIC(19,2), NOT NULL), `sum_insured` (NUMERIC(19,2), NOT NULL), `min_entry_age` (INT, NOT NULL), `max_entry_age` (INT, NOT NULL), `active` (BOOLEAN, DEFAULT TRUE, NOT NULL)
   * **Constraints & Indexes:** `CHECK (premium_amount > 0)`, `CHECK (sum_insured > 0)`, `CHECK (max_entry_age >= min_entry_age)`, index on `active`.

3. **`customer_policy`** — Registered policy owned by a customer.
   * **Columns:** `policy_id` (PK), `policy_number` (UQ, NOT NULL), `customer_id` (FK -> `customer.customer_id`, NOT NULL), `product_id` (FK -> `insurance_product.product_id`, NOT NULL), `start_date` (DATE, NOT NULL), `maturity_date` (DATE, NOT NULL), `premium_frequency` (NOT NULL), `premium_amount` (NUMERIC(19,2), NOT NULL), `sum_insured` (NUMERIC(19,2), NOT NULL), `total_premium_payable` (NUMERIC(19,2), NOT NULL), `status` (NOT NULL), `created_at` (TIMESTAMPTZ, NOT NULL)
   * **Constraints & Indexes:** `UQ(customer_id, product_id)` (or partial unique index on active policies per duplicate rule), indexes on `customer_id` and `status`.

4. **`premium_installment`** — Scheduled premium obligations for a policy.
   * **Columns:** `installment_id` (PK), `policy_id` (FK -> `customer_policy.policy_id`, NOT NULL), `installment_number` (INT, NOT NULL), `due_date` (DATE, NOT NULL), `grace_period_end_date` (DATE, NOT NULL), `scheduled_amount` (NUMERIC(19,2), NOT NULL), `paid_amount` (NUMERIC(19,2), DEFAULT 0, NOT NULL), `payment_status` (NOT NULL)
   * **Constraints & Indexes:** `UQ(policy_id, installment_number)`, `CHECK (paid_amount >= 0)`.

5. **`premium_payment`** — Immutable premium payment transaction history.
   * **Columns:** `payment_id` (PK), `installment_id` (FK -> `premium_installment.installment_id`, NOT NULL), `transaction_reference` (UQ, NOT NULL), `payment_date` (DATE, NOT NULL), `amount_paid` (NUMERIC(19,2), NOT NULL), `penalty_amount` (NUMERIC(19,2), DEFAULT 0, NOT NULL), `payment_method` (NOT NULL), `created_at` (TIMESTAMPTZ, NOT NULL)
   * **Constraints & Indexes:** `CHECK (amount_paid > 0)`, indexes on `installment_id` and `payment_date`.

6. **`ai_recommendation_request`** — Captures each AI recommendation interaction.
   * **Columns:** `recommendation_request_id` (PK), `customer_id` (FK -> `customer.customer_id`, NOT NULL), `insurance_goals` (TEXT), `preferred_term` (INT), `preferred_policy_type`, `calculated_age` (INT, NOT NULL), `model_name` (NOT NULL), `model_version` (NOT NULL), `prompt_version` (NOT NULL), `requested_at` (TIMESTAMPTZ, NOT NULL)
   * **Constraints & Indexes:** Indexes on `customer_id` and `requested_at`.

7. **`ai_recommendation_item`** — Stores products returned for a recommendation request.
   * **Columns:** `recommendation_item_id` (PK), `recommendation_request_id` (FK -> `ai_recommendation_request.recommendation_request_id`, NOT NULL), `product_id` (FK -> `insurance_product.product_id`, NOT NULL), `rank_order` (INT, NOT NULL), `recommendation_reason` (TEXT), `suitability` (NOT NULL), `selected_for_registration` (BOOLEAN, DEFAULT FALSE, NOT NULL)
   * **Constraints & Indexes:** `UQ(recommendation_request_id, product_id)`.