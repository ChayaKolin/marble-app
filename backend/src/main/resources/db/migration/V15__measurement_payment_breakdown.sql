-- Optional payment breakdown recorded at measurement time.
-- The customer may bring any amount — not necessarily 20%.
-- All three columns are nullable; the consultant fills them in when relevant.
ALTER TABLE orders
    ADD COLUMN measurement_payment_total         NUMERIC(12,2),
    ADD COLUMN measurement_payment_to_consultant NUMERIC(12,2),
    ADD COLUMN measurement_payment_to_measurer   NUMERIC(12,2);
