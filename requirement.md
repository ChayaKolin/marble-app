# Product Requirement Document (PRD) & Technical Specification
## System Name: Kostone Marble Enterprise Order Management (ERP)
## Default System Email: kostonemarble@gmail.com

---

## 1. Executive Summary & Business Goals

Kostone Marble ERP is a highly specialized, niche-specific Enterprise Resource Planning and Order Management system designed exclusively for high-end residential and commercial marble and stone fabrication businesses. The platform guarantees end-to-end operation tracing, from initial client intake to final post-installation verification.

The application enforces a rigorous milestone-based workflow ensuring zero technical data dropouts between field measurements, factory layout cutting (תוכנית פריסה), and on-site delivery, while locking fiscal progression parameters to prevent unauthorized financial exposure.

**Language & Locale:** The entire application UI — all labels, buttons, navigation, status names, messages, notifications, error text, PDFs, and email/WhatsApp communications — is in **Hebrew (עברית)**. The interface is fully RTL (right-to-left). No English text appears to end users. Internal database enum values and API field names remain in English for technical consistency.

---

## 2. User Roles, Hierarchy, & Access Control (RBAC)

The system operates on an explicit hierarchical permission matrix, dividing administrative control dynamically. Granular per-feature permission toggles replace flat boolean flags — see the `user_permissions` schema in §5 for the full data model.

### 2.1 Role 1: Super-Admin / Owner (The Consultant)

