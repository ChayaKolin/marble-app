-- -----------------------------------------------------------------------------
-- TASK — digital_signatures.notes
-- Free-text notes captured alongside a signature (e.g. installer's completion
-- remarks on the FINAL_POST_INSTALLATION signature).
-- -----------------------------------------------------------------------------
ALTER TABLE digital_signatures ADD COLUMN notes TEXT;
