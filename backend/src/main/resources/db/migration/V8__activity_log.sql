-- Audit trail of significant order lifecycle events (created, status changes,
-- soft-deleted with optional reason, restored) — backs the Consultant's history view.
CREATE TABLE activity_log (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type          VARCHAR(30)  NOT NULL,
    entity_id            UUID         NOT NULL,
    action               VARCHAR(30)  NOT NULL,
    performed_by_user_id UUID         REFERENCES users(id),
    performed_by_name    VARCHAR(255) NOT NULL,
    customer_name        VARCHAR(255),
    description          TEXT,
    reason               TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_created_at ON activity_log (created_at DESC);