- **System Status:** Primary Master User.
- **Permissions:** Complete global read/write/delete privileges across all datasets.
- **Core Capabilities:**
  - Create, edit, archive, and manage all Customer Accounts and Architect profiles.
  - Initialize, update, override, or cancel any Order Lifecycle state.
  - Unrestricted access to the **Master Analytics & Business Intelligence Dashboard** (detailed monthly summaries, historical revenue comparison, margin tracking, installer performance graphs).
  - Full CRUD access to the **Installation Calendar** — create, update, and delete installation events and factory prep tasks.
  - **Permission Delegation Control:** The only user capable of toggling specific feature visibility/permissions for secondary roles (e.g., granting or revoking Hotman's access to analytics, calendar, financial charts, or installer ratings).

### 2.2 Role 2: Factory Manager (Hotman)

- **System Status:** Secondary Admin User.
- **Permissions:** Operational scoped control. Bound to factory, cutting, logistics, and scheduling modules.
- **Core Capabilities:**
  - Review client measurement layout schemas.
  - Generate and upload custom cutting/slab layout blueprints (תוכנית פריסה).
  - Input explicit production commitment timelines and track SLA metrics.
  - Assign specific delivery dates and dispatch designated Installers.
  - **Analytics Constraints:** By default, hidden from advanced financial analytics, monthly margin charts, and gross business metrics. Access is explicitly unlocked via a feature flag controlled solely by the Super-Admin.
  - **Calendar Access:** Read-only view of the full Installation Calendar — enabled by default for the Factory Manager role, no toggle required. Intended to align factory production sequencing with upcoming installation dates. Write access (`MANAGE_CALENDAR`) can be granted by the Super-Admin when needed in the future.

### 2.3 Role 3: The Installer

- **System Status:** Field Mobile Agent — operates under the Hotman's operational authority but maintains a separate, independent login.
- **Authentication:** Personal credentials unique to each installer. Login scoped to mobile-optimized interface only.
- **Permissions:** Single-record execution scope — sees only their own assigned jobs.
- **Core Capabilities:**
  - View a personal daily calendar slice showing only their own assigned installations: effective delivery address (order override if set, customer default otherwise), customer contact, time window, floor/apt details, and elevator/access notes.
  - Capture real-time site adjustments or visual deviations via notes.
  - **Mobile Signature Flow (Optional):** On job completion, the installer may optionally prompt the customer to sign an on-screen Signature Canvas modal as a post-installation record. This signature is not mandatory and does not gate order completion or the 80% payment confirmation. The Consultant confirms payment separately.
- **Relationship to Hotman:** Installers are assigned by Hotman via the logistics dispatch module. They do not report directly to the Super-Admin and cannot access financial, analytics, or factory modules.

### 2.4 Role 4: The Customer

- **System Status:** External Portal User.
- **Authentication:** Passwordless magic-link. The system generates a one-time token and delivers it to the customer via Email (`kostonemarble@gmail.com`) or WhatsApp. The customer clicks the link, the token is validated, and a 7-day JWT session is issued. No password is ever created or stored for customers. Tokens are single-use and expire after 24 hours (email) or 2 hours (WhatsApp).
- **Core Capabilities:**
  - Access a secure personal portal scoped to their own orders — no cross-customer data is accessible.
  - View Order Details, real-time status tracking, and payment milestone history.
  - Review and digitally sign the Pre-Measurement Acknowledgement via the customer portal.
  - **Mandatory: Sign the Slab Layout Plan (תוכנית פריסה).** This signature is a hard production gate — the order cannot transition to `PRODUCTION` until this is captured. It is the customer's only required signature in the system.
- **Portal Access Trigger:** The Consultant can send or resend a portal invite at any time via `POST /api/v1/portal/auth/request`. A fresh token is generated and delivered; any previous unused token for that customer is invalidated.

---

## 3. Key Business Modules & Conditional Workflow Logic

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ORDER LIFECYCLE — 8-STATUS STATE MACHINE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

[QUOTATION] הצעת מחיר
  Initial price proposal prepared and sent to customer.
  total_gross_amount set as provisional estimate.
│
▼  Customer agrees. 20% deposit paid and logged via BigDecimal.
│
[CLOSED_AWAITING_MEASUREMENT] סגירה איתנו ומחכה למדידה
  Deal closed. Deposit confirmed. Installer/measurer dispatched to site.
│
▼  Field measurements uploaded. Hotman automatically notified.
│
[REVIEWING_LAYOUT] לעבור על התוכנית
  Hotman drafts the kitchen/marble cutting layout (תוכנית פריסה).
  Layout document uploaded and sent to customer portal for review.
  │
  ▼  ◄── HARD GATE: SLAB_LAYOUT_APPROVAL signature MANDATORY
  │       System refuses PRODUCTION transition if signature absent.
  │       Customer signs via portal (HTML5 Canvas → digital_signatures).
  │
[PRODUCTION] ייצור
  Signed layout dispatched to factory/sawmill.
  SLA production timer initiated against Hotman's committed deadline.
│
▼  Factory cutting complete. Marble parts ready for delivery.
│
[AWAITING_INSTALLATION] מחכה להתקנה
  Marble slabs in logistics. Installer assigned. Calendar entry auto-created.
  Installer views job on mobile app. 80% payment due on installation day.
│
├──► On-site issue found (cut correction, missing piece, re-polish)
│    │
│    ▼
│   [PENDING_REPAIR] מחכה לתיקון
│    New return-visit logistics_assignment created (is_primary = FALSE).
│    SITE_VISIT calendar event auto-generated.
│    │
│    ▼  Return visit complete, issue resolved.
│    │
│    └──► Back to [AWAITING_INSTALLATION]  (if further work needed)
│         or directly to [COMPLETED]        (if fully resolved)
│
▼  Primary installation complete. 80% payment confirmed by Consultant.
   Optional: post-installation signature captured on installer device.
│
[COMPLETED] מושלם
  Order fully done. All work and payment confirmed.
│
▼
[ARCHIVED] ארכיון
  Order moved to historical archive.

─────────────────────────────────────────────────────────────────────────────
VALID TRANSITIONS REFERENCE
─────────────────────────────────────────────────────────────────────────────
QUOTATION                → CLOSED_AWAITING_MEASUREMENT  (20% deposit paid)
CLOSED_AWAITING_MEASUREMENT → REVIEWING_LAYOUT          (measurements uploaded)
REVIEWING_LAYOUT         → PRODUCTION                   (SLAB_LAYOUT_APPROVAL signature present — MANDATORY)
PRODUCTION               → AWAITING_INSTALLATION        (factory cutting complete)
AWAITING_INSTALLATION    → COMPLETED                    (installation done, 80% confirmed)
AWAITING_INSTALLATION    → PENDING_REPAIR               (on-site issue found)
PENDING_REPAIR           → AWAITING_INSTALLATION        (return visit scheduled)
PENDING_REPAIR           → COMPLETED                    (repair done, fully resolved)
COMPLETED                → ARCHIVED                     (manual archiving by Consultant)
─────────────────────────────────────────────────────────────────────────────
```

### 3.1 Intake, Project Files & Client Management

- **Creation Engine:** Allows the Super-Admin to instantly create client profiles containing explicit fields: Customer Full Name, Primary Phone, Email Address, Architect/Designer Name, and Architect Contact Info.
- **Site Address (Mandatory):** A complete site address is required on every customer profile — Street Address, City, Floor, and Apartment Number. This becomes the default delivery address for every order created under that customer.
- **Order Address Inheritance & Override:** When a new Order is created, the site address is automatically inherited from the customer record and pre-filled in the order form. The Consultant may edit any address field at the order level to redirect delivery to a different location (e.g., a second property). A `NULL` order-level address field means "use the customer default." The effective address is resolved as: `COALESCE(order.site_address, customer.site_address)`.
- **Persistent Document Cloud:** Native support for high-resolution file attachments including original architectural blueprints, apartment layout photos, and technical specification sheets.

### 3.2 Technical Customization Metrics

The system logs highly granular data schemas with strict formatting rules:

- **Stone Properties:** Material Type/Code, Finish Type (Glossy, Polished, Matte, Honed, Brushed), and exact Square Meters (m²).
- **Profile Detailing:** Detailed fields for Counter Edge Profiling (עיבוי קאנט) and Specialized Water Traps/Edges (קאנט מים).
- **Sink Specifications:** Comprehensive matrix tracking Brand, Model Name, exact Sizing/Width dimensions, Colorway, and structural Mounting Profiles (Enum: `UNDERMOUNT`, `FLUSH_MOUNT`).
- **Fixed Base Fees:** Automatic structural line-item injection for Cooktop Base Enclosures (הכנסה בסיס לסירים) locked at an immutable rate of **200 NIS** per installation unit.

### 3.3 Logistics Constraints & Cost Allocations

- **Structural Flags:** Physical infrastructure fields mapping building access, including elevator dimensions, stairwell width anomalies, and parking proximity.
- **Legal & Cost Exclusions:** The system must hard-code and visually append an omnipresent disclaimer across all customer-facing invoices, quotes, and contract sheets:
  > **"Crane services (מנוף) are NOT included in the project pricing and are arranged and funded exclusively at the customer's expense."**

### 3.4 Strict Financial Ledger Rules

- All financial parameters use Java `BigDecimal` to enforce precise multi-currency decimal tracking without floating-point calculation drift.
- **Milestone 1:** 20% Deposit. The system acts as a hard gate. The project state cannot transition from `QUOTATION` to `CLOSED_AWAITING_MEASUREMENT` until exactly 20.00% of the provisional gross value is marked as paid in the ledger database.
- **Milestone 2:** 80% Balance. This remaining sum is flagged as due upon the exact day of physical installation. The field installer's interface requires confirmation of payment intake or verification of payment prior to releasing digital completion screens.

### 3.5 Signature Rules Summary

| Signature | Category | Who Signs | Where | Mandatory? | Gates Transition |
|---|---|---|---|---|---|
| Pre-Measurement Disclaimer | `PRE_MEASUREMENT_DISCLAIMER` | Customer | Customer Portal | Yes | `QUOTATION` → `CLOSED_AWAITING_MEASUREMENT` acknowledgement |
| Slab Layout Approval | `SLAB_LAYOUT_APPROVAL` | Customer | Customer Portal | **Yes — hard gate** | `REVIEWING_LAYOUT` → `PRODUCTION` blocked until present |
| Post-Installation Record | `FINAL_POST_INSTALLATION` | Customer (on installer device) | Installer Mobile App | **No — optional** | Record only; does not gate any transition |

### 3.6 Measurement & Layout Lifecycle Rules


- **Pre-Measurement Gate:** When the order is in `CLOSED_AWAITING_MEASUREMENT`, the Customer Portal displays a mandatory acknowledgement dialog before site visit actions are triggered: *"Final price, sizing, and specific details are determined exclusively AFTER professional field measurement."* Captured as `PRE_MEASUREMENT_DISCLAIMER` in `digital_signatures`.
- **Post-Measurement Blueprinting:** Field measurements are uploaded directly to the project directory, advancing the order to `REVIEWING_LAYOUT` and automatically alerting Hotman via a system notification event.
- **The Cut-Sheet Gate — MANDATORY Signature (תוכנית פריסה):** While in `REVIEWING_LAYOUT`, Hotman maps the field measurements onto physical slab cuts and uploads the resulting Layout Document to the customer portal. Production and fabrication are programmatically hard-locked: the system must refuse any attempt to transition to `PRODUCTION` if a `SLAB_LAYOUT_APPROVAL` record is absent from `digital_signatures` for this order. This is the only signature strictly required to advance the order lifecycle. Once the customer signs via the portal, the order advances to `PRODUCTION`.

### 3.7 SLA and Fulfillment Tracking

- **Hotman Production SLA:** Upon the order entering `PRODUCTION` (i.e., after `SLAB_LAYOUT_APPROVAL` signature is captured), a strict, decrementing SLA timer initiates based on the specific calendar deadline committed by Hotman. The timer is visible on Hotman's SLA Alert Deck.
- **Dispatch Assignment:** When the order reaches `AWAITING_INSTALLATION`, Hotman assigns an installer and delivery date. Creating a dispatch assignment automatically generates a linked `calendar_events` entry. The order remains in `AWAITING_INSTALLATION` until the Consultant confirms installation complete and 80% payment received.
- **PENDING_REPAIR Flow:** If an on-site issue is found (cut correction, missing backsplash, re-polishing), the Consultant moves the order to `PENDING_REPAIR`. A new `logistics_assignment` with `is_primary = FALSE` is created for the return visit, auto-generating a `SITE_VISIT` calendar event. On return visit completion, the Consultant advances the order to `AWAITING_INSTALLATION` (if further work remains) or directly to `COMPLETED`.
- **Multiple Assignments:** An order may accumulate multiple `logistics_assignments` through PENDING_REPAIR cycles. The first (`is_primary = TRUE`) represents the main installation; all subsequent (`is_primary = FALSE`) represent repair/return visits. Only the primary completion triggers the 80% payment confirmation flow.
- **Field Handshake (Optional):** Post-installation, the Installer app surfaces an optional signature canvas. If the customer is present and willing, the installer captures a `FINAL_POST_INSTALLATION` signature as a record. This is not a hard gate — the Consultant confirms 80% payment and marks completion independently of this signature.

### 3.8 Installation Calendar & Scheduling

The calendar is a cross-role scheduling hub that surfaces installation events and factory prep tasks in a unified view. Access is role-gated and permission-controlled.

**Calendar Permission Matrix:**

| Action | Consultant | Hotman | Installer |
|---|---|---|---|
| View all events | Always | Always (role default) | Own jobs only |
| Create events | Always | Future: via `MANAGE_CALENDAR` toggle | Never |
| Edit / Delete events | Always | Future: via `MANAGE_CALENDAR` toggle | Never |

**Permission Logic:**

- **View:** Both Consultant and Hotman have read access to the full calendar by default — no toggle required. This is enforced at the role level, not the permission table.
- **Manage (write):** Only Consultant can create, edit, or delete events. The `MANAGE_CALENDAR` feature flag exists in `user_permissions` but defaults to `false` for Hotman. When the business is ready to grant Hotman write access, the Consultant flips one toggle — no code changes needed.
- **Installers:** Always scoped to `assigned_to_user_id = current_user`. No toggle path to broader access.
- **Financial data:** Never attached to calendar events visible to Hotman or Installers. Only Consultant sees the linked payment balance on event detail panels.

**Key Use Cases:**

- Consultant schedules an installation → linked Installer notified on mobile → appears on Hotman's factory planning view.
- Hotman sees 4 installations booked for next Tuesday → calibrates SLA timers to ensure cutting completes by Monday.
- Installer opens app on job day → sees only their events: address, customer contact, order context, time window.

---

## 4. Master Analytics & Data Visualizations (Super-Admin Exclusive)

The Master Dashboard is explicitly optimized for executive review. It contains interactive data visualization layers built using highly responsive chart frameworks.

### 4.1 Monthly Executive Summaries

- **Gross Financial Yield:** Clear tracking of overall revenue generated per calendar month.
- **Inflow vs. Receivables Pipeline:** Comparative bar charts showing actual money collected (20% deposits + completed 80% balances) against projected income locked in the pipeline.
- **Material Volumetric Distribution:** Pie charts tracking the surface volume (m²) processed per stone model/code to optimize factory raw-slab purchasing decisions.

### 4.2 Factory Throughput & Logistics Efficiency Metrics

- **SLA Compliance Rates:** Time-series line charts tracking Hotman's actual production time against the initially committed factory SLA hours.
- **Installer Quality Ratings:** Performance tracking lists indicating structural issue flags or notes recorded post-installation per installer team.

---

## 5. Granular Database Schema (PostgreSQL Relational Mapping)

### 5.1 Data Safety & Integrity Rules

**Soft Delete (Mandatory — orders & customers)**
The `orders` and `customers` tables must never be hard-deleted. Both tables carry a `deleted_at TIMESTAMP WITH TIME ZONE` column (nullable). A `NULL` value means the record is active. A non-`NULL` value means it has been soft-deleted and must be hidden from all UI views.

- All application queries against `orders` and `customers` must include a `WHERE deleted_at IS NULL` filter by default.
- The Super-Admin can restore any soft-deleted record by setting `deleted_at = NULL`.
- A dedicated "Trash" view in the Consultant dashboard lists all soft-deleted orders and customers with a restore action.
- No `DELETE FROM orders` or `DELETE FROM customers` SQL is ever issued by the application layer. Any such operation is considered a bug.

**Foreign Key Protection**
All foreign keys that reference `orders` or `customers` use `ON DELETE RESTRICT`. This means the database will refuse any attempt to hard-delete a parent row if child rows exist — providing a second safety layer behind the soft-delete policy. The only exception is `calendar_events.related_order_id`, which uses `ON DELETE SET NULL` because calendar events are non-critical references that should survive independently.

```sql
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN_OWNER', 'FACTORY_MANAGER', 'INSTALLER');
CREATE TYPE order_status AS ENUM (
    'QUOTATION',                -- הצעת מחיר       — Initial price proposal sent to customer
    'CLOSED_AWAITING_MEASUREMENT', -- סגירה איתנו ומחכה למדידה — Deal signed, deposit paid, awaiting site measurement
    'REVIEWING_LAYOUT',         -- לעבור על התוכנית — Measurements in, layout drafted; SLAB_LAYOUT_APPROVAL signature required before advancing
    'PRODUCTION',               -- ייצור            — Approved layout sent to factory/sawmill for cutting
    'AWAITING_INSTALLATION',    -- מחכה להתקנה      — Marble parts ready; awaiting installation date
    'PENDING_REPAIR',           -- מחכה לתיקון      — On-site issue found; return visit scheduled
    'COMPLETED',                -- מושלם            — Installation fully done
    'ARCHIVED'                  -- ארכיון           — Post-completion archive
);
CREATE TYPE sink_mount_style AS ENUM ('UNDERMOUNT', 'FLUSH_MOUNT');
CREATE TYPE signature_category AS ENUM (
    'PRE_MEASUREMENT_DISCLAIMER', 'SLAB_LAYOUT_APPROVAL', 'FINAL_POST_INSTALLATION'
);
-- VIEW_CALENDAR is not a toggle — it is role-default for FACTORY_MANAGER.
-- MANAGE_CALENDAR is the write-access flag, default false for FACTORY_MANAGER,
-- grantable by SUPER_ADMIN_OWNER when the business is ready to expand Hotman's access.
CREATE TYPE feature_key AS ENUM (
    'VIEW_ANALYTICS',
    'VIEW_FINANCIAL_CHARTS',
    'MANAGE_CALENDAR',
    'VIEW_INSTALLER_RATINGS',
    'EXPORT_REPORTS'
);
CREATE TYPE calendar_event_type AS ENUM (
    'INSTALLATION', 'PREP_TASK', 'MEASUREMENT', 'SITE_VISIT'
);

-- Core users table. analytics_visible boolean removed in favour of user_permissions.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'INSTALLER',
    phone_number VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Granular, auditable permission flags per user per feature.
-- Only SUPER_ADMIN_OWNER rows in users may appear in granted_by.
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature feature_key NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT FALSE,
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, feature)
);

