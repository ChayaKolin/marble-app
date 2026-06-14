-- -----------------------------------------------------------------------------
-- Revert V11: signature_category.QUOTATION_APPROVAL is removed. The system
-- has exactly two customer approval signatures — SLAB_LAYOUT_APPROVAL (before
-- production) and FINAL_POST_INSTALLATION (before completion/final payment).
-- Postgres cannot drop a single enum value, so the type is recreated.
-- -----------------------------------------------------------------------------
DELETE FROM digital_signatures WHERE category = 'QUOTATION_APPROVAL';

ALTER TABLE digital_signatures ALTER COLUMN category TYPE TEXT;

DROP TYPE signature_category;

CREATE TYPE signature_category AS ENUM (
    'PRE_MEASUREMENT_DISCLAIMER',
    'SLAB_LAYOUT_APPROVAL',
    'FINAL_POST_INSTALLATION'
);

ALTER TABLE digital_signatures
    ALTER COLUMN category TYPE signature_category USING category::signature_category;
