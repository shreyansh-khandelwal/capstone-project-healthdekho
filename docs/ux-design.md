

# UX Design Specification: HealthDekho Insurance Management System

## 1. UX Vision & Design Principles
**HealthDekho** is a modern, trustworthy, self-service insurance portal designed to replace manual policy tracking and payment workflows with clarity, financial transparency, and explainable AI guidance.

* **Clarity & Financial Trust:** Monetary figures (`Sum Insured`, `Premium Amount`, `Total Payable`, `Remaining Balance`, `Penalty`) are always formatted consistently (`₹` or `$` with two decimal places, tabular monospace alignment) with clear breakdowns before any commitment.
* **Guided Progression:** Complex multi-step tasks—such as discovering a product (via catalog or AI recommendation) and registering it—carry state seamlessly across screens with pre-populated read-only fields.
* **Defensive & Transparent UX:** Business rules (age eligibility, duplicate policy restrictions, grace period deadlines, 10% late penalties) are surfaced proactively in the UI before form submission.
* **Resilient Feedback States:** Every asynchronous operation (API fetches, Spring AI inference, payment transactions) provides explicit loading skeletons/spinners, empty states, inline field validation, and dismissible toast notifications.

---

## 2. Design System & Visual Tokens

### 2.1 Color Palette
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--color-primary` | `#0F4C81` | Primary brand actions, active navigation, table headers |
| `--color-primary-hover` | `#0A365C` | Hover state for primary buttons |
| `--color-secondary` | `#0D9488` | AI Recommendation accents, positive highlights |
| `--color-bg-canvas` | `#F8FAFC` | Main application background |
| `--color-bg-surface` | `#FFFFFF` | Cards, tables, form containers, modals |
| `--color-border` | `#E2E8F0` | Card borders, table dividers, input outlines |
| `--color-text-primary` | `#0F172A` | Headings, primary table values |
| `--color-text-secondary` | `#475569` | Labels, metadata, helper text |
| `--color-success` | `#15803D` / `#DCFCE7` | `ACTIVE` / `PAID` badges, confirmation alerts |
| `--color-warning` | `#B45309` / `#FEF3C7` | `PENDING` / `PARTIALLY_PAID` badges, grace period notices |
| `--color-danger` | `#B91C1C` / `#FEE2E2` | `OVERDUE` badges, 10% penalty callouts, error banners |

### 2.2 Typography & Layout Grid
* **Font Family:** `Inter`, system-ui, sans-serif (`tabular-nums` enabled for all currency, dates, and policy identifiers).
* **Layout Grid:** 12-column responsive container (`max-width: 1280px`, `24px` gutter on desktop, `16px` on mobile).
* **Navigation Shell:** Persistent top navigation bar (`64px` height) containing Brand Logo, primary route links (**Dashboard**, **Make Payment**, **Policy Search**), authenticated customer name badge, and **Logout** action.

---

## 3. Information Architecture & Route Map

| Route | View Name | Access | Primary Purpose |
| :--- | :--- | :--- | :--- |
| `/login` | Customer Login | Public | Authenticate customer credentials via Spring Security |
| `/dashboard` | Customer Dashboard | Protected | View registered policies, explore eligible catalog, trigger AI recommendations |
| `/policies/register/:productCode` | Policy Registration | Protected | Pre-populated registration form with live maturity & total payable summary |
| `/payments` | Premium Payment Manager | Protected | Lookup policy by ID, inspect installment schedule, pay single/multiple installments |
| `/policies/search` | Policy Search | Protected | Multi-criteria search (`Policy ID`, `Customer Name`, `Policy ID + DOB`) with pagination |

---

## 4. End-to-End User Flows

### Flow A: Policy Discovery & Registration
1. Customer logs in at `/login` $\rightarrow$ redirected to `/dashboard`.
2. Customer views **Registered Policies** at the top and **Available Insurance Products** below (already filtered to exclude owned products).
3. *Optional AI Path:* Customer opens the **AI Policy Advisor** panel, enters goals/term/type, and clicks **Generate Recommendations**. AI returns ranked database products with rationale and suitability tags.
4. Customer clicks **Register** on either an available catalog row or an AI recommendation row.
5. App navigates to `/policies/register/:productCode` with customer details and product terms pre-filled.
6. Customer confirms `Start Date` (defaults to today), reviews auto-calculated `Maturity Date` and `Total Premium Payable`, and submits.
7. Success banner displays the newly generated `Policy Identifier` with quick links to **Return to Dashboard** or **View Payment Schedule**.

