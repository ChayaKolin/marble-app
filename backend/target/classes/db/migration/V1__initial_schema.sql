-- =============================================================================
-- Kostone Marble ERP — Initial Schema
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN_OWNER',
    'FACTORY_MANAGER',
    'INSTALLER'
);

CREATE TYPE order_status AS ENUM (
    'QUOTATION',                   -- הצעת מחיר          — Initial price proposal sent to customer
    'CLOSED_AWAITING_MEASUREMENT', -- סגירה ומחכה למדידה  — Deal signed, deposit paid, awaiting site measurement
    'REVIEWING_LAYOUT',            -- לעבור על התוכנית    — Layout drafted; SLAB_LAYOUT_APPROVAL signature required before advancing
    'PRODUCTION',                  -- ייצור               — Approved layout sent to factory/sawmill for cutting
    'AWAITING_INSTALLATION',       -- מחכה להתקנה         — Marble parts ready; awaiting installation date
    'PENDING_REPAIR',              -- מחכה לתיקון         — On-site issue found; return visit scheduled
    'COMPLETED',                   -- מושלם               — Installation fully done
    'ARCHIVED'                     -- ארכיון              — Post-completion archive
);

CREATE TYPE sink_mount_style AS ENUM (
    'UNDERMOUNT',
    'FLUSH_MOUNT'
);

CREATE TYPE signature_category AS ENUM (
    'PRE_MEASUREMENT_DISCLAIMER',  -- Customer acknowledges provisional pricing before measurement
    'SLAB_LAYOUT_APPROVAL',        -- MANDATORY: blocks REVIEWING_LAYOUT → PRODUCTION until captured
    'FINAL_POST_INSTALLATION'      -- OPTIONAL: post-installation record on installer device
);

-- VIEW_CALENDAR is not a toggle — it is role-default for FACTORY_MANAGER.
-- MANAGE_CALENDAR is the write-access flag (default false for FACTORY_MANAGER),
-- grantable by SUPER_ADMIN_OWNER when ready to expand Hotman's access.
CREATE TYPE feature_key AS ENUM (
    'VIEW_ANALYTICS',
    'VIEW_FINANCIAL_CHARTS',
    'MANAGE_CALENDAR',
    'VIEW_INSTALLER_RATINGS',
    'EXPORT_REPORTS'
);

CREATE TYPE calendar_event_type AS ENUM (
    'INSTALLATION',  -- Auto-created from logistics_assignments where is_primary = TRUE
    'PREP_TASK',
    'MEASUREMENT',
    'SITE_VISIT'     -- Auto-created from logistics_assignments where is_primary = FALSE
);

-- -----------------------------------------------------------------------------
-- TASK 2.2 — users
-- analytics_visible boolean removed in favour of user_permissions table.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(100) UNIQUE NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role    NOT NULL DEFAULT 'INSTALLER',
    phone_number  VARCHAR(30)  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TASK 2.3 — user_permissions
-- Granular, auditable permission flags per user per feature.
-- Only SUPER_ADMIN_OWNER users may appear in granted_by.
-- -----------------------------------------------------------------------------
CREATE TABLE user_permissions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature    feature_key NOT NULL,
    granted    BOOLEAN     NOT NULL DEFAULT FALSE,
    granted_by UUID        NOT NULL REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, feature)
);