-- Soft delete: never hard-DELETE. Set deleted_at to flag as deleted; NULL = active.
-- All queries must filter WHERE deleted_at IS NULL.
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    email_address VARCHAR(150) NOT NULL,
    -- Mandatory default delivery address for all orders under this customer.
    site_address VARCHAR(300) NOT NULL,
    site_city VARCHAR(100) NOT NULL,
    site_floor INT,
    site_apt VARCHAR(20),
    architect_name VARCHAR(150),
    architect_phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Soft delete: never hard-DELETE. Set deleted_at to flag as deleted; NULL = active.
-- All queries must filter WHERE deleted_at IS NULL.
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'QUOTATION',
    -- Address override: NULL on any field means inherit from customers.site_*.
    -- Effective address = COALESCE(orders.site_*, customers.site_*).
    site_address VARCHAR(300),
    site_city VARCHAR(100),
    site_floor INT,
    site_apt VARCHAR(20),
    -- Logistics access constraints specific to this delivery site.
    elevator_width_meters NUMERIC(4,2),
    elevator_height_meters NUMERIC(4,2),
    crane_required BOOLEAN NOT NULL DEFAULT FALSE,
    total_gross_amount NUMERIC(12,2) NOT NULL,
    factory_sla_deadline TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE material_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    marble_model_code VARCHAR(100) NOT NULL,
    finish_type VARCHAR(50) NOT NULL,
    square_meters NUMERIC(6,2) NOT NULL,
    counter_edge_detailing VARCHAR(255),
    water_edge_required BOOLEAN NOT NULL DEFAULT FALSE,
    cooktop_base_fee NUMERIC(6,2) NOT NULL DEFAULT 200.00
);

