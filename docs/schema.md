### Database Schema Specification

1. **`customer`** — *Stores authenticated customer profile data.*
   - **Columns:** `customer_id` (PK), `email` (UQ, not null), `password_hash` (not null), `full_name` (not null), `date_of_birth` (not null), `phone`, `status` (not null), `created_at` (not null), `updated_at`
   - **Constraints & Indexes:** `CHECK (date_of_birth <= CURRENT_DATE)`, index on `status`.

2. **`insurance_product`** — *Master catalog of insurance products.*
   - **Columns:** `product_id` (PK), `product_code` (UQ, not null), `policy_name` (not null), `policy_type` (not null), `term_months` (not null), `premium_frequency` (not null), `premium_amount` (not null), `sum_insured` (not null), `min_entry_age` (not null), `max_entry_age` (not null), `active` (boolean, default true, not null)
   - **Constraints & Indexes:** `CHECK (premium_amount > 0)`, `CHECK (sum_insured > 0)`, `CHECK (max_entry_age >= min_entry_age)`, index on `active`.

3. **`customer_policy`** — *Registered policy owned by a customer.*
   - **Columns:** `policy_id` (PK), `policy_number` (UQ, not null), `customer_id` (FK -> `customer.customer_id`, not null), `product_id` (FK -> `insurance_product.product_id`, not null), `start_date` (not null), `maturity_date` (not null), `premium_frequency` (not null), `premium_amount` (not null), `sum_insured` (not null), `total_premium_payable` (not null), `status` (not null), `created_at` (not null)
   - **Constraints & Indexes:** Unique constraint `UQ(customer_id, product_id)` (or partial unique index on active policies per duplicate rule), composite/individual indexes on `customer_id` and `status`.

4. **`premium_installment`** — *Scheduled premium obligations for a policy.*
   - **Columns:** `installment_id` (PK), `policy_id` (FK -> `customer_policy.policy_id`, not null), `installment_number` (not null), `due_date` (not null), `grace_period_end_date` (not null), `scheduled_amount` (not null), `paid_amount` (default 0, not null), `payment_status` (not null)
   - **Constraints & Indexes:** `UQ(policy_id, installment_number)`, `CHECK (paid_amount >= 0)` (enforce upper bound `scheduled_amount + applicable_penalty` in service/entity validation).

5. **`premium_payment`** — *Immutable premium payment transaction history.*
   - **Columns:** `payment_id` (PK), `installment_id` (FK -> `premium_installment.installment_id`, not null), `transaction_reference` (UQ, not null), `payment_date` (not null), `amount_paid` (not null), `penalty_amount` (default 0, not null), `payment_method` (not null), `created_at` (not null)
   - **Constraints & Indexes:** `CHECK (amount_paid > 0)`, indexes on `installment_id` and `payment_date`.

6. **`ai_recommendation_request`** — *Captures each recommendation interaction.*
   - **Columns:** `recommendation_request_id` (PK), `customer_id` (FK -> `customer.customer_id`, not null), `insurance_goals` (TEXT), `preferred_term`, `preferred_policy_type`, `calculated_age` (not null), `model_name` (not null), `model_version` (not null), `prompt_version` (not null), `requested_at` (not null)
   - **Constraints & Indexes:** Indexes on `customer_id` and `requested_at`.

7. **`ai_recommendation_item`** — *Stores products returned for a recommendation request.*
   - **Columns:** `recommendation_item_id` (PK), `recommendation_request_id` (FK -> `ai_recommendation_request.recommendation_request_id`, not null), `product_id` (FK -> `insurance_product.product_id`, not null), `rank_order` (not null), `recommendation_reason` (TEXT), `suitability` (not null), `selected_for_registration` (boolean, default false, not null)
   - **Constraints & Indexes:** `UQ(recommendation_request_id, product_id)`; validate in the service layer that the referenced `insurance_product` exists and has `active = true` at generation time.

### Output Format
1. Provide each entity class in a separate labeled Java file block (`Customer.java`, `InsuranceProduct.java`, `CustomerPolicy.java`, `PremiumInstallment.java`, `PremiumPayment.java`, `AiRecommendationRequest.java`, `AiRecommendationItem.java`) along with the required `Enum` definitions.
2. Provide the complete SQL DDL script (`V1__init_schema.sql`) matching all column types, foreign keys, check constraints, unique constraints, and indexes.
3. Briefly list any service-layer validations needed for business rules that cannot be enforced purely via static DDL constraints.