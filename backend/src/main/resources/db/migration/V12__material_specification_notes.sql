-- -----------------------------------------------------------------------------
-- Marble/stone material specifications: optional free-text notes
-- -----------------------------------------------------------------------------
ALTER TABLE material_specifications
    ADD COLUMN notes TEXT;