CREATE TABLE sink_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    brand VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    width_mm INT NOT NULL,
    height_mm INT NOT NULL,
    depth_mm INT NOT NULL,
    color VARCHAR(50) NOT NULL,
    mounting_style sink_mount_style NOT NULL DEFAULT 'UNDERMOUNT'
);

-- Multiple rows per order are valid (return visits).
-- is_primary = TRUE: main installation — completion triggers 80% payment milestone.
-- is_primary = FALSE: return visit — completion logged only, no financial event.
-- Auto-generated calendar_events type: is_primary → INSTALLATION, else SITE_VISIT.
CREATE TABLE logistics_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    installer_user_id UUID NOT NULL REFERENCES users(id),
    delivery_scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    installer_notes TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Installation calendar events. INSTALLATION type is auto-created from logistics_assignments.
-- assigned_to_user_id NULL means the event is visible to all authorized roles.
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    event_type calendar_event_type NOT NULL,
    related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    related_logistics_id UUID REFERENCES logistics_assignments(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    amount_allocated NUMERIC(12,2) NOT NULL,
    milestone_tier INT NOT NULL CHECK (milestone_tier IN (1, 2)), -- 1 = 20% Deposit, 2 = 80% Balance
    is_cleared BOOLEAN NOT NULL DEFAULT FALSE,
    cleared_at TIMESTAMP WITH TIME ZONE
);

