-- The total order amount is unknown until after the on-site measurement,
-- so it must be possible to open an order without it.
ALTER TABLE orders ALTER COLUMN total_gross_amount DROP NOT NULL;