-- -----------------------------------------------------------------------------
-- TASK 2.4 — customers
-- Soft delete: never hard-DELETE. Set deleted_at to flag; NULL = active.
-- All queries must filter WHERE deleted_at IS NULL.
-- -----------------------------------------------------------------------------
CREATE TABLE customers (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     VARCHAR(150) NOT NULL,
    phone_number  VARCHAR(30)  NOT NULL,
    email_address VARCHAR(150) NOT NULL,
    -- Mandatory default delivery address for all orders under this customer.
    site_address  VARCHAR(300) NOT NULL,
    site_city     VARCHAR(100) NOT NULL,
    site_floor    INT,
    site_apt      VARCHAR(20),
    architect_name  VARCHAR(150),
    architect_phone VARCHAR(30),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- TASK 2.5 — orders
-- Soft delete: never hard-DELETE. Set deleted_at to flag; NULL = active.
-- Address override: NULL on any field = inherit from customers.site_*.
-- Effective address = COALESCE(orders.site_*, customers.site_*).
-- All FK constraints use ON DELETE RESTRICT.
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id            UUID         NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status                 order_status NOT NULL DEFAULT 'QUOTATION',
    -- Address override: NULL means inherit from customer's site_* fields.
    site_address           VARCHAR(300),
    site_city              VARCHAR(100),
    site_floor             INT,
    site_apt               VARCHAR(20),
    -- Logistics access constraints specific to this delivery site.
    elevator_width_meters  NUMERIC(4,2),
    elevator_height_meters NUMERIC(4,2),
    crane_required         BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Financial (all BigDecimal at application layer — no float/double).
    total_gross_amount     NUMERIC(12,2) NOT NULL,
    factory_sla_deadline   TIMESTAMPTZ,
    notes                  TEXT,
    created_by_user_id     UUID         NOT NULL REFERENCES users(id),
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at             TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- TASK 2.6 — material_specifications & sink_specifications
-- ON DELETE RESTRICT: orders must never be hard-deleted while specs exist.
-- -----------------------------------------------------------------------------
CREATE TABLE material_specifications (
    id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id               UUID          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    marble_model_code      VARCHAR(100)  NOT NULL,
    finish_type            VARCHAR(50)   NOT NULL,
    square_meters          NUMERIC(6,2)  NOT NULL,
    counter_edge_detailing VARCHAR(255),
    water_edge_required    BOOLEAN       NOT NULL DEFAULT FALSE,
    cooktop_base_fee       NUMERIC(6,2)  NOT NULL DEFAULT 200.00
);

CREATE TABLE sink_specifications (
    id             UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID            NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    brand          VARCHAR(100)    NOT NULL,
    model_name     VARCHAR(100)    NOT NULL,
    width_mm       INT             NOT NULL,
    height_mm      INT             NOT NULL,
    depth_mm       INT             NOT NULL,
    color          VARCHAR(50)     NOT NULL,
    mounting_style sink_mount_style NOT NULL DEFAULT 'UNDERMOUNT'
);

-- -----------------------------------------------------------------------------
-- TASK 2.7 — logistics_assignments
-- Multiple rows per order are valid (primary install + return visits).
-- is_primary = TRUE  → main installation, triggers 80% payment on completion.
-- is_primary = FALSE → return visit (PENDING_REPAIR), no payment trigger.
-- Auto-generates calendar_events: is_primary=TRUE → INSTALLATION, FALSE → SITE_VISIT.
-- -----------------------------------------------------------------------------
CREATE TABLE logistics_assignments (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    installer_user_id       UUID        NOT NULL REFERENCES users(id),
    delivery_scheduled_date TIMESTAMPTZ NOT NULL,
    is_primary              BOOLEAN     NOT NULL DEFAULT TRUE,
    installer_notes         TEXT,
    is_completed            BOOLEAN     NOT NULL DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- TASK 2.8 — calendar_events
-- INSTALLATION type auto-created from logistics_assignments via app-layer listener.
-- related_order_id uses ON DELETE SET NULL (calendar events survive independently).
-- assigned_to_user_id NULL = visible to all authorized roles.
-- -----------------------------------------------------------------------------
CREATE TABLE calendar_events (
    id                   UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    title                VARCHAR(200)        NOT NULL,
    event_type           calendar_event_type NOT NULL,
    related_order_id     UUID                REFERENCES orders(id) ON DELETE SET NULL,
    related_logistics_id UUID                REFERENCES logistics_assignments(id) ON DELETE SET NULL,
    assigned_to_user_id  UUID                REFERENCES users(id) ON DELETE SET NULL,
    event_date           DATE                NOT NULL,
    start_time           TIME,
    end_time             TIME,
    notes                TEXT,
    created_by           UUID                NOT NULL REFERENCES users(id),
    created_at           TIMESTAMPTZ         NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TASK 2.9 — financial_ledger
-- milestone_tier: 1 = 20% Deposit (gates QUOTATION → CLOSED_AWAITING_MEASUREMENT)
--                 2 = 80% Balance  (confirmed by Consultant to complete order)
-- -----------------------------------------------------------------------------
CREATE TABLE financial_ledger (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID         NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    amount_allocated NUMERIC(12,2) NOT NULL,
    milestone_tier   INT          NOT NULL CHECK (milestone_tier IN (1, 2)),
    is_cleared       BOOLEAN      NOT NULL DEFAULT FALSE,
    cleared_at       TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- TASK 2.10 — customer_portal_tokens
-- Magic-link auth for customer portal.
-- Only the SHA-256 hash (64 hex chars) is stored — plain token sent to customer.
-- On verify: hash incoming token, look up WHERE used_at IS NULL AND expires_at > NOW().
-- On match: set used_at = NOW(), issue 7-day CUSTOMER JWT.
-- On new invite: stamp used_at on all existing unused tokens for same customer.
-- -----------------------------------------------------------------------------
CREATE TABLE customer_portal_tokens (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id      UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    token_hash       VARCHAR(64) NOT NULL,
    delivery_channel VARCHAR(10) NOT NULL CHECK (delivery_channel IN ('EMAIL', 'WHATSAPP')),
    expires_at       TIMESTAMPTZ NOT NULL,
    used_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- TASK 2.11 — digital_signatures
-- PRE_MEASUREMENT_DISCLAIMER: customer acknowledges provisional pricing (portal).
-- SLAB_LAYOUT_APPROVAL:       MANDATORY — blocks REVIEWING_LAYOUT → PRODUCTION.
-- FINAL_POST_INSTALLATION:    OPTIONAL  — captured on installer device post-job.
-- -----------------------------------------------------------------------------
CREATE TABLE digital_signatures (
    id                   UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id             UUID               NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    category             signature_category NOT NULL,
    signature_vector_data TEXT              NOT NULL,
    ip_address           VARCHAR(45),
    signed_at            TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX idx_orders_customer_id   ON orders(customer_id);
CREATE INDEX idx_orders_status        ON orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_deleted_at    ON orders(deleted_at);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX idx_logistics_order_id   ON logistics_assignments(order_id);
CREATE INDEX idx_calendar_event_date  ON calendar_events(event_date);
CREATE INDEX idx_calendar_assigned_to ON calendar_events(assigned_to_user_id);
CREATE INDEX idx_signatures_order_cat ON digital_signatures(order_id, category);
CREATE INDEX idx_portal_tokens_hash   ON customer_portal_tokens(token_hash);
CREATE INDEX idx_ledger_order_tier    ON financial_ledger(order_id, milestone_tier);
