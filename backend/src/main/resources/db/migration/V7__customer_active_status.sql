-- Lets the Consultant mark a customer inactive (hidden from new-order selection)
-- without soft-deleting them — independent of the deleted_at trash mechanism.
-- Written defensively (IF NOT EXISTS / backfill / SET NOT NULL) so it applies cleanly
-- whether or not the column was already added to the database by hand.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE customers SET is_active = TRUE WHERE is_active IS NULL;
ALTER TABLE customers ALTER COLUMN is_active SET NOT NULL;
