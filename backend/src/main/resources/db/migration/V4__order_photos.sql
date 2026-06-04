CREATE TABLE order_photos (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    file_url   VARCHAR(500) NOT NULL,
    label      VARCHAR(200),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_photos_order ON order_photos(order_id);