### Flow B: Premium Payment & Late Penalty Settlement
1. Customer navigates to `/payments` and enters a `Policy Identifier`.
2. System loads the **Policy Financial Summary Card** and **Installment Schedule Table**.
3. Overdue rows (`payment_date > grace_period_end_date`) display a red `OVERDUE` badge and an explicit `+10% Late Penalty` breakdown.
4. Customer selects one or more eligible (`PENDING`, `PARTIALLY_PAID`, `OVERDUE`) installments via checkboxes and specifies payment amounts (supporting full or partial payment) and `Payment Method`.
5. Customer clicks **Pay Selected Installments** $\rightarrow$ confirmation summary updates balances and marks installments `PAID` (and parent policy fully paid if 100% settled).

---

## 5. Screen-by-Screen Wireframes & Component Specs

### 5.1 Screen 1: Customer Login (`/login`)
* **Layout:** Centered single-card layout (`max-width: 420px`) on `--color-bg-canvas`.
* **Components:**
  * HealthDekho logo & subtitle (*"Sign in to manage your policies and premiums"*).
  * `Email Address` input (required, email format validation).
  * `Password` input (required, show/hide toggle).
  * Full-width primary CTA button: **Sign In** (shows inline spinner and disables during request).
* **States:**
  * *Invalid Credentials (`401`):* Red alert banner above form: *"Invalid email or password. Please try again."*
  * *Authenticated:* Redirect immediately to `/dashboard`.

---

### 5.2 Screen 2: Customer Dashboard & AI Advisor (`/dashboard`)

```text
+-----------------------------------------------------------------------------------+
| [HealthDekho]   Dashboard   Make Payment   Policy Search       [John Doe | Logout]|
+-----------------------------------------------------------------------------------+
| Welcome back, John Doe                                 [ ✨ Get AI Recommendations ]|
+-----------------------------------------------------------------------------------+
| [Collapsible / Drawer: AI Insurance Advisor]                                      |
|  DOB: [1992-05-14]  Preferred Term: [120 mos v]  Type: [Health v]                 |
|  Insurance Goals: [Looking for family hospitalization cover with low premium... ] |
|                                                        [ Generate Recommendations ] |
|  -> AI Results Table (Product Code, Name, Type, Term, Sum Insured, Freq, Premium, |
|     AI Rationale, Suitability Badge, [Register])                                  |
+-----------------------------------------------------------------------------------+
| MY REGISTERED POLICIES (2)                                                        |
| +------------+-------------+--------+------+------------+------------+----------+ |
| | Policy ID  | Policy Name | Type   | Term | Start Date | Maturity   | Status   | |
| +------------+-------------+--------+------+------------+------------+----------+ |
| | POL-202601 | Care Shield | Health | 60m  | 2026-01-10 | 2031-01-10 | [ACTIVE] | |
| +------------+-------------+--------+------+------------+------------+----------+ |
+-----------------------------------------------------------------------------------+
| AVAILABLE INSURANCE PRODUCTS (Filtered for You)                                   |
| +------+-------------+------+------+-------------+-----------+---------+--------+ |
| | Code | Policy Name | Type | Term | Sum Insured | Frequency | Premium | Action | |
| +------+-------------+------+------+-------------+-----------+---------+--------+ |
| | P104 | Life Secure | Term | 120m | 5,000,000   | YEARLY    | 12,500  |[Register]|
| +------+-------------+------+------+-------------+-----------+---------+--------+ |
+-----------------------------------------------------------------------------------+

```

* **Registered Policies Table Columns:** `Policy Identifier`, `Policy Name`, `Policy Type`, `Policy Term`, `Policy Start Date`, `Policy Maturity Date`, `Premium Frequency`, `Premium Amount`, `Sum Insured`, `Policy Status`.
* *Empty State:* Illustrated card with message *"You haven't registered any insurance policies yet. Explore available products below or try our AI Advisor."*


* **AI Policy Recommendation Panel:**
* Inputs: `Date of Birth` (pre-filled from profile, editable), `Insurance Goals & Preferences` (textarea), `Preferred Policy Term` (optional numeric/dropdown), `Insurance Type` (optional dropdown).
* Loading State: Skeleton table rows with message *"Analyzing eligible plans based on your profile..."*
* Output Columns: `Product Code`, `Policy Name`, `Policy Type`, `Policy Term`, `Sum Insured`, `Premium Frequency`, `Premium Amount`, `Recommendation Reason` (expandable tooltip/text), `Suitability` (`HIGH` / `MEDIUM` pill), `Action` (**Register** button).


* **Available Insurance Policies Table Columns:** `Product Code`, `Policy Name`, `Policy Type`, `Policy Term`, `Sum Insured`, `Premium Frequency`, `Premium Amount`, `Action` (**Register** button).

---

### 5.3 Screen 3: Policy Registration (`/policies/register/:productCode`)

