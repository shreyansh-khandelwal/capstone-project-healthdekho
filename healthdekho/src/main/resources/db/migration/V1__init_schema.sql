-- =====================================================
-- CUSTOMER
-- =====================================================

CREATE TABLE sk_customer (
    customer_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(500) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,

    CONSTRAINT chk_customer_dob
        CHECK (date_of_birth <= CURRENT_DATE)
);

CREATE INDEX idx_customer_status
    ON sk_customer(status);

-- =====================================================
-- INSURANCE PRODUCT
-- =====================================================

CREATE TABLE sk_insurance_product (
    product_id BIGSERIAL PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    policy_name VARCHAR(255) NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    term_months INTEGER NOT NULL,
    premium_frequency VARCHAR(30) NOT NULL,
    premium_amount NUMERIC(15,2) NOT NULL,
    sum_insured NUMERIC(15,2) NOT NULL,
    min_entry_age INTEGER NOT NULL,
    max_entry_age INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_premium_amount
        CHECK (premium_amount > 0),

    CONSTRAINT chk_sum_insured
        CHECK (sum_insured > 0),

    CONSTRAINT chk_entry_age
        CHECK (max_entry_age >= min_entry_age)
);

CREATE INDEX idx_insurance_product_active
    ON sk_insurance_product(active);

-- =====================================================
-- CUSTOMER POLICY
-- =====================================================

CREATE TABLE sk_customer_policy (
    policy_id BIGSERIAL PRIMARY KEY,
    policy_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL REFERENCES sk_insurance_product(product_id),
    start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    premium_frequency VARCHAR(30) NOT NULL,
    premium_amount NUMERIC(15,2) NOT NULL,
    sum_insured NUMERIC(15,2) NOT NULL,
    total_premium_payable NUMERIC(15,2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_cp_customer
        FOREIGN KEY (customer_id)
        REFERENCES sk_customer(customer_id),

    CONSTRAINT fk_cp_product
        FOREIGN KEY (product_id)
        REFERENCES sk_insurance_product(product_id),

    CONSTRAINT uq_customer_product
        UNIQUE (customer_id, product_id)
);

CREATE INDEX idx_customer_policy_customer
    ON sk_customer_policy(customer_id);

CREATE INDEX idx_customer_policy_status
    ON sk_customer_policy(status);

-- =====================================================
-- PREMIUM INSTALLMENT
-- =====================================================

CREATE TABLE sk_premium_installment (
    installment_id BIGSERIAL PRIMARY KEY,
    policy_id BIGINT NOT NULL,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    grace_period_end_date DATE NOT NULL,
    scheduled_amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(30) NOT NULL,

    CONSTRAINT fk_installment_policy
        FOREIGN KEY (policy_id)
        REFERENCES sk_customer_policy(policy_id),

    CONSTRAINT uq_policy_installment
        UNIQUE (policy_id, installment_number),

    CONSTRAINT chk_paid_amount
        CHECK (paid_amount >= 0)
);

-- =====================================================
-- PREMIUM PAYMENT
-- =====================================================

CREATE TABLE sk_premium_payment (
    payment_id BIGSERIAL PRIMARY KEY,
    installment_id BIGINT NOT NULL,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    payment_date TIMESTAMP NOT NULL,
    amount_paid NUMERIC(15,2) NOT NULL,
    penalty_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_payment_installment
        FOREIGN KEY (installment_id)
        REFERENCES sk_premium_installment(installment_id),

    CONSTRAINT chk_amount_paid
        CHECK (amount_paid > 0)
);

CREATE INDEX idx_payment_installment
    ON sk_premium_payment(installment_id);

CREATE INDEX idx_payment_date
    ON sk_premium_payment(payment_date);

-- =====================================================
-- AI RECOMMENDATION REQUEST
-- =====================================================

CREATE TABLE sk_ai_recommendation_request (
    recommendation_request_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    insurance_goals TEXT,
    preferred_term INTEGER,
    preferred_policy_type VARCHAR(50),
    calculated_age INTEGER NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    prompt_version VARCHAR(50) NOT NULL,
    requested_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_arr_customer
        FOREIGN KEY (customer_id)
        REFERENCES sk_customer(customer_id)
);

CREATE INDEX idx_arr_customer
    ON sk_ai_recommendation_request(customer_id);

CREATE INDEX idx_arr_requested_at
    ON sk_ai_recommendation_request(requested_at);

-- =====================================================
-- AI RECOMMENDATION ITEM
-- =====================================================

CREATE TABLE sk_ai_recommendation_item (
    recommendation_item_id BIGSERIAL PRIMARY KEY,
    recommendation_request_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    rank_order INTEGER NOT NULL,
    recommendation_reason TEXT,
    suitability NUMERIC(5,2) NOT NULL,
    selected_for_registration BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_ari_request
        FOREIGN KEY (recommendation_request_id)
        REFERENCES sk_ai_recommendation_request(recommendation_request_id),

    CONSTRAINT fk_ari_product
        FOREIGN KEY (product_id)
        REFERENCES sk_insurance_product(product_id),

    CONSTRAINT uq_request_product
        UNIQUE(recommendation_request_id, product_id)
);

-- =====================================================
-- PRE-SEEDED PRODUCTS
-- =====================================================

INSERT INTO sk_insurance_product
(
 product_code,
 policy_name,
 policy_type,
 term_months,
 premium_frequency,
 premium_amount,
 sum_insured,
 min_entry_age,
 max_entry_age,
 active
)
VALUES
(
 'TERM001',
 'Secure Life Term Plan',
 'TERM',
 240,
 'MONTHLY',
 2500.00,
 5000000.00,
 18,
 60,
 TRUE
),
(
 'HLTH001',
 'Family Health Shield',
 'HEALTH',
 120,
 'MONTHLY',
 1800.00,
 1000000.00,
 18,
 65,
 TRUE
),
(
 'RET001',
 'Retirement Pension Plus',
 'RETIREMENT',
 300,
 'MONTHLY',
 3500.00,
 2500000.00,
 25,
 55,
 TRUE
);
INSERT INTO sk_customer (
    email,
    password_hash,
    full_name,
    date_of_birth,
    status,
    created_at,
    updated_at
) VALUES (
    'customer@gmail.com',
    '$2a$12$wEERyEmYoBjtWm8NO7f0hufP7MoPABElJTz2TV4ASx7i8PAtF/2cO',
    'Demo Customer',
    DATE '1990-01-01',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