-- Magic-link tokens for customer portal access.
-- Only the SHA-256 hash is stored — the plain token is sent to the customer and never persisted.
-- On verify: hash the incoming token, look up by token_hash WHERE used_at IS NULL AND expires_at > NOW().
-- On match: set used_at = NOW() and issue a JWT. Any previous unused token for the same customer
-- should be invalidated (used_at stamped) when a new one is generated.
CREATE TABLE customer_portal_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    delivery_channel VARCHAR(10) NOT NULL CHECK (delivery_channel IN ('EMAIL', 'WHATSAPP')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE digital_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    category signature_category NOT NULL,
    signature_vector_data TEXT NOT NULL,
    ip_address VARCHAR(45),
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Technical Stack & Architecture

### 6.1 Frontend (UI Layer)

- **Engine:** React 19 via Vite runtime compilation, typed via strict TypeScript.
- **Language & Direction:** Full Hebrew (עברית) UI. The root HTML element must declare `<html dir="rtl" lang="he">`. All component layouts, paddings, margins, flex directions, and icon placements must respect RTL flow. TailwindCSS RTL variant (`rtl:`) is used for any directional overrides.
- **Font:** [Rubik](https://fonts.google.com/specimen/Rubik) via Google Fonts — designed for Hebrew with excellent RTL readability and a clean modern style appropriate for a professional ERP. Applied globally as the base font family.
- **Locale Settings:** Date format `DD/MM/YYYY` (Israeli standard). Currency display `₪` prefix (NIS). Numbers formatted with comma thousands separator.
- **Design Framework:** TailwindCSS with modular component layouts optimized for mobile field screens (Installer) and widescreen analytics views (Consultant). All Tailwind directional utilities (`pl-`, `pr-`, `ml-`, `mr-`, `text-left`, `text-right`, `rounded-r-`, `rounded-l-`) reviewed for RTL correctness.
- **Signatures:** HTML5 Canvas capture wrappers parsing interaction maps to compressed base64 payloads.
- **Calendar Component:** Full-month and week-view calendar UI rendered RTL. Role-aware rendering: Consultant sees all events with full CRUD controls; Hotman sees all events in read-only mode (role default, no toggle required); Installer sees a personal daily list of their own jobs only.

### 6.2 Backend (Service Layer)

- **Framework:** Java 21 / Spring Boot 3.x.
- **Data Accuracy Protection:** Code policies mandate `java.math.BigDecimal` for structural dimensions, metrics, costs, and fees. Floating-point primitives (`float`, `double`) are rejected by lint checkers.
- **Security:** Stateless JWT authentication. Permission claims (`granted_features[]`) are encoded into the token at login, read by Spring Security method-level guards (`@PreAuthorize`). Feature flags are re-evaluated at each login — no stale token risk.
- **Calendar Automation:** On `logistics_assignments` INSERT, a database trigger (or application-layer listener) automatically creates a linked `calendar_events` row. Event type is determined by `is_primary`: `TRUE` → `INSTALLATION`, `FALSE` → `SITE_VISIT`.
- **Notifications & Automation Engine:** Integrated Mail Sender profiles bound to `kostonemarble@gmail.com`. All outbound email and WhatsApp messages are written in Hebrew. Automated systems convert layout templates into transactional PDFs (Hebrew text, RTL layout) and trigger outbound alerts via Twilio/WhatsApp API wrappers.

### 6.3 Database & Hosting

- **DB Engine:** Production PostgreSQL enforcing relational keys and transactional ACID safety boundaries.
- **Hosting Cloud:** Railway.com, leveraging native container buildpacks and persistent storage for uploaded project assets and cut sheets.

---

## 7. OpenAPI 3.0 API Specification Snippet

```yaml
openapi: 3.0.3
info:
  title: Kostone Marble ERP API Engine
  version: 1.0.0
  description: Core backend service routing for Kostone Marble order management and factory systems.
paths:
  /api/v1/customers:
    post:
      summary: Add a new client account
      description: Accessible by Super-Admin to create customer metadata profiles.
      operationId: createCustomer
      responses:
        '201':
          description: Customer record created successfully.

  /api/v1/logistics/assignments:
    get:
      summary: Fetch active logistics dispatch matrix
      description: Returns schedules, routing directions, and technical profiles for installers.
      responses:
        '200':
          description: Operational tracking matrix payload returned.

  /api/v1/installers/{id}/signoff:
    put:
      summary: Mark job complete and optionally capture post-installation signature
      description: >
        Invoked by the Installer app to mark a logistics assignment as complete.
        The post-installation signature (signatureData) is OPTIONAL — omitting it is valid.
        Marking the job complete does not itself close the order or trigger the 80% payment
        milestone; the Consultant confirms payment separately. If signatureData is provided,
        a FINAL_POST_INSTALLATION record is written to digital_signatures as a record only.
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                signatureData:
                  type: string
                  description: Optional. Base64 canvas payload of the customer's post-installation signature.
                installerNotes:
                  type: string
      responses:
        '200':
          description: Job marked complete. Signature recorded if provided.

  /api/v1/portal/auth/request:
    post:
      summary: Request a magic-link for customer portal access
      description: >
        Accessible by SUPER_ADMIN_OWNER only. Generates a one-time token, invalidates any
        existing unused token for this customer, and delivers the magic-link via the specified
        channel. The plain token is never stored — only its SHA-256 hash.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - customerId
                - channel
              properties:
                customerId:
                  type: string
                  format: uuid
                channel:
                  type: string
                  enum: [EMAIL, WHATSAPP]
      responses:
        '204':
          description: Token generated and delivered. No token value returned in response.
        '404':
          description: Customer not found.

  /api/v1/portal/auth/verify:
    get:
      summary: Validate a magic-link token and issue a portal JWT
      description: >
        Public endpoint (no auth required). Accepts the plain token from the magic-link URL.
        Hashes it, looks up a matching unexpired unused row in customer_portal_tokens.
        On match: marks token used, returns a 7-day JWT with role CUSTOMER.
        On failure: returns 401 (expired, already used, or not found — same error, no enumeration).
      parameters:
        - name: token
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Valid token. Returns signed JWT.
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
        '401':
          description: Token invalid, expired, or already used.

  /api/v1/portal/orders:
    get:
      summary: Fetch all orders for the authenticated customer
      description: CUSTOMER role only. Returns all orders linked to the JWT's customer_id.
      responses:
        '200':
          description: List of the customer's orders with status and payment milestone state.
        '403':
          description: Not a customer token.

  /api/v1/calendar/events:
    get:
      summary: Fetch calendar events for the authenticated user
      description: >
        Returns events scoped by role.
        SUPER_ADMIN_OWNER: all events, full detail including linked financial data.
        FACTORY_MANAGER: all events, read-only, no financial data. Access is role-default — no permission toggle required.
        INSTALLER: only events where assigned_to_user_id matches their own user ID.
      responses:
        '200':
          description: List of CalendarEvent objects.
    post:
      summary: Create a new calendar event
      description: >
        Requires SUPER_ADMIN_OWNER role OR MANAGE_CALENDAR permission.
        Currently only SUPER_ADMIN_OWNER passes this check.
        Granting MANAGE_CALENDAR to FACTORY_MANAGER via the permission toggle will unlock this endpoint for Hotman without any code changes.
      responses:
        '201':
          description: Calendar event created.
        '403':
          description: Insufficient permissions. MANAGE_CALENDAR not granted.

  /api/v1/calendar/events/{id}:
    put:
      summary: Update a calendar event
      description: Requires SUPER_ADMIN_OWNER role OR MANAGE_CALENDAR permission.
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Event updated.
        '403':
          description: Insufficient permissions.
    delete:
      summary: Delete a calendar event
      description: Requires SUPER_ADMIN_OWNER role OR MANAGE_CALENDAR permission.
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Event deleted.
        '403':
          description: Insufficient permissions.

  /api/v1/admin/permissions/{userId}:
    put:
      summary: Toggle a feature permission for a user
      description: Super-Admin only. Grants or revokes a named feature flag for the target user.
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - feature
                - granted
              properties:
                feature:
                  type: string
                  enum: [VIEW_ANALYTICS, VIEW_FINANCIAL_CHARTS, MANAGE_CALENDAR, VIEW_INSTALLER_RATINGS, EXPORT_REPORTS]
                granted:
                  type: boolean
      responses:
        '200':
          description: Permission updated. Returns updated permission record.
        '403':
          description: Only SUPER_ADMIN_OWNER may modify permissions.
```

---

## 8. UI Architecture & Screen Blueprint Layouts

Following Claude Design component foundations: whitespace, card groupings, distinct typography hierarchy, dark slate/neutral colorway accented by clean emerald details for financial clarity.

**All visible text is in Hebrew. Layouts flow right-to-left.** Navigation sits on the right side. Icons that imply direction (arrows, chevrons, back buttons) are mirrored for RTL. The Rubik font is applied globally.

### 8.1 Master Analytics Screen (Super-Admin Only)

- **Header Section:** Large numeric indicators — Monthly Total Revenue, Open Production Backlog count, Total Outstanding Receivables.
- **Primary Section Left:** Interactive line chart plotting current month cash flow vs. historical month performance.
- **Primary Section Right:** Material Processing Table — stone models (m²) sorted by processing volumes.
- **Hotman Permission Panel:** A persistent card listing all toggleable feature flags for the Hotman user. Each row shows the feature name, current state, and a toggle switch. Changing a toggle fires `PUT /api/v1/admin/permissions/{userId}` immediately.

  ```
  Hotman Permissions
  ─────────────────────────────────────────────────────
  [ ] View Revenue Analytics              default: OFF
  [ ] View Financial Charts               default: OFF
  [ ] Manage Calendar (create/edit)       default: OFF  ← flip to give write access later
  [ ] View Installer Performance Ratings  default: OFF
  [ ] Export Reports                      default: OFF
  ─────────────────────────────────────────────────────
  Note: Hotman always has read access to the calendar
  and SLA metrics — those are role defaults, not toggles.
  ```

### 8.2 Factory Matrix View (Hotman View)

- **SLA Alert Deck:** Grid of active production cards with decrementing colored progress timers indicating remaining hours before the cutting deadline expires.
- **Actionable Blueprints Panel:** File upload container — Hotman views field measurements and uploads compiled layout PDFs (תוכנית פריסה) for customer portal dispatch.
- **Calendar Preview Strip:** A compact weekly strip at the top of the Hotman view showing upcoming installations. Always visible — no permission toggle required. Helps Hotman calibrate the SLA deck against real delivery pressure. Events are read-only from this view.

### 8.3 Installation Calendar View

```
┌────────────────────────────────────────────────────────────────┐
│  JUNE 2026                              [Month] [Week] [Day]   │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┤
│ SUN  │ MON  │ TUE  │ WED  │ THU  │ FRI  │  SAT                 │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────────────────┤
│      │  1   │  2   │  3   │  4   │  5   │   6                  │
│      │      │ [📦] │      │ [🔧] │      │                      │
│      │      │ Cohen│      │ Levy │      │                      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────────────────┤
│  7   │  8   │  9   │ 10   │ 11   │ 12   │  13                  │
│      │ [📦] │      │      │ [📦] │      │                      │
│      │ Brm  │      │      │ Katz │      │                      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────────────────────┘

  📦 = INSTALLATION event    🔧 = PREP_TASK event

  CONSULTANT VIEW:  Full CRUD. Click event → order details + financials.
  HOTMAN VIEW:      Read-only (role default, no toggle needed).
                    Click event → order details only. No financials. No edit controls.
                    Future: flip MANAGE_CALENDAR toggle → full CRUD unlocks.
  INSTALLER VIEW:   Personal daily list only. No month grid. Own jobs only.
```

- Clicking an installation event opens a side panel with: Customer name, effective delivery address (floor + apt included), installer assigned, order status, elevator/access notes, and (for Consultant only) outstanding payment balance and any order-level notes.
- Creating a new event (Consultant only) opens a modal: title, type, related order lookup, date/time, assignee.

---

## 9. Railway.com Cloud Deployment Roadmap

### 9.1 Environment Variables Matrix Configuration

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://<railway-provided-host>:<port>/kostonemarble_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=${{Postgres.POSTGRES_PASSWORD}}
KOSTONE_SYSTEM_EMAIL=kostonemarble@gmail.com
JWT_SIGNING_KEY=${{REVENUE_SECURITY_CIPHER_KEY}}
STORAGE_BUCKET_ENDPOINT=https://storage.railway.app/kostonemarble-assets
```

### 9.2 Build & Execution Blueprint (`Dockerfile`)

```dockerfile
FROM eclipse-temurin:21-jdk-jammy AS build-engine
WORKDIR /workspace
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
VOLUME /tmp
COPY --from=build-engine /workspace/target/*.jar app.jar
ENTRYPOINT ["java","-Dserver.port=${PORT}","-jar","/app.jar"]
```

### 9.3 Database Migration Flow

All structural modifications must utilize Flyway migration files located inside `/src/main/resources/db/migration`. Railway's deployment hook parses migration files sequentially on application startup prior to routing traffic to ensure zero database schema downtime.

### 9.4 Automated Database Backups

The production PostgreSQL instance must have automated daily backups enabled with a minimum **30-day retention period**. No order or customer data may ever be unrecoverable.

**Railway.com configuration:**
- Enable the Railway PostgreSQL plugin's built-in backup schedule (daily snapshots).
- Retain a minimum of 30 daily snapshots at all times.
- Backup success/failure alerts must be routed to `kostonemarble@gmail.com`.

**Recovery procedure:**
- In the event of accidental data loss, restore from the most recent clean snapshot via the Railway dashboard.
- Before restoring, verify the target snapshot's timestamp against the incident window to select the correct restore point.
- The soft-delete mechanism (§5.1) is the first line of defence — a full restore is only needed if data was corrupted or the database itself was damaged.

**Backup scope:** Full database snapshots (all tables, all rows including soft-deleted records). Soft-deleted rows must be preserved in backups so they remain restorable by the Super-Admin.