* **Layout:** Two-column split (`7 cols` Form / `5 cols` Live Financial Summary Card) on desktop; stacked on mobile.
* **Form Sections:**
1. **Customer Details (Read-Only):** `Customer Name`, `Date of Birth` (with computed age badge, e.g., `Age: 34 yrs`), `Contact Information`.
2. **Selected Plan Details (Read-Only):** `Policy Type`, `Policy Name`, `Policy Term`, `Premium Payment Frequency`, `Premium Amount`, `Sum Insured`.
3. **Policy Schedule (Interactive & Computed):**
* `Policy Start Date`: Date picker defaulting to today (`YYYY-MM-DD`).
* `Policy Maturity Date`: Auto-calculated read-only field (`Start Date + Term Months`).
* `Total Premium Payable`: Auto-calculated read-only field (`Premium Amount × Total Installments`).




* **Client-Side & Backend Validation UX:**
* Age eligibility check (`min_entry_age <= age <= max_entry_age`) displayed upfront; if ineligible, disable submit and show clear reason.
* Duplicate registration conflict (`409`) displays an inline alert linking to the existing policy.


* **Post-Registration Confirmation View:** Replaces form upon `201 Created` with a green confirmation card showing the generated `Policy Identifier`, maturity date, installment count, and CTA buttons (**Pay First Installment**, **Back to Dashboard**).

---

### 5.4 Screen 4: Premium Payment Management (`/payments`)

* **Top Search Bar:** Single search input for `Policy Identifier` + **Fetch Schedule** button (also supports auto-loading via query param `?policyNumber=...`).
* **Policy Summary Header (4-Card Metric Strip):**
* **Policy Info:** `Policy Identifier`, `Customer Name`, `Policy Name`, `Term` (`Start Date` $\rightarrow$ `Maturity Date`).
* **Total Payable:** `₹60,000.00`
* **Total Paid:** `₹20,000.00` (Green)
* **Remaining Balance:** `₹40,000.00` (Amber/Primary)


* **Premium Installment Schedule Table:**
* Columns: `Select` (Checkbox), `Installment #`, `Premium Amount`, `Due Date`, `Grace Period End Date`, `Penalty (10%)`, `Payment Status`.
* **Checkbox Rules:** Disabled for `PAID` rows; enabled for `PENDING`, `PARTIALLY_PAID`, and `OVERDUE` rows.
* **Late Penalty Visual Indicator:** If `today > grace_period_end_date` and unpaid, highlight `Grace Period End Date` in red and display calculated `10%` late fee on the outstanding amount.


* **Payment Action Bar (Sticky Footer / Card when $\ge 1$ row selected):**
* Displays selected installment numbers, editable `Amount to Pay` (defaults to full remaining amount + applicable penalty; allows partial amount $> 0$ and $\le \text{max due}$), `Payment Method` selector (`UPI`, `CARD`, `NET_BANKING`), and **Confirm Payment** button.



---

### 5.5 Screen 5: Customer Insurance Policy Search (`/policies/search`)

* **Search Filter Card:**
* `Policy Identifier` (Text input)
* `Customer Name` (Text input)
* `Date of Birth` (Date picker)
* Actions: **Search Policies** (primary button) and **Reset Filters** (ghost button).
* *Validation Rule:* If user clicks **Search Policies** with all fields empty, show inline helper message: *"Enter a Policy Identifier, Customer Name, or Policy Identifier with Date of Birth to search."*


* **Search Results Table & Pagination:**
* Columns: `Policy Identifier`, `Customer Name`, `Date of Birth`, `Policy Name`, `Policy Type`, `Policy Start Date`, `Policy Maturity Date`, `Total Premium Payable`, `Premium Payment Status`, `Total Premium Paid`, `Remaining Premium`.
* Pagination Footer: `Showing 1–10 of X policies`, page size selector (`10`, `20`, `50`), and `Previous` / `Next` controls.
* *Empty State:* *"No insurance policies matched your search criteria. Check the policy identifier or spelling and try again."*



---

## 6. Cross-Cutting UX States & Accessibility

| State / Concern | Standard Implementation |
| --- | --- |
| **Loading States** | Use skeleton loaders for initial table fetches and button-level spinners (`disabled` state) during `POST`/`PUT` mutations to prevent double submissions. |
| **Error Handling** | Map Spring `@RestControllerAdvice` `fieldErrors` directly under matching inputs; display global `403`/`404`/`409`/`500` errors via top-right dismissible toast banners. |
| **Responsive Tables** | Wrap all data tables in `overflow-x: auto` containers with sticky first columns (`Policy Identifier` / `Product Code`) on viewports `< 768px`. |
| **Accessibility (WCAG AA)** | Associate every input with an explicit `<label>`, provide `aria-live="polite"` regions for dynamic financial totals and toast alerts, and maintain $\ge 4.5:1$ contrast on all status badges. |


